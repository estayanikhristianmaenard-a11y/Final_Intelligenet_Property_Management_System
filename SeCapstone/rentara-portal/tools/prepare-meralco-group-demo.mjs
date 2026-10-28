import { mkdir, copyFile, readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { DatabaseSync, backup } from "node:sqlite";
import assert from "node:assert/strict";
import { Store, newId } from "../server/store.js";
import { Service } from "../server/service.js";
import { Integrations } from "../server/integrations.js";
import { utilityEmail, scannedUtilityPdf } from "../tests/fixtures.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const liveDir = join(root, "data/group-demo");
const output = resolve(root, "../reports/demo-files/group-3-meralco");
const unitCode = process.argv.includes("--unit-b") ? "B" : "A";
const account = unitCode === "B" ? "9990000002" : "9990000001";
const source = unitCode === "B" ? join(output, "unit-b-meralco-synthetic-scan.pdf")
  : join(root, "docs/samples/utility-bills/anonymized/meralco-001/bill-scanned.pdf");
if (unitCode === "B") {
  // Derive one explicitly synthetic variant from the already-anonymized PDF.
  // Replace every visible occurrence of its invented CAN before rasterization.
  const { getDocument, Util } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const { createCanvas } = await import("@napi-rs/canvas");
  const digital = await readFile(join(root, "docs/samples/utility-bills/anonymized/meralco-001/bill-digital.pdf"));
  const task = getDocument({ data: new Uint8Array(digital), useSystemFonts: true, isEvalSupported: false,
    wasmUrl: fileURLToPath(new URL("../node_modules/pdfjs-dist/wasm/", import.meta.url)).replaceAll("\\", "/") });
  const pdf = await task.promise;
  try {
    const page = await pdf.getPage(1), viewport = page.getViewport({ scale: 3 });
    const target = pdf.canvasFactory.create(Math.ceil(viewport.width), Math.ceil(viewport.height));
    await page.render({ canvasContext: target.context, viewport }).promise;
    const content = await page.getTextContent();
    let replacements = 0;
    for (const item of content.items.filter(i => i.str?.includes("9990000001") ||
      (i.str?.includes("\uFFFD") && i.str.includes("1,567.17")))) {
      const transform = Util.transform(viewport.transform, item.transform);
      const height = Math.hypot(transform[2], transform[3]);
      const x = transform[4], y = transform[5], width = item.width * viewport.scale;
      target.context.fillStyle = "white";
      target.context.fillRect(x - 2, y - height - 2, width + 4, height * 1.3 + 4);
      target.context.fillStyle = "black";
      const isAccount = item.str.includes("9990000001");
      // The source PDF's peso glyph has no usable font mapping here. Preserve
      // its amount using the equivalent visible PHP prefix in this test copy.
      const replacement = isAccount ? item.str.replaceAll("9990000001", account) : "PHP 1,567.17";
      target.context.font = `${height}px Arial`;
      const fit = Math.min(1, width / target.context.measureText(replacement).width);
      target.context.font = `${height * fit}px Arial`;
      target.context.fillText(replacement, x, y);
      if (isAccount) replacements++;
    }
    assert.ok(replacements > 0, "No dummy CAN located; do not create an incorrectly mapped fixture.");
    const labelled = createCanvas(target.canvas.width, target.canvas.height + 80);
    const ctx = labelled.getContext("2d");
    ctx.fillStyle = "white"; ctx.fillRect(0, 0, labelled.width, labelled.height);
    ctx.fillStyle = "black"; ctx.font = "26px Arial";
    ctx.fillText("SYNTHETIC UNIT B VARIANT - NOT A REAL PAYMENT DOCUMENT", 25, 48);
    ctx.drawImage(target.canvas, 0, 80);
    await mkdir(output, { recursive: true });
    await writeFile(source, await scannedUtilityPdf(labelled.toBuffer("image/png")));
    await writeFile(join(output, "unit-b-preview.png"), labelled.toBuffer("image/png"));
    pdf.canvasFactory.destroy(target);
  } finally { await task.destroy(); }
}
const fixture = await readFile(source); // Never reads or modifies the original private SOA.

function alignDemo(store) {
  const marker = store.get("settings", "group-demo");
  assert.ok(marker?.ready && marker.units[unitCode], "Only the prepared Group 3 demonstration is supported.");
  const unitId = marker.units[unitCode];
  const tenants = store.all("tenants").filter(t => t.unitId === unitId);
  assert.equal(tenants.length, unitCode === "B" ? 1 : 2);
  const ids = new Set(tenants.map(t => t.id));
  // This is a controlled fixture migration, not a relaxation of the application
  // rule that locks real lease starts after billing. Settled records prohibit it.
  for (const table of ["payments", "receipts", "credits"])
    assert.equal(store.all(table).filter(r => ids.has(r.tenantId)).length, 0,
      "Demo date alignment refuses settled/reported financial records.");
  const manager = store.get("users", "usr-manager");
  const service = new Service(store);
  store.transaction(() => {
    const previous = [];
    for (const tenant of tenants) {
      assert.ok(["2026-10-01", "2026-09-01"].includes(tenant.leaseStart), "Unexpected rental dates preserved.");
      if (tenant.leaseStart === "2026-09-01") continue;
      previous.push({ tenantId: tenant.id, leaseStart: tenant.leaseStart, assignmentStart: tenant.assignmentStart });
      store.save("tenants", { ...tenant, leaseStart: "2026-09-01", assignmentStart: "2026-09-01", moveInDate: "2026-09-01" });
      for (const table of ["leases", "assignments"])
        for (const row of store.all(table).filter(r => r.tenantId === tenant.id))
          store.save(table, { ...row, start: "2026-09-01" });
      store.save("corrections", { id: newId("cor"), sourceId: null, billId: null,
        managerId: manager.id, entityType: "tenants", entityId: tenant.id,
        field: "demoOccupancyStart", originalValue: tenant.leaseStart, correctedValue: "2026-09-01",
        reason: "User-approved synthetic Group 3 fixture alignment for anonymized September Meralco bill; not an actual tenancy change.", at: new Date().toISOString() });
    }
    const mapping = store.all("mappings").find(m => m.provider === "meralco" && m.account === account);
    if (mapping) assert.equal(mapping.unitId, unitId, "Existing mapping belongs to another unit; preserved.");
    else service.writeEntity(manager, "mappings", { unitId,
      provider: "Meralco", account, category: "electricity" });
    const key = unitCode === "A" ? "group-meralco-ready" : "group-meralco-b-ready";
    const prior = store.get("settings", key);
    store.save("settings", { ...prior, id: key, ready: true,
      unitId, account, demoOnly: true,
      originalDates: prior?.originalDates ?? previous, preparedAt: prior?.preparedAt ?? new Date().toISOString() });
    if (previous.length) store.audit(manager, "Synthetic Meralco demo occupancy aligned", unitId);
  });
  const generated = service.generateRent();
  assert.equal(store.db.prepare("PRAGMA foreign_key_check").all().length, 0);
  return { tenants, generated };
}

const temp = await mkdtemp(join(tmpdir(), "rentara-actual-meralco-demo-"));
let testStore, integration;
const readDb = new DatabaseSync(join(liveDir, "propertypro.sqlite"), { readOnly: true });
try { await backup(readDb, join(temp, "propertypro.sqlite")); } finally { readDb.close(); }
let verification;
try {
  testStore = new Store(join(temp, "propertypro.sqlite"));
  const { tenants } = alignDemo(testStore);
  assert.equal(testStore.all("incoming").filter(d => d.accountRef === account).length, 0,
    "Meralco already imported in Group 3. Preserve records and use duplicate review rather than silently resetting.");
  const service = new Service(testStore);
  integration = new Integrations(service, temp, {});
  const [result] = await integration.ingestEmail(utilityEmail(fixture));
  assert.equal(result.document.ocrStatus, "validated", JSON.stringify({failures: result.failures,
    fields: Object.fromEntries(["provider", "accountRef", "amountDue", "dueDate", "periodStart", "periodEnd"].map(key => [key, result.document[key]])),
    amountLines: result.document.rawText?.split("\n").filter(line => /amount|1.567/i.test(line))}));
  assert.equal(result.document.extractionMethod, "pdf_ocr");
  for (const [key, value] of Object.entries({ provider: "Meralco", accountRef: account, amountDue: 1567.17,
    dueDate: "2026-10-08", periodStart: "2026-08-27", periodEnd: "2026-09-26" }))
    assert.equal(result.document[key], value, key);
  assert.equal(result.billIds.length, tenants.length);
  const shares = [];
  for (const tenant of testStore.all("tenants")) {
    const user = testStore.all("users").find(u => u.tenantId === tenant.id);
    const own = service.bills(user).filter(b => b.sourceId === result.document.id);
    assert.equal(own.length, tenants.some(t => t.id === tenant.id) ? 1 : 0);
    if (own.length) shares.push({ tenant: tenant.fullName, amount: own[0].totalDue });
  }
  assert.equal(shares.reduce((sum, s) => sum + Math.round(s.amount * 100), 0), 156717);
  const notifications = testStore.all("notifications").filter(n => result.billIds.includes(n.billId));
  assert.equal(notifications.length, tenants.length);
  assert.ok(notifications.every(n => !n.emailType));
  const count = testStore.all("bills").length;
  await integration.ingestEmail(utilityEmail(fixture));
  assert.equal(testStore.all("bills").length, count);
  verification = { verifiedAt: new Date().toISOString(), source: unitCode === "A" ? "One anonymized actual-layout Meralco bill" : "Synthetic Unit B derivative of the same anonymized layout; not another independent bill",
    method: "pdf_ocr", unit: unitCode, account, fields: "passed", tenantVisibility: "passed", portalAlerts: tenants.length,
    duplicatePrevention: "passed", shares, externalMessagesSent: 0, presentationBillImported: false };
} finally {
  await integration?.close(); testStore?.close();
  assert.equal(dirname(resolve(temp)), resolve(tmpdir()));
  await rm(temp, { recursive: true, force: true });
}

// Prepare the existing Group 3 portfolio only after the cloned flow passes.
const backupDir = join(root, "data/group-demo-reset-backups");
await mkdir(backupDir, { recursive: true });
const db = new DatabaseSync(join(liveDir, "propertypro.sqlite"), { readOnly: true });
try { await backup(db, join(backupDir, "before-meralco-alignment-" + new Date().toISOString().replace(/[:.]/g, "-") + ".sqlite")); }
finally { db.close(); }
const live = new Store(join(liveDir, "propertypro.sqlite"));
try { alignDemo(live); } finally { live.close(); }
await mkdir(output, { recursive: true });
if (unitCode === "A") await copyFile(source, join(output, "meralco-anonymized-scan.pdf"));
await writeFile(join(output, unitCode === "A" ? "verification.json" : "verification-unit-b.json"), JSON.stringify(verification, null, 2) + "\n");
console.log(JSON.stringify(verification));
console.log("Same Group 3 portal prepared. PDF was NOT imported into presentation data; no email sent. Backup saved first.");
