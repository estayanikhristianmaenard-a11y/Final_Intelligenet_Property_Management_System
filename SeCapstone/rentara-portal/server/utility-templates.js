// Provider selectors and explicit account labels. Inspired by template-based
// extraction, authored locally; these do not reconstruct masked identifiers.
const labelledAccount = /\b(?:(?:customer\s+)?account(?:\s*(?:number|no\.?))?(?:\s*\(CAN\))?|reference|customer\s*(?:number|no\.?))\s*[:#]\s*([A-Z0-9*\u2022][A-Z0-9*\u2022-]{3,})/gi;
export const utilityTemplates = [
  {id:"meralco-labelled-v1", provider:"Meralco", match:/\bmeralco\b/i, accounts:[labelledAccount, /\bCAN\s*[:#]\s*([A-Z0-9*\u2022][A-Z0-9*\u2022-]{3,})/gi, /\bcustomer[ \t]+account[ \t]+(?:number|no\.?)\s*\(CAN\)[ \t]*:?[ \t]*(?:Due[ \t]+Date[ \t]*)?\n?[ \t]*([0-9Xx*\u2022]{10})\b/gi]},
  {id:"manila-water-labelled-v1", provider:"Manila Water", match:/\bmanila\s+water\b/i, accounts:[labelledAccount]},
  {id:"maynilad-labelled-v1", provider:"Maynilad", match:/\bmaynilad\b/i, accounts:[labelledAccount]},
];
export function utilityIdentifiers(text, template) {
  return [...new Set((template?.accounts ?? [labelledAccount]).flatMap(pattern => [...text.matchAll(pattern)].map(match => match[1].toUpperCase())))];
}
export function maskedUtilityIdentifier(value) {
  return /[*\u2022]|\d[Xx]+|[Xx]{2,}\d/.test(value);
}

// Printed SOA labels may share an OCR row with the adjacent Bill Date column.
// Read only explicit label/date patterns; never substitute a meter number or SIN.
export function meralcoPrintedFields(text) {
  const date = "(?:\\d{4}-\\d{2}-\\d{2}|\\d{1,2}[ \\t]+[A-Za-z]+[ \\t]+\\d{4}|[A-Za-z]+[ \\t]+\\d{1,2},?[ \\t]+\\d{4})";
  const header = text.match(new RegExp("customer[ \\t]+account[ \\t]+number[ \\t]*\\(CAN\\)[^\\n]*Due[ \\t]+Date[ \\t]*\\n[^\\n]*?\\b([0-9Xx*]{10})[ \\t]+("+date+")", "i"));
  const dueDates = [...text.matchAll(new RegExp("\\bdue[ \\t]+date[ \\t]*:?[ \\t]*\\n?[ \\t]*("+date+")", "gi"))].map(m => m[1].trim());
  if (header) dueDates.push(header[2].trim());
  const periods = [...text.matchAll(new RegExp("\\bbilling[ \\t]+period[ \\t]*(?:[ \\t]+Bill[ \\t]+Date[^\\n]*\\n[ \\t]*|:[ \\t]*|\\n[ \\t]*)("+date+")[ \\t]+(?:to|through|[-\\u2013\\u2014])[ \\t]+("+date+")", "gi"))].map(m => `${m[1].trim()} to ${m[2].trim()}`);
  return {accounts:header ? [header[1]] : [],dueDates,periods};
}
