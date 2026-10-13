export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export function requireValue(ok, message, status = 422, code) {
  if (!ok) throw new HttpError(status, message, code);
}
export function validDate(value) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(String(value)) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value
  );
}
export function cents(value) {
  requireValue(
    value !== "" &&
      value != null &&
      Number.isFinite(Number(value)) &&
      Number(value) >= 0 &&
      /^\d+(?:\.\d{1,2})?$/.test(String(value)),
    "Amount must be nonnegative with at most two decimal places",
  );
  const [whole, fraction = ""] = String(value).split(".");
  const n = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  requireValue(
    Number.isSafeInteger(n) && n <= 100_000_000_000,
    "Amount exceeds supported limit",
  );
  return n;
}
export const money = (n) => n / 100;
export function philippineDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function addDays(date, count) {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + count);
  return d.toISOString().slice(0, 10);
}
export function anniversary(year, month, day) {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(Math.min(day, last)).padStart(2, "0")}`;
}
export function monthAfter(date, day) {
  const d = new Date(date + "T00:00:00Z");
  const month = d.getUTCMonth() + 2;
  return anniversary(
    d.getUTCFullYear() + (month > 12 ? 1 : 0),
    month > 12 ? 1 : month,
    day,
  );
}
export function splitCentavos(total, ids) {
  requireValue(ids.length > 0, "No eligible occupants", 422, "A01");
  const sorted = [...new Set(ids)].sort();
  requireValue(
    sorted.length === ids.length,
    "Duplicate allocation recipients",
    422,
    "A01",
  );
  const base = Math.floor(total / sorted.length),
    remainder = total % sorted.length;
  return sorted.map((tenantId, i) => ({
    tenantId,
    cents: base + (i < remainder ? 1 : 0),
  }));
}
export function eligible(tenants, unitId, date) {
  return tenants.filter(
    (t) =>
      t.unitId === unitId &&
      t.assignmentStart <= date &&
      (!t.assignmentEnd || t.assignmentEnd >= date),
  );
}
export function parseUtilityText(text) {
  const s = String(text).replace(/\r/g, "");
  const provider = /maynilad/i.test(s)
    ? "Maynilad"
    : /manila\s*water/i.test(s)
      ? "Manila Water"
      : /meralco/i.test(s)
        ? "Meralco"
        : "";
  const accountRef =
    s.match(
      /(?:account(?:\s*(?:number|no\.?))?|reference|customer\s*(?:number|no\.?))\s*[:#-]?\s*([A-Z0-9][A-Z0-9-]{3,})/i,
    )?.[1] ?? "";
  const amount = s.match(
    /(?:total\s*amount\s*due|amount\s*due|total\s*due)\s*[:₱P\s]*(\d[\d,]*(?:\.\d{1,2})?)/i,
  )?.[1];
  const due = s.match(/due\s*date\s*:\s*([^\n]+)/i)?.[1]?.trim();
  const period = s.match(
    /billing\s*period\s*:\s*(\d{4}-\d{2}-\d{2})\s*(?:to|through|–|—|\s-\s)\s*(\d{4}-\d{2}-\d{2})/i,
  );
  const normalizedDate = due
    ? validDate(due)
      ? due
      : Number.isFinite(Date.parse(due))
        ? new Date(due).toISOString().slice(0, 10)
        : null
    : null;
  const conflicts = [];
  const providers = [
    ...s.matchAll(/\b(?:Meralco|Maynilad|Manila\s+Water)\b/gi),
  ].map((m) => m[0].toLowerCase().replace(/\s+/g, " "));
  if (new Set(providers).size > 1) conflicts.push("provider");
  const accounts = [
    ...s.matchAll(
      /(?:account(?:\s*(?:number|no\.?))?|reference|customer\s*(?:number|no\.?))\s*[:#-]?\s*([A-Z0-9][A-Z0-9-]{3,})/gi,
    ),
  ].map((m) => m[1].toUpperCase());
  if (new Set(accounts).size > 1) conflicts.push("accountRef");
  const amounts = [
    ...s.matchAll(
      /(?:total\s*amount\s*due|amount\s*due|total\s*due)\s*[:₱P\s]*(\d[\d,]*(?:\.\d{1,2})?)/gi,
    ),
  ].map((m) => m[1].replaceAll(",", ""));
  if (new Set(amounts.map(Number)).size > 1) conflicts.push("amountDue");
  const dates = [...s.matchAll(/due\s*date\s*:\s*([^\n]+)/gi)].map((m) =>
    m[1].trim(),
  );
  if (new Set(dates).size > 1) conflicts.push("dueDate");
  const periods = [...s.matchAll(/billing\s*period\s*:\s*([^\n]+)/gi)].map(
    (m) => m[1].trim(),
  );
  if (new Set(periods).size > 1) conflicts.push("periodStart", "periodEnd");
  return {
    provider,
    accountRef,
    amountDue: amount ? Number(amount.replaceAll(",", "")) : null,
    dueDate: normalizedDate,
    periodStart: period?.[1] ?? null,
    periodEnd: period?.[2] ?? null,
    billingPeriod: period ? `${period[1]} to ${period[2]}` : null,
    conflicts,
  };
}
