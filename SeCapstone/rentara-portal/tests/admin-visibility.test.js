import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../server/store.js';
import { setupGroupDemo } from '../server/group-demo-setup.js';
import { prepareWorkspaceDemo,workspaceDemoPassword,workspaceDemoAccounts } from '../tools/prepare-workspace-demo.mjs';
import { createApp } from '../server/index.js';
import { billDetails } from '../src/features/billing/bill-details.js';
import { submitProposal,addExceptionNote } from '../server/staff-workflow.js';

async function fixture(){
  const dir=mkdtempSync(join(tmpdir(),'rentara-admin-read-'));
  setupGroupDemo(dir,[{name:'Tenant A One',email:'a1@example.test',unit:'A'},{name:'Tenant A Two',email:'a2@example.test',unit:'A'},{name:'Tenant A Three',email:'a3@example.test',unit:'B'}]);
  const seed=await prepareWorkspaceDemo(dir);
  const app=createApp({store:new Store(join(dir,'propertypro.sqlite')),dataDir:dir,env:{}});
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
  const root=`http://127.0.0.1:${app.server.address().port}`;
  const auth=email=>app.service.login({email,password:workspaceDemoPassword});
  const admin=auth('admin@propertypro.ph'),manager=auth('manager@propertypro.ph'),other=auth(workspaceDemoAccounts.manager),staff=auth(workspaceDemoAccounts.staff),tenant=auth(workspaceDemoAccounts.tenants[0]);
  const request=(who,path,method='GET',body)=>fetch(root+'/api/v1'+path,{method,headers:{Authorization:'Bearer '+who.token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  return {dir,app,seed,admin,manager,other,staff,tenant,request,async close(){await app.close();rmSync(dir,{recursive:true,force:true})}};
}

test('Admin reads selected workspaces, direct Tenant/bill links and system-held rent receipts without Manager impersonation',async()=>{
  const f=await fixture();
  try{
    const base='/admin/workspace-view',id=f.seed.testWorkspaceId;
    const overview=await (await f.request(f.admin,base+'?workspaceId='+id)).json();
    assert.equal(overview.workspace.id,id);assert.equal(overview.tenants.length,3);
    const detail=await (await f.request(f.admin,base+'/tenants/'+f.tenant.user.tenantId)).json();
    assert.equal(detail.workspace.id,id);assert.equal(detail.tenant.id,f.tenant.user.tenantId);assert.ok(detail.bills.length);
    const rent=detail.bills.find(b=>b.lines.every(l=>l.category==='rent')&&b.paymentStatus==='unpaid');
    const report=await (await f.request(f.tenant,`/bills/${rent.id}/report-payment`,'POST',{method:'cash'})).json();
    assert.equal((await f.request(f.other,`/payments/${report.payment.id}/confirm`,'POST',{})).status,200);
    const receiptId=f.app.store.withWorkspace(id,()=>f.app.store.get('bills',rent.id).receiptId);
    const receipt=await (await f.request(f.admin,base+'/receipts/'+receiptId+'?workspaceId='+id)).json();
    assert.equal(receipt.receipt.id,receiptId);
    const html=await f.request(f.admin,base+'/receipts/'+receiptId+'?workspaceId='+id+'&format=html');
    assert.equal(html.status,200);assert.match(await html.text(),/Rent payment receipt/);
    const events=f.app.store.allGlobal('audit').filter(e=>e.action?.startsWith('Admin '));
    assert.ok(events.length>=2);assert.ok(events.every(e=>e.userId===f.admin.user.id||e.actorId===f.admin.user.id));
  }finally{await f.close()}
});

test('Admin responses exclude originals, raw extraction, account references and nonallowlisted nested fields',async()=>{
  const f=await fixture();
  try{
    const id=f.seed.testWorkspaceId,canary='PRIVATE_SOURCE_CANARY';
    const utilityId=f.app.store.withWorkspace(id,()=>{
      const s=f.app.store,source=s.get('incoming',f.seed.sources.electricity);
      s.save('incoming',{...source,rawText:canary,accountRef:canary,sourceFileId:canary,filename:canary,privatePassword:canary});
      const bill=s.all('bills').find(b=>b.sourceId===source.id&&b.tenantId===f.tenant.user.tenantId);
      s.save('bills',{...bill,internalNotes:canary,lines:bill.lines.map(l=>({...l,privateToken:canary,allocations:(l.allocations??[]).map(a=>({...a,privatePath:canary}))})),utilityTrackingStatus:'self_reported_paid',utilityTrackingRevision:999});
      const t=s.get('tenants',f.tenant.user.tenantId);s.save('tenants',{...t,governmentId:canary,privatePath:canary});
      s.save('documents',{id:'doc-admin-read-fixture',tenantId:t.id,filename:canary,storageName:canary,type:'application/pdf',uploadedAt:'2026-11-01T00:00:00Z'});
      return bill.id;
    });
    for(const path of [`?workspaceId=${id}`,`/tenants/${f.tenant.user.tenantId}`,`/bills/${utilityId}`]){
      const r=await f.request(f.admin,'/admin/workspace-view'+path);assert.equal(r.status,200);
      const text=await r.text();assert.ok(!text.includes(canary));
      for(const key of ['rawText','sourceFileId','documentHash','passwordHash','privateToken','accountRef','governmentId','storageName'])assert.ok(!text.includes('"'+key+'"'),key);
    }
    const view=await (await f.request(f.admin,'/admin/workspace-view/bills/'+utilityId)).json();
    assert.equal(view.bill.utilityTrackingStatus,'self_reported_paid');
    assert.equal(view.bill.utilityTrackingNeedsReview,true);
    const markup=String(billDetails(view.bill,{observer:true}));
    assert.match(markup,/Review updated bill/);assert.match(markup,/Tenant-recorded, not verified/);
    assert.equal(view.source.file.type,'application/pdf');
  }finally{await f.close()}
});

test('Admin read capability never grants mutation, raw source/file/export access or permits other roles to select another workspace',async()=>{
  const f=await fixture();
  try{
    const id=f.seed.testWorkspaceId,tid=f.tenant.user.tenantId,source=f.seed.sources.electricity;
    const bill=f.app.store.withWorkspace(id,()=>f.app.store.all('bills').find(b=>b.sourceId===source));
    for(const [path,method,body] of [
      ['/tenants/'+tid,'PATCH',{phone:'changed'}],['/tenants','POST',{}],
      ['/bills/'+bill.id+'/utility-tracking','POST',{status:'self_reported_paid'}],
      ['/bills/'+bill.id+'/record-rent','POST',{}],['/payments/fake-payment/confirm','POST',{}],
      ['/incoming/'+source+'/correct','POST',{}],['/incoming/'+source+'/proposals','POST',{}],
      ['/correction-proposals/fake-proposal/decision','POST',{decision:'approve'}],
      ['/incoming/'+source+'/source','GET'],['/incoming/'+source,'GET'],
      ['/documents/fake-document','GET'],['/exports/tenants','GET'],
      ['/admin/workspace-view?workspaceId='+id,'POST',{}],
      ['/admin/workspace-view/bills/'+bill.id,'DELETE'],
    ])assert.ok([403,404,405].includes((await f.request(f.admin,path,method,body)).status),path);
    for(const who of [f.manager,f.staff,f.tenant])assert.equal((await f.request(who,'/admin/workspace-view?workspaceId='+id)).status,403);
    assert.equal((await f.request(f.admin,`/admin/workspace-view/tenants/${tid}?workspaceId=ws-default`)).status,404);
    assert.equal((await f.request(f.admin,'/admin/workspace-view?workspaceId=ws-default&unitId='+f.seed.units[0])).status,404);
    assert.equal((await f.request(f.admin,'/admin/workspace-view?workspaceId='+id+'&include=raw')).status,422);
    const ownResponse=await f.request(f.manager,'/tenants?workspaceId='+id);
    assert.ok([200,403].includes(ownResponse.status),'A forged selector must be ignored or refused');
    if(ownResponse.status===200){const own=await ownResponse.json();assert.ok(Array.isArray(own));assert.ok(own.length>0);assert.ok(own.every(t=>t.workspaceId==='ws-default'),'No foreign-workspace Tenant may be returned');}
    assert.equal((await f.request(f.admin,'/../data/group-demo/propertypro.sqlite')).status,404);
  }finally{await f.close()}
});

test('Admin is refused for a real pending rent payment while its owning Manager can confirm',async()=>{
  const f=await fixture();
  try{
    const bills=await (await f.request(f.tenant,'/bills')).json();
    const bill=bills.find(b=>b.lines.every(l=>l.category==='rent')&&b.paymentStatus==='unpaid');assert.ok(bill);
    const {payment}=await (await f.request(f.tenant,`/bills/${bill.id}/report-payment`,'POST',{method:'cash'})).json();
    assert.ok(payment.id);
    assert.equal((await f.request(f.admin,`/payments/${payment.id}/confirm`,'POST',{})).status,403);
    assert.equal(f.app.store.withWorkspace(f.seed.testWorkspaceId,()=>f.app.store.get('payments',payment.id).status),'tenant_reported_paid');
    assert.equal((await f.request(f.other,`/payments/${payment.id}/confirm`,'POST',{})).status,200);
  }finally{await f.close()}
});

test('failed Admin inspection audit writes return errors without Tenant, bill or receipt data',async()=>{
  const f=await fixture();
  try{
    const bills=await (await f.request(f.tenant,'/bills')).json();
    const bill=bills.find(b=>b.lines.every(l=>l.category==='rent')&&b.paymentStatus==='unpaid');
    const {payment}=await (await f.request(f.tenant,`/bills/${bill.id}/report-payment`,'POST',{method:'cash'})).json();
    const confirmation=await (await f.request(f.other,`/payments/${payment.id}/confirm`,'POST',{})).json();
    f.app.store.db.exec("CREATE TEMP TRIGGER fail_admin_read_audit BEFORE INSERT ON audit WHEN json_extract(NEW.data,'$.action') LIKE 'Admin %' BEGIN SELECT RAISE(ABORT,'TEST_AUDIT_WRITE_FAILURE'); END;");
    for(const path of [`tenants/${f.tenant.user.tenantId}`,`bills/${bill.id}`,`receipts/${confirmation.receiptNumber}`,`receipts/${confirmation.receiptNumber}?format=html`]){
      const response=await f.request(f.admin,'/admin/workspace-view/'+path);
      assert.equal(response.status,409,path);
      const payload=await response.json();assert.deepEqual(Object.keys(payload).sort(),['code','message']);
      const text=JSON.stringify(payload);
      for(const value of [f.tenant.user.name,f.tenant.user.email,bill.id,confirmation.receiptNumber])assert.ok(!text.includes(value));
    }
  }finally{f.app.store.db.exec('DROP TRIGGER IF EXISTS fail_admin_read_audit');await f.close()}
});

test('parallel owning-Manager confirmations return one original receipt and one financial effect',async()=>{
  const f=await fixture();
  try{
    f.app.service.userWrite(f.admin.user,{name:'Second Bayan Manager',email:'second-bayan-manager@example.test',role:'manager',workspaceId:f.seed.testWorkspaceId,password:workspaceDemoPassword});
    const second=f.app.service.login({email:'second-bayan-manager@example.test',password:workspaceDemoPassword});
    const bills=await (await f.request(f.tenant,'/bills')).json(),bill=bills.find(b=>b.lines.every(l=>l.category==='rent')&&b.paymentStatus==='unpaid');
    const {payment}=await (await f.request(f.tenant,`/bills/${bill.id}/report-payment`,'POST',{method:'cash'})).json();
    const responses=await Promise.all([f.other,second].map(who=>f.request(who,`/payments/${payment.id}/confirm`,'POST',{})));
    assert.deepEqual(responses.map(r=>r.status),[200,200]);
    const [a,b]=await Promise.all(responses.map(r=>r.json()));assert.ok(a.receiptNumber);assert.equal(a.receiptNumber,b.receiptNumber);
    f.app.store.withWorkspace(f.seed.testWorkspaceId,()=>{
      const receipts=f.app.store.all('receipts').filter(r=>r.paymentId===payment.id);assert.equal(receipts.length,1);
      assert.equal(Math.round(receipts[0].amount*100),Math.round(bill.totalDue*100));
      assert.equal(f.app.store.get('bills',bill.id).paymentStatus,'paid');
      assert.equal(f.app.store.all('audit').filter(e=>e.action==='Payment confirmed; receipt issued'&&e.target===payment.id).length,1);
    });
  }finally{await f.close()}
});

test('parallel proposal authorization applies once and retains exact shared centavo totals',async()=>{
  const f=await fixture();
  try{
    f.app.service.userWrite(f.admin.user,{name:'Second Bayan Manager',email:'second-bayan-manager@example.test',role:'manager',workspaceId:f.seed.testWorkspaceId,password:workspaceDemoPassword});
    const second=f.app.service.login({email:'second-bayan-manager@example.test',password:workspaceDemoPassword});
    const proposal=f.app.store.withWorkspace(f.seed.testWorkspaceId,()=>submitProposal(f.app.service,f.staff.user,f.seed.sources.needsReview,{changes:{dueDate:'2026-12-20'},reason:'Synthetic original shows 20 December.'}));
    const responses=await Promise.all([f.other,second].map(who=>f.request(who,`/correction-proposals/${proposal.id}/decision`,'POST',{decision:'approve'})));
    assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
    f.app.store.withWorkspace(f.seed.testWorkspaceId,()=>{
      assert.equal(f.app.store.get('correction_proposals',proposal.id).state,'applied');
      const bills=f.app.store.all('bills').filter(b=>b.sourceId===f.seed.sources.needsReview);
      assert.equal(bills.length,2);assert.equal(bills.reduce((n,b)=>n+Math.round(b.totalDue*100),0),60000);
      assert.equal(f.app.store.all('corrections').filter(c=>c.proposalId===proposal.id).length,1);
      assert.equal(f.app.store.all('audit').filter(e=>e.action==='Bill proposal applied'&&e.target===proposal.id).length,1);
    });
  }finally{await f.close()}
});

test('older Admin account and maintenance responses exclude stored secrets; audit targets omit private input text',async()=>{
  const f=await fixture();
  try{
    const canary='PRIVATE_ADMIN_RESPONSE_CANARY',s=f.app.store;
    s.withGlobal(()=>{
      const user=s.get('users',f.tenant.user.id);
      s.save('users',{...user,resetToken:canary,accessToken:canary,privateConfig:canary,preferences:{billing:true,reminder:false,payment:true,emailRent:true,privateToken:canary}});
    });
    Object.assign(f.app.integrations.forWorkspace('ws-default').env,{IMAP_HOST:'imap.example.test',IMAP_USER:'fixture@example.test',IMAP_PASSWORD:canary,SMTP_PASSWORD:canary,VAPID_PRIVATE_KEY:canary});
    s.withWorkspace(f.seed.testWorkspaceId,()=>{
      const source=s.get('incoming',f.seed.sources.needsReview);
      s.save('incoming',{...source,filename:canary,rawText:canary});
      const exception=s.all('exceptions').find(e=>e.sourceId===source.id&&e.state==='open');
      addExceptionNote(f.app.service,f.staff.user,exception.id,{note:canary});
      submitProposal(f.app.service,f.staff.user,source.id,{changes:{dueDate:'2026-12-20'},reason:canary});
    });
    for(const path of ['/admin/users','/admin/workspaces','/admin/services','/admin/audit?page=1&limit=100','/exports/audit']){
      const response=await f.request(f.admin,path);assert.equal(response.status,200,path);
      const text=await response.text();assert.ok(!text.includes(canary),path);
      assert.ok(!text.includes('"passwordHash"'),path);
    }
    for(const path of ['/admin/status','/admin/backup','/admin/ocr-restart','/admin/purge']){
      const response=await f.request(f.admin,path,'POST',{});assert.equal(response.status,200,path);assert.ok(!(await response.text()).includes(canary),path);
    }
    const receiptId=s.withWorkspace(f.seed.testWorkspaceId,()=>{
      const rent=f.app.service.bills(f.tenant.user).find(b=>b.lines.every(l=>l.category==='rent')&&b.paymentStatus==='unpaid');
      const report=f.app.service.report(f.tenant.user,rent.id,{method:'cash'}),payment=f.app.service.confirm(f.other.user,report.payment.id);
      s.save('receipts',{...s.get('receipts',payment.receiptNumber),privateToken:canary,rawText:canary});
      return payment.receiptNumber;
    });
    const rendered=await f.request(f.admin,'/admin/workspace-view/receipts/'+receiptId+'?format=html');
    assert.equal(rendered.status,200);assert.ok(!(await rendered.text()).includes(canary));
    const me=await (await f.request(f.tenant,'/auth/me')).json();assert.equal(me.preferences.reminder,false);assert.equal(me.preferences.privateToken,undefined);assert.equal(me.resetToken,undefined);
  }finally{await f.close()}
});
