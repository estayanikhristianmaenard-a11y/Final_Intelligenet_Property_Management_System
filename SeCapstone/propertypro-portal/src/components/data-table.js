import { html } from "../utils/dom.js";
import { emptyState } from "./empty-state.js";

/**
 * Generic data table.
 *
 * @typedef {Object} Column
 * @property {string} key
 * @property {string} label
 * @property {(row:any)=>import("../utils/dom.js").TrustedString} [render]
 * @property {string} [className]
 * @property {string} [width]
 * @property {boolean} [hideOnSmall]  collapsed below 720px
 *
 * @param {Object} config
 * @param {Column[]} config.columns
 * @param {any[]} config.rows
 * @param {string} [config.rowIdKey]   property used for `data-row-id`
 * @param {boolean} [config.clickable] rows emit `row:click`
 * @param {import("../utils/dom.js").TrustedString} [config.toolbar]
 * @param {import("../utils/dom.js").TrustedString} [config.footer]
 * @param {string} [config.emptyTitle]
 * @param {string} [config.emptyBody]
 * @param {string} [config.emptyIcon]
 * @param {string} [config.ariaLabel]
 */
export function dataTable({
  columns,
  rows,
  rowIdKey = "id",
  clickable = false,
  toolbar = null,
  footer = null,
  emptyTitle = "No records yet",
  emptyBody = "",
  emptyIcon = "inbox",
  ariaLabel = "Data table",
}) {
  if (!rows?.length) {
    return html`<div class="card">
      ${toolbar ? html`<div class="table-toolbar">${toolbar}</div>` : null}
      ${emptyState({ iconName: emptyIcon, title: emptyTitle, body: emptyBody })}
      ${footer ? html`<div class="table-footer">${footer}</div>` : null}
    </div>`;
  }

  return html`<div class="card">
    ${toolbar ? html`<div class="table-toolbar">${toolbar}</div>` : null}
    <div class="table-wrap">
      <table class="data-table" aria-label="${ariaLabel}">
        <thead>
          <tr>
            ${columns.map(
              (col) => html`<th
                class="${col.className ?? ""}"
                style="${col.width ? `width:${col.width}` : ""}"
                scope="col"
                >${col.label}</th
              >`,
            )}
          </tr>
        </thead>
        <tbody>
          ${rows.map(
            (row) => html`<tr
              class="${clickable ? "is-clickable" : ""}"
              data-row-id="${row[rowIdKey] ?? ""}"
              tabindex="${clickable ? "0" : "-1"}"
            >
              ${columns.map(
                (col) => html`<td class="${col.className ?? ""}">
                  ${col.render ? col.render(row) : row[col.key]}
                </td>`,
              )}
            </tr>`,
          )}
        </tbody>
      </table>
    </div>
    ${footer ? html`<div class="table-footer">${footer}</div>` : null}
  </div>`;
}

/**
 * Wire up row clicks for tables rendered by `dataTable({ clickable: true })`.
 * Dispatches a `row:click` CustomEvent on the table with `{ id }`.
 */
export function bindRowClicks(container, handler) {
  const onClick = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("a, button, input, select, [data-no-row]")) return;
    const row = target.closest("tr[data-row-id]");
    if (!row) return;
    handler(row.getAttribute("data-row-id"), event);
  };

  const onKey = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const row = event.target;
    if (!(row instanceof HTMLElement) || !row.matches("tr[data-row-id]")) return;
    event.preventDefault();
    handler(row.getAttribute("data-row-id"), event);
  };

  container.addEventListener("click", onClick);
  container.addEventListener("keydown", onKey);
  return () => {
    container.removeEventListener("click", onClick);
    container.removeEventListener("keydown", onKey);
  };
}

export default dataTable;
