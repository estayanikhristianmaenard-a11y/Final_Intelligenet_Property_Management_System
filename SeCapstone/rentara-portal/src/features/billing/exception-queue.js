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
import { correctSource, correctRent, download } from "../../app/workflows.js";

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
export function exceptionQueue(
  exceptions,
  { onChanged, canReview = true } = {},
) {
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
  const severity =
    EXCEPTION_SEVERITY_META[record.severity] ?? EXCEPTION_SEVERITY_META.medium;
  const resolved = record.state !== "open";

  return html`<article
    data-exception-id="${record.id}"
    data-responsibility="${resolved ? "resolved" : record.responsibility ?? "staff"}"
    class="exception-card"
    style="--severity:${severity.color}"
  >
    <div class="exception-card__head">
      <div style="min-width:0">
        <div class="exception-card__reason">
          ${icon("alert-triangle", { size: 15 })} ${record.reason}
        </div>
        <div class="exception-card__id mt-1">
          ${record.id} · ${record.source.replace("_", " ")}
        </div>
      </div>
      <div class="row row-2">
        <span
          class="severity-tag"
          style="--sev-bg:${severity.bg};--sev-fg:${severity.fg}"
          >${severity.label}</span
        >
        ${
          resolved
            ? badge(
                record.state === "closed" ? "Closed" : record.state === "corrected" ? "Corrected" : "Revalidated",
                "success",
                { dot: true },
              )
            : badge("Review", "violet", { dot: true })
        }
      </div>
    </div>

    <div class="exception-card__body">
      ${record.resolutionReason ? html`<p class="text-sm">Handled: ${record.resolutionReason}</p>` : ""}
      <div class="row row-2 mb-2">
        <strong class="text-sm">${record.title}</strong>
        <span class="text-xs text-muted" title="${dateTime(record.raisedAt)}"
          >raised ${relative(record.raisedAt)}</span
        >
      </div>
      <p class="text-xs text-secondary mb-3">${record.detail}</p>
      <p class="text-sm">${resolved ? "Resolved" : (record.responsibility ?? "staff") === "manager" ? "With Manager" : "With Staff"}</p>
      ${(record.notes ?? []).map(note => html`<p class="exception-note"><strong>${note.actor}</strong> (${note.role}): ${note.text}</p>`)}
      ${!resolved ? html`<button class="btn btn--secondary btn--sm" data-exception-note="${record.id}">Add note / escalate</button>` : null}
      <p class="text-sm">${({V01:"Check the original bill and fill in missing or conflicting fields.",V02:"Check the amount, dates and billing period against the original bill.",V03:"Link the provider and account number to the correct unit in billing settings.",V04:"Compare the existing bill before accepting another copy or a revised charge.",C02:"Check whether this unit uses individual or shared billing and review assignment dates.",A01:"Check the eligible tenants and confirm their shares total the original charge."})[record.ruleId] ?? "Review the source and recorded reason, then correct and revalidate."}</p>
      <div class="exception-card__grid">
        ${record.fields.map(
          (field) =>
            html`<div class="desc-item">
              <span class="desc-item__label">${field.label}</span>
              <span
                class="desc-item__value ${field.missing ? "text-danger" : ""}"
                >${field.value}</span
              >
            </div>`,
        )}
      </div>
    </div>

    ${
      resolved
        ? html`<div class="exception-card__foot">
            <span class="reconciliation-ok"
              >${icon("check-circle", { size: 13 })} Resolved — record
              reprocessed.</span
            >
          </div>`
        : !canReview
          ? html`<div class="exception-card__foot">${record.sourceId ? html`<button class="btn btn--primary btn--sm" data-propose-source="${record.sourceId}">Prepare correction</button><button class="btn btn--secondary btn--sm" data-proposal-source="${record.sourceId}">View original bill</button>` : html`<p>Investigate and escalate with your findings. Manager handles configuration and held-email decisions.</p>`}</div>`
        : record.intakeMessageId
          ? html`<div class="exception-card__foot"><p class="text-sm">${record.detail}</p><button class="btn btn--primary btn--sm" type="button" data-exc-retry-email="${record.id}" ${canReview ? "" : "disabled"}>Retry email</button><button class="btn btn--secondary btn--sm" type="button" data-exc-close-email="${record.id}" ${canReview ? "" : "disabled"}>Close email notice</button></div>`
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
            <button
              class="btn btn--ghost btn--sm"
              type="button"
              data-exc-source="${record.sourceId}"
            >
              ${icon("eye", { size: 14 })} Download original bill
            </button>
          </div>`
    }
  </article>`;
}

/**
 * Bind Exception Queue actions inside a container.
 * @param {HTMLElement} container
 * @param {{onChanged?:()=>void, canReview?:boolean}} [options]
 */
export function bindExceptionQueue(
  container,
  { onChanged, canReview = true } = {},
) {
  if (!canReview) return;

  container.querySelectorAll("[data-exc-close-email]").forEach(button => {
    button.addEventListener("click", () => openModal({
      title: "Close email notice", subtitle: "Closing this notice does not validate a bill or confirm payment.",
      body: html`<div class="field"><label class="field__label" for="email-close-reason">How was this email handled?</label><textarea id="email-close-reason" class="textarea" required minlength="8" maxlength="1000" placeholder="For example: uploaded a supported replacement copy for review."></textarea></div>`,
      footer: html`<button class="btn btn--secondary" type="button" data-close>Cancel</button><button class="btn btn--primary" type="button" data-close-email-submit>Close notice</button>`,
      onMount(close) {
        const submit = document.querySelector("[data-close-email-submit]");
        submit.addEventListener("click", async () => {
          const input = document.querySelector("#email-close-reason");
          if (!input.reportValidity() || submit.disabled) return;
          submit.disabled = true;
          try {
            await api.post(`/exceptions/${encodeURIComponent(button.dataset.excCloseEmail)}/close-email`, { reason: input.value });
            close(); toastSuccess("Email notice closed", "The handling reason was saved; bill validation remains separate.");
            await onChanged?.(); window.dispatchEvent(new CustomEvent("app:data-changed"));
          } catch (error) { toast({ title: "Could not close notice", message: error.message, tone: "danger" }); }
          finally { submit.disabled = false; }
        });
      },
    }));
  });

  container.querySelectorAll("[data-exc-retry-email]").forEach(button => {
    button.addEventListener("click", async () => {
      if (button.disabled) return;
      button.disabled = true;
      try {
        const result = await api.post(`/exceptions/${encodeURIComponent(button.dataset.excRetryEmail)}/retry-email`, {});
        toast({ title: result.failed ? "Email still held" : "Email processed", message: result.failed ? "Check the message or upload a supported bill copy." : "Check billing records and any remaining validation exceptions.", tone: result.failed ? "warning" : "success" });
        await onChanged?.();
        window.dispatchEvent(new CustomEvent("app:data-changed"));
      } catch (error) { toast({ title: "Retry failed", message: error.message, tone: "danger" }); }
      finally { button.disabled = false; }
    });
  });

  container.querySelectorAll("[data-exc-review]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-exc-review");
      api
        .get(endpoints.exceptions())
        .then((records) => {
          const record = records.find((e) => e.id === id);
          if (record?.billId && !record.sourceId) {
            correctRent(record.billId, onChanged);
            return;
          }
          if (!record?.sourceId) {
            toast({
              title: "Configuration review",
              message:
                record?.detail ??
                "Correct the lease or occupancy configuration, then generate rent.",
              tone: "warning",
            });
            return;
          }
          correctSource(record.sourceId, onChanged);
        })
        .catch((error) =>
          toast({
            title: "Review failed",
            message: error.message,
            tone: "danger",
          }),
        );
    });
  });

  container.querySelectorAll("[data-exc-revalidate]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.getAttribute("data-exc-revalidate");
      button.setAttribute("aria-disabled", "true");
      try {
        if (button.disabled) return;
        button.disabled = true;
        const result = await api.post(endpoints.resolveException(id), {
          revalidate: true,
        });
        toast({
          title: result.failures?.length
            ? "Review still required"
            : "Record finalized",
          message: result.failures?.length
            ? result.failures.map((f) => f.reason).join("; ")
            : `${id} passed revalidation.`,
          tone: result.failures?.length ? "warning" : "success",
        });
        await onChanged?.();
      } catch (error) {
        toast({
          title: "Revalidation failed",
          message: error.message,
          tone: "danger",
        });
        button.removeAttribute("aria-disabled");
        button.disabled = false;
      }
    });
  });

  container.querySelectorAll("[data-exc-source]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const id = button.dataset.excSource;
        if (!id)
          throw new Error("This exception refers to the lease configuration.");
        await download("/incoming/" + id + "/source", id + ".source");
      } catch (error) {
        toast({
          title: "Source unavailable",
          message: error.message,
          tone: "danger",
        });
      }
    });
  });
}

export default exceptionQueue;
