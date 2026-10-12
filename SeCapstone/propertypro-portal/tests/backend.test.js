import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Store, newId } from "../server/store.js";
import { Service } from "../server/service.js";
import { bootstrap } from "../server/bootstrap.js";
import { createApp } from "../server/index.js";
import { Integrations } from "../server/integrations.js";
import {
  anniversary,
  cents,
  splitCentavos,
  philippineDate,
  parseUtilityText,
} from "../server/rules.js";
import { utilityPdf, utilityText, utilityEmail } from "./fixtures.js";
import { createECDH, randomBytes } from "node:crypto";
import webpush from "web-push";
import { promises as fs } from "node:fs";

const password = "IntegrationTest!2026";
function fixture(filename = ":memory:", shared = false) {
  const s = new Store(filename),
    v = new Service(s);
  bootstrap(v, { adminPassword: password, managerPassword: password });
  const admin = v.login({ email: "admin@propertypro.ph", password }).user,
    manager = v.login({ email: "manager@propertypro.ph", password }).user;
  const property = v.writeEntity(manager, "properties", {
    name: "Building B",
    address: "Pasig",
    city: "Pasig City",
    type: "apartment",
    letter: "B",
  });
  const unit = v.writeEntity(manager, "units", {
    propertyId: property.id,
    code: "B-203",
    floor: "Second Floor",
    floorNumber: 2,
    type: "Studio",
    monthlyRent: 100,
    arrangement: shared ? "shared_occupancy" : "individual",
  });
  const tenants = [];
  for (let i = 0; i < (shared ? 3 : 1); i++) {
    const tenant = v.writeEntity(manager, "tenants", {
      fullName: "Tenant " + i,
      email: `tenant${i}@example.test`,
      unitId: unit.id,
      leaseStart: "2026-01-31",
      assignmentStart: "2026-01-31",
    });
    tenants.push(tenant);
    v.userWrite(admin, {
      name: tenant.fullName,
      email: tenant.email,
      role: "tenant",
      tenantId: tenant.id,
      password,
    });
  }
  const tenantUser = v.login({ email: "tenant0@example.test", password }).user;
  return { s, v, admin, manager, property, unit, tenants, tenantUser };
}
function mapping(f) {
  f.v.writeEntity(f.manager, "mappings", {
    provider: "Meralco",
    account: "MER-12345",
    category: "electricity",
    unitId: f.unit.id,
  });
}
function source(f, overrides = {}) {
  mapping(f);
  const d = {
    id: newId("ocr"),
    provider: "Meralco",
    accountRef: "MER-12345",
    amountDue: 100,
    dueDate: "2026-03-05",
    periodStart: "2026-02-01",
    periodEnd: "2026-02-28",
    filename: "bill.pdf",
    ocrStatus: "processing",
    receivedAt: new Date().toISOString(),
    documentHash: newId("hash"),
    ...overrides,
  };
  f.s.save("incoming", d);
  return d;
}
test("whole-centavo allocation and original day survive short months", () => {
  assert.equal(anniversary(2026, 2, 31), "2026-02-28");
  assert.equal(anniversary(2028, 2, 31), "2028-02-29");
  assert.deepEqual(splitCentavos(10000, ["c", "a", "b"]), [
    { tenantId: "a", cents: 3334 },
    { tenantId: "b", cents: 3333 },
    { tenantId: "c", cents: 3333 },
  ]);
  assert.throws(() => cents(-1));
  assert.throws(() => cents("0.001"));
  assert.equal(philippineDate(new Date("2026-02-27T17:00:00Z")), "2026-02-28");
});
test("rent is generated once per cycle, with first advance and lease end cutoff", () => {
  const f = fixture();
  try {
    f.v.writeEntity(
      f.manager,
      "tenants",
      {
        leaseEnd: "2026-03-30",
        assignmentEnd: "2026-03-30",
        reason: "Manager records lease termination",
      },
      f.tenants[0].id,
    );
    assert.equal(f.v.generateRent("2026-12-31").generated, 2);
    const bills = f.v.bills(f.manager);
    assert.deepEqual(bills.map((b) => b.dueDate).sort(), [
      "2026-01-31",
      "2026-02-28",
    ]);
    assert.equal(bills.find((b) => b.dueDate === "2026-01-31").lines.length, 2);
    assert.equal(bills.find((b) => b.dueDate === "2026-02-28").lines.length, 1);
    assert.equal(f.v.generateRent("2026-12-31").generated, 0);
    assert.equal(f.s.db.prepare("PRAGMA foreign_key_check").all().length, 0);
  } finally {
    f.s.close();
  }
});
test("shared rent has actual eligible tenants and frozen whole-centavo shares", () => {
  const f = fixture(":memory:", true);
  try {
    f.v.generateRent("2026-01-31");
    const bills = f.v.bills(f.manager);
    assert.equal(bills.length, 3);
    assert.equal(
      bills.reduce((sum, b) => sum + cents(b.lines[0].amount), 0),
      10000,
    );
    for (const b of bills) {
      assert.equal(b.eligibleTenantIds.length, 3);
      assert.ok(b.eligibleTenantIds.every((id) => f.s.get("tenants", id)));
    }
    assert.equal(new Set(f.s.all("tenants").map((t) => t.id)).size, 3);
  } finally {
    f.s.close();
  }
});
test("report, rejection, resubmission and confirmation are consistent and idempotent", () => {
  const f = fixture();
  try {
    f.v.generateRent("2026-01-31");
    const bill = f.v.bills(f.tenantUser)[0];
    assert.throws(() =>
      f.v.report(f.tenantUser, bill.id, { method: "invalid" }),
    );
    assert.throws(() =>
      f.v.report(f.tenantUser, bill.id, { method: "e_wallet", reference: "" }),
    );
    const first = f.v.report(f.tenantUser, bill.id, { method: "cash" });
    assert.equal(first.bill.receiptId, null);
    assert.ok(
      first.bill.lines.every((l) => l.paymentStatus === "tenant_reported_paid"),
    );
    assert.equal(
      f.v.report(f.tenantUser, bill.id, { method: "cash" }).unchanged,
      true,
    );
    assert.throws(
      () => f.v.confirm(f.tenantUser, first.payment.id),
      (e) => e.status === 403,
    );
    f.v.reject(f.manager, first.payment.id, "Payment could not be verified");
    assert.equal(f.v.bills(f.tenantUser)[0].paymentStatus, "unpaid");
    assert.throws(() => f.v.confirm(f.manager, first.payment.id));
    const second = f.v.report(f.tenantUser, bill.id, {
      method: "e_wallet",
      reference: "GCASH-1",
    });
    const paid = f.v.confirm(f.manager, second.payment.id),
      auditCount = f.s.all("audit").length;
    assert.deepEqual(f.v.confirm(f.manager, paid.id), paid);
    assert.equal(f.s.all("audit").length, auditCount);
    assert.equal(f.s.all("receipts").length, 1);
    assert.ok(
      f.v.bills(f.tenantUser)[0].lines.every((l) => l.paymentStatus === "paid"),
    );
    assert.equal(
      f.s.get("credits", "advance:" + f.tenantUser.tenantId).amount,
      100,
    );
    assert.ok(paid.confirmedOn >= paid.reportedOn);
  } finally {
    f.s.close();
  }
});
test("confirmed advance credit applies once to the final applicable cycle", () => {
  const f = fixture();
  try {
    f.v.generateRent("2026-01-31");
    const first = f.v.bills(f.tenantUser)[0];
    const p = f.v.report(f.tenantUser, first.id, { method: "cash" }).payment;
    f.v.confirm(f.manager, p.id);
    f.v.writeEntity(
      f.manager,
      "tenants",
      {
        leaseEnd: "2026-03-30",
        assignmentEnd: "2026-03-30",
        reason: "Manager records lease termination",
      },
      f.tenants[0].id,
    );
    f.v.generateRent("2026-03-31");
    let final = f.v
      .bills(f.tenantUser)
      .find((b) => b.dueDate === "2026-02-28");
    assert.equal(final.totalDue,100);
    assert.equal(final.paymentStatus,'unpaid');
    assert.throws(()=>f.v.report(f.tenantUser,final.id,{method:'cash'}),e=>e.status===409);
    assert.throws(()=>f.v.applyAdvance(f.tenantUser,final.id,{confirmed:true}),e=>e.status===403);
    assert.throws(()=>f.v.applyAdvance(f.admin,final.id,{confirmed:true}),e=>e.status===403);
    assert.throws(()=>f.v.applyAdvance(f.manager,final.id,{confirmed:false}),e=>e.status===422);
    const receiptCount=f.s.all('receipts').length;
    const paymentCount=f.s.all('payments').length;
    final=f.v.applyAdvance(f.manager,final.id,{confirmed:true}).bill;
    assert.equal(final.paymentStatus,'paid');
    assert.equal(final.receiptId,f.s.get('bills',first.id).receiptId);
    assert.equal(f.v.applyAdvance(f.manager,final.id,{confirmed:true}).unchanged,true);
    assert.equal(f.s.all('receipts').length,receiptCount);
    assert.equal(f.s.all('payments').length,paymentCount);
    assert.equal(final.totalDue, 0);
    assert.equal(final.lines[0].credit, 100);
    assert.equal(
      f.s.get("credits", "advance:" + f.tenantUser.tenantId).appliedBillId,
      final.id,
    );
    assert.equal(f.v.generateRent("2026-04-30").generated, 0);
  } finally {
    f.s.close();
  }
});
test("partial final advance leaves only the remaining balance to report", () => {
  const f=fixture();
  try {
    f.v.generateRent('2026-01-31');
    const first=f.v.bills(f.tenantUser)[0];
    f.v.confirm(f.manager,f.v.report(f.tenantUser,first.id,{method:'cash'}).payment.id);
    f.v.writeEntity(f.manager,'tenants',{leaseEnd:'2026-03-30',assignmentEnd:'2026-03-30',reason:'Final cycle recorded'},f.tenants[0].id);
    f.v.generateRent('2026-03-31');
    const final=f.v.bills(f.tenantUser).find(b=>b.dueDate==='2026-02-28');
    f.v.correctRent(f.manager,final.id,{amount:150,reason:'Correct recorded fixed cycle rent'});
    const result=f.v.applyAdvance(f.manager,final.id,{confirmed:true}).bill;
    assert.equal(result.totalDue,50);
    assert.equal(result.paymentStatus,'unpaid');
    assert.equal(f.s.all('receipts').length,1);
    assert.equal(f.v.report(f.tenantUser,final.id,{method:'cash'}).payment.amount,50);
  } finally {f.s.close();}
});

test("utility validation, correction, duplicate hold and protected financial history", () => {
  const f = fixture(":memory:", true);
  try {
    const d = source(f, { amountDue: null });
    let result = f.v.processIncoming(d.id);
    assert.ok(result.failures.some((x) => x.rule === "V01"));
    const e = f.s.all("exceptions").find((e) => e.sourceId === d.id);
    result = f.v.correctException(f.manager, e.id, {
      field: "amountDue",
      value: "100.00",
      reason: "Verified source amount",
    });
    assert.equal(result.document.ocrStatus, "validated");
    assert.equal(result.billIds.length, 3);
    assert.equal(f.s.all("corrections")[0].originalValue, null);
    assert.equal(
      f.s.all("bills").reduce((sum, b) => sum + cents(b.totalDue), 0),
      10000,
    );
    const duplicate = { ...d, id: newId("ocr"), amountDue: 100 };
    f.s.save("incoming", duplicate);
    assert.ok(
      f.v.processIncoming(duplicate.id).failures.some((x) => x.rule === "V04"),
    );
    const bill = f.v.bills(f.tenantUser)[0],
      p = f.v.report(f.tenantUser, bill.id, { method: "cash" }).payment;
    f.v.confirm(f.manager, p.id);
    assert.throws(
      () =>
        f.v.correctException(f.manager, e.id, {
          field: "amountDue",
          value: 200,
          reason: "Changed provider amount",
        }),
      (x) => x.status === 409,
    );
  } finally {
    f.s.close();
  }
});
test("unresolved corrections remain in the queue, no false finalization", () => {
  const f = fixture();
  try {
    const d = source(f, { accountRef: "" });
    const result = f.v.processIncoming(d.id);
    assert.ok(result.failures.length);
    const e = f.s.all("exceptions").find((e) => e.sourceId === d.id);
    const unresolved = f.v.correctException(f.manager, e.id, {
      field: "accountRef",
      value: "UNMAPPED",
      reason: "Source reference recovered",
    });
    assert.equal(unresolved.document.ocrStatus, "failed");
    const heldMapping = f.s
      .all("exceptions")
      .find(
        (e) => e.sourceId === d.id && e.ruleId === "V03" && e.state === "open",
      );
    assert.ok(heldMapping);
    const exceptionCount = f.s.all("exceptions").length;
    f.v.correctException(f.manager, heldMapping.id, { revalidate: true });
    assert.equal(f.s.get("exceptions", heldMapping.id).state, "open");
    assert.equal(f.s.all("exceptions").length, exceptionCount);
    assert.ok(
      f.s
        .all("exceptions")
        .some((e) => e.sourceId === d.id && e.state === "open"),
    );
    assert.equal(f.s.all("bills").length, 0);
  } finally {
    f.s.close();
  }
});
test("reminders use Philippine calendar date and deduplicate only unpaid bills", () => {
  const f = fixture();
  try {
    f.v.generateRent("2026-01-31");
    assert.equal(f.v.reminders("2026-01-28").created, 1);
    assert.equal(f.v.reminders("2026-01-28").created, 0);
    const b = f.v.bills(f.tenantUser)[0];
    f.v.report(f.tenantUser, b.id, { method: "cash" });
    assert.equal(f.v.reminders("2026-01-28").created, 0);
  } finally {
    f.s.close();
  }
});
test("stored sessions and records survive reopening, logout invalidates token", () => {
  const dir = mkdtempSync(join(tmpdir(), "propertypro-"));
  let f;
  try {
    const filename = join(dir, "db.sqlite");
    f = fixture(filename);
    f.v.generateRent("2026-01-31");
    const auth = f.v.login({ email: "tenant0@example.test", password });
    const count = f.s.all("bills").length;
    f.s.close();
    const reopened = new Store(filename),
      v = new Service(reopened);
    assert.equal(v.authenticate(auth.token).tenantId, auth.user.tenantId);
    assert.equal(reopened.all("bills").length, count);
    v.logout(auth.token, auth.user);
    assert.throws(
      () => v.authenticate(auth.token),
      (e) => e.status === 401,
    );
    reopened.close();
    f = null;
  } finally {
    if (f)
      try {
        f.s.close();
      } catch {}
    rmSync(dir, { recursive: true, force: true });
  }
});
test("actual HTTP API enforces roles, tenant ownership, files and persisted settings", async () => {
  const f = fixture(":memory:", true),
    dir = mkdtempSync(join(tmpdir(), "propertypro-api-")),
    app = createApp({ store: f.s, dataDir: dir, env: {} });
  await new Promise((r) => app.server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${app.server.address().port}/api/v1`;
  async function req(path, token, method = "GET", body) {
    const r = await fetch(base + path, {
      method,
      headers: {
        ...(token ? { Authorization: "Bearer " + token } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: r.status, body: await r.json() };
  }
  try {
    const admin = (
        await req("/auth/login", null, "POST", {
          email: "admin@propertypro.ph",
          password,
        })
      ).body.token,
      manager = (
        await req("/auth/login", null, "POST", {
          email: "manager@propertypro.ph",
          password,
        })
      ).body.token,
      tenant = (
        await req("/auth/login", null, "POST", {
          email: "tenant0@example.test",
          password,
        })
      ).body.token;
    assert.equal((await req("/properties")).status, 401);
    assert.equal((await req("/properties", admin)).status, 403);
    assert.equal((await req("/admin/users", tenant)).status, 403);
    assert.equal(
      (await req("/tenants/" + f.tenants[1].id, tenant)).status,
      403,
    );
    assert.equal(
      (await req("/tenants/" + f.tenants[0].id, tenant)).status,
      200,
    );
    assert.equal((await req("/bills/incoming", manager)).status, 200);
    assert.equal((await req("/settings/billing-rules", manager)).status, 200);
    assert.equal(
      (await req("/settings/profile", manager, "PATCH", { pushEnabled: false }))
        .body.pushEnabled,
      false,
    );
    assert.equal(
      (await req("/settings/profile", manager)).body.pushEnabled,
      false,
    );
    assert.equal(
      (
        await req("/settings/profile", manager, "PATCH", {
          prorateEnabled: true,
        })
      ).status,
      422,
    );
    assert.equal(
      (
        await req("/messages", manager, "POST", {
          tenantId: f.tenants[0].id,
          subject: "Rent",
          body: "Your statement is ready",
        })
      ).status,
      200,
    );
    assert.equal((await req("/messages", tenant)).body.length, 1);
    await req("/notifications/read", tenant, "POST", {});
    assert.ok((await req("/notifications", tenant)).body.every((n) => n.read));
    assert.equal((await req("/intake/sync", manager, "POST", {})).status, 503);
    const privatePath = await fetch(
      base.replace("/api/v1", "") + "/server/service.js",
    );
    assert.equal(privatePath.status, 404);
    await req("/auth/logout", tenant, "POST", {});
    assert.equal((await req("/auth/me", tenant)).status, 401);
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("real digital PDF extraction finalizes bills; malformed and duplicate documents enter queue", async () => {
  const f = fixture(),
    dir = mkdtempSync(join(tmpdir(), "propertypro-ocr-")),
    i = new Integrations(f.v, dir, {});
  try {
    mapping(f);
    const result = await i.ingest(utilityPdf(), "bill.pdf", "application/pdf");
    assert.equal(result.document.ocrStatus, "validated");
    assert.equal(result.document.amountDue, 100);
    assert.equal(f.s.all("bills").length, 1);
    const audit = f.s.all("audit").length;
    assert.equal(f.v.processIncoming(result.document.id).unchanged, true);
    assert.equal(f.s.all("audit").length, audit);
    const duplicate = await i.ingest(
      utilityPdf(),
      "duplicate.pdf",
      "application/pdf",
    );
    assert.ok(duplicate.failures.some((f) => f.rule === "V04"));
    const invalid = await i.ingest(
      Buffer.from("not a pdf"),
      "bad.pdf",
      "application/pdf",
    );
    assert.equal(invalid.document.ocrStatus, "failed");
    assert.ok(
      f.s
        .all("exceptions")
        .some((e) => e.sourceId === invalid.document.id && e.state === "open"),
    );
  } finally {
    await i.close();
    f.s.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("MIME email attachment runs through real extraction and shared finalization", async () => {
  const f = fixture(":memory:", true),
    dir = mkdtempSync(join(tmpdir(), "propertypro-email-")),
    i = new Integrations(f.v, dir, {});
  try {
    mapping(f);
    const [result] = await i.ingestEmail(utilityEmail());
    assert.equal(result.document.messageId, "<test-bill@example.test>");
    assert.equal(result.document.ocrStatus, "validated");
    assert.equal(result.billIds.length, 3);
    assert.equal(
      f.s.all("allocations").reduce((s, a) => s + a.cents, 0),
      10000,
    );
  } finally {
    await i.close();
    f.s.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("real clear-image OCR extracts values using the bundled English model offline", async () => {
  const f = fixture(),
    dir = mkdtempSync(join(tmpdir(), "propertypro-image-")),
    i = new Integrations(f.v, dir, {});
  try {
    mapping(f);
    const result = await i.ingest(
      readFileSync(new URL("./fixtures/utility.png", import.meta.url)),
      "bill.png",
      "image/png",
    );
    assert.equal(
      result.document.ocrStatus,
      "validated",
      JSON.stringify(result.failures),
    );
    assert.equal(result.document.amountDue, 100);
    assert.equal(result.document.accountRef, "MER-12345");
    assert.ok(result.document.confidence >= 50);
  } finally {
    await i.close();
    f.s.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("conflicting extraction is held and requires a correction to each conflicting field", () => {
  const f = fixture();
  try {
    const values = parseUtilityText(utilityText + "\nAmount Due: 200.00");
    assert.deepEqual(values.conflicts, ["amountDue"]);
    const d = source(f, values);
    const held = f.v.processIncoming(d.id);
    assert.ok(
      held.failures.some(
        (f) => f.rule === "V01" && f.reason.includes("Conflicting"),
      ),
    );
    const e = f.s
      .all("exceptions")
      .find((e) => e.sourceId === d.id && e.state === "open");
    const corrected = f.v.correctException(f.manager, e.id, {
      field: "amountDue",
      value: "100",
      reason: "Verified signed provider statement",
    });
    assert.equal(corrected.document.ocrStatus, "validated");
  } finally {
    f.s.close();
  }
});
test("late confirmation waits for Manager credit application and preserves revisions", () => {
  const f = fixture();
  try {
    f.v.writeEntity(
      f.manager,
      "tenants",
      { leaseEnd: "2026-03-30" },
      f.tenants[0].id,
    );
    f.v.generateRent("2026-03-31");
    const first = f.v
        .bills(f.tenantUser)
        .find((b) => b.dueDate === "2026-01-31"),
      final = f.v.bills(f.tenantUser).find((b) => b.dueDate === "2026-02-28");
    const p = f.v.report(f.tenantUser, first.id, { method: "cash" }).payment;
    f.v.confirm(f.manager, p.id);
    assert.equal(f.s.get('bills',final.id).totalDue,100);
    const revised = f.v.applyAdvance(f.manager,final.id,{confirmed:true}).bill;
    assert.equal(revised.totalDue, 0);
    assert.equal(revised.revisions[0].totalDue, 100);
    assert.equal(
      f.s.get("credits", "advance:" + f.tenantUser.tenantId).appliedBillId,
      final.id,
    );
    f.v.generateRent("2026-04-30");
    assert.equal(f.s.get("bills", final.id).revision, revised.revision);
    assert.throws(
      () =>
        f.v.writeEntity(
          f.manager,
          "tenants",
          { leaseEnd: "2026-06-30", assignmentEnd: "2026-06-30" },
          f.tenants[0].id,
        ),
      (e) => e.status === 409,
    );
  } finally {
    f.s.close();
  }
});
test("shared utility correction freezes recipients and retains prior financial revision", () => {
  const f = fixture(":memory:", true);
  try {
    const d = source(f);
    f.v.processIncoming(d.id);
    const bill = f.s.all("bills")[0];
    f.v.writeEntity(
      f.manager,
      "tenants",
      {
        assignmentEnd: "2026-02-01",
        leaseEnd: "2026-02-01",
        reason: "Manager records assignment termination",
      },
      f.tenants[0].id,
    );
    const e = f.s.save("exceptions", {
      id: newId("exc"),
      sourceId: d.id,
      billId: null,
      source: "billing",
      fields: [],
      state: "open",
    });
    f.v.correctException(f.manager, e.id, {
      field: "amountDue",
      value: "100.01",
      reason: "Verified amended provider statement",
    });
    assert.equal(f.s.all("bills").length, 3);
    assert.deepEqual(
      f.s.get("bills", bill.id).eligibleTenantIds,
      bill.eligibleTenantIds,
    );
    assert.equal(f.s.get("bills", bill.id).revisions.length, 1);
    assert.equal(
      f.s.all("allocations").reduce((s, a) => s + a.cents, 0),
      10001,
    );
  } finally {
    f.s.close();
  }
});
test("account reset, suspension, last Admin protection and expired sessions enforce access", () => {
  const f = fixture();
  try {
    const auth = f.v.login({ email: "tenant0@example.test", password });
    f.v.userWrite(
      f.admin,
      { password: "ReplacementPass!2026" },
      f.tenantUser.id,
    );
    assert.throws(
      () => f.v.authenticate(auth.token),
      (e) => e.status === 401,
    );
    assert.throws(
      () => f.v.login({ email: "tenant0@example.test", password }),
      (e) => e.status === 401,
    );
    f.v.userWrite(f.admin, { status: "suspended" }, f.tenantUser.id);
    assert.throws(
      () =>
        f.v.login({
          email: "tenant0@example.test",
          password: "ReplacementPass!2026",
        }),
      (e) => e.status === 401,
    );
    assert.throws(() =>
      f.v.userWrite(f.admin, { status: "suspended" }, f.admin.id),
    );
    assert.throws(
      () => f.v.report(f.manager, "irrelevant", { method: "cash" }),
      (e) => e.status === 403,
    );
    const manager = f.v.login({ email: "manager@propertypro.ph", password }),
      hashed = f.s.db
        .prepare("SELECT id FROM sessions WHERE userId=?")
        .get(f.manager.id).id;
    f.s.db
      .prepare("UPDATE sessions SET expiresAt=? WHERE userId=?")
      .run("2000-01-01T00:00:00Z", f.manager.id);
    assert.throws(
      () => f.v.authenticate(manager.token),
      (e) => e.status === 401,
    );
  } finally {
    f.s.close();
  }
});
test("R01 keys separate consecutive individual leases in the same month", () => {
  const f = fixture();
  try {
    f.v.writeEntity(
      f.manager,
      "tenants",
      { leaseEnd: "2026-02-10" },
      f.tenants[0].id,
    );
    f.v.writeEntity(f.manager, "tenants", {
      fullName: "Replacement tenant",
      email: "replacement@example.test",
      unitId: f.unit.id,
      leaseStart: "2026-02-15",
    });
    f.v.generateRent("2026-02-28");
    const bills = f.v.bills(f.manager);
    assert.equal(bills.length, 2);
    assert.deepEqual(bills.map((b) => b.dueDate).sort(), [
      "2026-01-31",
      "2026-02-15",
    ]);
    assert.equal(f.v.generateRent("2026-02-28").generated, 0);
  } finally {
    f.s.close();
  }
});
test("V02 accepts zero amount and a valid due date before period end; rejects negative amount", () => {
  const f = fixture();
  try {
    const d = source(f, { amountDue: 0, dueDate: "2026-02-20" });
    assert.equal(f.v.processIncoming(d.id).document.ocrStatus, "validated");
    assert.equal(f.s.all("bills")[0].totalDue, 0);
    assert.equal(f.v.reminders("2026-02-17").created, 0);
    const negative = {
      ...d,
      id: newId("ocr"),
      amountDue: -1,
      documentHash: newId("hash"),
    };
    f.s.save("incoming", negative);
    assert.ok(
      f.v.processIncoming(negative.id).failures.some((f) => f.rule === "V02"),
    );
  } finally {
    f.s.close();
  }
});
test("a later duplicate attachment does not prevent correcting the original source", () => {
  const f = fixture();
  try {
    const first = source(f, { amountDue: null });
    f.v.processIncoming(first.id);
    const duplicate = { ...first, id: newId("ocr") };
    f.s.save("incoming", duplicate);
    assert.ok(
      f.v.processIncoming(duplicate.id).failures.some((f) => f.rule === "V04"),
    );
    const e = f.s
      .all("exceptions")
      .find((e) => e.sourceId === first.id && e.state === "open");
    assert.equal(
      f.v.correctException(f.manager, e.id, {
        field: "amountDue",
        value: 100,
        reason: "Verified original document",
      }).document.ocrStatus,
      "validated",
    );
    assert.equal(f.s.all("bills").length, 1);
  } finally {
    f.s.close();
  }
});
test("rent correction reconciles frozen shared recipients and protects confirmed transactions", () => {
  const f = fixture(":memory:", true);
  try {
    f.v.generateRent("2026-01-31");
    const bill = f.s.all("bills")[0];
    f.v.correctRent(f.manager, bill.id, {
      amount: "100.01",
      reason: "Verified configured rent amount",
    });
    assert.equal(
      f.s.all("allocations").reduce((s, a) => s + a.cents, 0),
      10001,
    );
    assert.equal(f.s.all("corrections").length, 3);
    assert.ok(f.s.all("bills").every((b) => b.revisions.length === 1));
    assert.equal(
      f.s.all("bills").reduce((s, b) => s + cents(b.lines[0].amount), 0),
      10001,
    );
    const own = f.v.bills(f.tenantUser)[0],
      p = f.v.report(f.tenantUser, own.id, { method: "cash" }).payment;
    f.v.confirm(f.manager, p.id);
    assert.throws(
      () =>
        f.v.correctRent(f.manager, bill.id, {
          amount: 200,
          reason: "Attempt to revise confirmed rent",
        }),
      (e) => e.status === 409,
    );
  } finally {
    f.s.close();
  }
});
test("Web Push uses real encrypted request generation; delivery retries and events deduplicate with a test transport", async () => {
  const f = fixture(),
    dir = mkdtempSync(join(tmpdir(), "propertypro-push-"));
  const keys = webpush.generateVAPIDKeys(),
    i = new Integrations(f.v, dir, {
      VAPID_SUBJECT: "mailto:local@example.test",
      VAPID_PUBLIC_KEY: keys.publicKey,
      VAPID_PRIVATE_KEY: keys.privateKey,
    });
  const original = webpush.sendNotification;
  let calls = 0;
  try {
    const ecdh = createECDH("prime256v1");
    ecdh.generateKeys();
    const subscription = {
      endpoint: "https://fcm.googleapis.com/fcm/send/test-only",
      keys: {
        p256dh: ecdh.getPublicKey().toString("base64url"),
        auth: randomBytes(16).toString("base64url"),
      },
    };
    f.s.save("subscriptions", {
      id: "test-sub",
      userId: f.tenantUser.id,
      subscription,
    });
    const n = f.v.notify(
      f.tenantUser.tenantId,
      "New statement",
      "View the portal",
      "billing",
      "test-push",
    );
    webpush.setVapidDetails(
      "mailto:local@example.test",
      keys.publicKey,
      keys.privateKey,
    );
    const details = webpush.generateRequestDetails(
      subscription,
      JSON.stringify({ id: n.id }),
      { TTL: 86400 },
    );
    assert.equal(details.headers["Content-Encoding"], "aes128gcm");
    assert.ok(Buffer.isBuffer(details.body));
    webpush.sendNotification = async (sub, payload) => {
      calls++;
      assert.equal(sub.endpoint, subscription.endpoint);
      assert.equal(JSON.parse(payload).id, n.id);
      if (calls === 1) throw new Error("Simulated transport outage");
      return { statusCode: 201 };
    };
    await i.deliver();
    assert.equal(f.s.get("notifications", n.id).delivery, "failed");
    assert.equal(f.s.all("bills").length, 0);
    await i.deliver();
    assert.equal(f.s.get("notifications", n.id).delivery, "sent");
    await i.deliver();
    assert.equal(calls, 2);
    assert.equal(
      f.v.notify(
        f.tenantUser.tenantId,
        "New statement",
        "View the portal",
        "billing",
        "test-push",
      ),
      undefined,
    );
  } finally {
    webpush.sendNotification = original;
    await i.close();
    f.s.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("HTTP portfolio mutations, file ownership, receipt downloads, backups and range exports persist", async () => {
  const f = fixture(":memory:", true),
    dir = mkdtempSync(join(tmpdir(), "propertypro-full-api-")),
    app = createApp({
      store: f.s,
      dataDir: dir,
      env: { ALLOWED_ORIGINS: "http://localhost:8080" },
    });
  await new Promise((r) => app.server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${app.server.address().port}/api/v1`,
    mt = f.v.login({ email: "manager@propertypro.ph", password }).token,
    at = f.v.login({ email: "admin@propertypro.ph", password }).token,
    tt = f.v.login({ email: "tenant0@example.test", password }).token;
  const request = (path, token = mt, method = "GET", body) =>
    fetch(base + path, {
      method,
      headers: {
        Authorization: "Bearer " + token,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  try {
    let r = await request("/properties", mt, "POST", {
      name: "Unused property",
      address: "Pasig",
      type: "apartment",
    });
    assert.equal(r.status, 200);
    const p = await r.json();
    r = await request("/properties/" + p.id, mt, "PATCH", {
      name: "Edited property",
    });
    assert.equal((await r.json()).name, "Edited property");
    assert.equal(
      (await request("/properties/" + p.id, mt, "DELETE")).status,
      200,
    );
    assert.equal(
      (await request("/units/" + f.unit.id, mt, "DELETE")).status,
      409,
    );
    assert.equal((await request("/mappings", tt, "POST", {})).status, 403);
    const doc = await (
      await request("/documents", mt, "POST", {
        tenantId: f.tenants[1].id,
        filename: "lease.pdf",
        type: "application/pdf",
        base64: utilityPdf().toString("base64"),
      })
    ).json();
    assert.equal((await request("/documents/" + doc.id, tt)).status, 403);
    assert.equal(
      (await request("/documents/" + doc.id, mt)).headers.get("content-type"),
      "application/pdf",
    );
    f.v.generateRent("2026-01-31");
    const bill = f.v.bills(f.tenantUser)[0],
      pay = f.v.report(f.tenantUser, bill.id, { method: "cash" }).payment,
      confirmed = f.v.confirm(f.manager, pay.id);
    r = await request("/receipts/" + confirmed.receiptNumber, tt);
    assert.equal(r.status, 200);
    assert.ok((await r.text()).includes(confirmed.receiptNumber));
    const denied = await fetch(base + "/properties", {
      headers: {
        Origin: "https://unauthorized.example",
        Authorization: "Bearer " + mt,
      },
    });
    assert.equal(denied.status, 403);
    r = await request("/exports/reports?range=all");
    assert.equal(r.headers.get("content-type"), "text/csv; charset=utf-8");
    assert.ok((await r.text()).includes("byCategory"));
    const backup = await (
      await request("/admin/backup", at, "POST", {})
    ).json();
    const copied = new Store(join(dir, "backups", backup.filename));
    assert.equal(
      copied.db.prepare("PRAGMA integrity_check").get().integrity_check,
      "ok",
    );
    assert.equal(copied.all("bills").length, f.s.all("bills").length);
    copied.close();
    const durations = [];
    for (let k = 0; k < 50; k++) {
      const start = performance.now();
      assert.equal((await request("/reports/summary?range=all")).status, 200);
      durations.push(performance.now() - start);
    }
    durations.sort((a, b) => a - b);
    await fs.mkdir("test-results", { recursive: true });
    await fs.writeFile(
      "test-results/performance.json",
      JSON.stringify(
        {
          date: "2026-10-11",
          requests: 50,
          bills: f.s.all("bills").length,
          meanMs: durations.reduce((s, v) => s + v, 0) / durations.length,
          p95Ms: durations[Math.floor(durations.length * 0.95)],
          maxMs: durations.at(-1),
          scope:
            "Sequential loopback authenticated summary requests; small test fixture, not a load benchmark",
        },
        null,
        2,
      ),
    );
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("minute scheduler handles new assignments after its earlier same-day run without duplicate charges", async () => {
  const f = fixture(),
    dir = mkdtempSync(join(tmpdir(), "propertypro-schedule-")),
    integration = new Integrations(f.v, dir, {});
  try {
    f.v.writeEntity(
      f.manager,
      "tenants",
      { leaseEnd: "2026-01-31" },
      f.tenants[0].id,
    );
    await integration.tick();
    const count = f.s.all("bills").length;
    const tenant = f.v.writeEntity(f.manager, "tenants", {
      fullName: "New scheduled tenant",
      email: "scheduled@example.test",
      unitId: f.unit.id,
      leaseStart: philippineDate(),
    });
    await integration.tick();
    assert.equal(f.s.all("bills").length, count + 1);
    assert.equal(
      f.s.all("bills").find((b) => b.tenantId === tenant.id).dueDate,
      philippineDate(),
    );
    await integration.tick();
    assert.equal(f.s.all("bills").length, count + 1);
  } finally {
    await integration.close();
    f.s.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
