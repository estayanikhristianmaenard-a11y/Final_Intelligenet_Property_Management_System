import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { paymentBadge, categoryChip } from "../../components/badge.js";
import { dataTable } from "../../components/data-table.js";
import { emptyState, skeletonRows } from "../../components/empty-state.js";
import { toast, toastSuccess } from "../../components/toast.js";
import { api } from "../../api/client.js";
import { endpoints } from "../../api/endpoints.js";
import session from "../../auth/session.js";
import { peso, date, relative, dateTime } from "../../utils/format.js";
import {isMockMode} from '../../config/api.js';

/**
 * Tenant view — "My Bills & Payments".
 * Own bills only; report payment; confirmed receipts.
 */
export async function renderTenantBills(container) {
  const tenantId = session.user?.tenantId ?? "tnt-001";

  render(container, frame(html`<div class="card"><div class="card__body">${skeletonRows(5)}</div></div>`));

  try {
    const [bills, payments] = await Promise.all([
      api.get(endpoints.tenantBills(tenantId)),
      isMockMode() ? api.get(endpoints.tenantPayments(tenantId)) : Promise.resolve([]),
    ]);
    render(container, frame(content(bills, payments)));
    bind(container, bills);
    if(!isMockMode()) container.querySelectorAll('[data-action="report-payment"], [data-report-bill]').forEach(button=>{button.disabled=true;button.title='Payment reporting is under development.';});
  } catch (error) {
    render(
      container,
      frame(
        emptyState({
          iconName: "alert-triangle",
          title: "Your bills could not be loaded",
          body: error.message,
        }),
      ),
    );
  }
}

function frame(content) {
  return html`<section class="page" aria-labelledby="page-title">
    <div class="page-header">
      <div class="page-header__title">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <span>PropertyPro</span>${icon("chevron-right", { size: 12 })}
          <span>Tenant</span>${icon("chevron-right", { size: 12 })}
          <span>Bills & Payments</span>
        </nav>
        <h1 id="page-title">My Bills &amp; Payments</h1>
        <p>Rent, electricity and water records for your unit.</p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--primary" type="button" data-action="report-payment">
          ${icon("credit-card", { size: 15 })} Report Payment
        </button>
      </div>
    </div>
    ${content}
  </section>`;
}

function content(bills, payments) {
  const receipts = payments.filter((p) => p.receiptNumber);

  return html`
    <div class="stack stack-4">
      ${dataTable({
        ariaLabel: "My bills",
        rows: bills,
        toolbar: html`<span class="chip chip--accent">${icon("receipt", { size: 12 })} Billing records</span>
          <span class="table-toolbar__spacer"></span>
          <span class="text-xs text-muted">${bills.length} records</span>`,
        emptyTitle: "No bills yet",
        emptyBody: "Your rent and utility charges will appear here.",
        emptyIcon: "receipt",
        columns: [
          {
            key: "cycle",
            label: "Cycle",
            render: (row) => html`<span class="cell-stack">
              <strong>${row.cycle}</strong>
              <span>due ${date(row.dueDate)}</span>
            </span>`,
          },
          {
            key: "lines",
            label: "Categories",
            render: (row) =>
              html`<span class="row row-2 row-wrap"
                >${[...new Set(row.lines.map((l) => l.category))].map((c) => categoryChip(c))}</span
              >`,
          },
          {
            key: "totalDue",
            label: "Amount due",
            render: (row) => html`<span class="money">${peso(row.totalDue)}</span>`,
          },
          {
            key: "paymentStatus",
            label: "Status",
            render: (row) => paymentBadge(row.paymentStatus),
          },
          {
            key: "receiptId",
            label: "Receipt",
            render: (row) =>
              row.receiptId
                ? html`<span class="chip chip--accent">${icon("file", { size: 12 })} ${row.receiptId}</span>`
                : html`<span class="text-xs text-muted">not issued</span>`,
          },
          {
            key: "actions",
            label: "",
            className: "cell-actions",
            render: (row) =>
              row.paymentStatus === "unpaid"
                ? html`<button
                    class="btn btn--primary btn--sm"
                    type="button"
                    data-report-bill="${row.id}"
                    data-no-row
                  >
                    ${icon("credit-card", { size: 14 })} Report payment
                  </button>`
                : row.paymentStatus === "tenant_reported_paid"
                  ? html`<span class="badge badge--warning">
                      <i class="badge__dot"></i> Awaiting confirmation</span
                    >`
                  : html`<span class="text-xs text-success font-semibold">Confirmed</span>`,
          },
        ],
        footer: html`<span>Only the Manager can change a status to Paid</span>
          <span class="text-muted">Receipts are generated after confirmation</span>`,
      })}

      <section class="card">
        <div class="card__header">
          <div>
            <h2 class="card__title">Confirmed receipts</h2>
            <p class="card__subtitle">Issued only after Manager confirmation</p>
          </div>
          <span class="badge badge--success">${receipts.length} issued</span>
        </div>
        <div class="card__body">
          ${receipts.length
            ? html`<div class="mini-list">
                ${receipts.map(
                  (payment) => html`<div class="mini-list__item">
                    <span class="mini-list__icon" style="--tone:#16a34a;--tone-bg:#dcfce7"
                      >${icon("receipt", { size: 16 })}</span
                    >
                    <span class="mini-list__body">
                      <strong>${payment.receiptNumber}</strong>
                      <span>confirmed ${dateTime(payment.confirmedOn)}</span>
                    </span>
                    <span class="mini-list__end">
                      <span class="money">${peso(payment.amount)}</span>
                      <button class="btn btn--ghost btn--sm mt-2" type="button">
                        ${icon("download", { size: 14 })} Download
                      </button>
                    </span>
                  </div>`,
                )}
              </div>`
            : emptyState({
                iconName: "file",
                title: "No receipts issued yet",
                body: "A digital receipt appears here once the Manager confirms your payment.",
              })}
        </div>
      </section>

      <div class="notice-strip notice-strip--info">
        <span class="notice-strip__icon">${icon("info", { size: 14 })}</span>
        <span>
          Tenant-reported payments are never treated as confirmed. Web Push notifications only
          direct you back to this portal — they do not confirm payment.
        </span>
      </div>
    </div>
  `;
}

function bind(container, bills) {
  container.querySelectorAll("[data-report-bill]").forEach((button) => {
    button.addEventListener("click", async () => {
      const billId = button.getAttribute("data-report-bill");
      try {
        await api.post(endpoints.reportPayment(billId), { method: "cash" });
        toastSuccess(
          "Payment reported",
          "Status changed to Tenant Reported Paid — awaiting Manager confirmation.",
        );
        renderTenantBills(container);
      } catch (error) {
        toast({ title: "Report failed", message: error.message, tone: "danger" });
      }
    });
  });

  container.querySelectorAll('[data-action="report-payment"]').forEach((button) => {
    button.addEventListener("click", () => {
      const open = bills.find((b) => b.paymentStatus === "unpaid");
      if (!open) {
        toast({
          title: "Nothing to report",
          message: "You have no unpaid bill in the current cycle.",
          tone: "info",
        });
        return;
      }
      container.querySelector(`[data-report-bill="${open.id}"]`)?.click();
    });
  });
}

export { relative };
export default renderTenantBills;
