import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { Store } from "../server/store.js";
import { Service } from "../server/service.js";
import { Integrations } from "../server/integrations.js";
import { bootstrap } from "../server/bootstrap.js";
import { parseUtilityText } from "../server/rules.js";

const fixture = name => readFileSync(new URL(`../docs/samples/utility-bills/anonymized/meralco-001/${name}`, import.meta.url));
const expected = {provider:"Meralco",accountRef:"9990000001",amountDue:1567.17,dueDate:"2026-10-08",periodStart:"2026-08-27",periodEnd:"2026-09-26"};

test("anonymized actual-layout Meralco PDF and raster scan extract all five fields, allocate and hold cross-format duplicates", {timeout:120000}, async () => {
  const dir=mkdtempSync(join(tmpdir(),"rentara-meralco-soa-"));
  const store=new Store(":memory:"),service=new Service(store),integration=new Integrations(service,dir,{});
  try {
    bootstrap(service,{adminPassword:"TestOnly!2026",managerPassword:"TestOnly!2026",tenantPassword:"TestOnly!2026",demo:true,demoStart:"2026-08-01"});
    store.save("mappings",{...store.get("mappings","map-demo"),account:expected.accountRef});
    const digital=fixture("bill-digital.pdf"),scan=fixture("bill-scanned.pdf");
    for(const [bytes,method] of [[digital,"pdf_text"],[scan,"pdf_ocr"]]) {
      const result=await integration.extract(bytes,"application/pdf");
      assert.equal(result.method,method);
      const fields=parseUtilityText(result.text);
      for(const [key,value] of Object.entries(expected)) assert.equal(fields[key],value,`${method}: ${key}`);
      assert.deepEqual(fields.conflicts,[]);
    }
    // Ingest the actual OCR scan first: it must finalize from real recognition.
    const accepted=await integration.ingest(scan,"synthetic-meralco-scan.pdf","application/pdf");
    assert.equal(accepted.document.ocrStatus,"validated",JSON.stringify(accepted.failures));
    const bills=store.all("bills").filter(b=>b.sourceId===accepted.document.id);
    assert.equal(bills.length,3);
    assert.equal(bills.reduce((sum,b)=>sum+Math.round(b.totalDue*100),0),156717);
    const before=store.all("bills").length;
    const copy=await integration.ingest(digital,"synthetic-meralco-digital.pdf","application/pdf");
    assert.equal(copy.document.ocrStatus,"failed");
    assert.ok(copy.failures.some(f=>f.rule==="V04"));
    assert.equal(store.all("bills").length,before);
  } finally {
    await integration.close();store.close();
    if(dirname(resolve(dir))!==resolve(tmpdir()))throw new Error("Unexpected test cleanup location");
    rmSync(dir,{recursive:true,force:true});
  }
});

test("printed Meralco parsing holds conflicting dates, periods and masked CAN without substituting SIN", () => {
  const text="Meralco\nCustomer Account Number (CAN) Due Date\nBilling Period Bill Date 9990000001 08 Oct 2026\n27 Aug 2026 to 26 Sep 2026 26 Sep 2026\nTotal Amount Due ? 1,567.17";
  assert.deepEqual(parseUtilityText(text).conflicts,[]);
  assert.ok(parseUtilityText(text+"\nDue Date: 09 Oct 2026").conflicts.includes("dueDate"));
  assert.ok(parseUtilityText(text+"\nBilling Period: 01 Sep 2026 to 30 Sep 2026").conflicts.includes("periodStart"));
  const masked=parseUtilityText(text.replace("9990000001","9990000XXX")+"\nSIN: 12345678901");
  assert.ok(masked.conflicts.includes("accountRef"));
  assert.notEqual(masked.accountRef,"12345678901");
});
