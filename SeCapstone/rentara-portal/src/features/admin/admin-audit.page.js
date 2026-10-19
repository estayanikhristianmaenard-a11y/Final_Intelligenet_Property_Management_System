import { html, render } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { badge } from "../../components/badge.js";
import { dataTable } from "../../components/data-table.js";
import { emptyState, skeletonRows } from "../../components/empty-state.js";
import { api } from "../../api/client.js";
import { endpoints } from "../../api/endpoints.js";
import { relative, dateTime } from "../../utils/format.js";
import { toastDanger } from "../../components/toast.js";
import { ROLE_LABEL } from "../../config/constants.js";

/** Admin Audit Log — read-only, system-maintenance scope. */
export async function renderAdminAudit(container, {query = new URLSearchParams()} = {}) {
  let state = {page:Math.max(1,Number(query.get("page")) || 1), action:query.get("action") || "", from:query.get("from") || "", to:query.get("to") || ""};
  const filters = () => html`<form class="audit-filters" data-audit-filters>
    <label>Action<input class="input" name="action" type="search" maxlength="120" value="${state.action}" placeholder="Search actions" /></label>
    <label>From (PH)<input class="input" name="from" type="date" value="${state.from}" /></label>
    <label>To (PH)<input class="input" name="to" type="date" value="${state.to}" /></label>
    <button class="btn btn--primary" type="submit">Apply filters</button><button class="btn btn--secondary" type="button" data-audit-reset>Reset filters</button>
  </form>`;
  const load = async (next, focus = "") => {
    state = next;
    const position = {left:window.scrollX,top:window.scrollY,behavior:"instant"};
    container.querySelectorAll("button,input").forEach(control => {control.disabled=true;});
    container.setAttribute("aria-busy","true");
    try {
      const result = await api.get(endpoints.adminAuditPage(state));
      if (!container.isConnected) return;
      state={...state,page:result.page};
      render(container,frame(html`${filters()}${table(result.items,result)}`));
      const params = new URLSearchParams(Object.entries(state).filter(([key,value])=>value !== "" && !(key === "page" && value === 1)));
      history.replaceState(null,"",`#/admin/audit${params.size ? `?${params}` : ""}`);
      bind();
      window.scrollTo(position);
      if (focus) container.querySelector(focus)?.focus({preventScroll:true});
    } catch (error) {
      if (!container.isConnected) return;
      toastDanger("Could not load logs",error.message);
      if (!container.querySelector("[data-audit-filters]")) {
        render(container,frame(html`${filters()}${emptyState({iconName:"alert-triangle",title:"Audit log could not be loaded",body:error.message})}`));
        bind();
      }
    } finally {
      container.removeAttribute("aria-busy");
      container.querySelectorAll("button,input").forEach(control=>{control.disabled=false;});
      // Paging buttons retain the boundary state computed from the response.
      container.querySelectorAll("[data-audit-page]").forEach(control=>{control.disabled=control.dataset.boundary === "true";});
    }
  };
  const bind = () => {
    container.querySelector("[data-audit-filters]").addEventListener("submit",event=>{
      event.preventDefault();
      if (!event.target.reportValidity()) return;
      load({...Object.fromEntries(new FormData(event.target)),page:1},'[name="action"]');
    });
    container.querySelector("[data-audit-reset]").addEventListener("click",()=>load({page:1,action:"",from:"",to:""},'[name="action"]'));
    container.querySelectorAll("[data-audit-page]").forEach(button=>button.addEventListener("click",()=>load({...state,page:Number(button.dataset.auditPage)},`[data-audit-page="${Number(button.dataset.auditPage)+1}"]`)));
  };
  render(container,frame(html`<div class="card"><div class="card__body">${skeletonRows(7)}</div></div>`));
  await load(state);
}

function frame(content) {
  return html`<section class="page" aria-labelledby="page-title">
    <div class="page-header">
      <div class="page-header__title">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <span>Rentara</span>${icon("chevron-right", { size: 12 })}
          <span>Admin</span>${icon("chevron-right", { size: 12 })}
          <span>Audit Log</span>
        </nav>
        <h1 id="page-title">Audit Log</h1>
        <p>Recorded account, role and maintenance activity.</p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--secondary" type="button">
          ${icon("download", { size: 15 })} Export
        </button>
      </div>
    </div>
    ${content}
  </section>`;
}

function table(entries, {total,limit,page}) {
  const pagination=html`<div class="audit-pagination" aria-label="Audit log pages"><button class="btn btn--secondary btn--sm" type="button" data-audit-page="${page-1}" data-boundary="${String(page<=1)}" ${page<=1 ? "disabled" : ""}>Previous</button>
      <span>Page ${page}</span><button class="btn btn--secondary btn--sm" type="button" data-audit-page="${page+1}" data-boundary="${String(page*limit>=total)}" ${page*limit>=total ? "disabled" : ""}>Next</button></div>`;
  return dataTable({
    ariaLabel: "Audit log",
    rows: entries,
    emptyTitle: "No audit entries",
    emptyIcon: "shield",
    toolbar: html`<span class="chip chip--accent"
        >${icon("shield", { size: 12 })} Read-only</span
      >
      <span class="text-xs text-muted">${total} entries</span>${pagination}`,
    columns: [
      {
        key: "action",
        label: "Action",
        render: (row) =>
          html`<span class="cell-stack">
            <strong>${row.action}</strong>
            <span>${row.target}</span>
          </span>`,
      },
      {
        key: "actor",
        label: "Actor",
        render: (row) =>
          html`<span class="cell-stack">
            <strong>${row.actor}</strong>
            <span>${ROLE_LABEL[row.role] ?? row.role}</span>
          </span>`,
      },
      {
        key: "at",
        label: "When",
        width: "190px",
        render: (row) =>
          html`<span class="time-cell" title="${dateTime(row.at)}"
            ><strong>${relative(row.at)}</strong>${dateTime(row.at)}</span
          >`,
      },
      {
        key: "id",
        label: "Entry",
        width: "120px",
        render: (row) => html`<span class="chip font-mono">${row.id}</span>`,
      },
    ],
    footer: html`<span role="status">Showing ${total ? (page-1)*limit+1 : 0}–${Math.min(page*limit,total)} of ${total}</span>`,
  });
}

export { badge };
export default renderAdminAudit;
