import assert from "node:assert/strict";
import { readFile, writeFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { simpleParser } from "mailparser";
import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import { setupAcceptance } from "../server/acceptance-setup.js";
import { Store } from "../server/store.js";
import { Service } from "../server/service.js";
import { Integrations } from "../server/integrations.js";
import { RentEmail } from "../server/rent-email.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const reportFile = join(root, "data/acceptance/email-verification.json");
const samples = join(root, "docs/samples/utility-bills");
let report;
try { report = JSON.parse(await readFile(reportFile, "utf8")); } catch (e) { if (e.code !== "ENOENT") throw e; report = {}; }
const save = async () => { await mkdir(dirname(reportFile), { recursive: true }); await writeFile(reportFile, JSON.stringify(report, null, 2) + "\n"); };
const dir = await mkdtemp(join(tmpdir(), "rentara-email-verification-"));
let s, integration;
try {
  await setupAcceptance({ dataDir: dir });
  s = new Store(join(dir, "propertypro.sqlite"));
  const service = new Service(s);
  integration = new Integrations(service, dir, {});
  const tenant = s.all("users").find(u => u.role === "tenant");
  const expected = JSON.parse(await readFile(join(samples, "synthetic/electricity-001/case.json"), "utf8")).expectedFields;
  const attachment = await readFile(join(samples, "synthetic/electricity-001/email-attachment.eml"));
  const [result] = await integration.ingestEmail(attachment);
  assert.equal(result.document.ocrStatus, "validated");
  for (const [key, value] of Object.entries(expected)) assert.equal(result.document[key], value, key);
  const bills = service.bills(tenant);
  const bill = bills.find(b => b.sourceId === result.document.id);
  assert.ok(bill); assert.equal(bill.totalDue, expected.amountDue);
  const alert = s.all("notifications").find(n => n.billId === bill.id);
  assert.equal(alert.tenantId, tenant.tenantId);
  assert.equal(alert.emailType, undefined, "Utility alerts must not enter rent email delivery");
  const count = s.all("bills").length;
  const [duplicate] = await integration.ingestEmail(await readFile(join(samples, "synthetic/electricity-001/email-summary.eml")));
  assert.ok(duplicate.failures.some(f => f.rule === "V04"));
  assert.equal(s.all("bills").length, count);
  report.local = { checkedAt: new Date().toISOString(), status: "passed", source: "synthetic/electricity-001", fieldsChecked: Object.keys(expected), tenantBillVisible: true, portalAlertCreated: true, utilityEmailExcluded: true, crossFormatDuplicateHeld: true, workingDatabasesUntouched: true };
  await save();
  console.log("PASS: real MIME/PDF extraction -> checked fields -> Tenant bill -> portal alert -> duplicate hold. Utility email excluded.");

  if (process.argv.includes("--send-rent-email")) {
    // This explicit mode sends exactly one labelled rent notice to the agreed
    // team inbox. Never inherit Tenant recipients from a working database.
    if (["started", "accepted", "inbox-found", "unknown"].includes(report.live?.status))
      throw new Error("A live submission already exists or has an uncertain outcome. Preserved the report; no repeat email sent.");
    if (process.env.SMTP_USER !== "rentara2026@gmail.com" || process.env.IMAP_USER !== "rentara2026@gmail.com")
      throw new Error("The self-test requires the agreed rentara2026@gmail.com SMTP and IMAP account.");
    for (const key of ["SMTP_HOST", "SMTP_PASSWORD", "SMTP_FROM", "IMAP_HOST", "IMAP_PASSWORD"])
      if (!process.env[key]) throw new Error(`Missing ${key}; no live email submitted.`);
    const bill = s.all("bills").find(b => service.isRent(b));
    const notification = service.notify(tenant.tenantId, "Local rent email acceptance test", "Synthetic test only", "billing", "live-self-test:" + Date.now(), {
      emailType: "rent-update", emailBillId: bill.id, emailRevision: bill.revision, emailDelivery: "pending",
    });
    const messageId = `<${notification.id}@propertypro.local>`;
    report.live = { attemptedAt: new Date().toISOString(), status: "started", recipient: "rentara2026@gmail.com", type: "rent-update", messageId, syntheticData: true, inboxVerified: false };
    await save();
    const smtp = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: Number(process.env.SMTP_PORT || 587) === 465, requireTLS: Number(process.env.SMTP_PORT || 587) !== 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000, disableFileAccess: true, disableUrlAccess: true });
    const transport = { sendMail(message) {
      assert.equal(message.to.address, "rentara2026@gmail.com");
      return smtp.sendMail({ ...message, subject: "[LOCAL ACCEPTANCE TEST] " + message.subject,
        text: "SYNTHETIC RENT TEST ONLY. No real payment is requested.\n\n" + message.text,
        html: '<p><strong>SYNTHETIC RENT TEST ONLY. No real payment is requested.</strong></p>' + message.html });
    }, close() { smtp.close(); } };
    const sender = new RentEmail(service, { ...process.env, RENT_EMAIL_ENABLED: "true" }, transport);
    try { await sender.deliver(); } finally { sender.close(); }
    const saved = s.get("notifications", notification.id);
    report.live.status = saved.emailDelivery;
    report.live.smtpAccepted = saved.emailDelivery === "accepted";
    await save();
    if (!report.live.smtpAccepted) throw new Error(`Rent self-test submission: ${saved.emailDelivery}. No delivery claimed.`);
    console.log("SMTP accepted one clearly labelled rent test for the agreed team inbox.");
    const client = new ImapFlow({ host: process.env.IMAP_HOST, port: Number(process.env.IMAP_PORT || 993), secure: true,
      auth: { user: process.env.IMAP_USER, pass: process.env.IMAP_PASSWORD }, logger: false, connectionTimeout: 15000, socketTimeout: 15000 });
    try {
      await client.connect();
      const lock = await client.getMailboxLock("INBOX");
      try {
        for (let attempt = 0; attempt < 3; attempt++) {
          const found = await client.search({ header: { "message-id": messageId } }, { uid: true });
          if (found.length) {
            const message = await client.fetchOne(found.at(-1), { source: { maxLength: 1024 * 1024 } }, { uid: true });
            const parsed = await simpleParser(message.source);
            assert.ok(parsed.subject.startsWith("[LOCAL ACCEPTANCE TEST]"));
            assert.ok(parsed.text.includes("SYNTHETIC RENT TEST ONLY"));
            report.live.status = "inbox-found"; report.live.inboxVerified = true;
            report.live.inboxCheckedAt = new Date().toISOString();
            break;
          }
          await new Promise(r => setTimeout(r, 2000));
        }
      } finally { lock.release(); }
    } catch {
      report.live.inboxCheck = "Not verified; SMTP acceptance is retained. Check the inbox manually.";
    } finally { await client.logout().catch(() => {}); await save(); }
    console.log(report.live.inboxVerified ? "PASS: the exact test message was found in INBOX. No other message contents were fetched." : "Inbox presence not verified; inspect Gmail manually. Do not repeat submission automatically.");
  }
  console.log("Report: data/acceptance/email-verification.json. Android trust, notification permission and device display still require a phone check.");
} finally {
  await integration?.close(); s?.close();
  assert.equal(dirname(resolve(dir)), resolve(tmpdir()));
  await rm(dir, { recursive: true, force: true });
}
