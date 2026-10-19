import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, expect as baseExpect } from "@playwright/test";

// Local OCR/browser work may exceed the default 5s on shared student laptops.
const expect = baseExpect.configure({ timeout: 15000 });
import { createApp } from "../server/index.js";
import { Store } from "../server/store.js";
import { Service } from "../server/service.js";
import { bootstrap } from "../server/bootstrap.js";
import { utilityPdf, utilityText } from "./fixtures.js";
import { philippineDate, addDays } from "../server/rules.js";

test(
  "real browser: roles, portfolio CRUD, corrections, inbox, payments, receipts, settings and session recovery",
  { timeout: 180000 },
  async () => {
    const dir = mkdtempSync(join(tmpdir(), "propertypro-browser-")),
      store = new Store(join(dir, "test.sqlite"));
    const password = "BrowserTest!2026";
    bootstrap(new Service(store), {
      adminPassword: password,
      managerPassword: password,
      tenantPassword: password,
      demo: true,
    });
    const app = createApp({
      store,
      dataDir: dir,
      env: { ALLOWED_ORIGINS: "http://127.0.0.1:8095" },
    });
    let browser;
    await new Promise((resolve, reject) => {
      app.server.once("error", reject);
      app.server.listen(8095, "127.0.0.1", resolve);
    });
    try {
      browser = await chromium.launch({
        headless: true,
        ...(process.platform === "win32"
          ? {
              executablePath:
                process.env.BROWSER_EXECUTABLE ||
                "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
            }
          : {}),
      });
      const page = await browser.newPage({
          viewport: { width: 1440, height: 1000 },
        }),
        errors = [];
      page.on("pageerror", (e) => {
        errors.push(e.message);
        console.error("Browser error:", e.message);
      });
      const go = async (path, title) => {
        await page.goto("http://127.0.0.1:8095/#" + path);
        await expect(page.locator("h1")).toHaveText(
          title === "Access denied" ? /This view is not available/ : title,
        );
        await expect(page.locator(".skeleton")).toHaveCount(0);
      };
      const login = async (email) => {
        await go("/login", "Welcome back");
        await page.locator("#login-email").fill(email);
        await page.locator("#login-password").fill(password);
        await page.locator("[data-sign-in]").click();
      };
      const signout = async () => {
        if (page.viewportSize().width <= 1100) await page.locator('.topbar [data-action="toggle-nav"]').click();
        else await page.locator(".sidebar").hover();
        await page.locator('.sidebar [data-action="sign-out"]').click();
        await expect(page.locator("h1")).toHaveText("Welcome back");
      };
      const save = async () => {
        await page.locator("[data-workflow-save]").click();
        await expect(page.locator(".modal")).toHaveCount(0);
      };
      await go("/login", "Welcome back");
      await page.locator("#login-password").fill("incorrect-password");
      await page.locator("[data-sign-in]").click();
      await expect(page.locator("[data-login-error]")).toContainText("Invalid email or password");
      // Selected example role cannot elevate or replace the authenticated server role.
      await page.locator('[data-role="tenant"]').click();
      await page.locator("#login-email").fill("manager@propertypro.ph");
      await page.locator("#login-password").fill(password);
      await page.locator("[data-sign-in]").click();
      await expect(page.locator("h1")).toHaveText("Dashboard");
      await expect(
        page.locator("[data-activity] [data-row-id]").first(),
      ).toBeVisible();
      await page.locator("[data-activity] [data-row-id]").first().focus();
      await page.keyboard.press("Enter");
      await expect(page.locator("h1")).toHaveText("Bills & Payments");
      for (const [path, title] of [
        ["/properties", "Properties"],
        ["/units", "Units"],
        ["/tenants", "Tenants"],
        ["/bills", "Bills & Payments"],
        ["/reports", "Reports"],
        ["/settings", "Settings"],
      ])
        await go(path, title);
      await go("/properties", "Properties");
      await page
        .getByRole("button", { name: "Add property", exact: true })
        .click();
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(page.locator(".modal")).toHaveCount(0);
      await page
        .getByRole("button", { name: "Add property", exact: true })
        .click();
      for (const [key, value] of Object.entries({
        name: "Building E",
        letter: "E",
        address: "Pasig test address",
        city: "Pasig City",
      }))
        await page.locator(`[name="${key}"]`).fill(value);
      await save();
      await expect(page.locator("#app-root")).toContainText("Building E");
      const property = store
        .all("properties")
        .find((p) => p.name === "Building E");
      assert.ok(property);
      await page
        .locator(`[data-edit-entity="properties"][data-id="${property.id}"]`)
        .click();
      await page.locator('[name="name"]').fill("Building E Updated");
      // A slow badge refresh after saving must not pull the user back from Units.
      await page.route("**/api/v1/dashboard/stats", async route => {
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.continue();
      });
      await save();
      assert.equal(
        store.get("properties", property.id).name,
        "Building E Updated",
      );
      await go("/units", "Units");
      await page.waitForTimeout(700);
      await expect(page.locator("h1")).toHaveText("Units");
      await page.unroute("**/api/v1/dashboard/stats");
      await expect(page.locator("[data-building]")).toContainText([
        "All properties",
        "Building A",
        "Building B",
        "Building C",
        "Building D",
        "Building E Updated",
      ]);
      await page.getByRole("button", { name: "Add unit", exact: true }).click();
      await page.locator('[name="propertyId"]').selectOption(property.id);
      for (const [key, value] of Object.entries({
        code: "E-101",
        floor: "Ground Floor",
        monthlyRent: "10000.01",
      }))
        await page.locator(`[name="${key}"]`).fill(value);
      await save();
      await expect(page.locator("#app-root")).toContainText("E-101");
      const unit = store.all("units").find((u) => u.code === "E-101");
      assert.equal(unit.monthlyRent, 10000.01);
      await go("/tenants", "Tenants");
      await page
        .getByRole("button", { name: "Add tenant", exact: true })
        .click();
      for (const [key, value] of Object.entries({
        fullName: "UI Test Tenant",
        email: "ui@example.test",
        leaseStart: philippineDate(),
      }))
        await page.locator(`[name="${key}"]`).fill(value);
      await page.locator('[name="unitId"]').selectOption(unit.id);
      await save();
      await expect(page.locator("#app-root")).toContainText("UI Test Tenant");
      const newTenant = store
        .all("tenants")
        .find((t) => t.email === "ui@example.test");
      assert.ok(newTenant);
      await page.locator(`[data-row-id="${newTenant.id}"]`).click();
      await expect(page.locator(".panel-drawer")).toContainText(
        "UI Test Tenant",
      );
      await page.locator('[data-action="view-profile"]').click();
      await page.locator('[name="phone"]').fill("09987654321");
      await save();
      assert.equal(store.get("tenants", newTenant.id).phone, "09987654321");
      await page.locator('[aria-label="Close panel"]').click();
      await page.locator('[data-row-id="tnt-001"]').click();
      await expect(page.locator(".panel-drawer")).toContainText("Maria Santos");
      await page.locator('[data-action="send-message"]').click();
      await page.locator("#msg-subject").fill("Browser billing update");
      await page
        .locator("#msg-body")
        .fill("Your statement is ready in the portal.");
      await page.locator("[data-send]").click();
      await expect(page.locator(".modal")).toHaveCount(0);
      assert.equal(store.all("messages")[0].tenantId, "tnt-001");
      await page.locator('[data-tab="documents"]').click();
      await page.locator("[data-upload-document]").click();
      await page.locator('.modal input[type="file"]').setInputFiles({
        name: "lease.pdf",
        mimeType: "application/pdf",
        buffer: utilityPdf(),
      });
      await page.locator("[data-upload]").click();
      await expect(page.locator(".modal")).toHaveCount(0);
      await expect(page.locator(".panel-drawer")).toContainText("lease.pdf");
      const docDownload = page.waitForEvent("download");
      await page.locator("[data-document]").last().click();
      assert.equal((await docDownload).suggestedFilename(), "lease.pdf");
      await page.locator('[aria-label="Close panel"]').click();
      await go("/settings", "Settings");
      await page
        .locator('[name="intakeMailbox"]')
        .fill("propertymanager@gmail.com");
      await page.locator("[data-save-settings]").click();
      await expect(page.locator("#toast-root")).toContainText(
        "The changes were saved",
      );
      await page.reload();
      await expect(page.locator('[name="intakeMailbox"]')).toHaveValue(
        "propertymanager@gmail.com",
      );
      await page.locator('[data-section="mappings"]').click();
      await page
        .getByRole("button", { name: "Add mapping", exact: true })
        .click();
      await page.locator('[name="provider"]').fill("Maynilad");
      await page.locator('[name="account"]').fill("WATER-UI-1");
      await page.locator('[name="unitId"]').selectOption(unit.id);
      await page.locator('[name="category"]').selectOption("water");
      await save();
      const waterMapping = store
        .all("mappings")
        .find((m) => m.account === "WATER-UI-1");
      assert.ok(waterMapping);
      await go("/settings", "Settings");
      await page.locator('[data-section="mappings"]').click();
      await page
        .locator(
          `[data-delete-entity="mappings"][data-id="${waterMapping.id}"]`,
        )
        .click();
      await page.locator('[name="confirmation"]').fill("DELETE");
      await save();
      assert.equal(store.get("mappings", waterMapping.id), null);
      await go("/bills", "Bills & Payments");
      await page
        .getByRole("button", { name: "Upload source", exact: true })
        .click();
      await page.locator('.modal input[type="file"]').setInputFiles({
        name: "utility.pdf",
        mimeType: "application/pdf",
        buffer: utilityPdf(
          utilityText
            .replace("MER-12345", "MER-552194")
            .replace("2026-02-01", philippineDate().slice(0, 7) + "-01")
            .replace("2026-02-28", philippineDate())
            .replace("2026-03-05", addDays(philippineDate(), 5)),
        ),
      });
      await page.locator("[data-upload]").click();
      await expect(page.locator(".modal")).toHaveCount(0);
      await expect(page.locator("[data-tab-panel]")).toContainText("Validated");
      await page.locator('[data-action="check-rent-cycles"]').click();
      await expect(page.locator('[data-action="check-rent-cycles"]')).toBeEnabled();
      const billsBeforeCycleCheck = store.all("bills").length;
      await page.locator('[data-action="check-rent-cycles"]').click();
      await expect(page.locator('[data-action="check-rent-cycles"]')).toBeEnabled();
      assert.equal(store.all("bills").length, billsBeforeCycleCheck, "checking existing rent cycles does not duplicate bills");
      await expect(page.locator('.ocr-bill [data-correct-source], .ocr-bill [data-source]')).toHaveCount(0);
      await page.locator("[data-review-ocr]").first().click();
      await expect(page.locator(".source-review")).toBeVisible();
      await expect(page.locator(".source-review")).toContainText("Account / reference");
      await expect(page.locator(".source-review__pdf")).toHaveAttribute("src",/^blob:/);
      const correctionsBeforeReview = store.all("corrections").length;
      await page.getByRole('button', {name:'Close dialog', exact:true}).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      assert.equal(store.all("corrections").length, correctionsBeforeReview, "opening and closing review does not record a correction");
      await page.locator("[data-review-ocr]").first().click();
      await expect(page.locator(".source-review")).toBeVisible();
      const source = store.all("incoming")[0];
      assert.equal(
        store.all("bills").filter((b) => b.sourceId === source.id).length,
        3,
      );
      await page.locator('[data-edit-source-field="amountDue"]').click();
      await page.locator('[name="value"]').fill("100.01");
      await page
        .locator('[name="reason"]')
        .fill("Checked amended source in browser test");
      await save();
      assert.equal(store.get("incoming", source.id).amountDue, 100.01);
      const rent = store
        .all("bills")
        .find((b) => !b.sourceId && b.tenantId === "tnt-001");
      await go("/bills?tab=records", "Bills & Payments");
      await page.getByRole("combobox", {name:"Filter bill category",exact:true}).selectOption("electricity");
      await expect(page.locator('.billing-records tbody tr:not([hidden])')).not.toHaveCount(0);
      await page.locator('[data-billing-search]').fill("no-matching-bill-xyz");
      await expect(page.locator('[data-billing-no-results]')).toBeVisible();
      await expect(page.locator('[data-billing-result-count]')).toContainText("0 of");
      await page.locator('.table-toolbar [data-reset-billing-filters]').click();
      await expect(page.locator('[data-billing-no-results]')).toBeHidden();
      await page.getByRole("combobox", {name:"Filter bill category",exact:true}).selectOption("rent");
      await page.getByRole("combobox", {name:"Filter bill status",exact:true}).selectOption("unpaid");
      await page.locator('[data-billing-search]').fill("Maria");
      await page.reload();
      await expect(page.locator('[data-billing-search]')).toHaveValue("Maria");
      await expect(page.locator('[data-billing-filter="category"]')).toHaveValue("rent");
      await expect(page.locator('[data-billing-filter="status"]')).toHaveValue("unpaid");
      await expect(page.locator(`tr[data-row-id="${rent.id}"]`)).toBeVisible();
      await page.locator('[data-segment="records"]').focus();
      await page.keyboard.press("ArrowRight");
      await expect(page.locator('[data-segment="payments"]')).toHaveAttribute("aria-selected","true");
      await page.keyboard.press("ArrowLeft");
      await expect(page.locator('[data-billing-search]')).toHaveValue("Maria");
      await page.locator('.table-toolbar [data-reset-billing-filters]').click();
      await page.locator(`[data-view-bill="${rent.id}"]`).click();
      await page.locator("[data-correct-rent]").click();
      await page.locator('[name="amount"]').fill("21750.01");
      await page
        .locator('[name="reason"]')
        .fill("Reviewed whole-unit monthly charge");
      await save();
      assert.equal(store.get("bills", rent.id).revision, 2);
      await go("/reports", "Reports");
      await page.locator("[data-report-range]").selectOption("all");
      await expect(page.locator("[data-report-range]")).toHaveValue("all");
      const csvDownload = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "Export CSV", exact: true })
        .click();
      assert.equal((await csvDownload).suggestedFilename(), "reports.csv");
      await go("/admin/settings", "Access denied");
      await go("/dashboard", "Dashboard");
      await page.locator(".sidebar").hover();
      await expect(
        page.getByRole("button", { name: "Add tenant", exact: true }),
      ).toHaveCount(0);
      await page.mouse.move(900, 80);
      await signout();
      await login("maria.santos@gmail.com");
      await expect(page.locator("h1")).toHaveText("My home");
      await page.setViewportSize({width:390,height:844});
      await page.locator('.tenant-rent-card [data-action="report-payment"]').click();
      const paymentCountBeforeInvalidReport = store.all("payments").length;
      await expect(page.locator('[name="reference"]')).toBeHidden();
      await page.locator('[name="method"]').selectOption("e_wallet");
      await expect(page.locator('[name="reference"]')).toBeVisible();
      await page.locator('[data-workflow-save]').click();
      await expect(page.locator('[name="reference"]')).toHaveAttribute("aria-invalid", "true");
      assert.equal(store.all("payments").length, paymentCountBeforeInvalidReport);
      await page.locator('[name="reference"]').fill("DISCARD-WHEN-CASH");
      await page.locator('[name="method"]').selectOption("cash");
      await expect(page.locator('[name="reference"]')).toBeHidden();
      await expect(page.locator('[name="reference"]')).toBeDisabled();
      await page.locator('[name="method"]').selectOption("e_wallet");
      await expect(page.locator('[name="reference"]')).toHaveValue("");
      await page.locator('[name="reference"]').fill("BROWSER-REFERENCE-1");
      await save();
      await expect(page.locator("#app-root")).toContainText(
        "Tenant Reported Paid",
      );
      await expect(page.locator(".tenant-rent-card")).toContainText("waiting for Manager confirmation");
      assert.equal(store.all("receipts").length, 0);
      await go("/tenant/notifications", "Notifications");
      await expect(page.locator("#app-root")).toContainText(
        "Browser billing update",
      );
      await page.locator('[data-action="mark-read"]').click();
      await expect(page.locator(".notification-feed .badge")).toHaveCount(0);
      assert.ok(
        store
          .all("notifications")
          .filter((n) => n.tenantId === "tnt-001")
          .every((n) => n.read),
      );
      await page.locator('[data-action="enable-push"]').click();
      await expect(page.locator("#toast-root")).toContainText("VAPID keys");
      assert.equal(store.all("subscriptions").length, 0);
      const workerState = await page.evaluate(async () => {
        await navigator.serviceWorker.register("/sw.js");
        const registration = await navigator.serviceWorker.ready;
        await new Promise((resolve) => {
          if (registration.active.state === "activated") resolve();
          else
            registration.active.addEventListener("statechange", () => {
              if (registration.active.state === "activated") resolve();
            });
        });
        return registration.active.state;
      });
      assert.equal(workerState, "activated");
      await go("/tenant/settings", "Settings");
      await page.locator("#ts-phone").fill("09123456789");
      const [profileResponse] = await Promise.all([
        page.waitForResponse(response => response.url().endsWith("/auth/profile") && response.request().method() === "PATCH" && response.request().postDataJSON()?.phone === "09123456789"),
        page.locator('[data-action="save-profile"]').click(),
      ]);
      assert.equal(profileResponse.status(),200);
      assert.equal((await profileResponse.json()).phone,"09123456789");
      assert.equal(store.get("users","usr-tenant").phone,"09123456789");
      await expect(page.locator("#toast-root")).toContainText("Profile saved");
      await page.locator('[data-toggle="Billing updates"]').click();
      await expect(
        page.locator('[data-toggle="Billing updates"]'),
      ).toHaveAttribute("aria-checked", "false");
      await page.reload();
      await expect(page.locator("#ts-phone")).toHaveValue("09123456789");
      await expect(
        page.locator('[data-toggle="Billing updates"]'),
      ).toHaveAttribute("aria-checked", "false");
      await go("/properties", "Access denied");
      await go("/tenant", "My home");
      await signout();
      await login("manager@propertypro.ph");
      await expect(page.locator("h1")).toHaveText("Dashboard");
      await expect(page.locator(".manager-review-queue")).toBeVisible();
      await expect(page.locator(".manager-review-queue")).not.toContainText("Needs attention");
      await page.locator('.manager-review-queue__row[href="#/bills?tab=payments"]').click();
      await expect(page).toHaveURL(/\/bills\?tab=payments$/);
      await page.locator("[data-confirm-payment]").first().click();
      await expect(page.locator("[data-confirm-payment]")).toHaveCount(0);
      assert.equal(store.all("receipts").length, 1);
      const payment = store.all("payments").find((p) => p.status === "paid");
      assert.ok(payment.receiptNumber);
      await signout();
      await login("maria.santos@gmail.com");
      await expect(page.locator("h1")).toHaveText("My home");
      await expect(page.getByRole("button", {name:"Download rent receipt", exact:true})).toBeVisible();
      const previousViewport = page.viewportSize();
      await page.setViewportSize({width:390,height:844});
      let previewDownloads = 0;
      const countPreviewDownload = () => { previewDownloads++; };
      page.on("download",countPreviewDownload);
      await page.getByRole("button",{name:"View receipt",exact:true}).click();
      const preview = page.frameLocator('iframe[title="Confirmed rent receipt"]');
      await expect(preview.getByRole("heading",{name:"Rent payment receipt"})).toBeVisible();
      await expect(preview.locator(".reference")).toHaveText(payment.receiptNumber);
      await expect(page.locator("[data-print-receipt]")).toBeEnabled();
      assert.ok(await preview.locator("body").evaluate(body => body.scrollWidth <= window.innerWidth));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.equal(previewDownloads,0,"viewing does not start a download");
      assert.equal(store.all("receipts").length,1,"viewing reuses the original receipt");
      mkdirSync("test-results",{recursive:true});
      await page.screenshot({path:"test-results/receipt-preview-mobile.png"});
      await page.getByRole("button",{name:"Close dialog",exact:true}).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      page.off("download",countPreviewDownload);
      await page.setViewportSize(previousViewport);
      const homeReceipt = page.waitForEvent("download");
      await page.getByRole("button", {name:"Download rent receipt", exact:true}).click();
      const downloadedReceipt = await homeReceipt;
      assert.equal(downloadedReceipt.suggestedFilename(), payment.receiptNumber + ".html");
      const receiptPage = await browser.newPage();
      await receiptPage.setViewportSize({width:320,height:800});
      await receiptPage.setContent(readFileSync(await downloadedReceipt.path(), "utf8"));
      await expect(receiptPage.getByRole("heading", {name:"Rent payment receipt"})).toBeVisible();
      await expect(receiptPage.locator(".reference")).toHaveText(payment.receiptNumber);
      assert.ok(await receiptPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
      await receiptPage.emulateMedia({media:"print"});
      await expect(receiptPage.locator(".receipt-tools")).toBeHidden();
      await receiptPage.close();
      assert.equal(store.all("receipts").length, 1);
      await go("/tenant/bills", "My Bills & Payments");
      await expect(page.locator('.receipt-archive')).not.toHaveAttribute('open', '');
      await expect(page.locator('.tenant-receipt-list')).toBeHidden();
      await page.locator('.receipt-archive > summary').click();
      await expect(page.locator('.tenant-receipt-list')).toBeVisible();
      await expect(page.locator('.tenant-receipt-list')).toContainText("Rent receipt");
      await expect(page.locator('[data-copy-reference]').first()).toHaveAttribute('data-copy-reference', payment.receiptNumber);
      await page.context().grantPermissions(['clipboard-read','clipboard-write']);
      await page.locator('[data-copy-reference]').first().click();
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), payment.receiptNumber);
      await page.locator('.receipt-archive > summary').click();
      await expect(page.locator('.tenant-receipt-list')).toBeHidden();
      const receiptDownload = page.waitForEvent("download");
      await page.locator("[data-receipt]").first().click();
      assert.equal(
        (await receiptDownload).suggestedFilename(),
        payment.receiptNumber + ".html",
      );
      // Hover expansion must preserve page event listeners.
      await page.setViewportSize({width:1440,height:1000});
      await page.locator(".sidebar").hover();
      await page.mouse.move(900, 80);
      if (!(await page.locator(".tenant-filter-disclosure").evaluate(el=>el.open))) await page.locator(".tenant-filter-disclosure > summary").click();
      await page.locator('[data-history-filter="category"]').selectOption("electricity");
      await expect(page.locator("[data-report-bill]")).toHaveCount(0);
      await expect(page.locator('[data-history-filter="category"]')).toHaveValue("electricity");
      await page.locator("[data-reset-history]").click();
      await expect(page.locator('[data-history-filter="category"]')).toHaveValue("");
      await page.locator('[data-history-filter="category"]').selectOption("electricity");
      const mark = page.locator("[data-track-utility]").first();
      await mark.click();
      await expect(page.locator("[data-track-utility]").first()).toHaveText("Undo mark");
      await expect(page.locator('[data-history-filter="category"]')).toHaveValue("electricity");
      await page.locator("[data-track-utility]").first().click();
      await expect(page.locator("[data-track-utility]").first()).toHaveText("Mark personally paid");
      await go("/tenant/notifications","Notifications");
      await page.locator('[data-action="mark-read"]').click();
      await expect(page.locator("#toast-root")).toContainText("Notifications updated");
      assert.ok(store.all("notifications").filter(n=>n.tenantId==="tnt-001").every(n=>n.read));
      await go("/", "My home");
      await page.setViewportSize({ width: 390, height: 844 });
      await page.locator('.topbar [data-action="toggle-nav"]').click();
      await page.locator('.sidebar a[href="#/tenant/settings"]').click();
      await expect(page.locator("#ts-phone")).toHaveValue("09123456789");
      mkdirSync("test-results", { recursive: true });
      await page.screenshot({
        path: "test-results/mobile-tenant.png",
        fullPage: true,
      });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.locator("[data-change-password]").click();
      await page.locator('[name="currentPassword"]').fill(password);
      await page.locator('[name="password"]').fill("ChangedBrowserPass!2026");
      await save();
      await expect(page.locator("h1")).toHaveText("Welcome back");
      await login("manager@propertypro.ph");
      await expect(page.locator("h1")).toHaveText("Dashboard");
      await go("/bills?tab=records","Bills & Payments");
      const directRent = store.all("bills").find(b=>b.tenantId !== "tnt-001" && b.lines.every(l=>l.category === "rent") && b.paymentStatus === "unpaid");
      await page.locator(`[data-record-rent="${directRent.id}"]`).click();
      await expect(page.locator('[name="amount"]')).toHaveValue(String(directRent.totalDue));
      await page.locator('[name="checked"]').selectOption("yes");
      page.once("dialog",dialog=>dialog.accept());
      await save();
      assert.equal(store.get("bills",directRent.id).paymentStatus,"paid");
      assert.ok(store.all("receipts").some(r=>r.billId===directRent.id));
      await signout();
      await login("admin@propertypro.ph");
      await expect(page.locator("h1")).toHaveText("System Dashboard");
      await go("/", "System Dashboard");
      await go("/admin/settings", "Users & Roles");
      await page.getByRole("button", { name: "Add user", exact: true }).click();
      await page.locator('[name="role"]').selectOption("tenant");
      for (const [key, value] of Object.entries({
        name: "UI Tenant Account",
        email: "ui@example.test",
        tenantId: newTenant.id,
        password,
      }))
        await page.locator(`[name="${key}"]`).fill(value);
      await save();
      assert.ok(store.all("users").some((u) => u.tenantId === newTenant.id));
      await go("/admin/audit", "Audit Log");
      await expect(page.locator("#app-root")).toContainText("Account created");
      await go("/admin", "System Dashboard");
      await page
        .getByRole("button", { name: "Refresh status", exact: true })
        .click();
      await expect(page.locator("#toast-root")).toContainText(
        "Status refreshed",
      );
      await page
        .getByRole("button", { name: "Back up database", exact: true })
        .click();
      await expect(page.locator("#toast-root")).toContainText("backup-");
      await go("/bills", "Access denied");
      await go("/admin", "System Dashboard");
      await page
        .getByRole("button", { name: "Restart OCR worker", exact: true })
        .click();
      await expect(page.locator("#toast-root")).toContainText(
        "Operation completed",
      );
      await page
        .getByRole("button", { name: "Purge temp files", exact: true })
        .click();
      await expect(page.locator("#toast-root")).toContainText(
        "temporary files removed",
      );
      await go("/admin/settings", "Users & Roles");
      mkdirSync("test-results", { recursive: true });
      await page.screenshot({
        path: "test-results/admin-browser.png",
        fullPage: true,
      });
      store.db.prepare("DELETE FROM sessions").run();
      await page.reload();
      await expect(page.locator("h1")).toHaveText("Welcome back");
      assert.deepEqual(errors, []);
    } finally {
      await browser?.close();
      await app.close();
      rmSync(dir, { recursive: true, force: true });
    }
  },
);
