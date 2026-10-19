import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { createShowcase } from "../server/demo-showcase.js";
import { Store } from "../server/store.js";
import { Service } from "../server/service.js";

test("two showcase Tenant logins preserve bills on reuse and isolate personal tracking and receipts", async () => {
  const dir = mkdtempSync(join(tmpdir(), "rentara-two-tenants-"));
  let store;
  try {
    await createShowcase(dir);
    store = new Store(join(dir, "propertypro.sqlite"));
    const service = new Service(store);
    const maria = service.login({email:"maria.santos@gmail.com",password:"LocalDemo!2026"});
    const alice = service.login({email:"occupant2@example.test",password:"LocalDemo!2026"});
    assert.notEqual(maria.user.tenantId, alice.user.tenantId);
    for (const user of [maria.user, alice.user]) {
      const bills = service.bills(user);
      assert.ok(bills.length >= 5);
      assert.ok(bills.every(b => b.tenantId === user.tenantId));
      assert.ok(bills.some(b => b.paymentStatus === "paid" && b.receiptId));
      assert.ok(bills.some(b => !b.sourceId && b.paymentStatus === "unpaid"));
    }
    const ownUtility = service.bills(alice.user).find(b => b.sourceId);
    const mariaUtilities = JSON.stringify(service.bills(maria.user).filter(b => b.sourceId));
    service.trackUtility(alice.user, ownUtility.id, {status:"self_reported_paid", revision:ownUtility.revision});
    assert.equal(JSON.stringify(service.bills(maria.user).filter(b => b.sourceId)), mariaUtilities);
    assert.throws(() => service.trackUtility(maria.user, ownUtility.id, {status:"not_marked_paid",revision:ownUtility.revision}));
    const aliceReceipt = store.all("receipts").find(r => r.tenantId === alice.user.tenantId);
    assert.throws(() => service.receipt(maria.user, aliceReceipt.id));
    const snapshot = JSON.stringify([store.all("users"),store.all("bills"),store.all("payments"),store.all("receipts")]);
    await createShowcase(dir);
    assert.equal(JSON.stringify([store.all("users"),store.all("bills"),store.all("payments"),store.all("receipts")]), snapshot);
    assert.equal(service.authenticate(maria.token).tenantId, maria.user.tenantId);
    assert.equal(service.authenticate(alice.token).tenantId, alice.user.tenantId);
  } finally {
    store?.close();
    if (dirname(resolve(dir)) !== resolve(tmpdir())) throw new Error("Unexpected test cleanup location");
    rmSync(dir,{recursive:true,force:true});
  }
});
