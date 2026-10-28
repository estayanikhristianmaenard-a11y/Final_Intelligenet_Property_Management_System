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
  bootstrap(new Service(store), {adminPassword:password, managerPassword:password, tenantPassword:password, demo:true});
  const origin = "http://127.0.0.1:8109";
  const app = createApp({store, env:{ALLOWED_ORIGINS:origin}});
  await new Promise(resolve => app.server.listen(8109, "127.0.0.1", resolve));
  const records = [], errors = [], issues = [];
  let browser;
  try {
    browser = await chromium.launch({headless:true, ...(process.platform === "win32" ? {executablePath:process.env.BROWSER_EXECUTABLE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"} : {})});
    for (const [role,email,paths] of [
      ["admin","admin@propertypro.ph",["/admin","/admin/audit","/admin/settings"]],
      ["manager","manager@propertypro.ph",["/dashboard","/properties","/units","/tenants","/bills","/bills?tab=records","/bills?tab=incoming","/bills?tab=exceptions","/bills?tab=payments","/reports","/settings"]],
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
            const bottomNav = document.querySelector(".tenant-bottom-nav");
            return {topbarColor:topbar.backgroundColor, topbarImage:topbar.backgroundImage, bottomNavVisible:Boolean(bottomNav && visible(bottomNav)), overflow:document.documentElement.scrollWidth>innerWidth+1, heading:document.querySelector("main h1")?.textContent, headingSize:getComputedStyle(document.querySelector("main h1")).fontSize, controls,
              overflowElements:[...document.querySelectorAll("main *")].filter(visible).filter(e=>e.getBoundingClientRect().right>innerWidth+1 && !e.closest(".table-wrap")).slice(0,8).map(e=>`${e.tagName}.${e.className}`)};
          });
          records.push({role,path,width,...result});
          if (width > 1100) assert.equal(result.topbarColor,"rgb(231, 238, 244)");
          else assert.ok(result.topbarImage.includes("linear-gradient"));
          assert.equal(result.bottomNavVisible, role === "tenant" && width <= 1100);
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
