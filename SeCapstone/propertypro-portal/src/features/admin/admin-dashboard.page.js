import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { badge } from "../../components/badge.js";
import { statCard } from "../../components/stat-card.js";
import { emptyState, skeletonRows } from "../../components/empty-state.js";
import { api } from "../../api/client.js";
import { endpoints } from "../../api/endpoints.js";
import { count, relative, dateTime } from "../../utils/format.js";

/**
 * Admin Dashboard — **system maintenance only**.
 *
 * Deliberately contains no property, billing, payment-confirmation or
 * exception-review data: the study limits the Admin role to system-level
 * maintenance (paper §1.5). Everything here is service health, accounts and
 * audit visibility.
 *
 * @param {HTMLElement} container
 */
export async function renderAdminDashboard(container) {
  render(
    container,
    frame(
      html`<div class="stat-row">
          ${Array.from({ length: 4 }, () => html`<div class="stat-card" style="height:132px"><div class="skeleton full-width" style="height:100%"></div></div>`)}
        </div>
        <div class="card">
          <div class="card__body">${skeletonRows(4)}</div>
        </div>`,
    ),
  );

  try {
    const [services, users, audit] = await Promise.all([
      api.get(endpoints.adminServices()),
      api.get(endpoints.adminUsers()),
      api.get(endpoints.adminAudit(6)),
    ]);
    render(container, frame(body({ services, users, audit })));
  } catch (error) {
    render(
      container,
      frame(
        emptyState({
          iconName: "alert-triangle",
          title: "System status could not be loaded",
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
          <span>Admin</span>${icon("chevron-right", { size: 12 })}
          <span>Dashboard</span>
        </nav>
        <h1 id="page-title">System Dashboard</h1>
        <p>Service health, accounts and maintenance activity.</p>
      </div>
      <div class="page-header__actions">
        <span class="chip">${icon("shield", { size: 13 })} Admin scope</span>
        <button class="btn btn--secondary" type="button">
          ${icon("refresh", { size: 15 })} Run health check
        </button>
      </div>
    </div>
    ${content}
  </section>`;
}

function body({ services, users, audit }) {
  const operational = services.filter((s) => s.status === "operational").length;
  const activeUsers = users.filter((u) => u.status === "active").length;

  return html`
    <div class="stat-row">
      ${statCard({
        label: "Services online",
        value: operational,
        iconName: "activity",
        accent: "#16a34a",
        soft: "#f0fdf4",
        caption: `of ${services.length} monitored`,
      })}
      ${statCard({
        label: "User accounts",
        value: users.length,
        iconName: "users",
        accent: "#4f46e5",
        soft: "#eef2ff",
        caption: `${activeUsers} active`,
      })}
      ${statCard({
        label: "Roles defined",
        value: 3,
        iconName: "key",
        accent: "#0ea5e9",
        soft: "#f0f9ff",
        caption: "Admin · Manager · Tenant",
      })}
      ${statCard({
        label: "Audit entries",
        value: audit.length,
        iconName: "shield",
        accent: "#8b5cf6",
        soft: "#f5f3ff",
        caption: "recent activity retained",
      })}
    </div>

    <div class="dashboard-grid">
      <section class="card" aria-labelledby="services-title">
        <div class="card__header">
          <div>
            <h2 class="card__title" id="services-title">Service health</h2>
            <p class="card__subtitle">
              Components maintained by the Admin role
            </p>
          </div>
          <span class="badge badge--success"
            >${operational}/${services.length} operational</span
          >
        </div>
        <div>
          ${services.map(
            (service) =>
              html`<div class="service-row">
                <span class="service-row__name">
                  <i
                    class="status-pip ${service.status === "operational" ? "" : "status-pip--warn"}"
                  ></i>
                  ${service.name}
                </span>
                <span class="row row-3">
                  <span class="text-xs text-muted">${service.detail}</span>
                  ${
                    service.status === "operational"
                      ? badge("Healthy", "success")
                      : badge("Degraded", "warning")
                  }
                </span>
              </div>`,
          )}
        </div>
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
            <p class="card__subtitle">Recorded audit entries</p>
          </div>
          <a class="btn btn--ghost btn--sm" href="#/admin/audit"
            >Full log ${icon("arrow-right", { size: 14 })}</a
          >
        </div>
        <div class="mini-list" style="padding:0 var(--space-5) var(--space-4)">
          ${audit.map(
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

    <div class="notice-strip notice-strip--info">
      <span class="notice-strip__icon">${icon("info", { size: 14 })}</span>
      <span>
        The Admin role is intentionally scoped to system maintenance. Property,
        unit, tenant, billing, payment-confirmation and Exception Queue
        functions are not granted to this role.
      </span>
    </div>
  `;
}

export default renderAdminDashboard;
