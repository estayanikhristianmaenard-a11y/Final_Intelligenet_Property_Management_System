import test from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, expect } from "@playwright/test";
import { Store } from "../server/store.js";
import { Service } from "../server/service.js";
import { bootstrap } from "../server/bootstrap.js";
import { createApp } from "../server/index.js";

test("all-role page audit: responsive layouts, named controls, typography and runtime errors", {timeout:180000}, async () => {
  const store = new Store(":memory:");
  const password = "LayoutAudit!2026";
  const service = new Service(store);
  bootstrap(service, {adminPassword:password, managerPassword:password, tenantPassword:password, demo:true});
  service.userWrite(store.get("users","usr-admin"), {name:"Layout Staff", email:"staff.audit@example.test", role:"staff", workspaceId:store.get("users","usr-manager").workspaceId, password});
  for (const [index,category] of ["electricity","water"].entries()) store.save("incoming", {
    id:`spacing-source-${index}`,provider:category==="water" ? "Manila Water" : "Meralco",category,
    accountRef:`SPACING-00${index}`,amountDue:660+index,dueDate:"2026-11-08",billingPeriod:"2026-10-01/2026-10-28",
    filename:index ? "long-water-source-file-for-layout-and-wrapping-check.pdf" : "electricity.pdf",
    receivedAt:"2026-11-01T00:00:00.000Z",extractionMethod:"pdf_text",ocrStatus:"failed",extractionError:"Mapping requires review.",
  });
  const origin = "http://127.0.0.1:8109";
  const app = createApp({store, env:{ALLOWED_ORIGINS:origin}});
  await new Promise(resolve => app.server.listen(8109, "127.0.0.1", resolve));
  const records = [], errors = [], issues = [];
  let browser;
  try {
    browser = await chromium.launch({headless:true, ...(process.platform === "win32" ? {executablePath:process.env.BROWSER_EXECUTABLE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"} : {})});
    for (const [role,email,paths] of [
      ["admin","admin@propertypro.ph",["/admin","/admin/audit","/admin/settings","/admin/workspace"]],
      ["manager","manager@propertypro.ph",["/dashboard","/properties","/units","/tenants","/bills","/bills?tab=records","/bills?tab=incoming","/bills?tab=exceptions","/bills?tab=payments","/reports","/settings"]],
      ["staff","staff.audit@example.test",["/dashboard","/properties","/units","/tenants","/bills?tab=incoming","/bills?tab=exceptions","/staff/account"]],
      ["tenant","maria.santos@gmail.com",["/tenant","/tenant/bills","/tenant/notifications","/tenant/settings"]],
    ]) {
      const context = await browser.newContext();
      const page = await context.newPage();
      page.on("pageerror",error => errors.push(`${role}: ${error.message}`));
      await page.goto(origin+"/#/login");
      await page.locator("#login-email").fill(email);
      await page.locator("#login-password").fill(password);
      await page.locator("[data-sign-in]").click();
      await expect(page.locator(".app-shell")).toBeVisible();
      for (const width of [1440,820,390,320]) {
        await page.setViewportSize({width,height:900});
        for (const path of paths) {
          await page.goto(origin+"/#"+path);
          await expect(page.locator("main h1")).toHaveCount(1);
          await expect(page.locator(".skeleton, .skeleton-line")).toHaveCount(0);
          await page.waitForTimeout(100);
          const result = await page.evaluate(() => {
            const visible = element => element.getClientRects().length && getComputedStyle(element).visibility !== "hidden";
            const controls = [...document.querySelectorAll("main button, main a[href], main input, main select")].filter(visible).map(element => ({
              tag:element.tagName, name:element.getAttribute("aria-label") || element.getAttribute("title") || element.textContent.trim().replace(/\s+/g," ") || element.getAttribute("placeholder") || "",
              height:Math.round(element.getBoundingClientRect().height), fontSize:getComputedStyle(element).fontSize,
              attributes:[...element.attributes].filter(a=>a.name.startsWith("data-")).map(a=>`${a.name}=${a.value}`).join(" "),
            }));
            const topbar = getComputedStyle(document.querySelector(".topbar"));
            const hero = document.querySelector(".mint-workspace-hero");
            const luminance = color => (color.match(/[\d.]+/g) ?? []).slice(0,3).map(Number)
              .map(channel => {const value=channel/255; return value<=.04045 ? value/12.92 : ((value+.055)/1.055)**2.4;})
              .reduce((sum,channel,index)=>sum+channel*[.2126,.7152,.0722][index],0);
            const heroLuminance = hero ? [luminance(getComputedStyle(hero).backgroundColor),luminance(getComputedStyle(hero.querySelector("h1")).color)] : null;
            const heroContrast = heroLuminance ? (Math.max(...heroLuminance)+.05)/(Math.min(...heroLuminance)+.05) : null;
            const bottomNav = document.querySelector(".tenant-bottom-nav");
            return {heroContrast,topbarColor:topbar.backgroundColor, topbarImage:topbar.backgroundImage, bottomNavVisible:Boolean(bottomNav && visible(bottomNav)), overflow:document.documentElement.scrollWidth>innerWidth+1, heading:document.querySelector("main h1")?.textContent, headingSize:getComputedStyle(document.querySelector("main h1")).fontSize, controls,
              overflowElements:[...document.querySelectorAll("main *")].filter(visible).filter(e=>e.getBoundingClientRect().right>innerWidth+1 && !e.closest(".table-wrap")).slice(0,8).map(e=>`${e.tagName}.${e.className}`)};
          });
          records.push({role,path,width,...result});
          if (path === "/bills?tab=incoming" && width > 1100) {
            const bills = await page.locator(".ocr-bill:visible").evaluateAll(rows => rows.map(row => {
              const box=element=>element.getBoundingClientRect();
              const main=box(row.querySelector(".ocr-bill__main"));
              const side=box(row.querySelector(".ocr-bill__side"));
              const fields=row.querySelector(".ocr-bill__fields");
              return {sideLeft:side.left,sideTop:side.top,mainRight:main.right,rowTop:box(row).top,
                unusedRight:box(fields).right-box(fields.lastElementChild).right,
                columns:[...fields.children].map(field=>box(field).left)};
            }));
            assert.ok(bills.length>=2, "Spacing checks require multiple rendered incoming bills");
            for (const bill of bills) {
              assert.ok(bill.sideLeft>=bill.mainRight, `${role}: bill actions must use the right column instead of leaving it empty`);
              assert.ok(bill.sideTop-bill.rowTop<=28, `${role}: bill actions must align with the top of the row`);
              assert.ok(bill.unusedRight<=2, `${role}: extracted fields must use the available row width`);
              assert.ok(bill.columns.every((left,index)=>Math.abs(left-bills[0].columns[index])<=2), `${role}: bill detail columns must align across rows`);
            }
          }
          if (path === "/tenant") {
            const intro = await page.locator(".tenant-home-page > .page-header").boundingBox();
            assert.ok(intro.height < 90, `${width}px: Tenant home must not repeat its illustrated greeting as a second full-size header`);
          }
          if (path === "/reports" && width > 1100) {
            const spacing = await page.locator(".report-grid > .card").first().evaluate(card => card.getBoundingClientRect().bottom-card.querySelector(".card__body").getBoundingClientRect().bottom);
            assert.ok(spacing<=2, "Report cards must not stretch into empty space to match a taller neighbor");
          }
          assert.equal(result.topbarColor,"rgb(248, 247, 241)");
          assert.equal(result.topbarImage,"none");
          if (result.heroContrast !== null) assert.ok(result.heroContrast>=4.5,`${role} ${width}px: dashboard heading must remain readable against its background`);
          assert.equal(result.bottomNavVisible, role === "tenant" && width <= 1100);
          if (width > 1100) {
            await expect(page.locator('.sidebar__garden img')).toBeVisible();
            await expect.poll(() => page.locator('.sidebar__garden img').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
          }
          if (width < 720) {
            const small = result.controls.filter(c=>c.tag==="BUTTON" && c.height<44);
            if (small.length) issues.push(`${role} ${path} ${width}px small buttons: ${small.map(c=>c.name+":"+c.height).join(", ")}`);
          }
          if (result.overflow) issues.push(`${role} ${path} ${width}px overflow: ${result.overflowElements.join(", ")}`);
          const unnamed=result.controls.filter(c=>c.tag==="BUTTON" && !c.name);
          if (unnamed.length) issues.push(`${role} ${path}: ${unnamed.length} unnamed buttons`);
          if (process.env.UI_AUDIT_OUTPUT) {
            mkdirSync(process.env.UI_AUDIT_OUTPUT,{recursive:true});
            await page.screenshot({path:join(process.env.UI_AUDIT_OUTPUT,`${role}-${path.replace(/[^a-z0-9]/gi,"_")}-${width}.png`),fullPage:true});
          }
          if (path === "/settings") {
            for (const section of ["mappings","notifications","profile","billing"]) {
              await page.locator(`[data-section="${section}"]`).click();
              await expect(page.locator(`[data-section="${section}"]`)).toHaveClass(/is-active/);
              assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${section} settings ${width}px`);
            }
          }
        }
      }
      await page.setViewportSize({width:1440,height:600});
      await expect(page.locator('.sidebar__garden img')).toBeVisible();
      assert.ok(await page.locator('.sidebar').evaluate(sidebar => {
        const nav = sidebar.querySelector('.sidebar__scroll').getBoundingClientRect();
        const garden = sidebar.querySelector('.sidebar__garden').getBoundingClientRect();
        const footer = sidebar.querySelector('.sidebar__footer').getBoundingClientRect();
        return nav.bottom <= garden.top+1 && garden.bottom <= footer.top+1;
      }), `${role}: plant must not cover navigation or logout on a short display`);
      await page.setViewportSize({width:390,height:600});
      await page.locator('.topbar [data-action="toggle-nav"]').click();
      await expect(page.locator('.sidebar__garden img')).toBeVisible();
      await expect(page.locator('.sidebar__logout')).toBeVisible();
      await page.locator('.sidebar__toggle').click();
      await expect(page.locator('.app-shell')).not.toHaveClass(/is-nav-open/);
      await context.close();
    }
    if (process.env.UI_AUDIT_OUTPUT) writeFileSync(join(process.env.UI_AUDIT_OUTPUT,"inventory.json"),JSON.stringify({records,issues,errors},null,2));
    assert.deepEqual(errors,[]);
    assert.deepEqual(issues,[]);
  } finally {
    await browser?.close();
    await app.close();
  }
});
