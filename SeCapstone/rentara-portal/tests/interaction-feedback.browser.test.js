import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve,dirname} from "node:path";
import {chromium,expect} from "@playwright/test";
import {Store} from "../server/store.js";
import {Service} from "../server/service.js";
import {bootstrap} from "../server/bootstrap.js";
import {createApp} from "../server/index.js";
import {utilityPdf} from "./fixtures.js";

test("lightweight feedback protects edits, preserves failed inputs, pages old logs and honors reduced motion",{timeout:90000},async()=>{
  const dir=mkdtempSync(join(tmpdir(),"rentara-feedback-"));
  const store=new Store(join(dir,"test.sqlite")),password="FeedbackTests!2026";
  bootstrap(new Service(store),{adminPassword:password,managerPassword:password,tenantPassword:password,demo:true});
  for(let i=0;i<75;i++) store.save("audit",{id:`feedback-${String(i).padStart(3,"0")}`,actor:"Test",role:"manager",action:"Feedback audit",at:"2090-01-01T00:00:00.000Z"});
  const origin="http://127.0.0.1:8117";
  const app=createApp({store,dataDir:dir,env:{ALLOWED_ORIGINS:origin}});
  await new Promise(resolve=>app.server.listen(8117,"127.0.0.1",resolve));
  let browser;
  try {
    browser=await chromium.launch({headless:true,...(process.platform==="win32"?{executablePath:process.env.BROWSER_EXECUTABLE||"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"}:{})});
    const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"});
    const errors=[];page.on("pageerror",error=>errors.push(error.message));
    const login=async email=>{
      if (await page.locator(".app-shell").count()) await page.evaluate(async()=>{
        const {default:session}=await import("/src/auth/session.js");await session.signOut();window.dispatchEvent(new CustomEvent("app:signed-out"));
      });
      await page.goto(origin+"/#/login");await page.locator("#login-email").fill(email);await page.locator("#login-password").fill(password);await page.locator("[data-sign-in]").click();await expect(page.locator(".app-shell")).toBeVisible();
    };
    await login("manager@propertypro.ph");
    await page.goto(origin+"/#/settings");await page.locator('[data-section="profile"]').click();
    const name=page.locator('[name="name"]');const original=await name.inputValue();
    await name.fill("Edited manager");await expect(page.locator(".save-status")).toHaveText("Unsaved changes");
    page.once("dialog",dialog=>dialog.dismiss());
    await page.evaluate(()=>{location.hash="/dashboard";});
    await expect(page.locator('[name="name"]')).toHaveValue("Edited manager");
    await expect(page).toHaveURL(/#\/settings$/);
    await page.getByRole("button",{name:"Cancel changes",exact:true}).click();await expect(name).toHaveValue(original);
    await name.fill("Retry manager");
    await page.route("**/api/v1/auth/profile",route=>route.fulfill({status:422,contentType:"application/json",body:JSON.stringify({message:"Profile rejected for this test."})}));
    await page.locator("[data-save-settings]").click();
    await expect(page.locator("[data-save-settings]")).toBeEnabled();await expect(name).toHaveValue("Retry manager");
    await expect(page.locator(".save-status")).toHaveText("Unsaved changes");
    await page.unroute("**/api/v1/auth/profile");
    await page.locator("[data-save-settings]").click();await expect(page.locator(".save-status")).toBeEmpty();
    await page.evaluate(async()=>{
      const {dialogForm}=await import("/src/app/workflows.js");
      dialogForm({title:"Guard check",fields:[{key:"name",label:"Name"}],save:async()=>({})});
    });
    assert.equal(await page.locator(".modal").evaluate(element=>getComputedStyle(element).animationName),"none");
    await page.locator('.modal input[name="name"]').fill("Unsaved modal");
    page.once("dialog",dialog=>dialog.dismiss());await page.keyboard.press("Escape");await expect(page.getByRole("dialog")).toBeVisible();
    page.once("dialog",dialog=>dialog.accept());await page.keyboard.press("Escape");await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.goto(origin+"/#/bills?tab=incoming");
    await page.getByRole("button",{name:"Upload source",exact:true}).click();
    await page.locator('.modal input[type="file"]').setInputFiles({name:"feedback.pdf",mimeType:"application/pdf",buffer:utilityPdf()});
    let release,requests=0;
    const gate=new Promise(resolve=>{release=resolve;});
    await page.route("**/api/v1/intake/upload",async route=>{requests++;await gate;await route.fulfill({status:422,contentType:"application/json",body:JSON.stringify({message:"Controlled upload failure"})});});
    try {
      await page.locator("[data-upload]").click();
      await expect(page.locator("[data-upload-progress]")).toBeVisible();
      await expect(page.locator("[data-upload]")).toBeDisabled();
      assert.equal(await page.locator('.processing-status__bar').evaluate(element=>getComputedStyle(element,"::after").animationName),"none");
      // Progress feedback precedes fetch dispatch; wait for the actual request.
      await expect.poll(()=>requests).toBe(1);
    } finally {release();}
    await expect(page.locator("[data-upload]")).toBeEnabled();
    assert.equal(await page.locator('.modal input[type="file"]').evaluate(input=>input.files.length),1);
    page.once("dialog",dialog=>dialog.accept());await page.keyboard.press("Escape");await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.unroute("**/api/v1/intake/upload");
    await page.evaluate(()=>window.dispatchEvent(new Event("offline")));await expect(page.locator(".connection-status")).toContainText("Offline");
    await page.evaluate(()=>window.dispatchEvent(new Event("online")));await expect(page.locator(".connection-status")).toContainText("Connection available");
    await login("admin@propertypro.ph");await page.goto(origin+"/#/admin/audit?action=Feedback&page=1");
    await expect(page.locator('.table-footer [role="status"]')).toHaveText("Showing 1–50 of 75");
    await page.getByRole("button",{name:"Next",exact:true}).click();
    await expect(page.locator('.table-footer [role="status"]')).toHaveText("Showing 51–75 of 75");
    await expect(page.getByRole("button",{name:"Next",exact:true})).toBeDisabled();
    await page.reload();await expect(page.locator('.table-footer [role="status"]')).toHaveText("Showing 51–75 of 75");
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    assert.ok(await page.evaluate(()=>performance.getEntriesByType("resource").every(entry=>new URL(entry.name).origin===location.origin)),"no third-party animation/font/CDN requests");
    // Exercise enabled motion too: controls must stay usable during spring feedback.
    await page.emulateMedia({reducedMotion:"no-preference"});
    await login("manager@propertypro.ph");
    await page.goto(origin+"/#/properties");
    await expect(page.locator("h1")).toHaveText("Properties");
    await expect(page.locator(".jelly-route-enter")).toHaveCSS("animation-name","mint-route-in");
    await expect(page.locator(".page")).toHaveCSS("animation-name","none");
    const add=page.getByRole("button",{name:"Add property",exact:true});
    await add.hover();
    const rest=await add.boundingBox();
    await page.mouse.move(rest.x+rest.width/2,rest.y+rest.height/2);
    await page.mouse.down();
    const pressed=await add.boundingBox();
    assert.equal(pressed.width,rest.width,"press feedback must not shrink the hit target");
    assert.equal(pressed.height,rest.height,"press feedback must not shrink the hit target");
    await page.mouse.up();
    await expect(page.locator(".modal")).toHaveCSS("animation-name","mint-dialog-in");
    await page.locator('.modal [name="name"]').fill("Jelly unsaved property");
    page.once("dialog",dialog=>dialog.dismiss());
    await page.keyboard.press("Escape");
    await expect(page.locator('.modal [name="name"]')).toHaveValue("Jelly unsaved property");
    page.once("dialog",dialog=>dialog.accept());
    await page.keyboard.press("Escape");
    await expect(page.locator(".modal")).toHaveCount(0);
    await expect(add).toBeFocused();
    assert.equal(store.all("properties").some(property=>property.name==="Jelly unsaved property"),false);
    await page.goto(origin+"/#/tenants");
    await page.locator('[data-row-id="tnt-001"]').click();
    await expect(page.locator(".panel-drawer h2")).toHaveText("Maria Santos");
    await expect(page.locator(".panel-drawer")).toHaveCSS("animation-name","mint-drawer-in");
    await page.locator('.panel-drawer [data-tab="billing"]').click();
    await expect(page.locator('.panel-drawer__body')).toHaveCSS("animation-name","mint-content-in");
    await page.getByRole("button",{name:"Close panel",exact:true}).click();
    await expect(page.locator(".panel-drawer,.scrim--panel")).toHaveCount(0);
    const menuMotion=await page.evaluate(()=>{
      const before=document.querySelector('.sidebar');
      getComputedStyle(before).transform;
      document.querySelector('.topbar [data-action="toggle-nav"]').click();
      const after=document.querySelector('.sidebar');
      getComputedStyle(after).transform;
      return {sameNode:before===after,transition:after.getAnimations().some(animation=>animation.transitionProperty==="transform")};
    });
    assert.equal(menuMotion.sameNode,true,"opening the menu must preserve its DOM for an actual transition");
    assert.equal(menuMotion.transition,true,"opening the menu must start a native transform transition");
    await expect(page.locator(".app-shell")).toHaveClass(/is-nav-open/);
    await page.locator('.sidebar__toggle').click();
    await expect(page.locator(".app-shell")).not.toHaveClass(/is-nav-open/);
    await page.emulateMedia({reducedMotion:"reduce"});
    await expect(page.locator(".jelly-route-enter")).toHaveCSS("animation-name","none");
    await page.evaluate(async()=>{
      const {dialogForm}=await import("/src/app/workflows.js");
      dialogForm({title:"Reduced motion recheck",fields:[{key:"name",label:"Name"}],save:async()=>({})});
    });
    await expect(page.locator(".modal")).toHaveCSS("animation-name","none");
    await page.getByRole("button",{name:"Cancel",exact:true}).click();
    await expect(page.locator(".modal")).toHaveCount(0);
    assert.deepEqual(errors,[]);
  } finally {
    await browser?.close();await app.close();
    assert.equal(dirname(resolve(dir)),resolve(tmpdir()));rmSync(dir,{recursive:true,force:true});
  }
});
