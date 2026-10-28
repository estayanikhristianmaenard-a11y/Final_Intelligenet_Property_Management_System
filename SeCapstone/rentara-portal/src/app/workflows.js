import { html, render } from "../utils/dom.js";
import { openModal } from "../components/modal.js";
import {
  toastSuccess,
  toastDanger,
  toastWarning,
} from "../components/toast.js";
import { api } from "../api/client.js";
import { apiConfig } from "../config/api.js";
import session from "../auth/session.js";
import { billDetails } from "../features/billing/bill-details.js";
import { peso, date, periodLabel } from "../utils/format.js";
import { watchForm } from "./form-state.js";
import { beginAction } from "../components/action-feedback.js";
import { sourcePreview } from "../components/source-preview.js";
let controller;
export function dialogForm({
  title,
  subtitle = "",
  fields,
  values = {},
  save,
  label = "Save",
  onSaved,
  beforeFields = null,
  className = "",
  onReady,
  onClose,
  successTitle = "Saved",
  successMessage = "Your change was saved.",
  snapshot,
}) {
  let guard;
  const control = (f) => {
    const value = values[f.key] ?? f.value ?? "";
    if (f.type === "select")
      return html`<select
        class="input select"
        name="${f.key}"
        aria-describedby="workflow-error-${f.key}"
        ${f.required ? "required" : ""}
      >
        ${f.options.map((o) => html`<option value="${o.value ?? o}" ${String(value) === String(o.value ?? o) ? "selected" : ""}>${o.label ?? o}</option>`)}
      </select>`;
    if (f.type === "textarea")
      return html`<textarea
        class="textarea"
        name="${f.key}"
        aria-describedby="workflow-error-${f.key}"
        ${f.required ? "required" : ""}
      >
${value}</textarea>`;
    return html`<input
      class="input"
      name="${f.key}"
      aria-describedby="workflow-error-${f.key}"
      type="${f.type ?? "text"}"
      value="${value}"
      ${f.required ? "required" : ""}
      ${f.type === "number" ? html`min="0" step="0.01"` : null}
    />`;
  };
  return openModal({
    className,
    onClose() { guard?.dispose(); onClose?.(); },
    canDismiss: () => guard?.root.getAttribute("aria-busy") !== "true" && (!guard?.isDirty() || window.confirm("Discard your unsaved changes?")),
    title,
    subtitle,
    body: html`<div class="${className === "modal--source-review" ? "source-review" : "workflow-form-wrap"}">${beforeFields}<form data-workflow-form>
      <div class="workflow-form-error" data-workflow-error role="alert" hidden></div>
      ${fields.map((f) => html`<div class="field"><label class="field__label">${f.label}${control(f)}</label>${f.hint ? html`<span class="field__hint">${f.hint}</span>` : null}<span class="workflow-field-error" id="workflow-error-${f.key}" data-workflow-field-error="${f.key}" hidden></span></div>`)}
    </form></div>`,
    footer: html`<button class="btn btn--secondary" data-close>Cancel</button
      ><button class="btn btn--primary" data-workflow-save>${label}</button>`,
    onMount(close) {
      const modal = document.querySelector(".modal"),
        form = modal.querySelector("form"),
        button = modal.querySelector("[data-workflow-save]");
      const submit = async (e) => {
        e?.preventDefault();
        if (button.disabled) return;
        let firstInvalid;
        for (const input of form.elements) {
          if (!input.willValidate) continue;
          const error = form.querySelector(`[data-workflow-field-error="${input.name}"]`);
          const invalid = !input.validity.valid;
          if (error) { error.textContent = invalid ? input.validationMessage : ""; error.hidden = !invalid; }
          if (invalid) { input.setAttribute("aria-invalid","true"); firstInvalid ??= input; }
          else input.removeAttribute("aria-invalid");
        }
        if (firstInvalid) { firstInvalid.focus({preventScroll:true}); return; }
        const saveError = form.querySelector('[data-workflow-error]');
        saveError.hidden = true;
        const finish = beginAction(button);
        form.setAttribute("aria-busy", "true");
        form.inert = true;
        modal.querySelectorAll("[data-close]").forEach(control=>{control.disabled=true;});
        try {
          const data = Object.fromEntries(new FormData(form));
          const result = await save(data);
          close();
          await onSaved?.(result);
          toastSuccess(successTitle, successMessage);
        } catch (error) {
          saveError.textContent = error.message || "Could not save. Please try again.";
          saveError.hidden = false;
          toastDanger("Could not save", error.message);
        } finally {
          finish();
          form.removeAttribute("aria-busy");
          form.inert = false;
          modal.querySelectorAll("[data-close]").forEach(control=>{control.disabled=false;});
        }
      };
      button.addEventListener("click", submit);
      form.addEventListener("submit", submit);
      form.noValidate = true;
      form.addEventListener("input", event => {
        const input = event.target;
        if (!input.name || !input.validity?.valid) return;
        input.removeAttribute("aria-invalid");
        const error = form.querySelector(`[data-workflow-field-error="${input.name}"]`);
        if (error) error.hidden = true;
      });
      onReady?.(modal, form);
      guard = watchForm(form, {read:snapshot ? ()=>snapshot(form) : undefined});
    },
  });
}
export async function download(path, filename, { preview = false } = {}) {
  const response = await fetch(apiConfig.BASE_URL + path, {
    headers: { Authorization: "Bearer " + session.token },
  });
  if (!response.ok) {
    if (response.status === 401) {
      session.clear();
      window.dispatchEvent(new CustomEvent("app:signed-out"));
    }
    throw new Error((await response.json()).message ?? "Download failed");
  }
  const blob = await response.blob(),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  if (preview) {
    a.target = "_blank";
    a.rel = "noopener";
  } else a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/** Fetch through the existing ownership-protected endpoint; never expose tokens in URLs. */
export async function viewReceipt(id) {
  const requestToken = session.token;
  const response = await fetch(apiConfig.BASE_URL + "/receipts/" + encodeURIComponent(id), {
    headers: {Authorization:"Bearer " + requestToken},
  });
  if (session.token !== requestToken) return;
  if (!response.ok) {
    if (response.status === 401) { session.clear(); window.dispatchEvent(new CustomEvent("app:signed-out")); }
    throw new Error((await response.json()).message ?? "Receipt could not be opened");
  }
  const blob = await response.blob();
  if (session.token !== requestToken) return;
  const url = URL.createObjectURL(blob);
  openModal({
    title:"Rent receipt",
    className:"modal--receipt",
    body:html`<iframe class="receipt-document-frame" title="Confirmed rent receipt" src="${url}" sandbox="allow-same-origin allow-modals"></iframe>`,
    footer:html`<button class="btn btn--secondary" type="button" data-close>Close</button><button class="btn btn--secondary" type="button" data-print-receipt disabled>Print</button><a class="btn btn--primary" href="${url}" download="${id}.html">Download</a>`,
    onMount() {
      const modal = document.querySelector(".modal--receipt");
      const frame = modal.querySelector("iframe");
      const print = modal.querySelector("[data-print-receipt]");
      frame.addEventListener("load",()=>{ print.disabled=false; },{once:true});
      print.addEventListener("click",()=>{ frame.contentWindow.focus(); frame.contentWindow.print(); });
    },
    onClose:()=>URL.revokeObjectURL(url),
  });
}
export function reportPayment(bill, onSaved) {
  if (!bill.lines.every(l => l.category === "rent")) throw new Error("Utilities use your personal tracker; provider payment is not verified.");
  return dialogForm({
    title: "Report payment",
    subtitle: `Full outstanding amount: ₱${bill.totalDue.toFixed(2)}`,
    beforeFields: html`<p class="notice-strip notice-strip--info mb-3">Already paid your rent? Submit the payment details below. Your Manager will check them before marking the bill Paid.</p>`,
    fields: [
      {
        key: "method",
        label: "Payment method",
        type: "select",
        options: [
          { value: "cash", label: "Cash" },
          { value: "bank_transfer", label: "Bank transfer" },
          { value: "e_wallet", label: "E-wallet" },
        ],
        required: true,
      },
      {
        key: "reference",
        label: "Reference",
        hint: "Required for bank transfers and e-wallet payments.",
      },
    ],
    save: (data) =>
      api.post(`/bills/${encodeURIComponent(bill.id)}/report-payment`, data),
    onReady(modal, form) {
      const method = form.elements.method;
      const reference = form.elements.reference;
      const updateReference = () => {
        const electronic = method.value !== "cash";
        reference.closest(".field").hidden = !electronic;
        reference.disabled = !electronic;
        reference.required = electronic;
        if (!electronic) {
          reference.value = "";
          reference.removeAttribute("aria-invalid");
          form.querySelector('[data-workflow-field-error="reference"]').hidden = true;
        }
      };
      method.addEventListener("change", updateReference);
      updateReference();
    },
    label: "Submit report",
    successTitle: "Rent payment reported",
    successMessage: "Your Manager will check the payment. Your rent stays pending until confirmed.",
    onSaved,
  });
}
async function entityForm(kind, id, onSaved, defaults = {}) {
  const values = id
    ? await api.get(`/${kind}/${encodeURIComponent(id)}`)
    : defaults;
  let fields;
  if (kind === "properties")
    fields = [
      { key: "name", label: "Property name", required: true },
      { key: "letter", label: "Building letter", required: true },
      { key: "address", label: "Address", required: true },
      { key: "city", label: "City", value: "Pasig City", required: true },
      {
        key: "type",
        label: "Type",
        type: "select",
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "boarding_house", label: "Boarding house" },
        ],
      },
    ];
  if (kind === "units") {
    const properties = await api.get("/properties");
    fields = [
      {
        key: "propertyId",
        label: "Property",
        type: "select",
        options: properties.map((p) => ({ value: p.id, label: p.name })),
        required: true,
      },
      { key: "code", label: "Unit code", required: true },
      { key: "floor", label: "Floor", required: true },
      {
        key: "floorNumber",
        label: "Floor number",
        type: "number",
        value: 1,
        required: true,
      },
      { key: "type", label: "Unit type", value: "Studio Unit", required: true },
      {
        key: "monthlyRent",
        label: "Whole unit monthly rent (PHP)",
        type: "number",
        required: true,
      },
      {
        key: "arrangement",
        label: "Billing arrangement",
        type: "select",
        options: [
          { value: "individual", label: "Individual" },
          { value: "shared_occupancy", label: "Shared occupancy" },
        ],
      },
      {
        key: "status",
        label: "Unit condition",
        type: "select",
        options: [
          { value: "vacant", label: "Available" },
          { value: "maintenance", label: "Under repair" },
        ],
      },
    ];
  }
  if (kind === "tenants") {
    const units = await api.get("/units");
    fields = [
      { key: "fullName", label: "Full name", required: true },
      {
        key: "email",
        label: "Email for account identification",
        type: "email",
        required: true,
      },
      { key: "phone", label: "Phone" },
      { key: "governmentId", label: "Government ID" },
      { key: "emergencyContactName", label: "Emergency contact" },
      { key: "emergencyContactPhone", label: "Emergency phone" },
      {
        key: "unitId",
        label: "Unit",
        type: "select",
        options: units.map((u) => ({
          value: u.id,
          label: u.code + " · " + u.arrangement,
        })),
        required: true,
      },
      {
        key: "leaseStart",
        label: "Original lease start",
        type: "date",
        required: true,
      },
      { key: "leaseEnd", label: "Lease end", type: "date" },
      {
        key: "assignmentStart",
        label: "Assignment start",
        type: "date",
        hint: "Defaults to lease start.",
      },
      {
        key: "assignmentEnd",
        label: "Assignment termination date",
        type: "date",
      },
      {
        key: "occupancy",
        label: "Occupancy",
        type: "select",
        options: ["active", "notice", "ended"],
      },
    ];
  }
  if (kind === "mappings") {
    const units = await api.get("/units");
    fields = [
      { key: "provider", label: "Provider", required: true },
      { key: "account", label: "Account/reference", required: true },
      {
        key: "unitId",
        label: "Billing target unit",
        type: "select",
        options: units.map((u) => ({ value: u.id, label: u.code })),
        required: true,
      },
      {
        key: "category",
        label: "Utility category",
        type: "select",
        options: ["electricity", "water"],
      },
    ];
  }
  if (id && ["tenants", "units"].includes(kind))
    fields.push({
      key: "reason",
      label: "Reason for lease or rent change",
      type: "textarea",
      hint: "Required when changing lease dates, assignment dates or rent with billing history.",
    });
  if (session.role === "staff") {
    if (!id) throw new Error("Manager creates billing-linked records.");
    const allowed = { properties: ["name","letter","address","city","type"], units: ["code","floor","floorNumber","type"], tenants: ["fullName","phone","emergencyContactName","emergencyContactPhone"] }[kind] ?? [];
    fields = fields.filter(field => allowed.includes(field.key));
  }
  return dialogForm({
    title: (id ? "Edit " : "Add ") + kind.replace(/s$/, ""),
    fields,
    values,
    save: (data) =>
      id
        ? api.patch(`/${kind}/${encodeURIComponent(id)}`, data)
        : api.post("/" + kind, data),
    onSaved,
  });
}
async function removeEntity(kind, id, onSaved) {
  dialogForm({
    title: "Delete " + kind.replace(/s$/, ""),
    subtitle:
      "Records with financial history are preserved. End a tenant assignment instead of deleting its history.",
    fields: [
      { key: "confirmation", label: "Type DELETE to confirm", required: true },
    ],
    save: async (data) => {
      if (data.confirmation !== "DELETE")
        throw new Error("Type DELETE to confirm");
      return api.delete(`/${kind}/${encodeURIComponent(id)}`);
    },
    label: "Delete",
    onSaved,
  });
}
async function uploadSource(onSaved, tenantId = null) {
  let guard;
  let processing=false;
  openModal({
    title: tenantId ? "Upload tenant document" : "Upload utility source",
    onClose: () => guard?.dispose(),
    canDismiss: () => !processing && (!guard?.isDirty() || window.confirm("Discard the selected upload?")),
    body: html`<form>
      <div class="field">
        <label class="field__label"
          >PDF, PNG or JPEG<input
            class="input"
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            required
        /></label>
      </div>
    </form><div class="processing-status" data-upload-progress role="status" hidden><span class="processing-status__bar" aria-hidden="true"></span><p>${tenantId ? "Uploading document…" : "Processing bill… Reading and validating the document. This can take a moment."}</p></div>`,
    footer: html`<button class="btn btn--secondary" data-close>Cancel</button
      ><button class="btn btn--primary" data-upload>Upload</button>`,
    onMount(close) {
      const button = document.querySelector(".modal [data-upload]");
      const form=button.closest(".modal").querySelector("form");
      const progress=button.closest(".modal").querySelector("[data-upload-progress]");
      guard=watchForm(form);
      button.addEventListener("click", async () => {
        if (processing) return;
        const file = document.querySelector(".modal input").files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
          toastDanger("File too large", "Maximum size is 10 MB.");
          return;
        }
        processing=true;
        const finish=beginAction(button,tenantId ? "Uploading…" : "Processing…");
        form.inert=true;
        button.closest(".modal").querySelectorAll("[data-close]").forEach(control=>{control.disabled=true;});
        progress.hidden=false;
        try {
          const base64 = await new Promise((resolve, reject) => {
            button.textContent = tenantId ? "Uploading…" : "Extracting bill…";
            button.setAttribute("aria-busy", "true");
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          const result = await api.post(
            tenantId ? "/documents" : "/intake/upload",
            { base64, filename: file.name, type: file.type, tenantId },
            { timeout: 120000 },
          );
          close();
          await onSaved?.();
          if (result.document?.processingOutcome === "exception")
            toastWarning(
              "Review required",
              "The bill needs a correction. Open Exception Queue → Review & correct.",
            );
          else toastSuccess("Uploaded", tenantId ? "The document was saved." : "The utility bill was validated. Tenants can view it in their tracker and history.");
        } catch (e) {
          toastDanger("Upload failed", e.message);
        } finally {
          processing=false;form.inert=false;progress.hidden=true;finish();
          button.closest(".modal")?.querySelectorAll("[data-close]").forEach(control=>{control.disabled=false;});
        }
      });
    },
  });
}
async function userForm(id, onSaved, passwordOnly = false) {
  const users = await api.get("/admin/users"),
    user = users.find((u) => u.id === id) ?? {};
  const workspaces=await api.get("/admin/workspaces");
  const fields = passwordOnly
    ? [
        {
          key: "password",
          label: "New password (12+ characters)",
          type: "password",
          required: true,
        },
      ]
    : [
        { key: "name", label: "Full name", required: true },
        { key: "email", label: "Email", type: "email", required: true },
        {
          key: "role",
          label: "Role",
          type: "select",
          options: ["admin", "manager", "staff", "tenant"],
        },
        { key: "tenantId", label: "Permanent tenant ID (Tenant role only)", hint: "Use the exact Tenant record ID supplied by the Manager. Link the account to that record so bills belong to the correct person; leave blank for Manager/Admin accounts." },
        {key:"workspaceId",label:"Workspace",type:"select",options:workspaces.map(w=>({value:w.id,label:w.name})),required:true,hint:"Managers and tenants can access only this property business. A Tenant must match the workspace of their rental record."},
        {
          key: "status",
          label: "Status",
          type: "select",
          options: ["active", "suspended"],
        },
        {
          key: "password",
          label: "Password (12+ characters)",
          type: "password",
          required: !id,
        },
      ];
  return dialogForm({
    title: passwordOnly
      ? "Reset password"
      : id
        ? "Edit account"
        : "Add account",
    fields,
    values: user,
    onReady(modal,form) {
      if(passwordOnly)return;
      const update=()=>{
        const admin=form.elements.role.value==="admin";
        form.elements.workspaceId.closest(".field").hidden=admin;
        form.elements.workspaceId.disabled=admin;
        form.elements.tenantId.closest(".field").hidden=form.elements.role.value!=="tenant";
      };
      form.elements.role.addEventListener("change",update);update();
    },
    save: (data) =>
      id
        ? api.patch("/admin/users/" + id, data)
        : api.post("/admin/users", data),
    onSaved,
  });
}
export async function correctSource(id, onSaved) {
  if (session.role === "staff") {
    const { proposeCorrection } = await import("../features/billing/correction-proposals.js");
    return proposeCorrection(id, onSaved);
  }
  let source;
  try { source = await api.get("/incoming/" + encodeURIComponent(id)); }
  catch (error) { toastDanger("Could not open bill", error.message); return; }
  const sourceFields = [["provider", "Provider"], ["accountRef", "Account / reference"], ["amountDue", "Amount due"], ["dueDate", "Due date"], ["periodStart", "Billing period start"], ["periodEnd", "Billing period end"]];
  const failures = (source.validationResults ?? []).filter(result => result.outcome === "failed").flatMap(result => result.reasons ?? []);
  const preview = sourcePreview(source);
  return dialogForm({
    title: "Review utility bill",
    label: "Save correction",
    subtitle: source.filename,
    className: "modal--source-review",
    values: { field: "accountRef", value: source.accountRef ?? "" },
    snapshot: form => JSON.stringify([String(form.elements.value.value) === String(source[form.elements.field.value] ?? "") ? "" : form.elements.value.value, form.elements.reason.value]),
    beforeFields: preview.markup,
    onClose: () => preview.dispose(),
    onReady(modal, form) {
      const summary = document.createElement("div");
      render(summary, html`<h4>Extracted details</h4><p class="text-sm text-muted">Choose a value to correct. Save one field at a time; every correction is revalidated.</p>${failures.length ? html`<div class="notice-strip notice-strip--warning source-review__issues"><strong>Needs attention</strong><ul>${failures.map(reason => html`<li>${reason}</li>`)}</ul></div>` : null}<dl class="source-review__fields">${sourceFields.map(([key, label]) => html`<div data-source-field="${key}" class="${source[key] == null || source[key] === "" ? "is-missing" : ""}"><dt>${label}</dt><dd><span>${source[key] == null || source[key] === "" ? "Missing" : source[key]}</span><button class="btn btn--ghost btn--sm" type="button" data-edit-source-field="${key}" aria-label="Edit ${label}">Edit</button></dd></div>`)}</dl>`);
      form.prepend(summary);
      const editor = form.elements.value.closest(".field");
      form.elements.field.closest(".field").hidden = true;
      const editField = (key, focus = true) => {
        const current = form.elements.field.value;
        if (focus && key !== current && String(form.elements.value.value) !== String(source[current] ?? "") && !window.confirm("Discard the unsaved field correction?")) return;
        form.elements.field.value = key;
        form.elements.value.value = source[key] ?? "";
        form.elements.value.removeAttribute("aria-invalid");
        editor.querySelector("[data-workflow-field-error]").hidden = true;
        form.querySelectorAll("[data-source-field]").forEach(row => row.classList.toggle("is-editing", row.dataset.sourceField === key));
        form.querySelector(`[data-source-field="${key}"]`).append(editor);
        if (focus) form.elements.value.focus({preventScroll:true});
      };
      summary.querySelectorAll("[data-edit-source-field]").forEach(button => button.addEventListener("click", () => editField(button.dataset.editSourceField)));
      form.elements.field.addEventListener("change", () => editField(form.elements.field.value));
      editField("accountRef", false);
      preview.mount(modal);
    },
    fields: [
      {
        key: "field",
        label: "Field",
        type: "select",
        options: [
          {value:"provider",label:"Provider"},
          {value:"accountRef",label:"Account / reference"},
          {value:"amountDue",label:"Amount due"},
          {value:"dueDate",label:"Due date"},
          {value:"periodStart",label:"Billing period start"},
          {value:"periodEnd",label:"Billing period end"},
        ],
      },
      {
        key: "value",
        label: "Corrected value",
        required: true,
        hint: "Dates use YYYY-MM-DD. Amount uses at most two decimal places.",
      },
      {
        key: "reason",
        label: "Correction reason",
        type: "textarea",
        required: true,
      },
    ],
    save: (data) => api.post("/incoming/" + id + "/correct", data),
    onSaved: async (result) => {
      await onSaved?.();
      if (result.failures?.length)
        toastWarning(
          "Still requires review",
          result.failures.map((f) => f.reason).join("; "),
        );
    },
  });
}
export function correctRent(id, onSaved) {
  return dialogForm({
    title: "Correct rent source amount",
    subtitle:
      "Recalculates this cycle for its frozen tenant list. Pending reports require review. Paid corrections retain the original payment and receipt.",
    fields: [
      {
        key: "amount",
        label: "Correct whole-unit rent for this cycle (PHP)",
        type: "number",
        required: true,
      },
      {
        key: "reason",
        label: "Correction reason",
        type: "textarea",
        required: true,
      },
    ],
    save: (data) => api.post("/bills/" + id + "/correct-rent", data),
    onSaved,
  });
}
export function bindWorkflows(container, { page, onChanged, refresh }) {
  controller?.abort();
  controller = new AbortController();
  const signal = controller.signal;
  const changed = async () => {
    await onChanged?.();
    await refresh?.();
  };
  container.addEventListener(
    "click",
    async (event) => {
      let button = event.target.closest("button,a");
      if (!button && !event.target.closest("input,select,textarea,label,[data-no-row]")) {
        button = event.target.closest("tr.is-clickable")?.querySelector("[data-view-bill]");
      }
      if (!button || !container.contains(button)) return;
      const text = button.textContent.trim().replace(/\s+/g, " ");
      try {
        if(button.dataset.action==="create-workspace" || button.dataset.renameWorkspace) {
          const id=button.dataset.renameWorkspace;
          const workspaces=await api.get("/admin/workspaces");
          dialogForm({title:id ? "Rename workspace" : "Create workspace",fields:[{key:"name",label:"Property business name",required:true}],values:workspaces.find(w=>w.id===id) ?? {},save:data=>id ? api.patch("/admin/workspaces/"+encodeURIComponent(id),data) : api.post("/admin/workspaces",data),onSaved:changed});
          return;
        }
        if (button.dataset.editEntity) {
          await entityForm(
            button.dataset.editEntity,
            button.dataset.id,
            changed,
          );
          return;
        }
        if (button.dataset.deleteEntity) {
          await removeEntity(
            button.dataset.deleteEntity,
            button.dataset.id,
            changed,
          );
          return;
        }
        if (button.dataset.assign) {
          await entityForm("tenants", null, changed, {
            unitId: button.dataset.assign,
          });
          return;
        }
        if (button.dataset.userId) {
          await userForm(
            button.dataset.userId,
            changed,
            button.dataset.userPassword === "true",
          );
          return;
        }
        if (button.dataset.recordRent) {
          const key = crypto.randomUUID();
          const bill = await api.get(`/bills/${button.dataset.recordRent}`);
          dialogForm({ title: "Record checked rent payment", subtitle: "Confirm the actual payment outside this system before saving.",
            values: {amount:bill.totalDue,paymentDate:new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Manila"})},
            fields: [{key:"amount",label:"Full outstanding amount (PHP)",type:"number",required:true}, {key:"paymentDate",label:"Actual payment date",type:"date",required:true}, {key:"method",label:"Method",type:"select",options:["cash","bank_transfer","e_wallet"]}, {key:"reference",label:"Reference (required for electronic payments)"}, {key:"checked",label:"Actual payment checked outside the system?",type:"select",options:[{value:"no",label:"No"},{value:"yes",label:"Yes"}]}],
            save: data => {
              if (data.checked !== "yes") throw new Error("Check the actual rent payment outside the system first.");
              if (!window.confirm(`Record ${data.amount} PHP rent paid on ${data.paymentDate} by ${data.method.replaceAll("_"," ")}? Manager confirmation issues a rent receipt.`)) throw new Error("Recording cancelled; nothing was saved.");
              return api.post(`/bills/${button.dataset.recordRent}/record-rent`, {...data, externallyChecked:true, recordingKey:key});
            }, onSaved:changed });
          return;
        }
        if (button.dataset.rejectPayment) {
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
                "/payments/" + button.dataset.rejectPayment + "/reject",
                data,
              ),
            onSaved: changed,
          });
          return;
        }
        if (button.dataset.viewReceipt) {
          if (button.disabled) return;
          button.disabled = true;
          try { await viewReceipt(button.dataset.viewReceipt); }
          finally { button.disabled = false; }
          return;
        }
        if (button.dataset.receipt) {
          await download(
            "/receipts/" + button.dataset.receipt,
            button.dataset.receipt + ".html",
          );
          return;
        }
        if (button.dataset.reviewOcr) {
          await correctSource(button.dataset.reviewOcr, changed);
          return;
        }
        if (button.dataset.source) {
          await download(
            "/incoming/" + button.dataset.source + "/source",
            button.dataset.filename,
          );
          return;
        }
        if (button.dataset.correctSource) {
          await correctSource(button.dataset.correctSource, changed);
          return;
        }
        if (button.dataset.correctRent) {
          correctRent(button.dataset.correctRent, changed);
          return;
        }
        if (button.dataset.document) {
          await download(
            "/" +
              (button.dataset.kind === "receipt" ? "receipts" : "documents") +
              "/" +
              button.dataset.document,
            button.dataset.filename,
            {preview:button.dataset.preview === "true"},
          );
          return;
        }
        if (button.dataset.viewBill) {
          const b = await api.get("/bills/" + button.dataset.viewBill);
          openModal({
            title: "Bill " + b.cycle,
            className: "modal--bill-detail",
            body: billDetails(b),
            footer: html`<button class="btn btn--secondary" data-close>
                Close</button
              >${session.role === "manager" && b.paymentStatus !== "tenant_reported_paid" ? (b.sourceId ? html`<button class="btn btn--primary" data-correct-source="${b.sourceId}">Correct source</button>` : html`<button class="btn btn--primary" data-correct-rent="${b.id}">Correct rent</button>`) : null}`,
            onMount(close) {
              document.querySelector(".modal")
                .querySelector("[data-correct-source]")
                ?.addEventListener("click", () => {
                  close();
                  correctSource(b.sourceId, changed);
                });
              document.querySelector(".modal")
                .querySelector("[data-correct-rent]")
                ?.addEventListener("click", () => {
                  close();
                  correctRent(b.id, changed);
                });
            },
          });
          return;
        }
        const add = {
          "Add property": "properties",
          "Add unit": "units",
          "Add tenant": "tenants",
          "Add mapping": "mappings",
        }[text];
        if (add) {
          await entityForm(add, null, changed);
          return;
        }
        if (text === "Add user") {
          await userForm(null, changed);
          return;
        }
        if (text === "Export" || text === "Export CSV") {
          const kind =
            page === "adminAudit"
              ? "audit"
              : page === "reports"
                ? "reports"
                : "tenants";
          const range =
            container.querySelector("[data-report-range]")?.value ?? "current";
          await download(
            "/exports/" + kind + "?range=" + encodeURIComponent(range),
            kind + ".csv",
          );
          return;
        }
        if (button.dataset.action === "sync-intake" || text === "Sync intake") {
          button.disabled = true;
          try {
            const result = await api.post(
              "/intake/sync",
              {},
              { timeout: 120000 },
            );
            (result.failed ? toastWarning : toastSuccess)(
              result.failed ? "Some emails need review" : "Mailbox synchronized",
              result.imported + " messages processed" + (result.failed ? `; ${result.failed} held in the review queue` : ""),
            );
            await changed();
          } finally {
            button.disabled = false;
          }
          return;
        }
        if (button.dataset.action === "upload-source" || text === "Upload source") {
          await uploadSource(changed);
          return;
        }
        if (button.dataset.action === "check-rent-cycles" || text === "Generate rent") {
          if (button.disabled) return;
          button.disabled = true;
          try {
            const result = await api.post("/rent/generate");
            toastSuccess("Rent cycles checked", result.generated ? result.generated + " bills generated" : "All eligible rent cycles are up to date.");
            await changed();
          } finally { button.disabled = false; }
          return;
        }
        const maintenance = {
          "Back up database": "backup",
          "Restart OCR worker": "ocr-restart",
          "Purge temp files": "purge",
        }[text];
        if (maintenance) {
          button.disabled = true;
          try {
            const result = await api.post("/admin/" + maintenance);
            toastSuccess(
              "Operation completed",
              (result.bundle ? `Database and ${result.files} bill/document files saved. Copy the complete backup folder for recovery.` : result.filename) ??
                (result.removed !== undefined
                  ? result.removed + " temporary files removed"
                  : text),
            );
            await changed();
          } finally {
            button.disabled = false;
          }
          return;
        }
      } catch (error) {
        toastDanger("Operation failed", error.message);
      }
    },
    { signal },
  );
  container.addEventListener(
    "keydown",
    (event) => {
      if (!["Enter", " "].includes(event.key) || !event.target.matches("tr.is-clickable")) return;
      event.preventDefault();
      event.target.querySelector("[data-view-bill]")?.click();
    },
    { signal },
  );
  container.addEventListener(
    "input",
    (event) => {
      if (event.target.matches("[data-bill-search]")) {
        const term = event.target.value.toLowerCase();
        container
          .querySelectorAll("tbody tr")
          .forEach(
            (row) =>
              (row.hidden = !row.textContent.toLowerCase().includes(term)),
          );
      }
    },
    { signal },
  );
}
export { entityForm, uploadSource, userForm };
