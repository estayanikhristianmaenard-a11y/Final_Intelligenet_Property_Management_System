import test from "node:test";
import assert from "node:assert/strict";
import { renderRentReceipt } from "../server/receipt-view.js";

test("receipt rendering preserves the payment snapshot and escapes untrusted fields", () => {
  const receipt = Object.freeze({
    id: "RCP-original-123", tenantName: '<img src=x onerror="alert(1)">',
    billId: "bill-42", amount: 6500.5, confirmedOn: "2026-10-15T01:00:00Z",
    paymentDate: "2026-10-14", method: "bank_transfer",
    reference: "<script>alert('reference')</script>", confirmedBy: "Manager & Owner",
  });
  const output = renderRentReceipt(receipt);
  assert.ok(output.includes("RCP-original-123"));
  assert.ok(output.includes("PHP 6,500.50"));
  assert.ok(output.includes("2026-10-14"));
  assert.ok(output.includes("Manager &amp; Owner"));
  assert.ok(output.includes("&lt;img"));
  assert.ok(output.includes("&lt;script&gt;"));
  assert.ok(!output.includes("<script"));
  assert.ok(!output.includes("<img"));
  assert.equal(receipt.amount, 6500.5);
});
