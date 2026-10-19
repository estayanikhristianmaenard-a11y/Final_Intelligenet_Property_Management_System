/**
 * DOM utilities.
 *
 * `html` is a tagged template that escapes every interpolated *plain* value,
 * while any value it produced itself (a `TrustedString`) is passed through
 * untouched. That lets components nest freely without ever accidentally
 * injecting unsanitised user/tenant data into the page — a hard requirement
 * of the study's Data Privacy Act security considerations.
 */

const TRUSTED = Symbol.for("propertypro.trusted");

export class TrustedString {
  constructor(value) {
    this[TRUSTED] = true;
    this.value = value;
  }

  toString() {
    return this.value;
  }
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderValue(value) {
  if (value === null || value === undefined || value === false || value === true) {
    return "";
  }
  if (value instanceof TrustedString) {
    return value.value;
  }
  if (Array.isArray(value)) {
    return value.map(renderValue).join("");
  }
  if (value instanceof Date) {
    return escapeHtml(value.toISOString());
  }
  return escapeHtml(value);
}

/**
 * Build a TrustedString, escaping all plain interpolations.
 * @returns {TrustedString}
 */
export function html(strings, ...values) {
  let out = strings[0] ?? "";
  for (let i = 0; i < values.length; i += 1) {
    out += renderValue(values[i]) + strings[i + 1];
  }
  return new TrustedString(out);
}

/** Mark a string as already-safe markup. Use only for trusted, static markup. */
export function raw(value) {
  return new TrustedString(String(value ?? ""));
}

/** Render a TrustedString (or plain string) into a container's innerHTML. */
export function render(container, markup) {
  container.innerHTML = String(markup);
  return container;
}

export const qs = (selector, root = document) => root.querySelector(selector);
export const qsa = (selector, root = document) => [
  ...root.querySelectorAll(selector),
];

/**
 * Delegated event binding.
 * @param {Element|Document} root
 * @param {string} type event name
 * @param {string} selector CSS selector matched against the event target
 * @param {(event: Event, matched: Element) => void} handler
 * @param {AddEventListenerOptions} [options]
 */
export function delegate(root, type, selector, handler, options) {
  root.addEventListener(
    type,
    (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const matched = target ? target.closest(selector) : null;
      if (matched && root.contains(matched)) {
        handler(event, matched);
      }
    },
    options,
  );
}

/** Create a namespaced, one-shot listener bundle that can be torn down. */
export function createBinder() {
  const listeners = [];
  return {
    add(target, type, handler, options) {
      target.addEventListener(type, handler, options);
      listeners.push([target, type, handler, options]);
    },
    destroy() {
      listeners.forEach(([target, type, handler, options]) =>
        target.removeEventListener(type, handler, options),
      );
      listeners.length = 0;
    },
  };
}

export function nextFrame() {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  );
}

export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
