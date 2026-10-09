import { html, render, TrustedString } from "../utils/dom.js";
import { icon } from "./icon.js";

/**
 * Toast notifications.
 *
 * Used for action feedback ("Payment confirmed — receipt RCP-2026-0044
 * generated"), matching the portal's audit-trail style of communicating
 * consequential state changes.
 */

const TONE_ICON = {
  success: "check-circle",
  warning: "alert-triangle",
  danger: "alert-triangle",
  info: "info",
};

/**
 * @param {{title:string,message?:string,tone?:string,duration?:number}} config
 */
export function toast({ title, message = "", tone = "info", duration = 4200 }) {
  const root = document.getElementById("toast-root");
  if (!root) return;

  const node = document.createElement("div");
  node.className = `toast toast--${tone}`;
  node.setAttribute("role", tone === "danger" ? "alert" : "status");

  render(
    node,
    html`<span class="toast__icon">${icon(TONE_ICON[tone] ?? "info", { size: 17 })}</span>
      <div class="toast__body">
        <div class="toast__title">${title}</div>
        ${message ? html`<div class="toast__message">${message}</div>` : null}
      </div>
      <button class="toast__close" type="button" aria-label="Dismiss">${icon("x", { size: 15 })}</button>`,
  );

  const dismiss = () => {
    if (!node.isConnected) return;
    node.classList.add("is-leaving");
    setTimeout(() => node.remove(), 220);
  };

  node.querySelector(".toast__close")?.addEventListener("click", dismiss);
  root.appendChild(node);
  setTimeout(dismiss, duration);
}

export const toastSuccess = (title, message) => toast({ title, message, tone: "success" });
export const toastWarning = (title, message) => toast({ title, message, tone: "warning" });
export const toastDanger = (title, message) => toast({ title, message, tone: "danger" });
export const toastInfo = (title, message) => toast({ title, message, tone: "info" });

export { TrustedString };
export default toast;
