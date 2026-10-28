import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { Store, DEFAULT_WORKSPACE } from "../server/store.js";
import { Service } from "../server/service.js";
import { bootstrap } from "../server/bootstrap.js";
import { Integrations } from "../server/integrations.js";
import { createApp } from "../server/index.js";
import { startScheduler, automationStatus } from "../server/scheduler.js";
import { utilityEmail, utilityPdf, utilityText } from "./fixtures.js";

async function fixture({ persistent = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "rentara-auto-"));
  const s = new Store(persistent ? join(dir, "test.sqlite") : ":memory:"), service = new Service(s), password = "Automation!2026";
  bootstrap(service, { demo: true, demoStart: "2026-01-01", adminPassword: password, managerPassword: password, tenantPassword: password });
  s.save("mappings", { ...s.get("mappings", "map-demo"), account: "MER-12345" });
  const runtime = new Integrations(service, dir, { IMAP_HOST: "imap.example.test", IMAP_USER: "billing@example.test", IMAP_PASSWORD: "test-only-secret", IMAP_MAILBOX: "Bills" });
  let reads = 0;
  runtime.mailboxClient = async () => ({
    mailbox: { uidValidity: 1 }, async connect() {},
    async getMailboxLock(name) { assert.equal(name, "Bills"); return { release() {} }; },
    async search() { return [1]; }, async fetchOne() { reads++; const source = utilityEmail(); return { source, size: source.length }; }, async logout() {},
  });
  return { dir, s, service, runtime, password, reads: () => reads,
    async close() { await runtime.close(); s.close(); assert.equal(dirname(resolve(dir)), resolve(tmpdir())); rmSync(dir, { recursive: true, force: true }); } };
}

test("automatic startup retrieves MIME/PDF, validates, allocates and alerts without manual Sync; repeated cycles preserve one source charge", async () => {
  const f = await fixture(); let scheduler;
  try {
    const app = createApp({ store: f.s, integrations: f.runtime, dataDir: f.dir, env: {} });
    scheduler = app.startAutomation({ intervalMs: 1000 });
    assert.equal(app.startAutomation(), scheduler);
    await scheduler.firstRun;
    const doc = f.s.all("incoming")[0];
    assert.equal(doc.ocrStatus, "validated");
    const bills = f.s.all("bills").filter(b => b.sourceId === doc.id);
    assert.equal(bills.reduce((sum, b) => sum + Math.round(b.totalDue * 100), 0), 10000);
    assert.ok(f.s.all("notifications").some(n => bills.some(b => b.id === n.billId || b.id === n.emailBillId) || n.eventKey?.includes(doc.id)));
    assert.equal(f.reads(), 1);
    f.s.save("settings", { ...f.s.get("settings", "last-intake"), attemptedAt: 1 });
    const cycleAt = f.s.get("settings", "automation-cycle").completedAt;
    for (let i = 0; i < 50 && f.s.get("settings", "automation-cycle").completedAt === cycleAt; i++) await new Promise(r => setTimeout(r, 50));
    assert.notEqual(f.s.get("settings", "automation-cycle").completedAt, cycleAt, "periodic timer must run another cycle");
    await scheduler.stop();
    assert.equal(f.reads(), 1, "persisted UID prevents downloading the same email again");
    assert.deepEqual(f.s.all("bills").filter(b => b.sourceId === doc.id).map(b => b.id), bills.map(b => b.id));
    const status = automationStatus(f.runtime);
    assert.equal(status.mailboxConfigured, true);
    assert.equal(status.lastCycle.jobs.mailbox.state, "completed");
    assert.equal(JSON.stringify(status).includes("test-only-secret"), false);
  } finally { await scheduler?.stop(); await f.close(); }
});

test("rent, reminder and channel failures do not prevent independent mailbox or delivery jobs; state stays bounded and retries wait", async () => {
  const f = await fixture();
  try {
    f.service.generateRent = () => { throw new Error("private rent failure"); };
    f.service.reminders = () => { throw new Error("private reminder failure"); };
    f.runtime.rentEmail.deliver = async () => { throw new Error("test-only-secret"); };
    let pushRuns = 0;
    f.runtime.deliver = async () => { pushRuns++; return { configured: false }; };
    await f.runtime.tick();
    let cycle = f.s.get("settings", "automation-cycle");
    assert.equal(cycle.jobs.rentGeneration.state, "failed");
    assert.equal(cycle.jobs.reminders.state, "failed");
    assert.equal(cycle.jobs.mailbox.state, "completed");
    assert.equal(cycle.jobs.rentEmail.state, "failed");
    assert.equal(cycle.jobs.webPush.state, "disabled");
    assert.equal(pushRuns, 1);
    assert.ok(f.s.all("incoming").some(d => d.ocrStatus === "validated"));
    assert.equal(JSON.stringify(cycle).includes("test-only-secret"), false);
    f.runtime.mailboxClient = async () => { throw new Error("private connection failure"); };
    f.s.save("settings", { ...f.s.get("settings", "last-intake"), attemptedAt: 1 });
    await f.runtime.tick();
    assert.equal(f.s.get("settings", "automation-cycle").jobs.mailbox.state, "failed");
    await f.runtime.tick();
    cycle = f.s.get("settings", "automation-cycle");
    assert.equal(cycle.jobs.mailbox.state, "waiting");
    assert.equal(f.s.all("settings").filter(s => s.id === "automation-cycle").length, 1);
    assert.equal(pushRuns, 3);
  } finally { await f.close(); }
});

test("scheduler serializes slow work and stop waits for the active cycle", async () => {
  let release, runs = 0, stopped = false;
  const gate = new Promise(r => { release = r; });
  const scheduler = startScheduler({ async tick() { runs++; await gate; } }, { intervalMs: 5 });
  await new Promise(r => setTimeout(r, 25));
  assert.equal(runs, 1);
  const stop = scheduler.stop().then(() => { stopped = true; });
  await new Promise(r => setTimeout(r, 10)); assert.equal(stopped, false);
  release(); await stop;
  await new Promise(r => setTimeout(r, 15)); assert.equal(runs, 1);
});

test("automation status is read-only, workspace scoped and denied to Tenant/Admin", async () => {
  const f = await fixture(); const app = createApp({ store: f.s, integrations: f.runtime, dataDir: f.dir, env: {} });
  try {
    f.s.save("settings", { id: "automation-cycle", completedAt: "2026-10-23T00:00:00.000Z", jobs: {} });
    const other = f.service.workspaceWrite(f.s.get("users", "usr-admin"), { name: "Other business" });
    f.service.userWrite(f.s.get("users", "usr-admin"), { name: "Other Staff", email: "other-staff@example.test", password: f.password, role: "staff", workspaceId: other.id });
    f.service.userWrite(f.s.get("users", "usr-admin"), { name: "Default Staff", email: "staff-auto@example.test", password: f.password, role: "staff", workspaceId: DEFAULT_WORKSPACE });
    await new Promise(r => app.server.listen(0, "127.0.0.1", r));
    for (const [email, expected] of [["manager@propertypro.ph", 200], ["staff-auto@example.test", 200], ["other-staff@example.test", 200], ["maria.santos@gmail.com", 403], ["admin@propertypro.ph", 403]]) {
      const { token } = f.service.login({ email, password: f.password });
      const response = await fetch(`http://127.0.0.1:${app.server.address().port}/api/v1/automation/status`, { headers: { Authorization: "Bearer " + token } });
      assert.equal(response.status, expected);
      const status = await response.json();
      if (email === "other-staff@example.test") assert.equal(status.lastCycle, null);
      assert.equal(JSON.stringify(status).includes("test-only-secret"), false);
    }
    assert.equal(f.s.all("incoming").length, 0, "reading status must not run jobs");
  } finally { if (app.server.listening) await new Promise(r => app.server.close(r)); await f.close(); }
});


test("restart preserves automatic bills, alerts, confirmed rent receipts and mailbox replay protection while new mail still processes", async () => {
  const f = await fixture({ persistent:true });
  let app = createApp({store:f.s,integrations:f.runtime,dataDir:f.dir,env:{}});
  let firstClosed = false;
  try {
    await app.startAutomation({intervalMs:60_000}).firstRun;
    const source = f.s.all("incoming")[0];
    assert.equal(source.ocrStatus,"validated");
    const sourceBills = f.s.all("bills").filter(b=>b.sourceId === source.id);
    assert.equal(sourceBills.length,3);
    const tenant = f.s.get("users","usr-tenant");
    const manager = f.s.get("users","usr-manager");
    const ownBillIds = f.service.bills(tenant).filter(b=>b.sourceId === source.id).map(b=>b.id);
    assert.equal(ownBillIds.length,1);
    const other = f.service.userWrite(f.s.get("users","usr-admin"),{name:"Other test tenant",email:"restart-other@example.test",role:"tenant",tenantId:"tnt-002",password:f.password});
    assert.ok(f.service.bills(other).every(b=>b.tenantId === "tnt-002" && !ownBillIds.includes(b.id)));
    const rent = f.service.bills(tenant).find(b=>b.lines.every(l=>l.category === "rent") && b.paymentStatus === "unpaid" && b.totalDue > 0);
    assert.ok(rent,"A generated unpaid rent bill is required");
    const report = f.service.report(tenant,rent.id,{method:"cash"});
    const payment = f.service.confirm(manager,report.payment.id);
    assert.ok(payment.receiptNumber);
    const receipts = f.s.all("receipts");
    const alerts = f.s.all("notifications").filter(n=>sourceBills.some(b=>n.billId === b.id || n.emailBillId === b.id) || n.eventKey?.includes(source.id));
    assert.ok(alerts.length);
    const auth = f.service.login({email:tenant.email,password:f.password});
    const originalBytes = readFileSync(join(f.dir,"sources",source.sourceFileId));
    await app.close(); firstClosed = true;
    const reopened = new Store(join(f.dir,"test.sqlite"));
    const service = new Service(reopened);
    const runtime = new Integrations(service,f.dir,{IMAP_HOST:"imap.example.test",IMAP_USER:"billing@example.test",IMAP_PASSWORD:"test-only",IMAP_MAILBOX:"Bills"});
    app = createApp({store:reopened,integrations:runtime,dataDir:f.dir,env:{}});
    let fetched = [];
    const nextText = utilityText.replace("2026-02-01","2026-03-01").replace("2026-02-28","2026-03-31").replace("2026-03-05","2026-04-05");
    runtime.mailboxClient = async () => ({
      mailbox:{uidValidity:1},async connect(){},async getMailboxLock(){return {release(){}};},
      async search(){return [1,2];},async fetchOne(uid){fetched.push(uid);const source=uid===1?utilityEmail():utilityEmail(utilityPdf(nextText));return {source,size:source.length};},async logout(){}
    });
    assert.equal(service.authenticate(auth.token).tenantId,tenant.tenantId);
    assert.deepEqual(reopened.all("receipts"),receipts);
    assert.deepEqual(readFileSync(join(f.dir,"sources",source.sourceFileId)),originalBytes);
    for (const alert of alerts) assert.deepEqual(reopened.get("notifications",alert.id),alert);
    const recordCount = reopened.all("bills").length;
    // Make the mailbox eligible without waiting five minutes; billing rules stay unchanged.
    reopened.save("settings",{...reopened.get("settings","last-intake"),attemptedAt:1});
    await app.startAutomation({intervalMs:60_000}).firstRun;
    assert.deepEqual(fetched,[2],"Previously processed UID must not be downloaded after restart");
    assert.equal(reopened.all("bills").length,recordCount+3);
    assert.deepEqual(reopened.all("bills").filter(b=>b.sourceId === source.id).map(b=>b.id),sourceBills.map(b=>b.id));
    assert.deepEqual(reopened.all("receipts"),receipts);
    const next = reopened.all("incoming").find(d=>d.id !== source.id);
    assert.equal(next.ocrStatus,"validated");
    assert.equal(reopened.all("bills").filter(b=>b.sourceId === next.id).reduce((sum,b)=>sum+Math.round(b.totalDue*100),0),10000);
    const restoredTenant = service.authenticate(auth.token);
    assert.equal(service.bills(restoredTenant).find(b=>b.id === rent.id).paymentStatus,"paid");
    assert.equal(service.confirm(reopened.get("users",manager.id),payment.id).receiptNumber,payment.receiptNumber);
    assert.deepEqual(reopened.all("receipts"),receipts,"Confirmation retry must reuse the original receipt");
    await new Promise(resolve=>app.server.listen(0,"127.0.0.1",resolve));
    const response = await fetch(`http://127.0.0.1:${app.server.address().port}/api/v1/receipts/${encodeURIComponent(payment.receiptNumber)}`,{headers:{Authorization:`Bearer ${auth.token}`}});
    assert.equal(response.status,200);
    assert.match(response.headers.get("content-type"),/text\/html/);
    assert.ok((await response.text()).includes(payment.receiptNumber));
  } finally {
    if (!firstClosed) await app.close();
    else await app.close();
    assert.equal(dirname(resolve(f.dir)),resolve(tmpdir()));rmSync(f.dir,{recursive:true,force:true});
  }
});
