// Refresh current UI/email PNGs against disposable synthetic data, never .env/data.
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium, expect as baseExpect } from "@playwright/test";
import { createShowcase } from "../server/demo-showcase.js";
import { createApp } from "../server/index.js";
import { rentEmailTemplate } from "../server/rent-email-template.js";
import { submitProposal, decideProposal } from "../server/staff-workflow.js";
import { renderRentReceipt } from "../server/receipt-view.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const expect = baseExpect.configure({timeout:15000});
const reports = resolve(root, "../reports");
const output = join(reports, "mockups");
const temp = await mkdtemp(join(tmpdir(), "rentara-design-"));
const records = [], errors = [];
let app, browser;
try {
  await mkdir(output, { recursive:true });
  await createShowcase(temp);
  const origin = "http://127.0.0.1:8113";
  app = createApp({ dataDir:temp, env:{ALLOWED_ORIGINS:origin} });
  app.service.userWrite(app.store.get("users", "usr-admin"), { name:"Demo Operations Staff", email:"staff.preview@example.test", role:"staff", workspaceId:app.store.get("users", "usr-manager").workspaceId, password:"LocalDemo!2026" });
  const imageReview = await app.integrations.ingest(await readFile(join(root,"docs/samples/utility-bills/synthetic/electricity-002/bill-image.png")),"DEMO-clear-OCR-bill.png","image/png");
  // Illustrate the implemented queues using disposable sources only. No approval
  // or financial mutation is performed; the working portfolio is never opened.
  const previewStaff = app.store.all("users").find(u => u.email === "staff.preview@example.test");
  const blocked = app.store.all("incoming").filter(d => d.ocrStatus === "failed" && d.id !== imageReview.document.id && !app.store.all("bills").some(b => b.sourceId === d.id));
  for (const [index, source] of blocked.slice(0,2).entries()) {
    const proposal = submitProposal(app.service, previewStaff, source.id, { changes:{amountDue:Number(source.amountDue ?? 0)+1}, reason:"Synthetic preview: compare the proposed amount against the original source." });
    if (index === 1) decideProposal(app.service, app.store.get("users","usr-manager"), proposal.id, {decision:"reject",reason:"Recheck the amount against the original source before resubmitting."});
  }
  await new Promise((resolve,reject) => { app.server.once("error",reject); app.server.listen(8113, "127.0.0.1", resolve); });
  browser = await chromium.launch({headless:true, ...(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : process.platform === "win32" ? {executablePath:"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"} : {})});
  const context = await browser.newContext({viewport:{width:1440,height:1000}, reducedMotion:"reduce"});
  const page = await context.newPage();
  page.on("pageerror", error => errors.push(error.message));
  const capture = async (filename, width, height, label, {loading=false} = {}) => {
    await page.setViewportSize({width,height});
    if (!loading) await expect(page.locator(".skeleton, .skeleton-line")).toHaveCount(0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1), `${filename}: page overflow`);
    await page.screenshot({path:join(output,filename),fullPage:false});
    records.push({file:filename,width,height,label});
  };
  await page.goto(origin+"/#/login");
  await expect(page.locator("#login-email")).toBeVisible();
  await capture("07-login-desktop.png",1440,1000,"Demo login / desktop");
  await capture("08-login-mobile.png",390,844,"Demo login / phone");
  for (const [role,email,shots] of [
    ["manager","manager@propertypro.ph",[
      ["01-manager-dashboard.png","/dashboard",1440,1000],
      ["02-property-management.png","/properties",1440,1000],
      ["03-billing-management.png","/bills",1440,1000],
      ["09-manager-bill-review.png","/bills?tab=incoming",1440,1000],
      ["10-manager-settings.png","/settings",1440,1000],
      ["47-manager-decisions-mobile.png","/bills?tab=exceptions&queue=manager",390,844],
      ["31-manager-units.png","/units",1440,1000],
      ["32-manager-tenants.png","/tenants",1440,1000],
      ["33-manager-reports.png","/reports",1440,1000],
    ]],
    ["staff","staff.preview@example.test",[
      ["43-staff-dashboard.png","/dashboard",1440,1000],
      ["44-staff-exceptions-mobile.png","/bills?tab=exceptions",390,844],
      ["45-staff-account-mobile.png","/staff/account",390,844],
      ["46-staff-intake-mobile.png","/bills?tab=incoming",390,844],
    ]],
    ["tenant","maria.santos@gmail.com",[
      ["04-tenant-dashboard.png","/tenant",1440,1000],
      ["06-mobile-tenant.png","/tenant",390,844],
      ["11-tenant-bills-mobile.png","/tenant/bills",390,844],
      ["12-tenant-alerts-mobile.png","/tenant/notifications",390,844],
      ["13-tenant-settings-mobile.png","/tenant/settings",390,844],
      ["14-tenant-tablet.png","/tenant",820,1000],
    ]],
    ["manager-b","manager2@example.test",[["29-independent-manager-workspace.png","/dashboard",1440,1000]]],
    ["tenant-b","luis.garcia@example.test",[["30-independent-tenant-workspace.png","/tenant",390,844]]],
    ["admin","admin@propertypro.ph",[
      ["05-admin-dashboard.png","/admin",1440,1000],
      ["41-admin-status-mobile.png","/admin",390,844],
      ["42-admin-status-evidence.png","/admin",1440,1000],
      ["34-admin-audit.png","/admin/audit",1440,1000],
      ["35-admin-workspaces-accounts.png","/admin/settings",1440,1000],
      ["40-admin-audit-older-records.png","/admin/audit?page=2",1440,1000],
    ]],
  ]) {
    if (role === "admin") for (let i=0;i<85;i++) app.store.save("audit",{id:`preview-history-${String(i).padStart(3,"0")}`,actor:"Demo Manager",role:"manager",action:"Demo audit event",target:"Synthetic history for pagination preview",at:new Date(Date.now()-i*60000).toISOString()});
    await page.goto(origin+"/#/login");
    await page.locator("#login-email").fill(email);
    await page.locator("#login-password").fill("LocalDemo!2026");
    await page.locator("[data-sign-in]").click();
    await expect(page.locator(".app-shell")).toBeVisible();
    for (const [file,path,width,height] of shots) {
      await page.setViewportSize({width,height});
      await page.goto(origin+"/#"+path);
      await expect(page.locator("main h1")).toHaveCount(1);
      await expect(page.locator(".skeleton, .skeleton-line")).toHaveCount(0);
      await page.mouse.move(width-20,100);
      if (file === "09-manager-bill-review.png") {
        await page.locator(`[data-review-ocr="${imageReview.document.id}"]`).click();
        await expect(page.locator(".source-review")).toBeVisible();
        await expect(page.locator(".source-review__image")).toBeVisible();
        await page.locator(".source-review__image").evaluate(image => image.decode());
      }
      if (file === "42-admin-status-evidence.png") await page.locator(".service-evidence").first().evaluate(el=>el.open=true);
      if (file === "46-staff-intake-mobile.png" || file === "47-manager-decisions-mobile.png") {
        await page.locator(file.startsWith("46") ? ".intake-toolbar" : ".proposal-panel").evaluate(el => window.scrollTo({top:window.scrollY+el.getBoundingClientRect().top-90,behavior:"instant"}));
      }
      await capture(file,width,height,`${role} ${path}`);
      if (file === "09-manager-bill-review.png") {
        await page.setViewportSize({width:390,height:844});
        await page.locator('[data-edit-source-field="amountDue"]').click();
        await page.locator('input[name="value"]').scrollIntoViewIfNeeded();
        await capture("36-manager-ocr-review-mobile.png",390,844,"Inline OCR correction / phone");
        await page.getByRole("button",{name:"Close dialog",exact:true}).click();
      }
    }
    if (role === "staff") {
      // Review an actual unfinalized source in the shared case workspace.
      const source = blocked[1] ?? imageReview.document;
      await page.goto(origin+`/#/bills?tab=exceptions&case=${source.id}`);
      await page.locator("[data-case-prepare]").click();
      await expect(page.locator(".case-sheet .source-review__original")).toBeVisible();
      await expect(page.getByRole("link",{name:"Download original",exact:true})).toBeVisible();
      await page.setViewportSize({width:1440,height:1000});
      await page.locator("[data-case-comparison]").evaluate(el=>window.scrollTo({top:window.scrollY+el.getBoundingClientRect().top-90,behavior:"instant"}));
      await capture("48-staff-source-comparison.png",1440,1000,"Staff Case Sheet / original beside proposed fields");
      await capture("49-staff-source-comparison-mobile.png",390,844,"Staff Case Sheet / stacked phone source review");
      await page.getByRole("button",{name:"Cancel correction",exact:true}).click();
    }
    if (role === "manager") {
      await page.goto(origin+"/#/settings");
      await page.locator('[data-section="profile"]').click();
      const profileName=page.locator('[name="name"]');
      await profileName.fill((await profileName.inputValue())+" (unsaved)");
      await capture("39-manager-unsaved-changes.png",1440,1000,"Unsaved profile changes / Cancel and Save");
      await page.getByRole("button",{name:"Cancel changes",exact:true}).click();
      await page.goto(origin+"/#/bills?tab=incoming");
      await page.getByRole("button",{name:"Upload source",exact:true}).click();
      await page.locator('.modal input[type="file"]').setInputFiles(join(root,"docs/samples/utility-bills/synthetic/electricity-002/bill-image.png"));
      let releaseUpload;
      const uploadGate=new Promise(resolve=>{releaseUpload=resolve;});
      await page.route("**/api/v1/intake/upload",async route=>{await uploadGate;await route.fulfill({status:422,contentType:"application/json",body:JSON.stringify({message:"Preview-only paused upload; no bill saved."})});});
      try {
        await page.locator("[data-upload]").click();
        await expect(page.locator("[data-upload-progress]")).toBeVisible();
        await capture("38-manager-processing-mobile.png",390,844,"Bill-processing state / response deliberately paused");
      } finally {releaseUpload();}
      await expect(page.locator("[data-upload]")).toBeEnabled();
      await page.unroute("**/api/v1/intake/upload");
      await page.evaluate(async()=>{const {closeModal}=await import("/src/components/modal.js");closeModal();});
      await page.goto(origin+"/#/bills?tab=payments");
      await expect(page.locator("[data-confirm-payment]").first()).toBeVisible();
      await capture("15-rent-payment-review.png",1440,1000,"Manager reviews a reported rent payment");
      await page.locator("[data-confirm-payment]").first().click();
      await expect(page.locator("[data-confirm-payment]")).toHaveCount(0);
      await capture("16-rent-payment-confirmed.png",1440,1000,"Manager-confirmed payment and original receipt reference");
    }
    if (role === "tenant") {
      await page.goto(origin+"/#/tenant/bills");
      await page.locator('.receipt-archive > summary').click();
      for (const [file,width,height] of [["27-receipt-list-desktop.png",1440,1000],["28-receipt-list-mobile.png",390,844]]) {
        await page.setViewportSize({width,height});
        await page.locator('.tenant-receipt-list').scrollIntoViewIfNeeded();
        await capture(file,width,height,"Receipt list / spaced amounts and actions");
      }
      await page.locator('[data-view-receipt]').first().click();
      await expect(page.frameLocator('iframe[title="Confirmed rent receipt"]').getByRole('heading',{name:'Rent payment receipt'})).toBeVisible();
      await capture("25-receipt-view-mobile.png",390,844,"Protected receipt preview / no download required");
      await capture("26-receipt-view-desktop.png",1440,1000,"Protected receipt preview with Print and Download");
      await page.getByRole("button",{name:"Close dialog",exact:true}).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await page.goto(origin+"/#/tenant");
      await page.locator('[data-calendar-month="1"]').click();
      await page.locator('.tenant-calendar__day.has-estimate').click();
      await page.setViewportSize({width:390,height:844});
      await page.locator('.tenant-calendar').evaluate(element => window.scrollTo({top:element.getBoundingClientRect().top+window.scrollY-80,behavior:"instant"}));
      await capture("23-calendar-next-month-mobile.png",390,844,"Next-month rent estimate / icons / no predicted utilities");
      await page.setViewportSize({width:1440,height:1000});
      await page.evaluate(() => window.scrollTo(0,0));
      await capture("24-calendar-next-month-desktop.png",1440,1000,"Next-month scheduled rent, separate from actual current bills");
      await page.goto(origin+"/#/tenant");
      await page.locator('[data-action="report-payment"]').click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await capture("17-tenant-rent-report.png",390,844,"Tenant rent-report dialog; not submitted");
      await page.getByRole("button",{name:"Close dialog",exact:true}).click();
      await page.goto(origin+"/#/tenant/bills");
      if (!(await page.locator(".tenant-filter-disclosure").evaluate(el=>el.open))) await page.locator(".tenant-filter-disclosure > summary").click();
      await capture("37-tenant-bill-filters-mobile.png",390,844,"Expanded mobile bill filters / active count");
      await page.locator('[data-history-filter="category"]').selectOption("electricity");
      await page.locator('[data-history-filter="status"]').selectOption("paid");
      await expect(page.getByText("No bills match your filters",{exact:true})).toBeVisible();
      await capture("20-tenant-no-matching-bills.png",390,844,"Empty filter result with Reset filters recovery");
      await page.goto(origin+"/#/tenant");
      await expect(page.locator("main h1")).toHaveText("My home");
      const billsRoute = "**/api/v1/tenants/*/bills";
      let release;
      const gate = new Promise(resolve => { release=resolve; });
      await page.route(billsRoute,async route => {await gate; await route.continue();});
      try {
        await page.goto(origin+"/#/tenant/bills");
        await expect(page.locator(".skeleton").first()).toBeVisible();
        await capture("21-tenant-bills-loading.png",390,844,"Loading state / deliberately paused test response",{loading:true});
      } finally { release(); }
      await expect(page.locator(".skeleton")).toHaveCount(0);
      await page.unroute(billsRoute);
      await page.goto(origin+"/#/tenant");
      await expect(page.locator("main h1")).toHaveText("My home");
      await page.route(billsRoute,route => route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({message:"Demo: billing records temporarily unavailable. Please try again."})}));
      await page.goto(origin+"/#/tenant/bills");
      await expect(page.locator("[data-retry-bills]")).toBeVisible();
      await capture("22-tenant-bills-error.png",390,844,"Recoverable error / deliberately simulated 503 response");
      await page.unroute(billsRoute);
    }
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
  }
  const receiptPage = await context.newPage();
  await receiptPage.setContent(renderRentReceipt(app.store.all("receipts")[0]));
  for (const [file,width,height] of [["18-rent-receipt-desktop.png",1100,1050],["19-rent-receipt-mobile.png",390,844]]) {
    await receiptPage.setViewportSize({width,height});
    assert.ok(await receiptPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await receiptPage.screenshot({path:join(output,file),fullPage:true});
    records.push({file,width,height,label:"Original confirmed-payment receipt / full document"});
  }
  await receiptPage.close();
  const emailFolder = join(reports,"email-previews");
  await mkdir(emailFolder,{recursive:true});
  for (const type of ["rent-update","rent-reminder","rent-confirmed"]) {
    const message = rentEmailTemplate({type,name:"Maria Santos",portalUrl:"https://rentara.example/#/tenant/bills",bill:{totalDue:6000,cycle:"2026-10",dueDate:"2026-10-18",paymentStatus:type==="rent-confirmed"?"paid":"unpaid",lines:[{category:"rent",amount:6000}]}});
    const file = join(emailFolder,`${type}.html`);
    await writeFile(file,message.html);
    await writeFile(join(emailFolder,`${type}.txt`),`From: Rentara <rentara2026@gmail.com>\nSubject: ${message.subject}\n\n${message.text}`);
    await page.goto(pathToFileURL(file).href);
    await page.setViewportSize({width:740,height:950});
    await page.screenshot({path:join(emailFolder,`${type}.png`),fullPage:true});
    await page.setViewportSize({width:320,height:800});
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${type}: email overflow`);
  }
  const branding = join(reports,"branding/icon-options");
  await page.goto(pathToFileURL(join(branding,"preview.html")).href);
  await page.setViewportSize({width:1440,height:1050});
  await page.evaluate(() => Promise.all([...document.images].map(img => img.decode())));
  await page.screenshot({path:join(branding,"RENTARA_ICON_OPTIONS.png"),fullPage:true});
  assert.deepEqual(errors,[]);
  await writeFile(join(output,"manifest.json"),JSON.stringify({capturedAt:new Date().toISOString(),source:"Current local code; isolated synthetic showcase; no external delivery",records},null,2)+"\n");
  await writeFile(join(output,"README.md"),`# Current Rentara interface previews\n\nCaptured from the implemented portal using isolated synthetic data. These are current UI screenshots, not participant evaluation or evidence of live provider delivery. The working database and local configuration are not changed.\n\nRegenerate from the portal directory with \`npm.cmd run previews:refresh\`. This also refreshes [email previews](../email-previews) and the [icon comparison](../branding/icon-options). Earlier design concepts and the old mockup PDF are under [reports/archive](../archive).\n\n| Screenshot | Screen | Viewport |\n| --- | --- | --- |\n${records.map(r=>`| [${r.file}](${r.file}) | ${r.label} | ${r.width} × ${r.height} |`).join("\n")}\n\nCapture time and dimensions are recorded in [manifest.json](manifest.json). OCR sample PNGs remain test documents and are not UI screenshots.\n`);
  console.log(`Refreshed ${records.length} UI screenshots, 3 email PNGs and the icon comparison. No working data/configuration changed; no messages sent.`);
} catch (error) {
  if (errors.length) console.error("Browser errors:", errors);
  throw error;
} finally {
  await browser?.close();
  await app?.close();
  // Only the directory created by mkdtemp above is eligible for removal.
  assert.ok(resolve(temp).startsWith(resolve(tmpdir())+"\\") || resolve(temp).startsWith(resolve(tmpdir())+"/"));
  await rm(temp,{recursive:true,force:true});
}
