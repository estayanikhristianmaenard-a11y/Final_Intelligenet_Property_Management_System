import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { badge } from "../../components/badge.js";
import { statCard } from "../../components/stat-card.js";
import { emptyState, skeletonRows } from "../../components/empty-state.js";
import { api } from "../../api/client.js";
import { endpoints } from "../../api/endpoints.js";
import { beginAction } from "../../components/action-feedback.js";
import { toastSuccess, toastDanger } from "../../components/toast.js";
import { relative, dateTime } from "../../utils/format.js";

/**
 * Admin Dashboard — **system maintenance only**.
 *
 * Deliberately contains no property, billing, payment-confirmation or
 * exception-review data: the study limits the Admin role to system-level
 * maintenance (paper §1.5). Everything here is component status, accounts and
 * audit visibility.
 *
 * @param {HTMLElement} container
 */
export async function renderAdminDashboard(container) {
  render(
    container,
    frame(
      html`<div class="stat-row">
          ${Array.from({ length: 3 }, () => html`<div class="stat-card" style="height:132px"><div class="skeleton full-width" style="height:100%"></div></div>`)}
        </div>
        <div class="card">
          <div class="card__body">${skeletonRows(4)}</div>
        </div>`,
    ),
  );

  const results = await Promise.allSettled([
    api.get(endpoints.adminServices()), api.get(endpoints.adminUsers()),
    api.get(endpoints.adminAudit(6, "maintenance")),
  ]);
  const snapshot = {};
  ["services","users","audit"].forEach((key,index) => {
    snapshot[key] = results[index].status === "fulfilled" ? results[index].value : null;
  });
  const paint = () => {
    if (!container.isConnected) return;
    render(container, frame(body(snapshot)));
    container.querySelector("[data-refresh-status]").addEventListener("click", async event => {
      const finish = beginAction(event.currentTarget,"Refreshing...");
      try {
        const services = await api.post("/admin/status",{});
        snapshot.services = services;
        const audit = await Promise.allSettled([api.get(endpoints.adminAudit(6,"maintenance"))]);
        snapshot.audit = audit[0].status === "fulfilled" ? audit[0].value : null;
        paint();
        container.querySelector("[data-refresh-status]")?.focus({preventScroll:true});
        toastSuccess("Status refreshed","Configuration and recorded results updated.");
      } catch {
        toastDanger("Status could not be refreshed","The previous snapshot is retained. Try again.");
      } finally { finish(); }
    });
  };
  paint();
}

function frame(content) {
  return html`<section class="page" aria-labelledby="page-title">
    <div class="page-header">
      <div class="page-header__title">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <span>Rentara</span>${icon("chevron-right", { size: 12 })}
          <span>Admin</span>${icon("chevron-right", { size: 12 })}
          <span>Dashboard</span>
        </nav>
        <h1 id="page-title">System Dashboard</h1>
        <p>System status and maintenance.</p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--secondary" type="button" data-refresh-status>
          ${icon("refresh", { size: 15 })} Refresh status
        </button>
      </div>
    </div>
    ${content}
  </section>`;
}

function body({ services, users, audit }) {
  const activeUsers = users?.filter((u) => u.status === "active").length;

  return html`
    <div class="stat-row">
      ${services ? statCard({
        label: "Status checks",
        value: services.length,
        iconName: "activity",
        accent: "#16a34a",
        soft: "#f0fdf4",
        caption: "configuration and recorded results",
      }) : unavailable("Status checks")}
      ${users ? statCard({
        label: "User accounts",
        value: users.length,
        iconName: "users",
        accent: "var(--primary-600)",
        soft: "var(--primary-50)",
        caption: `${activeUsers} active`,
      }) : unavailable("User accounts")}
      ${audit ? statCard({
        label: "Recent maintenance",
        value: audit.length,
        iconName: "shield",
        accent: "#8b5cf6",
        soft: "#f5f3ff",
        caption: "latest six events",
      }) : unavailable("Recent maintenance")}
    </div>

    <div class="dashboard-grid">
      <section class="card" aria-labelledby="services-title">
        <div class="card__header">
          <div>
            <h2 class="card__title" id="services-title">System status</h2>
            <p class="text-xs text-muted">Configuration and recorded results; not a full system test.</p>
          </div>
        </div>
        ${services ? statusGroups(services) : unavailable("System status")}
        <div class="card__footer">
          <div class="quick-actions">
            <button class="quick-action" type="button">
              <span class="quick-action__icon"
                >${icon("database", { size: 16 })}</span
              >
              Back up database
            </button>
            <button class="quick-action" type="button">
              <span class="quick-action__icon"
                >${icon("refresh", { size: 16 })}</span
              >
              Restart OCR worker
            </button>
            <button class="quick-action" type="button">
              <span class="quick-action__icon"
                >${icon("archive", { size: 16 })}</span
              >
              Purge temp files
            </button>
          </div>
        </div>
      </section>

      <section class="card" aria-labelledby="audit-title">
        <div class="card__header">
          <div>
            <h2 class="card__title" id="audit-title">Recent maintenance</h2>
          </div>
          <a class="btn btn--ghost btn--sm" href="#/admin/audit"
            >Full log ${icon("arrow-right", { size: 14 })}</a
          >
        </div>
        <div class="mini-list" style="padding:0 var(--space-5) var(--space-4)">
          ${!audit ? unavailable("Recent maintenance") : !audit.length ? emptyState({iconName:"shield",title:"No maintenance events yet",body:"System maintenance and account events will appear here."}) : audit.map(
            (entry) =>
              html`<div class="mini-list__item">
                <span class="mini-list__icon"
                  >${icon("shield", { size: 15 })}</span
                >
                <span class="mini-list__body">
                  <strong>${entry.action}</strong>
                  <span>${entry.actor} · ${entry.target}</span>
                </span>
                <span class="mini-list__end">
                  <span class="text-xs text-muted" title="${dateTime(entry.at)}"
                    >${relative(entry.at)}</span
                  >
                </span>
              </div>`,
          )}
        </div>
      </section>
    </div>

  `;
}

export default renderAdminDashboard;

function unavailable(title) {
  return html`<div class="card__body" role="status"><strong>${title} unavailable</strong><p class="text-sm text-muted">Other sections remain available. Reload to try again.</p></div>`;
}
const states = {
  available:["Available","neutral"], recorded_success:["Recorded success","success"],
  not_configured:["Not configured","neutral"], disabled:["Disabled","neutral"],
  unverified:["Not verified","warning"], last_attempt_failed:["Last attempt failed","danger"],
  unavailable:["Unavailable","danger"],
};
function statusGroups(services) {
  const groups = Map.groupBy(services, row => row.workspaceId ?? "default");
  return html`<div class="system-status-list">
    <p class="system-status-checked text-xs text-muted">Last checked: ${services[0]?.checkedAt ? dateTime(services[0].checkedAt) : "Not recorded"}</p>
    ${[...groups.values()].map((rows,index) => html`<details class="status-workspace" ${index === 0 ? html`open` : null}>
      <summary>${rows[0].workspaceName ?? "Current workspace"}<span class="text-xs text-muted">${rows.length} checks</span></summary>
      ${rows.map(row => {
        const [label,tone] = states[row.state] ?? states.unverified;
        return html`<article class="system-status-item">
          <div class="system-status-heading"><strong>${row.name}</strong>${badge(label,tone)}</div>
          <p class="text-sm">${row.detail}</p>
          <p class="text-xs text-muted">${row.nextStep}</p>
          <details class="service-evidence"><summary>What was checked</summary>
            <dl><dt>Method</dt><dd>${row.method}</dd><dt>Limits</dt><dd>${row.limitation}</dd>
            <dt>Checked</dt><dd>${row.checkedAt ? dateTime(row.checkedAt) : "Not recorded"}</dd>
            <dt>Last attempt</dt><dd>${row.lastAttemptAt ? dateTime(row.lastAttemptAt) : "Not recorded"}</dd>
            <dt>Last success</dt><dd>${row.lastSuccessAt ? dateTime(row.lastSuccessAt) : "Not recorded"}</dd></dl>
          </details>
        </article>`;
      })}
    </details>`)}
  </div>`;
}
