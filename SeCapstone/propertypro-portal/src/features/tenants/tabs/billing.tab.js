import { html } from "../../../utils/dom.js";
import { icon } from "../../../components/icon.js";
import { paymentBadge, categoryChip } from "../../../components/badge.js";
import { emptyState } from "../../../components/empty-state.js";
import { peso, date } from "../../../utils/format.js";
import { ARRANGEMENT_LABEL } from "../../../config/constants.js";

/**
 * Tenant Details → Billing tab.
 * Lists every billing record with its line items, arrangement and status.
 *
 * @param {object} tenant  detail payload from `GET /tenants/:id`
 */
export function billingTab(tenant) {
  const bills = tenant.bills ?? [];

  if (!bills.length) {
    return html`${emptyState({
      iconName: "receipt",
      title: "No billing records",
      body: "Bills appear here once rent or utility charges are generated for this unit.",
    })}`;
  }

  return html`${bills.map((bill) => billCard(bill))}`;
}

function billCard(bill) {
  return html`<section class="panel-section">
    <div class="row row-between row-wrap mb-3">
      <div>
        <div class="row row-2">
          <strong style="font-size:var(--text-sm)">${bill.cycle}</strong>
          <span class="text-xs text-muted">${bill.id}</span>
        </div>
        <div class="text-xs text-muted mt-1">
          ${ARRANGEMENT_LABEL[bill.arrangement]} · due ${date(bill.dueDate)}
        </div>
      </div>
      ${paymentBadge(bill.paymentStatus)}
    </div>

    <div class="table-wrap">
      <table class="data-table" aria-label="Bill line items for ${bill.id}">
        <thead>
          <tr>
            <th scope="col">Line item</th>
            <th scope="col">Period</th>
            <th scope="col" style="text-align:right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${bill.lines.map(
            (line) => html`<tr>
              <td>
                <div class="row row-2">
                  ${categoryChip(line.category)}
                  ${line.label
                    ? html`<span class="cell-strong">${line.label}</span>`
                    : null}
                </div>
                ${line.sourceRef
                  ? html`<div class="text-xs text-muted font-mono" style="margin-top:3px"
                      >ref ${line.sourceRef}</div
                    >`
                  : null}
              </td>
              <td class="text-xs">${line.period}</td>
              <td style="text-align:right"><span class="money">${peso(line.amount)}</span></td>
            </tr>`,
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" class="cell-strong">Total due</td>
            <td style="text-align:right"><span class="money">${peso(bill.totalDue)}</span></td>
          </tr>
        </tfoot>
      </table>
    </div>

    ${sharedAllocationNote(bill)}
  </section>`;
}

function sharedAllocationNote(bill) {
  const sharedLine = (bill.lines ?? []).find((line) => line.allocations?.length);
  if (!sharedLine) return null;

  const reconciles =
    Math.abs(
      sharedLine.allocations.reduce((sum, a) => sum + a.share, 0) -
        sharedLine.sourceAmount,
    ) < 0.005;

  return html`<div class="mt-4">
    <h4 class="section-title">Shared-occupancy allocation</h4>
    <table class="allocation-table">
      <thead>
        <tr>
          <th>Occupant</th>
          <th style="text-align:right">Share</th>
        </tr>
      </thead>
      <tbody>
        ${sharedLine.allocations.map(
          (allocation) => html`<tr>
            <td>${allocation.tenantName}</td>
            <td style="text-align:right">${peso(allocation.share)}</td>
          </tr>`,
        )}
      </tbody>
      <tfoot>
        <tr>
          <td>Source amount (${labelFor(sharedLine)})</td>
          <td style="text-align:right">${peso(sharedLine.sourceAmount)}</td>
        </tr>
      </tfoot>
    </table>
    <p class="mt-2">
      ${reconciles
        ? html`<span class="reconciliation-ok"
            >${icon("check-circle", { size: 13 })} Allocated shares reconcile exactly to the
            source billing amount.</span
          >`
        : html`<span class="text-danger text-xs font-semibold"
            >${icon("alert-triangle", { size: 13 })} Mismatch — route to the Exception
            Queue.</span
          >`}
    </p>
  </div>`;
}

function labelFor(line) {
  if (line.isAdvance) return "Advance Rent (1 month)";
  return line.category === "rent"
    ? "Rent"
    : line.category === "electricity"
      ? "Electricity"
      : "Water";
}

export default billingTab;
