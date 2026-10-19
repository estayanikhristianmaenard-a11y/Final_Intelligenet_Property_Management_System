import test from "node:test";
import assert from "node:assert/strict";
import {Store,DEFAULT_WORKSPACE} from "../server/store.js";
import {Service} from "../server/service.js";
import {Integrations} from "../server/integrations.js";
import {workspaceIntegrations} from "../server/workspace-integrations.js";
import {bootstrap} from "../server/bootstrap.js";
import {createApp} from "../server/index.js";

function setup(t, closeStore=true) {
  const store=new Store(":memory:"), service=new Service(store);
  bootstrap(service,{adminPassword:"StatusTests!2026",managerPassword:"StatusTests!2026",tenantPassword:"StatusTests!2026",demo:true});
  const env={RENT_EMAIL_ENABLED:"true",SMTP_HOST:"smtp.example.test",SMTP_USER:"demo",SMTP_FROM:"demo@example.test",SMTP_PASSWORD:"private-status-secret"};
  const runtime=new Integrations(service,"unused-test-directory",env);
  t.after(async()=>{await runtime.close();if(closeStore)store.close();});
  return {store,service,runtime,env};
}

test("status uses actual attempt dates, retains historical acceptance and never sends or processes",async t=>{
  const {store,runtime}=setup(t);
  for (const key of ["syncMailbox","deliver","extract"]) runtime[key]=()=>assert.fail("Status must not perform external work");
  runtime.rentEmail.deliver=()=>assert.fail("Status must not send mail");
  store.save("notifications",{id:"older-created",tenantId:"tnt-001",eventKey:"status-old",timestamp:"2026-01-01",emailAttempts:2,emailDelivery:"failed",emailLastAttempt:"2026-10-16T02:00:00Z",emailAcceptedAt:"2026-10-14T02:00:00Z"});
  store.save("notifications",{id:"newer-created",tenantId:"tnt-001",eventKey:"status-new",timestamp:"2026-10-15",emailAttempts:1,emailDelivery:"accepted",emailLastAttempt:"2026-10-15T02:00:00Z",emailAcceptedAt:"2026-10-15T02:00:00Z"});
  const before=store.all("notifications");
  const rows=await runtime.services(), email=rows.find(r=>r.id==="svc-rent-email");
  assert.equal(email.state,"last_attempt_failed");
  assert.equal(email.lastAttemptAt,"2026-10-16T02:00:00.000Z");
  assert.equal(email.lastSuccessAt,"2026-10-15T02:00:00.000Z");
  assert.deepEqual(store.all("notifications"),before);
  assert.ok(rows.every(r=>r.method&&r.limitation&&r.nextStep&&r.checkedAt));
  assert.ok(!JSON.stringify(rows).includes("private-status-secret"));
  assert.equal(rows.find(r=>r.id==="svc-ocr").state,"available");
});

test("one failed probe or workspace does not hide independent results",async t=>{
  const {store,service,runtime}=setup(t);
  runtime.pushConfig=()=>{throw new Error("private-status-secret");};
  let rows=await runtime.services();
  assert.equal(rows.find(r=>r.id==="svc-push").state,"unavailable");
  assert.equal(rows.find(r=>r.id==="svc-db").state,"available");
  assert.ok(!JSON.stringify(rows).includes("private-status-secret"));
  store.withGlobal(()=>store.save("workspaces",{id:"second",name:"Second workspace",status:"active"}));
  const proxy=workspaceIntegrations(service,"unused-test-directory",{},runtime);
  runtime.services=()=>{throw new Error("private-status-secret");};
  rows=await proxy.services();
  assert.equal(rows.find(r=>r.workspaceId===DEFAULT_WORKSPACE).state,"unavailable");
  assert.ok(rows.some(r=>r.workspaceId==="second"&&r.state==="available"));
  await proxy.close();
});

test("status refresh is Admin-only, audited and retains the legacy route",async t=>{
  const {store,service}=setup(t,false);
  const app=createApp({store,env:{}});
  await new Promise(resolve=>app.server.listen(0,"127.0.0.1",resolve));
  const base=`http://127.0.0.1:${app.server.address().port}/api/v1`;
  const request=(path,token)=>fetch(base+path,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:"{}"});
  try {
    const admin=service.login({email:"admin@propertypro.ph",password:"StatusTests!2026"});
    const tenant=service.login({email:"maria.santos@gmail.com",password:"StatusTests!2026"});
    assert.equal((await request("/admin/status",tenant.token)).status,403);
    assert.equal((await request("/admin/status",admin.token)).status,200);
    assert.equal((await request("/admin/health",admin.token)).status,200);
    assert.equal(store.allGlobal("audit").filter(r=>r.action==="System status refreshed").length,2);
  } finally {await app.close();}
});
