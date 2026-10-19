import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { parseEnv } from "node:util";
import assert from "node:assert/strict";
import { ImapFlow } from "imapflow";
import { setupAcceptance } from "../server/acceptance-setup.js";
import { Store } from "../server/store.js";
import { Service } from "../server/service.js";
import { Integrations } from "../server/integrations.js";
import { acceptanceEnvironment, utilityMailbox } from "../server/acceptance-config.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const dataDir = join(root, "data/acceptance");
const settingsFile = join(dataDir, "utility-intake.json");
await mkdir(dataDir, { recursive: true });
if (process.argv.includes("--disable")) {
  await writeFile(settingsFile, JSON.stringify({ enabled: false, mailbox: utilityMailbox }, null, 2) + "\n");
  console.log("Utility retrieval disabled for the next acceptance startup. Restart the acceptance server.");
} else {
  const base = parseEnv(await readFile(join(root, ".env"), "utf8"));
  const env = acceptanceEnvironment({}, { enabled: true, mailbox: utilityMailbox }, base);
  await setupAcceptance();
  const client = new ImapFlow({ host: env.IMAP_HOST, port: Number(env.IMAP_PORT || 993), secure: true,
    auth: env.IMAP_ACCESS_TOKEN ? { user: env.IMAP_USER, accessToken: env.IMAP_ACCESS_TOKEN } : { user: env.IMAP_USER, pass: env.IMAP_PASSWORD },
    logger: false, connectionTimeout: 15000, socketTimeout: 30000 });
  let s, integration;
  const report = { checkedAt: new Date().toISOString(), mailbox: utilityMailbox, syntheticFixture: true, providerEmailVerified: false, rentEmailEnabled: false };
  try {
    await client.connect();
    const boxes = await client.list();
    if (!boxes.some(b => b.path === utilityMailbox)) await client.mailboxCreate(utilityMailbox);
    const lock = await client.getMailboxLock(utilityMailbox);
    try {
      const messageId = "<rentara-utility-acceptance-electricity-001@example.test>";
      const found = await client.search({ header: { "message-id": messageId } }, { uid: true });
      if (!found.length) {
        let raw = (await readFile(join(root, "docs/samples/utility-bills/synthetic/electricity-001/email-attachment.eml"))).toString("utf8");
        raw = raw.replace(/^Message-ID:.*$/im, `Message-ID: ${messageId}`)
          .replace(/^Subject:.*$/im, "Subject: [LOCAL ACCEPTANCE TEST] Synthetic utility bill - not a provider email");
        if (!/^Message-ID:/im.test(raw)) raw = `Message-ID: ${messageId}\r\n` + raw;
        await client.append(utilityMailbox, Buffer.from(raw), ["\\Seen"]);
        report.fixtureStored = true;
      } else report.fixtureStored = "already-present";
    } finally { lock.release(); }
    await client.logout();
    s = new Store(join(dataDir, "propertypro.sqlite"));
    const service = new Service(s);
    integration = new Integrations(service, dataDir, env);
    const manager = s.get("users", "usr-manager");
    s.save("settings", { ...s.get("settings", "billing"), id: "billing", intakeMailbox: "rentara2026@gmail.com" });
    const first = await integration.syncMailbox(manager);
    const incoming = s.all("incoming").find(d => d.accountRef === "TEST-MERALCO-001" && d.ocrStatus === "validated");
    assert.ok(incoming, "The Gmail fixture must validate through the real intake pipeline.");
    const tenant = s.all("users").find(u => u.role === "tenant" && u.email === "rentara2026@gmail.com");
    const bill = service.bills(tenant).find(b => b.sourceId === incoming.id);
    assert.equal(bill.totalDue, 100.01);
    assert.ok(s.all("notifications").some(n => n.billId === bill.id && n.tenantId === tenant.tenantId));
    const count = s.all("bills").length;
    const repeat = await integration.syncMailbox(manager);
    assert.equal(repeat.imported, 0);
    assert.equal(s.all("bills").length, count);
    Object.assign(report, { status: "passed", importedFirstPass: first.imported, importedRepeat: repeat.imported,
      tenantBillVisible: true, amountDue: bill.totalDue, portalAlertCreated: true, duplicateChargePrevented: true });
    await writeFile(settingsFile, JSON.stringify({ enabled: true, mailbox: utilityMailbox, verifiedAt: new Date().toISOString() }, null, 2) + "\n");
    console.log("PASS: dedicated Gmail label -> actual IMAP retrieval -> PDF extraction -> mapped Tenant bill -> portal alert. Repeat sync created no charge.");
    console.log(`Enabled scheduled retrieval from ${utilityMailbox} for acceptance startup. Rent email remains OFF. Restart acceptance to activate.`);
  } catch (error) {
    report.status = "failed";
    report.failureCategory = error.code || error.name;
    console.error("Failure category:", report.failureCategory);
    console.error("Utility intake setup did not complete. No provider-email success is claimed. Review credentials/connectivity and retry explicitly.");
    process.exitCode = 1;
  } finally {
    await client.logout().catch(() => {});
    await integration?.close(); s?.close();
    await writeFile(join(dataDir, "utility-intake-verification.json"), JSON.stringify(report, null, 2) + "\n");
  }
}
