/** Presentation formatting: currency, dates, relative time, identifiers. */

const PESO = "₱";

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const intFormatter = new Intl.NumberFormat("en-PH");

/** Format a number as Philippine Peso, e.g. `₱12,450.00`. */
export function peso(amount, { sign = false } = {}) {
  const value = Number(amount ?? 0);
  const formatted = pesoFormatter.format(Math.abs(value));
  const prefix = sign ? (value < 0 ? "−" : "+") : value < 0 ? "−" : "";
  return `${prefix}${PESO}${formatted}`;
}

/** Compact peso for dense cards, e.g. `₱12.4K`. */
export function pesoCompact(amount) {
  const value = Number(amount ?? 0);
  if (Math.abs(value) >= 1_000_000) return `${PESO}${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${PESO}${(value / 1_000).toFixed(1)}K`;
  return peso(value);
}

export function count(value) {
  return intFormatter.format(Number(value ?? 0));
}

/** `2026-10-09` → `09 Oct 2026` */
export function date(value, { fallback = "—" } = {}) {
  const d = toDate(value);
  if (!d) return fallback;
  return d.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** `2026-10-09T14:05` → `09 Oct 2026, 2:05 PM` */
export function dateTime(value, { fallback = "—" } = {}) {
  const d = toDate(value);
  if (!d) return fallback;
  return `${date(d)} · ${d.toLocaleTimeString("en-PH", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

/** Display stored YYYY-MM cycles without changing their filtering/storage keys. */
export function monthLabel(value) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value ?? "")) return value ?? "—";
  return new Date(`${value}-01T00:00:00+08:00`).toLocaleDateString("en-PH", {timeZone:"Asia/Manila",month:"long",year:"numeric"});
}

export function periodLabel(value) {
  const parts = String(value ?? "").split(/\s+to\s+/);
  if (parts.length !== 2 || !parts.every(part => /^\d{4}-\d{2}-\d{2}$/.test(part))) return value ?? "Not found";
  return `${date(parts[0])} – ${date(parts[1])}`;
}

/** Dates/statuses already on the bill determine urgency; no predicted dates. */
export function billTiming(bill, now = new Date()) {
  if (!bill?.dueDate || !(Number(bill.totalDue) > 0)) return "";
  const rent = bill.lines?.every(line => line.category === "rent");
  if (rent ? bill.paymentStatus !== "unpaid" : bill.utilityTrackingStatus === "self_reported_paid" && !bill.utilityTrackingNeedsReview) return "";
  const today = now.toLocaleDateString("en-CA", {timeZone:"Asia/Manila"});
  return bill.dueDate < today ? "Overdue" : bill.dueDate === today ? "Due today" : "";
}

/** Short relative label used by the Recent Activity table: `12 min ago`. */
export function relative(value, now = Date.now()) {
  const d = toDate(value);
  if (!d) return "—";
  /* RelativeTimeFormat expects a *signed* delta: negative = past, positive =
     future. `target - now` gives exactly that. */
  const diff = d.getTime() - now;
  const abs = Math.abs(diff);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < minute) return rtf.format(Math.round(diff / 1000), "second");
  if (abs < hour) return rtf.format(Math.round(diff / minute), "minute");
  if (abs < day) return rtf.format(Math.round(diff / hour), "hour");
  if (abs < 7 * day) return rtf.format(Math.round(diff / day), "day");
  return date(d);
}

function toDate(value) {
  if (!value && value !== 0) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function initials(name = "") {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Stable avatar tone derived from any seed string. */
const AVATAR_TONES = ["", "avatar--mint", "avatar--amber", "avatar--rose", "avatar--violet"];
export function avatarTone(seed = "") {
  let hash = 0;
  for (const ch of String(seed)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

export function pluralize(n, singular, plural = `${singular}s`) {
  return Number(n) === 1 ? singular : plural;
}

/** `A-101` style unit code. */
export function unitCode(building, number) {
  return `${building}-${number}`;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
