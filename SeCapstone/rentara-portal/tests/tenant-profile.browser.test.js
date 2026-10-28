import test from "node:test";
import assert from "node:assert/strict";
import {chromium,expect} from "@playwright/test";
import {Store} from "../server/store.js";
import {Service} from "../server/service.js";
import {bootstrap} from "../server/bootstrap.js";
import {createApp} from "../server/index.js";

test("same-page route events preserve unsaved Tenant profile details and save the entered phone",{timeout:30000},async()=>{
  const store=new Store(":memory:"),password="ProfileRace!2026",origin="http://127.0.0.1:8121";
  bootstrap(new Service(store),{adminPassword:password,managerPassword:password,tenantPassword:password,demo:true});
  const app=createApp({store,env:{ALLOWED_ORIGINS:origin}});
  await new Promise(resolve=>app.server.listen(8121,"127.0.0.1",resolve));let browser;
  try {
    browser=await chromium.launch({headless:true,...(process.platform==="win32"?{executablePath:process.env.BROWSER_EXECUTABLE||"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"}:{})});
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await page.goto(origin+"/#/login");await page.locator("#login-email").fill("maria.santos@gmail.com");await page.locator("#login-password").fill(password);await page.locator("[data-sign-in]").click();
    await expect(page.locator("h1")).toHaveText("My home");
    await page.route("**/api/v1/tenants/*",route=>route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({message:"Temporary home failure"})}));
    await page.reload();
    await expect(page.getByRole("button",{name:"Try again",exact:true})).toBeVisible();
    await page.unroute("**/api/v1/tenants/*");
    await page.getByRole("button",{name:"Try again",exact:true}).click();
    await expect(page.locator(".tenant-rent-card")).toBeVisible();
    // Keep the first render in flight and deliver a second same-fragment event.
    // It must not start another render/request that can later replace the form.
    let releaseUnit;
    const unitGate = new Promise(resolve => { releaseUnit = resolve; });
    let unitRequests = 0;
    await page.route("**/api/v1/tenant/unit", async route => { unitRequests++; await unitGate; await route.continue(); });
    try {
      await page.goto(origin+"/#/tenant/settings");
      await expect.poll(() => unitRequests).toBeGreaterThan(0);
      const secondRequest = page.waitForRequest(r => r.url().endsWith("/tenant/unit"), {timeout:1000}).catch(error => {
        if (error.name === "TimeoutError") return null;
        throw error;
      });
      await page.evaluate(() => window.dispatchEvent(new HashChangeEvent("hashchange")));
      assert.equal(Boolean(await secondRequest), false, "duplicate route events must share the in-flight page render");
      assert.equal(unitRequests, 1);
    } finally { releaseUnit(); }
    await expect(page.locator("#ts-phone")).toBeVisible();
    await page.unroute("**/api/v1/tenant/unit");
    await page.locator("#ts-phone").fill("09123456789");
    await page.evaluate(()=>{
      window.dispatchEvent(new PopStateEvent("popstate"));
      return new Promise(resolve=>setTimeout(()=>{window.dispatchEvent(new HashChangeEvent("hashchange"));setTimeout(resolve,100);},30));
    });
    await expect(page.locator("#ts-phone")).toHaveValue("09123456789");
    const [response]=await Promise.all([
      page.waitForResponse(r=>r.url().endsWith("/auth/profile")&&r.request().method()==="PATCH"),
      page.locator('[data-action="save-profile"]').click(),
    ]);
    assert.equal(response.request().postDataJSON().phone,"09123456789");
    assert.equal(store.get("users","usr-tenant").phone,"09123456789");
    await expect(page.locator(".save-status")).toBeEmpty();
    await page.reload();await expect(page.locator("#ts-phone")).toHaveValue("09123456789");
  } finally {await browser?.close();await app.close();}
});
