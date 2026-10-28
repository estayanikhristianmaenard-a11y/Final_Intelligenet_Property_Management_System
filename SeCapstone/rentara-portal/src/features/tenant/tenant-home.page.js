import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { paymentBadge } from "../../components/badge.js";
import { emptyState } from "../../components/empty-state.js";
import { api } from "../../api/client.js";
import { endpoints } from "../../api/endpoints.js";
import session from "../../auth/session.js";
import { peso, date, relative, monthLabel, billTiming } from "../../utils/format.js";
import { reportPayment } from "../../app/workflows.js";
import { toastDanger, toastSuccess } from "../../components/toast.js";
import { calendarEntries } from "./calendar-model.js";

export async function renderTenantHome(container) {
  const tenantId = session.user?.tenantId;
  const refreshing = Boolean(container.querySelector(".tenant-home-page"));
  if (!refreshing) render(container, frame(html`<div class="tenant-home-grid tenant-home-skeleton" aria-label="Loading your billing overview">
    <div class="tenant-property-banner"><div><span class="skeleton-line skeleton-line--short"></span><span class="skeleton-line skeleton-line--wide"></span><span class="skeleton-line skeleton-line--medium"></span></div></div>
    <div class="card"><div class="card__body"><span class="skeleton-line skeleton-line--medium"></span><span class="skeleton-line skeleton-line--wide"></span><span class="skeleton-line skeleton-line--short"></span></div></div>
    <div class="card"><div class="card__body"><span class="skeleton-line skeleton-line--wide"></span><span class="skeleton-line skeleton-line--wide"></span><span class="skeleton-line skeleton-line--medium"></span></div></div>
  </div>`));
  try {
    const tenant = await api.get(endpoints.tenant(tenantId));
    const position = { left:window.scrollX, top:window.scrollY, behavior:"instant" };
    render(container, frame(content(tenant)));
    bind(container, tenant);
    if (refreshing) window.scrollTo(position);
  } catch (error) {
    render(container, frame(emptyState({ iconName: "alert-triangle", title: "Your home could not be loaded", body: error.message, action:html`<button type="button" class="btn btn--secondary" data-retry-page>Try again</button>` })));
    container.querySelector("[data-retry-page]").onclick=()=>renderTenantHome(container);
  }
}

function frame(pageContent) {
  return html`<section class="page tenant-home-page" aria-labelledby="page-title">
    <div class="page-header"><div class="page-header__title"><h1 id="page-title">My home</h1><p>Your rent, utility bills, and due dates.</p></div></div>
    ${pageContent}
  </section>`;
}

function content(tenant) {
  const bills = tenant.bills ?? [];
  const rentBills = bills.filter(isRent);
  const rent = rentBills.find((bill) => bill.paymentStatus === "unpaid") ?? rentBills[0];
  const utilityHistory = bills.filter((bill) => !isRent(bill)).sort((a, b) => String(b.dueDate).localeCompare(String(a.dueDate)));
  const utilities = [...new Set(["electricity", "water"].map(category => utilityHistory.find(bill => bill.lines.some(line => line.category === category))).filter(Boolean))];
  const payments = tenant.payments ?? [];
  const receiptNumber = rent?.paymentStatus === "paid" ? rent.receiptId || payments.find(payment => payment.billId === rent.id && payment.status === "paid" && payment.receiptNumber)?.receiptNumber : null;
  const now = new Date();

  return html`<div class="tenant-home-grid">
      <section class="tenant-property-banner">
        <div><h2>Hello, ${tenant.fullName.split(" ")[0]}.</h2><p>${tenant.propertyName} · Unit ${tenant.unitCode}</p></div>
        <span class="tenant-property-banner__mark" aria-hidden="true">${icon("building", { size: 34 })}</span>
      </section>

      <section class="card tenant-rent-card">
        <div class="card__header"><div><h2 class="card__title">Rent bill</h2><p class="card__subtitle">${rent ? monthLabel(rent.cycle) : "Current rent bill"}</p></div>${rent ? paymentBadge(rent.paymentStatus) : null}</div>
        <div class="card__body">${rent ? html`<p class="tenant-rent-card__amount">${peso(rent.totalDue)}</p><p class="tenant-rent-card__due">Due ${date(rent.dueDate)} ${billTiming(rent) ? html`<span class="bill-urgency">${billTiming(rent)}</span>` : null}</p>${rent.paymentStatus === "tenant_reported_paid" ? html`<div class="notice-strip notice-strip--warning mt-3">Your report is waiting for Manager confirmation.</div>` : null}` : emptyState({iconName:"receipt",title:"No rent bill available yet"})}</div>
        <div class="card__footer row row-wrap">${rent?.paymentStatus === "unpaid" ? html`<button class="btn btn--primary" type="button" data-action="report-payment">Report rent payment</button>` : null}${receiptNumber ? html`<button class="btn btn--primary" type="button" data-view-receipt="${receiptNumber}">View receipt</button><button class="btn btn--secondary" type="button" data-receipt="${receiptNumber}">Download rent receipt</button>` : null}<a class="btn btn--secondary" href="#/tenant/bills">Bills and history</a></div>
      </section>

      <section class="card tenant-utility-card">
        <div class="card__header"><div><h2 class="card__title tenant-utility-card__title"><span>${icon("receipt", { size: 18 })}</span>Personal utility tracker</h2><p class="tenant-utility-card__disclaimer">Provider payment not verified.</p></div></div>
        <div class="card__body">${utilities.length ? utilities.map(utilityRow) : html`<p class="text-secondary">Your electricity and water bills will appear here once received and validated.</p>`}</div>
        <div class="card__footer"><a class="text-link" href="#/tenant/bills">Utility history ${icon("arrow-right",{size:14})}</a></div>
      </section>

      <section class="card tenant-payment-history">
        <div class="card__header"><h2 class="card__title">Recent rent payments</h2><a class="text-link" href="#/tenant/bills">View history ${icon("arrow-right",{size:14})}</a></div>
        <div class="card__body">${payments.length ? html`<div class="mini-list">${payments.slice(0,3).map((payment) => html`<div class="mini-list__item"><span class="mini-list__icon">${icon(payment.status === "paid" ? "check-circle" : "clock",{size:16})}</span><span class="mini-list__body"><strong>${peso(payment.amount)}</strong><span>${relative(payment.reportedOn)}</span></span><span class="mini-list__end">${paymentBadge(payment.status)}<small class="text-xs text-muted">${payment.receiptNumber ? `Ref ${payment.receiptNumber.slice(0,12)}?` : ""}</small></span></div>`)}</div>` : html`<p class="text-secondary">No rent payments reported yet.</p>`}</div>
      </section>
    <section class="card tenant-calendar" aria-labelledby="tenant-calendar-title">
      <div class="card__header"><div class="tenant-calendar__head"><h2 class="card__title" id="tenant-calendar-title">Billing calendar</h2><div class="tenant-calendar__controls"><button type="button" data-calendar-today>Today</button><button type="button" data-calendar-month="-1" aria-label="Previous month">${icon("chevron-left",{size:17})}</button><button type="button" data-calendar-month="1" aria-label="Next month">${icon("chevron-right",{size:17})}</button></div></div></div>
      <div class="card__body" data-calendar-host>${calendarMarkup(bills,toDateKey(now),now,tenant)}</div>
    </section>
  </div>`;
}

function bind(container, tenant) {
  container.querySelectorAll("[data-home-track-utility]").forEach(button => button.addEventListener("click", async () => {
    if (button.disabled) return;
    const bill = (tenant.bills ?? []).find(item => item.id === button.dataset.homeTrackUtility);
    if (!bill || isRent(bill)) return;
    const label = button.textContent;
    button.disabled = true;
    button.textContent = "Saving…";
    try {
      const status = bill.utilityTrackingStatus === "self_reported_paid" && !bill.utilityTrackingNeedsReview ? "not_marked_paid" : "self_reported_paid";
      await api.post(`/bills/${encodeURIComponent(bill.id)}/utility-tracking`, { status, revision: bill.revision });
      await renderTenantHome(container);
      container.querySelector(`[data-home-track-utility="${bill.id}"]`)?.closest(".tenant-utility-row")?.classList.add("is-saved");
      container.querySelector(`[data-home-track-utility="${bill.id}"]`)?.focus({ preventScroll:true });
      toastSuccess("Tracker updated", status === "self_reported_paid" ? "Your personal paid mark was saved." : "Your personal paid mark was removed.");
      window.dispatchEvent(new CustomEvent("app:data-changed"));
    } catch (error) { toastDanger("Tracking not saved", error.message); }
    finally { button.disabled = false; button.textContent = label; }
  }));
  container.querySelector('[data-action="report-payment"]')?.addEventListener("click", () => {
    const bill = (tenant.bills ?? []).find((item) => isRent(item) && item.paymentStatus === "unpaid" && item.totalDue > 0);
    if (!bill) return;
    reportPayment(bill, async () => {
      await renderTenantHome(container);
      window.dispatchEvent(new CustomEvent("app:data-changed"));
    });
  });
  let month = new Date();
  let selected = toDateKey(month);
  container.querySelector("[data-calendar-today]")?.addEventListener("click", () => {
    month = new Date(); selected = toDateKey(month);
    updateCalendar(container, tenant, selected, month);
  });
  container.querySelectorAll("[data-calendar-month]").forEach((button) => button.addEventListener("click", () => {
    month = new Date(month.getFullYear(), month.getMonth() + Number(button.dataset.calendarMonth), 1);
    selected = toDateKey(month);
    updateCalendar(container, tenant, selected, month);
  }));
  container.querySelector("[data-calendar-host]")?.addEventListener("click", (event) => {
    const day = event.target.closest("[data-calendar-date]");
    if (!day) return;
    selected = day.dataset.calendarDate;
    updateCalendar(container, tenant, selected, month);
  });
}

function utilityRow(bill) {
  const electricity = bill.lines.some(line => line.category === "electricity");
  const name = [...new Set(bill.lines.map(lineName))].join(" / ");
  const marked = bill.utilityTrackingStatus === "self_reported_paid";
  const review = bill.utilityTrackingNeedsReview;
  return html`<div class="tenant-utility-row">
    <span class="tenant-utility-row__icon ${electricity ? "is-electricity" : "is-water"}" aria-hidden="true">${icon(electricity ? "zap" : "droplet", { size: 25 })}</span>
    <div class="tenant-utility-row__details"><strong>${name}</strong><span class="tenant-utility-row__amount">${peso(bill.totalDue)}</span><span class="tenant-utility-row__meta">Due ${date(bill.dueDate)} ${billTiming(bill) ? html`<span class="bill-urgency">${billTiming(bill)}</span>` : null}</span></div>
    <span class="tenant-utility-row__status badge ${review ? "badge--warning" : marked ? "badge--success" : "badge--danger"}">${review ? "Review mark" : marked ? "Self-Reported Paid" : "Not Marked Paid"}</span>
    ${review ? html`<p class="tenant-utility-row__review">This bill changed. Check the updated amount before confirming your personal mark.</p>` : null}
    <button class="btn btn--secondary tenant-utility-row__action" type="button" data-home-track-utility="${bill.id}" aria-label="${review ? "Confirm personal paid mark" : marked ? "Undo personal paid mark" : "Mark personally paid"} for ${name}">${review ? "Confirm personal mark" : marked ? "Undo mark" : "Mark personally paid"}</button>
  </div>`;
}

function updateCalendar(container, tenant, selected, month) {
  const host = container.querySelector("[data-calendar-host]");
  const restoreDayFocus = host?.contains(document.activeElement);
  if (host) {
    render(host, calendarMarkup(tenant.bills ?? [], selected, month,tenant));
    if (restoreDayFocus) host.querySelector(`[data-calendar-date="${selected}"]`)?.focus({ preventScroll:true });
  }
}

function calendarMarkup(bills, selectedDate, monthDate, tenant) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const label = first.toLocaleDateString("en-PH", { month:"long", year:"numeric" });
  const byDate = new Map();
  for (const bill of calendarEntries(bills,tenant,year,month)) {
    const key = String(bill.dueDate ?? "").slice(0,10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
    byDate.set(key, [...(byDate.get(key) ?? []), bill]);
  }
  const cells = [];
  for (let i=0; i<offset; i++) cells.push(html`<span class="tenant-calendar__day is-empty" aria-hidden="true"></span>`);
  for (let day=1; day<=days; day++) {
    const key = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const due = byDate.has(key);
    const current = key === toDateKey(new Date());
    const classes = ["tenant-calendar__day",due?"has-bills":"",key===selectedDate?"is-selected":"",current?"is-today":""].filter(Boolean).join(" ");
    const events = byDate.get(key) ?? [];
    const categories = [...new Set(events.flatMap(bill=>bill.lines.map(line=>line.category)))];
    const estimated = events.some(bill=>bill.estimated);
    cells.push(html`<button type="button" class="${classes}${estimated ? " has-estimate" : ""}" data-calendar-date="${key}" aria-pressed="${String(key===selectedDate)}" aria-label="${label} ${day}${due?`, ${categories.map(category=>lineName({category})).join(", ")}${estimated ? ", estimated rent schedule" : ", bills due"}`:""}"><span>${day}</span>${due?html`<span class="tenant-calendar__markers" aria-hidden="true">${categories.map(category=>html`<span class="calendar-category calendar-category--${category}">${icon(category === "rent" ? "home" : category === "electricity" ? "zap" : "droplet",{size:10})}</span>`)}</span>`:null}</button>`);
  }
  const selected = byDate.get(selectedDate) ?? [];
  const selectedLabel = new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-PH",{month:"long",day:"numeric"});
  return html`<p class="tenant-calendar__month">${label}</p><div class="tenant-calendar__grid" role="group" aria-label="${label}">${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day)=>html`<span class="tenant-calendar__weekday">${day}</span>`)}${cells}</div><div class="tenant-calendar__legend">${["rent","electricity","water"].map(category=>html`<span class="calendar-category calendar-category--${category}">${icon(category === "rent" ? "home" : category === "electricity" ? "zap" : "droplet",{size:14})}${lineName({category})}</span>`)}</div><details class="tenant-calendar__info"><summary>About these dates</summary><p class="tenant-calendar__help">Dashed dates show estimated rent, not a bill. The outlined date is today. Utility dates appear only when actual bills are received and validated.</p></details><div class="tenant-calendar__selected"><p class="tenant-calendar__selected-title">${selectedLabel}</p>${selected.length?selected.map((bill)=>html`<div class="tenant-calendar__event"><span>${[...new Set(bill.lines.map(line=>line.category))].map(category=>html`<span class="calendar-category calendar-category--${category}">${icon(category === "rent" ? "home" : category === "electricity" ? "zap" : "droplet",{size:15})}${lineName({category})}</span>`)} · ${bill.utilityProvider ? html`<small class="tenant-calendar__provider">${providerLabel(bill.utilityProvider)}</small> · ` : null}${bill.estimated ? "Estimated rent schedule" : billStatus(bill)}</span>${bill.estimated ? html`<small>Amount available when the bill is generated.</small>` : html`<strong>${peso(bill.totalDue)}</strong>`}</div>`):html`<p class="text-sm text-muted">No bill due on this date.</p>`}<a class="text-link" href="#/tenant/bills">View bills ${icon("arrow-right",{size:14})}</a></div>`;
}

function providerLabel(value) { return ({meralco:"Meralco", "manila water":"Manila Water", maynilad:"Maynilad"})[String(value).toLowerCase()] ?? value; }

function isRent(bill) { return (bill.lines ?? []).length > 0 && bill.lines.every((line) => line.category === "rent"); }
function lineName(line) { return line.category === "electricity" ? "Electricity" : line.category === "water" ? "Water" : "Rent"; }
function billStatus(bill) { return isRent(bill) ? bill.paymentStatus === "paid" ? "Paid" : bill.paymentStatus === "tenant_reported_paid" ? "Awaiting confirmation" : "Unpaid" : bill.utilityTrackingStatus === "self_reported_paid" ? "Self-Reported Paid" : "Not Marked Paid"; }
function toDateKey(value) { if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0,10); const d=value instanceof Date?value:new Date(value); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }

export default renderTenantHome;
