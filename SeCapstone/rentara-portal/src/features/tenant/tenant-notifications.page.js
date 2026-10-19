import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { badge } from "../../components/badge.js";
import { emptyState, skeletonRows } from "../../components/empty-state.js";
import { toastSuccess, toast } from "../../components/toast.js";
import { api } from "../../api/client.js";
import { endpoints } from "../../api/endpoints.js";
import { relative, dateTime, date, count } from "../../utils/format.js";

/**
 * Tenant view — "Notifications".
 * Saved portal alerts and messages, with optional browser Push enrollment.
 */
export async function renderTenantNotifications(container) {
  const refreshing = Boolean(container.querySelector(".page"));
  if (!refreshing) render(
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
    // Another session may have created alerts since the shell last loaded.
    window.dispatchEvent(new CustomEvent("app:data-changed"));
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
  const pushAvailable = window.isSecureContext && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window && Notification.permission !== "denied";
  const pushMessage = !window.isSecureContext ? "Browser alerts need HTTPS on this device. Your saved alerts are below." : !("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window) ? "Browser alerts are not supported on this device. Your saved alerts are below." : Notification.permission === "denied" ? "Browser alerts are blocked. You can change this in your browser settings." : "Optional browser alerts for billing updates and reminders.";
  return html`<section class="page portal-alerts-page" aria-labelledby="page-title">
    <div class="page-header">
      <div class="page-header__title">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <span>Rentara</span>${icon("chevron-right", { size: 12 })}
          <span>Tenant</span>${icon("chevron-right", { size: 12 })}
          <span>Notifications</span>
        </nav>
        <h1 id="page-title">Notifications</h1>
        <p>Saved billing alerts and updates.</p>
      </div>
      <div class="page-header__actions">
        <button
          class="btn btn--secondary"
          type="button"
          data-action="mark-read"
        >
          ${icon("check", { size: 15 })} Mark all read
        </button>
      </div>
    </div>

    ${content}
    <details class="push-device-disclosure mt-3" ${pushAvailable ? "open" : ""}><summary>Browser notification settings</summary><section class="push-device-summary" aria-label="Browser alerts">
      <div><strong>Web Push</strong><p data-push-status role="status">${pushMessage}</p></div>
      ${pushAvailable ? html`<button class="btn btn--secondary" type="button" data-action="enable-push">${icon("bell", {size:15})} Enable Web Push</button>` : null}
    </section></details>
  </section>`;
}

function feed(items) {
  const ordered = [...items].sort((a,b) => Number(Boolean(a.read)) - Number(Boolean(b.read)) || String(b.timestamp).localeCompare(String(a.timestamp)));
  return html`
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
            ? ordered.map(
                (item) =>
                  html`<article class="notification-item ${!item.read ? "is-unread" : ""}" data-notification-id="${item.id}">
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
                      <p>${readableBody(item.body)}</p>
                      ${item.billId || item.emailBillId ? html`<button class="btn btn--secondary btn--sm mt-2" type="button" data-view-bill="${item.billId || item.emailBillId}">View bill</button>` : null}
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

function readableBody(body) {
  return String(body ?? "").replace(/\b\d{4}-\d{2}-\d{2}\b/g, value => date(value));
}

function toneFor(item) {
  const map = {
    billing: { icon: "receipt", color: "var(--primary-600)", bg: "var(--primary-50)" },
    payment: { icon: "clock", color: "#b45309", bg: "#fef3c7" },
    reminder: { icon: "calendar", color: "#0284c7", bg: "#e0f2fe" },
    receipt: { icon: "file", color: "#16a34a", bg: "#dcfce7" },
  };
  return map[item.kind] ?? { icon: "bell", color: "#64748b", bg: "#f1f5f9" };
}

function bind(container, items) {
  const status = container.querySelector("[data-push-status]");
  if (window.isSecureContext && "serviceWorker" in navigator && "Notification" in window && Notification.permission !== "denied" && "PushManager" in window)
    navigator.serviceWorker
      .getRegistration()
      .then(async (registration) => {
        const subscription = await registration?.pushManager?.getSubscription();
        if (subscription) {
          status.textContent = "Browser subscription registered. Delivery depends on this device and connection.";
          const button = container.querySelector('[data-action="enable-push"]');
          if (button) button.hidden = true;
          container.querySelector(".push-device-disclosure")?.removeAttribute("open");
        }
      })
      .catch(() => {
        status.textContent = "Could not check browser alerts. Your saved portal alerts remain available.";
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
        button.hidden = true;
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
      if (button.disabled) return;
      const label = button.innerHTML;
      button.disabled = true;
      button.textContent = "Saving…";
      try {
        await api.post("/notifications/read", {});
        container.querySelectorAll(".notification-item.is-unread").forEach(item => {
          item.classList.remove("is-unread");
          item.querySelector(".badge")?.remove();
        });
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          await new Promise(resolve => setTimeout(resolve, 220));
        }
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
        button.innerHTML = label;
      }
    });
}

export default renderTenantNotifications;
