import { html } from "../utils/dom.js";
import { icon } from "./icon.js";
import { count } from "../utils/format.js";

/**
 * Top-level statistical summary card.
 *
 * @param {Object} config
 * @param {string} config.label      e.g. "Total Units"
 * @param {number} config.value
 * @param {string} config.iconName   registry key
 * @param {string} config.accent     CSS colour driving the top rule + icon
 * @param {string} config.soft       pale background for the icon tile
 * @param {number} [config.delta]    period-over-period change
 * @param {boolean} [config.goodWhenDown]  a falling value is an improvement
 * @param {string} [config.caption]  trailing context, e.g. "across 4 buildings"
 * @param {string} [config.href]     optional drill-down target
 */
export function statCard({
  label,
  value,
  iconName,
  accent = "#4f46e5",
  soft = "#eef2ff",
  delta,
  goodWhenDown = false,
  caption = "",
  href = "",
}) {
  const improved = goodWhenDown ? delta < 0 : delta > 0;
  const trend =
    delta === undefined || delta === null
      ? null
      : delta === 0
        ? html`<span class="trend trend--flat">±0</span>`
        : html`<span class="trend ${improved ? "trend--up" : "trend--down"}"
            >${delta > 0 ? "▲" : "▼"} ${Math.abs(delta)}</span
          >`;

  const body = html`
    <div class="stat-card__top">
      <span class="stat-card__label">${label}</span>
      <span class="stat-card__icon" style="--stat-accent:${accent};--stat-accent-soft:${soft}"
        >${icon(iconName, { size: 19 })}</span
      >
    </div>
    <div class="stat-card__value">${count(value)}</div>
    <div class="stat-card__foot">${trend}<span>${caption}</span></div>
  `;

  if (href) {
    return html`<a
      class="stat-card"
      href="${href}"
      style="--stat-accent:${accent};--stat-accent-soft:${soft}"
      >${body}</a
    >`;
  }

  return html`<article
    class="stat-card"
    style="--stat-accent:${accent};--stat-accent-soft:${soft}"
    >${body}</article
  >`;
}

export default statCard;
