import { html } from "../utils/dom.js";
import { icon } from "./icon.js";
import { brandMark } from "./brand-mark.js";
import { initials } from "../utils/format.js";
import session from "../auth/session.js";

/** Search and notifications; account controls live in the sidebar. */
export function topbar({ notifications = 0, navExpanded = false, mobile = true }) {
  const menuLabel = navExpanded ? (mobile ? "Close sidebar" : "Collapse sidebar") : "Expand sidebar";
  return html`
    <button class="topbar__menu-btn" type="button" data-action="toggle-nav" aria-label="${menuLabel}" aria-controls="primary-sidebar" aria-expanded="${navExpanded}" title="${menuLabel}">${icon("menu", { size: 20 })}</button>
    <span class="topbar__mobile-brand">${brandMark(26)}<span>Rentara${session.user?.workspaceName ? html`<small class="workspace-label" title="${session.user.workspaceName}">${session.user.workspaceName}</small>` : null}</span></span>
    <span class="topbar__workspace" title="${session.user?.workspaceName ?? "System maintenance"}">${session.user?.workspaceName ?? "System maintenance"}</span>
    <div class="topbar__spacer"></div>
    <div class="topbar__search">${icon("search", { size: 16 })}<input type="search" placeholder="Search the portal…" aria-label="Search the portal" data-action="global-search" /></div>
    <div class="topbar__actions"><button class="icon-btn" type="button" data-action="notifications" aria-label="Notifications">${icon("bell", { size: 19 })}${notifications > 0 ? html`<span class="icon-btn__dot">${notifications > 9 ? "9+" : notifications}</span>` : null}</button></div>
    <span class="mint-account" title="${session.user?.name ?? "Your account"}"><span class="mint-account__avatar" aria-hidden="true">${initials(session.user?.name ?? "")}</span><span class="mint-account__name">${session.user?.name ?? ""}</span></span>
  `;
}
export default topbar;
