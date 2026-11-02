import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, copyFileSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { prepareOperational, operationalEnvironment, initializeOperational, assertOperationalDatabase } from "../tools/operational-profile.mjs";
import { Store } from "../server/store.js";
import { Service, passwordHash } from "../server/service.js";
import { bootstrap } from "../server/bootstrap.js";
import { createApp } from "../server/index.js";

const accounts = () => ({
  workspaceName: "Operational QA", admin: { name: "QA Administrator", email: "qa-admin@example.test", password: "AdminFixture!2026" },
  manager: { name: "QA Manager", email: "qa-manager@example.test", password: "ManagerFixture!2026" },
});
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "rentara-operational-"));
  copyFileSync(fileURLToPath(new URL("../.env.operational.example", import.meta.url)), join(root, ".env.operational.example"));
  return { root, db: join(root, "data/operational/propertypro.sqlite"), close: () => rmSync(root, { recursive: true, force: true }) };
}

test("operational preparation preserves local and demo configuration and creates no database", () => {
  const f = fixture();
  try {
    writeFileSync(join(f.root, ".env"), "DATA_DIR=data/showcase\nIMAP_PASSWORD=synthetic-only\n");
    writeFileSync(join(f.root, ".env.acceptance"), "DATA_DIR=data/acceptance\n");
    const originals = [".env", ".env.acceptance"].map(name => readFileSync(join(f.root, name)));
    assert.equal(prepareOperational(f.root).created, true);
    assert.equal(existsSync(f.db), false);
    writeFileSync(join(f.root, ".env.operational"), "PORT=8129\n# custom local settings\n");
    assert.equal(prepareOperational(f.root).created, false);
    assert.match(readFileSync(join(f.root, ".env.operational"), "utf8"), /custom local settings/);
    [".env", ".env.acceptance"].forEach((name, i) => assert.deepEqual(readFileSync(join(f.root, name)), originals[i]));
  } finally { f.close(); }
});

test("operational startup ignores inherited application settings and credentials", () => {
  const f = fixture();
  try {
    const env = operationalEnvironment({}, {
      PATH: "synthetic-os-path", DATA_DIR: "data/group-demo", HOST: "0.0.0.0", PORT: "8444",
      PORTAL_URL: "https://old.example.test:8444/", TLS_CERT_FILE: "old-cert", TLS_KEY_FILE: "old-key",
      WORKSPACE_CONFIG_FILE: "demo-credentials.json", RENT_EMAIL_ENABLED: "true",
      IMAP_HOST: "imap.example.test", IMAP_USER: "other@example.test", IMAP_PASSWORD: "synthetic-only",
      IMAP_ACCESS_TOKEN: "synthetic-token", SMTP_PASSWORD: "synthetic-only", VAPID_PRIVATE_KEY: "synthetic-only",
      INITIAL_PASSWORD: "InheritedFixture!2026",
    }, f.root);
    assert.equal(env.DATA_DIR, join(f.root, "data/operational"));
    assert.equal(env.PORT, "8081"); assert.equal(env.HOST, "127.0.0.1");
    for (const key of ["IMAP_HOST", "IMAP_USER", "IMAP_PASSWORD", "IMAP_ACCESS_TOKEN", "SMTP_PASSWORD", "VAPID_PRIVATE_KEY", "WORKSPACE_CONFIG_FILE", "TLS_CERT_FILE", "TLS_KEY_FILE"]) assert.equal(env[key], "", key);
    assert.equal(env.RENT_EMAIL_ENABLED, "false");
    assert.equal(env.PATH, "synthetic-os-path");
    assert.equal(env.INITIAL_PASSWORD, undefined);
    const configured = operationalEnvironment({ RENT_EMAIL_ENABLED: "true", SMTP_HOST: "smtp.example.test", SMTP_USER: "qa@example.test", SMTP_PASSWORD: "profile-only" }, {}, f.root);
    assert.equal(configured.RENT_EMAIL_ENABLED, "true"); assert.equal(configured.SMTP_PASSWORD, "profile-only");
  } finally { f.close(); }
});

test("operational configuration rejects other data profiles and inconsistent transport addresses", () => {
  const f = fixture();
  try {
    for (const DATA_DIR of ["data", "data/showcase", "data/group-demo", "data/acceptance", "../other-data"])
      assert.throws(() => operationalEnvironment({ DATA_DIR }, {}, f.root), /DATA_DIR/);
    assert.throws(() => operationalEnvironment({ TLS_CERT_FILE: "one-sided.pem" }, {}, f.root), /both/);
    assert.throws(() => operationalEnvironment({ PORT: "0" }, {}, f.root), /PORT/);
    assert.throws(() => operationalEnvironment({ PORTAL_URL: "http://localhost:9999/" }, {}, f.root), /PORT/);
    assert.throws(() => operationalEnvironment({ ALLOWED_ORIGINS: "http://elsewhere.example.test" }, {}, f.root), /ALLOWED_ORIGINS/);
    assert.throws(() => operationalEnvironment({ WORKSPACE_CONFIG_FILE: "data/acceptance/workspaces.json" }, {}, f.root), /inside data\/operational/);
    assert.throws(() => assertOperationalDatabase(f.db), /setup:operational/);
    assert.equal(existsSync(f.db), false);
  } finally { f.close(); }
});

test("operational setup creates only the requested Admin and Manager with separate passwords", () => {
  const f = fixture(); let store;
  try {
    const a = accounts();
    assert.equal(initializeOperational(a, f.root).reused, false);
    assert.equal(assertOperationalDatabase(f.db), true);
    store = new Store(f.db);
    const service = new Service(store);
    assert.equal(service.login(a.admin).user.role, "admin");
    const manager = service.login(a.manager).user;
    assert.equal(manager.role, "manager"); assert.equal(manager.name, a.manager.name);
    assert.equal(manager.workspaceName, a.workspaceName);
    assert.throws(() => service.login({ email: a.manager.email, password: a.admin.password }));
    assert.throws(() => service.login({ email: "manager@propertypro.ph", password: "LocalDemo!2026" }));
    assert.equal(store.allGlobal("users").length, 2);
    for (const table of ["properties", "units", "tenants", "mappings", "incoming", "bills", "payments", "receipts", "notifications"])
      assert.equal(store.allGlobal(table).length, 0, table);
    assert.equal(store.get("settings", "billing").pushEnabled, false);
  } finally { store?.close(); f.close(); }
});

test("operational setup reruns preserve changed passwords and reject a demo database", () => {
  const f = fixture(); let store;
  try {
    const a = accounts(); initializeOperational(a, f.root);
    store = new Store(f.db);
    const manager = store.getGlobal("users", "usr-manager");
    store.save("users", { ...manager, passwordHash: passwordHash("ChangedFixture!2026") });
    store.close(); store = null;
    const saved = readFileSync(f.db);
    assert.equal(initializeOperational(a, f.root).reused, true);
    assert.deepEqual(readFileSync(f.db), saved);
    store = new Store(f.db);
    assert.equal(new Service(store).login({ email: a.manager.email, password: "ChangedFixture!2026" }).user.role, "manager");
  } finally { store?.close(); f.close(); }
  const demo = fixture();
  try {
    const s = new Store(demo.db);
    try { bootstrap(new Service(s), { demo: true, adminPassword: "FixtureOnly!2026", managerPassword: "FixtureOnly!2026", tenantPassword: "FixtureOnly!2026" }); }
    finally { s.close(); }
    const saved = readFileSync(demo.db);
    assert.throws(() => initializeOperational(accounts(), demo.root), /another profile/);
    assert.deepEqual(readFileSync(demo.db), saved);
  } finally { demo.close(); }
});

test("invalid operational identities are rejected before a database is created", () => {
  const f = fixture();
  try {
    const same = accounts(); same.manager.email = same.admin.email.toUpperCase();
    assert.throws(() => initializeOperational(same, f.root), /separate email/);
    const weak = accounts(); weak.admin.password = "short";
    assert.throws(() => initializeOperational(weak, f.root), /12 to 200/);
    assert.equal(existsSync(f.db), false);
  } finally { f.close(); }
});

test("operational profile serves authenticated empty records through the existing Node API", async () => {
  const f = fixture(); let app;
  try {
    const a = accounts(); initializeOperational(a, f.root);
    const env = operationalEnvironment({}, {}, f.root);
    app = createApp({ store: new Store(f.db), dataDir: env.DATA_DIR, env });
    await new Promise((resolve, reject) => { app.server.once("error", reject); app.server.listen(0, "127.0.0.1", resolve); });
    const origin = `http://127.0.0.1:${app.server.address().port}`;
    const login = await fetch(origin + "/api/v1/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: a.manager.email, password: a.manager.password }) });
    assert.equal(login.status, 200);
    const { token } = await login.json();
    const tenants = await fetch(origin + "/api/v1/tenants", { headers: { Authorization: "Bearer " + token } });
    assert.equal(tenants.status, 200); assert.deepEqual(await tenants.json(), []);
    const adminRoute = await fetch(origin + "/api/v1/admin/users", { headers: { Authorization: "Bearer " + token } });
    assert.equal(adminRoute.status, 403);
    assert.equal((await fetch(origin + "/")).status, 200);
  } finally { await app?.close(); f.close(); }
});
