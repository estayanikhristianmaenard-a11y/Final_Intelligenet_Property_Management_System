import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import session from "../../auth/session.js";
import { ROLE, ROLE_LABEL, ROLE_SCOPE } from "../../config/constants.js";
import { HOME_FOR_ROLE } from "../../config/navigation.js";
import { resolveRoute, normalisePath } from "../../auth/guards.js";
import { navigate } from "../../app/router.js";
import { initials, avatarTone } from "../../utils/format.js";
import { toastDanger } from "../../components/toast.js";

/** Credential login; the server account determines the authorized role. */
export function renderLogin(container, { redirectTo = "" } = {}) {
  let selectedRole = ROLE.MANAGER;

  const paint = () => {
    render(
      container,
      html`<div class="auth-shell">
        <aside class="auth-hero">
          <div class="auth-hero__brand">
            <span class="sidebar__logo"
              >${icon("building2", { size: 19 })}</span
            >
            PropertyPro
          </div>

          <div class="auth-hero__copy">
            <h2>Intelligent Property Management Workflow</h2>
            <p>
              OCR-enabled automated billing classification, exception handling
              and tenant notification for boarding houses and residential
              apartments in Pasig City.
            </p>

            <div class="auth-hero__points">
              <span class="auth-hero__point">
                <i>${icon("check", { size: 14 })}</i> Rule-based validation with
                an Exception Queue for Manager intervention
              </span>
              <span class="auth-hero__point">
                <i>${icon("check", { size: 14 })}</i> Unpaid → Tenant Reported
                Paid → Paid, with receipts only after confirmation
              </span>
              <span class="auth-hero__point">
                <i>${icon("check", { size: 14 })}</i> Web Push billing alerts —
                no SMS, no tenant e-mail
              </span>
            </div>
          </div>

          <p class="auth-hero__foot">
            Rule-based (“intelligent”) processing — no AI, machine learning or
            predictive analytics.
          </p>
        </aside>

        <main class="auth-panel" id="main-content">
          <div class="auth-card">
            <h1>Sign in</h1>
            <p class="auth-card__sub">
              Sign in with your account. Your assigned role controls access.
            </p>

            <div
              class="role-picker"
              role="radiogroup"
              aria-label="Select a role"
            >
              ${[ROLE.MANAGER, ROLE.ADMIN, ROLE.TENANT].map(
                (role) =>
                  html`<button
                    class="role-option ${role === selectedRole ? "is-selected" : ""}"
                    type="button"
                    role="radio"
                    aria-checked="${role === selectedRole ? "true" : "false"}"
                    data-role="${role}"
                  >
                    <span class="role-option__icon"
                      >${icon(iconForRole(role), { size: 18 })}</span
                    >
                    <span class="role-option__meta">
                      <strong>${ROLE_LABEL[role]}</strong>
                      <span>${ROLE_SCOPE[role]}</span>
                    </span>
                    <span class="role-option__check"
                      >${icon("check-circle", { size: 18 })}</span
                    >
                  </button>`,
              )}
            </div>

            <div class="field">
              <label class="field__label" for="login-email">E-mail</label>
              <input
                class="input"
                id="login-email"
                type="email"
                autocomplete="username"
                value="${emailFor(selectedRole)}"
                required
              />
            </div>
            <div class="field">
              <label class="field__label" for="login-password">Password</label>
              <div class="auth-password">
                <input
                  class="input"
                  id="login-password"
                  type="password"
                  autocomplete="current-password"
                  required
                />
                <button
                  class="auth-password__toggle"
                  type="button"
                  aria-label="Show password"
                  aria-controls="login-password"
                  title="Show password"
                  data-toggle-password
                >
                  ${icon("eye", { size: 16 })}
                  <span data-password-toggle-label>Show</span>
                </button>
              </div>
            </div>

            <button
              class="btn btn--primary btn--lg btn--block"
              type="button"
              data-sign-in
            >
              ${icon("lock", { size: 15 })} Sign in as
              ${ROLE_LABEL[selectedRole]}
            </button>

            <div class="auth-note">
              ${icon("info", { size: 14 })}
              <span>
                Use the credentials assigned by your administrator. Role
                selection fills the example email only.
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

    container
      .querySelector("[data-toggle-password]")
      .addEventListener("click", (event) => {
        const button = event.currentTarget;
        const password = container.querySelector("#login-password");
        const visible = password.type === "password";
        password.type = visible ? "text" : "password";
        const label = visible ? "Hide password" : "Show password";
        button.setAttribute("aria-label", label);
        button.title = label;
        button.querySelector("[data-password-toggle-label]").textContent =
          visible ? "Hide" : "Show";
      });

    container
      .querySelector("[data-sign-in]")
      ?.addEventListener("click", async (event) => {
        const button = event.currentTarget;
        button.setAttribute("aria-disabled", "true");
        button.disabled = true;
        try {
          const email = container.querySelector("#login-email");
          const password = container.querySelector("#login-password");
          if (!email.reportValidity() || !password.reportValidity()) return;
          await session.signIn(selectedRole, {
            email: email.value.trim(),
            password: password.value,
          });
          const home = HOME_FOR_ROLE[session.role] ?? "/dashboard";
          const targetPath = normalisePath(redirectTo);
          const permitted =
            redirectTo &&
            !["/login", "/", "/403"].includes(targetPath) &&
            resolveRoute(targetPath).status === "ok";
          navigate(permitted ? redirectTo.replace(/^#/, "") : home);
        } catch (error) {
          toastDanger("Sign in failed", error.message);
        } finally {
          button.disabled = false;
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
