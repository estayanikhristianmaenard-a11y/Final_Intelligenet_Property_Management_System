import { html } from "../utils/dom.js";
import { icon } from "./icon.js";
import { APP, ROLE_LABEL } from "../config/constants.js";
import { navForRole, groupNav } from "../config/navigation.js";
import { initials, avatarTone } from "../utils/format.js";
import session from "../auth/session.js";

/**
 * Sidebar navigation.
 *
 * The visible menu is derived entirely from `config/navigation.js` filtered by
 * the signed-in role, so an unauthorised destination never even appears — the
 * first half of the front-end RBAC requirement (the router guard is the
 * second half, for deep links).
 *
 * @param {Object} config
 * @param {string} config.role
 * @param {string} config.activePath  normalised path, e.g. "/dashboard"
 * @param {Record<string, number>} [config.badges]  count badges by nav item id
 */
export function sidebar({ role, activePath, badges = {} }) {
  const items = navForRole(role);
  const groups = groupNav(items);
  const user = userForRole(role);

  return html`
    <div class="sidebar__brand">
      <span class="sidebar__logo">${icon("building2", { size: 19 })}</span>
      <span class="sidebar__wordmark">
        <strong>${APP.name}</strong>
        <span>${APP.portal}</span>
      </span>
    </div>

    <div class="sidebar__scroll">
      ${groups.map(
        (group) => html`
          <section class="sidebar__section">
            <h6 class="sidebar__section-label">${group.section}</h6>
            <nav class="sidebar__nav" aria-label="${group.section}">
              ${group.items.map((item) => {
                const target = item.path.replace(/^#/, "");
                const active = activePath === target;
                const count = badges[item.badge ?? item.id];
                const alert = item.id === "bills" || item.id === "tenant-bills";
                return html`<a
                  class="nav-item ${active ? "is-active" : ""}"
                  href="${item.path}"
                  aria-current="${active ? "page" : "false"}"
                >
                  <span class="nav-item__icon"
                    >${icon(item.icon, { size: 18 })}</span
                  >
                  <span class="nav-item__label">${item.label}</span>
                  ${
                    count
                      ? html`<span
                          class="nav-item__count ${alert && count > 0 ? "nav-item__count--alert" : ""}"
                          >${count}</span
                        >`
                      : null
                  }
                </a>`;
              })}
            </nav>
          </section>
        `,
      )}
    </div>

    <div class="sidebar__footer">
      <div class="sidebar__role">
        <span class="sidebar__role-badge ${avatarTone(user.name)}"
          >${initials(user.name)}</span
        >
        <span class="sidebar__role-meta">
          <strong>${user.name}</strong>
          <span>${ROLE_LABEL[role]} · ${user.scope}</span>
        </span>
      </div>
    </div>
  `;
}

function userForRole(role) {
  return {
    ...session.user,
    scope: ROLE_LABEL[role] ?? "",
    name: session.user?.name ?? "Guest",
  };
}

export default sidebar;
