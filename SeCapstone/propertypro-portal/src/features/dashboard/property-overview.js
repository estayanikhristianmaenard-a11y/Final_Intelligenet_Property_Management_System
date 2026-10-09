import { html } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { peso, count } from "../../utils/format.js";
import { UNIT_STATUS } from "../../config/constants.js";

/**
 * Property Overview.
 *
 * Visual representation of Buildings A–D alongside unit occupancy indicators:
 * each building renders its occupancy percentage, a proportional bar, and one
 * dot per unit colour-coded by status (occupied / vacant / on notice /
 * maintenance). Cards are clickable and deep-link to the Units view.
 *
 * @param {{properties:Array, units:Array}} data
 */
export function propertyOverview({ properties, units }) {
  const unitsByProperty = new Map();
  for (const unit of units) {
    if (!unitsByProperty.has(unit.propertyId)) unitsByProperty.set(unit.propertyId, []);
    unitsByProperty.get(unit.propertyId).push(unit);
  }

  return html`
    <div class="building-grid">
      ${properties.map((property) => buildingCard(property, unitsByProperty.get(property.id) ?? []))}
    </div>
    <div class="legend mt-4">
      <span class="legend__item"
        ><i class="legend__swatch" style="--swatch:#6366f1"></i>Occupied</span
      >
      <span class="legend__item"
        ><i class="legend__swatch" style="--swatch:#cbd5e1"></i>Vacant</span
      >
      <span class="legend__item"
        ><i class="legend__swatch" style="--swatch:#f59e0b"></i>On notice</span
      >
      <span class="legend__item"
        ><i class="legend__swatch" style="--swatch:#f87171"></i>Maintenance</span
      >
      <span class="legend__item" style="margin-left:auto"
        >${icon("info", { size: 13 })} Select a building to open its units</span
      >
    </div>
  `;
}

function buildingCard(property, units) {
  const pct = property.occupancyRate ?? 0;
  const sorted = [...units].sort(
    (a, b) => a.floorNumber - b.floorNumber || a.code.localeCompare(b.code),
  );

  return html`<a
    class="building-card"
    href="#/units?property=${property.id}"
    aria-label="${property.name}, ${pct}% occupied"
  >
    <div class="building-card__head">
      <div class="building-card__identity">
        <span class="building-card__glyph">${icon("building", { size: 19 })}</span>
        <span>
          <span class="building-card__name">${property.name}</span>
          <span class="building-card__addr">${property.address}</span>
        </span>
      </div>
      <span class="building-card__pct"
        >${pct}%<small>occupied</small></span
      >
    </div>

    <div class="progress" role="img" aria-label="${pct}% occupancy">
      <div
        class="progress__bar ${pct < 70 ? "progress__bar--warn" : ""}"
        style="width:${pct}%"
      ></div>
    </div>

    <div class="unit-dots" aria-hidden="true">
      ${sorted.map((unit) => html`<i class="unit-dot unit-dot--${unit.status}" title="${unit.code} — ${statusLabel(unit.status)}"></i>`)}
    </div>

    <div class="building-card__stats">
      <span><b>${count(property.occupiedUnits)}</b> / ${count(property.totalUnits)} units</span>
      <span><b>${count(property.vacantUnits)}</b> vacant</span>
      <span><b>${peso(property.monthlyRevenue, {})}</b></span>
    </div>
  </a>`;
}

function statusLabel(status) {
  return (
    {
      [UNIT_STATUS.OCCUPIED]: "Occupied",
      [UNIT_STATUS.VACANT]: "Vacant",
      [UNIT_STATUS.NOTICE]: "On notice",
      [UNIT_STATUS.MAINTENANCE]: "Maintenance",
    }[status] ?? status
  );
}

export default propertyOverview;
