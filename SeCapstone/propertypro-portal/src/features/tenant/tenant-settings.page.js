import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { badge } from "../../components/badge.js";
import { toastSuccess } from "../../components/toast.js";
import session from "../../auth/session.js";
import { initials, avatarTone } from "../../utils/format.js";
import { PROHIBITED_CHANNELS } from "../../config/constants.js";

/** Tenant view — "Settings": profile, notification preferences, security. */
export function renderTenantSettings(container) {
  const user = session.user;

  render(
    container,
    html`<section class="page" aria-labelledby="page-title">
      <div class="page-header">
        <div class="page-header__title">
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <span>PropertyPro</span>${icon("chevron-right", { size: 12 })}
            <span>Tenant</span>${icon("chevron-right", { size: 12 })}
            <span>Settings</span>
          </nav>
          <h1 id="page-title">Settings</h1>
          <p>Your profile, notification preferences and account security.</p>
        </div>
      </div>

      <div class="settings-layout">
        <nav class="card settings-nav" aria-label="Settings sections">
          <span class="settings-nav__item is-active">${icon("user", { size: 16 })} Profile</span>
          <span class="settings-nav__item">${icon("bell", { size: 16 })} Notifications</span>
          <span class="settings-nav__item">${icon("lock", { size: 16 })} Security</span>
        </nav>

        <div class="stack stack-4">
          <section class="card">
            <div class="card__header">
              <div class="row row-3">
                <span class="avatar avatar--lg ${avatarTone(user?.name ?? "")}"
                  >${initials(user?.name ?? "")}</span
                >
                <div>
                  <h2 class="card__title">${user?.name ?? "Tenant"}</h2>
                  <p class="card__subtitle">${user?.email ?? ""}</p>
                </div>
              </div>
              ${badge("Tenant", "primary")}
            </div>
            <div class="card__body">
              <div class="field-row">
                <div class="field">
                  <label class="field__label" for="ts-name">Full name</label>
                  <input class="input" id="ts-name" type="text" value="${user?.name ?? ""}" />
                </div>
                <div class="field">
                  <label class="field__label" for="ts-email">E-mail</label>
                  <input class="input" id="ts-email" type="email" value="${user?.email ?? ""}" />
                </div>
              </div>
              <div class="field-row">
                <div class="field">
                  <label class="field__label" for="ts-phone">Mobile number</label>
                  <input class="input" id="ts-phone" type="tel" value="+63 917 428 1195" />
                  <span class="field__hint">Used for your account only — never for billing alerts.</span>
                </div>
                <div class="field">
                  <label class="field__label" for="ts-unit">Assigned unit</label>
                  <input class="input" id="ts-unit" type="text" value="${user?.unitCode ?? "—"}" disabled />
                </div>
              </div>
            </div>
            <div class="card__footer">
              <button class="btn btn--primary btn--sm" type="button" data-action="save-profile">
                ${icon("check", { size: 14 })} Save changes
              </button>
            </div>
          </section>

          <section class="card">
            <div class="card__header">
              <div>
                <h2 class="card__title">Notification preferences</h2>
                <p class="card__subtitle">Web Push is the only permitted channel</p>
              </div>
            </div>
            <div class="card__body">
              ${toggleRow(
                "Billing updates",
                "Notify me when a new billing statement is available.",
                true,
              )}
              ${toggleRow(
                "Due-date reminder",
                "Sent 3 days before the due date.",
                true,
              )}
              ${toggleRow(
                "Payment confirmation",
                "Notify me once the Manager confirms my payment.",
                true,
              )}
              <div class="setting-row">
                <div class="setting-row__meta">
                  <strong>SMS &amp; e-mail alerts</strong>
                  <p>
                    Not part of this system. ${PROHIBITED_CHANNELS.join(", ")} are explicitly out of
                    scope.
                  </p>
                </div>
                <span class="badge badge--danger">Unavailable</span>
              </div>
            </div>
          </section>

          <section class="card">
            <div class="card__header">
              <div>
                <h2 class="card__title">Security</h2>
                <p class="card__subtitle">Session and account protection</p>
              </div>
            </div>
            <div class="card__body">
              <div class="setting-row">
                <div class="setting-row__meta">
                  <strong>Password</strong>
                  <p>Last changed 42 days ago.</p>
                </div>
                <button class="btn btn--secondary btn--sm" type="button">Change password</button>
              </div>
              <div class="setting-row">
                <div class="setting-row__meta">
                  <strong>Active session</strong>
                  <p>Signed in on this browser. Sessions expire server-side.</p>
                </div>
                <button class="btn btn--secondary btn--sm" type="button" data-action="sign-out">
                  Sign out
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>`,
  );

  container.querySelector('[data-action="save-profile"]')?.addEventListener("click", () =>
    toastSuccess("Profile saved", "Your details were updated."),
  );
  container.querySelector('[data-action="sign-out"]')?.addEventListener("click", () => {
    session.signOut();
    location.hash = "/login";
  });
}

function toggleRow(title, body, on) {
  return html`<div class="setting-row">
    <div class="setting-row__meta">
      <strong>${title}</strong>
      <p>${body}</p>
    </div>
    <button
      class="switch ${on ? "is-on" : ""}"
      type="button"
      role="switch"
      aria-checked="${on ? "true" : "false"}"
      data-toggle="${title}"
      aria-label="${title}"
    ></button>
  </div>`;
}

export default renderTenantSettings;
