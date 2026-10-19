import { utilityTemplates, utilityIdentifiers, maskedUtilityIdentifier, meralcoPrintedFields } from "./utility-templates.js";

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
// OCR dates must identify a real calendar day without locale-dependent guessing.
function utilityDate(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return validDate(value) ? value : null;
  const monthNames = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  const monthFirst = value.match(/^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/);
  const dayFirst = value.match(/^(\d{1,2})\s+([A-Za-z]+)\.?[,]?\s+(\d{4})$/);
  const monthName = monthFirst?.[1] ?? dayFirst?.[2];
  if (
    !monthName ||
    !/^(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)$/i.test(
      monthName,
    )
  )
    return null;
  const month = monthNames.indexOf(monthName.slice(0, 3).toLowerCase()) + 1;
  const day = monthFirst?.[2] ?? dayFirst?.[1];
  const year = monthFirst?.[3] ?? dayFirst?.[3];
  const date = `${year}-${String(month).padStart(2, "0")}-${day.padStart(2, "0")}`;
  return validDate(date) ? date : null;
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
  const template = utilityTemplates.find(item => item.provider === provider);
  const printed = provider === "Meralco" ? meralcoPrintedFields(s) : {accounts:[],dueDates:[],periods:[]};
  const accounts = [...new Set([...utilityIdentifiers(s, template),...printed.accounts])];
  const accountRef = accounts[0] ?? "";
  // Capture the complete token before checking precision and thousands separators.
  const amountMatches = [
    ...s.matchAll(
      /(?:total\s*amount\s*due|amount\s*due|total\s*due)\s*:?\s*(?:PHP|\u20b1|\ufffd|\?|P)?\s*([+-]?\d[\d,.]*)/gi,
    ),
  ];
  const amounts = amountMatches.map((m) =>
    /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(m[1])
      ? Number(m[1].replaceAll(",", ""))
      : null,
  );
  const amount = amounts[0] ?? null;
  // Printed SOAs put values below labels and repeat the period in a page header.
  // Only Meralco's explicit printed date layout gets this additional path.
  const printedDueDates = printed.dueDates;
  const due = s.match(/due\s*date\s*:\s*([^\n]+)/i)?.[1]?.trim() ?? printedDueDates[0];
  const periodPattern = /billing\s*period\s*:\s*([^\n]+)/gi;
  const periodTexts = [...s.matchAll(periodPattern)].map(match => {
    const value = match[1].trim();
    return provider === "Meralco" ? value.replace(/[ \t]+(?:Print[ \t]+Seq\.?|P?age[ \t]+\d+[ \t]*(?:of|0f)[ \t]*\d+)\b.*$/i, "").trim() : value;
  });
  periodTexts.push(...printed.periods);
  const periods = periodTexts.map(value => {
    const parts = value.match(/^(.+?)\s+(?:to|through|[-\u2013\u2014])\s+(.+)$/i);
    return parts ? [utilityDate(parts[1].trim()), utilityDate(parts[2].trim())] : [null,null];
  });
  const period = periods[0];
  const normalizedDate = utilityDate(due);
  const conflicts = [];
  const providers = [
    ...s.matchAll(/\b(?:Meralco|Maynilad|Manila\s+Water)\b/gi),
  ].map((m) => m[0].toLowerCase().replace(/\s+/g, " "));
  if (new Set(providers).size > 1) conflicts.push("provider");
  if (accounts.length > 1 || maskedUtilityIdentifier(accountRef)) conflicts.push("accountRef");
  if (amounts.some((value) => value === null) || new Set(amounts).size > 1)
    conflicts.push("amountDue");
  const dates = [...s.matchAll(/due\s*date\s*:\s*([^\n]+)/gi)].map((m) =>
    m[1].trim(),
  );
  if (new Set(dates).size > 1) conflicts.push("dueDate");
  if (new Set(printedDueDates.map(utilityDate)).size > 1 && !conflicts.includes("dueDate")) conflicts.push("dueDate");
  if (periods.some(pair => pair.some(value => !value)) || new Set(periods.map(pair => pair.join(" to "))).size > 1) conflicts.push("periodStart", "periodEnd");
  return {
    provider,
    accountRef,
    amountDue: amount,
    dueDate: normalizedDate,
    periodStart: period?.[0] ?? null,
    periodEnd: period?.[1] ?? null,
    billingPeriod: period?.every(Boolean) ? `${period[0]} to ${period[1]}` : null,
    extractionTemplate: template?.id ?? "labelled-utility-v1",
    conflicts,
  };
}
