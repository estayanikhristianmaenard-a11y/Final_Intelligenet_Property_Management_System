import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { badge } from "../../components/badge.js";
import { skeletonRows, emptyState } from "../../components/empty-state.js";
import { api } from "../../api/client.js";
import { endpoints } from "../../api/endpoints.js";
import { peso, count } from "../../utils/format.js";
import {isMockMode} from '../../config/api.js';
import {openRecordEditor} from '../foundation/foundation.page.js';

/** Properties portfolio — Buildings A–D with occupancy and revenue. */
export async function renderProperties(container) {
  render(container, frame(html`<div class="property-grid">${skeletonCards()}</div>`));

  try {
    const properties = await api.get(endpoints.properties());
    render(container, frame(grid(properties)));
    if (!isMockMode()) container.querySelector('.page-header__actions button').onclick=()=>openRecordEditor('properties',()=>renderProperties(container));
    if (!isMockMode()) container.querySelectorAll('[data-edit-property]').forEach(button=>button.onclick=()=>openRecordEditor('properties',()=>renderProperties(container),button.dataset.editProperty));
  } catch (error) {
    render(
      container,
      frame(
        emptyState({
          iconName: "alert-triangle",
          title: "Properties could not be loaded",
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
          <span>Properties</span>
        </nav>
        <h1 id="page-title">Properties</h1>
        <p>Boarding houses and residential apartments in Pasig City.</p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--primary" type="button">${icon("plus", { size: 15 })} Add property</button>
      </div>
    </div>
    ${content}
  </section>`;
}

function grid(properties) {
  if (!properties.length) {
    return emptyState({ iconName: "building", title: "No properties yet" });
  }

  return html`<div class="property-grid">
    ${properties.map(
      (property) => html`<article class="card property-card">
        <div
          class="property-card__banner"
          style="--banner-a:${property.accent[0]};--banner-b:${property.accent[1]}"
        >
          <span class="property-card__badge">${property.type.replace("_", " ")}</span>
          <span class="property-card__badge">Building ${property.letter}</span>
        </div>
        <div class="property-card__body">
          <div class="row row-between row-wrap row-2">
            <h3 class="property-card__title">${property.name}</h3>
            ${property.occupancyRate >= 85
              ? badge("High occupancy", "success")
              : badge(`${property.occupancyRate}%`, "primary")}
          </div>
          <p class="property-card__addr">
            ${icon("map-pin", { size: 13 })} ${property.address}, ${property.city}
          </p>

          <div class="progress" role="img" aria-label="${property.occupancyRate}% occupancy">
            <div
              class="progress__bar ${property.occupancyRate < 70 ? "progress__bar--warn" : ""}"
              style="width:${property.occupancyRate}%"
            ></div>
          </div>

          <div class="property-card__stats">
            <div class="property-card__stat">
              <b>${count(property.totalUnits)}</b><span>Units</span>
            </div>
            <div class="property-card__stat">
              <b>${count(property.occupiedUnits)}</b><span>Occupied</span>
            </div>
            <div class="property-card__stat">
              <b>${peso(property.monthlyRevenue)}</b><span>Rent roll</span>
            </div>
          </div>

          <a class="btn btn--secondary btn--sm full-width" href="#/units?property=${property.id}">
            ${icon("grid", { size: 14 })} View units
          </a>
          ${!isMockMode()?html`<button class="btn btn--ghost btn--sm full-width" type="button" data-edit-property="${property.id}">Edit property</button>`:null}
        </div>
      </article>`,
    )}
  </div>`;
}

function skeletonCards() {
  return Array.from(
    { length: 4 },
    () => html`<div class="card" style="height:280px">
      <div class="skeleton" style="height:92px;border-radius:12px 12px 0 0"></div>
      <div class="card__body stack stack-3">
        <div class="skeleton" style="width:60%;height:14px"></div>
        <div class="skeleton" style="width:85%;height:11px"></div>
        <div class="skeleton" style="width:100%;height:8px"></div>
        <div class="skeleton" style="width:100%;height:48px"></div>
      </div>
    </div>`,
  );
}

export default renderProperties;
