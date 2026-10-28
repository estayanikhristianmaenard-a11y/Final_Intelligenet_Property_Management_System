import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import { Store } from "../server/store.js";
import { Service } from "../server/service.js";
import { bootstrap } from "../server/bootstrap.js";
import { Integrations } from "../server/integrations.js";
import { createRecoveryBackup, restoreRecoveryBackup } from "../server/recovery.js";
import { utilityPdf } from "./fixtures.js";

const password = "RecoveryTest!2026";
function clean(dir) { assert.equal(dirname(resolve(dir)), resolve(tmpdir())); rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); }

test("recovery package restores rent, receipts, distinct workspace files and deduplicated sources without secrets or sessions", async () => {
  const dir = mkdtempSync(join(tmpdir(), "rentara-recovery-"));
  const store = new Store(":memory:"), service = new Service(store), integration = new Integrations(service, dir, {});
  let restored;
  try {
    bootstrap(service, { adminPassword: password, managerPassword: password, tenantPassword: password, demo: true, demoStart: "2026-01-01" });
    store.save("mappings", { ...store.get("mappings", "map-demo"), account: "MER-12345" });
    const bytes = utilityPdf();
    const result = await integration.ingest(bytes, "test.pdf", "application/pdf");
    assert.equal(result.document.ocrStatus, "validated");
    await integration.ingest(bytes, "copy.pdf", "application/pdf");
    const admin = store.get("users", "usr-admin"), manager = store.get("users", "usr-manager");
    const workspace = service.workspaceWrite(admin, { name: "Recovery B" });
    const sourceId = result.document.sourceFileId;
    store.withWorkspace(workspace.id, () => store.save("incoming", { ...result.document, id: "incoming-b", workspaceId: workspace.id }));
    await fs.mkdir(join(dir, "workspaces", workspace.id, "sources"), { recursive: true });
    await fs.writeFile(join(dir, "workspaces", workspace.id, "sources", sourceId), bytes);
    await fs.mkdir(join(dir, "documents"), { recursive: true });
    store.save("documents", { id: "doc-test", tenantId: "tnt-001", name: "Test document" });
    await fs.writeFile(join(dir, "documents/doc-test"), "test supporting document");
    await fs.writeFile(join(dir, ".env"), "DO_NOT_COPY=test-only");
    await fs.mkdir(join(dir, "temp"), { recursive: true });
    await fs.writeFile(join(dir, "temp/unneeded"), "not backed up");
    const auth = service.login({ email: "maria.santos@gmail.com", password });
    const bill = service.bills(auth.user).find(b => service.isRent(b) && b.paymentStatus === "unpaid");
    const payment = service.report(auth.user, bill.id, { method: "cash" });
    const confirmed = service.confirm(manager, payment.payment.id);
    const backup = await createRecoveryBackup(store, dir);
    assert.equal(backup.files, 3, "One source per workspace plus the document; duplicate sources are copied once");
    const bundle = join(dir, "backups", backup.bundle), dest = join(dir, "restored");
    const manifest = JSON.parse(await fs.readFile(join(bundle, "manifest.json"), "utf8"));
    assert.equal(manifest.files.length, 4);
    const resultRestore = await restoreRecoveryBackup(bundle, dest);
    assert.equal(resultRestore.sessionsRevoked, true);
    assert.deepEqual(await fs.readFile(join(dest, "sources", sourceId)), bytes);
    assert.deepEqual(await fs.readFile(join(dest, "workspaces", workspace.id, "sources", sourceId)), bytes);
    assert.equal(await fs.readFile(join(dest, "documents/doc-test"), "utf8"), "test supporting document");
    assert.equal(existsSync(join(dest, ".env")), false);
    assert.equal(existsSync(join(dest, "temp")), false);
    restored = new Store(join(dest, "propertypro.sqlite"));
    assert.equal(restored.db.prepare("SELECT count(*) AS n FROM sessions").get().n, 0);
    const recovered = new Service(restored);
    assert.throws(() => recovered.authenticate(auth.token));
    const relogin = recovered.login({ email: "maria.santos@gmail.com", password });
    assert.equal(recovered.receipt(relogin.user, confirmed.receiptNumber).id, confirmed.receiptNumber);
    assert.equal(restored.get("bills", bill.id).paymentStatus, "paid");
    assert.equal(restored.allGlobal("bills").length, store.allGlobal("bills").length);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), result.document.documentHash);
  } finally { restored?.close(); await integration.close(); store.close(); clean(dir); }
});

test("recovery rejects missing sources, corrupt packages, traversal and existing destinations", async () => {
  const dir = mkdtempSync(join(tmpdir(), "rentara-recovery-invalid-"));
  const store = new Store(":memory:"), service = new Service(store);
  try {
    bootstrap(service, { adminPassword: password, managerPassword: password });
    store.save("incoming", { id: "missing", sourceFileId: "missing-source" });
    await assert.rejects(createRecoveryBackup(store, dir));
    const failedDirs = await fs.readdir(join(dir, "backups"));
    assert.equal(existsSync(join(dir, "backups", failedDirs[0], "manifest.json")), false);
    await fs.mkdir(join(dir, "sources"));
    await fs.writeFile(join(dir, "sources/missing-source"), "test-only bytes");
    const backup = await createRecoveryBackup(store, dir);
    const bundle = join(dir, "backups", backup.bundle);
    const dest = join(dir, "restore-new");
    await fs.writeFile(join(bundle, "sources/missing-source"), "corrupted");
    await assert.rejects(restoreRecoveryBackup(bundle, dest), /checksum/);
    assert.equal(existsSync(dest), false);
    await fs.writeFile(join(bundle, "sources/missing-source"), "test-only bytes");
    await fs.mkdir(dest);
    await fs.writeFile(join(dest, "keep"), "keep me");
    await assert.rejects(restoreRecoveryBackup(bundle, dest), /already exists/);
    assert.equal(await fs.readFile(join(dest, "keep"), "utf8"), "keep me");
    const manifest = JSON.parse(await fs.readFile(join(bundle, "manifest.json"), "utf8"));
    manifest.files.push({ path: "../escape", size: 0, sha256: "bad" });
    await fs.writeFile(join(bundle, "manifest.json"), JSON.stringify(manifest));
    await assert.rejects(restoreRecoveryBackup(bundle, join(dir, "traversal")), /Invalid recovery file path/);
    assert.equal(existsSync(join(dir, "traversal")), false);
  } finally { store.close(); clean(dir); }
});
