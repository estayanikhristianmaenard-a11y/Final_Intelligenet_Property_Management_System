import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { overviewTab } from "../src/features/tenants/tabs/overview.tab.js";

const bill = (category, amount, dueDate, extra = {}) => ({
  id: `${category}-${dueDate}`, cycle: dueDate.slice(0, 7), dueDate,
  createdAt: dueDate + "T00:00:00Z", paymentStatus: "unpaid",
  totalDue: amount, lines: [{ category, amount }], ...extra,
});
const view = bills => new JSDOM(String(overviewTab({
  fullName: "QA Tenant", propertyName: "QA Property", unitCode: "1A", floor: "Ground",
  monthlyRent: 12000, arrangement: "shared_occupancy", leaseStart: "2026-01-01",
  leaseAnniversary: 1, bills, payments: [],
}))).window.document;
const tile = (doc, category) => doc.querySelector(`[data-billing-category="${category}"]`);

test("Tenant overview keeps the latest rent, electricity and water records separate", () => {
  const doc = view([
    bill("water", 283.97, "2026-03-30", { utilityTrackingStatus: "self_reported_paid" }),
    bill("rent", 4000, "2026-03-01"),
    bill("electricity", 850, "2026-03-27", { utilityTrackingStatus: "not_marked_paid" }),
    bill("water", 220, "2026-02-28"),
  ]);
  for (const [category, amount, date] of [["rent", "4,000.00", "Mar 01, 2026"], ["electricity", "850.00", "Mar 27, 2026"], ["water", "283.97", "Mar 30, 2026"]]) {
    assert.ok(tile(doc, category), `Missing ${category} summary`);
    assert.ok(tile(doc, category).textContent.includes(amount));
    assert.ok(tile(doc, category).textContent.includes(date));
  }
  assert.match(tile(doc, "water").textContent, /Self-Reported Paid/);
  assert.match(doc.body.textContent, /provider payment is not verified/i);
});

test("a missing category is not shown as a zero balance", () => {
  const doc = view([bill("water", 220, "2026-03-30")]);
  assert.match(tile(doc, "rent")?.textContent ?? "", /No bill available/);
  assert.doesNotMatch(tile(doc, "rent").textContent, /0\.00/);
});

test("a genuine zero rent bill retains the recorded advance and gross rent share", () => {
  const doc = view([bill("rent", 0, "2026-03-01", {
    paymentStatus: "paid", lines: [{ category: "rent", amount: 0, grossAmount: 4000, credit: 4000 }],
  })]);
  assert.match(tile(doc, "rent")?.textContent ?? "", /0\.00/);
  assert.match(tile(doc, "rent").textContent, /Advance applied.*4,000\.00/s);
  const share = [...doc.querySelectorAll(".desc-item")].find(el => el.textContent.includes("Latest billed rent share"));
  assert.match(share?.textContent ?? "", /4,000\.00/);
});

test("first-cycle advance is shown separately from the Tenant regular rent share", () => {
  const doc = view([bill("rent", 8000, "2026-01-01", {
    lines: [{ category: "rent", amount: 4000 }, { category: "rent", amount: 4000, isAdvance: true }],
  })]);
  assert.match(tile(doc, "rent")?.textContent ?? "", /8,000\.00/);
  assert.match(tile(doc, "rent").textContent, /Includes advance rent.*4,000\.00/s);
  const share = [...doc.querySelectorAll(".desc-item")].find(el => el.textContent.includes("Latest billed rent share"));
  assert.match(share?.textContent ?? "", /4,000\.00/);
  assert.doesNotMatch(share.textContent, /8,000\.00|12,000\.00/);
});

test("whole-unit rent stays labelled independently of a historical recorded share", () => {
  const doc = view([bill("rent", 4000, "2026-01-01")]);
  const unit = [...doc.querySelectorAll(".desc-item")].find(el => el.textContent.includes("Whole-unit monthly rent"));
  const share = [...doc.querySelectorAll(".desc-item")].find(el => el.textContent.includes("Latest billed rent share"));
  assert.match(unit?.textContent ?? "", /12,000\.00/);
  assert.match(share?.textContent ?? "", /4,000\.00/);
});

test("historical mixed bills show only each category amount and never verify utilities", () => {
  const mixed = bill("rent", 5050, "2026-03-01", {
    paymentStatus: "paid", lines: [
      { category: "rent", amount: 4000 }, { category: "electricity", amount: 850 }, { category: "water", amount: 200 },
    ],
  });
  const doc = view([mixed]);
  assert.match(tile(doc, "rent")?.textContent ?? "", /4,000\.00/);
  assert.match(tile(doc, "electricity").textContent, /850\.00/);
  assert.match(tile(doc, "water").textContent, /200\.00/);
  assert.match(tile(doc, "water").textContent, /Not Marked Paid/);
  assert.doesNotMatch(tile(doc, "water").textContent, /5,050\.00/);
});

test("a mark on an older utility revision is identified as needing review", () => {
  const doc = view([bill("water", 250, "2026-03-30", {
    utilityTrackingStatus: "self_reported_paid", utilityTrackingNeedsReview: true,
  })]);
  assert.match(tile(doc, "water")?.textContent ?? "", /Review updated bill/);
  assert.doesNotMatch(tile(doc, "water").textContent, /Self-Reported Paid/);
});

test("summary selection does not mutate or reorder the bill payload", () => {
  const bills = [bill("rent", 3000, "2026-02-01"), bill("rent", 4000, "2026-03-01")];
  const before = JSON.stringify(bills);
  const doc = view(bills);
  assert.match(tile(doc, "rent")?.textContent ?? "", /4,000\.00/);
  assert.equal(JSON.stringify(bills), before);
});
