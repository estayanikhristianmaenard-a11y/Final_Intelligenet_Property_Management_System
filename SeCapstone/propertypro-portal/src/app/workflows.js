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
let controller;
export function dialogForm({
  title,
  subtitle = "",
  fields,
  values = {},
  save,
  label = "Save",
  onSaved,
}) {
  const control = (f) => {
    const value = values[f.key] ?? f.value ?? "";
    if (f.type === "select")
      return html`<select
        class="input select"
        name="${f.key}"
        ${f.required ? "required" : ""}
      >
        ${f.options.map((o) => html`<option value="${o.value ?? o}" ${String(value) === String(o.value ?? o) ? "selected" : ""}>${o.label ?? o}</option>`)}
      </select>`;
    if (f.type === "textarea")
      return html`<textarea
        class="textarea"
        name="${f.key}"
        ${f.required ? "required" : ""}
      >
${value}</textarea>`;
    return html`<input
      class="input"
      name="${f.key}"
      type="${f.type ?? "text"}"
      value="${value}"
      ${f.required ? "required" : ""}
      ${f.type === "number" ? html`min="0" step="0.01"` : null}
    />`;
  };
  return openModal({
    title,
    subtitle,
    body: html`<form data-workflow-form>
      ${fields.map((f) => html`<div class="field"><label class="field__label">${f.label}${control(f)}</label>${f.hint ? html`<span class="field__hint">${f.hint}</span>` : null}</div>`)}
    </form>`,
    footer: html`<button class="btn btn--secondary" data-close>Cancel</button
      ><button class="btn btn--primary" data-workflow-save>${label}</button>`,
    onMount(close) {
      const modal = document.querySelector(".modal"),
        form = modal.querySelector("form"),
        button = modal.querySelector("[data-workflow-save]");
      const submit = async (e) => {
        e?.preventDefault();
        if (button.disabled || !form.reportValidity()) return;
        button.disabled = true;
        try {
          const data = Object.fromEntries(new FormData(form));
          const result = await save(data);
          close();
          await onSaved?.(result);
          toastSuccess("Saved", "Your change was saved.");
        } catch (error) {
          toastDanger("Could not save", error.message);
        } finally {
          button.disabled = false;
        }
      };
      button.addEventListener("click", submit);
      form.addEventListener("submit", submit);
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
export function reportPayment(bill, onSaved) {
  return dialogForm({
    title: "Report payment",
    subtitle: `Full outstanding amount: ₱${bill.totalDue.toFixed(2)}`,
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
    label: "Submit report",
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
  openModal({
    title: tenantId ? "Upload tenant document" : "Upload utility source",
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
    </form>`,
    footer: html`<button class="btn btn--secondary" data-close>Cancel</button
      ><button class="btn btn--primary" data-upload>Upload</button>`,
    onMount(close) {
      const button = document.querySelector(".modal [data-upload]");
      button.addEventListener("click", async () => {
        const file = document.querySelector(".modal input").files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
          toastDanger("File too large", "Maximum size is 10 MB.");
          return;
        }
        button.disabled = true;
        try {
          const base64 = await new Promise((resolve, reject) => {
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
              "The source was saved in the Exception Queue.",
            );
          else toastSuccess("Uploaded", "The document was saved.");
        } catch (e) {
          toastDanger("Upload failed", e.message);
        } finally {
          button.disabled = false;
        }
      });
    },
  });
}
async function userForm(id, onSaved, passwordOnly = false) {
  const users = await api.get("/admin/users"),
    user = users.find((u) => u.id === id) ?? {};
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
          options: ["admin", "manager", "tenant"],
        },
        { key: "tenantId", label: "Permanent tenant ID (Tenant role only)" },
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
    save: (data) =>
      id
        ? api.patch("/admin/users/" + id, data)
        : api.post("/admin/users", data),
    onSaved,
  });
}
export async function correctSource(id, onSaved) {
  return dialogForm({
    title: "Correct source record",
    fields: [
      {
        key: "field",
        label: "Field",
        type: "select",
        options: [
          "provider",
          "accountRef",
          "amountDue",
          "dueDate",
          "periodStart",
          "periodEnd",
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
      "Recalculates this cycle for its frozen tenant list. Reported or confirmed charges are protected.",
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
      const button = event.target.closest("button,a");
      if (!button || !container.contains(button)) return;
      const text = button.textContent.trim().replace(/\s+/g, " ");
      try {
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
        if (button.dataset.receipt) {
          await download(
            "/receipts/" + button.dataset.receipt,
            button.dataset.receipt + ".html",
          );
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
          );
          return;
        }
        if (button.dataset.viewBill) {
          const b = await api.get("/bills/" + button.dataset.viewBill);
          openModal({
            title: "Bill " + b.cycle,
            body: html`<dl>
              ${b.lines.map(
                (l) =>
                  html`<dt>${l.label ?? l.category} · ${l.period}</dt>
                    <dd>
                      ₱${l.amount.toFixed(2)}${l.credit ? ` (credit ₱${l.credit.toFixed(2)})` : ""}
                    </dd>`,
              )}
              <dt>Status</dt>
              <dd>${b.paymentStatus}</dd>
            </dl>`,
            footer: html`<button class="btn btn--secondary" data-close>
                Close</button
              >${session.role === "manager" && b.paymentStatus === "unpaid" ? (b.sourceId ? html`<button class="btn btn--primary" data-correct-source="${b.sourceId}">Correct source</button>` : html`<button class="btn btn--primary" data-correct-rent="${b.id}">Correct rent</button>`) : null}`,
            onMount(close) {
              document
                .querySelector("[data-correct-source]")
                ?.addEventListener("click", () => {
                  close();
                  correctSource(b.sourceId, changed);
                });
              document
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
        if (text === "Sync intake") {
          button.disabled = true;
          try {
            const result = await api.post(
              "/intake/sync",
              {},
              { timeout: 120000 },
            );
            toastSuccess(
              "Mailbox synchronized",
              result.imported + " messages processed",
            );
            await changed();
          } finally {
            button.disabled = false;
          }
          return;
        }
        if (text === "Upload source") {
          await uploadSource(changed);
          return;
        }
        if (text === "Generate rent") {
          const result = await api.post("/rent/generate");
          toastSuccess(
            "Rent generation complete",
            result.generated + " bills generated",
          );
          await changed();
          return;
        }
        const maintenance = {
          "Run health check": "health",
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
              result.filename ??
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
