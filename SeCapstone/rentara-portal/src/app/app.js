import { renderStaffDashboard } from "../features/dashboard/staff-dashboard.page.js";
import { renderStaffAccount } from "../features/settings/staff-account.page.js";
import { render, html } from "../utils/dom.js";
import {
  mountShell,
  unmountShell,
  refreshShell,
  outletElement,
  setBadges,
} from "./shell.js";
import { currentRoute, onRouteChange, navigate } from "./router.js";
import { resolveRoute, normalisePath } from "../auth/guards.js";
import session from "../auth/session.js";
import { HOME_FOR_ROLE } from "../config/navigation.js";
import { endpoints } from "../api/endpoints.js";
import { api } from "../api/client.js";
import { icon } from "../components/icon.js";
import { closePanel } from "../components/side-panel.js";
import { ROLE } from "../config/constants.js";
import { bindWorkflows } from "./workflows.js";
import { closeModal } from "../components/modal.js";
import { confirmPageLeave, hasUnsavedChanges } from "./form-state.js";
import { mountConnectionStatus } from "./connection-status.js";
import { mountDisclosureMotion } from "../components/action-feedback.js";

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
import {
  renderAccessDenied,
  renderNotFound,
} from "../features/errors/access-denied.page.js";

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
  dashboard: (container, context) => session.role === ROLE.STAFF ? renderStaffDashboard(container, context) : renderDashboard(container, context),
  staffAccount: renderStaffAccount,
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
let routeSequence = 0;
let renderedLocation = null;
let activePageRender = null;

export async function bootstrap(root) {
  if (bootstrapped) return;
  bootstrapped = true;
  mountConnectionStatus();
  mountDisclosureMotion();
  await session.restore();

  onRouteChange(() => route());
  window.addEventListener("app:data-changed", () => loadBadges());
  window.addEventListener("app:role-changed", async () => {
    await loadBadges();
    const home = session.homePath;
    navigate(home.replace("#", "") || HOME_FOR_ROLE[session.role]);
    route();
  });
  window.addEventListener("app:signed-out", () => {
    closePanel();
    closeModal();
    unmountShell();
    window.history.replaceState(null, "", "#/login");
    route();
  });

  if (!window.location.hash) {
    window.location.hash = session.isAuthenticated
      ? (HOME_FOR_ROLE[session.role] ?? "/dashboard")
      : "/login";
  }

  route(root);
}

async function route(root = document.getElementById("app-root")) {
  const renderKey = `${session.user?.id}:${session.role}:${window.location.hash}`;
  // Native navigation can deliver the same route again while its API call is
  // pending. Share that render; a second renderer could replace the new form.
  if (activePageRender?.key === renderKey) return;
  // A delayed duplicate route event must not replace a form the user is editing.
  // Clean pages still refresh after completed writes and same-fragment navigation.
  if (session.isAuthenticated && renderedLocation === window.location.hash && hasUnsavedChanges()) return;
  if (session.isAuthenticated && renderedLocation && window.location.hash !== renderedLocation && !confirmPageLeave()) {
    history.replaceState(null,"",renderedLocation);
    return;
  }
  const sequence = ++routeSequence;
  const { path, query } = currentRoute();
  const locationKey = window.location.hash;
  const refreshing = renderedLocation === locationKey;
  const position = { left:window.scrollX, top:window.scrollY, behavior:"instant" };
  const normalised = normalisePath(path);
  const decision = resolveRoute(normalised);

  /* --- Unauthenticated ------------------------------------------------- */
  if (decision.status === "login") {
    renderedLocation = null;
    unmountShell();
    render(root, loginHost());
    const outlet = root.querySelector("[data-auth-outlet]");
    /* Only honour a deep link when it is a real destination, not the login,
       root or 403 path itself — otherwise sign-in would loop. */
    const deepLink =
      normalised === "/login" || normalised === "/" || normalised === "/403"
        ? ""
        : normalised + (query.size ? `?${query.toString()}` : "");
    renderLogin(outlet, { redirectTo: deepLink });
    return;
  }

  /* --- Authenticated: make sure the chrome exists ----------------------- */
  let outlet = root.querySelector("[data-outlet]");
  if (!outlet) {
    outlet = mountShell(root);
    await loadBadges();
    if (sequence !== routeSequence) return;
  }

  refreshShell({ activePath: normalised, menuOpen: false });
  outlet = outletElement();
  closePanel();
  closeModal();

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

  const pageRender = { key: renderKey };
  activePageRender = pageRender;
  try {
    const stage = document.createElement("div");
    if (refreshing) stage.style.minHeight = `${outlet.getBoundingClientRect().height}px`;
    outlet.replaceChildren(stage);
    await renderer(stage, { path: normalised, query, onChanged: loadBadges });
    if (sequence !== routeSequence) return;
    stage.style.minHeight = "";
    renderedLocation = locationKey;
    if (refreshing) window.scrollTo(position);
    bindWorkflows(stage, {
      page: decision.route.page,
      onChanged: loadBadges,
      refresh: () => {
        // A completed save belongs to its original page, even if the user moved on.
        const current = currentRoute();
        if (normalisePath(current.path) === normalised) navigate(normalised, Object.fromEntries(current.query));
      },
    });
  } catch (error) {
    console.error("[Rentara] page render failed", error);
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
  } finally {
    if (activePageRender === pageRender) activePageRender = null;
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
  const token = session.token;

  try {
    if (role === ROLE.MANAGER) {
      const [stats, tenants, notifications] = await Promise.all([
        api.get(endpoints.dashboardStats()),
        api.get(endpoints.tenants()),
        api.get(endpoints.notifications()),
      ]);
      if (session.token !== token) return;
      setBadges({
        tenants: tenants.length,
        exceptions: stats.openExceptions,
        bills: 0,
        unreadNotifications: notifications.filter((n) => !n.read).length,
      });
    } else if (role === ROLE.STAFF) {
      const exceptions = await api.get(endpoints.exceptions());
      if (session.token !== token) return;
      setBadges({ exceptions: exceptions.filter(e => e.state === "open").length, unreadNotifications: 0 });
    } else if (role === ROLE.TENANT) {
      const [notifications, bills] = await Promise.all([
        api.get(endpoints.notifications()),
        api.get(endpoints.tenantBills(session.user?.tenantId)),
      ]);
      if (session.token !== token) return;
      setBadges({
        myBills: bills.filter((b) => !["paid", "self_reported_paid"].includes(b.paymentStatus) || b.utilityTrackingNeedsReview).length,
        unreadNotifications: notifications.filter((n) => !n.read).length,
      });
    } else {
      const users = await api.get(endpoints.adminUsers());
      if (session.token !== token) return;
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
