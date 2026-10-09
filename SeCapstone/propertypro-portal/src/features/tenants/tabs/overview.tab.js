import { html } from "../../../utils/dom.js";
import { icon } from "../../../components/icon.js";
import { paymentBadge, categoryChip } from "../../../components/badge.js";
import { peso, date, relative } from "../../../utils/format.js";
import { BILLING_CATEGORY, ARRANGEMENT_LABEL } from "../../../config/constants.js";

/**
 * Tenant Details → Overview tab.
 *
 * Houses the four information views required by the Phase 1 spec:
 * Personal Information, Unit Information, Current Billing and Recent Payments.
 *
 * @param {object} tenant  detail payload from `GET /tenants/:id`
 */
export function overviewTab(tenant) {
  const currentBill = tenant.bills?.[0] ?? null;
  const recentPayments = (tenant.payments ?? []).slice(0, 3);

  return html`
    <section class="panel-section">
      <h3 class="section-title">Personal Information</h3>
      <div class="desc-grid">
        ${desc("Full name", tenant.fullName)}
        ${desc("E-mail", tenant.email)}
        ${desc("Mobile", tenant.phone)}
        ${desc("Government ID", tenant.governmentId)}
        ${desc("Emergency contact", tenant.emergencyContactName)}
        ${desc("Emergency number", tenant.emergencyContactPhone)}
      </div>
    </section>

    <section class="panel-section">
      <h3 class="section-title">Unit Information</h3>
      <div class="desc-grid">
        ${desc("Property", tenant.propertyName)}
        ${desc("Unit", `${tenant.unitCode} · ${tenant.floor}`)}
        ${desc(
          "Billing arrangement",
          ARRANGEMENT_LABEL[tenant.arrangement] ?? tenant.arrangement,
        )}
        ${desc("Monthly rent", peso(tenant.monthlyRent))}
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
      <h3 class="section-title">Current Billing</h3>
      ${currentBill ? billingSummary(currentBill) : emptyNote("No billing record for this cycle.")}
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

function billingSummary(bill) {
  const lines = bill.lines ?? [];
  const byCategory = (category, advanceOnly = false) =>
    lines
      .filter(
        (line) =>
          line.category === category && Boolean(line.isAdvance) === advanceOnly,
      )
      .reduce((sum, line) => sum + line.amount, 0);

  return html`
    <div class="billing-summary">
      <div class="billing-tile">
        <span class="billing-tile__label">${icon("home", { size: 11 })} Rent</span>
        <div class="billing-tile__value">${peso(byCategory("rent"))}</div>
        <div class="billing-tile__hint">${bill.cycle}</div>
      </div>
      <div class="billing-tile">
        <span class="billing-tile__label">${icon("bolt", { size: 11 })} Electricity</span>
        <div class="billing-tile__value">${peso(byCategory("electricity"))}</div>
        <div class="billing-tile__hint">allocated share</div>
      </div>
      <div class="billing-tile">
        <span class="billing-tile__label">${icon("droplet", { size: 11 })} Water</span>
        <div class="billing-tile__value">${peso(byCategory("water"))}</div>
        <div class="billing-tile__hint">allocated share</div>
      </div>
      <div class="billing-tile billing-tile--due">
        <span class="billing-tile__label">Total due</span>
        <div class="billing-tile__value">${peso(bill.totalDue)}</div>
        <div class="billing-tile__hint">due ${date(bill.dueDate)}</div>
      </div>
    </div>

    <div class="row row-between row-wrap mt-3">
      ${paymentBadge(bill.paymentStatus)}
      <span class="text-xs text-muted">${bill.id} · ${ARRANGEMENT_LABEL[bill.arrangement]}</span>
    </div>

    ${bill.paymentStatus === "tenant_reported_paid"
      ? html`<div class="notice-strip notice-strip--warning mt-3">
          <span class="notice-strip__icon">${icon("clock", { size: 14 })}</span>
          <span>
            The tenant reported this payment. It is <strong>not confirmed</strong> — only the
            Manager can change the status to <em>Paid</em> and generate a receipt.
          </span>
        </div>`
      : null}
  `;
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
