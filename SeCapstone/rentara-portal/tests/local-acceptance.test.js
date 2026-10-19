import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { setupAcceptance } from "../server/acceptance-setup.js";
import { Store } from "../server/store.js";
import { Service } from "../server/service.js";
import { bootstrap } from "../server/bootstrap.js";
import { createApp } from "../server/index.js";

function clean(dir) {
  assert.equal(dirname(resolve(dir)), resolve(tmpdir()));
  rmSync(dir, { recursive: true, force: true });
}

test("acceptance setup maps the anonymized bill, suppresses seed delivery and preserves edits on rerun", async () => {
  const dir = mkdtempSync(join(tmpdir(), "rentara-acceptance-"));
  let s;
  try {
    const first = await setupAcceptance({ dataDir: dir });
    assert.equal(first.reused, false);
    s = new Store(join(dir, "propertypro.sqlite"));
    const tenant = new Service(s).login({ email: "rentara2026@gmail.com", password: "LocalDemo!2026" }).user;
    assert.equal(tenant.tenantId, first.tenantId);
    const bill = s.all("bills").find(b => b.lines.some(l => l.category === "electricity"));
    assert.equal(bill.tenantId, tenant.tenantId);
    assert.equal(bill.totalDue, 1567.17);
    assert.equal(s.all("mappings").length, 3);
    assert.ok(s.all("bills").some(b => b.lines.some(l => l.category === "rent")));
    assert.ok(s.all("notifications").length > 0);
    assert.ok(s.all("notifications").every(n => n.delivery === "skipped" && n.emailDelivery === "skipped"));
    const original = s.get("tenants", tenant.tenantId);
    s.save("tenants", { ...original, phone: "09123456789" });
    const count = s.all("bills").length;
    s.close();
    s = null;
    assert.equal((await setupAcceptance({ dataDir: dir })).reused, true);
    s = new Store(join(dir, "propertypro.sqlite"));
    assert.equal(s.get("tenants", tenant.tenantId).phone, "09123456789");
    assert.equal(s.all("bills").length, count);
    s.close();
    s = null;
  } finally { s?.close(); clean(dir); }
});

test("acceptance setup refuses another portfolio without replacing its users", async () => {
  const dir = mkdtempSync(join(tmpdir(), "rentara-acceptance-existing-"));
  try {
    let s = new Store(join(dir, "propertypro.sqlite"));
    bootstrap(new Service(s), { adminPassword: "OriginalOnly!2026", managerPassword: "OriginalOnly!2026" });
    s.close();
    await assert.rejects(setupAcceptance({ dataDir: dir }), /Existing database preserved/);
    s = new Store(join(dir, "propertypro.sqlite"));
    assert.equal(s.all("users").length, 2);
    assert.ok(new Service(s).login({ email: "manager@propertypro.ph", password: "OriginalOnly!2026" }).user);
    s.close();
  } finally { clean(dir); }
});

test("invalid or incomplete TLS fails before creating a database instead of downgrading to HTTP", () => {
  const dir = mkdtempSync(join(tmpdir(), "rentara-tls-failure-"));
  try {
    assert.throws(() => createApp({ dataDir: dir, env: { TLS_CERT_FILE: "missing.pem" } }), /both TLS/);
    assert.throws(() => createApp({ dataDir: dir, env: { TLS_CERT_FILE: "missing.pem", TLS_KEY_FILE: "missing.key" } }), /Cannot load HTTPS/);
    assert.equal(existsSync(join(dir, "propertypro.sqlite")), false);
  } finally { clean(dir); }
});
