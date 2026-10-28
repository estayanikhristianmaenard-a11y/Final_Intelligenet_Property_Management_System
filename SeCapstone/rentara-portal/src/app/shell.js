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

/**
 * Application shell.
 *
 * Owns the persistent chrome (sidebar + topbar) and exposes a single content
 * outlet the router repaints. Chrome is re-rendered whenever the active path,
 * role or drawer state changes; the outlet is left alone so page-level state
 * (open panels, focus) survives.
 */

let root = null;
let outlet = null;
let state = { activePath: "/", badges: {}, navOpen: false };
let screenQuery = null;
const onScreenChange = () => refreshShell({navOpen:false});

export function unmountShell() {
  screenQuery?.removeEventListener("change",onScreenChange);
  screenQuery = null;
  root = null;
  outlet = null;
  state = { activePath: "/", badges: {}, navOpen: false };
}

/** Mount the shell once. Subsequent calls reuse the same DOM. */
export function mountShell(target) {
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
  const previousOutlet = root.querySelector("[data-outlet]");

  const holder = document.createElement("div");
  render(holder, shellMarkup());
  root.replaceChildren(...holder.childNodes);

  outlet = root.querySelector("[data-outlet]");
  if (outlet && previousOutlet) {
    outlet.replaceWith(previousOutlet);
    outlet = previousOutlet;
  }
  bindChrome();
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
  const tenantMobileNav = role === "tenant" && mobileNavigation
    ? html`<nav class="tenant-bottom-nav" aria-label="Tenant navigation">
        ${[
          ["/tenant", "home", "Home"],
          ["/tenant/bills", "receipt", "Bills"],
          ["/tenant/notifications", "bell", "Alerts"],
          ["/tenant/settings", "settings", "Settings"],
        ].map(([path, iconName, label]) => {
          const active = state.activePath === path || (path === "/tenant/bills" && state.activePath.startsWith("/tenant/bills"));
          const count = label === "Alerts" ? state.badges?.unreadNotifications ?? 0 : 0;
          return html`<a href="#${path}" class="tenant-bottom-nav__item ${active ? "is-active" : ""}" aria-current="${active ? "page" : "false"}">
            <span class="tenant-bottom-nav__icon">${icon(iconName, { size: 20 })}${count ? html`<span class="tenant-bottom-nav__count">${count > 9 ? "9+" : count}</span>` : null}</span>
            <span>${label}</span>
          </a>`;
        })}
      </nav>`
    : null;

  return html`<div class="app-shell ${state.navOpen ? "is-nav-open" : ""}" data-role="${role}">
    <aside id="primary-sidebar" class="sidebar" aria-label="Primary navigation" ${mobileNavigation && !state.navOpen ? "inert" : ""}>
      ${sidebar({ role, activePath: state.activePath, badges: state.badges })}
    </aside>

    <div class="app-main">
      <header class="topbar">
        ${topbar({ navExpanded: state.navOpen, notifications: state.badges?.unreadNotifications ?? 0 })}
      </header>
      <main
        class="page-host"
        id="main-content"
        data-outlet
        tabindex="-1"
      ></main>
    </div>
    ${tenantMobileNav}
  </div>`;
}

function bindChrome() {
  /* Mobile drawer */
  root
    .querySelectorAll('[data-action="toggle-nav"]')
    .forEach(button => button.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 1100px)").matches) refreshShell({ navOpen: !state.navOpen });
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
      find: term => api.get(endpoints.tenants({ q: term })),
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
