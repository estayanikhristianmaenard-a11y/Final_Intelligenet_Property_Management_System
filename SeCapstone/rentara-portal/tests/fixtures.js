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

// Synthetic image-only PDF; no text layer and no OCR stub.
export async function scannedUtilityPdf(imageBuffer, {pages=1, oversized=false} = {}) {
  const {createCanvas,loadImage} = await import("@napi-rs/canvas");
  const image = await loadImage(imageBuffer);
  const canvas = createCanvas(image.width,image.height);
  const context = canvas.getContext("2d");
  context.fillStyle="white"; context.fillRect(0,0,image.width,image.height); context.drawImage(image,0,0);
  const jpeg = canvas.toBuffer("image/jpeg");
  const width = oversized ? 5000 : image.width/2;
  const height = oversized ? 5000 : image.height/2;
  const objects = [
    Buffer.from("<< /Type /Catalog /Pages 2 0 R >>"),
    Buffer.from(`<< /Type /Pages /Kids [${Array.from({length:pages},(_,index)=>`${4+index*2} 0 R`).join(" ")}] /Count ${pages} >>`),
    Buffer.concat([Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`),jpeg,Buffer.from("\nendstream")]),
  ];
  for (let index=0;index<pages;index++) {
    const stream = `q ${width} 0 0 ${height} 0 0 cm /Im1 Do Q`;
    objects.push(Buffer.from(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im1 3 0 R >> >> /Contents ${5+index*2} 0 R >>`));
    objects.push(Buffer.from(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`));
  }
  const chunks=[Buffer.from("%PDF-1.4\n")], offsets=[0];
  let size=chunks[0].length;
  objects.forEach((object,index)=>{offsets.push(size); const chunk=Buffer.concat([Buffer.from(`${index+1} 0 obj\n`),object,Buffer.from("\nendobj\n")]);chunks.push(chunk);size+=chunk.length;});
  chunks.push(Buffer.from(`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(offset=>`${String(offset).padStart(10,"0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${size}\n%%EOF`));
  return Buffer.concat(chunks);
}
