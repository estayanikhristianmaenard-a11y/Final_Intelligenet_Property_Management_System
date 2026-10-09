import { render, html } from "../utils/dom.js";
import { mountShell, refreshShell, outletElement, setBadges } from "./shell.js";
import { currentRoute, onRouteChange, navigate } from "./router.js";
import { resolveRoute, normalisePath } from "../auth/guards.js";
import session from "../auth/session.js";
import { HOME_FOR_ROLE } from "../config/navigation.js";
import { endpoints } from "../api/endpoints.js";
import { api } from "../api/client.js";
import { icon } from "../components/icon.js";
import { closePanel } from "../components/side-panel.js";
import { ROLE } from "../config/constants.js";

import { renderDashboard } from "../features/dashboard/dashboard.page.js";
import { renderProperties } from "../features/properties/properties.page.js";
import { renderUnits } from "../features/units/units.page.js";
import { renderTenants } from "../features/tenants/tenants.page.js";
import { renderBills } from "../features/billing/bills.page.js";
import { renderReports } from "../features/reports/reports.page.js";
import { renderSettings } from "../features/settings/settings.page.js";

import { renderAdminDashboard } from "../features/admin/admin-dashboard.page.js";
import { renderAdminAudit } from "../features/admin/admin-audit.page.js";
import { renderAdminSettings } from "../features/admin/admin-settings.page.js";

import { renderTenantHome } from "../features/tenant/tenant-home.page.js";
import { renderTenantBills } from "../features/tenant/tenant-bills.page.js";
import { renderTenantNotifications } from "../features/tenant/tenant-notifications.page.js";
import { renderTenantSettings } from "../features/tenant/tenant-settings.page.js";

import { renderLogin } from "../features/auth/login.page.js";
import { renderAccessDenied, renderNotFound } from "../features/errors/access-denied.page.js";

/**
 * Application bootstrap.
 *
 * Responsibilities:
 *   1. resolve the hash route against the RBAC guard
 *   2. mount the persistent shell (sidebar + topbar) for signed-in users
 *   3. hand the route's content outlet to the matching page renderer
 *   4. keep sidebar count badges in sync
 */

const PAGES = {
  dashboard: renderDashboard,
  properties: renderProperties,
  units: renderUnits,
  tenants: renderTenants,
  bills: renderBills,
  reports: renderReports,
  settings: renderSettings,

  adminDashboard: renderAdminDashboard,
  adminAudit: renderAdminAudit,
  adminSettings: renderAdminSettings,

  tenantHome: renderTenantHome,
  tenantBills: renderTenantBills,
  tenantNotifications: renderTenantNotifications,
  tenantSettings: renderTenantSettings,

  login: renderLogin,
  accessDenied: renderAccessDenied,
  notFound: renderNotFound,
};

let bootstrapped = false;

export function bootstrap(root) {
  if (bootstrapped) return;
  bootstrapped = true;

  onRouteChange(() => route());
  window.addEventListener("app:role-changed", async () => {
    await loadBadges();
    const home = session.homePath;
    navigate(home.replace("#", "") || HOME_FOR_ROLE[session.role]);
    route();
  });
  window.addEventListener("app:signed-out", () => {
    closePanel();
    route();
  });

  if (!window.location.hash) {
    window.location.hash = session.isAuthenticated
      ? HOME_FOR_ROLE[session.role] ?? "/dashboard"
      : "/login";
  }

  route(root);
}

async function route(root = document.getElementById("app-root")) {
  const { path, query } = currentRoute();
  const normalised = normalisePath(path);
  const decision = resolveRoute(normalised);

  /* --- Unauthenticated ------------------------------------------------- */
  if (decision.status === "login") {
    render(root, loginHost());
    const outlet = root.querySelector("[data-auth-outlet]");
    /* Only honour a deep link when it is a real destination, not the login,
       root or 403 path itself — otherwise sign-in would loop. */
    const deepLink =
      normalised === "/login" || normalised === "/" || normalised === "/403"
        ? ""
        : normalised;
    renderLogin(outlet, { redirectTo: deepLink });
    return;
  }

  /* --- Authenticated: make sure the chrome exists ----------------------- */
  let outlet = root.querySelector("[data-outlet]");
  if (!outlet) {
    outlet = mountShell(root);
    await loadBadges();
  }

  refreshShell({ activePath: normalised, menuOpen: false });
  outlet = outletElement();
  closePanel();

  /* --- Guard results ---------------------------------------------------- */
  if (decision.status === "denied") {
    renderAccessDenied(outlet, { path: normalised });
    return;
  }

  if (decision.status === "not-found") {
    renderNotFound(outlet, { path: normalised });
    return;
  }

  if (normalised === "/login") {
    navigate((HOME_FOR_ROLE[session.role] ?? "/dashboard").replace("#", ""));
    return;
  }

  if (decision.status === "redirect") {
    navigate(decision.path.replace("#", "") || "/");
    return;
  }

  /* --- Render the page -------------------------------------------------- */
  const renderer = PAGES[decision.route.page];
  if (!renderer) {
    renderNotFound(outlet, { path: normalised });
    return;
  }

  try {
    await renderer(outlet, { path: normalised, query });
  } catch (error) {
    console.error("[PropertyPro] page render failed", error);
    render(
      outlet,
      html`<section class="page">
        <div class="error-state">
          <span class="error-state__code">!</span>
          <h3>This view failed to render</h3>
          <p class="text-secondary">${error.message}</p>
          <a class="btn btn--secondary" href="${session.homePath}"
            >${icon("refresh", { size: 15 })} Reload</a
          >
        </div>
      </section>`,
    );
  }
}

/** Signed-in users get the full shell; everyone else gets a bare auth host. */
function loginHost() {
  return html`<div data-auth-outlet></div>`;
}

/** Refresh sidebar count badges for the active role. */
export async function loadBadges() {
  if (!session.isAuthenticated) return;
  const role = session.role;

  try {
    if (role === ROLE.MANAGER) {
      const [stats, tenants, notifications] = await Promise.all([
        api.get(endpoints.dashboardStats()),
        api.get(endpoints.tenants()),
        api.get(endpoints.notifications()),
      ]);
      setBadges({
        tenants: tenants.length,
        exceptions: stats.openExceptions,
        bills: 0,
        unreadNotifications: notifications.filter((n) => !n.read).length,
      });
    } else if (role === ROLE.TENANT) {
      const [notifications, bills] = await Promise.all([
        api.get(endpoints.notifications()),
        api.get(endpoints.tenantBills(session.user?.tenantId ?? "tnt-001")),
      ]);
      setBadges({
        myBills: bills.filter((b) => b.paymentStatus !== "paid").length,
        unreadNotifications: notifications.filter((n) => !n.read).length,
      });
    } else {
      const users = await api.get(endpoints.adminUsers());
      setBadges({ unreadNotifications: 0, accounts: users.length });
    }
  } catch {
    /* badges are cosmetic — never block the page on them */
  }
}

export default bootstrap;

/* --------------------------------------------------------------------------
   Entry point. index.html loads this module directly, so boot as soon as the
   DOM mount point exists.
   -------------------------------------------------------------------------- */
const appRoot = document.getElementById("app-root");
if (appRoot) bootstrap(appRoot);
