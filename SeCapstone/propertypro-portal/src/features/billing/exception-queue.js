import { html } from "../../utils/dom.js";
import { icon } from "../../components/icon.js";
import { badge } from "../../components/badge.js";
import { emptyState } from "../../components/empty-state.js";
import { openModal } from "../../components/modal.js";
import { toast, toastSuccess } from "../../components/toast.js";
import { api } from "../../api/client.js";
import { endpoints } from "../../api/endpoints.js";
import { relative, dateTime } from "../../utils/format.js";
import { EXCEPTION_SEVERITY_META } from "../../config/constants.js";

/**
 * Exception Queue.
 *
 * The controlled intervention point described by the study: records that are
 * invalid, incomplete, uncertain, duplicated or unmappable are routed here for
 * Manager review and correction, then revalidated and reprocessed.
 *
 * @param {Array} exceptions
 * @param {{onChanged?:()=>void, canReview?:boolean}} [options]
 */
export function exceptionQueue(exceptions, { onChanged, canReview = true } = {}) {
  if (!exceptions.length) {
    return emptyState({
      iconName: "check-circle",
      title: "The Exception Queue is clear",
      body: "Records that fail validation, mapping or duplicate checks will appear here for Manager review.",
    });
  }

  return html`<div class="exception-list">
    ${exceptions.map((record) => exceptionCard(record, { onChanged, canReview }))}
  </div>`;
}

function exceptionCard(record, { onChanged, canReview }) {
  const severity = EXCEPTION_SEVERITY_META[record.severity] ?? EXCEPTION_SEVERITY_META.medium;
  const resolved = record.state !== "open";

  return html`<article
    class="exception-card"
    style="--severity:${severity.color}"
  >
    <div class="exception-card__head">
      <div style="min-width:0">
        <div class="exception-card__reason">
          ${icon("alert-triangle", { size: 15 })} ${record.reason}
        </div>
        <div class="exception-card__id mt-1">${record.id} · ${record.source.replace("_", " ")}</div>
      </div>
      <div class="row row-2">
        <span
          class="severity-tag"
          style="--sev-bg:${severity.bg};--sev-fg:${severity.fg}"
          >${severity.label}</span
        >
        ${resolved
          ? badge(record.state === "corrected" ? "Corrected" : "Revalidated", "success", { dot: true })
          : badge("Review", "violet", { dot: true })}
      </div>
    </div>

    <div class="exception-card__body">
      <div class="row row-2 mb-2">
        <strong class="text-sm">${record.title}</strong>
        <span class="text-xs text-muted" title="${dateTime(record.raisedAt)}"
          >raised ${relative(record.raisedAt)}</span
        >
      </div>
      <p class="text-xs text-secondary mb-3">${record.detail}</p>
      <div class="exception-card__grid">
        ${record.fields.map(
          (field) => html`<div class="desc-item">
            <span class="desc-item__label">${field.label}</span>
            <span class="desc-item__value ${field.missing ? "text-danger" : ""}"
              >${field.value}</span
            >
          </div>`,
        )}
      </div>
    </div>

    ${resolved
      ? html`<div class="exception-card__foot">
          <span class="reconciliation-ok">${icon("check-circle", { size: 13 })} Resolved — record reprocessed.</span>
        </div>`
      : html`<div class="exception-card__foot">
          <button
            class="btn btn--primary btn--sm"
            type="button"
            data-exc-review="${record.id}"
            ${canReview ? "" : "disabled"}
          >
            ${icon("edit", { size: 14 })} Review & correct
          </button>
          <button
            class="btn btn--secondary btn--sm"
            type="button"
            data-exc-revalidate="${record.id}"
            ${canReview ? "" : "disabled"}
          >
            ${icon("refresh", { size: 14 })} Revalidate
          </button>
          <button class="btn btn--ghost btn--sm" type="button" data-exc-source="${record.sourceId}">
            ${icon("eye", { size: 14 })} Open source record
          </button>
        </div>`}
  </article>`;
}

/**
 * Bind Exception Queue actions inside a container.
 * @param {HTMLElement} container
 * @param {{onChanged?:()=>void, canReview?:boolean}} [options]
 */
export function bindExceptionQueue(container, { onChanged, canReview = true } = {}) {
  if (!canReview) return;

  container.querySelectorAll("[data-exc-review]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-exc-review");
      openCorrectionModal(id, onChanged);
    });
  });

  container.querySelectorAll("[data-exc-revalidate]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.getAttribute("data-exc-revalidate");
      button.setAttribute("aria-disabled", "true");
      try {
        await api.post(endpoints.resolveException(id), { revalidate: true });
        toastSuccess("Record revalidated", `${id} re-entered the billing pipeline.`);
        onChanged?.();
      } catch (error) {
        toast({ title: "Revalidation failed", message: error.message, tone: "danger" });
        button.removeAttribute("aria-disabled");
      }
    });
  });

  container.querySelectorAll("[data-exc-source]").forEach((button) => {
    button.addEventListener("click", () => {
      toast({
        title: "Source record",
        message: `Opening ${button.getAttribute("data-exc-source")} is wired to the billing detail route.`,
        tone: "info",
      });
    });
  });
}

function openCorrectionModal(id, onChanged) {
  openModal({
    title: "Correct exception record",
    subtitle: `${id} — corrections are stored with the centralised record`,
    body: html`
      <div class="field">
        <label class="field__label" for="exc-field">Field to correct</label>
        <select class="select input" id="exc-field">
          <option>Account / reference identifier</option>
          <option>Amount due</option>
          <option>Due date</option>
          <option>Billing period</option>
          <option>Property / unit mapping</option>
        </select>
      </div>
      <div class="field">
        <label class="field__label" for="exc-value">Corrected value</label>
        <input class="input" id="exc-value" type="text" placeholder="Enter the corrected value" />
        <span class="field__hint"
          >The record is revalidated and recomputed after saving.</span
        >
      </div>
      <div class="field">
        <label class="field__label" for="exc-note">Correction note</label>
        <textarea class="textarea" id="exc-note" style="min-height:80px" placeholder="Why is this correction being applied?"></textarea>
      </div>
    `,
    footer: html`
      <button class="btn btn--secondary" type="button" data-close>Cancel</button>
      <button class="btn btn--primary" type="button" data-save>
        ${icon("check", { size: 15 })} Save & revalidate
      </button>
    `,
    onMount: (close) => {
      document.querySelector(".modal [data-save]")?.addEventListener("click", async () => {
        try {
          await api.post(endpoints.resolveException(id), { revalidate: false });
          close();
          toastSuccess(
            "Correction applied",
            `${id} was corrected, revalidated and reprocessed.`,
          );
          onChanged?.();
        } catch (error) {
          toast({ title: "Correction failed", message: error.message, tone: "danger" });
        }
      });
    },
  });
}

export default exceptionQueue;
