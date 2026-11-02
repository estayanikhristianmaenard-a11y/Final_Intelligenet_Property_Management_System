import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store, DEFAULT_WORKSPACE } from '../server/store.js';
import { Service } from '../server/service.js';
import { bootstrap } from '../server/bootstrap.js';
import { Integrations } from '../server/integrations.js';
import { workspaceIntegrations } from '../server/workspace-integrations.js';
import { utilityText } from './fixtures.js';
import { operationalEnvironment } from '../tools/operational-profile.mjs';
import { deliveryAllowed, mailboxEnabled } from '../server/profile-policy.js';
import { philippineDate, addDays } from '../server/rules.js';
import { groupDemoDelivery, groupDemoRecipients } from '../server/group-demo-config.js';
import { recipientAllowed } from '../server/profile-policy.js';
import webpush from 'web-push';

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'rentara-profile-'));
  const s = new Store(':memory:'), service = new Service(s);
  bootstrap(service, {demo:true, demoStart:'2026-01-01', adminPassword:'Fixture!2026', managerPassword:'Fixture!2026', tenantPassword:'Fixture!2026'});
  s.save('mappings', {...s.get('mappings','map-demo'), account:'MER-12345'});
  const env = {IMAP_HOST:'imap.example.test', IMAP_USER:'team@example.test', IMAP_PASSWORD:'fixture-only', IMAP_MAILBOX:'Rentara-Group3-Demo'};
  const runtime = new Integrations(service, dir, env);
  const mail = (text) => Buffer.from('From: bills@example.test\r\nSubject: Bill\r\nContent-Type: text/plain\r\n\r\n'+text);
  const mock = (source, validity=1) => { runtime.mailboxClient = async()=>({mailbox:{uidValidity:validity}, async connect(){}, async getMailboxLock(){return {release(){}}}, async search(){return [1]}, async fetchOne(){return {source,size:source.length}}, async logout(){}}); };
  return {dir,s,service,env,runtime,mail,mock,manager:s.get('users','usr-manager'),async close(){await runtime.close();s.close();rmSync(dir,{recursive:true,force:true});}};
}

test('Demo send-point restriction overrides valid keys and workspace switches without consuming queued alerts', async()=>{
  const f=fixture();
  try {
    Object.assign(f.env,{RENTARA_PROFILE:'demo',RENT_EMAIL_ENABLED:'true',SMTP_HOST:'smtp.example.test',SMTP_USER:'fixture',SMTP_PASSWORD:'fixture',SMTP_FROM:'team@example.test',VAPID_PUBLIC_KEY:'invalid-if-reached',VAPID_PRIVATE_KEY:'invalid-if-reached',VAPID_SUBJECT:'mailto:team@example.test'});
    f.s.save('settings',{...f.s.get('settings','billing'),pushEnabled:true});
    const bill=f.s.all('bills').find(b=>b.lines.every(l=>l.category==='rent'));
    f.service.saveBill({...bill,revision:bill.revision+1,dueDate:addDays(philippineDate(),3),createdAt:addDays(philippineDate(),-1)+'T00:00:00Z'});
    const reminderTime=new Date(philippineDate()+'T09:00:00+08:00');
    f.service.reminders(philippineDate(),reminderTime);
    assert.ok(f.s.all('notifications').some(n=>n.emailType==='rent-reminder'),'An eligible forced rent reminder must be queued');
    const before=f.s.all('notifications');
    assert.ok(before.length,'Delivery checks need queued alerts');
    let sends=0; f.runtime.rentEmail.transport={async sendMail(){sends++;throw Error('Must not send')},close(){}};
    assert.equal(f.runtime.rentEmail.configured(),false);
    assert.equal((await f.runtime.rentEmail.deliver(reminderTime)).accepted,0);
    assert.equal((await f.runtime.deliver()).sent,0);
    assert.equal(sends,0); assert.deepEqual(f.s.all('notifications'),before);
  } finally {await f.close();}
});

test('shared settings supply connections only; fixed Operational defaults keep intake and rent sending off',()=>{
  const shared={SMTP_HOST:'shared.example.test',SMTP_PASSWORD:'shared-fixture',IMAP_HOST:'imap.example.test',IMAP_USER:'team@example.test',IMAP_PASSWORD:'fixture',RENT_EMAIL_ENABLED:'true',UTILITY_INTAKE_ENABLED:'true',DATA_DIR:'data/group-demo',PORT:'8444',IMAP_MAILBOX:'Rentara-Group3-Demo',TLS_KEY_FILE:'demo-key',WORKSPACE_CONFIG_FILE:'demo.json'};
  const env=operationalEnvironment({SMTP_HOST:'profile.example.test',SMTP_PASSWORD:''},{RENTARA_PROFILE:'demo'},process.cwd(),shared);
  assert.equal(env.SMTP_HOST,'profile.example.test');assert.equal(env.SMTP_PASSWORD,'shared-fixture');
  assert.equal(env.RENTARA_PROFILE,'operational'); assert.equal(env.PORT,'8081');
  assert.equal(env.IMAP_MAILBOX,'Rentara-Utilities');assert.equal(env.TLS_KEY_FILE,'');assert.equal(env.WORKSPACE_CONFIG_FILE,'');
  assert.equal(env.RENT_EMAIL_ENABLED,'false');assert.equal(mailboxEnabled(env),false);
  assert.equal(deliveryAllowed({}),true,'Legacy startup does not select Operational');
  assert.throws(()=>deliveryAllowed({RENTARA_PROFILE:'opertional'}),/Unknown runtime profile/);
  assert.throws(()=>operationalEnvironment({IMAP_MAILBOX:' Rentara-Group3-Demo '},{},process.cwd(),shared),/separate mailbox/);
  assert.equal(mailboxEnabled({...env,UTILITY_INTAKE_ENABLED:'true'}),true);
});

test('Demo mailbox stays off without explicit opt-in and refuses the Operational label',()=>{
  const env={RENTARA_PROFILE:'demo',IMAP_HOST:'imap.example.test',IMAP_USER:'team@example.test',IMAP_PASSWORD:'fixture',IMAP_MAILBOX:'Rentara-Group3-Demo'};
  assert.equal(mailboxEnabled(env),false);
  assert.equal(mailboxEnabled({...env,UTILITY_INTAKE_ENABLED:'true'}),true);
  assert.equal(mailboxEnabled({...env,UTILITY_INTAKE_ENABLED:'true',IMAP_MAILBOX:'Rentara-Utilities'}),false);
});

test('startup rejects same account and normalized label across enabled workspaces; other accounts may reuse label', async()=>{
  const f=fixture();let external;
  try {
    const other=f.service.workspaceWrite(f.s.get('users','usr-admin'),{name:'Other business'});
    const config=join(f.dir,'workspaces.json');
    writeFileSync(config,JSON.stringify({[other.id]:{...f.env,IMAP_USER:' TEAM@EXAMPLE.TEST ',IMAP_MAILBOX:' rentara-group3-demo '}}));
    assert.throws(()=>workspaceIntegrations(f.service,f.dir,{...f.env,WORKSPACE_CONFIG_FILE:config}),/mailbox.*collision/i);
    writeFileSync(config,JSON.stringify({[other.id]:{...f.env,IMAP_USER:'other@example.test'}}));
    external=workspaceIntegrations(f.service,f.dir,{...f.env,WORKSPACE_CONFIG_FILE:config});
    assert.equal(external.forWorkspace(DEFAULT_WORKSPACE).env.IMAP_MAILBOX,'Rentara-Group3-Demo');
    assert.equal(external.forWorkspace(other.id).env.IMAP_USER,'other@example.test');
  } finally {await external?.close();await f.close();}
});

test('label and UIDVALIDITY changes re-examine mail safely, preserve alerts and do not skip a different message with the same UID',async()=>{
  const f=fixture();
  try {
    f.mock(f.mail(utilityText)); await f.runtime.syncMailbox(f.manager);
    assert.equal(f.s.all('incoming')[0].ocrStatus,'validated');
    const bills=f.s.all('bills'),alerts=f.s.all('notifications');
    f.env.IMAP_MAILBOX='Renamed demo label';
    f.mock(f.mail(utilityText));await f.runtime.syncMailbox(f.manager);
    assert.equal(f.s.all('intake_messages').length,2,'Each folder identity is recorded');
    f.mock(f.mail(utilityText),2);await f.runtime.syncMailbox(f.manager);
    assert.deepEqual(f.s.all('bills'),bills); assert.deepEqual(f.s.all('notifications'),alerts);
    const next=utilityText.replace('2026-02-01','2026-03-01').replace('2026-02-28','2026-03-31').replace('2026-03-05','2026-04-05');
    f.env.IMAP_MAILBOX='Another label';f.mock(f.mail(next),2);await f.runtime.syncMailbox(f.manager);
    assert.equal(f.s.all('incoming').filter(d=>d.ocrStatus==='validated').length,2);
    assert.ok(f.s.all('bills').length>bills.length);
  } finally {await f.close();}
});

test('wrong-label routing depends on receiving workspace mapping, without cross-workspace lookup',async()=>{
  const f=fixture();
  try {
    const other=f.service.workspaceWrite(f.s.get('users','usr-admin'),{name:'Wrong destination'});
    await f.s.withWorkspace(other.id,async()=>{
      f.mock(f.mail(utilityText));await f.runtime.syncMailbox({...f.manager,workspaceId:other.id});
      assert.equal(f.s.all('bills').length,0);
      assert.equal(f.s.all('incoming')[0].ocrStatus,'failed');
    });
    f.mock(f.mail(utilityText)); await f.runtime.syncMailbox(f.manager);
    assert.equal(f.s.all('incoming')[0].ocrStatus,'validated');
    assert.ok(f.s.all('bills').some(b=>b.sourceId===f.s.all('incoming')[0].id));
  } finally {await f.close();}
});

test('legacy processed history is preserved, rechecked once and billing dedup blocks changed-envelope copies',async()=>{
  const f=fixture();
  try {
    const raw=f.mail(utilityText);
    await f.runtime.ingestEmail(raw,{mailboxUid:'imap.example.test:team@example.test:1:1'});
    const legacy={id:'imap.example.test:team@example.test:1:1',status:'processed',processedAt:'2026-01-01T00:00:00Z'};
    f.s.save('intake_messages',legacy);
    const storedLegacy=f.s.get('intake_messages',legacy.id);
    const bills=f.s.all('bills'),alerts=f.s.all('notifications');
    f.mock(raw);await f.runtime.syncMailbox(f.manager);
    assert.deepEqual(f.s.get('intake_messages',legacy.id),storedLegacy);
    assert.equal((await f.runtime.syncMailbox(f.manager)).imported,0);
    assert.deepEqual(f.s.all('bills'),bills);assert.deepEqual(f.s.all('notifications'),alerts);
    f.env.IMAP_MAILBOX='Changed label';f.mock(Buffer.concat([Buffer.from('X-Demo: changed-envelope\r\n'),raw]),2);
    await f.runtime.syncMailbox(f.manager);
    assert.deepEqual(f.s.all('bills'),bills);assert.deepEqual(f.s.all('notifications'),alerts);
    assert.ok(f.s.all('exceptions').some(e=>e.ruleId==='V04'));
  } finally {await f.close();}
});

test('Demo restriction survives workspace-level delivery overrides and a later enabled Push preference',async()=>{
  const f=fixture();let external;
  try {
    const other=f.service.workspaceWrite(f.s.get('users','usr-admin'),{name:'Demo business B'});
    const config=join(f.dir,'overrides.json');
    writeFileSync(config,JSON.stringify({[other.id]:{RENT_EMAIL_ENABLED:'true',SMTP_HOST:'smtp.example.test',SMTP_USER:'fixture',SMTP_PASSWORD:'fixture',SMTP_FROM:'team@example.test',VAPID_PUBLIC_KEY:'invalid-if-reached',VAPID_PRIVATE_KEY:'invalid-if-reached',VAPID_SUBJECT:'mailto:team@example.test'}}));
    external=workspaceIntegrations(f.service,f.dir,{RENTARA_PROFILE:'demo',WORKSPACE_CONFIG_FILE:config});
    await f.s.withWorkspace(other.id,async()=>{
      const runtime=external.forWorkspace(other.id);
      f.s.save('settings',{...f.s.get('settings','billing'),id:'billing',pushEnabled:true});
      assert.equal(runtime.env.RENT_EMAIL_ENABLED,'false');
      assert.equal(runtime.rentEmail.configured(),false);
      assert.equal((await runtime.rentEmail.deliver()).accepted,0);
      assert.equal((await runtime.deliver()).sent,0);
    });
  } finally {await external?.close();await f.close();}
});

test('legacy held-email retry resolves its original exception and records the folder identity for later syncs',async()=>{
  const f=fixture();
  try {
    const id='imap.example.test:team@example.test:1:1';
    f.s.save('intake_messages',{id,status:'failed'});
    f.s.save('exceptions',{id:'exc-legacy-fixture',intakeMessageId:id,state:'open'});
    f.mock(f.mail(utilityText));await f.runtime.syncMailbox(f.manager,{retryKey:id});
    assert.equal(f.s.get('exceptions','exc-legacy-fixture').state,'revalidated');
    assert.equal(f.s.get('intake_messages',id).status,'processed');
    assert.equal((await f.runtime.syncMailbox(f.manager)).imported,0);
  } finally {await f.close();}
});

test('live demo requires an explicit flag, valid sending setup and keeps receiving independent',()=>{
  const base={SMTP_HOST:'smtp.example.test',SMTP_USER:'fixture',SMTP_PASSWORD:'fixture',SMTP_FROM:'team@example.test',VAPID_PRIVATE_KEY:'fixture'};
  const off=groupDemoDelivery(['--receive'],base);
  assert.equal(off.DEMO_LIVE_DELIVERY,'false');assert.equal(off.SMTP_PASSWORD,'');assert.equal(off.VAPID_PRIVATE_KEY,'');
  assert.throws(()=>groupDemoDelivery(['--live-delivery'],{}),/needs SMTP/);
  assert.throws(()=>groupDemoDelivery(['--live-delivry'],base),/Unknown demo option/);
  const live={RENTARA_PROFILE:'demo',...groupDemoDelivery(['--receive','--live-delivery'],base,new Date('2026-11-01T00:00:00Z'))};
  const user={email:groupDemoRecipients[0]};const n={timestamp:'2026-11-01T00:00:01Z'};
  assert.equal(recipientAllowed(live,user,n),true);
  assert.equal(recipientAllowed(live,{email:'unapproved@example.test'},n),false);
  assert.equal(recipientAllowed(live,user,{timestamp:'2026-10-31T00:00:00Z'}),false);
  assert.equal(recipientAllowed(live,user,n,{createdAt:'2026-10-31T00:00:00Z'}),false);
  assert.equal(recipientAllowed(live,user,n,{createdAt:n.timestamp}),true);
  assert.equal(recipientAllowed({...live,DEMO_LIVE_DELIVERY:'false'},user,n),false);
});

test('live demo rent email sends only fresh approved-user events once; old and unapproved queues remain unchanged',async()=>{
  const f=fixture();
  try {
    const cutoff=new Date(Date.now()+1000).toISOString();
    Object.assign(f.env,{RENTARA_PROFILE:'demo',...groupDemoDelivery(['--live-delivery'],{SMTP_HOST:'smtp.example.test',SMTP_USER:'fixture',SMTP_PASSWORD:'fixture',SMTP_FROM:'team@example.test'},new Date(cutoff))});
    const user=f.s.get('users','usr-tenant');f.s.save('users',{...user,email:groupDemoRecipients[0]});
    const source=f.s.all('notifications').find(n=>n.tenantId===user.tenantId&&n.emailType==='rent-update');
    const fresh={...source,id:'live-fresh',eventKey:'live-fresh',timestamp:cutoff};f.s.save('notifications',fresh);
    const before=f.s.all('notifications').filter(n=>n.id!==fresh.id);const messages=[];
    f.runtime.rentEmail.transport={async sendMail(message){messages.push(message);return {accepted:[message.to.address]}},close(){}};
    await f.runtime.rentEmail.deliver();await f.runtime.rentEmail.deliver();
    assert.equal(messages.length,1);assert.equal(messages[0].to.address,groupDemoRecipients[0]);
    assert.match(messages[0].subject,/^\[DEMO\]/);
    assert.deepEqual(f.s.all('notifications').filter(n=>n.id!==fresh.id),before);
    f.s.save('users',{...f.s.get('users',user.id),email:'unapproved@example.test'});
    f.s.save('notifications',{...source,id:'live-unapproved',eventKey:'live-unapproved',timestamp:cutoff});
    const blocked=f.s.get('notifications','live-unapproved');
    await f.runtime.rentEmail.deliver();assert.equal(messages.length,1);
    assert.deepEqual(f.s.get('notifications',blocked.id),blocked);
  } finally {await f.close();}
});

test('live demo Push targets only approved-user phones registered during this run, honors preferences and deduplicates',async()=>{
  const f=fixture();const original=webpush.sendNotification;
  try {
    const cutoff=new Date(Date.now()+1000).toISOString();const keys=webpush.generateVAPIDKeys();
    Object.assign(f.env,{RENTARA_PROFILE:'demo',...groupDemoDelivery(['--live-delivery'],{SMTP_HOST:'smtp.example.test',SMTP_USER:'fixture',SMTP_PASSWORD:'fixture',SMTP_FROM:'team@example.test',VAPID_PUBLIC_KEY:keys.publicKey,VAPID_PRIVATE_KEY:keys.privateKey,VAPID_SUBJECT:'mailto:team@example.test'},new Date(cutoff))});
    f.s.save('settings',{...f.s.get('settings','billing'),pushEnabled:true});
    const user=f.s.get('users','usr-tenant');f.s.save('users',{...user,email:groupDemoRecipients[0]});
    const source=f.s.all('notifications').find(n=>n.tenantId===user.tenantId);
    f.s.save('notifications',{...source,id:'push-live',eventKey:'push-live',timestamp:cutoff,delivery:'pending',attempts:0});
    f.s.save('subscriptions',{id:'old-phone',userId:user.id,createdAt:'2020-01-01T00:00:00Z',subscription:{endpoint:'https://fcm.googleapis.com/old-fixture'}});
    f.s.save('subscriptions',{id:'test-phone',userId:user.id,createdAt:cutoff,subscription:{endpoint:'https://fcm.googleapis.com/test-fixture'}});
    const endpoints=[];webpush.sendNotification=async(sub,payload)=>{assert.match(JSON.parse(payload).title,/^\[DEMO\]/);endpoints.push(sub.endpoint);return {statusCode:201}};
    assert.equal((await f.runtime.deliver()).sent,1);assert.equal((await f.runtime.deliver()).sent,0);
    assert.deepEqual(endpoints,['https://fcm.googleapis.com/test-fixture']);
    f.s.save('users',{...f.s.get('users',user.id),email:'unapproved@example.test'});
    f.s.save('notifications',{...source,id:'push-unapproved',eventKey:'push-unapproved',timestamp:cutoff,delivery:'pending',attempts:0});
    assert.equal((await f.runtime.deliver()).sent,0);assert.equal(endpoints.length,1);
    f.s.save('users',{...f.s.get('users',user.id),email:groupDemoRecipients[0],preferences:{billing:false}});
    assert.equal((await f.runtime.deliver()).sent,0);assert.equal(endpoints.length,1);
  } finally {webpush.sendNotification=original;await f.close();}
});
