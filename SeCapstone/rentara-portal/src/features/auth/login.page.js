import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { brandMark } from "../../components/brand-mark.js";
import session from "../../auth/session.js";
import { ROLE } from "../../config/constants.js";
import { HOME_FOR_ROLE } from "../../config/navigation.js";
import { resolveRoute, normalisePath } from "../../auth/guards.js";
import { navigate } from "../../app/router.js";
import { initials, avatarTone } from "../../utils/format.js";

/** Credentials determine access; local shortcuts only fill demo credentials. */
export function renderLogin(container, { redirectTo = "" } = {}) {
  let selectedRole = ROLE.MANAGER;
  const localDemoLogin = isLocalDemoHost(window.location.hostname);
  const targetPath = normalisePath(redirectTo);
  const hasDestination = Boolean(redirectTo) && !["/login", "/", "/403"].includes(targetPath);
  const roles = [[ROLE.TENANT, "Tenant"], [ROLE.MANAGER, "Manager"], [ROLE.ADMIN, "Admin"]];
  const paint = () => {
    render(container, html`<div class="auth-shell auth-shell--blue">
      <aside class="auth-hero">
        <div class="auth-hero__brand"><span class="auth-brand-icon">${brandMark(36)}</span><div><strong>Rentara</strong><span>Property management portal</span></div></div>
        <div class="auth-hero__copy">
          <h2>Your bills,<br> in one place.</h2>
          <p>Keep rent records, utility bills, and due dates within reach.</p>
          <div class="auth-hero__points">
            <span class="auth-hero__point"><i>${icon("receipt", { size: 20 })}</i>View rent and confirmed receipts.</span>
            <span class="auth-hero__point"><i>${icon("zap", { size: 20 })}</i>Track electricity and water bills.</span>
            <span class="auth-hero__point"><i>${icon("bell", { size: 20 })}</i>Check due dates and saved alerts.</span>
          </div>
        </div>
        <p class="auth-hero__foot">For tenants, property managers, and system administrators.</p>
      </aside>
      <main class="auth-panel" id="main-content">
        <div class="auth-card">
          ${hasDestination ? html`<div class="auth-context">${icon("bell", { size: 19 })}<span>Sign in to view your record or notification.</span></div>` : null}
          <h1>Welcome back</h1>
          <p class="auth-card__sub">Sign in to your Rentara account.</p>
          ${localDemoLogin ? html`<div class="auth-demo-shortcuts"><span>Demo account</span><div class="role-picker" role="group" aria-label="Fill demo account credentials">${roles.map(([role, label]) => html`<button class="role-option ${selectedRole === role ? "is-selected" : ""}" type="button" data-role="${role}" aria-pressed="${selectedRole === role}">${label}</button>`)}</div></div>` : html`<p class="auth-supported-roles">Tenant · Manager · Admin</p>`}
          <form data-login-form>
            <div class="auth-error" data-login-error role="alert" tabindex="-1" hidden></div>
            <div class="field"><label class="field__label" for="login-email">Email address</label><input class="input" id="login-email" name="email" type="email" autocomplete="username" autocapitalize="none" spellcheck="false" value="${localDemoLogin ? emailFor(selectedRole) : ""}" placeholder="you@example.com" required /></div>
            <div class="field"><label class="field__label" for="login-password">Password</label><div class="auth-password"><input class="input" id="login-password" name="password" type="password" autocomplete="current-password" value="${localDemoLogin ? "LocalDemo!2026" : ""}" required /><button class="auth-password__toggle" type="button" aria-label="Show password" aria-controls="login-password" title="Show password" data-toggle-password><span data-password-toggle-label>Show</span></button></div></div>
            <button class="btn btn--primary btn--lg btn--block" type="submit" data-sign-in>Sign in ${icon("arrow-right", { size: 18 })}</button>
          </form>
          <details class="auth-help"><summary>Need help signing in?</summary><p>Contact your System Administrator to create an account or reset your password.</p></details>
          ${localDemoLogin ? html`<p class="auth-demo-note">Local demo password: <strong>LocalDemo!2026</strong></p>` : null}
        </div>
        <p class="auth-device-note">Use your phone, tablet, or desktop browser.</p>
      </main>
    </div>`);
    container.querySelectorAll("[data-role]").forEach((button) => button.addEventListener("click", () => {
      selectedRole = button.dataset.role;
      paint();
      container.querySelector(`[data-role="${selectedRole}"]`)?.focus();
    }));
    container.querySelector("[data-toggle-password]").addEventListener("click", (event) => {
      const button = event.currentTarget;
      const password = container.querySelector("#login-password");
      const visible = password.type === "password";
      password.type = visible ? "text" : "password";
      const label = visible ? "Hide password" : "Show password";
      button.setAttribute("aria-label", label);
      button.title = label;
      button.querySelector("[data-password-toggle-label]").textContent = visible ? "Hide" : "Show";
    });
    container.querySelector("[data-login-form]").addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = container.querySelector("[data-sign-in]");
      if (button.disabled) return;
      const errorBox = container.querySelector("[data-login-error]");
      const shortcuts = container.querySelectorAll("[data-role]");
      errorBox.hidden = true;
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      button.textContent = "Signing in…";
      shortcuts.forEach((shortcut) => { shortcut.disabled = true; });
      try {
        await session.signIn(selectedRole, {
          email: container.querySelector("#login-email").value.trim(),
          password: container.querySelector("#login-password").value,
        });
        const permitted = hasDestination && resolveRoute(targetPath).status === "ok";
        navigate(permitted ? redirectTo.replace(/^#/, "") : HOME_FOR_ROLE[session.role] ?? "/dashboard");
      } catch (error) {
        errorBox.textContent = error.message || "Sign in failed. Please try again.";
        errorBox.hidden = false;
        errorBox.focus();
      } finally {
        button.disabled = false;
        button.removeAttribute("aria-busy");
        render(button, html`Sign in ${icon("arrow-right", { size: 18 })}`);
        shortcuts.forEach((shortcut) => { shortcut.disabled = false; });
      }
    });
  };
  paint();
}

function isLocalDemoHost(hostname) {
  if (["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname)) return true;
  const octets = hostname.split(".");
  if (octets.length !== 4 || !octets.every(part => /^\d{1,3}$/.test(part) && Number(part) <= 255)) return false;
  const [first, second] = octets.map(Number);
  return first === 10 || (first === 192 && second === 168) || (first === 172 && second >= 16 && second <= 31);
}

function emailFor(role) {
  return { [ROLE.ADMIN]: "admin@propertypro.ph", [ROLE.MANAGER]: "manager@propertypro.ph", [ROLE.TENANT]: "maria.santos@gmail.com" }[role];
}
export { initials, avatarTone };
export default renderLogin;
