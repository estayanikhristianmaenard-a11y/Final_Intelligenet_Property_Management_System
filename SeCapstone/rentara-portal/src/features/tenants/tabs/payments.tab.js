import { html } from "../../../utils/dom.js";
import { icon } from "../../../components/icon.js";
import { paymentBadge } from "../../../components/badge.js";
import { emptyState } from "../../../components/empty-state.js";
import { peso, dateTime, relative } from "../../../utils/format.js";

/**
 * Tenant Details → Payments tab.
 *
 * Keeps the study's central distinction visible: a tenant-reported payment is
 * never presented as confirmed, and a receipt only exists after the Manager
 * confirms.
 *
 * @param {object} tenant  detail payload from `GET /tenants/:id`
 * @param {{canConfirm?:boolean, onConfirm?:Function}} [options]
 */
export function paymentsTab(tenant, { canConfirm = false, onConfirm } = {}) {
  const payments = tenant.payments ?? [];

  if (!payments.length) {
    return html`${emptyState({
      iconName: "credit-card",
      title: "No payments recorded",
      body: "Reported and confirmed payments will be listed here with their receipts.",
    })}`;
  }

  const confirmedCount = payments.filter((p) => p.status === "paid").length;
  const pendingCount = payments.filter(
    (p) => p.status === "tenant_reported_paid",
  ).length;

  return html`
    <section class="panel-section">
      <div class="row row-between row-wrap mb-3">
        <h3 class="section-title" style="margin-bottom:0">Payment history</h3>
        <span class="text-xs text-muted"
          >${confirmedCount} confirmed · ${pendingCount} awaiting
          confirmation</span
        >
      </div>

      <div class="mini-list">
        ${payments.map((payment) => paymentCard(payment, { canConfirm, onConfirm }))}
      </div>
    </section>

    ${latestReceipt(payments)}
  `;
}

function paymentCard(payment, { canConfirm, onConfirm }) {
  const confirmed = payment.status === "paid";

  return html`<div class="mini-list__item" style="align-items:flex-start">
    <span
      class="mini-list__icon"
      style="--tone:${confirmed ? "#16a34a" : "#b45309"};--tone-bg:${confirmed ? "#dcfce7" : "#fef3c7"}"
      >${icon(confirmed ? "check-circle" : "clock", { size: 16 })}</span
    >

    <span class="mini-list__body">
      <strong
        >${peso(payment.amount)} · ${payment.method.replace("_", " ")}</strong
      >
      <span>reference ${payment.reference}</span>
      <span
        style="display:block;margin-top:3px"
        title="${dateTime(payment.reportedOn)}"
        >reported
        ${relative(payment.reportedOn)}${
          confirmed && payment.confirmedOn
            ? ` · confirmed ${relative(payment.confirmedOn)}`
            : ""
        }</span
      >
      <span class="row row-2 mt-2">${paymentBadge(payment.status)}</span>
      ${payment.rejectionReason ? html`<span class="text-danger">Rejected: ${payment.rejectionReason}</span>` : null}
      ${
        payment.status === "tenant_reported_paid" && canConfirm
          ? html`<button
                class="btn btn--primary btn--sm mt-2"
                type="button"
                data-confirm-payment="${payment.id}"
              >
                ${icon("check", { size: 14 })} Confirm payment</button
              ><button
                class="btn btn--secondary btn--sm mt-2"
                data-reject-payment="${payment.id}"
              >
                Reject report
              </button>`
          : null
      }
    </span>

    <span class="mini-list__end">
      ${
        payment.receiptNumber
          ? html`<span class="chip chip--accent"
              >${icon("file", { size: 12 })} ${payment.receiptNumber}</span
            >`
          : html`<span class="text-xs text-muted">receipt pending</span>`
      }
    </span>
  </div>`;
}

function latestReceipt(payments) {
  const receipt = [...payments].find((p) => p.receiptNumber);
  if (!receipt) return null;

  return html`<section class="panel-section">
    <h3 class="section-title">Confirmed-payment receipt</h3>
    <div class="receipt-preview">
      <div class="receipt-preview__head">
        <div>
          <strong style="font-size:var(--text-sm)"
            >${receipt.receiptNumber}</strong
          >
          <div class="text-xs text-muted">${dateTime(receipt.confirmedOn)}</div>
        </div>
        <div class="row row-wrap row-2"><button class="btn btn--secondary btn--sm" type="button" data-view-receipt="${receipt.receiptNumber}">View receipt</button><button
          class="btn btn--secondary btn--sm"
          data-receipt="${receipt.receiptNumber}"
        >
          Download receipt
        </button></div>
      </div>
      <div class="receipt-line">
        <span>Amount received</span><span>${peso(receipt.amount)}</span>
      </div>
      <div class="receipt-line">
        <span>Method</span><span>${receipt.method.replace("_", " ")}</span>
      </div>
      <div class="receipt-line">
        <span>Reference</span><span>${receipt.reference}</span>
      </div>
      <div class="receipt-line">
        <span>Confirmed by</span><span>Manager</span>
      </div>
      <div class="receipt-line receipt-line--total">
        <span>Total</span><span>${peso(receipt.amount)}</span>
      </div>
      <p class="text-xs text-muted mt-3">
        Generated only after Manager-confirmed payment. Web Push notifications
        never confirm payment by themselves.
      </p>
    </div>
  </section>`;
}

export default paymentsTab;
