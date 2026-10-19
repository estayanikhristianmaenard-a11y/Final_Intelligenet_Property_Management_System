import { html } from "../../utils/dom.js";
import { paymentBadge } from "../../components/badge.js";
import { peso, date, dateTime, monthLabel, periodLabel } from "../../utils/format.js";

// Tabler data-grid pattern, adapted to Rentara's own components and CSS.
export function billDetails(bill) {
  const rent = bill.lines.every(line => line.category === "rent");
  const marked = bill.utilityTrackingStatus === "self_reported_paid";
  const field = (label,value) => html`<div class="bill-data-grid__item"><dt>${label}</dt><dd>${value ?? "—"}</dd></div>`;
  return html`<div class="bill-detail">
    <section class="bill-detail__summary" aria-label="Bill summary">
      <div><span class="bill-detail__eyebrow">${rent ? "Rent bill" : "Utility bill"}</span><p class="bill-detail__amount">${peso(bill.totalDue)}</p><p class="text-secondary">Due ${date(bill.dueDate)}</p></div>
      <div>${rent ? paymentBadge(bill.paymentStatus) : html`<span class="badge ${marked ? "badge--success" : "badge--warning"}">${marked ? "Self-Reported Paid" : "Not Marked Paid"}</span>`}</div>
    </section>
    <dl class="bill-data-grid">
      ${field("Tenant",bill.tenantName)}${field("Unit",bill.unitCode)}${field("Billing cycle",monthLabel(bill.cycle))}
      ${field("Bill reference",bill.id)}${bill.receiptId ? field("Rent receipt",bill.receiptId) : null}
    </dl>
    <section class="bill-detail__section" aria-labelledby="bill-breakdown-title">
      <h3 id="bill-breakdown-title">Charge breakdown</h3>
      <dl class="bill-charge-list">${bill.lines.map(line => html`<div class="bill-charge-list__row"><dt>${line.label ?? line.category}<small>${line.period ? periodLabel(line.period) : monthLabel(bill.cycle)}</small>${line.credit ? html`<small>Advance applied: ${peso(line.credit)}</small>` : null}</dt><dd>${peso(line.amount)}</dd></div>`)}</dl>
      ${bill.lines.map(line => line.allocations?.length > 1 ? html`<p class="bill-detail__allocation">Shared ${line.category}: ${peso(line.sourceAmount)} across ${line.allocations.length} tenants. Your share: ${peso(line.grossAmount ?? line.amount)}.</p>` : null)}
    </section>
    ${!rent ? html`<p class="notice-strip notice-strip--info">Provider payment not verified. ${bill.utilityTrackingNeedsReview ? "This bill changed. Review the revised charge before confirming your personal mark." : "Your paid mark is for personal tracking only."}</p>
      ${(bill.utilityTrackingHistory ?? []).length ? html`<section class="bill-detail__section"><h3>Tracking history</h3><ol class="bill-tracking-history">${bill.utilityTrackingHistory.map(item => html`<li><span>${item.status === "self_reported_paid" ? "Self-Reported Paid" : "Not Marked Paid"}<small>Revision ${item.revision}</small></span><time>${dateTime(item.at)}</time></li>`)}</ol></section>` : null}` : null}
    ${bill.settlementReviewRequired ? html`<p class="notice-strip notice-strip--warning">Linked correction balance: ${peso(bill.linkedBalanceChange)}. Original payment and receipt retained; external settlement requires Manager review.</p>` : null}
  </div>`;
}
