import { html, render, createBinder } from "../utils/dom.js";
import { icon } from "./icon.js";

/**
 * Slide-out side panel (right drawer).
 *
 * Used for the Tenant Details view. Supports tabbed navigation, a live
 * `update()` so async data can arrive without remounting, Escape to close, a
 * focus trap while open and body scroll locking — the interaction contract
 * the Phase 1 spec requires for the tenant panel.
 */

let activePanel = null;

/**
 * @param {Object} config
 * @param {string} config.ariaLabel
 * @param {import("../utils/dom.js").TrustedString} config.header  header block
 * @param {Array<{id:string,label:string,count?:number}>} [config.tabs]
 * @param {(tabId:string)=>import("../utils/dom.js").TrustedString} config.renderBody
 * @param {import("../utils/dom.js").TrustedString} [config.footer]
 * @param {(api:{close:()=>void,setTab:(id:string)=>void,update:Function,tab:string})=>void} [config.onMount]
 * @returns {{close:()=>void,setTab:(id:string)=>void,update:Function}}
 */
export function openPanel({
  ariaLabel,
  header,
  tabs = [],
  renderBody,
  footer = null,
  onMount,
}) {
  closePanel(true);

  const panelRoot = document.getElementById("panel-root");
  const restoreFocus = document.activeElement;
  const binder = createBinder();

  const state = { ariaLabel, header, tabs, renderBody, footer };
  let activeTab = tabs[0]?.id ?? "";

  const scrim = document.createElement("div");
  scrim.className = "scrim scrim--panel";

  const panel = document.createElement("aside");
  panel.className = "panel-drawer";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-label", ariaLabel);

  const paint = () => {
    render(
      panel,
      html`<header class="panel-drawer__header">
          <div class="panel-drawer__head-row">
            ${state.header}
            <button class="icon-btn" type="button" data-close aria-label="Close panel">
              ${icon("x", { size: 18 })}
            </button>
          </div>
        </header>
        ${state.tabs.length
          ? html`<nav class="subtabs" role="tablist" aria-label="${state.ariaLabel} sections">
              ${state.tabs.map(
                (tab) => html`<button
                  type="button"
                  role="tab"
                  class="subtabs__tab ${tab.id === activeTab ? "is-active" : ""}"
                  aria-selected="${tab.id === activeTab ? "true" : "false"}"
                  data-tab="${tab.id}"
                >
                  ${tab.label}${tab.count !== undefined ? html` (${tab.count})` : null}
                </button>`,
              )}
            </nav>`
          : null}
        <div class="panel-drawer__body" data-body>${state.renderBody(activeTab)}</div>
        ${state.footer
          ? html`<footer class="panel-drawer__footer">${state.footer}</footer>`
          : null}`,
    );
  };

  paint();

  const setTab = (id) => {
    if (id === activeTab) return;
    activeTab = id;
    paint();
  };

  /**
   * Replace part of the panel content without remounting (used when the
   * tenant detail request resolves).
   */
  const update = (patch = {}) => {
    Object.assign(state, patch);
    if (patch.tabs && !patch.tabs.some((t) => t.id === activeTab)) {
      activeTab = patch.tabs[0]?.id ?? "";
    }
    paint();
  };

  const close = () => {
    if (!panel.isConnected) return;
    panel.classList.add("is-closing");
    binder.destroy();
    document.removeEventListener("keydown", onKey);
    document.body.style.removeProperty("overflow");
    setTimeout(() => {
      scrim.remove();
      panel.remove();
    }, 200);
    activePanel = null;
    if (restoreFocus instanceof HTMLElement) restoreFocus.focus();
  };

  function onKey(event) {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
    }
    if (event.key === "Tab") trapFocus(event, panel);
  }

  binder.add(panel, "click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("[data-close]")) close();
    const tab = target.closest("[data-tab]");
    if (tab) setTab(tab.getAttribute("data-tab"));
  });
  binder.add(scrim, "click", close);
  document.addEventListener("keydown", onKey);

  panelRoot.appendChild(scrim);
  panelRoot.appendChild(panel);
  document.body.style.overflow = "hidden";

  const api = { close, setTab, update, get tab() { return activeTab; } };
  activePanel = api;
  onMount?.(api);

  panel.querySelector("[data-close]")?.focus();
  return api;
}

export function closePanel(immediate = false) {
  if (!activePanel) return;
  if (immediate) {
    document.querySelector(".panel-drawer")?.remove();
    document.querySelector(".scrim--panel")?.remove();
    document.body.style.removeProperty("overflow");
    activePanel = null;
    return;
  }
  activePanel.close();
}

export function isPanelOpen() {
  return Boolean(activePanel);
}

function trapFocus(event, container) {
  const focusable = [
    ...container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ].filter((el) => el.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export default openPanel;
