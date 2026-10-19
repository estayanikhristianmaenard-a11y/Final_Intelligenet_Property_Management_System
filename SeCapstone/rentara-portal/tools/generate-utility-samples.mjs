import { mkdirSync, writeFileSync, copyFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { utilityPdf, utilityEmail, scannedUtilityPdf } from "../tests/fixtures.js";
import { philippineDate, addDays, parseUtilityText } from "../server/rules.js";

// Synthetic local fixtures only. This script never opens or changes the database.
const target=fileURLToPath(new URL("../docs/samples/utility-bills/",import.meta.url));
const samplePath=(group,name)=>{
  const directory=join(target,"synthetic",group);
  mkdirSync(directory,{recursive:true});
  return join(directory,name);
};
const today=philippineDate(), due=addDays(today,4), start=today.slice(0,7)+"-01";
const bill=(provider,account,amount)=>`SYNTHETIC DEMO BILL - NOT A REAL PROVIDER DOCUMENT\n${provider}\nAccount: ${account}\nAmount Due: ${amount}\nDue Date: ${due}\nBilling Period: ${start} to ${today}`;
const electricity=bill("Meralco","TEST-MERALCO-001","100.01");
const water=bill("Manila Water","TEST-WATER-001","220.00");
writeFileSync(samplePath("electricity-001","bill-digital.pdf"),utilityPdf(electricity));
writeFileSync(samplePath("water-001","bill-digital.pdf"),utilityPdf(water));
writeFileSync(samplePath("unmapped-account-001","bill-digital.pdf"),utilityPdf(bill("Meralco","TEST-UNMAPPED-999","100.01")));
writeFileSync(samplePath("electricity-001","email-attachment.eml"),utilityEmail(utilityPdf(electricity)));
writeFileSync(samplePath("electricity-001","email-summary.eml"),`From: bills@example.test\r\nTo: property@example.test\r\nSubject: Synthetic bill summary\r\nMessage-ID: <synthetic-summary@example.test>\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${electricity}`);
copyFileSync(new URL("../tests/fixtures/utility.png",import.meta.url),samplePath("electricity-002","bill-image.png"));
writeFileSync(samplePath("electricity-002","bill-scanned.pdf"),await scannedUtilityPdf(readFileSync(new URL("../tests/fixtures/utility.png",import.meta.url))));
const writeCase=(id,text,files)=>{
  const parsed=parseUtilityText(text);
  const expectedFields=Object.fromEntries(["provider","accountRef","amountDue","dueDate","periodStart","periodEnd"].map(key=>[key,parsed[key]]));
  if(Object.values(expectedFields).some(value=>value==null))throw new Error("Incomplete sample fields: "+id);
  writeFileSync(samplePath(id,"case.json"),JSON.stringify({id,origin:"synthetic",independentActualBill:false,expectedFields,
    expectedOutcome:id.startsWith("unmapped-")?"exception_until_account_mapping_is_configured":"valid_with_verified_mapping_and_occupancy",
    files:files.map(([path,method])=>({path,method})),
    duplicateExpectation:"Versions in this case represent one bill; a second accepted version must not create another charge.",
    notes:"Invented development data; not an independently collected provider bill."},null,2)+"\n");
};
writeCase("electricity-001",electricity,[["bill-digital.pdf","pdf_text"],["email-attachment.eml","email_attachment"],["email-summary.eml","email_text"]]);
writeCase("water-001",water,[["bill-digital.pdf","pdf_text"]]);
writeCase("unmapped-account-001",bill("Meralco","TEST-UNMAPPED-999","100.01"),[["bill-digital.pdf","pdf_text"]]);
writeCase("electricity-002","Meralco\nAccount: MER-12345\nAmount Due: 100.00\nDue Date: 2026-03-05\nBilling Period: 2026-02-01 to 2026-02-28",[["bill-image.png","image_ocr"],["bill-scanned.pdf","pdf_ocr"]]);
console.log(`Generated synthetic utility samples for ${today} in docs/samples/utility-bills/synthetic. Anonymized bills are unchanged. No database changes.`);
