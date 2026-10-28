import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { Store, DEFAULT_WORKSPACE } from "../server/store.js";
import { Service } from "../server/service.js";
import { bootstrap } from "../server/bootstrap.js";
import { Integrations } from "../server/integrations.js";
import { submitProposal, decideProposal, listProposals, addExceptionNote } from "../server/staff-workflow.js";
import { utilityText } from "./fixtures.js";
import { createApp } from "../server/index.js";

async function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "rentara-staff-"));
  const s = new Store(":memory:"), service = new Service(s);
  bootstrap(service, { demo: true, demoStart: "2026-01-01", adminPassword: "StaffTestOnly!2026", managerPassword: "StaffTestOnly!2026", tenantPassword: "StaffTestOnly!2026" });
  const admin = s.get("users", "usr-admin"), manager = s.get("users", "usr-manager");
  const staff = service.userWrite(admin, { name: "Operational Staff", email: "staff@example.test", role: "staff", workspaceId: DEFAULT_WORKSPACE, password: "StaffTestOnly!2026" });
  s.save("mappings", { ...s.get("mappings", "map-demo"), account: "MER-12345" });
  const integration = new Integrations(service, dir, {});
  const text = utilityText.replace("Due Date: 2026-03-05", "Due Date: unreadable");
  const result = await integration.ingest(Buffer.from(text), "review.txt", "text/plain", {}, async () => ({ text, confidence: 100 }));
  assert.equal(result.document.ocrStatus, "failed");
  return { s, service, admin, manager, staff, integration, dir, source: result.document,
    async close() { await integration.close(); s.close(); assert.equal(dirname(resolve(dir)), resolve(tmpdir())); rmSync(dir, { recursive: true, force: true }); } };
}
const propose = f => submitProposal(f.service, f.staff, f.source.id, { changes: { dueDate: "2026-03-05" }, reason: "Date checked against the source" });

test("Staff proposal leaves live values unchanged; Manager applies once with exact shares and attribution", async () => {
  const f = await fixture();
  try {
    const p = propose(f);
    assert.equal(f.s.get("incoming", f.source.id).dueDate, f.source.dueDate);
    assert.throws(() => propose(f), e => e.status === 409);
    const result = decideProposal(f.service, f.manager, p.id, { decision: "approve" });
    assert.equal(result.proposal.state, "applied");
    assert.equal(result.document.ocrStatus, "validated");
    const bills = f.s.all("bills").filter(b => b.sourceId === f.source.id);
    assert.equal(bills.reduce((sum, b) => sum + Math.round(b.totalDue * 100), 0), 10000);
    const correction = f.s.all("corrections").find(c => c.proposalId === p.id);
    assert.equal(correction.preparedBy, f.staff.id); assert.equal(correction.managerId, f.manager.id);
    assert.throws(() => decideProposal(f.service, f.manager, p.id, { decision: "approve" }), e => e.status === 409);
  } finally { await f.close(); }
});

test("invalid approval rolls back all source/billing changes and returns the proposal", async () => {
  const f = await fixture();
  try {
    const p = submitProposal(f.service, f.staff, f.source.id, { changes: { dueDate: "not-a-date", amountDue: 200 }, reason: "Intentional invalid test" });
    const before = f.s.all("bills").length;
    const result = decideProposal(f.service, f.manager, p.id, { decision: "approve" });
    assert.equal(result.proposal.state, "returned");
    assert.equal(f.s.get("incoming", f.source.id).amountDue, 100);
    assert.equal(f.s.get("incoming", f.source.id).dueDate, f.source.dueDate);
    assert.equal(f.s.all("bills").length, before);
    assert.equal(f.s.all("corrections").filter(c => c.proposalId === p.id).length, 0);
  } finally { await f.close(); }
});

test("changed source/context or disabled preparer makes a pending proposal stale; rejection retains reason", async () => {
  const f = await fixture();
  try {
    let p = propose(f);
    f.s.save("incoming", { ...f.source, revision: 2 });
    assert.equal(decideProposal(f.service, f.manager, p.id, { decision: "approve" }).proposal.state, "stale");
    p = propose(f);
    f.service.userWrite(f.admin, { status: "suspended" }, f.staff.id);
    assert.equal(decideProposal(f.service, f.manager, p.id, { decision: "approve" }).proposal.state, "stale");
    f.service.userWrite(f.admin, { status: "active" }, f.staff.id);
    p = propose(f);
    assert.equal(decideProposal(f.service, f.manager, p.id, { decision: "reject", reason: "Source still unclear" }).proposal.decisionReason, "Source still unclear");
  } finally { await f.close(); }
});

test("Staff descriptive edits work while billing creation, direct corrections and decisions stay forbidden", async () => {
  const f = await fixture();
  try {
    const tenant = f.s.all("tenants")[0];
    const account = f.s.all("users").find(u => u.tenantId === tenant.id);
    f.s.save("users", { ...account, email: "preserved-login@example.test" });
    const financialBefore = ["assignments", "leases", "credits"].map(table => f.s.all(table));
    const reconcile = f.service.reconcileAdvanceCredits;
    f.service.reconcileAdvanceCredits = () => { throw new Error("Staff must not reconcile financial records"); };
    assert.equal(f.service.writeEntity(f.staff, "tenants", { phone: "09000000000" }, tenant.id).phone, "09000000000");
    f.service.reconcileAdvanceCredits = reconcile;
    assert.equal(f.s.get("users", account.id).email, "preserved-login@example.test");
    assert.deepEqual(["assignments", "leases", "credits"].map(table => f.s.all(table)), financialBefore);
    for (const body of [{ leaseStart: "2025-01-01" }, { unitId: tenant.unitId }, { email: "changed@example.test" }])
      assert.throws(() => f.service.writeEntity(f.staff, "tenants", body, tenant.id), e => e.status === 403);
    assert.throws(() => f.service.writeEntity(f.staff, "tenants", { fullName: "New tenant" }), e => e.status === 403);
    assert.throws(() => f.service.correctException(f.staff, f.s.all("exceptions").find(e => e.sourceId === f.source.id).id, {}), e => e.status === 403);
    assert.throws(() => decideProposal(f.service, f.staff, propose(f).id, { decision: "approve" }), e => e.status === 403);
    const e = f.s.all("exceptions").find(e => e.sourceId === f.source.id);
    assert.equal(addExceptionNote(f.service, f.staff, e.id, { note: "Account needs Manager investigation", escalate: true }).responsibility, "manager");
    const other = f.service.workspaceWrite(f.admin, { name: "Another owner" });
    f.s.withWorkspace(other.id, () => {
      const otherStaff = { ...f.staff, workspaceId: other.id };
      assert.deepEqual(listProposals(f.service, otherStaff), []);
      assert.throws(() => submitProposal(f.service, otherStaff, f.source.id, { changes: { amountDue: 10 }, reason: "Cross workspace attempt" }), error => error.status === 404);
    });
  } finally { await f.close(); }
});

test("HTTP Staff permissions cover real login, operational reads, cross-role writes and proposal API", async () => {
  const f = await fixture(); let app;
  try {
    app = createApp({ store: f.s, env: {}, dataDir: f.dir, integrations: f.integration });
    await new Promise(r => app.server.listen(0, "127.0.0.1", r));
    const root = `http://127.0.0.1:${app.server.address().port}/api/v1`;
    const token = f.service.login({ email: f.staff.email, password: "StaffTestOnly!2026" }).token;
    const request = (path, body, method = body ? "POST" : "GET") => fetch(root + path, { method,
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
    for (const path of ["/units", "/tenants", "/bills", "/bills/incoming", "/payments", "/exceptions", "/correction-proposals"])
      assert.equal((await request(path)).status, 200, path);
    for (const [path, body] of [["/admin/users", {}], ["/rent/generate", {}], ["/incoming/" + f.source.id + "/correct", { field: "amountDue", value: 1, reason: "not permitted" }], ["/bills/missing/record-rent", {}]])
      assert.equal((await request(path, body)).status, 403, path);
    const response = await request(`/incoming/${f.source.id}/proposals`, { changes: { dueDate: "2026-03-05" }, reason: "Checked source date" });
    assert.equal(response.status, 200);
    const p = await response.json();
    assert.equal((await request(`/correction-proposals/${p.id}/decision`, { decision: "approve" })).status, 403);
  } finally { if (app?.server.listening) await new Promise(r => app.server.close(r)); await f.close(); }
});

test("existing databases acquire a scoped proposal table without losing records", async () => {
  const dir = mkdtempSync(join(tmpdir(), "rentara-staff-migrate-"));
  try {
    let s = new Store(join(dir, "test.sqlite"));
    s.save("settings", { id: "preserved", value: 123 }); s.db.exec("DROP TABLE correction_proposals"); s.close();
    s = new Store(join(dir, "test.sqlite"));
    assert.equal(s.get("settings", "preserved").value, 123);
    assert.ok(s.db.prepare("PRAGMA table_info(correction_proposals)").all().some(c => c.name === "workspaceId"));
    assert.equal(s.db.prepare("PRAGMA foreign_key_check").all().length, 0); s.close();
  } finally { assert.equal(dirname(resolve(dir)), resolve(tmpdir())); rmSync(dir, { recursive: true, force: true }); }
});
