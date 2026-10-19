import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import {
  badge,
  paymentBadge,
  categoryChip,
} from "../../components/badge.js";
import { dataTable, bindRowClicks } from "../../components/data-table.js";
import { statCard } from "../../components/stat-card.js";
import { emptyState, skeletonRows } from "../../components/empty-state.js";
import { exceptionQueue, bindExceptionQueue } from "./exception-queue.js";
import { openTenantPanel } from "../tenants/tenant-details.panel.js";
import { toast, toastSuccess } from "../../components/toast.js";
import { api } from "../../api/client.js";
import { endpoints } from "../../api/endpoints.js";
import { can } from "../../auth/rbac.js";
import session from "../../auth/session.js";
import {
  peso,
  count,
  date,
  relative,
  dateTime,
  initials,
  avatarTone,
  monthLabel,
  periodLabel,
} from "../../utils/format.js";
import { reportPayment } from "../../app/workflows.js";

const SEGMENTS = [
  { id: "incoming", label: "Incoming Bills (OCR)", icon: "inbox" },
  { id: "records", label: "Billing Records", icon: "receipt" },
  { id: "payments", label: "Payments", icon: "credit-card" },
  { id: "exceptions", label: "Exception Queue", icon: "alert-triangle" },
];

/**
 * Bills & Payments — the Manager's billing operations centre.
 *
 * @param {HTMLElement} container
 * @param {{query:URLSearchParams, onChanged?:()=>void}} ctx
 */
export async function renderBills(
  container,
  { query = new URLSearchParams(), onChanged } = {},
) {
  const role = session.role;
  const canConfirm = can(role, "payment:confirm");
  const canReview = can(role, "exception:review");

  let activeTab = SEGMENTS.some((s) => s.id === query.get("tab"))
    ? query.get("tab")
    : "incoming";
  const filters = { term: query.get("q") ?? "", category: query.get("category") ?? "", status: query.get("status") ?? "" };

  const load = async () => {
    const [incoming, bills, payments, exceptions] = await Promise.all([
      api.get(endpoints.incomingBills()),
      api.get(endpoints.bills()),
      api.get(endpoints.payments()),
      api.get(endpoints.exceptions()),
    ]);
    paint({ incoming, bills, payments, exceptions });
  };

  const paint = (data) => {
    render(
      container,
      frame(segmentBar(data, activeTab), activeTab, stats(data)),
    );
    renderBody(data);
    bindSegment(data);
  };

  const renderBody = (data) => {
    const host = container.querySelector("[data-tab-panel]");
    if (!host) return;

    let markup;
    switch (activeTab) {
      case "records":
        markup = html`<div class="billing-records">${recordsTable(data.bills, { canConfirm, filters })}<div data-billing-no-results hidden>${emptyState({ iconName:"search", title:"No bills match your filters", body:"Try another tenant, category or status." })}<button class="btn btn--secondary" type="button" data-reset-billing-filters>Clear filters</button></div></div>`;
        break;
      case "payments":
        markup = paymentsSection(data.payments, { canConfirm });
        break;
      case "exceptions":
        markup = html`<div class="card">
          <div class="card__header">
            <div>
              <h2 class="card__title">Exception Queue</h2>
              <p class="card__subtitle">
                Correct the flagged details, then recheck the bill.
              </p>
            </div>
            <span class="badge badge--violet"
              >${count(data.exceptions.filter((e) => e.state === "open").length)}
              open</span
            >
          </div>
          ${exceptionQueue(data.exceptions, { onChanged, canReview })}
        </div>`;
        break;
      default:
        markup = incomingSection(data.incoming);
    }

    render(host, markup);
    bindBody(data);
  };

  const bindSegment = (data) => {
    container.querySelectorAll("[data-segment]").forEach((button) => {
      button.addEventListener("click", () => {
        activeTab = button.getAttribute("data-segment");
        const params = new URLSearchParams({tab:activeTab});
        if (activeTab === "records") {
          if (filters.term) params.set("q",filters.term);
          if (filters.category) params.set("category",filters.category);
          if (filters.status) params.set("status",filters.status);
        }
        history.replaceState(null, "", `#/bills?${params}`);
        const top = window.scrollY;
        paint(data);
        container.querySelector(`[data-segment="${activeTab}"]`)?.focus({preventScroll:true});
        window.scrollTo({top,behavior:"instant"});
      });
      button.addEventListener("keydown", event => {
        if (!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) return;
        event.preventDefault();
        const index = SEGMENTS.findIndex(segment => segment.id === activeTab);
        const next = event.key === "Home" ? 0 : event.key === "End" ? SEGMENTS.length-1 : (index + (event.key === "ArrowRight" ? 1 : -1) + SEGMENTS.length) % SEGMENTS.length;
        container.querySelector(`[data-segment="${SEGMENTS[next].id}"]`)?.click();
      });
    });
  };

  const bindBody = (data) => {
    const filterRows = () => {
      const rows = container.querySelectorAll('.billing-records tbody tr');
      let visible = 0;
      for (const row of rows) {
        const bill = data.bills.find(item => item.id === row.dataset.rowId);
        const rent = bill.lines.every(line => line.category === "rent");
        const status = rent ? bill.paymentStatus : bill.utilityTrackingStatus ?? "not_marked_paid";
        const haystack = [bill.tenantName, bill.unitCode, bill.id, bill.cycle, bill.receiptId].join(" ").toLowerCase();
        row.hidden = !(haystack.includes(filters.term.trim().toLowerCase()) && (!filters.category || bill.lines.some(line => line.category === filters.category)) && (!filters.status || status === filters.status));
        if (!row.hidden) visible++;
      }
      const countLabel = container.querySelector('[data-billing-result-count]');
      if (countLabel) countLabel.textContent = `${visible} of ${data.bills.length} bills`;
      const noResults = container.querySelector('[data-billing-no-results]');
      if (noResults) noResults.hidden = !data.bills.length || visible > 0;
      const table = container.querySelector('.billing-records .table-wrap');
      if (table) table.hidden = visible === 0;
    };
    const persistFilters = () => {
      const params = new URLSearchParams({tab:activeTab});
      if (filters.term) params.set("q",filters.term);
      if (filters.category) params.set("category",filters.category);
      if (filters.status) params.set("status",filters.status);
      history.replaceState(null,"",`#/bills?${params}`);
      filterRows();
    };
    container.querySelector('[data-billing-search]')?.addEventListener('input', event => {filters.term=event.target.value;persistFilters();});
    container.querySelectorAll('[data-billing-filter]').forEach(control => control.addEventListener('change', event => {filters[event.target.dataset.billingFilter]=event.target.value;persistFilters();}));
    container.querySelectorAll('[data-reset-billing-filters]').forEach(button => button.addEventListener('click', () => {
      filters.term=filters.category=filters.status="";
      container.querySelector('[data-billing-search]').value="";
      container.querySelectorAll('[data-billing-filter]').forEach(control => control.value="");
      persistFilters();
      container.querySelector('[data-billing-search]')?.focus({preventScroll:true});
    }));
    if (activeTab === "records") filterRows();
    container.querySelectorAll('[data-apply-advance]').forEach(button => {
      button.onclick = async () => {
        const bill = data.bills.find(b => b.id === button.dataset.applyAdvance);
        if (!window.confirm(`Apply ${peso(bill.availableAdvanceCredit)} confirmed advance credit to this final rent bill? A covered bill will reuse the original payment and receipt.`)) return;
        button.disabled = true;
        try {
          await api.post(`/bills/${encodeURIComponent(bill.id)}/apply-advance`, {confirmed:true});
          toastSuccess('Advance credit applied');
          await load();
          await onChanged?.();
        } catch(error) {toast({title:'Credit application blocked',message:error.message,tone:'danger'});}
        finally {button.disabled=false;}
      };
    });
    bindExceptionQueue(container, {
      onChanged: () => {
        load();
        onChanged?.();
      },
      canReview,
    });

    container.querySelectorAll("[data-report-payment]").forEach((button) => {
      button.addEventListener("click", async () => {
        const billId = button.getAttribute("data-report-payment");
        try {
          const bill = data.bills.find((b) => b.id === billId);
          reportPayment(bill, async () => {
            await load();
            await onChanged?.();
          });
        } catch (error) {
          toast({
            title: "Report failed",
            message: error.message,
            tone: "danger",
          });
        }
      });
    });

    container.querySelectorAll("[data-confirm-payment]").forEach((button) => {
      button.addEventListener("click", async () => {
        const paymentId = button.getAttribute("data-confirm-payment");
        if (button.disabled) return;
        button.disabled = true;
        button.setAttribute("aria-disabled", "true");
        try {
          const payment = await api.post(endpoints.confirmPayment(paymentId));
          toastSuccess(
            "Payment confirmed",
            `Receipt ${payment.receiptNumber} generated for ${payment.tenantName}.`,
          );
          load();
          onChanged?.();
        } catch (error) {
          toast({
            title: "Confirmation failed",
            message: error.message,
            tone: "danger",
          });
          button.removeAttribute("aria-disabled");
          button.disabled = false;
        }
      });
    });

    container.querySelectorAll("[data-open-tenant]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.getAttribute("data-open-tenant");
        if (id)
          openTenantPanel(id, {
            onChanged: () => {
              load();
              onChanged?.();
            },
          });
      });
    });
  };

  render(
    container,
    frame(
      segmentBar(
        { incoming: [], bills: [], payments: [], exceptions: [] },
        activeTab,
      ),
      activeTab,
      null,
      true,
    ),
  );
  try {
    await load();
  } catch (error) {
    render(
      container,
      frame(
        html`<div class="card">
          ${emptyState({
            iconName: "alert-triangle",
            title: "Billing data could not be loaded",
            body: error.message,
          })}
        </div>`,
      ),
      activeTab,
      null,
    );
  }
}

/* -------------------------------------------------------------- chrome -- */

function frame(segmentBarMarkup, activeTab, statsMarkup, loading = false) {
  return html`<section class="page manager-billing-page" aria-labelledby="page-title">
    <div class="page-header">
      <div class="page-header__title">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <span>Rentara</span>${icon("chevron-right", { size: 12 })}
          <span>Operations</span>${icon("chevron-right", { size: 12 })}
          <span>Bills & Payments</span>
        </nav>
        <h1 id="page-title">Bills &amp; Payments</h1>
        <p>OCR intake, billing records, payment confirmation and exceptions.</p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--secondary" type="button" data-action="sync-intake" ${loading ? "disabled" : ""}>
          ${icon("refresh", { size: 15 })} Sync intake
        </button>
        <button class="btn btn--primary" type="button" data-action="upload-source" ${loading ? "disabled" : ""}>
          ${icon("plus", { size: 15 })} Upload source
        </button>
        <button class="btn btn--ghost" type="button" data-action="check-rent-cycles" ${loading ? "disabled" : ""} title="Rent is generated automatically. Check for any eligible cycles not yet generated.">Check rent cycles</button>
      </div>
    </div>

    ${
      loading
        ? html`<div class="billing-summary-row">
            ${Array.from({ length: 4 }, () => html`<div class="stat-card" style="height:118px"><div class="skeleton full-width" style="height:100%"></div></div>`)}
          </div>`
        : statsMarkup
    }

    <div class="segmented mb-4" role="tablist" aria-label="Billing sections">
      ${segmentBarMarkup}
    </div>

    <div data-tab-panel id="billing-tab-panel" role="tabpanel" aria-labelledby="billing-tab-${activeTab}">
      ${loading ? html`<div class="card"><div class="card__body">${skeletonRows(6)}</div></div>` : null}
    </div>
  </section>`;
}

function segmentBar(data, activeTab) {
  const counts = {
    incoming: data.incoming?.length ?? 0,
    records: data.bills?.length ?? 0,
    payments:
      data.payments?.filter((p) => p.status === "tenant_reported_paid" && !p.rejectedOn)
        .length ?? 0,
    exceptions: data.exceptions?.filter((e) => e.state === "open").length ?? 0,
  };

  return html`${SEGMENTS.map(
    (segment) =>
      html`<button
        type="button"
        role="tab"
        id="billing-tab-${segment.id}"
        aria-controls="billing-tab-panel"
        tabindex="${segment.id === activeTab ? "0" : "-1"}"
        class="segmented__btn ${segment.id === activeTab ? "is-active" : ""}"
        data-segment="${segment.id}"
        aria-selected="${segment.id === activeTab ? "true" : "false"}"
      >
        ${icon(segment.icon, { size: 15 })} ${segment.label}
        <span class="segmented__count">${counts[segment.id]}</span>
      </button>`,
  )}`;
}

function stats(data) {
  const rent = data.bills.filter(b => b.lines.every(line => line.category === "rent"));
  const unpaid = rent.filter((b) => b.paymentStatus === "unpaid");
  const reported = rent.filter(
    (b) => b.paymentStatus === "tenant_reported_paid",
  );
  const paid = data.bills.filter((b) => b.paymentStatus === "paid");
  const sum = (list) => list.reduce((total, b) => total + b.totalDue, 0);
  const openExc = data.exceptions.filter((e) => e.state === "open").length;

  return html`<div class="billing-summary-row">
    ${statCard({
      label: "Incoming bills",
      value: data.incoming.length,
      iconName: "inbox",
      accent: "#0ea5e9",
      soft: "#f0f9ff",
      caption: "email and uploaded sources",
    })}
    ${statCard({
      label: "Unpaid rent",
      value: unpaid.length,
      iconName: "receipt",
      accent: "#dc2626",
      soft: "#fef2f2",
      caption: peso(sum(unpaid)),
    })}
    ${statCard({
      label: "Awaiting confirmation",
      value: reported.length,
      iconName: "clock",
      accent: "#f59e0b",
      soft: "#fffbeb",
      caption: peso(sum(reported)),
    })}
    ${statCard({
      label: "Exception Queue",
      value: openExc,
      iconName: "alert-triangle",
      accent: "#8b5cf6",
      soft: "#f5f3ff",
      caption: "records to review",
    })}
  </div>`;
}

/* ------------------------------------------------------- OCR intake tab -- */

function incomingSection(incoming) {
  if (!incoming.length) {
    return html`<div class="card">
      ${emptyState({
        iconName: "inbox",
        title: "No utility bills received",
        body: "Upload a clear bill photo or PDF using Upload source, or use Sync intake to check the property mailbox.",
      })}
    </div>`;
  }

  return html`<div class="card">
    <div class="card__header">
      <div>
        <h2 class="card__title">Incoming utility bills</h2>
        <p class="card__subtitle">
          Check the source and extracted details when a bill needs review.
        </p>
      </div>
    </div>

    <div>
      ${incoming.map((bill) => {
        const property = bill.propertyId?.slice(-1).toUpperCase();
        return html`<article class="ocr-bill">
          <span class="ocr-bill__thumb"
            >${icon(bill.category === "water" ? "droplet" : "bolt", { size: 20 })}</span
          >

          <div class="ocr-bill__main">
            <div class="ocr-bill__head">
              <span class="ocr-bill__provider">${bill.provider}</span>
              ${categoryChip(bill.category)}
              <span class="ocr-bill__ref"
                >${bill.accountRef ?? "no reference extracted"}</span
              >
            </div>

            <div class="ocr-bill__fields">
              <div class="ocr-field">
                <span class="ocr-field__label">Amount due</span>
                <span
                  class="ocr-field__value ${bill.amountDue == null ? "ocr-field__value--missing" : ""}"
                  >${bill.amountDue != null ? peso(bill.amountDue) : "not found"}</span
                >
              </div>
              <div class="ocr-field">
                <span class="ocr-field__label">Due date</span>
                <span
                  class="ocr-field__value ${bill.dueDate == null ? "ocr-field__value--missing" : ""}"
                  >${bill.dueDate ? date(bill.dueDate) : "not found"}</span
                >
              </div>
              <div class="ocr-field">
                <span class="ocr-field__label">Billing period</span>
                <span
                  class="ocr-field__value ${bill.billingPeriod == null ? "ocr-field__value--missing" : ""}"
                  >${periodLabel(bill.billingPeriod)}</span
                >
              </div>
              <div class="ocr-field">
                <span class="ocr-field__label">Source file</span>
                <span
                  class="ocr-field__value"
                  style="font-weight:400;font-size:var(--text-xs)"
                  >${bill.filename}</span
                >
              </div>
            </div>
            <p class="ocr-bill__method">${bill.extractionMethod === "pdf_text" || bill.intakeMethod === "email_body" ? "Direct text extraction" : bill.contentType?.startsWith("image/") || bill.extractionMethod === "pdf_ocr" ? `Image OCR${Number.isFinite(bill.confidence) ? ` · ${Math.round(bill.confidence)}% recognition estimate` : ""}` : "Source text extracted"}</p>
            ${bill.ocrStatus === "failed" ? html`<p class="ocr-bill__reason">${bill.extractionError || bill.validationResults?.filter(result => result.outcome === "failed").flatMap(result => result.reasons ?? []).join(" · ") || "Review account mapping and required bill details."}</p>` : null}
          </div>

          <div class="ocr-bill__side">
            ${ocrStatusBadge(bill.ocrStatus)}
            <span
              class="text-xs text-muted"
              title="${dateTime(bill.receivedAt)}"
              >${relative(bill.receivedAt)}</span
            >
            <button class="btn btn--primary btn--sm" data-review-ocr="${bill.id}">Review bill</button><span class="chip"
              >${bill.unitId ? "Mapped unit" : "Mapping unresolved"}</span
            >
          </div>
        </article>`;
      })}
    </div>

    <div class="card__footer">
      <div class="notice-strip notice-strip--info">
        <span class="notice-strip__icon">${icon("info", { size: 14 })}</span>
        <span>
          Bills needing corrections stay in the Exception Queue until rechecked.
        </span>
      </div>
    </div>
  </div>`;
}

function ocrStatusBadge(status) {
  if (status === "validated")
    return badge("Validated", "success", { dot: true });
  if (status === "failed") return badge("Needs review", "warning", { dot: true });
  return badge("Processing", "warning", { dot: true });
}

/* ------------------------------------------------------- records tab ---- */

function recordsTable(bills, { canConfirm, filters }) {
  return dataTable({
    ariaLabel: "Billing records",
    clickable: true,
    rows: bills,
    emptyTitle: "No billing records",
    emptyBody: "Use Generate rent for eligible rent cycles, or upload a utility bill for extraction and validation.",
    emptyIcon: "receipt",
    toolbar: html`
      <label class="field-inline billing-search">
        ${icon("search", { size: 15 })}
        <input
          type="search"
          placeholder="Search tenant, unit or bill id…"
          aria-label="Search bills"
          data-billing-search
          value="${filters.term}"
        />
      </label>
      <label class="billing-filter"><span>Category</span><select aria-label="Filter bill category" data-billing-filter="category">${filterOptions([["","All categories"],["rent","Rent"],["electricity","Electricity"],["water","Water"]], filters.category)}</select></label>
      <label class="billing-filter"><span>Status</span><select aria-label="Filter bill status" data-billing-filter="status">${filterOptions([["","All statuses"],["unpaid","Rent: Unpaid"],["tenant_reported_paid","Rent: Reported paid"],["paid","Rent: Paid"],["not_marked_paid","Utility: Not marked paid"],["self_reported_paid","Utility: Self-reported paid"]], filters.status)}</select></label>
      <button class="btn btn--ghost btn--sm" type="button" data-reset-billing-filters>Clear filters</button>
      <span class="table-toolbar__spacer"></span>
      <span class="text-xs text-muted" data-billing-result-count aria-live="polite">${bills.length} bills</span>
    `,
    columns: [
      {
        key: "tenantName",
        label: "Tenant",
        render: (row) =>
          html`<span class="cell-entity">
            <span class="avatar avatar--sm ${avatarTone(row.tenantName)}"
              >${initials(row.tenantName)}</span
            >
            <span class="cell-entity__meta">
              <strong>${row.tenantName}</strong>
              <span class="font-mono">${row.unitCode}</span>
            </span>
          </span>`,
      },
      {
        key: "lines",
        label: "Categories",
        render: (row) =>
          html`<span class="row row-2 row-wrap"
            >${[...new Set(row.lines.map((l) => l.category))].map((c) => categoryChip(c))}</span
          >`,
      },
      {
        key: "cycle",
        label: "Cycle",
        render: (row) =>
          html`<span class="cell-stack">
            <strong>${monthLabel(row.cycle)}</strong>
            <span>due ${date(row.dueDate)}</span>
          </span>`,
      },
      {
        key: "totalDue",
        label: "Total due",
        render: (row) => html`<span class="money">${peso(row.totalDue)}</span>`,
      },
      {
        key: "paymentStatus",
        label: "Status",
        render: (row) => row.lines.every(l => l.category === "rent") ? paymentBadge(row.paymentStatus) : html`<span>${row.utilityTrackingStatus === "self_reported_paid" ? "Self-Reported Paid" : "Not Marked Paid"}<small>Provider payment not verified.</small></span>`,
      },
      {
        key: "receiptId",
        label: "Receipt",
        render: (row) =>
          row.receiptId
            ? html`<span class="chip chip--accent">${row.receiptId}</span>`
            : html`<span class="text-xs text-muted">—</span>`,
      },
      {
        key: "actions",
        label: "",
        className: "cell-actions",
        render: (row) =>
          html`<span class="row row-2" style="justify-content:flex-end">
            ${canConfirm && row.lines.every(l => l.category === "rent") && row.paymentStatus === "unpaid" ? html`<button class="btn btn--secondary btn--sm" data-record-rent="${row.id}" data-no-row>Record rent</button>` : null}
            ${canConfirm && row.availableAdvanceCredit > 0 ? html`<button class="btn btn--primary btn--sm" data-apply-advance="${row.id}" data-no-row>Apply advance ${peso(row.availableAdvanceCredit)}</button>` : null}
            <button
              class="btn btn--soft btn--sm"
              type="button"
              data-open-tenant="${row.tenantId}"
              data-no-row
            >
              Details
            </button>
            <button
              class="btn btn--ghost btn--sm"
              data-view-bill="${row.id}"
              data-no-row
            >
              View bill
            </button>
            ${
              canConfirm && row.lines.every(line => line.category === "rent") && row.paymentStatus === "unpaid"
                ? html`<span class="text-xs text-muted"
                    >Awaiting rent payment</span
                  >`
                : null
            }
          </span>`,
      },
    ],
    footer: html`<span class="text-muted">Manager confirms rent. Utility marks are personal and unverified.</span>`,
  });
}

function filterOptions(options, selected) {
  return options.map(([value,label]) => html`<option value="${value}" ${value === selected ? "selected" : ""}>${label}</option>`);
}

/* ------------------------------------------------------ payments tab ---- */

function paymentsSection(payments, { canConfirm }) {
  const reported = payments.filter((p) => p.status === "tenant_reported_paid" && !p.rejectedOn);
  const confirmed = payments.filter((p) => p.status === "paid");

  return html`
    ${
      reported.length
        ? html`<div class="confirm-bar mb-4">
            <span class="confirm-bar__text">
              ${icon("clock", { size: 15 })} ${count(reported.length)}
              payment${reported.length === 1 ? "" : "s"} reported by tenants
              awaiting your confirmation
            </span>
            <span class="text-xs text-muted">
              ${canConfirm ? "Confirming generates a digital receipt." : "Confirmation requires the Manager role."}
            </span>
          </div>`
        : null
    }
    ${dataTable({
      ariaLabel: "Payments",
      rows: payments,
      emptyTitle: "No payments recorded",
      emptyBody: "Tenant-reported and confirmed payments will be listed here.",
      emptyIcon: "credit-card",
      toolbar: html`<span class="text-xs font-semibold text-muted"
          >Payment register</span
        >
        <span class="table-toolbar__spacer"></span>
        <span class="text-xs text-muted">${payments.length} entries</span>`,
      columns: [
        {
          key: "tenantName",
          label: "Tenant",
          render: (row) =>
            html`<span class="cell-stack">
              <strong>${row.tenantName}</strong>
              <span>${row.billId}</span>
            </span>`,
        },
        {
          key: "amount",
          label: "Amount",
          render: (row) => html`<span class="money">${peso(row.amount)}</span>`,
        },
        {
          key: "method",
          label: "Method",
          render: (row) =>
            html`<span class="text-xs">${row.method.replace("_", " ")}</span>`,
        },
        {
          key: "reportedOn",
          label: "Reported",
          render: (row) =>
            html`<span class="time-cell" title="${dateTime(row.reportedOn)}"
              ><strong>${relative(row.reportedOn)}</strong
              >${date(row.reportedOn)}</span
            >`,
        },
        {
          key: "status",
          label: "Status",
          render: (row) => paymentBadge(row.status),
        },
        {
          key: "receiptNumber",
          label: "Receipt",
          render: (row) =>
            row.receiptNumber
              ? html`<button class="btn btn--secondary btn--sm" type="button" data-view-receipt="${row.receiptNumber}">View receipt</button><button
                  class="btn btn--ghost btn--sm"
                  data-receipt="${row.receiptNumber}"
                >
                  Download
                </button>`
              : html`<span class="text-xs text-muted">pending</span>`,
        },
        {
          key: "actions",
          label: "",
          className: "cell-actions",
          render: (row) =>
            row.status === "tenant_reported_paid" && !row.rejectedOn
              ? html`<button
                    class="btn btn--primary btn--sm"
                    type="button"
                    data-confirm-payment="${row.id}"
                    data-no-row
                    ${canConfirm ? "" : "disabled"}
                  >
                    ${icon("check", { size: 14 })} Confirm</button
                  ><button
                    class="btn btn--secondary btn--sm"
                    data-reject-payment="${row.id}"
                    data-no-row
                  >
                    Reject
                  </button>`
              : row.rejectedOn
                ? html`<span
                    class="text-xs text-danger"
                    title="${row.rejectionReason}"
                    >Rejected: ${row.rejectionReason}</span
                  >`
                : html`<span class="text-xs text-muted">confirmed</span>`,
        },
      ],
      footer: html`<span
          >${count(confirmed.length)} confirmed · ${count(reported.length)}
          pending</span
        >
        <span class="text-muted"
          >Receipts exist only for confirmed payments</span
        >`,
    })}
  `;
}

export default renderBills;
