import { html } from "../utils/dom.js";
import {
  ACTIVITY_TONE,
  PAYMENT_STATUS_META,
  UNIT_STATUS_META,
  BILLING_CATEGORY_META,
} from "../config/constants.js";

/** Generic tone badge. */
export function badge(label, tone = "neutral", { dot = false, size = "" } = {}) {
  return html`<span class="badge badge--${tone} ${size === "lg" ? "badge--lg" : ""}"
    >${dot ? html`<i class="badge__dot"></i>` : null}${label}</span
  >`;
}

/** Badge for one of the four Recent Activity statuses. */
export function activityBadge(status) {
  const tone = ACTIVITY_TONE[status] ?? "neutral";
  return badge(status, tone, { dot: true });
}

/** Badge for a billing payment status (Unpaid / Tenant Reported Paid / Paid). */
export function paymentBadge(status) {
  if (status === "not_marked_paid") return badge("Not Marked Paid", "neutral");
  if (status === "self_reported_paid") return badge("Self-Reported Paid", "neutral");
  const meta = PAYMENT_STATUS_META[status];
  if (!meta) return badge(status, "neutral", { dot: true });
  return badge(meta.label, meta.tone, { dot: true });
}

/** Badge for a unit occupancy status. */
export function unitStatusBadge(status) {
  const meta = UNIT_STATUS_META[status];
  if (!meta) return badge(status, "neutral");
  return badge(meta.label, meta.tone, { dot: true });
}

/** Small category chip, e.g. Rent / Electricity / Water. */
export function categoryChip(category, labelOverride) {
  const meta = BILLING_CATEGORY_META[category];
  const label = labelOverride ?? meta?.label ?? category;
  return html`<span class="chip ${meta?.tone === "primary" ? "chip--accent" : ""}"
    >${label}</span
  >`;
}

/** OCR confidence indicator: meter + percentage. */
export function confidenceMeter(value) {
  const v = Number(value ?? 0);
  const color = v >= 85 ? "#16a34a" : v >= 60 ? "#d97706" : "#dc2626";
  return html`<span class="confidence" title="OCR extraction confidence">
    <span class="confidence__meter"
      ><span class="confidence__fill" style="width:${v}%;--conf-color:${color}"></span
    ></span>
    <span style="color:${color}">${v}%</span>
  </span>`;
}

export default badge;
