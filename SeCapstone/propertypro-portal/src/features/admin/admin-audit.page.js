import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { badge } from "../../components/badge.js";
import { dataTable } from "../../components/data-table.js";
import { emptyState, skeletonRows } from "../../components/empty-state.js";
import { api } from "../../api/client.js";
import { endpoints } from "../../api/endpoints.js";
import { relative, dateTime } from "../../utils/format.js";
import { ROLE_LABEL } from "../../config/constants.js";

/** Admin Audit Log — read-only, system-maintenance scope. */
export async function renderAdminAudit(container) {
  render(container, frame(html`<div class="card"><div class="card__body">${skeletonRows(7)}</div></div>`));

  try {
    const entries = await api.get(endpoints.adminAudit(50));
    render(container, frame(table(entries)));
  } catch (error) {
    render(
      container,
      frame(
        emptyState({
          iconName: "alert-triangle",
          title: "Audit log could not be loaded",
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
          <span>Audit Log</span>
        </nav>
        <h1 id="page-title">Audit Log</h1>
        <p>Signed record of account, role and maintenance activity.</p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--secondary" type="button">${icon("download", { size: 15 })} Export</button>
      </div>
    </div>
    ${content}
  </section>`;
}

function table(entries) {
  return dataTable({
    ariaLabel: "Audit log",
    rows: entries,
    emptyTitle: "No audit entries",
    emptyIcon: "shield",
    toolbar: html`<span class="chip chip--accent">${icon("shield", { size: 12 })} Read-only</span>
      <span class="text-xs text-muted">${entries.length} entries</span>`,
    columns: [
      {
        key: "action",
        label: "Action",
        render: (row) => html`<span class="cell-stack">
          <strong>${row.action}</strong>
          <span>${row.target}</span>
        </span>`,
      },
      {
        key: "actor",
        label: "Actor",
        render: (row) => html`<span class="cell-stack">
          <strong>${row.actor}</strong>
          <span>${ROLE_LABEL[row.role] ?? row.role}</span>
        </span>`,
      },
      {
        key: "at",
        label: "When",
        width: "190px",
        render: (row) => html`<span class="time-cell" title="${dateTime(row.at)}"
          ><strong>${relative(row.at)}</strong>${dateTime(row.at)}</span
        >`,
      },
      {
        key: "id",
        label: "Entry",
        width: "120px",
        render: (row) => html`<span class="chip font-mono">${row.id}</span>`,
      },
    ],
    footer: html`<span>Audit retention is configured by the Admin</span>
      <span class="text-muted">Export requires system-maintenance permission</span>`,
  });
}

export { badge };
export default renderAdminAudit;
