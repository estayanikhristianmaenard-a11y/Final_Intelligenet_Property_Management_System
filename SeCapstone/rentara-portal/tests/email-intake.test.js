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
