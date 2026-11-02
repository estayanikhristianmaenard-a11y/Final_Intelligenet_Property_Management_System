import { tenantPersonalInformation } from "../tenant-personal-info.js";
import { html } from "../../../utils/dom.js";
import { icon } from "../../../components/icon.js";
import { badge, paymentBadge, categoryChip } from "../../../components/badge.js";
import { peso, date, relative, monthLabel } from "../../../utils/format.js";
import { ARRANGEMENT_LABEL } from "../../../config/constants.js";

/**
 * Tenant Details → Overview tab.
 *
 * Houses the four information views required by the Phase 1 spec:
 * Personal Information, Unit Information, Current Billing and Recent Payments.
 *
 * @param {object} tenant  detail payload from `GET /tenants/:id`
 */
export function overviewTab(tenant) {
  const bills = tenant.bills ?? [];
  const rent = latestCategoryBill(bills, "rent");
  const rentShare = rent ? sumLines(rent.lines.filter(line => line.category === "rent" && !line.isAdvance), line => line.grossAmount ?? line.amount) : null;
  const recentPayments = (tenant.payments ?? []).slice(0, 3);

  return html`
    ${tenantPersonalInformation(tenant)}

    <section class="panel-section">
      <h3 class="section-title">Unit Information</h3>
      <div class="desc-grid">
        ${desc("Property", tenant.propertyName)}
        ${desc("Unit", `${tenant.unitCode} · ${tenant.floor}`)}
        ${desc(
          "Billing arrangement",
          ARRANGEMENT_LABEL[tenant.arrangement] ?? tenant.arrangement,
        )}
        ${desc("Whole-unit monthly rent", peso(tenant.monthlyRent))}
        ${tenant.arrangement === "shared_occupancy" ? desc("Latest billed rent share", rentShare === null ? "No rent bill available" : `${peso(rentShare)} · due ${date(rent.dueDate)}`) : null}
        ${desc("Lease start", date(tenant.leaseStart))}
        ${desc("Rent generated on", `${tenant.leaseAnniversary} of each month`)}
      </div>
      <div class="row row-2 row-wrap mt-3">
        <span class="chip chip--accent">${icon("home", { size: 12 })} ${tenant.occupancy}</span>
        <span class="chip">${icon("calendar", { size: 12 })} moved in ${relative(tenant.moveInDate)}</span>
        <span class="chip">fixed · non-prorated rent</span>
      </div>
    </section>

    <section class="panel-section">
      <h3 class="section-title">Latest bills by category</h3>
      <p class="text-xs text-muted mb-3">Billed amounts and their own due dates; each status is shown separately.</p>
      <div class="billing-summary">
        ${[["rent", "Rent", "home"], ["electricity", "Electricity", "bolt"], ["water", "Water", "droplet"]].map(([category, label, symbol]) => billingSummary(latestCategoryBill(bills, category), category, label, symbol))}
      </div>
      ${bills.some(bill => bill.lines?.some(line => line.category === "electricity" || line.category === "water")) ? html`<p class="text-xs text-muted mt-3">Utility marks are personal; provider payment is not verified.</p>` : null}
    </section>

    <section class="panel-section">
      <h3 class="section-title">Recent Payments</h3>
      ${recentPayments.length
        ? html`<div class="mini-list">
            ${recentPayments.map((payment) => paymentRow(payment))}
          </div>`
        : emptyNote("No payments reported yet.")}
    </section>
  `;
}

function latestCategoryBill(bills, category) {
  return bills.filter(bill => bill.lines?.some(line => line.category === category))
    .sort((a, b) => String(b.dueDate ?? "").localeCompare(String(a.dueDate ?? "")) || String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")))[0] ?? null;
}

// Presentation of stored lines only; never recalculate shares from current occupants.
function sumLines(lines, read = line => line.amount) {
  return lines.reduce((sum, line) => sum + Math.round(Number(read(line) ?? 0) * 100), 0) / 100;
}

function billingSummary(bill, category, label, symbol) {
  const lines = (bill?.lines ?? []).filter(line => line.category === category);
  const advance = sumLines(lines.filter(line => line.isAdvance));
  const credit = sumLines(lines, line => line.credit);
  const utility = category !== "rent";
  const status = utility
    ? bill?.utilityTrackingStatus ?? (["not_marked_paid", "self_reported_paid"].includes(bill?.paymentStatus) ? bill.paymentStatus : "not_marked_paid")
    : bill?.paymentStatus;
  return html`<div class="billing-tile" data-billing-category="${category}">
    <span class="billing-tile__label">${icon(symbol, { size: 12 })} ${label}</span>
    <div class="billing-tile__value">${bill ? peso(sumLines(lines)) : "—"}</div>
    ${bill ? html`
      <div class="billing-tile__hint">${monthLabel(bill.cycle)}</div>
      <div class="billing-tile__hint">Due ${date(bill.dueDate)}</div>
      <div class="mt-2">${utility && bill.utilityTrackingNeedsReview ? badge("Review updated bill", "warning") : paymentBadge(status)}</div>
      ${advance ? html`<div class="billing-tile__hint">Includes advance rent: ${peso(advance)}</div>` : null}
      ${credit ? html`<div class="billing-tile__hint">Advance applied: ${peso(credit)}</div>` : null}
    ` : html`<div class="billing-tile__hint">No bill available</div>`}
  </div>`;
}

function paymentRow(payment) {
  const confirmed = payment.status === "paid";
  return html`<div class="mini-list__item">
    <span
      class="mini-list__icon"
      style="--tone:${confirmed ? "#16a34a" : "#b45309"};--tone-bg:${confirmed ? "#dcfce7" : "#fef3c7"}"
      >${icon(confirmed ? "check-circle" : "clock", { size: 16 })}</span
    >
    <span class="mini-list__body">
      <strong>${peso(payment.amount)}</strong>
      <span
        >${payment.method.replace("_", " ")} · reported ${relative(payment.reportedOn)}</span
      >
    </span>
    <span class="mini-list__end">
      ${paymentBadge(payment.status)}
      <span class="text-xs text-muted" style="display:block;margin-top:3px"
        >${payment.receiptNumber ?? "no receipt yet"}</span
      >
    </span>
  </div>`;
}

function desc(label, value) {
  return html`<div class="desc-item">
    <span class="desc-item__label">${label}</span>
    <span class="desc-item__value">${value ?? "—"}</span>
  </div>`;
}

function emptyNote(message) {
  return html`<p class="text-sm text-muted">${message}</p>`;
}

export { categoryChip };
export default overviewTab;
