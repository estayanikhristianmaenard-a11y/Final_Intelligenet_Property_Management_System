import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import session from "../../auth/session.js";
import { ROLE, ROLE_LABEL, ROLE_SCOPE } from "../../config/constants.js";
import { HOME_FOR_ROLE } from "../../config/navigation.js";
import { initials, avatarTone } from "../../utils/format.js";
import { isMockMode } from "../../config/api.js";

/**
 * Login portal.
 *
 * Presents the three roles as first-class choices so reviewers can enter each
 * strictly separated view. In `mock` mode no credentials are validated; in
 * `live` mode the same selection posts to `POST /auth/login`.
 *
 * @param {HTMLElement} container
 * @param {{redirectTo?:string}} [ctx]
 */
export function renderLogin(container, { redirectTo = "" } = {}) {
  if (!isMockMode()) return renderLiveLogin(container);
  let selectedRole = ROLE.MANAGER;

  const paint = () => {
    render(
      container,
      html`<div class="auth-shell">
        <aside class="auth-hero">
          <div class="auth-hero__brand">
            <span class="sidebar__logo">${icon("building2", { size: 19 })}</span>
            PropertyPro
          </div>

          <div class="auth-hero__copy">
            <h2>Intelligent Property Management Workflow</h2>
            <p>
              OCR-enabled automated billing classification, exception handling and tenant
              notification for boarding houses and residential apartments in Pasig City.
            </p>

            <div class="auth-hero__points">
              <span class="auth-hero__point">
                <i>${icon("check", { size: 14 })}</i> Rule-based validation with an Exception Queue for
                Manager intervention
              </span>
              <span class="auth-hero__point">
                <i>${icon("check", { size: 14 })}</i> Unpaid → Tenant Reported Paid → Paid, with
                receipts only after confirmation
              </span>
              <span class="auth-hero__point">
                <i>${icon("check", { size: 14 })}</i> Web Push billing alerts — no SMS, no tenant
                e-mail
              </span>
            </div>
          </div>

          <p class="auth-hero__foot">
            Rule-based (“intelligent”) processing — no AI, machine learning or predictive analytics.
          </p>
        </aside>

        <main class="auth-panel" id="main-content">
          <div class="auth-card">
            <h1>Sign in</h1>
            <p class="auth-card__sub">
              Choose a role to enter the portal. Front-end RBAC renders only the pages, routes and
              actions that role may use.
            </p>

            <div class="role-picker" role="radiogroup" aria-label="Select a role">
              ${[ROLE.MANAGER, ROLE.ADMIN, ROLE.TENANT]
                .map(
                  (role) => html`<button
                    class="role-option ${role === selectedRole ? "is-selected" : ""}"
                    type="button"
                    role="radio"
                    aria-checked="${role === selectedRole ? "true" : "false"}"
                    data-role="${role}"
                  >
                    <span class="role-option__icon">${icon(iconForRole(role), { size: 18 })}</span>
                    <span class="role-option__meta">
                      <strong>${ROLE_LABEL[role]}</strong>
                      <span>${ROLE_SCOPE[role]}</span>
                    </span>
                    <span class="role-option__check">${icon("check-circle", { size: 18 })}</span>                    </button>`,
                )}
            </div>

            <div class="field">
              <label class="field__label" for="login-email">E-mail</label>
              <input class="input" id="login-email" type="email" value="${emailFor(selectedRole)}" />
            </div>
            <div class="field">
              <label class="field__label" for="login-password">Password</label>
              <input class="input" id="login-password" type="password" value="demo-password" />
            </div>

            <button class="btn btn--primary btn--lg btn--block" type="button" data-sign-in>
              ${icon("lock", { size: 15 })} Sign in as ${ROLE_LABEL[selectedRole]}
            </button>

            <div class="auth-note">
              ${icon("info", { size: 14 })}
              <span>
                Demo mode: credentials are not validated. Connecting a backend only requires
                flipping <code>apiConfig.MODE</code> to <code>"live"</code>.
              </span>
            </div>
          </div>
        </main>
      </div>`,
    );

    container.querySelectorAll("[data-role]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedRole = button.getAttribute("data-role");
        paint();
      });
    });

    container.querySelector("[data-sign-in]")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      button.setAttribute("aria-disabled", "true");
      try {
        await session.signIn(selectedRole);
        const home = `#${HOME_FOR_ROLE[selectedRole] ?? "/dashboard"}`;
        const destination =
          redirectTo && redirectTo !== "/login" && redirectTo !== "/" ? redirectTo : home;
        window.location.hash = destination.startsWith("#")
          ? destination.slice(1)
          : destination;
        if (!window.location.hash) window.location.hash = home.slice(1);
      } finally {
        button.removeAttribute("aria-disabled");
      }
    });
  };

  paint();
}

function iconForRole(role) {
  if (role === ROLE.ADMIN) return "shield";
  if (role === ROLE.TENANT) return "user";
  return "chart";
}

function renderLiveLogin(container) {
  render(container, html`<div class="auth-shell"><aside class="auth-hero"><div class="auth-hero__brand">${icon('building2')} PropertyPro</div><div class="auth-hero__copy"><h2>Property management</h2><p>Access your property and tenant records securely.</p></div></aside><main class="auth-panel" id="main-content"><div class="auth-card"><h1>Sign in</h1><p class="auth-card__sub">Use the account assigned to you.</p><form data-login><div class="field"><label class="field__label" for="email">Email</label><input class="input" id="email" name="email" type="email" autocomplete="username" required></div><div class="field"><label class="field__label" for="password">Password</label><input class="input" id="password" name="password" type="password" autocomplete="current-password" required></div><p data-error role="alert" style="white-space:pre-wrap"></p><button class="btn btn--primary btn--lg btn--block">Sign in</button></form></div></main></div>`);
  const form = container.querySelector('[data-login]');
  form.onsubmit = async event => {
    event.preventDefault();
    form.querySelector('button').disabled = true;
    form.querySelector('[data-error]').textContent = '';
    try { await session.signIn(null, Object.fromEntries(new FormData(form))); }
    catch(error) { form.querySelector('[data-error]').textContent = error.message; }
    finally { form.querySelector('button').disabled = false; }
  };
}

function emailFor(role) {
  const map = {
    [ROLE.ADMIN]: "admin@propertypro.ph",
    [ROLE.MANAGER]: "manager@propertypro.ph",
    [ROLE.TENANT]: "maria.santos@gmail.com",
  };
  return map[role];
}

export { initials, avatarTone };
export default renderLogin;
