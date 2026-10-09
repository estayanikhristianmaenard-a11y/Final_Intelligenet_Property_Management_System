import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { statCard } from "../../components/stat-card.js";
import { propertyOverview } from "./property-overview.js";
import { recentActivity } from "./recent-activity.js";
import { emptyState, skeletonRows } from "../../components/empty-state.js";
import { api } from "../../api/client.js";
import { endpoints } from "../../api/endpoints.js";
import { peso, count, dateTime, relative } from "../../utils/format.js";
import { closePanel } from "../../components/side-panel.js";

/**
 * Manager Dashboard — the primary Phase 1 landing view.
 *
 * Composes, top to bottom:
 *   1. four statistical summary cards (Total Units, Total Tenants,
 *      Incoming Bills, Exception Queue)
 *   2. Property Overview (Buildings A–D + unit occupancy indicators)
 *   3. an "needs attention" rail feeding the Exception Queue
 *   4. the Recent Activity data table
 *
 * @param {HTMLElement} container
 */
export async function renderDashboard(container) {
  render(container, pageFrame(skeleton()));

  try {
    const [stats, properties, units, activity] = await Promise.all([
      api.get(endpoints.dashboardStats()),
      api.get(endpoints.properties()),
      api.get(endpoints.units()),
      api.get(endpoints.activity(8)),
    ]);

    render(container, pageFrame(body({ stats, properties, units, activity })));
    bind(container);
  } catch (error) {
    render(
      container,
      pageFrame(
        emptyState({
          iconName: "alert-triangle",
          title: "Dashboard data could not be loaded",
          body: error.message,
        }),
      ),
    );
  }
}

function pageFrame(content) {
  return html`<section class="page" aria-labelledby="page-title">
    <div class="page-header">
      <div class="page-header__title">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <span>PropertyPro</span>${icon("chevron-right", { size: 12 })}
          <span>Manager</span>${icon("chevron-right", { size: 12 })}
          <span>Dashboard</span>
        </nav>
        <h1 id="page-title">Dashboard</h1>
        <p>Portfolio health, billing intake and exceptions at a glance.</p>
      </div>
      <div class="page-header__actions">
        <span class="chip">${icon("calendar", { size: 13 })} ${cycleLabel()}</span>
        <a class="btn btn--secondary" href="#/reports">${icon("chart", { size: 15 })} Reports</a>
        <a class="btn btn--primary" href="#/bills">${icon("inbox", { size: 15 })} Review bills</a>
      </div>
    </div>
    ${content}
  </section>`;
}

function skeleton() {
  return html`
    <div class="stat-row">
      ${Array.from(
        { length: 4 },
        () => html`<div class="stat-card"><div class="skeleton" style="height:96px"></div></div>`,
      )}
    </div>
    <div class="card"><div class="card__body">${skeletonRows(4)}</div></div>
  `;
}

function body({ stats, properties, units, activity }) {
  const cards = html`
    <div class="stat-row">
      ${statCard({
        label: "Total Units",
        value: stats.totalUnits.value,
        iconName: "grid",
        accent: "#4f46e5",
        soft: "#eef2ff",
        delta: stats.totalUnits.delta,
        caption: `across ${properties.length} buildings`,
        href: "#/units",
      })}
      ${statCard({
        label: "Total Tenants",
        value: stats.totalTenants.value,
        iconName: "users",
        accent: "#0ea5e9",
        soft: "#f0f9ff",
        delta: stats.totalTenants.delta,
        caption: `${stats.occupancy}% occupancy`,
        href: "#/tenants",
      })}
      ${statCard({
        label: "Incoming Bills",
        value: stats.incomingBills.value,
        iconName: "inbox",
        accent: "#f59e0b",
        soft: "#fffbeb",
        delta: stats.incomingBills.delta,
        caption: "awaiting OCR validation",
        href: "#/bills",
      })}
      ${statCard({
        label: "Exception Queue",
        value: stats.exceptionQueue.value,
        iconName: "alert-triangle",
        accent: "#dc2626",
        soft: "#fef2f2",
        delta: stats.exceptionQueue.delta,
        goodWhenDown: true,
        caption: "records needing review",
        href: "#/bills?tab=exceptions",
      })}
    </div>
  `;

  const overview = html`
    <div class="dashboard-grid">
      <section class="card" aria-labelledby="overview-title">
        <div class="card__header">
          <div>
            <h2 class="card__title" id="overview-title">Property Overview</h2>
            <p class="card__subtitle">
              Buildings A–D · unit-level occupancy indicators
            </p>
          </div>
          <a class="btn btn--ghost btn--sm" href="#/properties"
            >All properties ${icon("arrow-right", { size: 14 })}</a
          >
        </div>
        <div class="card__body">
          ${propertyOverview({ properties, units })}
        </div>
      </section>

      <section class="card" aria-labelledby="attention-title">
        <div class="card__header">
          <div>
            <h2 class="card__title" id="attention-title">Needs attention</h2>
            <p class="card__subtitle">“Automate by default, intervene by exception”</p>
          </div>
          <span class="badge badge--danger">${count(stats.openExceptions)} open</span>
        </div>
        <div class="attention-list">
          ${attentionItems(stats)}
        </div>
        <div class="card__footer">
          <div class="quick-actions">
            <a class="quick-action" href="#/bills?tab=exceptions">
              <span class="quick-action__icon">${icon("alert-triangle", { size: 16 })}</span>
              Exception Queue
            </a>
            <a class="quick-action" href="#/bills?tab=incoming">
              <span class="quick-action__icon">${icon("inbox", { size: 16 })}</span>
              OCR intake
            </a>
          </div>
        </div>
      </section>
    </div>
  `;

  const activityCard = html`
    <section class="card" aria-labelledby="activity-title">
      <div class="card__header">
        <div>
          <h2 class="card__title" id="activity-title">Recent Activity</h2>
          <p class="card__subtitle">
            Utility bills, tenant payments and Exception Queue triggers
          </p>
        </div>
      </div>
      <div class="card__body card__body--flush" data-activity>
        ${recentActivity(activity, { href: "#/bills" })}
      </div>
    </section>
  `;

  return html`${cards}${overview}${activityCard}`;
}

function attentionItems(stats) {
  const items = [
    {
      icon: "alert-triangle",
      color: "#dc2626",
      bg: "#fef2f2",
      title: `${stats.openExceptions} records in the Exception Queue`,
      meta: "Duplicates, missing references and mapping failures",
      href: "#/bills?tab=exceptions",
    },
    {
      icon: "inbox",
      color: "#b45309",
      bg: "#fffbeb",
      title: `${stats.incomingBills.value} utility bills pending validation`,
      meta: "OCR extracted — confirm fields before finalising",
      href: "#/bills?tab=incoming",
    },
    {
      icon: "credit-card",
      color: "#4f46e5",
      bg: "#eef2ff",
      title: `${peso(stats.outstanding)} outstanding this cycle`,
      meta: "Unpaid and tenant-reported bills awaiting confirmation",
      href: "#/bills?tab=payments",
    },
  ];

  return html`${items.map(
    (item) => html`<a class="attention-item" href="${item.href}">
      <span class="attention-item__icon" style="--tone:${item.color};--tone-bg:${item.bg}"
        >${icon(item.icon, { size: 16 })}</span
      >
      <span class="attention-item__body">
        <span class="attention-item__title">${item.title}</span>
        <span class="attention-item__meta">${item.meta}</span>
      </span>
      <span class="attention-item__chevron">${icon("chevron-right", { size: 15 })}</span>
    </a>`,
  )}`;
}

function bind(container) {
  container.querySelector('[data-action="refresh-activity"]')?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.setAttribute("aria-disabled", "true");
    try {
      const activity = await api.get(endpoints.activity(8));
      const host = container.querySelector("[data-activity]");
      if (host) render(host, recentActivity(activity, { href: "#/bills" }));
      bind(container);
    } finally {
      button.removeAttribute("aria-disabled");
    }
  });
}

function cycleLabel() {
  return new Date().toLocaleDateString("en-PH", { month: "long", year: "numeric" });
}

export { relative, dateTime };
export default renderDashboard;
