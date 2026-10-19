const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);

const content = {
  "rent-update": {
    subject: "Rentara: rent billing update",
    title: "Your rent bill is ready",
    message: "Here is a summary of your current rent bill. Open Rentara to view the full breakdown or report a payment.",
    note: "If you have already paid, you can report the payment in the portal for your Manager to check.",
    action: "View bill",
  },
  "rent-reminder": {
    subject: "Rentara: rent due-date reminder",
    title: "A reminder about your rent",
    message: "Your rent is due in three calendar days. Sign in to review the bill and its due date.",
    note: "If you have already paid, report the payment in the portal for your Manager to check. This reminder does not confirm a payment.",
    action: "View bill",
  },
  "rent-confirmed": {
    subject: "Rentara: rent payment confirmed",
    title: "Your rent payment is confirmed",
    message: "Your Manager has confirmed your rent payment. Sign in to view your rent record and any confirmed receipt.",
    note: "This notice reflects the recorded confirmation. It does not collect another payment or issue another receipt.",
    action: "View payment record",
  },
};

export function rentEmailTemplate({ type, name, portalUrl, bill }) {
  const copy = content[type];
  if (!copy) throw new Error("Unsupported rent email type");
  const url = new URL(portalUrl);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Invalid portal URL");
  const greeting = name?.trim() ? `Hello ${name.trim()},` : "Hello,";
  const summary = [];
  if (bill && type !== "rent-confirmed") {
    const amount = Number(bill.totalDue);
    if (Number.isFinite(amount)) summary.push(["Bill total", `PHP ${amount.toLocaleString("en-PH", {minimumFractionDigits:2,maximumFractionDigits:2})}`]);
    if (bill.cycle) summary.push(["Billing month", bill.cycle]);
    if (bill.dueDate) summary.push(["Due date", new Date(`${bill.dueDate}T00:00:00+08:00`).toLocaleDateString("en-PH", {timeZone:"Asia/Manila",year:"numeric",month:"long",day:"numeric"})]);
    const status = {unpaid:"Unpaid",tenant_reported_paid:"Tenant Reported Paid",paid:"Paid"}[bill.paymentStatus];
    if (status) summary.push(["Status",status]);
  }
  const advanceNote = type !== "rent-confirmed" && bill?.lines?.some(line => line.isAdvance) ? "Includes advance rent. View the bill for the separate rent and advance amounts." : "";
  const summaryText = summary.length ? `\n\n${summary.map(([label,value]) => `${label}: ${value}`).join("\n")}${advanceNote ? `\n${advanceNote}` : ""}` : "";
  const summaryHtml = summary.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#f3f6fa;border:1px solid #dce5ef;border-radius:8px;">${summary.map(([label,value]) => `<tr><td style="padding:10px 14px;font-size:13px;line-height:21px;color:#52647a;">${escapeHtml(label)}</td><td style="padding:10px 14px;font-size:14px;line-height:21px;font-weight:bold;text-align:right;color:#17263f;">${escapeHtml(value)}</td></tr>`).join("")}</table>${advanceNote ? `<p style="margin:0 0 24px;font-size:13px;line-height:21px;color:#52647a;">${escapeHtml(advanceNote)}</p>` : ""}` : "";
  const footer = "For questions about your rent, contact your property Manager. Manage rent email preferences in the portal's Settings. Sending this email does not change your payment status.";
  const text = `Rentara\n\n${greeting}\n\n${copy.title}\n\n${copy.message}${summaryText}\n\n${copy.action}:\n${url.href}\n\n${copy.note}\n\n${footer}`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(copy.subject)}</title></head>
<body style="margin:0;padding:0;background:#f3f6fa;color:#17263f;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(copy.message)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fa;"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #dce5ef;border-radius:12px;">
<tr><td style="padding:26px 28px;background:#1c3154;border-radius:12px 12px 0 0;"><span style="font-size:25px;font-weight:bold;letter-spacing:-.5px;color:#ffffff;">Rentara</span><p style="margin:7px 0 0;font-size:13px;line-height:20px;color:#c6d6ef;">Your rent and bills, in one place.</p></td></tr>
<tr><td style="padding:30px 28px;"><p style="margin:0 0 22px;font-size:15px;line-height:24px;">${escapeHtml(greeting)}</p><h1 style="margin:0 0 16px;font-size:25px;line-height:33px;letter-spacing:-.4px;">${escapeHtml(copy.title)}</h1><p style="margin:0 0 24px;font-size:15px;line-height:25px;color:#475569;">${escapeHtml(copy.message)}</p>
${summaryHtml}<table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#2563eb" style="border-radius:7px;text-align:center;"><a href="${escapeHtml(url.href)}" style="display:inline-block;padding:15px 22px;font-size:15px;line-height:20px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:7px;">${escapeHtml(copy.action)}</a></td></tr></table>
<p style="margin:24px 0 0;font-size:13px;line-height:22px;color:#52647a;">${escapeHtml(copy.note)}</p><p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #e2e8f0;font-size:12px;line-height:20px;color:#64748b;">If the button does not open, copy this address into your browser:<br><a href="${escapeHtml(url.href)}" style="color:#2563eb;word-break:break-all;">${escapeHtml(url.href)}</a></p></td></tr>
<tr><td style="padding:20px 28px;background:#f8fafc;border-radius:0 0 12px 12px;border-top:1px solid #e2e8f0;"><p style="margin:0;font-size:12px;line-height:21px;color:#52647a;">${escapeHtml(footer)}</p></td></tr>
</table></td></tr></table></body></html>`;
  return { subject: copy.subject, text, html };
}
