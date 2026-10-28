import { html, render } from "../utils/dom.js";
import session from "../auth/session.js";

let nextId = 0;

/** Accessible, workspace-scoped Tenant suggestions. Keep the input mounted while typing. */
export function bindTenantSearch(input, { find, onSelect }) {
  const host = input.parentElement;
  host.classList.add("tenant-search");
  const list = document.createElement("div");
  list.id = `tenant-suggestions-${++nextId}`;
  list.className = "tenant-search__suggestions";
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-label", "Matching tenants");
  list.hidden = true;
  host.append(list);
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", list.id);
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("autocomplete", "off");
  const token = session.token;
  let sequence = 0, rows = [], active = -1;
  const close = () => {
    sequence++;
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    active = -1;
  };
  const eligible = () => input.isConnected && session.token === token && document.activeElement === input;
  const search = async () => {
    const term = input.value.trim(), request = ++sequence;
    if (!term) { close(); return; }
    rows = [];
    active = -1;
    input.removeAttribute("aria-activedescendant");
    // Hide the preceding query's matches while an async request is pending.
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    let message = "No matching tenants";
    try {
      const matches = await find(term);
      if (request !== sequence || !eligible()) return;
      rows = matches.slice(0, 8);
    } catch {
      if (request !== sequence || !eligible()) return;
      message = "Suggestions unavailable. Press Enter to search.";
    }
    render(list, rows.length ? html`${rows.map((row, index) => html`
      <div class="tenant-search__option" role="option" aria-selected="false"
        id="${list.id}-${index}" data-tenant-option="${index}">
        <strong>${row.fullName}</strong><span>${row.unitCode} · ${row.email}</span>
      </div>`)}` : html`<div class="tenant-search__empty" role="status">${message}</div>`);
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
  };
  const choose = index => {
    const row = rows[index];
    if (!row || session.token !== token) return;
    close();
    onSelect(row);
  };
  input.addEventListener("input", search);
  input.addEventListener("focus", search);
  input.addEventListener("blur", close);
  // Keep focus on the combobox until a pointer selection has been handled.
  list.addEventListener("mousedown", event => event.preventDefault());
  list.addEventListener("click", event => {
    const option = event.target.closest("[data-tenant-option]");
    if (option) choose(Number(option.dataset.tenantOption));
  });
  input.addEventListener("keydown", event => {
    if (event.key === "Escape" && !list.hidden) {
      event.preventDefault(); event.stopPropagation(); close();
    } else if (["ArrowDown", "ArrowUp"].includes(event.key) && !list.hidden && rows.length) {
      event.preventDefault();
      active = active < 0 ? (event.key === "ArrowDown" ? 0 : rows.length - 1)
        : (active + (event.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length;
      list.querySelectorAll("[role=option]").forEach((option, index) => {
        option.setAttribute("aria-selected", String(index === active));
        if (index === active) option.scrollIntoView({ block: "nearest" });
      });
      input.setAttribute("aria-activedescendant", `${list.id}-${active}`);
    } else if (event.key === "Enter" && !list.hidden && active >= 0) {
      event.preventDefault(); event.stopImmediatePropagation(); choose(active);
    }
  });
}
