import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { unitStatusBadge, badge } from "../../components/badge.js";
import { skeletonRows, emptyState } from "../../components/empty-state.js";
import { openTenantPanel } from "../tenants/tenant-details.panel.js";
import { api } from "../../api/client.js";
import { endpoints } from "../../api/endpoints.js";
import { peso, initials, avatarTone } from "../../utils/format.js";
import { UNIT_STATUS_META } from "../../config/constants.js";

/**
 * Units page — grouped by floor, filterable by building.
 * Occupied rows drill into the Tenant Details panel.
 *
 * @param {HTMLElement} container
 * @param {{query:URLSearchParams}} ctx
 */
export async function renderUnits(
  container,
  { query = new URLSearchParams() } = {},
) {
  let propertyId = query.get("property") ?? "";
  let statusFilter = "";
  let properties = [];

  const load = async () => {
    properties = await api.get(endpoints.properties());
    const units = await api.get(
      endpoints.units({ propertyId, status: statusFilter }),
    );
    paint(units);
    bind();
  };

  const paint = (units) => {
    render(container, frame(content(units), { propertyId, properties }));
  };

  function bind() {
    container.querySelectorAll("[data-building]").forEach((chip) => {
      chip.addEventListener("click", () => {
        propertyId = chip.getAttribute("data-building");
        history.replaceState(
          null,
          "",
          `#/units${propertyId ? `?property=${propertyId}` : ""}`,
        );
        load();
      });
    });
    container.querySelectorAll("[data-status]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const value = chip.getAttribute("data-status");
        statusFilter = statusFilter === value ? "" : value;
        load();
      });
    });
    container.querySelectorAll("[data-open-tenant]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.getAttribute("data-open-tenant");
        if (id) openTenantPanel(id);
      });
    });
  }

  render(
    container,
    frame(
      html`<div class="card">
        <div class="card__body">${skeletonRows(6)}</div>
      </div>`,
      { propertyId, properties },
    ),
  );
  try {
    await load();
  } catch (error) {
    render(
      container,
      frame(
        emptyState({
          iconName: "alert-triangle",
          title: "Units could not be loaded",
          body: error.message,
        }),
      ),
      { propertyId, properties },
    );
  }
}

function frame(content, { propertyId, properties }) {
  const buildings = properties ?? [];

  return html`<section class="page" aria-labelledby="page-title">
    <div class="page-header">
      <div class="page-header__title">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <span>Rentara</span>${icon("chevron-right", { size: 12 })}
          <span>Portfolio</span>${icon("chevron-right", { size: 12 })}
          <span>Units</span>
        </nav>
        <h1 id="page-title">Units</h1>
        <p>Unit register with occupancy, arrangement and rent configuration.</p>
      </div>
      <div class="page-header__actions">
        <button data-manager-only class="btn btn--primary" type="button">
          ${icon("plus", { size: 15 })} Add unit
        </button>
      </div>
    </div>

    <div
      class="filter-bar"
      style="border:1px solid var(--border-subtle);border-radius:12px;margin-bottom:var(--space-4);background:#fff"
    >
      <span class="text-xs font-semibold text-muted">Building</span>
      <button
        class="filter-chip ${!propertyId ? "is-active" : ""}"
        data-building=""
      >
        All properties
      </button>
      ${buildings.map(
        (id) =>
          html`<button
            class="filter-chip ${propertyId === id.id ? "is-active" : ""}"
            type="button"
            data-building="${id.id}"
          >
            ${id.name}
          </button>`,
      )}
      <span
        style="width:1px;height:20px;background:var(--border-default)"
      ></span>
      <span class="text-xs font-semibold text-muted">Status</span>
      ${Object.entries(UNIT_STATUS_META).map(
        ([key, meta]) =>
          html`<button class="filter-chip" type="button" data-status="${key}">
            ${meta.label}
          </button>`,
      )}
    </div>

    ${content}
  </section>`;
}

function content(units) {
  if (!units.length) {
    return emptyState({
      iconName: "grid",
      title: "No units match the current filters",
      body: "Clear the building or status filter to see the full register.",
    });
  }

  const floors = groupByFloor(units);

  return html`<div class="card">
    ${floors.map(
      (group) =>
        html`<div class="floor-group">
          <div class="floor-group__head">
            <span>${group.floor}</span>
            <span
              >${group.units.length} units ·
              ${group.units.filter((u) => u.status === "occupied").length}
              occupied</span
            >
          </div>
          <div class="table-wrap">
            <table class="data-table" aria-label="${group.floor} units">
              <thead>
                <tr>
                  <th scope="col">Unit</th>
                  <th scope="col">Type</th>
                  <th scope="col">Occupant</th>
                  <th scope="col">Arrangement</th>
                  <th scope="col">Monthly rent</th>
                  <th scope="col">Status</th>
                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody>
                ${group.units.map((unit) => unitRow(unit))}
              </tbody>
            </table>
          </div>
        </div>`,
    )}
  </div>`;
}

function unitRow(unit) {
  const hasTenant = Boolean(unit.tenantId);

  return html`<tr class="${hasTenant ? "is-clickable" : ""}">
    <td>
      <span class="unit-cell">
        <span class="unit-cell__code">${unit.code}</span>
        ${unit.status === "maintenance" ? badge("Under repair", "danger") : null}
      </span>
    </td>
    <td class="text-xs">${unit.type}</td>
    <td>
      ${
        hasTenant
          ? html`<span class="cell-entity">
              <span class="avatar avatar--sm ${avatarTone(unit.tenantName)}"
                >${initials(unit.tenantName)}</span
              >
              <span class="cell-entity__meta"
                ><strong>${unit.tenantName}</strong></span
              >
            </span>`
          : html`<span class="text-xs text-muted">— vacant —</span>`
      }
    </td>
    <td>
      ${
        unit.arrangement === "shared_occupancy"
          ? badge(`Shared · ${unit.occupants}`, "violet")
          : badge("Individual", "neutral")
      }
    </td>
    <td><span class="money">${peso(unit.monthlyRent)}</span></td>
    <td>${unitStatusBadge(unit.status)}</td>
    <td class="cell-actions">
      ${
        hasTenant
          ? html`<button
              class="btn btn--soft btn--sm"
              type="button"
              data-open-tenant="${unit.tenantId}"
            >
              Details
            </button>`
          : html`<button
              class="btn btn--secondary btn--sm"
              type="button"
              data-assign="${unit.id}"
            >
              Assign
            </button>`
      }
      <button
        class="btn btn--ghost btn--sm"
        data-edit-entity="units"
        data-id="${unit.id}"
      >
        Edit
      </button>
      <button
        class="btn btn--ghost btn--sm"
        data-delete-entity="units"
        data-id="${unit.id}"
      >
        Delete
      </button>
      ${unit.arrangement === "shared_occupancy" && hasTenant ? html`<button class="btn btn--secondary btn--sm" data-assign="${unit.id}">Add occupant</button>` : null}
    </td>
  </tr>`;
}

function groupByFloor(units) {
  const map = new Map();
  for (const unit of units) {
    const key = `${unit.letter}-${unit.floorNumber}`;
    if (!map.has(key)) {
      map.set(key, {
        floor: `Building ${unit.letter} · ${unit.floor}`,
        sortKey: `${unit.letter}${String(unit.floorNumber).padStart(2, "0")}`,
        units: [],
      });
    }
    map.get(key).units.push(unit);
  }
  return [...map.values()]
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map((group) => ({
      ...group,
      units: group.units.sort((a, b) => a.code.localeCompare(b.code)),
    }));
}

export default renderUnits;
