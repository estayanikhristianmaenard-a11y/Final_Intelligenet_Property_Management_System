import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { setupGroupDemo } from '../server/group-demo-setup.js';
import { prepareWorkspaceDemo, workspaceDemoAccounts, workspaceDemoPassword } from '../tools/prepare-workspace-demo.mjs';
import { Store, DEFAULT_WORKSPACE } from '../server/store.js';
import { Service, passwordHash } from '../server/service.js';
import { createApp } from '../server/index.js';
import { submitProposal, decideProposal } from '../server/staff-workflow.js';

function fixture(){
  const dir=mkdtempSync(join(tmpdir(),'rentara-two-businesses-'));
  setupGroupDemo(dir,[{name:'First Tenant',email:'first@example.test',unit:'A'},{name:'Second Tenant',email:'second@example.test',unit:'A'},{name:'Third Tenant',email:'third@example.test',unit:'B'}]);
  return {dir,filename:join(dir,'propertypro.sqlite'),close(){rmSync(dir,{recursive:true,force:true})}};
}

test('additive workspace demo preserves original billing, source history and credentials, with a recoverable pre-change backup',async()=>{
  const f=fixture();let s;
  try{
    s=new Store(f.filename);
    const before=Object.fromEntries(['properties','units','tenants','mappings','incoming','bills','payments','receipts','notifications','intake_messages'].map(t=>[t,s.all(t)]));
    const users=s.allGlobal('users');s.close();s=null;
    const result=await prepareWorkspaceDemo(f.dir);
    assert.equal(result.reused,false);assert.ok(existsSync(result.backupFile));
    s=new Store(f.filename);
    for(const [t,rows] of Object.entries(before))assert.deepEqual(s.all(t),rows,t);
    for(const u of users)assert.deepEqual(s.getGlobal('users',u.id),u,'Original identities/passwords are unchanged');
    assert.equal(s.allGlobal('workspaces').length,2);
    s.withWorkspace(result.testWorkspaceId,()=>{
      assert.equal(s.all('units').length,2);assert.equal(s.all('tenants').length,3);
      assert.equal(s.all('users').filter(u=>u.role==='manager').length,1);
      assert.equal(s.all('users').filter(u=>u.role==='staff').length,1);
      for(const [source,shares] of [[result.sources.electricity,[225,225]],[result.sources.water,[180]]]) assert.deepEqual(s.all('bills').filter(b=>b.sourceId===source).map(b=>b.totalDue).sort((a,b)=>a-b),shares);
      assert.equal(s.get('incoming',result.sources.needsReview).ocrStatus,'failed');
      assert.ok(s.all('notifications').every(n=>n.emailDelivery==='skipped'&&n.delivery==='skipped'));
    });
    const manager=s.getGlobal('users',result.managerId);
    s.withGlobal(()=>s.save('users',{...manager,passwordHash:passwordHash('ChangedFixture!2026')}));
    const saved=s.allGlobal('bills');s.close();s=null;
    assert.equal((await prepareWorkspaceDemo(f.dir)).reused,true);
    s=new Store(f.filename);assert.deepEqual(s.allGlobal('bills'),saved);
    assert.equal(new Service(s).login({email:workspaceDemoAccounts.manager,password:'ChangedFixture!2026'}).user.id,result.managerId);
  }finally{s?.close();f.close()}
});

test('Staff investigates the staged case; only its Manager can authorize, atomically allocating the corrected source',async()=>{
  const f=fixture();let s;
  try{
    const result=await prepareWorkspaceDemo(f.dir);s=new Store(f.filename);const service=new Service(s);
    s.withWorkspace(result.testWorkspaceId,()=>{
      const staff=s.get('users',result.staffId),manager=s.get('users',result.managerId);
      const before=s.all('bills');
      const proposal=submitProposal(service,staff,result.sources.needsReview,{changes:{dueDate:'2026-12-20'},reason:'Synthetic original PDF shows 20 December 2026.'});
      assert.deepEqual(s.all('bills'),before);
      assert.throws(()=>decideProposal(service,staff,proposal.id,{decision:'approve'}));
      const decision=decideProposal(service,manager,proposal.id,{decision:'approve'});
      assert.equal(decision.proposal.state,'applied');
      assert.deepEqual(s.all('bills').filter(b=>b.sourceId===result.sources.needsReview).map(b=>b.totalDue),[300,300]);
      assert.throws(()=>decideProposal(service,manager,proposal.id,{decision:'approve'}));
    });
    assert.equal(s.all('correction_proposals').length,0,'The original workspace cannot see the proposal');
  }finally{s?.close();f.close()}
});

test('sample accounts isolate HTTP records, original PDFs and rent actions across both workspaces; second workspace never inherits live-demo sending',async()=>{
  const f=fixture();let app;
  try{
    const seed=await prepareWorkspaceDemo(f.dir);
    app=createApp({store:new Store(f.filename),dataDir:f.dir,env:{RENTARA_PROFILE:'demo',DEMO_LIVE_DELIVERY:'true',DEMO_LIVE_SINCE:new Date().toISOString(),RENT_EMAIL_ENABLED:'true',SMTP_HOST:'fixture',SMTP_USER:'fixture',SMTP_PASSWORD:'fixture',SMTP_FROM:'fixture@example.test'}});
    await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${app.server.address().port}/api/v1`;
    const login=email=>app.service.login({email,password:workspaceDemoPassword});
    const first=login('manager@propertypro.ph'),second=login(workspaceDemoAccounts.manager),staff=login(workspaceDemoAccounts.staff),tenant=login(workspaceDemoAccounts.tenants[0]),admin=login('admin@propertypro.ph');
    const request=async(auth,path,body)=>fetch(base+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+auth.token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
    const firstUnits=await (await request(first,'/units')).json(),secondUnits=await (await request(second,'/units')).json();
    assert.equal(firstUnits.length,2);assert.equal(secondUnits.length,2);assert.ok(secondUnits.every(u=>u.workspaceId===seed.testWorkspaceId));assert.ok(firstUnits.every(u=>u.workspaceId===DEFAULT_WORKSPACE));
    const source=seed.sources.electricity;
    assert.equal((await request(second,`/incoming/${source}/source`)).status,200);
    assert.ok([403,404].includes((await request(first,`/incoming/${source}/source`)).status));
    assert.ok([403,404].includes((await request(admin,`/incoming/${source}/source`)).status));
    const bills=await (await request(tenant,'/bills')).json();assert.ok(bills.length);assert.ok(bills.every(b=>b.tenantId===tenant.user.tenantId));
    const rent=bills.find(b=>b.lines.every(l=>l.category==='rent')&&b.paymentStatus==='unpaid');assert.ok(rent);
    const reported=await request(tenant,`/bills/${rent.id}/report-payment`,{method:'cash'});assert.equal(reported.status,200);const {payment}=await reported.json();
    assert.equal((await request(staff,`/payments/${payment.id}/confirm`,{})).status,403);
    assert.ok([403,404].includes((await request(first,`/payments/${payment.id}/confirm`,{})).status));
    assert.equal((await request(second,`/payments/${payment.id}/confirm`,{})).status,200);
    const runtime=app.integrations.forWorkspace(seed.testWorkspaceId);assert.equal(runtime.rentEmail.configured(),false);assert.equal((await runtime.pushConfig()).configured,false);assert.equal(runtime.env.IMAP_HOST,'');
  }finally{await app?.close();f.close()}
});

test('workspace fixture command refuses missing or other-profile databases without changing their bytes',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'rentara-refuse-seed-'));
  try{
    await assert.rejects(prepareWorkspaceDemo(dir),/Prepare Group 3/);
    const s=new Store(join(dir,'propertypro.sqlite'));s.close();const bytes=readFileSync(join(dir,'propertypro.sqlite'));
    await assert.rejects(prepareWorkspaceDemo(dir),/Only a prepared Group 3/);
    assert.deepEqual(readFileSync(join(dir,'propertypro.sqlite')),bytes);
  }finally{rmSync(dir,{recursive:true,force:true})}
});
