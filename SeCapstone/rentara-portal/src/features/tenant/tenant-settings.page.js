import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { badge } from "../../components/badge.js";
import { toastSuccess } from "../../components/toast.js";
import session from "../../auth/session.js";
import { initials, avatarTone } from "../../utils/format.js";
import { api } from "../../api/client.js";
import { dialogForm } from "../../app/workflows.js";
import { toastDanger } from "../../components/toast.js";
import { watchForm } from "../../app/form-state.js";
import { beginAction } from "../../components/action-feedback.js";

/** Tenant view — "Settings": profile, notification preferences, security. */
export async function renderTenantSettings(container) {
  const unit = await api.get("/tenant/unit");
  const user = { ...session.user, unitCode: unit.code };

  render(
    container,
    html`<section class="page" aria-labelledby="page-title">
      <div class="page-header">
        <div class="page-header__title">
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <span>Rentara</span>${icon("chevron-right", { size: 12 })}
            <span>Tenant</span>${icon("chevron-right", { size: 12 })}
            <span>Settings</span>
          </nav>
          <h1 id="page-title">Settings</h1>
          <p>Your profile, notification preferences and account security.</p>
        </div>
      </div>

      <div class="settings-layout">
        <nav class="card settings-nav" aria-label="Settings sections">
          <button class="settings-nav__item is-active" aria-current="location" data-settings-jump="0">
            ${icon("user", { size: 16 })} Profile
          </button>
          <button class="settings-nav__item" data-settings-jump="1">
            ${icon("bell", { size: 16 })} Notifications
          </button>
          <button class="settings-nav__item" data-settings-jump="2">
            ${icon("lock", { size: 16 })} Security
          </button>
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
                  <input
                    class="input"
                    id="ts-name"
                    type="text"
                    value="${user?.name ?? ""}"
                  />
                </div>
                <div class="field">
                  <label class="field__label" for="ts-email">E-mail</label>
                  <input
                    class="input"
                    id="ts-email"
                    type="email"
                    value="${user?.email ?? ""}"
                  />
                </div>
              </div>
              <div class="field-row">
                <div class="field">
                  <label class="field__label" for="ts-phone"
                    >Mobile number</label
                  >
                  <input
                    class="input"
                    id="ts-phone"
                    type="tel"
                    value="${user?.phone ?? ""}"
                  />
                  <span class="field__hint"
                    >Used for your account only — never for billing
                    alerts.</span
                  >
                </div>
                <div class="field">
                  <label class="field__label" for="ts-unit"
                    >Assigned unit</label
                  >
                  <input
                    class="input"
                    id="ts-unit"
                    type="text"
                    value="${user?.unitCode ?? "—"}"
                    disabled
                  />
                </div>
              </div>
            </div>
            <div class="card__footer">
              <button
                class="btn btn--primary btn--sm"
                type="button"
                data-action="save-profile"
              >
                ${icon("check", { size: 14 })} Save changes
              </button>
            </div>
          </section>

          <section class="card">
            <div class="card__header">
              <div>
                <h2 class="card__title">Notification preferences</h2>
                <p class="card__subtitle">
                  Portal alerts, Web Push, and optional rent emails
                </p>
              </div>
            </div>
            <div class="card__body">
              ${toggleRow(
                "Billing updates",
                "Notify me when a new billing statement is available.",
                user?.preferences?.billing !== false,
              )}
              ${toggleRow(
                "Due-date reminder",
                "Sent 3 days before the due date.",
                user?.preferences?.reminder !== false,
              )}
              ${toggleRow(
                "Payment confirmation",
                "Notify me once the Manager confirms my payment.",
                user?.preferences?.payment !== false,
              )}
              ${toggleRow("Rent email notifications", "Rent updates, eligible reminders, and confirmed-payment notices. Utility tracking uses the portal and Web Push.", user?.preferences?.emailRent !== false)}
              <div class="setting-row">
                <div class="setting-row__meta">
                  <strong>SMS alerts</strong>
                  <p>
                    SMS notifications are not supported.
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
                  <p>Change your account password.</p>
                </div>
                <button
                  class="btn btn--secondary btn--sm"
                  type="button"
                  data-change-password
                >
                  Change password
                </button>
              </div>
              <div class="setting-row">
                <div class="setting-row__meta">
                  <strong>Active session</strong>
                  <p>Signed in on this browser. Sessions expire server-side.</p>
                </div>
                <button
                  class="btn btn--secondary btn--sm"
                  type="button"
                  data-action="sign-out"
                >
                  Sign out
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>`,
  );

  const profile = container.querySelector("#ts-name").closest(".card");
  const footer = profile.querySelector(".card__footer");
  const status=document.createElement("span");status.className="save-status";status.setAttribute("role","status");
  const cancel=document.createElement("button");cancel.className="btn btn--secondary btn--sm";cancel.type="button";cancel.textContent="Cancel changes";
  footer.prepend(status,cancel);
  const guard=watchForm(profile,{onChange:dirty=>{status.textContent=dirty ? "Unsaved changes" : "";cancel.hidden=!dirty;footer.classList.toggle("has-unsaved",dirty);}});
  cancel.addEventListener("click",()=>guard.reset());
  container
    .querySelector('[data-action="save-profile"]')
    ?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      const finish=beginAction(button);
      let saved=false;
      try {
        const email = container.querySelector("#ts-email");
        if (!email.reportValidity()) return;
        profile.inert=true;
        const updated = await api.patch("/auth/profile", {
          name: container.querySelector("#ts-name").value,
          email: email.value,
          phone: container.querySelector("#ts-phone").value,
        });
        session.updateUser(updated);
        guard.markClean();saved=true;
        toastSuccess("Profile saved", "Your details were updated.");
        window.dispatchEvent(new CustomEvent("app:data-changed"));
      } catch (e) {
        toastDanger("Save failed", e.message);
      } finally {
        profile.inert=false;
        finish(saved);
      }
    });
  container.querySelectorAll("[data-toggle]").forEach((button) =>
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        const keys = {
          "Billing updates": "billing",
          "Due-date reminder": "reminder",
          "Payment confirmation": "payment",
          "Rent email notifications": "emailRent",
        };
        const preferences = {
          ...session.user.preferences,
          [keys[button.dataset.toggle]]:
            button.getAttribute("aria-checked") !== "true",
        };
        session.updateUser(await api.patch("/auth/profile", { preferences }));
        button.classList.toggle("is-on");
        button.setAttribute(
          "aria-checked",
          String(preferences[keys[button.dataset.toggle]]),
        );
        toastSuccess(
          "Preference saved",
          "Your notification preference was saved.",
        );
      } catch (e) {
        toastDanger("Save failed", e.message);
      } finally {
        button.disabled = false;
      }
    }),
  );
  container
    .querySelectorAll("[data-settings-jump]")
    .forEach((button) =>
      button.addEventListener("click", () => {
        container.querySelectorAll("[data-settings-jump]").forEach(item => {
          item.classList.toggle("is-active", item === button);
          item.setAttribute("aria-current", item === button ? "location" : "false");
        });
        container
          .querySelectorAll(".stack > section")
          [Number(button.dataset.settingsJump)]?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
          });
      }),
    );
  container
    .querySelector("[data-change-password]")
    ?.addEventListener("click", () =>
      dialogForm({
        title: "Change password",
        fields: [
          {
            key: "currentPassword",
            label: "Current password",
            type: "password",
            required: true,
          },
          {
            key: "password",
            label: "New password (12+ characters)",
            type: "password",
            required: true,
          },
        ],
        save: (data) => api.patch("/auth/profile", data),
        onSaved: () => {
          session.clear();
          location.hash = "/login";
        },
      }),
    );
  container
    .querySelector('[data-action="sign-out"]')
    ?.addEventListener("click", async () => {
      await session.signOut();
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
