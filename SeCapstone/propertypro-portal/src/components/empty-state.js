import { html } from "../utils/dom.js";
import { icon } from "./icon.js";

/**
 * Empty / no-results placeholder.
 * @param {{iconName?:string,title:string,body?:string,action?:import("../utils/dom.js").TrustedString}} config
 */
export function emptyState({ iconName = "inbox", title, body = "", action = null }) {
  return html`<div class="empty-state">
    <span class="empty-state__icon">${icon(iconName, { size: 24 })}</span>
    <h4>${title}</h4>
    ${body ? html`<p>${body}</p>` : null} ${action}
  </div>`;
}

/** Loading skeleton matching a list or table shape. */
export function skeletonRows(rows = 5) {
  return html`${Array.from({ length: rows }, () => html`
    <div class="row row-4" style="padding:14px 20px;border-bottom:1px solid var(--border-subtle)">
      <div class="skeleton" style="width:34px;height:34px;border-radius:8px"></div>
      <div class="grow stack stack-2">
        <div class="skeleton" style="width:${40 + Math.round(Math.random() * 30)}%;height:11px"></div>
        <div class="skeleton" style="width:26%;height:9px"></div>
      </div>
      <div class="skeleton" style="width:74px;height:22px;border-radius:999px"></div>
    </div>`)}`;
}

/** Inline error block used when an API call fails. */
export function errorState({ title = "Something went wrong", message = "" , onRetry = "" } = {}) {
  return html`<div class="error-state">
    <span class="error-state__code">!</span>
    <h3>${title}</h3>
    <p class="text-secondary">${message}</p>
    ${onRetry
      ? html`<a class="btn btn--secondary" href="${onRetry}"
          >${icon("refresh", { size: 15 })} Try again</a
        >`
      : null}
  </div>`;
}

export default emptyState;
