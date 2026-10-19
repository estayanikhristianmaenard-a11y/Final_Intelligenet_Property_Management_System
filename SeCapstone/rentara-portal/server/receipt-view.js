const escape = value => String(value ?? "—").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);

// Render the original payment snapshot on demand; no receipt file is stored.
export function renderRentReceipt(receipt) {
  const amount = `PHP ${Number(receipt.amount).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const confirmed = new Date(receipt.confirmedOn);
  const confirmedOn = Number.isNaN(confirmed.getTime()) ? receipt.confirmedOn : confirmed.toLocaleString("en-PH",{timeZone:"Asia/Manila",year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
  const field = (label,value) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Rent receipt ${escape(receipt.id)}</title><style>
  *{box-sizing:border-box}body{margin:0;background:#fff;color:#000;font:14px/1.5 Arial,sans-serif}.receipt{max-width:460px;margin:0 auto;padding:28px 24px}header{text-align:center;border-bottom:1px solid #000;padding-bottom:18px}.brand{font-size:20px;font-weight:700}h1{font-size:16px;margin:6px 0 12px}p{margin:4px 0}.reference{font:12px/1.5 ui-monospace,monospace;overflow-wrap:anywhere}dl{margin:18px 0}dl>div{display:grid;grid-template-columns:110px minmax(0,1fr);gap:16px;margin:10px 0}dt{color:#000}dd{margin:0;overflow-wrap:anywhere}.total{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px 16px;padding:16px 0;border-top:1px dashed #000;border-bottom:1px dashed #000;font-weight:700}.amount{font-size:20px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;min-width:0}footer{margin-top:18px;color:#000;font-size:12px}footer dl{margin:0 0 14px}footer dl>div{margin:6px 0}@media(max-width:360px){.receipt{padding:20px 16px}dl>div{grid-template-columns:90px minmax(0,1fr);gap:12px}}@media print{@page{margin:12mm}.receipt{padding:0;break-inside:avoid}}
  </style></head><body><main class="receipt"><header><div class="brand">Rentara</div><h1>Rent payment receipt</h1><p class="reference">${escape(receipt.id)}</p></header>
  <dl>${field("Received from",receipt.tenantName)}${field("Payment date",receipt.paymentDate ?? "Not recorded")}${field("For","Rent payment")}${field("Method",String(receipt.method ?? "").replaceAll("_"," "))}${receipt.reference ? field("Reference",receipt.reference) : ""}</dl>
  <div class="total"><span>Amount received</span><span class="amount">${escape(amount)}</span></div>
  <footer><dl>${field("Confirmed by",receipt.confirmedBy)}${field("Confirmed on",`${confirmedOn} (PH)`)}${field("Bill reference",receipt.billId)}</dl><p>Manager-confirmed rent payment. Keep this receipt for your records.</p></footer></main></body></html>`;
}
