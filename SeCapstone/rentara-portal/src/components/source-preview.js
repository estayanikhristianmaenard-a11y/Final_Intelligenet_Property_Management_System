import { html, render } from "../utils/dom.js";
import { apiConfig } from "../config/api.js";
import session from "../auth/session.js";

/** Authenticated, read-only source preview shared by correction dialogs. */
export function sourcePreview(source) {
  const controller = new AbortController();
  let closed = false;
  let url;
  return {
    markup: html`<section class="source-review__original" aria-label="Original utility bill"><h4>Original bill</h4><p class="text-sm text-muted" data-source-preview-status role="status">Loading original document…</p><button type="button" class="btn btn--secondary" data-source-retry hidden>Retry original</button><div data-source-preview></div><details class="source-review__text"><summary>Extracted text</summary><pre>${source.rawText || "No readable text was extracted."}</pre></details></section>`,
    async mount(modal) {
      const host = modal.querySelector("[data-source-preview]");
      const status = modal.querySelector("[data-source-preview-status]");
      const retry = modal.querySelector("[data-source-retry]");
      retry.hidden = true;
      retry.disabled = true;
      retry.onclick = () => this.mount(modal);
      status.textContent = "Loading original document?";
      try {
        const response = await fetch(apiConfig.BASE_URL + "/incoming/" + encodeURIComponent(source.id) + "/source", {
          headers:{ Authorization:"Bearer " + session.token }, signal:controller.signal,
        });
        if (!response.ok) throw new Error("Original document is unavailable.");
        const blob = await response.blob();
        if (closed) return;
        url = URL.createObjectURL(blob);
        const type = blob.type.split(";")[0];
        const supported = ["application/pdf","image/png","image/jpeg"].includes(type);
        render(host, html`${type === "application/pdf" ? html`<iframe class="source-review__pdf" title="Original utility bill PDF" src="${url}"></iframe>` : ["image/png","image/jpeg"].includes(type) ? html`<img class="source-review__image" src="${url}" alt="Original utility bill for comparison" />` : html`<p>Read the extracted text below or download the original source.</p>`}<a class="text-link" href="${url}" download="${source.filename}">Download original</a>`);
        status.textContent = supported ? "Compare the original with the extracted details." : "Inline preview is unavailable for this file type.";
      } catch (error) {
        if (!closed) {
          status.textContent = error.message + " Check your connection, then retry. Your correction entries stay here.";
          retry.hidden = false;
        }
      } finally {
        if (!closed) retry.disabled = false;
      }
    },
    dispose() {
      closed = true;
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    },
  };
}
