import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, basename, resolve } from "node:path";
import { chromium, expect as baseExpect } from "@playwright/test";
import { createApp } from "../server/index.js";
import { Store } from "../server/store.js";
import { Service } from "../server/service.js";
import { bootstrap } from "../server/bootstrap.js";
import { philippineDate, addDays, monthAfter } from "../server/rules.js";
import { utilityPdf, utilityText } from "./fixtures.js";
import { date } from "../src/utils/format.js";

const expect = baseExpect.configure({ timeout: 15000 });

test(
  "portal alerts: Manager events, Tenant ownership, unread badges and restart persistence without external delivery",
  { timeout: 180000 },
  async () => {
    const dir = mkdtempSync(join(tmpdir(), "propertypro-notifications-"));
    const filename = join(dir, "test.sqlite");
    const password = "PortalAlerts!2026";
    const origin = "http://127.0.0.1:8097";
    const env = { ALLOWED_ORIGINS: origin };
    const store = new Store(filename);
    bootstrap(new Service(store), {
      adminPassword: password,
      managerPassword: password,
      tenantPassword: password,
      demo: true,
    });
    let app = createApp({ store, dataDir: dir, env });
    let browser;
    const listen = () =>
      new Promise((resolve, reject) => {
        app.server.once("error", reject);
        app.server.listen(8097, "127.0.0.1", resolve);
      });
    const ownAlerts = () =>
      app.store.all("notifications").filter((n) => n.tenantId === "tnt-001");
    const otherAlerts = () =>
      app.store.all("notifications").filter((n) => n.tenantId === "tnt-002");
    const go = async (page, path, heading) => {
      await page.goto(origin + "/#" + path);
      await expect(page.locator("h1")).toHaveText(heading);
      await expect(page.locator(".skeleton")).toHaveCount(0);
    };
    const login = async (page, email) => {
      await go(page, "/login", "Welcome back");
      await page.locator("#login-email").fill(email);
      await page.locator("#login-password").fill(password);
      await page.locator("[data-sign-in]").click();
      await expect(page.locator("h1")).not.toHaveText("Welcome back");
    };
    const save = async (page) => {
      await page.locator("[data-workflow-save]").click();
      await expect(page.locator(".modal")).toHaveCount(0);
    };
    const assertFeed = async (page) => {
      await expect(page.locator(".notification-item")).toHaveCount(
        ownAlerts().length,
      );
      for (const alert of ownAlerts()) {
        const visibleBody = alert.body.replace(/\b\d{4}-\d{2}-\d{2}\b/g, value => date(value));
        const item = page
          .locator(".notification-item")
          .filter({ has: page.locator("strong", { hasText: alert.title }) })
          .filter({ hasText: visibleBody });
        await expect(item).toContainText(visibleBody);
      }
    };
    try {
      await listen();
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
      const managerContext = await browser.newContext();
      const tenantContext = await browser.newContext();
      const manager = await managerContext.newPage();
      const tenant = await tenantContext.newPage();
      const errors = [];
      for (const page of [manager, tenant])
        page.on("pageerror", (e) => errors.push(e.message));
      await login(manager, "manager@propertypro.ph");
      await login(tenant, "maria.santos@gmail.com");
      await tenant.locator('.topbar [data-action="notifications"]').click();
      await expect(tenant.locator("h1")).toHaveText("Notifications");
      await assertFeed(tenant);
      await tenant.locator('[data-action="mark-read"]').click();
      await expect(tenant.locator(".notification-feed .badge")).toHaveCount(0);
      await expect(
        tenant.locator('.topbar [data-action="notifications"] .icon-btn__dot'),
      ).toHaveCount(0);
      assert.ok(
        otherAlerts().every((n) => !n.read),
        "Reading one Tenant's alerts must not read another Tenant's alerts",
      );

      // A real Manager upload creates allocated utility bills and saved alerts.
      const today = philippineDate();
      const dueDate = addDays(today, 4);
      await go(manager, "/bills", "Bills & Payments");
      await manager
        .getByRole("button", { name: "Upload source", exact: true })
        .click();
      await manager.locator('.modal input[type="file"]').setInputFiles({
        name: "portal-utility.pdf",
        mimeType: "application/pdf",
        buffer: utilityPdf(
          utilityText
            .replace("MER-12345", "MER-552194")
            .replace("2026-02-01", today.slice(0, 7) + "-01")
            .replace("2026-02-28", today)
            .replace("2026-03-05", dueDate),
        ),
      });
      const uploadResponse = manager.waitForResponse(response => response.url().endsWith("/intake/upload") && response.request().method() === "POST", {timeout:60000});
      await manager.locator("[data-upload]").click();
      const billUploadResponse = await uploadResponse;
      assert.ok(billUploadResponse.ok(), `Upload failed with HTTP ${billUploadResponse.status()}`);
      const uploadResult = await billUploadResponse.json();
      assert.equal(uploadResult.document.ocrStatus,"validated",JSON.stringify(uploadResult.failures));
      await expect(manager.locator(".modal")).toHaveCount(0);
      assert.equal(app.store.all("incoming").length, 1);
      const uploaded = app.store.all("incoming")[0];
      assert.equal(
        app.store.all("bills").filter((b) => b.sourceId === uploaded.id).length,
        3,
      );
      await tenant.reload();
      await assertFeed(tenant);
      await expect(tenant.locator(".notification-feed .badge")).toHaveCount(1);
      await expect(
        tenant.locator('.topbar [data-action="notifications"] .icon-btn__dot'),
      ).toHaveText("1");
      await tenant.locator('[data-action="enable-push"]').click();
      await expect(tenant.locator("#toast-root")).toContainText("VAPID keys");
      await assertFeed(tenant);

      // The API ignores attempted recipient substitution on both read and fetch.
      const tenantToken = app.service.login({
        email: "maria.santos@gmail.com",
        password,
      }).token;
      const auth = {
        Authorization: "Bearer " + tenantToken,
        "Content-Type": "application/json",
      };
      const response = await fetch(
        origin + "/api/v1/notifications?tenantId=tnt-002",
        { headers: auth },
      );
      assert.equal(response.status, 200);
      assert.ok((await response.json()).every((n) => n.tenantId === "tnt-001"));
      const readResponse = await fetch(origin + "/api/v1/notifications/read", {
        method: "POST",
        headers: auth,
        body: JSON.stringify({ tenantId: "tnt-002" }),
      });
      assert.equal(readResponse.status, 200);
      assert.ok(otherAlerts().every((n) => !n.read));

      // Rent rejection and confirmation originate from the real Manager interface.
      const rent = app.store
        .all("bills")
        .find((b) => !b.sourceId && b.tenantId === "tnt-001");
      const report = async () => {
        await go(tenant, "/tenant/bills", "My Bills & Payments");
        await tenant.locator(`[data-report-bill="${rent.id}"]`).click();
        await tenant.locator('[name="method"]').selectOption("cash");
        await save(tenant);
      };
      await report();
      let payment = app.store
        .all("payments")
        .find((p) => p.billId === rent.id && !p.rejectedOn);
      await go(manager, "/bills?tab=payments", "Bills & Payments");
      await manager.locator(`[data-reject-payment="${payment.id}"]`).click();
      await manager
        .locator('[name="reason"]')
        .fill("No matching rent payment found during external checking");
      await save(manager);
      await go(tenant, "/tenant/notifications", "Notifications");
      await expect(tenant.locator(".notification-feed")).toContainText(
        "Payment report rejected",
      );
      await expect(tenant.locator(".notification-feed")).toContainText(
        "No matching rent payment found during external checking",
      );
      await report();
      payment = app.store
        .all("payments")
        .find((p) => p.billId === rent.id && !p.rejectedOn);
      await go(manager, "/bills?tab=payments", "Bills & Payments");
      await manager.locator(`[data-confirm-payment="${payment.id}"]`).click();
      await expect(
        manager.locator(`[data-confirm-payment="${payment.id}"]`),
      ).toHaveCount(0);
      await tenant.locator('.topbar [data-action="notifications"]').click();
      await expect(tenant.locator("h1")).toHaveText("Notifications");
      const receipt = app.store.get("payments", payment.id).receiptNumber;
      await expect(tenant.locator(".notification-feed")).toContainText(
        `Receipt ${receipt} is available.`,
      );
      await expect(
        tenant.locator('.topbar [data-action="notifications"] .icon-btn__dot'),
      ).toHaveText(String(ownAlerts().filter((n) => !n.read).length));
      const count = ownAlerts().length;
      const managerUser = app.service.login({
        email: "manager@propertypro.ph",
        password,
      }).user;
      app.service.confirm(managerUser, payment.id);
      assert.equal(
        ownAlerts().length,
        count,
        "Retry must not create another payment alert",
      );

      // Exercise the existing reminder scheduler with a controlled future clock.
      const reminderDay = addDays(dueDate, -3);
      const reminderClock = new Date(reminderDay + "T09:00:00+08:00");
      app.service.reminders(reminderDay, reminderClock);
      const reminders = ownAlerts().filter((n) => n.kind === "reminder").length;
      assert.equal(reminders, 1);
      app.service.reminders(reminderDay, reminderClock);
      assert.equal(
        ownAlerts().filter((n) => n.kind === "reminder").length,
        reminders,
      );

      // Prepare a final rental cycle, then apply credit through the Manager UI.
      const finalDate = monthAfter(today, Number(today.slice(-2)));
      app.service.writeEntity(
        managerUser,
        "tenants",
        {
          leaseEnd: finalDate,
          assignmentEnd: finalDate,
          reason: "Controlled fixture: Manager records the final rental cycle",
        },
        "tnt-001",
      );
      app.service.generateRent(finalDate);
      const final = app.store
        .all("bills")
        .find(
          (b) =>
            !b.sourceId && b.tenantId === "tnt-001" && b.dueDate === finalDate,
        );
      assert.ok(final);
      await go(manager, "/bills?tab=records", "Bills & Payments");
      manager.once("dialog", (dialog) => dialog.accept());
      await manager.locator(`[data-apply-advance="${final.id}"]`).click();
      await expect(manager.locator("#toast-root")).toContainText(
        "Advance credit applied",
      );
      assert.equal(app.store.get("bills", final.id).paymentStatus, "paid");
      assert.equal(app.store.all("receipts").length, 1);
      const afterCredit = ownAlerts().length;
      app.service.applyAdvance(managerUser, final.id, { confirmed: true });
      assert.equal(ownAlerts().length, afterCredit);
      await tenant.reload();
      await assertFeed(tenant);
      await expect(tenant.locator(".notification-feed")).toContainText(
        "Due-date reminder",
      );
      await expect(tenant.locator(".notification-feed")).toContainText(
        "Advance rent credit applied",
      );
      await tenant.locator('[data-action="mark-read"]').click();
      await expect(
        tenant.locator('.topbar [data-action="notifications"] .icon-btn__dot'),
      ).toHaveCount(0);
      assert.ok(otherAlerts().every((n) => !n.read));

      // Restart the server/database; both alerts and read status must survive.
      const saved = ownAlerts();
    // This fixture deliberately restarts under an open browser. End its HTTP
    // connections so an in-flight badge refresh cannot hold shutdown open.
    app.server.closeAllConnections();
      await app.close();
      app = createApp({ store: new Store(filename), dataDir: dir, env });
      await listen();
      await tenant.reload();
      await expect(tenant.locator("h1")).toHaveText("Notifications");
      assert.deepEqual(ownAlerts(), saved);
      await assertFeed(tenant);
      await expect(tenant.locator(".notification-feed .badge")).toHaveCount(0);
      await tenant.setViewportSize({ width: 390, height: 844 });
      assert.ok(
        await tenant.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        "Notification page must fit a phone viewport",
      );
      mkdirSync("test-results", { recursive: true });
      await tenant.screenshot({
        path: "test-results/portal-notifications-mobile.png",
        fullPage: true,
      });
      assert.deepEqual(errors, []);
      await expect(tenant.locator(".page-header__title p")).toHaveText(
        "Saved billing alerts and updates.",
      );
    } finally {
      await browser?.close();
      app.server.closeAllConnections();
      await app.close();
      // Only the temporary fixture directory created by this test is removed.
      assert.equal(dirname(resolve(dir)), resolve(tmpdir()));
      assert.ok(basename(dir).startsWith("propertypro-notifications-"));
      rmSync(dir, { recursive: true, force: true });
    }
  },
);
