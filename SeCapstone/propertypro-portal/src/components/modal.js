import { html, render, TrustedString } from "../utils/dom.js";
import { icon } from "./icon.js";

/**
 * Modal dialog.
 *
 * Focus is moved into the dialog on open and restored on close; Escape and
 * backdrop clicks both dismiss it, so keyboard users are never trapped.
 */

let activeModal = null;

/**
 * @param {Object} config
 * @param {string} config.title
 * @param {string} [config.subtitle]
 * @param {import("../utils/dom.js").TrustedString|Node} config.body
 * @param {import("../utils/dom.js").TrustedString} [config.footer]
 * @param {(close:()=>void)=>void} [config.onMount]
 * @returns {{close:()=>void}}
 */
export function openModal({ title, subtitle = "", body, footer = null, onMount }) {
  closeModal();

  const root = document.getElementById("modal-root");
  const restoreFocus = document.activeElement;

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";

  const dialog = document.createElement("div");
  dialog.className = "modal";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", title);

  render(
    dialog,
    html`<div class="modal__header">
        <div>
          <h3 class="modal__title">${title}</h3>
          ${subtitle ? html`<p class="modal__subtitle">${subtitle}</p>` : null}
        </div>
        <button class="icon-btn" type="button" data-close aria-label="Close dialog">
          ${icon("x", { size: 17 })}
        </button>
      </div>
      <div class="modal__body">${body instanceof TrustedString || typeof body === "string" ? body : ""}</div>
      ${footer ? html`<div class="modal__footer">${footer}</div>` : null}`,
  );

  if (body instanceof Node) {
    dialog.querySelector(".modal__body")?.appendChild(body);
  }

  backdrop.appendChild(dialog);
  root.appendChild(backdrop);

  const close = () => {
    if (!backdrop.isConnected) return;
    backdrop.remove();
    activeModal = null;
    document.removeEventListener("keydown", onKey);
    if (restoreFocus instanceof HTMLElement) restoreFocus.focus();
  };

  function onKey(event) {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
    }
    if (event.key === "Tab") trapFocus(event, dialog);
  }

  backdrop.addEventListener("mousedown", (event) => {
    if (event.target === backdrop) close();
  });
  dialog.querySelector("[data-close]")?.addEventListener("click", close);
  document.addEventListener("keydown", onKey);

  activeModal = { close };
  onMount?.(close);

  const firstField = dialog.querySelector("input, textarea, select, button:not([data-close])");
  firstField?.focus();

  return { close };
}

export function closeModal() {
  activeModal?.close();
  activeModal = null;
}

function trapFocus(event, container) {
  const focusable = [
    ...container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ].filter((el) => el.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export default openModal;
