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
  render(
    container,
    frame(
      html`<div class="card">
        <div class="card__body">${skeletonRows(4)}</div>
      </div>`,
    ),
  );

  try {
    const [items, messages] = await Promise.all([
      api.get(endpoints.notifications()),
      api.get(endpoints.messages()),
    ]);
    render(
      container,
      frame(
        html`${feed(items)}
          <section class="card mt-4">
            <div class="card__header">
              <h2 class="card__title">Portal inbox</h2>
            </div>
            <div class="card__body">
              ${
                messages.length
                  ? messages.map(
                      (m) =>
                        html`<article class="mb-4">
                          <strong>${m.subject}</strong>
                          <p>${m.body}</p>
                          <span class="text-xs text-muted"
                            >${m.sender} · ${dateTime(m.sentAt)}</span
                          >
                        </article>`,
                    )
                  : emptyState({ iconName: "inbox", title: "No messages yet" })
              }
            </div>
          </section>`,
      ),
    );
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
        <button
          class="btn btn--secondary"
          type="button"
          data-action="mark-read"
        >
          ${icon("check", { size: 15 })} Mark all read
        </button>
        <button
          class="btn btn--primary"
          type="button"
          data-action="enable-push"
        >
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
          <p class="card__subtitle">
            Permitted notification channel for this system
          </p>
        </div>
        <span class="badge badge--primary" data-push-status
          >${icon("bell", { size: 12 })} Subscription not checked</span
        >
      </div>
      <div class="card__body">
        <div class="row row-between row-wrap row-3">
          <div class="stack stack-1">
            <strong class="text-sm"
              >Billing updates and due-date reminders</strong
            >
            <span class="text-xs text-muted"
              >Alerts open the authenticated portal — they never confirm
              payment.</span
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
          <p class="card__subtitle">
            ${count(items.length)} saved portal alerts
          </p>
        </div>
        <span class="chip"
          >${count(items.filter((n) => !n.read).length)} unread</span
        >
      </div>
      <div class="notification-feed">
        ${
          items.length
            ? items.map(
                (item) =>
                  html`<article class="notification-item">
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
                    <span
                      class="notification-item__time"
                      title="${dateTime(item.timestamp)}"
                      >${relative(item.timestamp)}</span
                    >
                  </article>`,
              )
            : emptyState({ iconName: "bell", title: "No notifications yet" })
        }
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
  const status = container.querySelector("[data-push-status]");
  if ("serviceWorker" in navigator)
    navigator.serviceWorker
      .getRegistration()
      .then(async (registration) => {
        const subscription = await registration?.pushManager?.getSubscription();
        status.textContent = subscription
          ? "Browser subscription registered"
          : "No browser subscription";
      })
      .catch(() => {
        status.textContent = "Subscription unavailable";
      });
  container
    .querySelector('[data-action="enable-push"]')
    ?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      try {
        if (
          !window.isSecureContext ||
          !("serviceWorker" in navigator) ||
          !("PushManager" in window) ||
          typeof Notification === "undefined"
        )
          throw new Error(
            "Web Push requires a supported browser and HTTPS or localhost.",
          );
        const config = await api.get("/notifications/push-config");
        if (!config.configured)
          throw new Error(
            "The Administrator must configure local VAPID keys before registration. Your bills remain available here.",
          );
        const permission = await Notification.requestPermission();
        if (permission !== "granted")
          throw new Error(
            "Notification permission was not granted. You can still view all bills in the portal.",
          );
        const registration = await navigator.serviceWorker.register(
          new URL("../../../sw.js", import.meta.url),
          { scope: new URL("../../../", import.meta.url).pathname },
        );
        await navigator.serviceWorker.ready;
        const decoded = atob(
          config.publicKey.replace(/-/g, "+").replace(/_/g, "/"),
        );
        const key = Uint8Array.from(decoded, (c) => c.charCodeAt(0));
        const subscription =
          (await registration.pushManager.getSubscription()) ??
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: key,
          }));
        await api.post(
          "/notifications/push-subscription",
          subscription.toJSON(),
        );
        status.textContent = "Browser subscription registered";
        toastSuccess(
          "Subscription saved",
          "Billing alerts can be sent to this browser.",
        );
      } catch (error) {
        toast({
          title: "Web Push unavailable",
          message: error.message,
          tone: "warning",
        });
      } finally {
        button.disabled = false;
      }
    });
  container
    .querySelector('[data-action="mark-read"]')
    ?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      try {
        await api.post("/notifications/read", {});
        await renderTenantNotifications(container);
        window.dispatchEvent(new CustomEvent("app:data-changed"));
        toastSuccess(
          "Notifications updated",
          `${count(items.length)} alerts marked as read.`,
        );
      } catch (error) {
        toast({
          title: "Update failed",
          message: error.message,
          tone: "danger",
        });
        button.disabled = false;
      }
    });
}

export default renderTenantNotifications;
