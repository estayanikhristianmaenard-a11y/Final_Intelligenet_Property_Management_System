import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { dataTable, bindRowClicks } from "../../components/data-table.js";
import { badge } from "../../components/badge.js";
import { skeletonRows, emptyState } from "../../components/empty-state.js";
import { openTenantPanel } from "./tenant-details.panel.js";
import { api } from "../../api/client.js";
import { endpoints } from "../../api/endpoints.js";
import { peso, initials, avatarTone, date } from "../../utils/format.js";

/**
 * Tenants directory.
 * Selecting a row opens the slide-out Tenant Details panel.
 *
 * @param {HTMLElement} container
 * @param {{query:URLSearchParams}} ctx
 */
export async function renderTenants(
  container,
  { query = new URLSearchParams() } = {},
) {
  let keyword = query.get("q") ?? "";
  let propertyFilter = query.get("property") ?? "";
  let unbind = null;
  let properties = [];

  const paint = (tenants, { loading = false } = {}) => {
    unbind?.();
    render(
      container,
      frame(table(tenants, { loading, keyword, propertyFilter, properties })),
    );
    unbind = bindRowClicks(container, (id) =>
      openTenantPanel(id, { onChanged: load }),
    );
    bindControls();
  };

  const load = async () => {
    properties = await api.get(endpoints.properties());
    const tenants = await api.get(
      endpoints.tenants({ q: keyword, propertyId: propertyFilter }),
    );
    paint(tenants);
  };

  function bindControls() {
    const search = container.querySelector('[data-role="tenant-search"]');
    search?.addEventListener("input", (event) => {
      keyword = event.target.value;
      clearTimeout(bindControls._t);
      bindControls._t = setTimeout(load, 220);
    });

    container.querySelectorAll("[data-property-filter]").forEach((chip) => {
      chip.addEventListener("click", () => {
        propertyFilter =
          chip.getAttribute("data-property-filter") === propertyFilter
            ? ""
            : chip.getAttribute("data-property-filter");
        load();
      });
    });
  }

  render(container, frame(table([], { loading: true })));
  try {
    await load();
  } catch (error) {
    render(
      container,
      frame(
        emptyState({
          iconName: "alert-triangle",
          title: "Tenants could not be loaded",
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
          <span>Portfolio</span>${icon("chevron-right", { size: 12 })}
          <span>Tenants</span>
        </nav>
        <h1 id="page-title">Tenants</h1>
        <p>Select a tenant to open their details panel.</p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--secondary" type="button">
          ${icon("download", { size: 15 })} Export
        </button>
        <button class="btn btn--primary" type="button">
          ${icon("plus", { size: 15 })} Add tenant
        </button>
      </div>
    </div>
    ${content}
  </section>`;
}

function table(tenants, { loading, keyword, propertyFilter, properties = [] }) {
  const toolbar = html`
    <span class="field-inline">
      ${icon("search", { size: 15 })}
      <input
        type="search"
        placeholder="Search name, unit or e-mail…"
        value="${keyword}"
        data-role="tenant-search"
        aria-label="Search tenants"
      />
    </span>
    ${(properties ?? []).map(
      (id) =>
        html`<button
          class="filter-chip ${propertyFilter === id.id ? "is-active" : ""}"
          type="button"
          data-property-filter="${id.id}"
        >
          ${id.name}
        </button>`,
    )}
    <span class="table-toolbar__spacer"></span>
    <span class="text-xs text-muted"
      >${loading ? "Loading…" : `${tenants.length} tenants`}</span
    >
  `;

  if (loading) {
    return html`<div class="card">
      <div class="table-toolbar">${toolbar}</div>
      ${skeletonRows(6)}
    </div>`;
  }

  return dataTable({
    ariaLabel: "Tenants",
    rows: tenants,
    clickable: true,
    toolbar,
    emptyTitle: "No tenants match your filters",
    emptyBody: "Try clearing the search box or the building filter.",
    emptyIcon: "users",
    columns: [
      {
        key: "fullName",
        label: "Tenant",
        render: (row) =>
          html`<span class="cell-entity">
            <span class="avatar ${avatarTone(row.fullName)}"
              >${initials(row.fullName)}</span
            >
            <span class="cell-entity__meta">
              <strong>${row.fullName}</strong>
              <span>${row.email}</span>
            </span>
          </span>`,
      },
      {
        key: "unitCode",
        label: "Unit",
        render: (row) =>
          html`<span class="cell-stack">
            <strong class="font-mono">${row.unitCode}</strong>
            <span>${row.propertyName} · ${row.floor}</span>
          </span>`,
      },
      {
        key: "arrangement",
        label: "Arrangement",
        render: (row) =>
          badge(
            row.arrangement === "shared_occupancy" ? "Shared" : "Individual",
            row.arrangement === "shared_occupancy" ? "violet" : "neutral",
          ),
      },
      {
        key: "monthlyRent",
        label: "Monthly rent",
        render: (row) =>
          html`<span class="money">${peso(row.monthlyRent)}</span>`,
      },
      {
        key: "leaseStart",
        label: "Lease start",
        render: (row) =>
          html`<span class="text-xs">${date(row.leaseStart)}</span>`,
      },
      {
        key: "occupancy",
        label: "Status",
        render: (row) =>
          row.occupancy === "active"
            ? badge("Active", "success", { dot: true })
            : badge("On notice", "warning", { dot: true }),
      },
      {
        key: "actions",
        label: "",
        className: "cell-actions",
        render: (row) =>
          html`<button
              class="btn btn--ghost btn--sm"
              data-edit-entity="tenants"
              data-id="${row.id}"
              data-no-row
            >
              Edit / end lease</button
            ><button
              class="btn btn--ghost btn--sm"
              data-delete-entity="tenants"
              data-id="${row.id}"
              data-no-row
            >
              Delete
            </button>`,
      },
    ],
    footer: html`<span>Click any row to open the Tenant Details panel</span>
      <span class="text-muted">Role permissions are enforced per action</span>`,
  });
}

export default renderTenants;
