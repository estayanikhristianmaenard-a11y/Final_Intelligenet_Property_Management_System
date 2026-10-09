import { html } from "../utils/dom.js";
import { icon } from "./icon.js";
import { ROLE, ROLE_LABEL, ROLE_SCOPE } from "../config/constants.js";
import { initials, avatarTone } from "../utils/format.js";

/**
 * Top bar: global search, notification bell and the user menu.
 *
 * The user menu doubles as the **role switcher** for the Phase 1 demo — it
 * swaps the active session between Admin, Manager and Tenant so reviewers can
 * see the three strictly separated views without a backend login.
 *
 * @param {Object} config
 * @param {object} config.user
 * @param {number} [config.notifications]
 * @param {boolean} [config.menuOpen]
 */
export function topbar({ user, notifications = 0, menuOpen = false }) {
  const role = user?.role ?? ROLE.MANAGER;

  return html`
    <button class="topbar__menu-btn" type="button" data-action="toggle-nav" aria-label="Open navigation">
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
      <button class="icon-btn" type="button" data-action="notifications" aria-label="Notifications">
        ${icon("bell", { size: 19 })}
        ${notifications > 0
          ? html`<span class="icon-btn__dot">${notifications > 9 ? "9+" : notifications}</span>`
          : null}
      </button>

      <div class="user-menu">
        <button
          class="user-menu__trigger"
          type="button"
          data-action="toggle-user-menu"
          aria-haspopup="menu"
          aria-expanded="${menuOpen ? "true" : "false"}"
        >
          <span class="avatar ${avatarTone(user?.name ?? "")}">${initials(user?.name ?? "")}</span>
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
  const roles = [ROLE.MANAGER, ROLE.ADMIN, ROLE.TENANT];

  return html`<div class="menu-popover" role="menu">
    <p class="menu-popover__label">Signed in as</p>
    ${roles
      .map(
        (role) => html`<button
          class="menu-popover__item ${role === activeRole ? "is-active" : ""}"
          type="button"
          role="menuitem"
          data-action="switch-role"
          data-role="${role}"
        >
          <span class="avatar avatar--sm ${avatarTone(role)}">${initials(ROLE_LABEL[role])}</span>
          <span class="grow">
            <strong style="display:block;font-size:var(--text-sm)">${ROLE_LABEL[role]}</strong>
            <span style="font-size:var(--text-2xs);color:var(--text-muted)"
              >${ROLE_SCOPE[role]}</span
            >
          </span>
          ${role === activeRole ? icon("check", { size: 15 }) : null}
        </button>`,
      )}

    <div class="menu-popover__divider"></div>

    <p class="menu-popover__label">Front-end RBAC preview</p>
    <p style="padding:0 var(--space-3) var(--space-2);font-size:var(--text-xs);color:var(--text-muted);line-height:1.5">
      Switching roles re-renders the sidebar, routes and page permissions. The backend must
      enforce the same matrix on every endpoint.
    </p>

    <div class="menu-popover__divider"></div>

    <button class="menu-popover__item menu-popover__item--danger" type="button" role="menuitem" data-action="sign-out">
      ${icon("logout", { size: 16 })} Sign out
    </button>
  </div>`;
}

export default topbar;
