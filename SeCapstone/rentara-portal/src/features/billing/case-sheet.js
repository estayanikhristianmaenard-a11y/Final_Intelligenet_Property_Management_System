import { html, render } from "../../utils/dom.js";
import { api } from "../../api/client.js";
import session from "../../auth/session.js";
import { intakeResult, staffQueues } from "./work-queue.js";
import { fields, displayValue, proposalChanges, proposalList, bindProposals } from "./correction-proposals.js";
import { exceptionQueue, bindExceptionQueue } from "./exception-queue.js";
import { sourcePreview } from "../../components/source-preview.js";
import { emptyState } from "../../components/empty-state.js";
import { watchForm } from "../../app/form-state.js";
import { beginAction } from "../../components/action-feedback.js";
import { toastSuccess, toastWarning } from "../../components/toast.js";

const proposalLabels = {pending:"With Manager",applied:"Applied",rejected:"Rejected",returned:"Returned",stale:"Needs recheck"};
const resultLabels = {processed:"Processed",duplicate:"Duplicate",review:"Needs review",processing:"Processing"};
const missing = value => value == null || value === "";

/** One shared operational view. Source outcomes and proposal decisions stay separate. */
export function mountCaseSheet(host, { data, queue, canReview, onRefresh }) {
  const groups = new Map();
  const allowed = staffQueues(data.exceptions, data.proposals)[queue] ?? data.exceptions;
  for (const e of allowed) {
    const key = e.sourceId || e.billId || e.id;
    if (!groups.has(key)) groups.set(key, {key,records:[]});
    groups.get(key).records.push(e);
  }
  const cases = [...groups.values()];
  const proposals = sourceId => data.proposals.filter(p => p.sourceId === sourceId).sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  cases.sort((a,b) => Number(proposals(b.key).some(p=>p.state==="pending")) - Number(proposals(a.key).some(p=>p.state==="pending")));
  const count = host.closest("[data-tab-panel]").querySelector("[data-queue-count]");
  if (count) count.textContent = `${cases.length} cases in this queue`;
  let current = new URLSearchParams(location.hash.split("?")[1]).get("case");
  let guard, preview, busy = false, disposed = false;
  const reset = () => { guard?.dispose(); guard=null; preview?.dispose(); preview=null; };
  const canLeave = () => {
    if (busy) { toastWarning("Action in progress", "Wait for the current action to finish."); return false; }
    return !guard?.isDirty() || window.confirm("Discard your unsaved correction?");
  };
  const select = (key, focus=false) => {
    reset();
    current = cases.find(c=>c.key===key)?.key ?? cases[0]?.key;
    if (!current) {
      render(host, emptyState({iconName:"check-circle",title:"No cases in this queue",body:"Valid bills continue automatically. Choose another queue to review other cases.",action:html`<a class="btn btn--secondary" href="#/bills?tab=exceptions">View all cases</a>`}));
      return;
    }
    const params = new URLSearchParams(location.hash.split("?")[1]); params.set("case",current);
    history.replaceState(null,"",`#/bills?${params}`);
    render(host, html`<div class="case-workspace"><nav class="case-queue" aria-label="Bill cases">${cases.map(c=>{
      const source=data.incoming.find(s=>s.id===c.key), latest=proposals(c.key)[0];
      return html`<button type="button" class="case-queue__item" data-exception-id="${c.records[0].id}" data-case-select="${c.key}" aria-current="${c.key===current ? "true" : "false"}"><strong>${c.records[0].title}</strong><span>${latest?.state==="pending" ? "Proposal: With Manager" : c.records[0].reason}</span>${source && missing(source.dueDate) ? html`<small>Date needs review</small>` : null}</button>`;
    })}</nav><section class="case-sheet" data-case-sheet aria-label="Selected case"></section></div>`);
    host.querySelectorAll("[data-case-select]").forEach(button=>button.addEventListener("click",()=>{
      if (button.dataset.caseSelect===current || !canLeave()) return;
      const top=window.scrollY;select(button.dataset.caseSelect,true);window.scrollTo({top,behavior:"instant"});
    }));
    const selected=cases.find(c=>c.key===current),source=data.incoming.find(s=>s.id===current);
    const sheet=host.querySelector("[data-case-sheet]");
    if (!source) {
      render(sheet,html`<h2 class="case-sheet__title">${selected.records[0].title}</h2>${exceptionQueue(selected.records,{canReview})}`);
      bindExceptionQueue(sheet,{canReview,onChanged:onRefresh});bindProposals(sheet,onRefresh);
    } else {
      const history=proposals(source.id),latest=history[0],pending=history.find(p=>p.state==="pending");
      const finalized=source.ocrStatus==="validated" || data.bills.some(b=>b.sourceId===source.id);
      const open=selected.records.find(e=>e.state==="open");
      const result=resultLabels[intakeResult(source)];
      const nextStep = finalized ? "This source has been processed. Review its recorded history below." : pending ? (canReview ? "Compare the proposal with the original bill, then authorize or reject it." : "Your proposal is with Manager. You can still view the original and add findings.") : canReview ? "Check the original bill. Correct a readable value directly, or resolve the setup issue shown above." : "Check the original bill. Prepare a correction from readable evidence, or add findings for Manager.";
      render(sheet,html`<header class="case-sheet__header"><div><p class="case-sheet__eyebrow">Utility bill · ${source.filename}</p><h2 class="case-sheet__title">${source.provider || "Provider not extracted"}</h2><p>${source.accountRef || "Account not extracted"}</p></div>${!missing(source.amountDue) ? html`<strong class="case-sheet__amount">${displayValue("amountDue",source.amountDue)}</strong>` : null}</header>
        <div class="case-sheet__status" role="status"><strong>${result}</strong><span>${selected.records.filter(e=>e.state==="open").map(e=>e.reason).join(" · ") || "Recorded case history"}</span>${latest ? html`<span>Proposal: ${proposalLabels[latest.state]}</span>` : null}</div>
        <p class="case-next-step"><strong>Next step</strong> ${nextStep}</p>
        <details class="case-extracted" ${pending || finalized ? "" : "open"}><summary>What the system extracted</summary><dl class="case-fields">${fields.map(f=>html`<div class="${missing(source[f.key]) ? "is-missing" : ""}"><dt>${f.label}</dt><dd>${missing(source[f.key]) ? "Not extracted" : displayValue(f.key,source[f.key])}</dd><small>${missing(source[f.key]) ? "Needs review" : "Extracted"}</small></div>`)}</dl></details>
        <div class="case-comparison" data-case-comparison><details class="case-original" data-case-original><summary>Open original bill</summary><div data-case-preview></div></details><div data-case-editor></div></div>
        ${latest ? html`<div class="case-proposal">${proposalList([latest],{showSource:false})}</div>` : null}
        ${session.role==="staff" && !finalized && !pending ? html`<button type="button" class="btn btn--primary" data-case-prepare>Prepare correction</button>` : null}
        ${canReview && !finalized ? html`<button type="button" class="btn btn--ghost case-direct" data-case-direct>Correct directly instead</button>` : null}
        ${open ? html`<button type="button" class="btn btn--secondary" data-exception-note="${open.id}">Add findings or escalate</button>` : null}
        ${pending && session.role==="staff" ? html`<p class="case-sheet__help">Live billing stays unchanged until authorization and revalidation.</p>` : null}
        ${history.length>1 ? html`<details class="case-history"><summary>Previous proposals (${history.length-1})</summary>${proposalList(history.slice(1))}</details>` : null}
        ${selected.records.some(e=>e.notes?.length) ? html`<details class="case-history"><summary>Investigation history</summary>${selected.records.flatMap(e=>e.notes??[]).map(n=>html`<p><strong>${n.actor}</strong> · ${n.text}</p>`)}</details>` : null}`);
      const original=sheet.querySelector("[data-case-original]");
      original.addEventListener("toggle",()=>{
        if (!original.open || preview) return;
        preview=sourcePreview(source);render(sheet.querySelector("[data-case-preview]"),preview.markup);preview.mount(original);
      });
      bindProposals(sheet,onRefresh);
      sheet.addEventListener("click",event=>{
        if (event.target.closest("[data-exception-note],[data-proposal-approve],[data-proposal-reject]") && !canLeave()) {
          event.preventDefault();event.stopImmediatePropagation();
        }
      },true);
      sheet.querySelector("[data-case-prepare]")?.addEventListener("click",()=>edit(source,false));
      sheet.querySelector("[data-case-direct]")?.addEventListener("click",()=>edit(source,true));
      function edit(src,direct) {
        if (!canLeave()) return;
        guard?.dispose();
        original.open=true;
        sheet.querySelector("[data-case-comparison]").classList.add("is-editing");
        sheet.querySelectorAll("[data-case-prepare],[data-case-direct]").forEach(b=>b.hidden=true);
        const editor=sheet.querySelector("[data-case-editor]");
        const previous = !direct && latest && latest.state!=="pending" ? latest.changes : {};
        const values={...src,...previous};
        const directField = fields.find(f=>missing(src[f.key]))?.key ?? fields[0].key;
        const input=(f,value)=>html`<label class="field__label">${f.label}<input class="input" name="${f.key}" type="${f.type||"text"}" ${f.type==="number" ? html`inputmode="decimal"` : null} value="${value??""}" ${f.type==="number" ? html`min="0" step="0.01"` : null} aria-describedby="case-error-${f.key}"></label><span id="case-error-${f.key}" class="workflow-field-error" data-case-field-error="${f.key}" hidden></span>`;
        render(editor,html`<form class="case-edit" data-case-form novalidate><h3>${direct ? "Direct correction" : "Prepare a correction"}</h3><p>Check the original. ${direct ? "Every saved correction is revalidated." : "Live billing changes only after Manager authorization and revalidation."}</p><div class="notice-strip notice-strip--danger" role="alert" data-case-error hidden></div><fieldset class="case-edit__fields">${direct ? html`<label class="field__label">Field<select class="input" name="field">${fields.map(f=>html`<option value="${f.key}" ${f.key===directField ? "selected" : ""}>${f.label}</option>`)}</select></label>${input({key:"value",label:"Corrected value"},"")}` : fields.map(f=>html`<div class="field">${input(f,values[f.key])}</div>`)}<div class="field case-edit__reason"><label class="field__label">Reason and source evidence<textarea class="textarea" name="reason" required minlength="3" maxlength="1000" aria-describedby="case-error-reason">${direct ? "" : latest?.reason??""}</textarea></label><span id="case-error-reason" class="workflow-field-error" data-case-field-error="reason" hidden></span></div></fieldset><div class="case-edit__actions"><button type="submit" class="btn btn--primary" data-case-save>${direct ? "Save correction" : "Submit for Manager review"}</button><button type="button" class="btn btn--secondary" data-case-cancel>Cancel correction</button><button type="button" class="btn btn--secondary" data-case-reload hidden>Reload saved case</button></div></form>`);
        const form=editor.querySelector("form"),button=form.querySelector("[data-case-save]"),errorBox=form.querySelector("[data-case-error]");
        if (direct) {
          const sync=()=>{const f=fields.find(f=>f.key===form.elements.field.value);form.elements.value.type=f?.type??"text";form.elements.value.inputMode=f?.type==="number"?"decimal":"";form.elements.value.step=f?.type==="number"?"0.01":"";form.elements.value.value=src[form.elements.field.value]??"";};sync();form.elements.field.addEventListener("change",sync);form.elements.value.required=true;
        }
        guard=watchForm(form);
        form.querySelector("[data-case-cancel]").onclick=()=>{if(canLeave()){guard.dispose();guard=null;editor.replaceChildren();sheet.querySelector("[data-case-comparison]").classList.remove("is-editing");sheet.querySelectorAll("[data-case-prepare],[data-case-direct]").forEach(b=>b.hidden=false);}};
        form.querySelector("[data-case-reload]").onclick=()=>onRefresh();
        form.addEventListener("input",()=>{form.elements.reason.setCustomValidity("");});
        form.addEventListener("submit",async event=>{
          event.preventDefault();if(busy || form.dataset.saved) return;
          form.elements.reason.setCustomValidity(form.elements.reason.value.trim().length<3 ? "Explain the correction using at least 3 characters." : "");
          let first;
          for(const input of form.elements){if(!input.willValidate)continue;const invalid=!input.validity.valid;input.setAttribute("aria-invalid",String(invalid));const hint=form.querySelector(`[data-case-field-error="${input.name}"]`);if(hint){hint.textContent=invalid?input.validationMessage:"";hint.hidden=!invalid;}if(invalid)first??=input;}
          if(first){first.focus();return;}
          errorBox.hidden=true;
          const body=Object.fromEntries(new FormData(form));let payload;
          try{payload=direct ? body : {changes:proposalChanges(src,body),reason:body.reason};}catch(e){errorBox.textContent=e.message;errorBox.hidden=false;return;}
          busy=true;const finish=beginAction(button,direct?"Saving and rechecking…":"Submitting…");form.setAttribute("aria-busy","true");form.querySelector("fieldset").disabled=true;
          let saved=false;
          try{
            const result=await api.post(direct?`/incoming/${encodeURIComponent(src.id)}/correct`:`/incoming/${encodeURIComponent(src.id)}/proposals`,payload);
            saved=true;form.dataset.saved="true";guard?.dispose();guard=null;
            if(direct && result.failures?.length)toastWarning("Review still required","The saved correction did not resolve every validation issue.");
            else toastSuccess(direct?"Correction saved":"Proposal submitted",direct?"Revalidation completed.":"With Manager. Live billing has not changed.");
            await onRefresh();
          }catch(error){
            if(!disposed){errorBox.textContent=saved ? "Saved, but the case could not be refreshed. Reload the saved case; do not submit again." : `${error.message} Your entries remain here. If the connection failed, check With Manager before submitting again.`;errorBox.hidden=false;}
          }finally{
            busy=false;finish();form.removeAttribute("aria-busy");form.querySelector("fieldset").disabled=false;
            if(saved){button.disabled=true;form.querySelector("[data-case-reload]").hidden=false;}
          }
        });
        (form.querySelector('[name="dueDate"]')??form.querySelector("input"))?.focus({preventScroll:true});
      }
    }
    if(focus)host.querySelector('[aria-current="true"]')?.focus({preventScroll:true});
  };
  const dispose=()=>{if(disposed)return;disposed=true;reset();observer.disconnect();};
  const observer=new MutationObserver(()=>{if(!host.isConnected)dispose();});
  observer.observe(document.getElementById("app-root"),{childList:true,subtree:true});
  select(current);
  return {dispose,canLeave};
}
