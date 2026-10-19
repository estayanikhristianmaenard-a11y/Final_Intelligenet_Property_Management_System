import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { propertyOverview } from "./property-overview.js";
import { recentActivity } from "./recent-activity.js";
import { emptyState, skeletonRows } from "../../components/empty-state.js";
import { api } from "../../api/client.js";
import { endpoints } from "../../api/endpoints.js";
import { peso, count, dateTime, relative } from "../../utils/format.js";
import { toastDanger } from "../../components/toast.js";

/**
 * Manager Dashboard — the primary Phase 1 landing view.
 *
 * Puts work waiting for the Manager first, followed by a compact portfolio
 * summary, property occupancy, and recent activity.
 *
 * @param {HTMLElement} container
 */
export async function renderDashboard(container) {
  render(container, pageFrame(skeleton()));

  try {
    const [stats, properties, units, activity, payments] = await Promise.all([
      api.get(endpoints.dashboardStats()),
      api.get(endpoints.properties()),
      api.get(endpoints.units()),
      api.get(endpoints.activity(8)),
      api.get(endpoints.payments()),
    ]);

    render(container, pageFrame(body({ stats, properties, units, activity, payments })));
    bind(container, activity.items);
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
          <span>Rentara</span>${icon("chevron-right", { size: 12 })}
          <span>Manager</span>${icon("chevron-right", { size: 12 })}
          <span>Dashboard</span>
        </nav>
        <h1 id="page-title">Dashboard</h1>
      </div>
      <div class="page-header__actions">
        <span class="chip"
          >${icon("calendar", { size: 13 })} ${cycleLabel()}</span
        >
        <a class="btn btn--primary" href="#/bills?tab=incoming"
          >${icon("inbox", { size: 15 })} Open bill intake</a
        >
      </div>
    </div>
    ${content}
  </section>`;
}

function skeleton() {
  return html`
    <div class="card manager-review-queue">
      <div class="card__body">${skeletonRows(3)}</div>
    </div>
    <div class="manager-overview"><span class="skeleton" style="height:72px"></span><span class="skeleton" style="height:72px"></span><span class="skeleton" style="height:72px"></span></div>
    <div class="card"><div class="card__body">${skeletonRows(4)}</div></div>
  `;
}

function body({ stats, properties, units, activity, payments }) {
  const pending = payments.filter(payment => payment.status === "tenant_reported_paid" && !payment.rejectedOn);
  const review = html`<section class="card manager-review-queue" aria-labelledby="review-queue-title">
    <div class="card__header"><div><h2 class="card__title" id="review-queue-title">Needs review</h2></div></div>
    <div class="manager-review-queue__rows">
      ${queueRow("Rent reports", pending.length, "#/bills?tab=payments", pending.length ? "Confirm after checking payment" : "No reports waiting")}
      ${queueRow("Utility bills", stats.incomingBills.value, "#/bills?tab=incoming", stats.incomingBills.value ? "Validate extracted details" : "No bills waiting to validate")}
      ${queueRow("Exceptions", stats.openExceptions, "#/bills?tab=exceptions", stats.openExceptions ? "Correct and recheck records" : "Queue is clear")}
    </div>
  </section>`;
  const overviewMetrics = html`<div class="manager-overview" aria-label="Portfolio summary">
    <a class="manager-overview__item" href="#/units"><span>Units</span><strong>${count(stats.totalUnits.value)}</strong></a>
    <a class="manager-overview__item" href="#/tenants"><span>Active tenants</span><strong>${count(stats.totalTenants.value)}</strong></a>
    <a class="manager-overview__item" href="#/bills?tab=payments"><span>Outstanding charges</span><strong>${peso(stats.outstanding)}</strong></a>
  </div>`;

  const overview = html`
      <section class="card manager-property-overview" aria-labelledby="overview-title">
        <div class="card__header">
          <div>
            <h2 class="card__title" id="overview-title">Property Overview</h2>
          </div>
          <a class="btn btn--ghost btn--sm" href="#/properties"
            >All properties ${icon("arrow-right", { size: 14 })}</a
          >
        </div>
        <div class="card__body">${propertyOverview({ properties, units })}</div>
      </section>

  `;

  const activityCard = html`
    <section class="card" aria-labelledby="activity-title">
      <div class="card__header">
        <div>
          <h2 class="card__title" id="activity-title">Recent Activity</h2>
        </div>
      </div>
      <div class="card__body card__body--flush" data-activity>
        ${recentActivity(activity, { href: "#/bills", onRefresh: () => {} })}
      </div>
    </section>
  `;

  return html`${review}${overviewMetrics}${overview}${activityCard}`;
}

function queueRow(label, total, href, detail) {
  return html`<a class="manager-review-queue__row" href="${href}">
    <span><strong>${label}</strong><small>${detail}</small></span>
    <span class="manager-review-queue__count ${total ? "is-pending" : ""}">${count(total)}</span>
    ${icon("chevron-right", { size: 16 })}
  </a>`;
}

function bind(container, items = []) {
  container.querySelectorAll("[data-activity] [data-row-id]").forEach((row) => {
    const open = () => {
      const href =
        items.find((i) => i.id === row.dataset.rowId)?.href ?? "#/bills";
      location.hash = href;
    };
    row.addEventListener("click", open);
    row.addEventListener("keydown", (event) => {
      if (["Enter", " "].includes(event.key)) {
        event.preventDefault();
        open();
      }
    });
  });
  container
    .querySelector('[data-action="refresh-activity"]')
    ?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      if (button.disabled) return;
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
      try {
        const activity = await api.get(endpoints.activity(8));
        const host = container.querySelector("[data-activity]");
        if (host)
          render(
            host,
            recentActivity(activity, { href: "#/bills", onRefresh: () => {} }),
          );
        bind(container, activity.items);
      } catch(error) {
        toastDanger("Activity refresh failed",error.message);
      } finally {
        button.disabled = false;
        button.removeAttribute("aria-disabled");
      }
    });
}

function cycleLabel() {
  return new Date().toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });
}

export { relative, dateTime };
export default renderDashboard;
