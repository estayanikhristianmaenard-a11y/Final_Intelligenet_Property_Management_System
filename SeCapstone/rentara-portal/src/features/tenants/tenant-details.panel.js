import { html } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { openPanel, closePanel } from "../../components/side-panel.js";
import { openModal } from "../../components/modal.js";
import { toast, toastSuccess } from "../../components/toast.js";
import { skeletonRows } from "../../components/empty-state.js";
import { overviewTab } from "./tabs/overview.tab.js";
import { billingTab } from "./tabs/billing.tab.js";
import { paymentsTab } from "./tabs/payments.tab.js";
import { documentsTab } from "./tabs/documents.tab.js";
import { api } from "../../api/client.js";
import { endpoints } from "../../api/endpoints.js";
import { can } from "../../auth/rbac.js";
import session from "../../auth/session.js";
import { initials, avatarTone, peso } from "../../utils/format.js";
import {
  entityForm,
  uploadSource,
  download,
  viewReceipt,
  dialogForm,
} from "../../app/workflows.js";

/**
 * Tenant Details slide-out panel.
 *
 * Opens from any tenant row (Tenants table, Recent Activity, dashboard) and
 * presents four tabs — Overview, Billing, Payments, Documents — plus the
 * action buttons required by Phase 1: **Send Message** and **View Full
 * Profile**.
 *
 * One delegated click listener is attached to the panel root per open and
 * detached on close, so repeated opens never stack handlers.
 */

/* ------------------------------------------------- module-scoped state -- */
let activeApi = null;
let activeTenant = null;
let detachRootListener = null;
let onChangedCallback = null;
let panelSequence = 0;

/**
 * @param {string} tenantId
 * @param {{onChanged?:()=>void}} [options]
 */
export function openTenantPanel(tenantId, { onChanged } = {}) {
  closeTenantPanel();
  const sequence = panelSequence;

  onChangedCallback = onChanged ?? null;
  activeTenant = null;

  const role = session.role;
  const canConfirm = can(role, "payment:confirm");
  const canMessage = can(role, "tenant:message");

  activeApi = openPanel({
    ariaLabel: "Tenant details",
    header: loadingHeader(),
    tabs: TABS.map((tab) => ({ id: tab.id, label: tab.label })),
    renderBody: () => html`<div class="panel-section">${skeletonRows(5)}</div>`,
    footer: loadingFooter(),
    onMount: () => attachRootListener({ canConfirm, canMessage }),
  });

  loadTenant(tenantId)
    .then((tenant) => {
      if (!activeApi || sequence !== panelSequence) return;
      activeTenant = tenant;
      activeApi.update({
        header: tenantHeader(tenant),
        tabs: TABS.map((tab) => ({
          id: tab.id,
          label: tab.label,
          count: tab.count ? tab.count(tenant) : undefined,
        })),
        renderBody: (tabId) => renderTab(tabId, tenant, { canConfirm }),
        footer: footer(canMessage),
      });
    })
    .catch((error) => {
      if (!activeApi || sequence !== panelSequence) return;
      activeApi.update({
        header: loadingHeader(),
        renderBody: () =>
          html`<div class="panel-section">
            <div class="notice-strip notice-strip--danger">
              <span class="notice-strip__icon"
                >${icon("alert-triangle", { size: 14 })}</span
              >
              <span>${error.message}</span>
            </div>
          </div>`,
      });
    });

  return activeApi;
}

export function closeTenantPanel() {
  panelSequence++;
  detachRootListener?.();
  detachRootListener = null;
  activeApi = null;
  activeTenant = null;
  closePanel();
}

/* ---------------------------------------------------------------- tabs -- */

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "billing", label: "Billing", count: (t) => t.bills?.length ?? 0 },
  { id: "payments", label: "Payments", count: (t) => t.payments?.length ?? 0 },
  {
    id: "documents",
    label: "Documents",
    count: (t) => t.documents?.length ?? 0,
  },
];

function renderTab(tabId, tenant, { canConfirm }) {
  switch (tabId) {
    case "billing":
      return billingTab(tenant);
    case "payments":
      return paymentsTab(tenant, { canConfirm });
    case "documents":
      return documentsTab(tenant);
    case "overview":
    default:
      return overviewTab(tenant);
  }
}

/* -------------------------------------------------------------- header -- */

function loadingHeader() {
  return html`<div class="panel-drawer__identity">
    <span class="avatar avatar--lg" style="background:var(--gray-200)"></span>
    <div>
      <div
        class="skeleton"
        style="width:150px;height:15px;margin-bottom:6px"
      ></div>
      <div class="skeleton" style="width:110px;height:11px"></div>
    </div>
  </div>`;
}

function loadingFooter() {
  return html`<span
      class="skeleton grow"
      style="height:38px;border-radius:8px"
    ></span>
    <span
      class="skeleton"
      style="width:150px;height:38px;border-radius:8px"
    ></span>`;
}

function footer(canMessage) {
  return html`
    <button
      class="btn ${canMessage ? "btn--primary" : "btn--secondary"} grow"
      type="button"
      data-action="send-message"
      ${canMessage ? "" : 'disabled aria-disabled="true"'}
    >
      ${icon("send", { size: 15 })} Send Message
    </button>
    <button
      class="btn btn--secondary grow"
      type="button"
      data-action="view-profile"
    >
      ${icon("user", { size: 15 })} Edit tenant profile
    </button>
  `;
}

function tenantHeader(tenant) {
  return html`<div class="panel-drawer__identity">
      <span class="avatar avatar--lg ${avatarTone(tenant.fullName)}"
        >${initials(tenant.fullName)}</span
      >
      <div style="min-width:0">
        <h2>${tenant.fullName}</h2>
        <p>${tenant.propertyName} · ${tenant.email}</p>
      </div>
    </div>
    <div class="panel-identity-row">
      <span class="panel-identity-row__unit"
        >${icon("home", { size: 14 })} Unit <b>${tenant.unitCode}</b></span
      >
      <span class="grow"></span>
      <span class="panel-identity-row__unit"
        >${icon("layers", { size: 14 })} <b>${tenant.floor}</b></span
      >
      <span class="grow"></span>
      <span class="panel-identity-row__unit"
        >${icon("receipt", { size: 14 })}
        <b>${peso(tenant.monthlyRent)}</b>/mo</span
      >
    </div>`;
}

/* ------------------------------------------------------------- actions -- */

function attachRootListener({ canConfirm, canMessage }) {
  detachRootListener?.();

  const root = document.getElementById("panel-root");
  if (!root) return;

  const handler = async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!root.contains(target)) return;

    const disabled = target.closest("[disabled], [aria-disabled='true']");
    if (disabled && disabled === target.closest("button")) return;

    /* --- Send Message ------------------------------------------------- */
    if (target.closest('[data-action="send-message"]')) {
      if (!canMessage) return;
      if (activeTenant) openSendMessage(activeTenant);
      return;
    }

    /* --- Edit tenant profile -------------------------------------------- */
    if (target.closest('[data-action="view-profile"]')) {
      if (activeTenant)
        await entityForm("tenants", activeTenant.id, refreshTenant);
      return;
    }
    try {
      if (target.closest("[data-upload-document]")) {
        await uploadSource(refreshTenant, activeTenant.id);
        return;
      }
      const documentButton = target.closest("[data-document]");
      if (documentButton) {
        await download(
          "/" +
            (documentButton.dataset.kind === "receipt"
              ? "receipts"
              : "documents") +
            "/" +
            documentButton.dataset.document,
          documentButton.dataset.filename,
          { preview: documentButton.dataset.preview === "true" },
        );
        return;
      }
      const previewButton = target.closest("[data-view-receipt]");
      if (previewButton) {
        if (previewButton.disabled) return;
        previewButton.disabled=true;
        try { await viewReceipt(previewButton.dataset.viewReceipt); }
        finally { previewButton.disabled=false; }
        return;
      }
      const receiptButton = target.closest("[data-receipt]");
      if (receiptButton) {
        await download(
          "/receipts/" + receiptButton.dataset.receipt,
          receiptButton.dataset.receipt + ".html",
        );
        return;
      }
      const rejectButton = target.closest("[data-reject-payment]");
      if (rejectButton) {
        dialogForm({
          title: "Reject payment report",
          fields: [
            {
              key: "reason",
              label: "Reason",
              type: "textarea",
              required: true,
            },
          ],
          save: (data) =>
            api.post(
              "/payments/" + rejectButton.dataset.rejectPayment + "/reject",
              data,
            ),
          onSaved: refreshTenant,
        });
        return;
      }
    } catch (error) {
      toast({
        title: "Operation failed",
        message: error.message,
        tone: "danger",
      });
      return;
    }

    /* --- Manager confirms a tenant-reported payment -------------------- */
    const confirmBtn = target.closest("[data-confirm-payment]");
    if (confirmBtn && canConfirm && activeTenant) {
      if (confirmBtn.getAttribute("aria-disabled") === "true") return;
      confirmBtn.setAttribute("aria-disabled", "true");
      try {
        const payment = await api.post(
          endpoints.confirmPayment(
            confirmBtn.getAttribute("data-confirm-payment"),
          ),
        );
        toastSuccess(
          "Payment confirmed",
          `${activeTenant.fullName} · status changed to Paid, receipt ${payment.receiptNumber} generated.`,
        );
        const fresh = await loadTenant(activeTenant.id);
        activeTenant = fresh;
        activeApi?.update({
          renderBody: (tabId) => renderTab(tabId, fresh, { canConfirm }),
        });
        onChangedCallback?.();
        window.dispatchEvent(new CustomEvent("app:data-changed"));
      } catch (error) {
        toast({
          title: "Confirmation failed",
          message: error.message,
          tone: "danger",
        });
        confirmBtn.removeAttribute("aria-disabled");
      }
    }
  };

  root.addEventListener("click", handler);
  detachRootListener = () => root.removeEventListener("click", handler);
}

async function refreshTenant() {
  if (!activeTenant) return;
  const id = activeTenant.id,
    sequence = panelSequence,
    fresh = await loadTenant(id);
  if (sequence !== panelSequence) return;
  activeTenant = fresh;
  activeApi?.update({
    header: tenantHeader(fresh),
    renderBody: (tabId) =>
      renderTab(tabId, fresh, {
        canConfirm: can(session.role, "payment:confirm"),
      }),
  });
  await onChangedCallback?.();
  window.dispatchEvent(new CustomEvent("app:data-changed"));
}

function openSendMessage(tenant) {
  const name = tenant.fullName;
  openModal({
    title: "Send message",
    subtitle: `Delivered to ${name} through the authenticated portal inbox`,
    body: html`
      <div class="field">
        <label class="field__label" for="msg-subject">Subject</label>
        <input
          class="input"
          id="msg-subject"
          type="text"
          value="Billing update"
        />
      </div>
      <div class="field">
        <label class="field__label" for="msg-body">Message</label>
        <textarea
          class="textarea"
          id="msg-body"
          placeholder="Type your message…"
        ></textarea>
        <span class="field__hint"
          >This message appears in the portal only. Rent email alerts are
          handled separately.</span
        >
      </div>
    `,
    footer: html`
      <button class="btn btn--secondary" type="button" data-close>
        Cancel
      </button>
      <button class="btn btn--primary" type="button" data-send>
        ${icon("send", { size: 15 })} Send
      </button>
    `,
    onMount: (close) => {
      document
        .querySelector(".modal [data-send]")
        ?.addEventListener("click", async () => {
          const modal = document.querySelector(".modal");
          const subject = modal?.querySelector("#msg-subject")?.value ?? "";
          const body = modal?.querySelector("#msg-body")?.value ?? "";
          const button = modal.querySelector("[data-send]");
          button.disabled = true;
          try {
            await api.post(endpoints.messages(), {
              tenantId: tenant.id,
              subject,
              body,
            });
            close();
            toastSuccess("Message sent", `Saved to ${name}'s portal inbox.`);
            await onChangedCallback?.();
          } catch (error) {
            toast({
              title: "Message failed",
              message: error.message,
              tone: "danger",
            });
          } finally {
            button.disabled = false;
          }
        });
    },
  });
}

/* --------------------------------------------------------------- data --- */

const loadTenant = (id) => api.get(endpoints.tenant(id));

export default openTenantPanel;
