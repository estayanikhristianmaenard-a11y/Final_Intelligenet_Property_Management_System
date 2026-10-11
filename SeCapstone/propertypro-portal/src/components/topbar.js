import { html } from "../utils/dom.js";
import { icon } from "./icon.js";
import { ROLE, ROLE_LABEL, ROLE_SCOPE } from "../config/constants.js";
import { initials, avatarTone } from "../utils/format.js";

/** Global search, role-appropriate navigation and the authenticated account menu. */
export function topbar({ user, notifications = 0, menuOpen = false }) {
  const role = user?.role ?? ROLE.MANAGER;

  return html`
    <button
      class="topbar__menu-btn"
      type="button"
      data-action="toggle-nav"
      aria-label="Open navigation"
    >
      ${icon("menu", { size: 20 })}
    </button>

    <div class="topbar__search">
      ${icon("search", { size: 16 })}
      <input
        type="search"
        placeholder="Search tenants, units, bills…"
        aria-label="Search the portal"
        data-action="global-search"
      />
    </div>

    <div class="topbar__spacer"></div>

    <div class="topbar__actions">
      <button
        class="icon-btn"
        type="button"
        data-action="notifications"
        aria-label="Notifications"
      >
        ${icon("bell", { size: 19 })}
        ${
          notifications > 0
            ? html`<span class="icon-btn__dot"
                >${notifications > 9 ? "9+" : notifications}</span
              >`
            : null
        }
      </button>

      <div class="user-menu">
        <button
          class="user-menu__trigger"
          type="button"
          data-action="toggle-user-menu"
          aria-haspopup="menu"
          aria-expanded="${menuOpen ? "true" : "false"}"
        >
          <span class="avatar ${avatarTone(user?.name ?? "")}"
            >${initials(user?.name ?? "")}</span
          >
          <span class="user-menu__meta">
            <strong>${user?.name ?? "Guest"}</strong>
            <span>${ROLE_LABEL[role]}</span>
          </span>
          ${icon("chevron-down", { size: 15 })}
        </button>

        ${menuOpen ? userMenu(role) : null}
      </div>
    </div>
  `;
}

function userMenu(activeRole) {
  return html`<div class="menu-popover" role="menu">
    <p class="menu-popover__label">${ROLE_LABEL[activeRole]}</p>
    <a
      class="menu-popover__item"
      role="menuitem"
      href="${activeRole === "tenant" ? "#/tenant/settings" : activeRole === "admin" ? "#/admin/settings" : "#/settings"}"
      >Account settings</a
    >
    <button
      class="menu-popover__item menu-popover__item--danger"
      type="button"
      role="menuitem"
      data-action="sign-out"
    >
      ${icon("logout", { size: 16 })} Sign out
    </button>
  </div>`;
}

export default topbar;
