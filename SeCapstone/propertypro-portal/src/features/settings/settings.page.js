import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { badge } from "../../components/badge.js";
import { toastSuccess } from "../../components/toast.js";
import { api } from "../../api/client.js";
import { endpoints } from "../../api/endpoints.js";
import { ALLOCATION_RULES, PROHIBITED_CHANNELS } from "../../config/constants.js";

const SECTIONS = [
  { id: "billing", label: "Billing Rules", icon: "receipt" },
  { id: "mappings", label: "Utility Mappings", icon: "layers" },
  { id: "notifications", label: "Notifications", icon: "bell" },
  { id: "profile", label: "Profile", icon: "user" },
];

/** Manager Settings — billing configuration and permitted notification channels. */
export async function renderSettings(container) {
  let active = "billing";

  const paint = (config) => {
    render(container, frame(nav(active), section(config, active)));
    container.querySelectorAll("[data-section]").forEach((button) => {
      button.addEventListener("click", () => {
        active = button.getAttribute("data-section");
        paint(config);
      });
    });
    container.querySelectorAll("[data-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        button.classList.toggle("is-on");
        const on = button.classList.contains("is-on");
        button.setAttribute("aria-checked", String(on));
        toastSuccess(
          "Setting updated",
          `${button.getAttribute("data-toggle")} ${on ? "enabled" : "disabled"}.`,
        );
      });
    });
  };

  try {
    const config = await api.get(endpoints.profile());
    paint(config);
  } catch (error) {
    render(
      container,
      frame(
        nav(active),
        html`<div class="card">
          <div class="empty-state">
            <h4>Settings could not be loaded</h4>
            <p>${error.message}</p>
          </div>
        </div>`,
      ),
    );
  }
}

function frame(navMarkup, content) {
  return html`<section class="page" aria-labelledby="page-title">
    <div class="page-header">
      <div class="page-header__title">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <span>PropertyPro</span>${icon("chevron-right", { size: 12 })}
          <span>System</span>${icon("chevron-right", { size: 12 })}
          <span>Settings</span>
        </nav>
        <h1 id="page-title">Settings</h1>
        <p>Billing rules, utility mappings and permitted notification channels.</p>
      </div>
    </div>

    <div class="settings-layout">
      <nav class="card settings-nav" aria-label="Settings sections">${navMarkup}</nav>
      <div class="stack stack-4">${content}</div>
    </div>
  </section>`;
}

function nav(active) {
  return html`${SECTIONS.map(
    (section) => html`<button
      class="settings-nav__item ${section.id === active ? "is-active" : ""}"
      type="button"
      data-section="${section.id}"
    >
      ${icon(section.icon, { size: 16 })} ${section.label}
    </button>`,
  )}`;
}

function section(config, active) {
  switch (active) {
    case "mappings":
      return mappingsSection();
    case "notifications":
      return notificationsSection(config);
    case "profile":
      return profileSection();
    case "billing":
    default:
      return billingSection(config);
  }
}

function billingSection(config) {
  return html`<section class="card">
    <div class="card__header">
      <div>
        <h2 class="card__title">Billing rules</h2>
        <p class="card__subtitle">Rent generation, arrangements and allocation</p>
      </div>
      <button class="btn btn--primary btn--sm" type="button">${icon("check", { size: 14 })} Save</button>
    </div>
    <div class="card__body">
      <div class="setting-row">
        <div class="setting-row__meta">
          <strong>Advance rent on first billing</strong>
          <p>Records one-month advance rent as a separate line item in the first billing record.</p>
        </div>
        <button class="switch ${config.advanceRentEnabled ? "is-on" : ""}" type="button"
          role="switch" aria-checked="${config.advanceRentEnabled ? "true" : "false"}" data-toggle="Advance rent"></button>
      </div>

      <div class="setting-row">
        <div class="setting-row__meta">
          <strong>Pro-rate rent</strong>
          <p>Disabled by policy — rent is fixed and non-prorated, generated on the lease anniversary.</p>
        </div>
        <button class="switch ${config.prorateEnabled ? "is-on" : ""}" type="button"
          role="switch" aria-checked="${config.prorateEnabled ? "true" : "false"}" data-toggle="Pro-rating"></button>
      </div>

      <div class="setting-row">
        <div class="setting-row__meta">
          <strong>Shared-occupancy allocation rule</strong>
          <p>
            Selected or configured by the Manager. Allocated amounts use exactly two decimal
            places and must total the source billing amount.
          </p>
        </div>
        <select class="select input" style="max-width:280px">
          ${ALLOCATION_RULES.map(
            (rule) => html`<option value="${rule.id}" ${rule.id === config.allocationRule ? "selected" : ""}>
              ${rule.label}
            </option>`,
          )}
        </select>
      </div>

      <div class="setting-row">
        <div class="setting-row__meta">
          <strong>Due-date reminder</strong>
          <p>Web Push reminder issued this many days before the due date.</p>
        </div>
        <select class="select input" style="max-width:120px">
          <option ${config.reminderDays === 1 ? "selected" : ""}>1</option>
          <option ${config.reminderDays === 3 ? "selected" : ""}>3</option>
          <option ${config.reminderDays === 5 ? "selected" : ""}>5</option>
        </select>
      </div>
    </div>

    <div class="card__footer">
      <div class="notice-strip notice-strip--info">
        <span class="notice-strip__icon">${icon("info", { size: 14 })}</span>
        <span>
          Billing categories are limited to <strong>rent</strong>, <strong>electricity</strong> and
          <strong>water</strong>. Rent is generated monthly on the configured lease-anniversary date.
        </span>
      </div>
    </div>
  </section>`;
}

function mappingsSection() {
  const mappings = [
    { provider: "Meralco", account: "MER-552194", target: "Building A · main meter", category: "Electricity" },
    { provider: "Meralco", account: "MER-552907", target: "Building C · main meter", category: "Electricity" },
    { provider: "Maynilad", account: "MNL-884310", target: "Building B · water line", category: "Water" },
    { provider: "Maynilad", account: "MNL-885022", target: "unmapped", category: "Water" },
    { provider: "Manila Water", account: "—", target: "Building C · water line", category: "Water" },
  ];

  return html`<section class="card">
    <div class="card__header">
      <div>
        <h2 class="card__title">Utility provider &amp; account mappings</h2>
        <p class="card__subtitle">
          Maps OCR-extracted providers and account references to properties and units
        </p>
      </div>
      <button class="btn btn--primary btn--sm" type="button">${icon("plus", { size: 14 })} Add mapping</button>
    </div>
    <div class="table-wrap">
      <table class="data-table" aria-label="Utility mappings">
        <thead>
          <tr>
            <th scope="col">Provider</th>
            <th scope="col">Account / reference</th>
            <th scope="col">Category</th>
            <th scope="col">Target</th>
            <th scope="col">State</th>
          </tr>
        </thead>
        <tbody>
          ${mappings.map(
            (row) => html`<tr>
              <td class="cell-strong">${row.provider}</td>
              <td class="font-mono text-xs">${row.account}</td>
              <td>${badge(row.category, row.category === "Water" ? "info" : "warning")}</td>
              <td>${row.target}</td>
              <td>
                ${row.target === "unmapped"
                  ? badge("Unmapped", "danger", { dot: true })
                  : badge("Mapped", "success", { dot: true })}
              </td>
            </tr>`,
          )}
        </tbody>
      </table>
    </div>
    <div class="card__footer">
      <span class="text-xs text-muted">
        Unmapped accounts are routed to the Exception Queue instead of being guessed.
      </span>
    </div>
  </section>`;
}

function notificationsSection(config) {
  return html`<section class="card">
    <div class="card__header">
      <div>
        <h2 class="card__title">Tenant notifications</h2>
        <p class="card__subtitle">Web Push only — the study excludes SMS and tenant e-mail</p>
      </div>
      <span class="badge badge--primary">${icon("bell", { size: 12 })} Web Push</span>
    </div>
    <div class="card__body">
      <div class="setting-row">
        <div class="setting-row__meta">
          <strong>Web Push Notifications</strong>
          <p>
            Billing updates and due-date alerts that open the authenticated portal. Web Push never
            confirms payment or proves a notification was read.
          </p>
        </div>
        <button class="switch ${config.pushEnabled ? "is-on" : ""}" type="button"
          role="switch" aria-checked="${config.pushEnabled ? "true" : "false"}" data-toggle="Web Push"></button>
      </div>

      <div class="setting-row">
        <div class="setting-row__meta">
          <strong>SMS notifications</strong>
          <p>Not supported by this system.</p>
        </div>
        <span class="badge badge--danger">Blocked</span>
      </div>

      <div class="setting-row">
        <div class="setting-row__meta">
          <strong>Tenant e-mail notifications</strong>
          <p>
            Not supported. The designated property-management mailbox is used only for utility-bill
            intake and attachment retrieval.
          </p>
        </div>
        <span class="badge badge--danger">Blocked</span>
      </div>
    </div>

    <div class="card__footer">
      <div class="row row-2 row-wrap">
        <span class="text-xs text-muted">Explicitly out of scope:</span>
        ${PROHIBITED_CHANNELS.map((channel) => html`<span class="chip">${channel}</span>`)}
      </div>
    </div>
  </section>`;
}

function profileSection() {
  return html`<section class="card">
    <div class="card__header">
      <div>
        <h2 class="card__title">Manager profile</h2>
        <p class="card__subtitle">Account details shown across the portal</p>
      </div>
      <button class="btn btn--primary btn--sm" type="button">${icon("check", { size: 14 })} Save</button>
    </div>
    <div class="card__body">
      <div class="field-row">
        <div class="field">
          <label class="field__label" for="pf-name">Full name</label>
          <input class="input" id="pf-name" type="text" value="Karla Dizon" />
        </div>
        <div class="field">
          <label class="field__label" for="pf-email">E-mail</label>
          <input class="input" id="pf-email" type="email" value="manager@propertypro.ph" />
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label class="field__label" for="pf-role">Role</label>
          <input class="input" id="pf-role" type="text" value="Manager" disabled />
          <span class="field__hint">Roles are assigned by the Admin.</span>
        </div>
        <div class="field">
          <label class="field__label" for="pf-phone">Mobile</label>
          <input class="input" id="pf-phone" type="tel" value="+63 917 000 1234" />
        </div>
      </div>
    </div>
  </section>`;
}

export default renderSettings;
