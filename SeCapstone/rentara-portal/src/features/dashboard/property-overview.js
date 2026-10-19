import { html } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { peso, count } from "../../utils/format.js";

/** Occupancy and configured monthly rent; cards open the property's units. */
export function propertyOverview({ properties }) {
  return html`
    <div class="building-grid">
      ${properties.map((property) => buildingCard(property))}
    </div>
  `;
}

function buildingCard(property) {
  const pct = property.occupancyRate ?? 0;

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
    </div>

    <div class="progress" role="img" aria-label="${pct}% occupancy">
      <div
        class="progress__bar ${pct < 70 ? "progress__bar--warn" : ""}"
        style="width:${pct}%"
      ></div>
    </div>


    <div class="building-card__stats">
      <span><b>${count(property.occupiedUnits)}</b> of ${count(property.totalUnits)} units occupied</span>
      <span>Monthly rent <b>${peso(property.monthlyRevenue, {})}</b></span>
    </div>
  </a>`;
}

export default propertyOverview;
