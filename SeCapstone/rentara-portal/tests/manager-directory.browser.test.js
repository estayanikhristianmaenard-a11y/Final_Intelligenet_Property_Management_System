import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, expect as baseExpect } from "@playwright/test";
import { createShowcase } from "../server/demo-showcase.js";
import { createApp } from "../server/index.js";
import { Store } from "../server/store.js";

const expect = baseExpect.configure({ timeout: 10000 });

test("Manager directory: partial search, stable Tenant tabs and inline date validation", { timeout: 90000 }, async () => {
  const dir = mkdtempSync(join(tmpdir(), "rentara-directory-"));
  let app, browser, store;
  try {
    await createShowcase(dir);
    store = new Store(join(dir, "propertypro.sqlite"));
    const origin = "http://127.0.0.1:8107";
    app = createApp({ store, dataDir: dir, env: { ALLOWED_ORIGINS: origin } });
    await new Promise((resolve, reject) => {
      app.server.once("error", reject);
      app.server.listen(8107, "127.0.0.1", resolve);
    });
    browser = await chromium.launch({ headless: true, ...(process.platform === "win32" ? {
      executablePath: process.env.BROWSER_EXECUTABLE || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    } : {}) });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(origin);
    await page.locator("#login-email").fill("manager@propertypro.ph");
    await page.locator("#login-password").fill("LocalDemo!2026");
    await page.locator("[data-sign-in]").click();
    await expect(page.locator("h1")).toHaveText("Dashboard");
    await page.goto(origin + "/#/tenants");
    const search = page.getByRole("combobox", { name: "Search tenants" });
    await search.pressSequentially("ali", { delay: 300 });
    await expect(search).toBeFocused();
    await expect(search).toHaveValue("ali");
    await expect(page.getByRole("option", { name: /Alice Reyes/ })).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await search.press("Escape");
    await expect(search).toHaveAttribute("aria-expanded", "false");
    await search.fill("NO-SUCH-TENANT");
    await expect(page.getByRole("listbox")).toContainText("No matching tenants");
    await expect(page.locator("#app-root")).toContainText("No tenants match your filters");
    await search.fill("aLi");
    await search.press("ArrowDown");
    await search.press("Enter");
    await expect(page.locator(".panel-drawer h2")).toHaveText("Alice Reyes");
    await page.getByRole("button", { name: "Close panel" }).click();
    await expect(page.locator(".panel-drawer")).toHaveCount(0);
    await search.fill("");
    await expect(page.locator("tbody tr")).toHaveCount(3);
    await search.fill("Alice");
    await page.getByRole("button", { name: "Building A", exact: true }).click();
    await expect(page.locator("#app-root")).toContainText("No tenants match your filters");
    await search.focus();
    await expect(page.getByRole("listbox")).toContainText("No matching tenants");
    await page.getByRole("button", { name: "Building A", exact: true }).click();
    await search.fill("");
    const globalSearch = page.getByRole("combobox", { name: "Search the portal" });
    await globalSearch.fill("mAR");
    await page.getByRole("option", { name: /Maria Santos/ }).click();
    await expect(page.locator(".panel-drawer h2")).toHaveText("Maria Santos");
    await page.getByRole("button", { name: "Close panel" }).click();
    await expect(page.locator(".panel-drawer")).toHaveCount(0);
    await page.locator('[data-row-id="tnt-001"]').click();
    await expect(page.locator(".panel-drawer h2")).toHaveText("Maria Santos");
    for (const tab of ["overview", "payments", "documents", "billing", "overview", "billing"]) {
      await page.locator(`.panel-drawer [data-tab="${tab}"]`).click();
      await expect(page.locator(".panel-drawer")).toBeVisible();
      await expect(page.locator(`.panel-drawer [data-tab="${tab}"]`)).toHaveAttribute("aria-selected", "true");
      if (tab === "billing") {
        assert.ok(await page.locator(".panel-drawer .subtabs").evaluate(el => el.clientHeight >= 40), "Billing must not collapse the tab navigation");
        await expect(page.locator(".panel-drawer [data-body]")).toContainText("Total due");
        await expect(page.locator(".panel-drawer table").first()).toBeVisible();
      }
    }
    mkdirSync("test-results", { recursive: true });
    await page.screenshot({ path: "test-results/manager-billing-fixed.png" });
    for (const width of [820, 390, 320]) {
      await page.setViewportSize({ width, height: 850 });
      if (width <= 720) assert.ok(await page.locator(".panel-drawer").evaluate(panel => {
        const identity = panel.querySelector(".panel-drawer__identity").getBoundingClientRect();
        const unit = panel.querySelector(".panel-identity-row").getBoundingClientRect();
        return unit.top >= identity.bottom;
      }), "Phone Tenant identity and unit details must not overlap");
      for (const tab of ["overview", "billing", "payments", "documents"]) {
        await page.locator(`.panel-drawer [data-tab="${tab}"]`).click();
        assert.ok(await page.locator(".panel-drawer .subtabs").evaluate(el => el.clientHeight >= 40));
        await expect(page.getByRole("button", { name: "Close panel" })).toBeVisible();
      }
    }
    await page.locator('.panel-drawer [data-tab="billing"]').click();
    await page.screenshot({ path: "test-results/manager-billing-phone-fixed.png" });
    await page.getByRole("button", { name: "Close panel" }).click();
    await expect(page.locator(".panel-drawer")).toHaveCount(0);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const tenantCount = store.all("tenants").length;
    await page.getByRole("button", { name: "Add tenant", exact: true }).click();
    for (const [key, value] of Object.entries({
      fullName: "QA Date Check", email: "qa-date@example.test", leaseStart: "2026-09-30",
      leaseEnd: "2025-12-31", assignmentStart: "2028-06-28", assignmentEnd: "2023-04-21",
    })) await page.locator(`[name="${key}"]`).fill(value);
    let creates = 0;
    page.on("request", request => {
      if (request.method() === "POST" && request.url().endsWith("/tenants")) creates++;
    });
    await page.locator("[data-workflow-save]").click();
    await expect(page.locator('[data-workflow-field-error="leaseEnd"]')).toContainText("on or after");
    await expect(page.locator('[data-workflow-field-error="assignmentEnd"]')).toContainText("on or after");
    await expect(page.locator('[name="leaseEnd"]')).toBeFocused();
    assert.equal(creates, 0, "Invalid date ordering must be explained before submitting");
    assert.equal(store.all("tenants").length, tenantCount, "Form checks must not create a Tenant");
    await page.locator('[name="leaseEnd"]').fill("2028-12-31");
    await page.locator('[name="assignmentEnd"]').fill("2028-12-31");
    await expect(page.locator('[name="leaseEnd"]')).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.locator('[name="assignmentEnd"]')).not.toHaveAttribute("aria-invalid", "true");
    // Cancellation must preserve the portfolio after correcting input.
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(page.locator(".modal")).toHaveCount(0);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    if (app) await app.close();
    else store?.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
