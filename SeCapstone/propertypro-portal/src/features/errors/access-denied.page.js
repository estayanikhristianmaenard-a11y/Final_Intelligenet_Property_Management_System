import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import session from "../../auth/session.js";
import { ROLE_LABEL, ROLE_SCOPE } from "../../config/constants.js";
import { can } from "../../auth/rbac.js";

/**
 * 403 — Access Denied.
 *
 * Rendered when a signed-in user deep-links to a route their role does not
 * own. This is the visible half of the strict role separation: Admin, Manager
 * and Tenant views are disjoint, and reaching across is refused explicitly
 * rather than silently redirecting.
 *
 * @param {HTMLElement} container
 * @param {{path?:string}} [ctx]
 */
export function renderAccessDenied(container, { path = "" } = {}) {
  const role = session.role;
  const allowed = describeAllowedRoles(path);

  render(
    container,
    html`<section class="page">
      <div class="access-denied">
        <div>
          <div class="access-denied__badge">${icon("lock", { size: 30 })}</div>
          <p class="text-xs font-semibold text-danger" style="letter-spacing:.1em;text-transform:uppercase">
            403 · Access denied
          </p>
          <h1 class="mt-2">This view is not available to the ${ROLE_LABEL[role]} role</h1>
          <p>
            ${allowed} Your session is scoped to <strong>${ROLE_LABEL[role]}</strong> —
            ${ROLE_SCOPE[role].toLowerCase()}. Role-based access control restricts both navigation
            and data access on this route${path ? html` <code>${path}</code>` : ""}.
          </p>

          <div class="access-denied__actions">
            <a class="btn btn--primary" href="${session.homePath}"
              >${icon("home", { size: 15 })} Go to my dashboard</a
            >
            <button class="btn btn--secondary" type="button" data-action="switch-role">
              ${icon("refresh", { size: 15 })} Switch role
            </button>
          </div>

          <div class="error-state__roles mt-6">
            ${[ROLE_LABEL.admin, ROLE_LABEL.manager, ROLE_LABEL.tenant]
              .map((label) => html`<span class="chip">${label} view</span>`)}
          </div>

          <p class="text-xs text-muted mt-4" style="max-width:56ch;margin-inline:auto">
            The frontend guard is defence-in-depth. The backend must return
            <code>403 Forbidden</code> for every endpoint a role is not granted.
          </p>
        </div>
      </div>
    </section>`,
  );

  container.querySelector('[data-action="switch-role"]')?.addEventListener("click", () => {
    session.signOut();
    location.hash = "/login";
  });
}

/** 404 — unknown route. */
export function renderNotFound(container, { path = "" } = {}) {
  render(
    container,
    html`<section class="page">
      <div class="not-found">
        <span class="error-state__code">404</span>
        <h1>Page not found</h1>
        <p class="text-secondary">
          <code>${path}</code> does not match any registered route.
        </p>
        <a class="btn btn--primary" href="${session.homePath}"
          >${icon("home", { size: 15 })} Back to dashboard</a
        >
      </div>
    </section>`,
  );
}

function describeAllowedRoles(path) {
  const owners = [];
  if (path.startsWith("/admin")) owners.push("Admin");
  else if (path.startsWith("/tenant")) owners.push("Tenant");
  else owners.push("Manager");

  return html`This route belongs to the <strong>${owners.join(" or ")}</strong> role${
    owners.length > 1 ? "s" : ""
  }.`;
}

export { can };
export default renderAccessDenied;
