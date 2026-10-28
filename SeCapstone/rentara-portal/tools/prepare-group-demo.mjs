import { mkdir, readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { createCanvas } from "@napi-rs/canvas";
import { utilityPdf, scannedUtilityPdf } from "../tests/fixtures.js";
import { setupGroupDemo } from "../server/group-demo-setup.js";
import { Store } from "../server/store.js";
import { Service } from "../server/service.js";
import { Integrations } from "../server/integrations.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = resolve(root, "../reports/demo-files/group-3");
const membersPath = join(root, "data/group-demo-members.json");
const members = JSON.parse(await readFile(membersPath, "utf8"));
await mkdir(output, { recursive: true });
const cases = [
  { unit: "A", account: "G3000101", amount: 900, filename: "unit-a-meralco-scan.pdf", scanned: true },
  { unit: "B", account: "G3000102", amount: 1200, filename: "unit-b-meralco-digital.pdf", scanned: false },
];
for (const c of cases) {
  const lines = ["Meralco", "SYNTHETIC GROUP 3 DEMO", "Not a real provider bill",
    `Account: ${c.account}`, `Amount Due: ${c.amount.toFixed(2)}`,
    "Due Date: 2026-10-29", "Billing Period: 2026-10-01 to 2026-10-22"];
  const canvas = createCanvas(1500, 950), ctx = canvas.getContext("2d");
  ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "black"; ctx.lineWidth = 3; ctx.strokeRect(30, 30, 1440, 890);
  ctx.fillStyle = "black"; ctx.font = "36px Arial";
  lines.forEach((line, index) => ctx.fillText(line, 65, 110 + index * 100));
  const image = canvas.toBuffer("image/png");
  await writeFile(join(output, `unit-${c.unit.toLowerCase()}-preview.png`), image);
  await writeFile(join(output, c.filename), c.scanned ? await scannedUtilityPdf(image) : utilityPdf(lines.join("\n")));
}

// Real parser and OCR, isolated from the demonstration database and Gmail.
const testDir = await mkdtemp(join(tmpdir(), "rentara-group-demo-"));
let store, integration;
try {
  // Verification uses fictional identities, not personal member data.
  const testMembers = [
    { name: "Test Member One", email: "one@example.test", unit: "A" },
    { name: "Test Member Two", email: "two@example.test", unit: "A" },
    { name: "Test Member Three", email: "three@example.test", unit: "B" },
  ];
  const setup = setupGroupDemo(testDir, testMembers);
  assert.equal(setupGroupDemo(testDir, testMembers).reused, true);
  store = new Store(join(testDir, "propertypro.sqlite"));
  const service = new Service(store);
  integration = new Integrations(service, testDir, {});
  const results = [];
  for (const c of cases) {
    const bytes = await readFile(join(output, c.filename));
    const raw = Buffer.from([
      "From: group3-demo@example.test", "To: rentara2026@gmail.com",
      `Subject: Group 3 Demo - Unit ${c.unit}`, `Message-ID: <group3-unit-${c.unit}@example.test>`,
      "MIME-Version: 1.0", 'Content-Type: multipart/mixed; boundary="g3-demo"', "",
      "--g3-demo", "Content-Type: text/plain", "", "Synthetic test bill attached.",
      "--g3-demo", "Content-Type: application/pdf",
      `Content-Disposition: attachment; filename="${c.filename}"`,
      "Content-Transfer-Encoding: base64", "", bytes.toString("base64"), "--g3-demo--", "",
    ].join("\r\n"));
    const [result] = await integration.ingestEmail(raw);
    assert.equal(result.document.ocrStatus, "validated", JSON.stringify(result.failures));
    assert.equal(result.document.accountRef, c.account);
    assert.equal(result.document.amountDue, c.amount);
    assert.equal(result.document.dueDate, "2026-10-29");
    assert.equal(result.document.periodStart, "2026-10-01");
    assert.equal(result.document.periodEnd, "2026-10-22");
    const bills = store.all("bills").filter(b => result.billIds.includes(b.id));
    assert.equal(bills.length, c.unit === "A" ? 2 : 1);
    assert.equal(bills.reduce((sum, b) => sum + b.totalDue, 0), c.amount);
    for (const m of setup.members) {
      const visible = service.bills(store.get("users", m.userId)).filter(b => b.sourceId === result.document.id);
      assert.equal(visible.length, m.unit === c.unit ? 1 : 0);
      if (visible.length) assert.equal(visible[0].totalDue, c.unit === "A" ? 450 : 1200);
    }
    const count = store.all("bills").length;
    await integration.ingestEmail(raw);
    assert.equal(store.all("bills").length, count, "Duplicate email must not duplicate charges");
    results.push({ unit: c.unit, account: c.account, amount: c.amount,
      method: result.document.extractionMethod, tenantBills: bills.length, verified: true });
  }
  await writeFile(join(output, "verification.json"), JSON.stringify({
    verifiedAt: new Date().toISOString(), mode: "Isolated synthetic test; no Gmail messages sent",
    results, duplicatePrevention: true, tenantVisibility: true,
  }, null, 2) + "\n");
  console.log("Both attachment emails validated; actual OCR/text extraction, allocation, Tenant visibility and duplicate prevention passed.");
} finally {
  await integration?.close(); store?.close();
  assert.equal(dirname(resolve(testDir)), resolve(tmpdir()));
  await rm(testDir, { recursive: true, force: true });
}
// Only seed after the attachments pass. Do not pre-import the bills to be presented.
const setup = setupGroupDemo(join(root, "data/group-demo"), members);
console.log(setup.reused ? "Existing Group 3 demo preserved." : "Separate Group 3 portfolio prepared: two units, three Tenant logins, rent and mappings. Utility demo bills not imported.");
console.log("Files: " + output);
