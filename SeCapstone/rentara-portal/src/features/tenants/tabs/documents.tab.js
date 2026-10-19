import { html } from "../../../utils/dom.js";
import { icon } from "../../../components/icon.js";
import { emptyState } from "../../../components/empty-state.js";

/**
 * Tenant Details → Documents tab.
 * Lease contract, verified IDs, clearances and any Manager-confirmed receipts.
 *
 * @param {object} tenant  detail payload from `GET /tenants/:id`
 */
export function documentsTab(tenant) {
  const documents = tenant.documents ?? [];

  if (!documents.length) {
    return html`<section class="panel-section">
        <button class="btn btn--primary" data-upload-document>
          Upload document
        </button>
      </section>
      ${emptyState({
        iconName: "file",
        title: "No documents on file",
        body: "Uploaded lease contracts, IDs and generated receipts will be listed here.",
      })}`;
  }

  const groups = [
    { label: "Lease & identity", kinds: ["pdf", "image"] },
    { label: "Receipts", kinds: ["receipt"] },
  ];

  return html`<section class="panel-section">
      <button class="btn btn--primary" data-upload-document>
        Upload document
      </button>
    </section>
    ${groups
      .map((group) => {
        const items = documents.filter((doc) => group.kinds.includes(doc.kind));
        if (!items.length) return null;
        return html`<section class="panel-section">
          <h3 class="section-title">${group.label}</h3>
          <div class="doc-list">
            ${items.map(
              (doc) =>
                html`<div class="doc-item">
                  <span
                    class="doc-item__icon"
                    style="--tone:${toneFor(doc).color};--tone-bg:${toneFor(doc).bg}"
                    >${icon(toneFor(doc).icon, { size: 17 })}</span
                  >
                  <span class="doc-item__meta">
                    <strong>${doc.name}</strong>
                    <span>${doc.meta} · ${doc.size}</span>
                  </span>
                  <span class="doc-item__actions">
                    <button
                      class="icon-btn"
                      type="button"
                      title="Preview"
                      aria-label="Preview ${doc.name}"
                      data-document="${doc.id}"
                      data-kind="${doc.kind}"
                      data-filename="${doc.name}"
                      data-preview="true"
                    >
                      ${icon("eye", { size: 16 })}
                    </button>
                    <button
                      class="icon-btn"
                      type="button"
                      title="Download"
                      aria-label="Download ${doc.name}"
                      data-document="${doc.id}"
                      data-kind="${doc.kind}"
                      data-filename="${doc.name}"
                    >
                      ${icon("download", { size: 16 })}
                    </button>
                  </span>
                </div>`,
            )}
          </div>
        </section>`;
      })
      .filter(Boolean)}

    <section class="panel-section">
      <div class="notice-strip notice-strip--info">
        <span class="notice-strip__icon">${icon("lock", { size: 14 })}</span>
        <span>
          Documents are restricted to authorised roles under the system's
          data-access rules. Access is logged for audit.
        </span>
      </div>
    </section>`;
}

function toneFor(doc) {
  if (doc.kind === "receipt")
    return { icon: "receipt", color: "#16a34a", bg: "#dcfce7" };
  if (doc.kind === "image")
    return { icon: "image", color: "#0284c7", bg: "#e0f2fe" };
  return { icon: "file", color: "#64748b", bg: "#f1f5f9" };
}

export default documentsTab;
