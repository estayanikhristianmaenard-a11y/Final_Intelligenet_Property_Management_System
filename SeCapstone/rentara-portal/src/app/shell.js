import { html, render } from "../utils/dom.js";
import { sidebar } from "../components/sidebar.js";
import { topbar } from "../components/topbar.js";
import { icon } from "../components/icon.js";
import session from "../auth/session.js";
import { confirmPageLeave } from "./form-state.js";
import { bindTenantSearch } from "../components/tenant-search.js";
import { api } from "../api/client.js";
import { endpoints } from "../api/endpoints.js";
import { openTenantPanel } from "../features/tenants/tenant-details.panel.js";
import { mountSidebarMotion, sidebarPosition } from "../components/sidebar-motion.js";
import { navForRole } from "../config/navigation.js";

/**
 * Application shell.
 *
 * Owns the persistent chrome (sidebar + topbar) and exposes a single content
 * outlet the router repaints. Chrome is re-rendered whenever the active path,
 * role changes; drawer toggles reuse the chrome so transitions can run. The outlet is left alone so page-level state
 * (open panels, focus) survives.
 */

let root = null;
let outlet = null;
let state = { activePath: "/", badges: {}, navOpen: false, sidebarCollapsed: false };
let disposeSidebarMotion = () => {};
let screenQuery = null;
const onScreenChange = () => refreshShell({navOpen:false});

export function unmountShell() {
  disposeSidebarMotion();
  screenQuery?.removeEventListener("change",onScreenChange);
  screenQuery = null;
  root = null;
  outlet = null;
  state = { activePath: "/", badges: {}, navOpen: false, sidebarCollapsed: false };
}

/** Mount the shell once. Subsequent calls reuse the same DOM. */
export function mountShell(target) {
  disposeSidebarMotion();
  screenQuery?.removeEventListener("change",onScreenChange);
  screenQuery = window.matchMedia("(max-width: 1100px)");
  screenQuery.addEventListener("change",onScreenChange);
  root = target;
  render(root, shellMarkup());
  outlet = root.querySelector("[data-outlet]");
  bindChrome();
  return outlet;
}

/** Re-render the shell chrome (sidebar/topbar) without touching the outlet. */
export function refreshShell(patch = {}) {
  if (!root || !session.isAuthenticated || !root.querySelector("[data-outlet]"))
    return;
  state = { ...state, ...patch };
  const shell = root.querySelector(".app-shell");
  const mobile = window.matchMedia("(max-width: 1100px)").matches;
  const mode = mobile ? "drawer" : "sidebar";
  // Keep the same menu and its listeners for open/close. Breakpoint, route,
  // badge and account changes still rebuild chrome as before.
  if (mobile && Object.keys(patch).length === 1 && Object.hasOwn(patch,"navOpen") && shell?.dataset.navMode === mode) {
    const menu = shell.querySelector(".sidebar");
    const opener = shell.querySelector('.topbar [data-action="toggle-nav"]');
    if (!state.navOpen && menu.contains(document.activeElement)) opener?.focus({preventScroll:true});
    shell.classList.toggle("is-nav-open",state.navOpen);
    menu.inert = mobile && !state.navOpen;
    opener?.setAttribute("aria-expanded",String(state.navOpen));
    const label = state.navOpen ? "Close sidebar" : "Expand sidebar";
    opener?.setAttribute("aria-label",label);
    opener?.setAttribute("title",label);
    shell.querySelector('.mobile-bottom-nav [data-action="toggle-nav"]')?.setAttribute("aria-expanded",String(state.navOpen));
    return;
  }
  if (!mobile && Object.keys(patch).length === 1 && Object.hasOwn(patch,"sidebarCollapsed")) {
    shell.classList.toggle("is-sidebar-collapsed",state.sidebarCollapsed);
    const opener = shell.querySelector('.topbar [data-action="toggle-nav"]');
    opener.setAttribute("aria-expanded",String(!state.sidebarCollapsed));
    const label=state.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar";
    opener.setAttribute("aria-label",label);opener.setAttribute("title",label);
    return;
  }
  const previousSidebar = sidebarPosition(root.querySelector('.sidebar'));
  disposeSidebarMotion();
  const previousOutlet = root.querySelector("[data-outlet]");

  const holder = document.createElement("div");
  render(holder, shellMarkup());
  root.replaceChildren(...holder.childNodes);

  outlet = root.querySelector("[data-outlet]");
  if (outlet && previousOutlet) {
    outlet.replaceWith(previousOutlet);
    outlet = previousOutlet;
  }
  bindChrome(previousSidebar);
}

/** The routed content container. */
export function outletElement() {
  return outlet;
}

/** Update nav count badges (fetched once, refreshed after mutations). */
export function setBadges(badges) {
  if (!session.isAuthenticated) return;
  state = { ...state, badges };
  refreshShell();
}

function shellMarkup() {
  const role = session.role;
  const mobileNavigation = window.matchMedia("(max-width: 1100px)").matches;
  const items = navForRole(role);
  const hasMore = items.length > 4;
  const primaryItems = hasMore ? items.filter(item => ["dashboard", "properties", "bills"].includes(item.id)) : items;
  const currentPath = state.activePath.split("?")[0];
  const shortLabels = {"tenant-home":"Home", "tenant-bills":"Bills", "tenant-notifications":"Alerts", "bills":"Bills", "admin-audit":"Audit"};
  const mobileNav = mobileNavigation
    ? html`<nav class="tenant-bottom-nav mobile-bottom-nav" aria-label="${role} navigation">
        ${primaryItems.map(item => {
          const active = currentPath === item.path.slice(1);
          const label = shortLabels[item.id] ?? item.label;
          const count = item.id === "tenant-notifications" ? state.badges?.unreadNotifications ?? 0 : state.badges?.[item.badge ?? item.id] ?? 0;
          return html`<a href="${item.path}" class="tenant-bottom-nav__item ${active ? "is-active" : ""}" aria-label="${item.label}" aria-current="${active ? "page" : "false"}">
            <span class="tenant-bottom-nav__icon">${icon(item.icon, { size: 20 })}${count ? html`<span class="tenant-bottom-nav__count">${count > 9 ? "9+" : count}</span>` : null}</span>
            <span>${label}</span>
          </a>`;
        })}
        ${hasMore ? html`<button type="button" class="tenant-bottom-nav__item ${primaryItems.some(item => item.path.slice(1) === currentPath) ? "" : "is-active"}" data-action="toggle-nav" aria-label="More navigation" aria-controls="primary-sidebar" aria-expanded="${state.navOpen}">
          <span class="tenant-bottom-nav__icon">${icon("menu", {size:20})}</span><span>More</span>
        </button>` : null}
      </nav>`
    : null;

  return html`<div class="app-shell ${state.navOpen ? "is-nav-open" : ""} ${state.sidebarCollapsed ? "is-sidebar-collapsed" : ""}" data-role="${role}" data-nav-mode="${mobileNavigation ? "drawer" : "sidebar"}">
    <aside id="primary-sidebar" class="sidebar" aria-label="Primary navigation" ${mobileNavigation && !state.navOpen ? "inert" : ""}>
      ${sidebar({ role, activePath: state.activePath, badges: state.badges })}
    </aside>

    <div class="app-main">
      <header class="topbar">
        ${topbar({ navExpanded: mobileNavigation ? state.navOpen : !state.sidebarCollapsed, mobile: mobileNavigation, notifications: state.badges?.unreadNotifications ?? 0 })}
      </header>
      <main
        class="page-host"
        id="main-content"
        data-outlet
        tabindex="-1"
      ></main>
    </div>
    ${mobileNav}
  </div>`;
}

function bindChrome(previousSidebar) {
  const menu=root.querySelector('.sidebar');
  disposeSidebarMotion=mountSidebarMotion(menu,previousSidebar);
  const syncPreview=()=>{
    if (window.matchMedia('(max-width: 1100px)').matches) return;
    const expanded=!state.sidebarCollapsed || menu.matches(':hover,:focus-within');
    const opener=root.querySelector('.topbar [data-action="toggle-nav"]');
    opener.setAttribute('aria-expanded',String(expanded));
    const label=!state.sidebarCollapsed ? 'Collapse sidebar' : expanded ? 'Keep sidebar expanded' : 'Expand sidebar';
    opener.setAttribute('aria-label',label);opener.setAttribute('title',label);
  };
  for(const event of ['pointerenter','pointerleave','focusin']) menu.addEventListener(event,syncPreview);
  menu.addEventListener('focusout',()=>queueMicrotask(()=>{if(menu.isConnected)syncPreview();}));
  syncPreview();
  /* Mobile drawer */
  root
    .querySelectorAll('[data-action="toggle-nav"]')
    .forEach(button => button.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 1100px)").matches) refreshShell({ navOpen: !state.navOpen });
      else refreshShell({sidebarCollapsed: !state.sidebarCollapsed});
    }));

  /* Close the mobile drawer after selecting a destination. */
  root.querySelectorAll(".sidebar a").forEach((link) => {
    link.addEventListener("click", () => {
      if (state.navOpen) refreshShell({ navOpen: false });
    });
  });

  root
    .querySelector('.sidebar [data-action="sign-out"]')
    ?.addEventListener("click", async () => {
      if (!confirmPageLeave()) return;
      await session.signOut();
      window.dispatchEvent(new CustomEvent("app:signed-out"));
    });

  root
    .querySelector('[data-action="notifications"]')
    ?.addEventListener("click", () => {
      const home =
        session.role === "tenant"
          ? "#/tenant/notifications"
          : session.role === "admin"
            ? "#/admin/audit"
            : "#/bills?tab=exceptions";
      window.location.hash = home.replace("#", "");
    });

  const portalSearch = root.querySelector('[data-action="global-search"]');
  if (portalSearch && ["manager", "staff"].includes(session.role))
    bindTenantSearch(portalSearch, {
      debounceMs: 250,
      find: (term, options) => api.get(endpoints.tenants({ q: term }), options),
      onSelect: tenant => openTenantPanel(tenant.id),
    });
  portalSearch?.addEventListener("keydown", (event) => {
      if (event.defaultPrevented) return;
      if (event.key !== "Enter") return;
      const value = event.target.value?.trim();
      if (!value) return;
      window.location.hash =
        ["manager", "staff"].includes(session.role)
          ? `/tenants?q=${encodeURIComponent(value)}`
          : session.role === "tenant"
            ? "/tenant/bills"
            : "/admin/settings";
    });

}

export default { mountShell, refreshShell, outletElement, setBadges };
