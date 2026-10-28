// Explicit live self-test. Never enables normal Tenant email delivery.
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { parseEnv } from "node:util";
import { randomUUID, createHash } from "node:crypto";
import { DatabaseSync, backup } from "node:sqlite";
import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const dir = join(root, "data/group-demo");
const file = join(dir, "live-gmail-test.json");
const mode = process.argv[2];
assert.ok(["--check", "--send", "--verify"].includes(mode), "Use --check, --send or --verify");
const env = parseEnv(await readFile(join(root, ".env"), "utf8"));
assert.equal(env.SMTP_HOST, "smtp.gmail.com", "Self-test permits only Gmail SMTP");
assert.equal(env.IMAP_HOST, "imap.gmail.com", "Self-test permits only Gmail IMAP");
assert.equal(env.SMTP_USER, "rentara2026@gmail.com");
assert.equal(env.IMAP_USER, "rentara2026@gmail.com");
assert.ok(env.SMTP_PASSWORD && env.IMAP_PASSWORD, "Configure the local Gmail app passwords first");
const mailbox = "Rentara-Group3-Demo";
let report;
try { report = JSON.parse(await readFile(file, "utf8")); }
catch (error) { if (error.code !== "ENOENT") throw error; report = {}; }
const save = async () => { await mkdir(dir, { recursive: true }); await writeFile(file, JSON.stringify(report, null, 2) + "\n"); };
const smtp = nodemailer.createTransport({ host: env.SMTP_HOST, port: 587, secure: false, requireTLS: true,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
  disableFileAccess: true, disableUrlAccess: true });
const client = new ImapFlow({ host: env.IMAP_HOST, port: 993, secure: true,
  auth: { user: env.IMAP_USER, pass: env.IMAP_PASSWORD }, logger: false, connectionTimeout: 15000, socketTimeout: 15000 });
let app;
try {
  if (mode === "--check") {
    await smtp.verify();
    await client.connect();
    if (!(await client.list({ reference: "", mailbox })).some(m => m.path === mailbox)) await client.mailboxCreate(mailbox);
    const lock = await client.getMailboxLock(mailbox, { readOnly: true }); lock.release();
    report.readiness = { checkedAt: new Date().toISOString(), smtpVerified: true, imapVerified: true, labelAccessible: true };
    await save();
    console.log("PASS: Gmail SMTP/IMAP authentication and dedicated label access. No email sent; no filter created.");
  } else if (mode === "--send") {
    assert.ok(!report.messageId, "A live submission is already recorded. Use --verify; do not send another automatically.");
    const attachment = await readFile(join(root, "../reports/demo-files/group-3/unit-a-meralco-scan.pdf"));
    const db = new DatabaseSync(join(dir, "propertypro.sqlite"), { readOnly: true });
    try {
      assert.ok(JSON.parse(db.prepare("SELECT data FROM settings WHERE id='group-demo' AND workspaceId='ws-default'").get()?.data || "{}").ready, "Group 3 must be prepared first");
      assert.ok(db.prepare("SELECT id FROM mappings WHERE json_extract(data,'$.account')='G3000101'").get(), "Unit A mapping must already exist");
      await mkdir(join(dir, "backups"), { recursive: true });
      const filename = "before-live-gmail-send-" + new Date().toISOString().replace(/[:.]/g, "-") + ".sqlite";
      await backup(db, join(dir, "backups", filename));
      report.beforeSendBackupFile = "backups/" + filename;
    } finally { db.close(); }
    await smtp.verify();
    report.messageId = `<rentara-live-${randomUUID()}@rentara.local>`;
    report.subject = `Group 3 Demo - Unit A - Live check ${new Date().toISOString()}`;
    report.attachmentSha256 = createHash("sha256").update(attachment).digest("hex");
    report.submittedAt = new Date().toISOString();
    report.status = "submission_started";
    report.recipient = "rentara2026@gmail.com";
    report.syntheticBill = true;
    await save(); // Persist before SMTP; an uncertain submission must not be resent.
    const result = await smtp.sendMail({ from: { name: "Rentara Demo Self-Test", address: "rentara2026@gmail.com" },
      to: "rentara2026@gmail.com", envelope: { from: "rentara2026@gmail.com", to: ["rentara2026@gmail.com"] },
      messageId: report.messageId, subject: report.subject,
      text: "SYNTHETIC GROUP 3 DEMO ONLY. This is not a provider email or a real payment request. Read the attached sample bill through the normal OCR and validation workflow.",
      attachments: [{ filename: "unit-a-meralco-scan.pdf", contentType: "application/pdf", content: attachment }] });
    assert.ok(result.accepted?.some(x => String(x).toLowerCase() === "rentara2026@gmail.com"), "SMTP did not confirm acceptance");
    report.status = "smtp_accepted"; await save();
    console.log("SMTP accepted one synthetic Unit A test addressed only to rentara2026@gmail.com. Inbox/filter still unverified.");
  } else {
    assert.ok(report.messageId, "Send the explicitly authorized self-test first");
    await client.connect();
    let found = [];
    for (let attempt = 0; attempt < 6; attempt++) {
      const lock = await client.getMailboxLock(mailbox, { readOnly: true });
      try { found = await client.search({ header: { "message-id": report.messageId } }, { uid: true }); }
      finally { lock.release(); }
      if (found.length) break;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    if (!found.length) {
      report.status = "awaiting_label_or_delivery"; report.labelVerified = false; await save();
      throw new Error("The exact message was not found under the demo label. No message was manually labelled and no bill was imported.");
    }
    report.labelVerified = true; report.labelCheckedAt = new Date().toISOString(); await save();
    await client.logout();
    const original = new DatabaseSync(join(dir, "propertypro.sqlite"), { readOnly: true });
    try {
      await mkdir(join(dir, "backups"), { recursive: true });
      const filename = "before-live-gmail-" + new Date().toISOString().replace(/[:.]/g, "-") + ".sqlite";
      await backup(original, join(dir, "backups", filename));
      report.backupFile = "backups/" + filename; await save();
    } finally { original.close(); }
    const store = new Store(join(dir, "propertypro.sqlite"));
    app = createApp({ store, dataDir: dir, env: { ...env, RENT_EMAIL_ENABLED: "false", IMAP_MAILBOX: mailbox,
      VAPID_PUBLIC_KEY: "", VAPID_PRIVATE_KEY: "", VAPID_SUBJECT: "", WORKSPACE_CONFIG_FILE: "" } });
    await app.startAutomation().firstRun;
    const docs = store.all("incoming").filter(d => d.accountRef === "G3000101" && d.periodStart === "2026-10-01" && d.periodEnd === "2026-10-22");
    const source = docs.find(d => d.ocrStatus === "validated" && d.messageId === report.messageId && d.documentHash === report.attachmentSha256);
    assert.ok(source, "The exact sent attachment/message must pass normal OCR and validation; inspect Exceptions if blocked");
    assert.equal(store.get("intake_messages", source.mailboxUid)?.status, "processed", "The exact email must have a completed intake record");
    const bills = store.all("bills").filter(b => b.sourceId === source.id);
    assert.equal(bills.length, 2); assert.ok(bills.every(b => b.totalDue === 450));
    for (const bill of bills) {
      assert.ok(store.all("notifications").some(n => n.billId === bill.id && n.tenantId === bill.tenantId));
      const tenant = store.all("users").find(u => u.role === "tenant" && u.tenantId === bill.tenantId);
      assert.ok(app.service.bills(tenant).some(b => b.id === bill.id));
    }
    const ids = bills.map(b => b.id);
    await app.integrations.syncMailbox(store.get("users", "usr-manager"));
    assert.deepEqual(store.all("bills").filter(b => b.sourceId === source.id).map(b => b.id), ids);
    Object.assign(report, { status: "passed", verifiedAt: new Date().toISOString(), sourceId: source.id,
      tenantBills: bills.length, shareAmount: 450, exactMessageVerified: true, attachmentHashVerified: true,
      extractionMethod: source.extractionMethod, scannedPages: source.scannedPages, portalAlertsVerified: true, duplicateChargePrevented: true,
      tenantEmailSendingEnabled: false, filterRuleAccess: "User saves the rule in Gmail; verification observes the exact message in the label without labelling it" });
    await save();
    console.log("PASS: exact live message in demo label -> automatic Gmail retrieval -> scan OCR -> valid Unit A bill -> two PHP 450 shares -> Tenant portal alerts. Repeat sync created no charge.");
  }
} catch (error) {
  report.lastFailure = { at: new Date().toISOString(), category: error.code || error.name };
  await save();
  console.error("Live check did not complete. Category:", error.code || error.name);
  if (error.code === "ERR_ASSERTION") console.error(error.message);
  console.error("No success is claimed for unverified steps. An existing submission will not be automatically repeated.");
  process.exitCode = 1;
} finally {
  smtp.close(); try { await client.logout(); } catch { client.close(); }
  await app?.close();
}
