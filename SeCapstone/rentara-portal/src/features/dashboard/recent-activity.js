import { html } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { activityBadge } from "../../components/badge.js";
import { dataTable } from "../../components/data-table.js";
import { relative, dateTime } from "../../utils/format.js";

/**
 * Recent Activity data table.
 *
 * Dynamically lists workflow events — "Utility Bill Received", "Tenant
 * Payment", "Exception Queue" triggers, payment confirmations, receipts and
 * Web Push notifications — each with a timestamp and one of the four
 * workflow statuses: Pending, Paid, Unpaid, Review.
 *
 * @param {{items:Array, total?:number}} data
 * @param {{onRefresh?:()=>void, href?:string}} [options]
 */
export function recentActivity(data, { onRefresh, href = "" } = {}) {
  const rows = data.items ?? [];

  return dataTable({
    ariaLabel: "Recent activity",
    rows,
    rowIdKey: "id",
    clickable: Boolean(href),
    emptyTitle: "No activity recorded yet",
    emptyBody: "Events appear here as utility bills arrive and payments are reported.",
    emptyIcon: "activity",
    toolbar: html`
      <span class="table-toolbar__spacer"></span>
      ${onRefresh
        ? html`<button class="btn btn--ghost btn--sm" type="button" data-action="refresh-activity">
            ${icon("refresh", { size: 14 })} Refresh
          </button>`
        : null}
      ${href ? html`<a class="btn btn--secondary btn--sm" href="${href}">View all</a>` : null}
    `,
    columns: [
      {
        key: "type",
        label: "Event",
        width: "30%",
        render: (row) => {
          const meta = EVENT_META[row.type] ?? EVENT_META.default;
          return html`<span class="activity-event">
            <span
              class="activity-event__icon"
              style="--tone:${meta.color};--tone-bg:${meta.bg}"
              >${icon(meta.icon, { size: 15 })}</span
            >
            <span style="min-width:0">
              <span class="activity-event__label">${row.type}</span>
              <span class="activity-event__ref truncate">${row.subject}</span>
            </span>
          </span>`;
        },
      },
      {
        key: "actor",
        label: "Triggered by",
        render: (row) =>
          html`<span class="cell-stack">
            <strong>${row.actor ?? "System"}</strong>
            <span>${row.href ? routeLabel(row.href) : "Workflow rule"}</span>
          </span>`,
      },
      {
        key: "status",
        label: "Status",
        width: "130px",
        render: (row) => activityBadge(row.status),
      },
      {
        key: "timestamp",
        label: "Timestamp",
        width: "160px",
        render: (row) =>
          html`<span class="time-cell" title="${dateTime(row.timestamp)}">
            <strong>${relative(row.timestamp)}</strong>${dateTime(row.timestamp)}
          </span>`,
      },
    ],
    footer: html`<span>
        Showing ${rows.length} of ${data.total ?? rows.length} recorded events
      </span>`,
  });
}

const EVENT_META = {
  "Utility Bill Received": { icon: "inbox", color: "#0284c7", bg: "#e0f2fe" },
  "Tenant Payment": { icon: "credit-card", color: "var(--primary-600)", bg: "var(--primary-50)" },
  "Exception Queue": { icon: "alert-triangle", color: "#b45309", bg: "#fef3c7" },
  "Payment Confirmed": { icon: "check-circle", color: "#16a34a", bg: "#dcfce7" },
  "Receipt Generated": { icon: "file", color: "#16a34a", bg: "#dcfce7" },
  "Web Push Notification": { icon: "bell", color: "#7c3aed", bg: "#ede9fe" },
  "Bill Finalized": { icon: "receipt", color: "var(--primary-600)", bg: "var(--primary-50)" },
  "Correction Applied": { icon: "edit", color: "#64748b", bg: "#f1f5f9" },
  default: { icon: "activity", color: "#64748b", bg: "#f1f5f9" },
};

function routeLabel(href) {
  const map = {
    "#/bills": "Bills & Payments",
    "#/tenants": "Tenants",
    "#/tenant/notifications": "Tenant notifications",
  };
  return map[href] ?? "Portal";
}

export default recentActivity;
