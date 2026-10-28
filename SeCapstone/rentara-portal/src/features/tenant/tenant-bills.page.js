import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { paymentBadge, categoryChip } from "../../components/badge.js";
import { dataTable } from "../../components/data-table.js";
import { emptyState, skeletonRows } from "../../components/empty-state.js";
import { toast, toastSuccess } from "../../components/toast.js";
import { api } from "../../api/client.js";
import { endpoints } from "../../api/endpoints.js";
import session from "../../auth/session.js";
import { peso, date, relative, dateTime, monthLabel, billTiming } from "../../utils/format.js";
import { reportPayment } from "../../app/workflows.js";
import { confirmCopy } from "../../components/action-feedback.js";

/**
 * Tenant view — "My Bills & Payments".
 * Own bills only; report payment; confirmed receipts.
 */
export async function renderTenantBills(container, filters = {}) {
  const tenantId = session.user?.tenantId;
  if (filters.query) filters = Object.fromEntries(filters.query);

  const refreshing = Boolean(container.querySelector(".page"));
  if (!refreshing) render(
    container,
    frame(
      html`<div class="card">
        <div class="card__body">${skeletonRows(5)}</div>
      </div>`,
    ),
  );

  try {
    const [bills, payments, documents] = await Promise.all([
      api.get(endpoints.tenantBills(tenantId)),
      api.get(endpoints.tenantPayments(tenantId)),
      api.get(endpoints.tenantDocuments(tenantId)),
    ]);
    let filtersOpen = window.matchMedia("(min-width: 721px)").matches || Boolean(filters.month || filters.category || filters.status);
    const paint = (restoreControl) => {
      const position = { left:window.scrollX, top:window.scrollY, behavior:"instant" };
      const matched = bills.filter(b => (!filters.month || b.cycle === filters.month) && (!filters.category || b.lines.some(l => l.category === filters.category)) && (!filters.status || (isRent(b) ? b.paymentStatus : b.utilityTrackingStatus ?? "not_marked_paid") === filters.status));
      render(
      container,
      frame(
        html`${content(matched, payments, { hasBills:bills.length > 0, filtered:Boolean(filters.month || filters.category || filters.status), allBills:bills })}
          <section class="card mt-4">
            <div class="card__header">
              <h2 class="card__title">My documents</h2>
            </div>
            <div class="card__body">
              ${documents.filter((d) => d.kind !== "receipt").map((d) => html`<div class="row row-between mb-3"><span>${d.name}</span><button class="btn btn--secondary btn--sm" data-document="${d.id}" data-kind="${d.kind}" data-filename="${d.name}">Download</button></div>`)}${documents.filter((d) => d.kind !== "receipt").length ? "" : html`<p>No uploaded documents.</p>`}
            </div>
          </section>`,
      ),
    );
    if (refreshing || restoreControl) window.scrollTo(position);
    const bar = document.createElement("div");
    bar.className = "history-filters row row-wrap tenant-history-toolbar";
    render(bar, html`<label>Month<select class="input select" data-history-filter="month"><option value="">All months</option>${[...new Set(bills.map(b=>b.cycle))].sort().reverse().map(m=>html`<option value="${m}">${monthLabel(m)}</option>`)}</select></label><label>Category<select class="input select" data-history-filter="category"><option value="">All categories</option><option value="rent">Rent</option><option value="electricity">Electricity</option><option value="water">Water</option></select></label><label>Status<select class="input select" data-history-filter="status"><option value="">All statuses</option><option value="unpaid">Unpaid rent</option><option value="tenant_reported_paid">Rent awaiting confirmation</option><option value="paid">Confirmed rent</option><option value="not_marked_paid">Utility not marked paid</option><option value="self_reported_paid">Utility self-reported paid</option></select></label><button class="btn btn--secondary" data-reset-history>Reset filters</button>`);
    const disclosure = document.createElement("details");
    disclosure.className = "tenant-filter-disclosure mb-3";
    disclosure.open = filtersOpen;
    const activeFilters = [filters.month, filters.category, filters.status].filter(Boolean).length;
    render(disclosure, html`<summary> ${icon("filter", {size:16})} Filters <span class="badge ${activeFilters ? "badge--primary" : ""}">${activeFilters ? `${activeFilters} active` : "All bills"}</span></summary>`);
    disclosure.append(bar);
    disclosure.addEventListener("toggle", () => { if (disclosure.isConnected) filtersOpen = disclosure.open; });
    container.querySelector(".page-header").after(disclosure);
    bar.querySelectorAll("[data-history-filter]").forEach(select => {
      select.value = filters[select.dataset.historyFilter] ?? "";
      select.addEventListener("change",()=>{
        filtersOpen = disclosure.open;
        filters = {...filters,[select.dataset.historyFilter]:select.value};
        persist();
        paint(select.dataset.historyFilter);
      });
    });
    bar.querySelector("[data-reset-history]").addEventListener("click",()=>{filtersOpen=disclosure.open;filters={};persist();paint("month");});
    bind(container, bills, filters);
    if (restoreControl) bar.querySelector(`[data-history-filter="${restoreControl}"]`)?.focus({preventScroll:true});
    };
    const persist = () => {
      const params = new URLSearchParams();
      for (const key of ["month","category","status"]) if (filters[key]) params.set(key,filters[key]);
      history.replaceState(null,"",`#/tenant/bills${params.size ? `?${params}` : ""}`);
    };
    paint();
  } catch (error) {
    render(
      container,
      frame(
        html`${emptyState({
          iconName: "alert-triangle",
          title: "Your bills could not be loaded",
          body: error.message,
            action: html`<button type="button" class="btn btn--secondary" data-retry-page>Try again</button>`,
        })}<button class="btn btn--secondary mt-3" type="button" data-retry-bills>Try again</button>`,
      ),
    );
    container.querySelector('[data-retry-bills]')?.addEventListener('click',()=>renderTenantBills(container,filters));
    container.querySelector("[data-retry-page]").onclick = () => renderTenantBills(container);
  }
}

function frame(content) {
  return html`<section class="page tenant-bills-page" aria-labelledby="page-title">
    <div class="page-header">
      <div class="page-header__title">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <span>Rentara</span>${icon("chevron-right", { size: 12 })}
          <span>Tenant</span>${icon("chevron-right", { size: 12 })}
          <span>Bills & Payments</span>
        </nav>
        <h1 id="page-title">My Bills &amp; Payments</h1>
        <p>Rent, electricity and water records for your unit.</p>
      </div>
    </div>
    ${content}
  </section>`;
}

function content(bills, payments, {hasBills, filtered, allBills}) {
  const receipts = payments.filter((p) => p.receiptNumber);

  return html`
    <div class="stack stack-4">
      ${dataTable({
        clickable: true,
        ariaLabel: "My bills",
        rows: bills,
        toolbar: html`<span class="chip chip--accent"
            >${icon("receipt", { size: 12 })} Billing records</span
          >
          <span class="table-toolbar__spacer"></span>
          <span class="text-xs text-muted">${bills.length} records</span>`,
        emptyTitle: hasBills && filtered ? "No bills match your filters" : "No bills available yet",
        emptyBody: hasBills && filtered ? "Use Reset filters to see all your bills." : "Your rent and utility bills will appear here once finalized. You do not need to add them yourself.",
        emptyIcon: "receipt",
        columns: [
          {
            key: "cycle",
            label: "Cycle",
            render: (row) =>
              html`<span class="cell-stack">
                <strong>${monthLabel(row.cycle)}</strong
                ><button
                  class="btn btn--ghost btn--sm"
                  data-view-bill="${row.id}"
                >
                  View bill
                </button>
                <span>Due ${date(row.dueDate)} ${billTiming(row) ? html`<span class="bill-urgency">${billTiming(row)}</span>` : null}</span>
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
            key: "totalDue",
            label: "Amount due",
            render: (row) =>
              html`<span class="money">${peso(row.totalDue)}</span>`,
          },
          {
            key: "paymentStatus",
            label: "Status",
            render: (row) => row.lines.every(l => l.category === "rent") ? paymentBadge(row.paymentStatus) : html`<span>${row.utilityTrackingStatus === "self_reported_paid" ? "Self-Reported Paid" : "Not Marked Paid"}</span>${row.utilityTrackingNeedsReview ? html`<small>Bill changed ? review your previous mark.</small>` : null}`,
          },
          {
            key: "receiptId",
            label: "Receipt",
            render: (row) =>
              row.receiptId
                ? html`<div class="receipt-actions"><button class="btn btn--secondary btn--sm" type="button" data-view-receipt="${row.receiptId}" aria-label="View rent receipt ${row.receiptId}">View receipt</button><button class="btn btn--ghost btn--sm" type="button" data-receipt="${row.receiptId}" aria-label="Download rent receipt ${row.receiptId}">${icon("download", {size:14})} Download</button></div>`
                : null,
          },
          {
            key: "actions",
            label: "",
            className: "cell-actions",
            render: (row) =>
              !row.lines.every(l => l.category === "rent")
                ? html`<button class="btn btn--secondary btn--sm" data-track-utility="${row.id}">${row.utilityTrackingNeedsReview ? "Confirm personal mark" : row.utilityTrackingStatus === "self_reported_paid" ? "Undo mark" : "Mark personally paid"}</button>`
                : row.paymentStatus === "unpaid" && row.totalDue > 0
                ? html`<button
                    class="btn btn--primary btn--sm"
                    type="button"
                    data-report-bill="${row.id}"
                    data-no-row
                  >
                    ${icon("credit-card", { size: 14 })} Report rent payment
                  </button>`
                : row.creditSettled
                  ? html`<span class="text-xs text-success">Settled by advance credit</span>`
                  : row.totalDue === 0
                    ? html`<span class="text-xs text-muted">No amount due</span>`
                    : null,
          },
        ],
        footer: html`<span>Manager confirms rent payments. Utility marks are personal; provider payment not verified.</span>`,
      })}

      <details class="card disclosure-card receipt-archive">
        <summary class="card__header">
          <span class="card__title">Receipt history</span>
          <span class="badge badge--success">${receipts.length} issued</span>
        </summary>
        <div class="card__body">
          ${
            receipts.length
              ? html`<div class="mini-list tenant-receipt-list">
                  ${receipts.map(
                    (payment) =>
                      html`<div class="mini-list__item">
                        <span
                          class="mini-list__icon"
                          style="--tone:#16a34a;--tone-bg:#dcfce7"
                          >${icon("receipt", { size: 16 })}</span
                        >
                        <span class="mini-list__body">
                          <strong>Rent receipt · ${monthLabel(allBills.find(b => b.id === payment.billId)?.cycle || String(payment.confirmedOn ?? "").slice(0,7))}</strong>
                          <span class="receipt-reference">Ref ${payment.receiptNumber.slice(0,12)}… <button class="btn btn--ghost btn--sm" type="button" data-copy-reference="${payment.receiptNumber}" aria-label="Copy full receipt reference">${icon("copy", {size:14})} Copy</button></span>
                          <span
                            >confirmed ${dateTime(payment.confirmedOn)}</span
                          >
                        </span>
                        <div class="mini-list__end receipt-summary">
                          <span class="money">${peso(payment.amount)}</span>
                          <div class="receipt-actions">
                          <button class="btn btn--secondary btn--sm" type="button" data-view-receipt="${payment.receiptNumber}">View receipt</button>
                          <button
                            class="btn btn--ghost btn--sm"
                            type="button"
                            data-receipt="${payment.receiptNumber}"
                          >
                            ${icon("download", { size: 14 })} Download
                          </button>
                          </div>
                        </div>
                      </div>`,
                  )}
                </div>`
              : emptyState({
                  iconName: "file",
                  title: "No receipts issued yet",
                  body: "A digital receipt appears here once the Manager confirms your payment.",
                })
          }
        </div>
      </details>

      <section class="card">
        <div class="card__header">
          <h2 class="card__title">Payment report history</h2>
        </div>
        <div class="card__body">
          ${
            payments.length
              ? payments.map(
                  (p) =>
                    html`<article class="mb-3">
                      <div class="row row-between row-wrap"><strong>${peso(p.amount)}</strong>${paymentBadge(p.status)}</div>
                      <p class="text-sm text-secondary">${p.method.replaceAll("_", " ")}${p.reference ? ` · ${p.reference}` : ""} · ${dateTime(p.reportedOn || p.confirmedOn)}</p>
                      ${p.rejectionReason ? html`<p class="text-danger">Rejected: ${p.rejectionReason}</p>` : null}
                    </article>`,
                )
              : html`<p>No reports submitted.</p>`
          }
        </div>
      </section>

    </div>
  `;
}

function bind(container, bills, filters) {
  container.querySelectorAll("[data-copy-reference]").forEach(button => button.addEventListener("click", async () => {
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) await navigator.clipboard.writeText(button.dataset.copyReference);
      else {
        const input = document.createElement("textarea");
        input.value = button.dataset.copyReference;
        input.setAttribute("aria-label", "Receipt reference");
        input.style.cssText = "position:fixed;left:0;top:0;opacity:0";
        document.body.append(input);
        try { input.select(); if (!document.execCommand("copy")) throw new Error("Open the receipt to select and copy its full reference."); }
        finally { input.remove(); button.focus({preventScroll:true}); }
      }
      confirmCopy(button);
      toastSuccess("Reference copied", "Full receipt reference copied.");
    } catch (error) { toast({title:"Could not copy",message:error.message,tone:"danger"}); }
  }));
  container.querySelectorAll("[data-track-utility]").forEach(button => button.addEventListener("click", async () => {
    const bill = bills.find(b => b.id === button.dataset.trackUtility);
    if (button.disabled) return;
    const label = button.textContent;
    button.disabled = true; button.textContent = "Saving...";
    try {
      await api.post(`/bills/${bill.id}/utility-tracking`, { status: bill.utilityTrackingStatus === "self_reported_paid" && !bill.utilityTrackingNeedsReview ? "not_marked_paid" : "self_reported_paid", revision: bill.revision });
      await renderTenantBills(container, filters);
      container.querySelector(`[data-track-utility="${bill.id}"]`)?.focus({ preventScroll:true });
      toastSuccess("Tracker updated", "Your personal tracking change was saved.");
      window.dispatchEvent(new CustomEvent("app:data-changed"));
    } catch(error) { toast({title: "Tracking not saved", message: error.message, tone: "danger"}); }
    finally { button.disabled = false; button.textContent = label; }
  }));
  container.querySelectorAll("[data-report-bill]").forEach((button) => {
    button.addEventListener("click", async () => {
      const billId = button.getAttribute("data-report-bill");
      try {
        reportPayment(
          bills.find((b) => b.id === billId),
          async () => {
            await renderTenantBills(container, filters);
            window.dispatchEvent(new CustomEvent("app:data-changed"));
          },
        );
      } catch (error) {
        toast({
          title: "Report failed",
          message: error.message,
          tone: "danger",
        });
      }
    });
  });

  container
    .querySelectorAll('[data-action="report-payment"]')
    .forEach((button) => {
      button.addEventListener("click", () => {
        const open = bills.find(
          (b) => b.lines.every(l => l.category === "rent") && b.paymentStatus === "unpaid" && b.totalDue > 0,
        );
        if (!open) {
          toast({
            title: "Nothing to report",
            message: "You have no unpaid bill in the current cycle.",
            tone: "info",
          });
          return;
        }
        container.querySelector(`[data-report-bill="${open.id}"]`)?.click();
      });
    });
}

function isRent(bill) { return bill.lines.every(line => line.category === "rent"); }

export { relative };
export default renderTenantBills;
