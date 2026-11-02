import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {chromium,expect} from "@playwright/test";
import {Store} from "../server/store.js";
import {Service} from "../server/service.js";
import {bootstrap} from "../server/bootstrap.js";
import {createApp} from "../server/index.js";

test("numeric floors and eleven-digit phones validate in desktop and phone forms", {timeout:90000}, async()=>{
  const dir=mkdtempSync(join(tmpdir(),"rentara-forms-"));
  const store=new Store(join(dir,"test.sqlite")),password="FormTests!2026";
  bootstrap(new Service(store),{adminPassword:password,managerPassword:password,tenantPassword:password,demo:true});
  const origin="http://127.0.0.1:8128",app=createApp({store,dataDir:dir,env:{ALLOWED_ORIGINS:origin}});
  await new Promise(resolve=>app.server.listen(8128,"127.0.0.1",resolve));
  let browser;
  try {
    browser=await chromium.launch({headless:true,...(process.platform==="win32"?{executablePath:process.env.BROWSER_EXECUTABLE||"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"}:{})});
    const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:"reduce"});
    const errors=[];page.on("pageerror",e=>errors.push(e.message));
    const login=async(email)=>{
      await page.goto(origin+"/#/login");
      await page.locator("#login-email").fill(email);await page.locator("#login-password").fill(password);
      await page.locator("[data-sign-in]").click();await expect(page.locator(".app-shell")).toBeVisible();
    };
    await login("manager@propertypro.ph");
    await page.goto(origin+"/#/units");await expect(page.locator(".skeleton")).toHaveCount(0);await page.getByRole("button",{name:"Add unit",exact:true}).click();
    const floor=page.locator('.modal [name="floorNumber"]');
    await expect(floor).toHaveAttribute("step","1");
    await expect(page.locator('.modal [name="floor"]')).toHaveCount(0);
    await page.locator('.modal [name="code"]').fill("QA-NUMERIC");
    await page.locator('.modal [name="monthlyRent"]').fill("5000");
    for(const value of ["-1","1.5"]) {
      // Bypass the typing guard to exercise native submit validation as well.
      await floor.evaluate((input,value)=>{input.value=value;input.dispatchEvent(new Event("input",{bubbles:true}));},value);
      await page.locator("[data-workflow-save]").click();
      await expect(floor).toHaveAttribute("aria-invalid","true");
      assert.equal(store.all("units").some(u=>u.code==="QA-NUMERIC"),false);
    }
    await floor.fill("0");
    await expect(page.locator(".modal__art")).toBeVisible();
    await page.screenshot({path:"data/unit-form-desktop.png"});
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.locator(".modal").evaluate(el=>el.scrollWidth<=el.clientWidth),true);
    await page.screenshot({path:"data/unit-form-phone.png"});
    await page.locator("[data-workflow-save]").click();await expect(page.getByRole("dialog")).toHaveCount(0);
    assert.equal(store.all("units").find(u=>u.code==="QA-NUMERIC").floorNumber,0);
    await page.goto(origin+"/#/tenants");await expect(page.locator(".skeleton")).toHaveCount(0);await page.getByRole("button",{name:"Add tenant",exact:true}).click();
    for(const key of ["phone","emergencyContactPhone"]) {
      const phone=page.locator(`.modal [name="${key}"]`);
      await expect(phone).toHaveAttribute("pattern","[0-9]{11}");
      await phone.fill("0912345678");assert.equal(await phone.evaluate(el=>el.checkValidity()),false);
      await phone.fill("");await phone.pressSequentially("abc");await expect(phone).toHaveValue("");
      await phone.fill("09123456789");assert.equal(await phone.evaluate(el=>el.checkValidity()),true);
    }
    page.once("dialog",d=>d.accept());await page.keyboard.press("Escape");
    await page.goto(origin+"/#/settings");await page.locator('[data-section="profile"]').click();
    const phone=page.locator('[name="phone"]');await phone.fill("09123");
    await page.locator("[data-save-settings]").click();
    assert.notEqual(store.get("users","usr-manager").phone,"09123");
    await phone.fill("09123456789");await page.locator("[data-save-settings]").click();
    await expect.poll(()=>store.get("users","usr-manager").phone).toBe("09123456789");
    await page.evaluate(async()=>{
      const {dialogForm}=await import("/src/app/workflows.js");
      window.qaPasswordSaves=0;
      dialogForm({title:"Password validation check",fields:[{key:"password",label:"New password",type:"password",required:true}],save:async()=>{window.qaPasswordSaves++;}});
    });
    const newPassword=page.locator('.modal [name="password"]');
    await newPassword.fill("short");await page.locator("[data-workflow-save]").click();
    await expect(newPassword).toHaveAttribute("aria-invalid","true");
    assert.equal(await page.evaluate(()=>window.qaPasswordSaves),0);
    await newPassword.fill("LongEnoughPassword!2026");
    assert.equal(await newPassword.evaluate(input=>input.checkValidity()),true);
    page.once("dialog",d=>d.accept());await page.keyboard.press("Escape");
    await page.evaluate(async()=>{const {default:s}=await import("/src/auth/session.js");await s.signOut();window.dispatchEvent(new CustomEvent("app:signed-out"));});
    await login("maria.santos@gmail.com");await page.goto(origin+"/#/tenant/settings");
    const tenantName=await page.locator("#ts-name").inputValue();
    await page.locator("#ts-name").fill("");await page.locator('[data-action="save-profile"]').click();
    assert.equal(store.get("users","usr-tenant").name,tenantName);
    assert.equal(await page.locator("#ts-name").evaluate(input=>input.checkValidity()),false);
    await page.locator("#ts-name").fill(tenantName);
    await page.locator("#ts-phone").fill("09123");await page.locator('[data-action="save-profile"]').click();
    assert.notEqual(store.get("users","usr-tenant").phone,"09123");
    await page.locator("#ts-phone").fill("09123456789");await page.locator('[data-action="save-profile"]').click();
    await expect.poll(()=>store.get("users","usr-tenant").phone).toBe("09123456789");
    await page.evaluate(async()=>{const {default:s}=await import("/src/auth/session.js");await s.signOut();window.dispatchEvent(new CustomEvent("app:signed-out"));});
    await login("admin@propertypro.ph");
    await page.evaluate(async()=>{const {userForm}=await import("/src/app/workflows.js");await userForm(null,()=>{});});
    const tenantId=page.locator('.modal [name="tenantId"]');
    await page.locator('.modal [name="role"]').selectOption("tenant");
    await expect(tenantId).toBeEnabled();await expect(tenantId).toHaveAttribute("required","");
    assert.equal(await tenantId.evaluate(input=>input.checkValidity()),false);
    await page.locator('.modal [name="role"]').selectOption("manager");
    await expect(tenantId).toBeDisabled();
    page.once("dialog",d=>d.accept());await page.keyboard.press("Escape");
    assert.deepEqual(errors,[]);
  } finally {await browser?.close();await new Promise(resolve=>app.server.close(resolve));store.close();rmSync(dir,{recursive:true,force:true});}
});
