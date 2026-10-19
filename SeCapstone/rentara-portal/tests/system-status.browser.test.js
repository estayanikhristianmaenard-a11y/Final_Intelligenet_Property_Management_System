import test from "node:test";
import assert from "node:assert/strict";
import {chromium,expect} from "@playwright/test";
import {Store} from "../server/store.js";
import {Service} from "../server/service.js";
import {bootstrap} from "../server/bootstrap.js";
import {createApp} from "../server/index.js";

test("Admin status refresh stays single-request, exposes evidence and isolates failed sections",{timeout:60000},async()=>{
  const store=new Store(":memory:"),password="StatusBrowser!2026";
  bootstrap(new Service(store),{adminPassword:password,managerPassword:password,tenantPassword:password,demo:true});
  const origin="http://127.0.0.1:8118",app=createApp({store,env:{ALLOWED_ORIGINS:origin}});
  await new Promise(resolve=>app.server.listen(8118,"127.0.0.1",resolve));
  let browser;
  try {
    browser=await chromium.launch({headless:true,...(process.platform==="win32"?{executablePath:process.env.BROWSER_EXECUTABLE||"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"}:{})});
    const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"});
    const errors=[];page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin+"/#/login");
    await page.locator("#login-email").fill("admin@propertypro.ph");
    await page.locator("#login-password").fill(password);
    await page.locator("[data-sign-in]").click();
    await expect(page.locator("#services-title")).toHaveText("System status");
    await page.locator(".service-evidence summary").first().click();
    await expect(page.locator(".service-evidence[open]")).toContainText("SQLite SELECT 1");
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    let getCount=0,postCount=0,release;
    const gate=new Promise(resolve=>{release=resolve;});
    page.on("request",request=>{if(request.url().endsWith("/admin/services"))getCount++;});
    await page.route("**/api/v1/admin/status",async route=>{postCount++;await gate;await route.continue();});
    const refresh=page.locator("[data-refresh-status]");
    try {
      await refresh.click();
      await expect(refresh).toBeDisabled();
      assert.equal(postCount,1);
    } finally {release();}
    await expect(page.locator("#toast-root")).toContainText("Status refreshed");
    assert.equal(getCount,0,"POST snapshot is reused without another status request");
    await expect(refresh).toBeFocused();
    await page.unroute("**/api/v1/admin/status");
    const checked=await page.locator(".system-status-checked").textContent();
    await page.route("**/api/v1/admin/status",r=>r.fulfill({status:503,contentType:"application/json",body:'{"message":"Controlled failure"}'}));
    await refresh.click();
    await expect(page.locator("#toast-root")).toContainText("Status could not be refreshed");
    assert.equal(await page.locator(".system-status-checked").textContent(),checked);
    await page.route("**/api/v1/admin/services",r=>r.fulfill({status:503,contentType:"application/json",body:'{"message":"Controlled failure"}'}));
    await page.reload();
    await expect(page.locator("main")).toContainText("System status unavailable");
    await expect(page.locator("main")).toContainText("User accounts");
    await expect(page.locator("#audit-title")).toBeVisible();
    assert.deepEqual(errors,[]);
  } finally {await browser?.close();await app.close();}
});
