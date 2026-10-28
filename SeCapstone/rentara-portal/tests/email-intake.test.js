import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve, join } from "node:path";
import { Store } from "../server/store.js";
import { Service } from "../server/service.js";
import { Integrations } from "../server/integrations.js";
import { bootstrap } from "../server/bootstrap.js";
import { utilityText, utilityEmail } from "./fixtures.js";
import { createApp } from "../server/index.js";

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "rentara-email-intake-"));
  const s = new Store(":memory:"), service = new Service(s);
  bootstrap(service, { adminPassword: "EmailTestOnly!2026", managerPassword: "EmailTestOnly!2026", tenantPassword: "EmailTestOnly!2026", demo: true, demoStart: "2026-01-01" });
  s.save("mappings", { ...s.get("mappings", "map-demo"), account: "MER-12345" });
  const integration = new Integrations(service, dir, { IMAP_HOST: "imap.example.test", IMAP_USER: "test@example.test", IMAP_PASSWORD: "not-a-real-password" });
  return { s, service, integration, manager: s.get("users", "usr-manager"), async close() {
    await integration.close(); s.close();
    assert.equal(dirname(resolve(dir)), resolve(tmpdir()));
    rmSync(dir, { recursive: true, force: true });
  } };
}

const summaryWithAttachment = summary => Buffer.from([
  "From: bills@example.test", "To: property@example.test", "Subject: Test bill summary",
  "MIME-Version: 1.0", 'Content-Type: multipart/mixed; boundary="email-test"', "",
  "--email-test", "Content-Type: text/plain", "", summary,
  "--email-test", "Content-Type: text/plain", 'Content-Disposition: attachment; filename="readme.txt"', "",
  "This is an unrelated attachment, not a utility bill.", "--email-test--", "",
].join("\r\n"));

test("oversized email is held once for review while a later valid bill continues and can be explicitly retried", async () => {
  const f = fixture();
  try {
    let repaired = false;
    f.integration.mailboxClient = async () => ({
      mailbox: { uidValidity: 1 }, async connect() {},
      async getMailboxLock() { return { release() {} }; }, async search() { return [1, 2]; },
      async fetchOne(uid) { const source = utilityEmail(); return { source, size: uid === 1 && !repaired ? 36 * 1024 * 1024 : source.length }; },
      async logout() {},
    });
    assert.deepEqual(await f.integration.syncMailbox(f.manager), { imported: 1, failed: 1 });
    const billCount = f.s.all("bills").length;
    assert.ok(billCount > 0);
    const held = f.s.all("intake_messages").find(m => m.status === "failed");
    const exception = f.s.all("exceptions").find(e => e.intakeMessageId === held.id);
    assert.equal(exception.state, "open");
    assert.equal(f.s.get("settings", "last-intake").status, "completed_with_errors");
    assert.deepEqual(await f.integration.syncMailbox(f.manager), { imported: 0 });
    assert.equal(f.s.all("exceptions").filter(e => e.intakeMessageId === held.id).length, 1);
    repaired = true;
    assert.deepEqual(await f.integration.syncMailbox(f.manager, { retryKey: held.id }), { imported: 1 });
    assert.equal(f.s.get("exceptions", exception.id).state, "revalidated");
    assert.equal(f.s.all("bills").length, billCount, "Repaired copy must still be held as a duplicate bill");
  } finally { await f.close(); }
});

test("held-email retry API rejects Tenants and another workspace's Manager, then reprocesses only the assigned message", async () => {
  const f = fixture();
  let app;
  try {
    let repaired = false;
    f.integration.mailboxClient = async () => ({
      mailbox: { uidValidity: 1 }, async connect() {}, async getMailboxLock() { return { release() {} }; },
      async search() { return [1]; }, async fetchOne() { const source = utilityEmail(); return { source, size: repaired ? source.length : 36 * 1024 * 1024 }; }, async logout() {},
    });
    await f.integration.syncMailbox(f.manager);
    const exception = f.s.all("exceptions").find(e => e.intakeMessageId);
    const admin = f.s.get("users", "usr-admin");
    const workspace = f.service.workspaceWrite(admin, { name: "Other owner" });
    f.service.userWrite(admin, { name: "Other Manager", email: "other-manager@example.test", role: "manager", workspaceId: workspace.id, password: "EmailTestOnly!2026" });
    const auth = email => f.service.login({ email, password: "EmailTestOnly!2026" }).token;
    const manager = auth("manager@propertypro.ph"), tenant = auth("maria.santos@gmail.com"), other = auth("other-manager@example.test");
    app = createApp({ store: f.s, dataDir: f.integration.dataDir, env: {}, integrations: f.integration });
    await new Promise(r => app.server.listen(0, "127.0.0.1", r));
    const request = token => fetch(`http://127.0.0.1:${app.server.address().port}/api/v1/exceptions/${exception.id}/retry-email`, { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: "{}" });
    const closeNotice = (token, reason) => fetch(`http://127.0.0.1:${app.server.address().port}/api/v1/exceptions/${exception.id}/close-email`, { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
    assert.equal((await closeNotice(tenant, "Handled elsewhere")).status, 403);
    assert.ok([403, 404].includes((await closeNotice(other, "Handled elsewhere")).status));
    assert.equal((await closeNotice(manager, "short")).status, 422);
    assert.equal((await request(tenant)).status, 403);
    assert.ok([403, 404].includes((await request(other)).status));
    repaired = true;
    const response = await request(manager);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).imported, 1);
    assert.equal(f.s.get("exceptions", exception.id).state, "revalidated");
    assert.equal((await request(manager)).status, 409, "Resolved holds cannot be repeatedly retried through the API");
    assert.equal((await closeNotice(manager, "Handled elsewhere")).status, 409);
    f.s.save("exceptions", { ...f.s.get("exceptions", exception.id), state: "open" });
    const count = f.s.all("bills").length;
    assert.equal((await closeNotice(manager, "Uploaded a supported replacement bill for separate review")).status, 200);
    assert.equal(f.s.get("exceptions", exception.id).state, "closed");
    assert.equal(f.s.get("exceptions", exception.id).resolvedBy, f.manager.id);
    assert.equal(f.s.all("bills").length, count, "Closing a notice does not create a charge or payment");
  } finally {
    if (app?.server.listening) await new Promise(r => app.server.close(r));
    await app?.integrations.close();
    await f.close();
  }
});

test("a non-bill attachment does not hide a supported email summary or manufacture a bill from ordinary email", async () => {
  const f = fixture();
  try {
    const [result] = await f.integration.ingestEmail(summaryWithAttachment(utilityText));
    assert.equal(result.document.intakeMethod, "email_body");
    assert.equal(result.document.ocrStatus, "validated", JSON.stringify(result.failures));
    const count = f.s.all("bills").length;
    assert.deepEqual(await f.integration.ingestEmail(summaryWithAttachment("Meralco newsletter: thank you for subscribing.")), []);
    assert.equal(f.s.all("bills").length, count);
    const [duplicate] = await f.integration.ingestEmail(utilityEmail());
    assert.ok(duplicate.failures.some(e => e.rule === "V04"));
    assert.equal(f.s.all("bills").length, count);
  } finally { await f.close(); }
});

test("mailbox sync uses UID validity, skips processed messages and preserves one charge across retries", async () => {
  const f = fixture();
  try {
    let fetches = 0, released = 0, loggedOut = 0;
    let validity = 11;
    f.integration.mailboxClient = async () => ({
      mailbox: { uidValidity: validity }, async connect() {},
      async getMailboxLock(name) { assert.equal(name, "INBOX"); return { release() { released++; } }; },
      async search(query, options) { assert.equal(options.uid, true); return [42]; },
      async fetchOne(uid, query, options) { assert.equal(uid, 42); assert.equal(options.uid, true); fetches++; const source = utilityEmail(); return { source, size: source.length }; },
      async logout() { loggedOut++; },
    });
    assert.deepEqual(await f.integration.syncMailbox(f.manager), { imported: 1 });
    const count = f.s.all("bills").length;
    assert.ok(count > 0);
    assert.deepEqual(await f.integration.syncMailbox(f.manager), { imported: 0 });
    assert.equal(fetches, 1);
    validity = 12;
    assert.deepEqual(await f.integration.syncMailbox(f.manager), { imported: 1 });
    assert.equal(f.s.all("bills").length, count);
    assert.equal(f.s.all("intake_messages").length, 2);
    assert.ok(f.s.all("exceptions").some(e => e.ruleId === "V04"));
    assert.equal(released, 3); assert.equal(loggedOut, 3);
    await assert.rejects(f.integration.syncMailbox({ role: "tenant" }), /permission|role|access|forbidden/i);
  } finally { await f.close(); }
});

test("mailbox network failure releases the sync lock and leaves the message eligible for retry", async () => {
  const f = fixture();
  try {
    let released = 0, loggedOut = 0;
    f.integration.mailboxClient = async () => ({
      mailbox: { uidValidity: 1 }, async connect() {},
      async getMailboxLock() { return { release() { released++; } }; },
      async search() { return [1]; }, async fetchOne() { throw new Error("Simulated network interruption"); },
      async logout() { loggedOut++; },
    });
    await assert.rejects(f.integration.syncMailbox(f.manager), /Simulated network/);
    assert.equal(f.integration.syncing, false);
    assert.equal(f.s.all("intake_messages").length, 0);
    assert.equal(released, 1); assert.equal(loggedOut, 1);
    f.integration.mailboxClient = async () => ({
      mailbox: { uidValidity: 1 }, async connect() {},
      async getMailboxLock() { return { release() {} }; }, async search() { return []; }, async logout() {},
    });
    assert.deepEqual(await f.integration.syncMailbox(f.manager), { imported: 0 });
  } finally { await f.close(); }
});
