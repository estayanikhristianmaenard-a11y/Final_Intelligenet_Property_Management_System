import test from "node:test";
import assert from "node:assert/strict";
import { Store } from "../server/store.js";
import { Service } from "../server/service.js";
import { Integrations } from "../server/integrations.js";
import { bootstrap } from "../server/bootstrap.js";
import { createApp } from "../server/index.js";
import { monthLabel, billTiming } from "../src/utils/format.js";
import { calendarEntries } from "../src/features/tenant/calendar-model.js";

test("calendar rent estimates preserve anniversary, lease cutoff and actual utility dates without inventing bills", () => {
  const tenant = {leaseStart:"2025-01-31",assignmentStart:"2025-01-31",leaseAnniversary:31};
  const february = calendarEntries([],tenant,2026,1,new Date("2026-01-15T00:00:00Z"));
  assert.equal(february[0].dueDate,"2026-02-28");
  assert.equal(february[0].estimated,true);
  assert.equal(february[0].totalDue,undefined);
  assert.equal(calendarEntries([],tenant,2026,2,new Date("2026-02-15T00:00:00Z"))[0].dueDate,"2026-03-31");
  assert.equal(calendarEntries([],{...tenant,leaseEnd:"2026-02-27"},2026,1,new Date("2026-01-15T00:00:00Z")).length,0);
  assert.equal(calendarEntries([],tenant,2026,1,new Date("2026-02-01T00:00:00Z")).length,0,"current-month bills are not invented");
  const bill = Object.freeze({id:"actual",dueDate:"2026-02-28",lines:[{category:"rent"}],totalDue:4000});
  const utility = Object.freeze({id:"water",dueDate:"2026-02-08",lines:[{category:"water"}],totalDue:220});
  const result = calendarEntries([bill,utility],tenant,2026,1,new Date("2026-01-15T00:00:00Z"));
  assert.equal(result.length,2);
  assert.ok(result.every(entry => !entry.estimated));
  assert.equal(bill.estimated,undefined);
});

test("bill urgency uses Philippine midnight and excludes settled or pending records", () => {
  const now = new Date("2026-10-14T16:00:00Z"); // October 15 in the Philippines.
  const rent = {dueDate:"2026-10-15",totalDue:100,lines:[{category:"rent"}],paymentStatus:"unpaid"};
  assert.equal(billTiming(rent,now),"Due today");
  assert.equal(billTiming({...rent,dueDate:"2026-10-14"},now),"Overdue");
  assert.equal(billTiming({...rent,dueDate:"2026-10-16"},now),"");
  assert.equal(billTiming({...rent,totalDue:0},now),"");
  for (const paymentStatus of ["paid","tenant_reported_paid"]) assert.equal(billTiming({...rent,paymentStatus},now),"");
  const utility = {...rent,lines:[{category:"water"}],utilityTrackingStatus:"self_reported_paid"};
  assert.equal(billTiming(utility,now),"");
  assert.equal(billTiming({...utility,utilityTrackingNeedsReview:true},now),"Due today");
  assert.equal(monthLabel("2026-10"),"October 2026");
});

test("system status distinguishes missing configuration, unverified setup and failed attempts", async t => {
  const store = new Store(":memory:"), service = new Service(store), env = {};
  const integrations = new Integrations(service,"unused-test-directory",env);
  t.after(async () => { await integrations.close(); store.close(); });
  bootstrap(service,{adminPassword:"HealthTests!2026",managerPassword:"HealthTests!2026",tenantPassword:"HealthTests!2026",demo:true});
  const states = async () => Object.fromEntries((await integrations.services()).map(item=>[item.id,item]));
  let result = await states();
  assert.equal(result["svc-db"].healthState,"available");
  for (const id of ["svc-mail","svc-rent-email","svc-push"]) assert.equal(result[id].healthState,"not_configured");
  Object.assign(env,{IMAP_HOST:"imap.example.test",IMAP_USER:"demo",IMAP_PASSWORD:"test-only",RENT_EMAIL_ENABLED:"true",SMTP_HOST:"smtp.example.test",SMTP_FROM:"demo@example.test",SMTP_USER:"demo",SMTP_PASSWORD:"test-only"});
  result = await states();
  assert.equal(result["svc-mail"].healthState,"unverified");
  assert.equal(result["svc-rent-email"].healthState,"unverified");
  store.save("settings",{id:"last-intake",status:"failed"});
  store.save("notifications",{id:"mail-attempt",tenantId:"tnt-001",eventKey:"health-test",timestamp:"2026-10-15T01:00:00Z",emailAttempts:1,emailDelivery:"failed"});
  result = await states();
  assert.equal(result["svc-mail"].healthState,"last_attempt_failed");
  assert.equal(result["svc-rent-email"].healthState,"last_attempt_failed");
  assert.equal(result["svc-rent-email"].status,"degraded");
  store.save("settings",{id:"last-intake",status:"completed"});
  store.save("notifications",{id:"mail-attempt",tenantId:"tnt-001",eventKey:"health-test",timestamp:"2026-10-15T01:00:00Z",emailAttempts:1,emailDelivery:"accepted"});
  result = await states();
  assert.equal(result["svc-mail"].healthState,"recorded_success");
  assert.equal(result["svc-rent-email"].healthState,"recorded_success");
});

test("Admin maintenance summary filters before limiting and preserves the full protected audit", async () => {
  const store = new Store(":memory:"), service = new Service(store);
  bootstrap(service,{adminPassword:"AuditTests!2026",managerPassword:"AuditTests!2026",tenantPassword:"AuditTests!2026",demo:true});
  const admin = service.login({email:"admin@propertypro.ph",password:"AuditTests!2026"});
  const tenant = service.login({email:"maria.santos@gmail.com",password:"AuditTests!2026"});
  store.save("audit",{id:"older-maintenance",action:"Health check completed",actor:"System Administrator",role:"admin",target:"services",at:"2025-01-01T00:00:00Z"});
  for (let i=0;i<10;i++) store.save("audit",{id:`new-billing-${i}`,action:"Personal utility tracking updated",actor:"Tenant",role:"tenant",target:`bill-${i}`,at:`2099-01-01T00:00:${String(i).padStart(2,"0")}Z`});
  const count = store.all("audit").length;
  const app = createApp({store,env:{}});
  await new Promise(resolve => app.server.listen(0,"127.0.0.1",resolve));
  const url = `http://127.0.0.1:${app.server.address().port}/api/v1/admin/audit`;
  try {
    const headers = {Authorization:`Bearer ${admin.token}`};
    const summary = await fetch(url+"?limit=6&scope=maintenance",{headers});
    assert.equal(summary.status,200);
    const entries = await summary.json();
    assert.ok(entries.some(entry => entry.id === "older-maintenance"));
    assert.ok(entries.every(entry => entry.action !== "Personal utility tracking updated"));
    const full = await fetch(url+"?limit=50",{headers});
    assert.ok((await full.json()).some(entry => entry.id === "new-billing-0"));
    assert.equal(store.all("audit").length,count);
    assert.equal((await fetch(url+"?scope=maintenance",{headers:{Authorization:`Bearer ${tenant.token}`}})).status,403);
  } finally { await app.close(); }
});
