import { html, render } from "../utils/dom.js";
import { sidebar } from "../components/sidebar.js";
import { topbar } from "../components/topbar.js";
import session from "../auth/session.js";

/**
 * Application shell.
 *
 * Owns the persistent chrome (sidebar + topbar) and exposes a single content
 * outlet the router repaints. Chrome is re-rendered whenever the active path,
 * role or menu state changes; the outlet is left alone so page-level state
 * (open panels, focus) survives.
 */

let root = null;
let outlet = null;
let state = { activePath: "/", badges: {}, menuOpen: false, navOpen: false };

/** Mount the shell once. Subsequent calls reuse the same DOM. */
export function mountShell(target) {
  root = target;
  render(root, shellMarkup());
  outlet = root.querySelector("[data-outlet]");
  bindChrome();
  return outlet;
}

/** Re-render the shell chrome (sidebar/topbar) without touching the outlet. */
export function refreshShell(patch = {}) {
  state = { ...state, ...patch };
  if (!root) return;
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
  const user = session.user;
  const role = session.role;

  return html`<div class="app-shell ${state.navOpen ? "is-nav-open" : ""}">
    <aside class="sidebar" aria-label="Primary navigation">
      ${sidebar({ role, activePath: state.activePath, badges: state.badges })}
    </aside>

    <div class="app-main">
      <header class="topbar">
        ${topbar({ user, notifications: state.badges?.unreadNotifications ?? 0, menuOpen: state.menuOpen })}
      </header>
      <main
        class="page-host"
        id="main-content"
        data-outlet
        tabindex="-1"
      ></main>
    </div>
  </div>`;
}

function bindChrome() {
  /* Mobile drawer */
  root
    .querySelector('[data-action="toggle-nav"]')
    ?.addEventListener("click", () => {
      refreshShell({ navOpen: !state.navOpen });
    });

  /* Close the drawer whenever the scrim (rendered by pages) or nav link is used */
  root.querySelectorAll(".sidebar a").forEach((link) => {
    link.addEventListener("click", () => {
      if (state.navOpen) refreshShell({ navOpen: false });
      if (state.menuOpen) refreshShell({ menuOpen: false });
    });
  });

  /* User menu */
  root
    .querySelector('[data-action="toggle-user-menu"]')
    ?.addEventListener("click", (event) => {
      event.stopPropagation();
      refreshShell({ menuOpen: !state.menuOpen });
    });

  root.querySelectorAll('[data-action="switch-role"]').forEach((button) => {
    button.addEventListener("click", async () => {
      const role = button.getAttribute("data-role");
      await session.signOut();
      window.location.hash = "/login";
    });
  });

  root
    .querySelector('[data-action="sign-out"]')
    ?.addEventListener("click", async () => {
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

  root
    .querySelector('[data-action="global-search"]')
    ?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      const value = event.target.value?.trim();
      if (!value) return;
      window.location.hash =
        session.role === "manager"
          ? `/tenants?q=${encodeURIComponent(value)}`
          : session.role === "tenant"
            ? "/tenant/bills"
            : "/admin/settings";
    });

  /* Dismiss the user menu on outside click */
  if (state.menuOpen) {
    setTimeout(() => {
      const closer = (event) => {
        if (event.target.closest?.(".user-menu")) return;
        document.removeEventListener("click", closer);
        if (state.menuOpen) refreshShell({ menuOpen: false });
      };
      document.addEventListener("click", closer);
    }, 0);
  }
}

export default { mountShell, refreshShell, outletElement, setBadges };
