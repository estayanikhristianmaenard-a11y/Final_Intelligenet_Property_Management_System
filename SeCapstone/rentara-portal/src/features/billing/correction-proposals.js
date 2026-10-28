import { html, render } from "../../utils/dom.js";
import { api } from "../../api/client.js";
import { peso } from "../../utils/format.js";
import session from "../../auth/session.js";
import { dialogForm, download } from "../../app/workflows.js";
import { toastDanger, toastSuccess, toastWarning } from "../../components/toast.js";
import { sourcePreview } from "../../components/source-preview.js";

export function displayValue(key, value) {
  if (value == null || value === "") return "Missing";
  return key === "amountDue" && Number.isFinite(Number(value)) ? peso(Number(value)) : value;
}
export const fields = [
  { key: "provider", label: "Provider" }, { key: "accountRef", label: "Account / reference" },
  { key: "amountDue", label: "Amount due", type: "number" },
  { key: "dueDate", label: "Due date", type: "date" },
  { key: "periodStart", label: "Billing period start", type: "date" },
  { key: "periodEnd", label: "Billing period end", type: "date" },
];
export function proposalChanges(source, data) {
  const changes = {};
  for (const f of fields) if (String(data[f.key] ?? "") !== String(source[f.key] ?? "")) changes[f.key] = data[f.key];
  if (!Object.keys(changes).length) throw new Error("Change at least one extracted value.");
  return changes;
}
export async function proposeCorrection(id, onSaved) {
  const source = await api.get(`/incoming/${encodeURIComponent(id)}`);
  if (source.ocrStatus === "validated") {
    await download(`/incoming/${encodeURIComponent(id)}/source`, source.filename);
    return;
  }
  const preview = sourcePreview(source);
  return dialogForm({ title: "Propose bill correction", subtitle: source.filename,
    className: "modal--source-review",
    label: "Submit for Manager review", values: source,
    beforeFields: preview.markup,
    fields: [...fields, { key: "reason", label: "Reason and source evidence", type: "textarea", required: true }],
    onReady(modal, form) {
      const heading = document.createElement("div");
      render(heading, html`<h4>Proposed correction</h4><p class="text-sm text-secondary">Compare each value with the original. Your changes stay pending until a Manager authorizes them.</p>`);
      form.prepend(heading);
      preview.mount(modal);
    },
    onClose: () => preview.dispose(),
    save(data) {
      const changes = proposalChanges(source, data);
      return api.post(`/incoming/${encodeURIComponent(id)}/proposals`, { changes, reason: data.reason });
    }, onSaved, successTitle: "Proposal submitted", successMessage: "Live values are unchanged. A Manager will review this proposal." });
}
export function proposalList(proposals, { queue = "all", sourceIds = null, showSource = true } = {}) {
  if (sourceIds) {
    const included = new Set(sourceIds);
    proposals = proposals.filter(p => included.has(p.sourceId));
  }
  if (queue === "returned") {
    const latest = new Map();
    for (const p of [...proposals].sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt)))) {
      if (!latest.has(p.sourceId)) latest.set(p.sourceId,p);
    }
    const pending = new Set(proposals.filter(p => p.state === "pending").map(p => p.sourceId));
    proposals = [...latest.values()].filter(p => !pending.has(p.sourceId));
  }
  proposals = proposals.filter(p => queue === "all" || (queue === "manager" ? p.state === "pending" : queue === "returned" ? ["returned", "rejected", "stale"].includes(p.state) : queue === "resolved" ? p.state === "applied" : false));
  proposals = [...proposals].sort((a, b) => Number(b.state === "pending") - Number(a.state === "pending") || String(b.createdAt).localeCompare(String(a.createdAt)));
  return html`<section class="card proposal-panel" aria-label="Correction proposals">
    <div class="card__header"><div><h2 class="card__title">Correction proposals</h2><p class="card__subtitle">Review source evidence before changing billing values.</p></div><span class="chip">${proposals.filter(p => p.state === "pending").length} pending</span></div>
    <div class="card__body">${proposals.length ? proposals.map(p => html`<article class="proposal-record">
      <div class="row row-2"><strong>${p.filename}</strong><span class="chip">${({pending:"With Manager",applied:"Applied",returned:"Returned",rejected:"Rejected",stale:"Needs recheck"})[p.state] ?? p.state}</span></div>
      <p class="text-sm">Prepared by ${p.preparerName} · ${new Date(p.createdAt).toLocaleString("en-PH")}</p>
      <dl class="proposal-diff">${Object.entries(p.changes).map(([key, value]) => html`<div><dt>${fields.find(f => f.key === key)?.label ?? key}</dt><dd><span class="text-muted">${displayValue(key, p.previousValues[key])}</span> → <strong>${displayValue(key, value)}</strong></dd></div>`)}</dl>
      <p>${p.reason}</p>${p.decisionReason ? html`<p class="notice-strip">${p.managerName ?? "Manager"}: ${p.decisionReason}</p>` : null}
      <div class="row row-2">${showSource ? html`<button class="btn btn--secondary btn--sm" type="button" data-proposal-source="${p.sourceId}">View original bill</button>` : null}
      ${session.role === "manager" && p.state === "pending" ? html`<button class="btn btn--primary btn--sm" data-proposal-approve="${p.id}">Authorize correction</button><button class="btn btn--secondary btn--sm" data-proposal-reject="${p.id}">Reject proposal</button>` : null}</div>
    </article>`) : html`<p class="text-muted">No proposals in this queue. Use All cases to see proposal history.</p>`}</div>
  </section>`;
}
export function bindProposals(container, onChanged) {
  container.querySelectorAll("[data-propose-source]").forEach(button => button.onclick = () => proposeCorrection(button.dataset.proposeSource, onChanged).catch(e => toastDanger("Could not open proposal", e.message)));
  container.querySelectorAll("[data-proposal-source]").forEach(button => button.onclick = () => download(`/incoming/${encodeURIComponent(button.dataset.proposalSource)}/source`, "bill-source.pdf").catch(e => toastDanger("Source unavailable", e.message)));
  container.querySelectorAll("[data-proposal-approve]").forEach(button => button.onclick = async () => {
    if (!window.confirm("Authorize these corrections? The system will revalidate before applying them.")) return;
    button.disabled = true;
    try {
      const result = await api.post(`/correction-proposals/${encodeURIComponent(button.dataset.proposalApprove)}/decision`, { decision: "approve" });
      if (result.proposal.state === "applied") toastSuccess("Correction applied", "Revalidation passed and history was preserved.");
      else toastWarning("Correction not applied", result.proposal.decisionReason);
      await onChanged?.();
    } catch (e) { toastDanger("Could not authorize", e.message); } finally { button.disabled = false; }
  });
  container.querySelectorAll("[data-proposal-reject]").forEach(button => button.onclick = () => dialogForm({
    title: "Reject proposal", fields: [{ key: "reason", label: "Reason", type: "textarea", required: true }],
    save: data => api.post(`/correction-proposals/${encodeURIComponent(button.dataset.proposalReject)}/decision`, { decision: "reject", reason: data.reason }),
    onSaved: onChanged, successTitle: "Proposal rejected", successMessage: "The reason was saved; live values remain unchanged." }));
  container.querySelectorAll("[data-exception-note]").forEach(button => button.onclick = () => dialogForm({
    title: "Investigation note", fields: [{ key: "note", label: "Findings and requested action", type: "textarea", required: true },
      { key: "escalate", label: "Responsibility", type: "select", options: [{ value: "no", label: "Keep current responsibility" }, { value: "yes", label: "Escalate to Manager" }] }],
    save: data => api.post(`/exceptions/${encodeURIComponent(button.dataset.exceptionNote)}/notes`, { note: data.note, escalate: data.escalate === "yes" }),
    onSaved: onChanged, successTitle: "Note recorded", successMessage: "Investigation history was preserved." }));
}
