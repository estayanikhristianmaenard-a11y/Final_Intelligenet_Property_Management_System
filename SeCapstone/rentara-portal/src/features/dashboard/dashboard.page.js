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
    const [stats, properties, units, activity, payments, proposals, exceptions] = await Promise.all([
      api.get(endpoints.dashboardStats()),
      api.get(endpoints.properties()),
      api.get(endpoints.units()),
      api.get(endpoints.activity(8)),
      api.get(endpoints.payments()),
      api.get("/correction-proposals"),
      api.get(endpoints.exceptions()),
    ]);

    render(container, pageFrame(body({ stats, properties, units, activity, payments, proposals, exceptions })));
    bind(container, activity.items);
  } catch (error) {
    render(
      container,
      pageFrame(
        emptyState({
          iconName: "alert-triangle",
          title: "Dashboard data could not be loaded",
          body: error.message,
            action: html`<button type="button" class="btn btn--secondary" data-retry-page>Try again</button>`,
        }),
      ),
    );
    container.querySelector("[data-retry-page]").onclick = () => renderDashboard(container);
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

function body({ stats, properties, units, activity, payments, proposals, exceptions }) {
  const pending = payments.filter(payment => payment.status === "tenant_reported_paid" && !payment.rejectedOn);
  const pendingProposals = proposals.filter(p => p.state === "pending");
  const escalated = exceptions.filter(e => e.state === "open" && e.responsibility === "manager" && !proposals.some(p => p.sourceId === e.sourceId && p.state === "pending"));
  const decisions = [
    ...pendingProposals.map(p => ({ title:p.filename, detail:`Correction prepared by ${p.preparerName}`, at:p.createdAt, href:"#/bills?tab=exceptions&queue=manager", action:"Review proposal" })),
    ...pending.map(p => ({ title:`Rent report · ${p.tenantName}`, detail:"Reported payment · confirm after external checking", at:p.reportedOn, amount:p.amount, href:"#/bills?tab=payments", action:"Review rent report" })),
    ...escalated.map(e => ({ title:e.title, detail:e.reason, at:e.createdAt, href:"#/bills?tab=exceptions&queue=manager", action:"Review case" })),
  ].sort((a,b) => String(a.at ?? "").localeCompare(String(b.at ?? "")));
  const review = html`<section class="card manager-review-queue" aria-labelledby="review-queue-title">
    <div class="card__header"><div><h2 class="card__title" id="review-queue-title">Your decisions</h2><p class="card__subtitle">${decisions.length ? `${count(decisions.length)} waiting for your review` : "You are up to date"}</p></div></div>
    <div class="manager-review-queue__rows">
      ${queueRow("Staff proposals", proposals.filter(p => p.state === "pending").length, "#/bills?tab=exceptions&queue=manager", "Prepared corrections awaiting your decision")}
      ${queueRow("Rent reports", pending.length, "#/bills?tab=payments", pending.length ? "Confirm after checking payment" : "No reports waiting")}
      ${queueRow("Escalated cases", escalated.length, "#/bills?tab=exceptions&queue=manager", escalated.length ? "Staff needs your authority or guidance" : "No escalated cases waiting")}
    </div>
    <div class="decision-list">${decisions.length ? decisions.slice(0,6).map(decisionRow) : html`<div class="decision-list__empty">${icon("check-circle",{size:24})}<div><strong>Nothing needs your decision.</strong><p>Valid bills continue automatically. Staff proposals, rent reports, and escalated cases will appear here.</p></div></div>`}</div>
    ${decisions.length > 6 ? html`<p class="decision-list__more">Showing the oldest 6 of ${count(decisions.length)}. Use the queues above to see all waiting work.</p>` : null}
  </section>`;
  const overviewMetrics = html`<div class="manager-overview" aria-label="Portfolio summary">
    <a class="manager-overview__item" href="#/units"><span>Units</span><strong>${count(stats.totalUnits.value)}</strong></a>
    <a class="manager-overview__item" href="#/tenants"><span>Active tenants</span><strong>${count(stats.totalTenants.value)}</strong></a>
    <a class="manager-overview__item" href="#/bills?tab=payments"><span>Outstanding rent and advance</span><strong>${peso(stats.outstanding)}</strong></a>
  </div>`;

  const overview = html`
      <section class="card manager-property-overview" aria-labelledby="overview-title">
        <div class="card__header">
          <div>
            <h2 class="card__title" id="overview-title">By property</h2>
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
          <h2 class="card__title" id="activity-title">Recent activity</h2>
        </div>
      </div>
      <div class="card__body card__body--flush" data-activity>
        ${recentActivity(activity, { href: "#/bills", onRefresh: () => {} })}
      </div>
    </section>
  `;

  return html`${review}${overviewMetrics}<div class="manager-content-grid">${overview}${activityCard}</div>`;
}

function decisionRow(item) {
  const at = item.at ? new Date(item.at) : null;
  const dated = at && Number.isFinite(at.getTime());
  return html`<a class="decision-item" href="${item.href}">
    <span class="decision-item__date" title="${dated ? `Submitted ${dateTime(item.at)}` : "Submission date unavailable"}"><small>${dated ? at.toLocaleString("en-PH",{month:"short",timeZone:"Asia/Manila"}) : "Date"}</small><strong>${dated ? at.toLocaleString("en-PH",{day:"2-digit",timeZone:"Asia/Manila"}) : "—"}</strong></span>
    <span class="decision-item__body"><strong>${item.title}</strong><small>${item.detail}</small></span>
    <span class="decision-item__end">${item.amount != null ? html`<strong class="decision-item__amount" aria-label="Reported amount">${peso(item.amount)}</strong>` : null}<span>${item.action} ›</span></span>
  </a>`;
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
