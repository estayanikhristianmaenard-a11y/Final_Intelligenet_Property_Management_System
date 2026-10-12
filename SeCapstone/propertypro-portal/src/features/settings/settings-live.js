import { html, render } from "../../utils/dom.js";
import { api } from "../../api/client.js";
import session from "../../auth/session.js";
import { toastSuccess, toastDanger } from "../../components/toast.js";
const sections = ["billing", "mappings", "notifications", "profile"];
export async function renderSettings(container) {
  let active = "billing";
  const config = await api.get("/settings/profile");
  const mappings = await api.get("/mappings");
  const units = await api.get("/units");
  const paint = () => {
    render(
      container,
      html`<section class="page">
        <div class="page-header">
          <div class="page-header__title">
            <h1 id="page-title">Settings</h1>
            <p>
              Billing rules, utility mappings and permitted notification
              channels.
            </p>
          </div>
        </div>
        <div class="settings-layout">
          <nav class="card settings-nav">
            ${sections.map((s) => html`<button class="settings-nav__item ${s === active ? "is-active" : ""}" data-section="${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</button>`)}
          </nav>
          <div class="stack stack-4">${body()}</div>
        </div>
      </section>`,
    );
    container.querySelectorAll("[data-section]").forEach((b) =>
      b.addEventListener("click", () => {
        active = b.dataset.section;
        paint();
      }),
    );
    container
      .querySelector("[data-save-settings]")
      ?.addEventListener("click", save);
  };
  const body = () => {
    if (active === "mappings")
      return html`<section class="card">
        <div class="card__header">
          <h2 class="card__title">Utility mappings</h2>
          <button class="btn btn--primary btn--sm">Add mapping</button>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Account</th>
                <th>Target</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${mappings.map(
                (m) =>
                  html`<tr>
                    <td>${m.provider}</td>
                    <td>${m.account}</td>
                    <td>${units.find((u) => u.id === m.unitId)?.code}</td>
                    <td>${m.category}</td>
                    <td>
                      <button
                        class="btn btn--ghost btn--sm"
                        data-edit-entity="mappings"
                        data-id="${m.id}"
                      >
                        Edit</button
                      ><button
                        class="btn btn--ghost btn--sm"
                        data-delete-entity="mappings"
                        data-id="${m.id}"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>`,
              )}
            </tbody>
          </table>
        </div>
      </section>`;
    if (active === "profile")
      return html`<section class="card">
        <div class="card__header">
          <h2 class="card__title">Manager profile</h2>
        </div>
        <form class="card__body" data-settings-form>
          <div class="field">
            <label class="field__label"
              >Full name<input
                class="input"
                name="name"
                value="${session.user.name}"
                required
            /></label>
          </div>
          <div class="field">
            <label class="field__label"
              >Email<input
                class="input"
                type="email"
                name="email"
                value="${session.user.email}"
                required
            /></label>
          </div>
          <div class="field">
            <label class="field__label"
              >Phone<input
                class="input"
                name="phone"
                value="${session.user.phone ?? ""}"
            /></label>
          </div>
        </form>
        <div class="card__footer">
          <button class="btn btn--primary" data-save-settings>Save</button>
        </div>
      </section>`;
    if (active === "notifications")
      return html`<section class="card">
        <div class="card__header">
          <h2 class="card__title">Tenant notifications</h2>
        </div>
        <form class="card__body" data-settings-form>
          <label class="field__label"
            ><input
              type="checkbox"
              name="pushEnabled"
              ${config.pushEnabled ? "checked" : ""}
            />
            Enable Web Push delivery</label
          >
          <p class="text-xs text-muted">
            Browser subscriptions and configured delivery keys are required.
            Billing remains accessible if delivery fails.
          </p>
          <p>SMS and tenant email alerts are unavailable by policy.</p>
        </form>
        <div class="card__footer">
          <button class="btn btn--primary" data-save-settings>Save</button>
        </div>
      </section>`;
    return html`<section class="card">
      <div class="card__header"><h2 class="card__title">Billing rules</h2></div>
      <form class="card__body" data-settings-form>
        <div class="setting-row">
          <div class="setting-row__meta">
            <strong>One-month advance rent</strong>
            <p>
              Required on first billing; confirmed advance becomes final-cycle
              credit.
            </p>
          </div>
          <span class="badge badge--success">Required</span>
        </div>
        <div class="setting-row">
          <div class="setting-row__meta">
            <strong>Non-prorated rent</strong>
            <p>
              Original anniversary day; last calendar day when that day is
              absent.
            </p>
          </div>
          <span class="badge badge--primary">Fixed</span>
        </div>
        <div class="setting-row">
          <div class="setting-row__meta">
            <strong>Shared allocation</strong>
            <p>
              Equal split; remaining centavos follow permanent tenant ID order.
            </p>
          </div>
          <span class="badge badge--primary">Equal split</span>
        </div>
        <div class="setting-row">
          <div class="setting-row__meta">
            <strong>Due-date reminders</strong>
            <p>Three calendar days before the due date in Philippine time.</p>
          </div>
          <span class="badge badge--primary">3 days</span>
        </div>
        <div class="field">
          <label class="field__label"
            >Intake mailbox address<input
              class="input"
              name="intakeMailbox"
              type="email"
              value="${config.intakeMailbox}" /></label
          ><span class="field__hint"
            >Account credentials are configured by the operator on the
            server.</span
          >
        </div>
      </form>
      <div class="card__footer">
        <button class="btn btn--primary" data-save-settings>Save</button>
      </div>
    </section>`;
  };
  async function save() {
    const form = container.querySelector("form");
    if (!form.reportValidity()) return;
    const button = container.querySelector("[data-save-settings]");
    button.disabled = true;
    try {
      const data = Object.fromEntries(new FormData(form));
      if (active === "profile") {
        session.updateUser(await api.patch("/auth/profile", data));
      } else {
        if (active === "notifications")
          data.pushEnabled = form.elements.pushEnabled.checked;
        Object.assign(config, await api.patch("/settings/profile", data));
      }
      toastSuccess("Saved", "The changes were saved.");
      window.dispatchEvent(new CustomEvent("app:data-changed"));
    } catch (e) {
      toastDanger("Could not save", e.message);
    } finally {
      button.disabled = false;
    }
  }
  paint();
}

export default renderSettings;
