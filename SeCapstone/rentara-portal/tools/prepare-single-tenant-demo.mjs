import { mkdir, readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { createCanvas } from "@napi-rs/canvas";
import { scannedUtilityPdf } from "../tests/fixtures.js";
import { setupGroupDemo } from "../server/group-demo-setup.js";
import { Store } from "../server/store.js";
import { Service } from "../server/service.js";
import { Integrations } from "../server/integrations.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = resolve(root, "../reports/demo-files/single-tenant-practice");
const account = "G3W0102";
const filename = "unit-b-water-practice-scan.pdf";
const lines = ["Manila Water", "SYNTHETIC PRACTICE BILL", "Not a real provider bill",
  `Account: ${account}`, "Amount Due: 275.50", "Due Date: 2026-10-29",
  "Billing Period: 2026-10-01 to 2026-10-22"];
await mkdir(output, { recursive: true });
const canvas = createCanvas(1500, 950), ctx = canvas.getContext("2d");
ctx.fillStyle = "white"; ctx.fillRect(0, 0, 1500, 950);
ctx.strokeStyle = "black"; ctx.lineWidth = 3; ctx.strokeRect(30, 30, 1440, 890);
ctx.fillStyle = "black"; ctx.font = "36px Arial";
lines.forEach((line, index) => ctx.fillText(line, 65, 110 + index * 100));
const png = canvas.toBuffer("image/png");
const pdf = await scannedUtilityPdf(png);
await writeFile(join(output, filename), pdf);
await writeFile(join(output, "bill-preview.png"), png);

function prepareMapping(store) {
  const manager = store.get("users", "usr-manager");
  const unit = store.all("units").find(u => u.code === "G3-B");
  assert.ok(manager && unit, "Prepare the Group 3 demo first; existing data is preserved.");
  const existing = store.all("mappings").find(m => m.account === account);
  if (existing) {
    assert.equal(existing.unitId, unit.id);
    assert.equal(existing.provider, "manila water");
  } else new Service(store).writeEntity(manager, "mappings", {
    unitId: unit.id, provider: "Manila Water", category: "water", account,
  });
}

const testDir = await mkdtemp(join(tmpdir(), "rentara-single-tenant-"));
let store, integration;
try {
  const setup = setupGroupDemo(testDir, [
    { name: "Test One", email: "one@example.test", unit: "A" },
    { name: "Test Two", email: "two@example.test", unit: "A" },
    { name: "Test Three", email: "three@example.test", unit: "B" },
  ]);
  store = new Store(join(testDir, "propertypro.sqlite"));
  prepareMapping(store);
  const service = new Service(store);
  integration = new Integrations(service, testDir, {});
  const raw = Buffer.from([
    "From: practice@example.test", "To: rentara2026@gmail.com",
    "Subject: Group 3 Demo - Single Tenant Practice", "MIME-Version: 1.0",
    'Content-Type: multipart/mixed; boundary="practice"', "",
    "--practice", "Content-Type: text/plain", "", "Synthetic water bill attached.",
    "--practice", "Content-Type: application/pdf",
    `Content-Disposition: attachment; filename="${filename}"`,
    "Content-Transfer-Encoding: base64", "", pdf.toString("base64"), "--practice--", "",
  ].join("\r\n"));
  const [result] = await integration.ingestEmail(raw);
  assert.equal(result.document.ocrStatus, "validated", JSON.stringify(result.failures));
  assert.equal(result.document.extractionMethod, "pdf_ocr");
  assert.equal(result.document.accountRef, account);
  assert.equal(result.document.amountDue, 275.5);
  assert.equal(result.document.dueDate, "2026-10-29");
  assert.equal(result.document.periodStart, "2026-10-01");
  assert.equal(result.document.periodEnd, "2026-10-22");
  assert.equal(result.billIds.length, 1);
  for (const member of setup.members) {
    const visible = service.bills(store.get("users", member.userId)).filter(b => b.sourceId === result.document.id);
    assert.equal(visible.length, member.unit === "B" ? 1 : 0);
    if (visible.length) {
      assert.equal(visible[0].totalDue, 275.5);
      assert.equal(visible[0].lines[0].category, "water");
    }
  }
  const alerts = store.all("notifications").filter(n => n.billId === result.billIds[0]);
  assert.ok(alerts.length > 0, "Expected a portal billing alert");
  assert.ok(alerts.every(n => !n.emailType), "Utilities must not queue rent emails");
  const count = store.all("bills").length;
  await integration.ingestEmail(raw);
  assert.equal(store.all("bills").length, count);
  await writeFile(join(output, "verification.json"), JSON.stringify({
    verifiedAt: new Date().toISOString(), synthetic: true, method: "pdf_ocr",
    amount: 275.5, unit: "G3-B", account, tenantBillCount: 1,
    tenantIsolation: "passed", portalAlert: "passed", duplicatePrevention: "passed",
    externalMessagesSent: 0, presentationBillImported: false,
  }, null, 2) + "\n");
} finally {
  await integration?.close(); store?.close();
  assert.equal(dirname(resolve(testDir)), resolve(tmpdir()));
  await rm(testDir, { recursive: true, force: true });
}
// Configure only the matching water account; leave the practice bill unimported.
const live = new Store(join(root, "data/group-demo/propertypro.sqlite"));
try { prepareMapping(live); } finally { live.close(); }
console.log("Single-Tenant practice verified: OCR, email parsing, water classification, own-bill visibility, portal alert and duplicate prevention.");
console.log("Unit B water mapping prepared. No presentation bill imported or email sent.");
console.log(join(output, filename));
