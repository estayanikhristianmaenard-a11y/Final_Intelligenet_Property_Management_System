import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { paymentBadge, categoryChip } from "../../components/badge.js";
import { statCard } from "../../components/stat-card.js";
import { emptyState, skeletonRows } from "../../components/empty-state.js";
import { toast, toastSuccess } from "../../components/toast.js";
import { api } from "../../api/client.js";
import { endpoints } from "../../api/endpoints.js";
import session from "../../auth/session.js";
import { peso, date, relative, dateTime, count } from "../../utils/format.js";
import { reportPayment } from "../../app/workflows.js";
import { ARRANGEMENT_LABEL } from "../../config/constants.js";

/**
 * Tenant view — "My Home".
 *
 * Strictly separated from the Manager dashboard: a tenant sees only their own
 * unit, their own bills, their own payments and their own receipts. Reporting
 * a payment never marks it Paid.
 *
 * @param {HTMLElement} container
 */
export async function renderTenantHome(container) {
  const tenantId = session.user?.tenantId;

  render(
    container,
    frame(
      html`<div class="tenant-hero-card">
          <div class="skeleton" style="height:150px;border-radius:16px"></div>
        </div>
        <div class="grid-auto">
          ${Array.from({ length: 3 }, () => html`<div class="stat-card" style="height:120px"><div class="skeleton full-width" style="height:100%"></div></div>`)}
        </div>`,
    ),
  );

  try {
    const tenant = await api.get(endpoints.tenant(tenantId));
    render(container, frame(body(tenant)));
    bind(container, tenant);
  } catch (error) {
    render(
      container,
      frame(
        emptyState({
          iconName: "alert-triangle",
          title: "Your dashboard could not be loaded",
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
          <span>My Home</span>
        </nav>
        <h1 id="page-title">My Home</h1>
        <p>Your unit, current bill and payment status.</p>
      </div>
      <div class="page-header__actions">
        <a class="btn btn--secondary" href="#/tenant/bills"
          >${icon("receipt", { size: 15 })} All bills</a
        >
        <button
          class="btn btn--primary"
          type="button"
          data-action="report-payment"
        >
          ${icon("credit-card", { size: 15 })} Report Payment
        </button>
      </div>
    </div>
    ${content}
  </section>`;
}

function body(tenant) {
  const bill = tenant.bills?.[0] ?? null;
  const payments = tenant.payments ?? [];
  const pending = payments.filter((p) => p.status === "tenant_reported_paid");

  return html`
    <div class="tenant-hero-card">
      <div>
        <span class="tenant-hero-card__label">Welcome back</span>
        <h2>${tenant.fullName}</h2>
        <div class="tenant-hero-card__unit">
          <span class="tenant-hero-card__chip"
            >${icon("home", { size: 13 })} ${tenant.unitCode}</span
          >
          <span>${tenant.propertyName}</span>
          <span>·</span>
          <span>${tenant.floor}</span>
          <span class="tenant-hero-card__chip"
            >${ARRANGEMENT_LABEL[tenant.arrangement]}</span
          >
        </div>
      </div>
      <div class="tenant-hero-card__due">
        <span>Amount due</span>
        <b>${peso(tenant.summary?.currentDue ?? 0)}</b>
        <small
          >${bill ? `due ${date(bill.dueDate)}` : "no bill generated"}</small
        >
      </div>
    </div>

    ${
      pending.length
        ? html`<div class="notice-strip notice-strip--warning mb-4">
            <span class="notice-strip__icon"
              >${icon("clock", { size: 14 })}</span
            >
            <span>
              <strong
                >${count(pending.length)} payment awaiting confirmation.</strong
              >
              You reported a payment — the status stays
              <em>Tenant Reported Paid</em> until the Manager confirms it and
              issues a receipt.
            </span>
          </div>`
        : null
    }

    <div class="grid-auto mb-6">
      ${statCard({
        label: "Open bills",
        value: tenant.summary?.openBills ?? 0,
        iconName: "receipt",
        accent: "#dc2626",
        soft: "#fef2f2",
        caption: "this billing cycle",
        href: "#/tenant/bills",
      })}
      ${statCard({
        label: "Confirmed total",
        value: payments.filter((p) => p.status === "paid").length,
        iconName: "check-circle",
        accent: "#16a34a",
        soft: "#f0fdf4",
        caption: peso(tenant.summary?.paidTotal ?? 0),
        href: "#/tenant/bills",
      })}
      ${statCard({
        label: "Documents",
        value: tenant.documents?.length ?? 0,
        iconName: "file",
        accent: "#4f46e5",
        soft: "#eef2ff",
        caption: "lease, IDs & receipts",
        href: "#/tenant/bills",
      })}
    </div>

    <div class="dashboard-grid">
      <section class="card">
        <div class="card__header">
          <div>
            <h2 class="card__title">Current billing</h2>
            <p class="card__subtitle">
              ${bill ? bill.cycle : "No cycle loaded"}
            </p>
          </div>
          ${bill ? paymentBadge(bill.paymentStatus) : null}
        </div>
        <div class="card__body">
          ${
            bill
              ? html`<div class="table-wrap">
                  <table class="data-table" aria-label="Current billing lines">
                    <thead>
                      <tr>
                        <th scope="col">Line item</th>
                        <th scope="col">Period</th>
                        <th scope="col" style="text-align:right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${bill.lines.map(
                        (line) =>
                          html`<tr>
                            <td>
                              <div class="row row-2">
                                ${categoryChip(line.category)}
                                ${
                                  line.label
                                    ? html`<span class="cell-strong"
                                        >${line.label}</span
                                      >`
                                    : null
                                }
                              </div>
                            </td>
                            <td class="text-xs">${line.period}</td>
                            <td style="text-align:right">
                              <span class="money">${peso(line.amount)}</span>
                            </td>
                          </tr>`,
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="2" class="cell-strong">Total due</td>
                        <td style="text-align:right">
                          <span class="money">${peso(bill.totalDue)}</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>`
              : emptyState({
                  iconName: "receipt",
                  title: "No bill for this cycle yet",
                })
          }
        </div>
        <div class="card__footer">
          <button
            class="btn btn--primary"
            type="button"
            data-action="report-payment"
          >
            ${icon("credit-card", { size: 15 })} Report Payment
          </button>
        </div>
      </section>

      <section class="card">
        <div class="card__header">
          <div>
            <h2 class="card__title">My unit</h2>
            <p class="card__subtitle">Assigned property and lease details</p>
          </div>
        </div>
        <div class="card__body">
          <div class="desc-grid">
            ${desc("Property", tenant.propertyName)}
            ${desc("Unit", `${tenant.unitCode} · ${tenant.floor}`)}
            ${desc("Whole-unit monthly rent", peso(tenant.monthlyRent))}
            ${desc("Arrangement", ARRANGEMENT_LABEL[tenant.arrangement])}
            ${desc("Lease start", date(tenant.leaseStart))}
            ${desc("Rent day", `${tenant.leaseAnniversary} of each month`)}
          </div>
          <div class="notice-strip notice-strip--success mt-4">
            <span class="notice-strip__icon"
              >${icon("bell", { size: 14 })}</span
            >
            <span>
              Notification preferences are managed in Settings. Eligible unpaid
              reminders are scheduled
              <strong>3 days</strong> before your due date.
            </span>
          </div>
        </div>
      </section>
    </div>

    <section class="card">
      <div class="card__header">
        <div>
          <h2 class="card__title">Recent payments</h2>
          <p class="card__subtitle">Reported and Manager-confirmed payments</p>
        </div>
        <a class="btn btn--ghost btn--sm" href="#/tenant/bills"
          >View all ${icon("arrow-right", { size: 14 })}</a
        >
      </div>
      <div class="card__body">
        ${
          payments.length
            ? html`<div class="mini-list">
                ${payments.slice(0, 4).map(
                  (payment) =>
                    html`<div class="mini-list__item">
                      <span
                        class="mini-list__icon"
                        style="--tone:${payment.status === "paid" ? "#16a34a" : "#b45309"};--tone-bg:${
                          payment.status === "paid" ? "#dcfce7" : "#fef3c7"
                        }"
                        >${icon(payment.status === "paid" ? "check-circle" : "clock", { size: 16 })}</span
                      >
                      <span class="mini-list__body">
                        <strong>${peso(payment.amount)}</strong>
                        <span title="${dateTime(payment.reportedOn)}"
                          >${payment.method.replace("_", " ")} ·
                          ${relative(payment.reportedOn)}</span
                        >
                      </span>
                      <span class="mini-list__end">
                        ${paymentBadge(payment.status)}
                        <span
                          class="text-xs text-muted"
                          style="display:block;margin-top:3px"
                          >${payment.receiptNumber ?? "receipt pending"}</span
                        >
                      </span>
                    </div>`,
                )}
              </div>`
            : emptyState({
                iconName: "credit-card",
                title: "No payments reported yet",
              })
        }
      </div>
    </section>
  `;
}

function bind(container, tenant) {
  container
    .querySelectorAll('[data-action="report-payment"]')
    .forEach((button) => {
      button.addEventListener("click", () =>
        openReportPayment(tenant, container),
      );
    });
}

function openModalDeferred() {
  return import("../../components/modal.js");
}

async function openReportPayment(tenant, container) {
  const bill = tenant.bills?.find(
    (b) => b.paymentStatus === "unpaid" && b.totalDue > 0,
  );
  if (!bill) {
    toast({
      title: "Nothing to report",
      message: "There is no unpaid outstanding bill.",
      tone: "info",
    });
    return;
  }
  reportPayment(bill, async () => {
    await renderTenantHome(container);
    window.dispatchEvent(new CustomEvent("app:data-changed"));
  });
}

function labelFor(line) {
  if (line.isAdvance) return "Advance Rent (1 month)";
  return line.category === "rent"
    ? "Rent"
    : line.category === "electricity"
      ? "Electricity"
      : "Water";
}

function desc(label, value) {
  return html`<div class="desc-item">
    <span class="desc-item__label">${label}</span>
    <span class="desc-item__value">${value ?? "—"}</span>
  </div>`;
}

export default renderTenantHome;
