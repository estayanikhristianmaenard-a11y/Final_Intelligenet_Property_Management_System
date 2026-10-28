import { html, render } from "../../utils/dom.js";
import { api } from "../../api/client.js";
import { staffQueues } from "../billing/work-queue.js";
import { emptyState, skeletonRows } from "../../components/empty-state.js";
export async function renderStaffDashboard(container) {
  render(container, html`<section class="page"><div class="page-header"><h1 id="page-title">Daily operations</h1></div><div class="card" aria-label="Loading your work"><div class="card__body">${skeletonRows(3)}</div></div></section>`);
  try {
  const [exceptions, proposals] = await Promise.all([api.get("/exceptions"), api.get("/correction-proposals")]);
  const queues = staffQueues(exceptions, proposals);
  const tasks = [...queues.returned, ...queues.staff];
  render(container, html`<section class="page"><div class="page-header"><div class="page-header__title"><h1 id="page-title">Daily operations</h1><p>Investigate flagged bills and prepare corrections. Valid bills continue automatically.</p></div><a class="btn btn--primary" href="#/bills?tab=incoming">Open bill intake</a></div>
    <nav class="staff-task-summary" aria-label="Work queues">${[["staff","Needs action"],["manager","With Manager"],["returned","Returned"]].map(([key,label]) => html`<a class="card card__body" href="#/bills?tab=exceptions&queue=${key}"><span>${label}</span><strong>${queues[key].length}</strong><small>${key === "manager" ? "Waiting for a decision" : key === "returned" ? "Read the reason and prepare a revision" : "Investigate or add findings"}</small></a>`)}</nav>
    <section class="card staff-work-list"><div class="card__header"><h2 class="card__title">Your next actions</h2></div><div class="card__body">${tasks.length ? tasks.slice(0,8).map(e => html`<a class="staff-task-link" href="#/bills?tab=exceptions&queue=${queues.returned.includes(e) ? "returned" : "staff"}"><strong>${e.title}</strong><span>${e.reason}</span><span class="staff-task-link__action">${queues.returned.includes(e) ? "Revise case" : "Investigate"} ›</span></a>`) : html`<p>No cases waiting with Staff. Open With Manager to follow submitted work.</p>`}</div></section>
  </section>`);
  } catch (error) {
    render(container, html`<section class="page"><div class="page-header"><h1 id="page-title">Daily operations</h1></div>${emptyState({iconName:"alert-triangle",title:"Your work could not be loaded",body:error.message,action:html`<button type="button" class="btn btn--secondary" data-retry-staff>Try again</button>`})}</section>`);
    container.querySelector("[data-retry-staff]")?.addEventListener("click", () => renderStaffDashboard(container));
  }
}
