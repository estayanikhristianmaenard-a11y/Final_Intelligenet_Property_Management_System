import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { badge } from "../../components/badge.js";
import { emptyState, skeletonRows } from "../../components/empty-state.js";
import { toastSuccess, toast } from "../../components/toast.js";
import { api } from "../../api/client.js";
import { endpoints } from "../../api/endpoints.js";
import { relative, dateTime, count } from "../../utils/format.js";
import { PROHIBITED_CHANNELS } from "../../config/constants.js";

/**
 * Tenant view — "Notifications".
 * Web Push feed only; no SMS or tenant e-mail preferences exist by design.
 */
export async function renderTenantNotifications(container) {
  render(container, frame(html`<div class="card"><div class="card__body">${skeletonRows(4)}</div></div>`));

  try {
    const items = await api.get(endpoints.notifications());
    render(container, frame(feed(items)));
    bind(container, items);
  } catch (error) {
    render(
      container,
      frame(
        emptyState({
          iconName: "alert-triangle",
          title: "Notifications could not be loaded",
          body: error.message,
        }),
      ),
    );
  }
}

function frame(content) {
  return html`<section class="page" aria-labelledby="page-title">
    <div class="page-header">
      <div class="page-header__title">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <span>PropertyPro</span>${icon("chevron-right", { size: 12 })}
          <span>Tenant</span>${icon("chevron-right", { size: 12 })}
          <span>Notifications</span>
        </nav>
        <h1 id="page-title">Notifications</h1>
        <p>Web Push billing updates and due-date alerts.</p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--secondary" type="button" data-action="mark-read">
          ${icon("check", { size: 15 })} Mark all read
        </button>
        <button class="btn btn--primary" type="button" data-action="enable-push">
          ${icon("bell", { size: 15 })} Enable Web Push
        </button>
      </div>
    </div>

    ${content}
  </section>`;
}

function feed(items) {
  return html`
    <section class="card mb-4">
      <div class="card__header">
        <div>
          <h2 class="card__title">Push subscription</h2>
          <p class="card__subtitle">Permitted notification channel for this system</p>
        </div>
        <span class="badge badge--primary">${icon("bell", { size: 12 })} Web Push active</span>
      </div>
      <div class="card__body">
        <div class="row row-between row-wrap row-3">
          <div class="stack stack-1">
            <strong class="text-sm">Billing updates and due-date reminders</strong>
            <span class="text-xs text-muted"
              >Alerts open the authenticated portal — they never confirm payment.</span
            >
          </div>
          <span class="chip">Reminder 3 days before due date</span>
        </div>

        <div class="notice-strip notice-strip--warning mt-4">
          <span class="notice-strip__icon">${icon("info", { size: 14 })}</span>
          <span>
            Out of scope for this system:
            ${PROHIBITED_CHANNELS.map((channel) => html`<strong>${channel}</strong> `)}
            — Web Push cannot prove that a notification was read.
          </span>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="card__header">
        <div>
          <h2 class="card__title">Notification feed</h2>
          <p class="card__subtitle">${count(items.length)} alerts delivered to this device</p>
        </div>
        <span class="chip">${count(items.filter((n) => !n.read).length)} unread</span>
      </div>
      <div class="notification-feed">
        ${items.length
          ? items.map(
              (item) => html`<article class="notification-item">
                <span
                  class="notification-item__icon"
                  style="--tone:${toneFor(item).color};--tone-bg:${toneFor(item).bg}"
                  >${icon(toneFor(item).icon, { size: 17 })}</span
                >
                <span class="notification-item__body">
                  <strong>
                    ${item.title}
                    ${!item.read ? badge("New", "primary") : null}
                  </strong>
                  <p>${item.body}</p>
                </span>
                <span class="notification-item__time" title="${dateTime(item.timestamp)}"
                  >${relative(item.timestamp)}</span
                >
              </article>`,
            )
          : emptyState({ iconName: "bell", title: "No notifications yet" })}
      </div>
    </section>
  `;
}

function toneFor(item) {
  const map = {
    billing: { icon: "receipt", color: "#4f46e5", bg: "#eef2ff" },
    payment: { icon: "clock", color: "#b45309", bg: "#fef3c7" },
    reminder: { icon: "calendar", color: "#0284c7", bg: "#e0f2fe" },
    receipt: { icon: "file", color: "#16a34a", bg: "#dcfce7" },
  };
  return map[item.kind] ?? { icon: "bell", color: "#64748b", bg: "#f1f5f9" };
}

function bind(container, items) {
  container.querySelector('[data-action="enable-push"]')?.addEventListener("click", () => {
    if (typeof Notification === "undefined") {
      toast({
        title: "Web Push unavailable",
        message: "This browser does not expose the Notification API.",
        tone: "warning",
      });
      return;
    }
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        toastSuccess(
          "Web Push enabled",
          "Billing updates and due-date reminders will be delivered here.",
        );
      } else {
        toast({
          title: "Permission not granted",
          message: "Enable notifications for this site in your browser settings.",
          tone: "warning",
        });
      }
    });
  });

  container.querySelector('[data-action="mark-read"]')?.addEventListener("click", () => {
    toastSuccess("Notifications cleared", `${count(items.length)} alerts marked as read.`);
  });
}

export default renderTenantNotifications;
