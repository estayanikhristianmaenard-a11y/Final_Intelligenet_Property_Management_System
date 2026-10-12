export const utilityText =
  "Meralco\nAccount: MER-12345\nAmount Due: 100.00\nDue Date: 2026-03-05\nBilling Period: 2026-02-01 to 2026-02-28";

// A real digital PDF with a Helvetica text layer, generated without an OCR stub.
export function utilityPdf(text = utilityText) {
  const content =
    "BT /F1 16 Tf 50 750 Td " +
    text
      .split("\n")
      .map(
        (line, i) =>
          (i ? "0 -30 Td " : "") +
          "(" +
          line.replace(/[\\()]/g, "\\$&") +
          ") Tj",
      )
      .join("\n") +
    " ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 900 850] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n",
    offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf +=
    `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` +
    offsets
      .slice(1)
      .map((n) => String(n).padStart(10, "0") + " 00000 n \n")
      .join("") +
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}
export function utilityEmail(pdf = utilityPdf()) {
  return Buffer.from(
    "From: bills@example.test\r\nTo: propertymanager@example.test\r\nSubject: Utility statement\r\nMessage-ID: <test-bill@example.test>\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=propertypro\r\n\r\n--propertypro\r\nContent-Type: text/plain\r\n\r\nSee attached.\r\n--propertypro\r\nContent-Type: application/pdf\r\nContent-Disposition: attachment; filename=bill.pdf\r\nContent-Transfer-Encoding: base64\r\n\r\n" +
      pdf.toString("base64") +
      "\r\n--propertypro--\r\n",
  );
}
