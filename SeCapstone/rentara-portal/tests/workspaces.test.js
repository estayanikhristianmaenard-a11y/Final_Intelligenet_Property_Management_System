import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Store, DEFAULT_WORKSPACE } from "../server/store.js";
import { Service, passwordHash } from "../server/service.js";
import { bootstrap } from "../server/bootstrap.js";
import { createApp } from "../server/index.js";
import { utilityPdf, utilityText } from "./fixtures.js";
import { philippineDate, addDays } from "../server/rules.js";

const password = "WorkspaceTests!2026";
const clean = (dir) => {
  if (dirname(resolve(dir)) !== resolve(tmpdir()))
    throw new Error("Unexpected test directory");
  rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
};

test("independent mailbox settings and a failed workspace job cannot spill into another workspace", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "rentara-workspace-failure-"));
  const store = new Store(":memory:"), service = new Service(store);
  bootstrap(service, { adminPassword: password, managerPassword: password });
  const workspace = service.workspaceWrite(store.get("users", "usr-admin"), { name: "Independent owner B" });
  const config = join(dir, "integration-test.json");
  writeFileSync(config, JSON.stringify({ [workspace.id]: {
    IMAP_HOST: "imap-b.example.test", IMAP_USER: "owner-b@example.test", IMAP_PASSWORD: "B-test-only", IMAP_MAILBOX: "Bills B",
  } }));
  const app = createApp({ store, dataDir: dir, env: {
    IMAP_HOST: "imap-a.example.test", IMAP_USER: "owner-a@example.test", IMAP_PASSWORD: "A-test-only", IMAP_MAILBOX: "Bills A",
    WORKSPACE_CONFIG_FILE: config,
  } });
  try {
    const a = app.integrations.forWorkspace(DEFAULT_WORKSPACE);
    const b = app.integrations.forWorkspace(workspace.id);
    assert.notEqual(a, b);
    assert.equal(a.env.IMAP_USER, "owner-a@example.test");
    assert.equal(b.env.IMAP_USER, "owner-b@example.test");
    assert.equal(a.env.IMAP_MAILBOX, "Bills A");
    assert.equal(b.env.IMAP_MAILBOX, "Bills B");
    let aCalls = 0, bCalls = 0;
    a.tick = async () => {
      assert.equal(store.workspaceId, DEFAULT_WORKSPACE);
      aCalls++;
      await new Promise(r => setTimeout(r, 2));
      throw new Error("Simulated owner A job failure");
    };
    b.tick = async () => {
      assert.equal(store.workspaceId, workspace.id);
      bCalls++;
      store.save("settings", { id: "job-proof", runs: bCalls });
    };
    const errors = t.mock.method(console, "error", () => {});
    await app.integrations.tick();
    await app.integrations.tick();
    assert.equal(aCalls, 2);
    assert.equal(bCalls, 2, "Owner B runs even after owner A fails, on every later cycle");
    assert.equal(store.get("settings", "job-proof"), null);
    assert.equal(store.withWorkspace(workspace.id, () => store.get("settings", "job-proof")).runs, 2);
    assert.equal(store.workspaceId, DEFAULT_WORKSPACE);
    assert.equal(errors.mock.calls.length, 2);
    assert.deepEqual(errors.mock.calls[0].arguments, ["Workspace scheduler failed:", DEFAULT_WORKSPACE]);
  } finally { await app.close(); clean(dir); }
});

test(
  "two independent workspaces isolate HTTP reads, writes, files, payments, exports and concurrent requests",
  { timeout: 60000 },
  async () => {
    const dir = mkdtempSync(join(tmpdir(), "rentara-workspaces-")),
      store = new Store(":memory:");
    bootstrap(new Service(store), {
      adminPassword: password,
      managerPassword: password,
      tenantPassword: password,
      demo: true,
      demoStart: "2026-01-01",
    });
    const app = createApp({
      store,
      dataDir: dir,
      env: {
        SMTP_HOST: "smtp.example.test",
        SMTP_USER: "not-inherited",
        SMTP_PASSWORD: "test-only",
        SMTP_FROM: "demo@example.test",
        RENT_EMAIL_ENABLED: "true",
      },
    });
    await new Promise((r) => app.server.listen(0, "127.0.0.1", r));
    const origin = `http://127.0.0.1:${app.server.address().port}/api/v1`;
    const request = async (
      token,
      path,
      body,
      method = body === undefined ? "GET" : "POST",
    ) => {
      const response = await fetch(origin + path, {
        method,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      const value = (response.headers.get("content-type") ?? "").includes(
        "application/json",
      )
        ? await response.json()
        : await response.text();
      return { status: response.status, value };
    };
    const ok = async (...args) => {
      const r = await request(...args);
      assert.equal(r.status, 200, JSON.stringify(r.value));
      return r.value;
    };
    const denied = async (...args) => {
      const r = await request(...args);
      assert.ok(
        [403, 404].includes(r.status),
        `${args[1]} returned ${r.status}`,
      );
    };
    try {
      const admin = await ok(null, "/auth/login", {
        email: "admin@propertypro.ph",
        password,
      });
      const a = await ok(null, "/auth/login", {
        email: "manager@propertypro.ph",
        password,
      });
      const ta = await ok(null, "/auth/login", {
        email: "maria.santos@gmail.com",
        password,
      });
      const workspace = await ok(admin.token, "/admin/workspaces", {
        name: "Independent Owner B",
      });
      await ok(admin.token, "/admin/users", {
        name: "Manager B",
        email: "manager-b@example.test",
        role: "manager",
        workspaceId: workspace.id,
        password,
      });
      const b = await ok(null, "/auth/login", {
        email: "manager-b@example.test",
        password,
      });
      assert.equal(b.user.workspaceName, workspace.name);
      const property = await ok(b.token, "/properties", {
        name: "Owner B apartments",
        address: "Synthetic location",
        city: "Pasig City",
        type: "apartment",
      });
      const unit = await ok(b.token, "/units", {
        propertyId: property.id,
        code: "B-203",
        floor: "Ground Floor",
        monthlyRent: 6000,
        arrangement: "individual",
      });
      const tenant = await ok(b.token, "/tenants", {
        unitId: unit.id,
        fullName: "Tenant B",
        email: "tenant-b@example.test",
        leaseStart: "2026-01-01",
        assignmentStart: "2026-01-01",
      });
      await denied(admin.token, "/admin/users", {
        name: "Wrong workspace",
        email: "wrong@example.test",
        role: "tenant",
        tenantId: tenant.id,
        workspaceId: DEFAULT_WORKSPACE,
        password,
      });
      await ok(admin.token, "/admin/users", {
        name: tenant.fullName,
        email: tenant.email,
        role: "tenant",
        tenantId: tenant.id,
        workspaceId: workspace.id,
        password,
      });
      const tb = await ok(null, "/auth/login", {
        email: tenant.email,
        password,
      });
      await ok(b.token, "/rent/generate", {});
      const billA = (await ok(a.token, "/bills")).find(
        (b) => b.tenantId === "tnt-001",
      );
      const billB = (await ok(b.token, "/bills"))[0];
      for (const [manager, tenantLogin, bill] of [
        [a, ta, billA],
        [b, tb, billB],
      ]) {
        const report = await ok(
          tenantLogin.token,
          `/bills/${bill.id}/report-payment`,
          { method: "cash" },
        );
        await ok(manager.token, `/payments/${report.payment.id}/confirm`, {});
      }
      const receiptA = (await ok(a.token, "/bills")).find(
        (b) => b.id === billA.id,
      ).receiptId;
      const receiptB = (await ok(b.token, "/bills")).find(
        (b) => b.id === billB.id,
      ).receiptId;
      const document = await ok(a.token, "/documents", {
        tenantId: "tnt-001",
        filename: "private.pdf",
        type: "application/pdf",
        base64: utilityPdf().toString("base64"),
      });
      for (const [manager, unitId] of [
        [a, "unt-b"],
        [b, unit.id],
      ])
        await ok(manager.token, "/mappings", {
          provider: "Meralco",
          account: "SAME-CAN-123",
          category: "electricity",
          unitId,
        });
      const pdf = utilityPdf(utilityText.replace("MER-12345", "SAME-CAN-123"));
      const sourceA = await ok(a.token, "/intake/upload", {
        filename: "sample.pdf",
        type: "application/pdf",
        base64: pdf.toString("base64"),
      });
      const sourceB = await ok(b.token, "/intake/upload", {
        filename: "sample.pdf",
        type: "application/pdf",
        base64: pdf.toString("base64"),
      });
      assert.equal(sourceA.document.ocrStatus, "validated");
      assert.equal(
        sourceB.document.ocrStatus,
        "validated",
        "identical bills in different workspaces are not cross-owner duplicates",
      );
      await ok(
        a.token,
        "/settings/profile",
        { intakeMailbox: "owner-a@example.test" },
        "PATCH",
      );
      await ok(
        b.token,
        "/settings/profile",
        { intakeMailbox: "owner-b@example.test" },
        "PATCH",
      );
      assert.equal(
        (await ok(a.token, "/settings/profile")).intakeMailbox,
        "owner-a@example.test",
      );
      assert.equal(
        (await ok(b.token, "/settings/profile")).intakeMailbox,
        "owner-b@example.test",
      );
      assert.equal(
        app.integrations.forWorkspace(workspace.id).rentEmail.configured(),
        false,
        "owner B does not inherit owner's A SMTP credentials",
      );
      assert.equal((await request(b.token, "/intake/sync", {})).status, 503);
      for (const [caller, paths] of [
        [
          b,
          [
            "/properties/prp-b",
            "/units/unt-b",
            "/tenants/tnt-001",
            `/bills/${billA.id}`,
            `/receipts/${receiptA}`,
            `/documents/${document.id}`,
            `/incoming/${sourceA.document.id}`,
            `/incoming/${sourceA.document.id}/source`,
          ],
        ],
        [
          a,
          [
            `/properties/${property.id}`,
            `/units/${unit.id}`,
            `/tenants/${tenant.id}`,
            `/bills/${billB.id}`,
            `/receipts/${receiptB}`,
          ],
        ],
        [
          tb,
          [
            `/bills/${billA.id}`,
            `/receipts/${receiptA}`,
            `/documents/${document.id}`,
          ],
        ],
        [admin, ["/bills", "/properties", `/receipts/${receiptA}`]],
      ])
        for (const path of paths) await denied(caller.token, path);
      await denied(
        b.token,
        `/properties/prp-b`,
        { name: "Cross-owner edit" },
        "PATCH",
      );
      await denied(b.token, "/units", {
        propertyId: "prp-b",
        code: "BAD",
        floor: "Ground",
        monthlyRent: 100,
        arrangement: "individual",
      });
      await denied(b.token, `/incoming/${sourceA.document.id}/correct`, {
        field: "amountDue",
        value: "1",
        reason: "must not edit",
      });
      await denied(b.token, `/bills/${billA.id}/apply-advance`, {
        confirmed: true,
      });
      await denied(b.token, "/messages", {
        tenantId: "tnt-001",
        subject: "Wrong workspace",
        body: "Must not send",
      });
      await denied(b.token, "/admin/workspaces", {
        name: "Unauthorized workspace",
      });
      await ok(
        tb.token,
        "/auth/profile",
        { workspaceId: DEFAULT_WORKSPACE, tenantId: "tnt-001" },
        "PATCH",
      );
      assert.equal((await ok(tb.token, "/auth/me")).workspaceId, workspace.id);
      const csv = await ok(b.token, "/exports/tenants");
      assert.ok(csv.includes("Tenant B"));
      assert.ok(!csv.includes("Maria Santos"));
      for (let n = 0; n < 10; n++) {
        const [aa, bb] = await Promise.all([
          ok(a.token, "/properties?workspaceId=" + workspace.id),
          ok(b.token, "/properties?workspaceId=" + DEFAULT_WORKSPACE),
        ]);
        assert.ok(aa.every((p) => p.workspaceId === DEFAULT_WORKSPACE));
        assert.ok(bb.every((p) => p.workspaceId === workspace.id));
      }
      const moved = await ok(
        admin.token,
        `/admin/users/${b.user.id}`,
        { workspaceId: DEFAULT_WORKSPACE },
        "PATCH",
      );
      assert.equal(moved.workspaceId, DEFAULT_WORKSPACE);
      assert.equal(
        (await request(b.token, "/properties")).status,
        401,
        "membership changes revoke old sessions",
      );
      assert.equal(
        store.db.prepare("PRAGMA foreign_key_check").all().length,
        0,
      );
    } finally {
      await app.close();
      clean(dir);
    }
  },
);

test("workspace migration backs up legacy SQLite once and preserves records and credentials", () => {
  const dir = mkdtempSync(join(tmpdir(), "rentara-workspace-migration-")),
    file = join(dir, "legacy.sqlite");
  let store;
  try {
    const db = new DatabaseSync(file);
    db.exec(
      "CREATE TABLE properties(id TEXT PRIMARY KEY,data TEXT NOT NULL);CREATE TABLE users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,tenantId TEXT,data TEXT NOT NULL);CREATE TABLE settings(id TEXT PRIMARY KEY,data TEXT NOT NULL)",
    );
    const hash = passwordHash(password);
    db.prepare("INSERT INTO properties VALUES(?,?)").run(
      "legacy-property",
      JSON.stringify({ id: "legacy-property", name: "Preserved property" }),
    );
    db.prepare("INSERT INTO users VALUES(?,?,?,?)").run(
      "legacy-manager",
      "legacy@example.test",
      null,
      JSON.stringify({
        id: "legacy-manager",
        email: "legacy@example.test",
        name: "Legacy Manager",
        role: "manager",
        status: "active",
        passwordHash: hash,
      }),
    );
    db.prepare("INSERT INTO settings VALUES(?,?)").run(
      "billing",
      JSON.stringify({
        id: "billing",
        intakeMailbox: "preserved@example.test",
      }),
    );
    db.close();
    store = new Store(file);
    assert.equal(
      store.get("properties", "legacy-property").workspaceId,
      DEFAULT_WORKSPACE,
    );
    assert.equal(
      store.get("properties", "legacy-property").name,
      "Preserved property",
    );
    assert.equal(store.get("users", "legacy-manager").passwordHash, hash);
    assert.equal(
      new Service(store).login({ email: "legacy@example.test", password }).user
        .workspaceId,
      DEFAULT_WORKSPACE,
    );
    assert.equal(
      store.get("settings", "billing").intakeMailbox,
      "preserved@example.test",
    );
    assert.equal(readdirSync(join(dir, "backups")).length, 1);
    store.close();
    store = new Store(file);
    assert.equal(readdirSync(join(dir, "backups")).length, 1);
    assert.equal(store.db.prepare("PRAGMA foreign_key_check").all().length, 0);
  } finally {
    store?.close();
    clean(dir);
  }
});

test("scheduler and independent notification transports keep workspace context across async work", async () => {
  const dir = mkdtempSync(join(tmpdir(), "rentara-workspace-jobs-")),
    store = new Store(":memory:"),
    service = new Service(store);
  bootstrap(service, {
    adminPassword: password,
    managerPassword: password,
    tenantPassword: password,
    demo: true,
    demoStart: "2026-01-01",
  });
  const admin = store.get("users", "usr-admin");
  const workspace = service.workspaceWrite(admin, { name: "Job isolation B" });
  const config = join(dir, "mailboxes.json");
  const settings = {
    RENT_EMAIL_ENABLED: "true",
    SMTP_HOST: "smtp.example.test",
    SMTP_USER: "test",
    SMTP_PASSWORD: "test-only",
    SMTP_FROM: "test@example.test",
  };
  writeFileSync(config, JSON.stringify({ [workspace.id]: settings }));
  const app = createApp({
    store,
    dataDir: dir,
    env: { ...settings, WORKSPACE_CONFIG_FILE: config },
  });
  try {
    const manager = service.userWrite(admin, {
      name: "Jobs Manager",
      email: "jobs-manager@example.test",
      role: "manager",
      workspaceId: workspace.id,
      password,
    });
    let tenant;
    store.withWorkspace(workspace.id, () => {
      const property = service.writeEntity(manager, "properties", {
        name: "Jobs B",
        address: "Synthetic",
        city: "Pasig City",
        type: "apartment",
      });
      const unit = service.writeEntity(manager, "units", {
        propertyId: property.id,
        code: "J-1",
        floor: "Ground",
        monthlyRent: 100,
        arrangement: "individual",
      });
      tenant = service.writeEntity(manager, "tenants", {
        unitId: unit.id,
        fullName: "Jobs Tenant",
        email: "jobs-tenant@example.test",
        leaseStart: philippineDate(),
        assignmentStart: philippineDate(),
      });
    });
    service.userWrite(admin, {
      name: tenant.fullName,
      email: tenant.email,
      tenantId: tenant.id,
      role: "tenant",
      workspaceId: workspace.id,
      password,
    });
    const messages = { a: [], b: [] };
    app.integrations.rentEmail.transport = {
      async sendMail(m) {
        await new Promise((r) => setTimeout(r, 3));
        messages.a.push(m);
        return { accepted: [m.to.address] };
      },
    };
    app.integrations.forWorkspace(workspace.id).rentEmail.transport = {
      async sendMail(m) {
        await new Promise((r) => setTimeout(r, 2));
        messages.b.push(m);
        return { accepted: [m.to.address] };
      },
    };
    await app.integrations.tick();
    assert.ok(messages.a.length);
    assert.ok(messages.b.length);
    assert.ok(
      messages.a.every((m) => m.to.address === "maria.santos@gmail.com"),
    );
    assert.ok(messages.b.every((m) => m.to.address === tenant.email));
    const counts = store.allGlobal("bills").length;
    await app.integrations.tick();
    assert.equal(store.allGlobal("bills").length, counts);
    assert.ok(
      store
        .withWorkspace(workspace.id, () => store.all("bills"))
        .every((b) => b.tenantId === tenant.id),
    );
    assert.ok(
      store.withWorkspace(workspace.id, () =>
        store.get("settings", "last-schedule"),
      ),
    );
    assert.ok(store.get("settings", "last-schedule"));
    await Promise.all([
      store.withWorkspace(DEFAULT_WORKSPACE, async () => {
        await new Promise((r) => setTimeout(r, 5));
        assert.equal(store.workspaceId, DEFAULT_WORKSPACE);
      }),
      store.withWorkspace(workspace.id, async () => {
        await new Promise((r) => setTimeout(r, 1));
        assert.equal(store.workspaceId, workspace.id);
      }),
    ]);
  } finally {
    await app.close();
    clean(dir);
  }
});
