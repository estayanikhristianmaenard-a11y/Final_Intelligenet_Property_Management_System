import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { paymentBadge, badge } from "../../components/badge.js";
import { emptyState, skeletonRows } from "../../components/empty-state.js";
import { api } from "../../api/client.js";
import { endpoints } from "../../api/endpoints.js";
import { peso, count, pesoCompact } from "../../utils/format.js";
import {
  BILLING_CATEGORY_META,
  PAYMENT_STATUS_META,
} from "../../config/constants.js";

/** Reports — occupancy, collections and billing-category breakdowns. */
export async function renderReports(
  container,
  { query = new URLSearchParams() } = {},
) {
  const range =
    container.querySelector("[data-report-range]")?.value ??
    query.get("range") ??
    "current";
  render(
    container,
    frame(
      html`<div class="card">
        <div class="card__body">${skeletonRows(5)}</div>
      </div>`,
    ),
  );

  try {
    const summary = await api.get(endpoints.reportsSummary(range));
    render(container, frame(content(summary)));
    container.querySelector("[data-report-range]").value = range;
    container
      .querySelector("[data-report-range]")
      .addEventListener("change", () => renderReports(container));
  } catch (error) {
    render(
      container,
      frame(
        emptyState({
          iconName: "alert-triangle",
          title: "Reports could not be loaded",
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
          <span>Operations</span>${icon("chevron-right", { size: 12 })}
          <span>Reports</span>
        </nav>
        <h1 id="page-title">Reports</h1>
        <p>
          Occupancy, collections and billing composition for the current cycle.
        </p>
      </div>
      <div class="page-header__actions">
        <select
          class="input select"
          aria-label="Report range"
          data-report-range
        >
          <option value="current">Current month</option>
          <option value="1d">Today</option>
          <option value="30d">Last 30 days</option>
          <option value="365d">Last 365 days</option>
          <option value="all">All recorded dates</option>
        </select>
        <button class="btn btn--secondary" type="button">
          ${icon("download", { size: 15 })} Export CSV
        </button>
      </div>
    </div>
    ${content}
  </section>`;
}

function content(summary) {
  const totalBilled = Object.values(summary.byCategory).reduce(
    (a, b) => a + b,
    0,
  );

  return html`
    <div class="report-grid mb-6">
      <section class="card">
        <div class="card__header">
          <div>
            <h2 class="card__title">Portfolio occupancy</h2>
            <p class="card__subtitle">Occupied units per building</p>
          </div>
          <span class="badge badge--primary"
            >${summary.occupancy}% overall</span
          >
        </div>
        <div class="card__body">
          <div class="bar-chart">
            ${summary.byProperty.map(
              (row) =>
                html`<div class="bar-row">
                  <span class="bar-row__label">${row.name}</span>
                  <span class="bar-row__track">
                    <span
                      class="bar-row__fill"
                      style="width:${row.occupancy}%;--bar-color:${
                        row.occupancy >= 85
                          ? "#4f46e5"
                          : row.occupancy >= 70
                            ? "#f59e0b"
                            : "#ef4444"
                      }"
                    ></span>
                  </span>
                  <span class="bar-row__value">${row.occupancy}%</span>
                </div>`,
            )}
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card__header">
          <div>
            <h2 class="card__title">Payment status</h2>
            <p class="card__subtitle">Bill records in the current cycle</p>
          </div>
        </div>
        <div class="card__body">
          <div class="stack stack-4">
            <div
              class="stacked-bar"
              role="img"
              aria-label="Payment status distribution"
            >
              <span
                class="stacked-bar__seg"
                style="width:${summary.byStatusPercent.paid}%;background:#16a34a"
                >${summary.byStatusPercent.paid >= 12 ? `${summary.byStatusPercent.paid}%` : ""}</span
              >
              <span
                class="stacked-bar__seg"
                style="width:${summary.byStatusPercent.tenant_reported_paid}%;background:#d97706"
                >${summary.byStatusPercent.tenant_reported_paid >= 12 ? `${summary.byStatusPercent.tenant_reported_paid}%` : ""}</span
              >
              <span
                class="stacked-bar__seg"
                style="width:${summary.byStatusPercent.unpaid}%;background:#dc2626"
                >${summary.byStatusPercent.unpaid >= 12 ? `${summary.byStatusPercent.unpaid}%` : ""}</span
              >
            </div>

            ${Object.entries(summary.byStatus).map(
              ([status, value]) =>
                html`<div class="row row-between">
                  <span class="row row-2">${paymentBadge(status)}</span>
                  <span class="font-semibold tabular"
                    >${count(value)} bills</span
                  >
                </div>`,
            )}

            <div class="divider" style="margin:0"></div>

            <div class="report-summary">
              <div class="report-summary__item">
                <b>${pesoCompact(summary.collected)}</b
                ><span>Collected (confirmed)</span>
              </div>
              <div class="report-summary__item">
                <b>${pesoCompact(summary.outstanding)}</b
                ><span>Outstanding</span>
              </div>
              <div class="report-summary__item">
                <b>${count(summary.openExceptions)}</b
                ><span>Open exceptions</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <section class="card">
      <div class="card__header">
        <div>
          <h2 class="card__title">Billing composition</h2>
          <p class="card__subtitle">
            Rent, electricity and water only — the study's defined categories
          </p>
        </div>
        <span class="chip">${peso(totalBilled)} billed</span>
      </div>
      <div class="card__body">
        <div class="bar-chart">
          ${Object.entries(summary.byCategory).map(([category, amount]) => {
            const pct = totalBilled
              ? Math.round((amount / totalBilled) * 100)
              : 0;
            const color =
              category === "rent"
                ? "#4f46e5"
                : category === "electricity"
                  ? "#f59e0b"
                  : "#0ea5e9";
            return html`<div class="bar-row">
              <span class="bar-row__label"
                >${BILLING_CATEGORY_META[category]?.label ?? category}</span
              >
              <span class="bar-row__track">
                <span
                  class="bar-row__fill"
                  style="width:${pct}%;--bar-color:${color}"
                ></span>
              </span>
              <span class="bar-row__value">${pct}%</span>
            </div>`;
          })}
        </div>

        <div class="notice-strip notice-strip--info mt-6">
          <span class="notice-strip__icon">${icon("info", { size: 14 })}</span>
          <span>
            Shared-occupancy allocations are reported at their allocated share
            and reconcile to the source billing amount to two decimal places.
          </span>
        </div>
      </div>
    </section>
  `;
}

export { PAYMENT_STATUS_META };
export default renderReports;
