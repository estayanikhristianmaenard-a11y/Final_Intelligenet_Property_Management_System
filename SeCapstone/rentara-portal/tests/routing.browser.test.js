import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, expect } from "@playwright/test";
import { createApp } from "../server/index.js";
import { Store } from "../server/store.js";
import { Service } from "../server/service.js";
import { bootstrap } from "../server/bootstrap.js";

test(
  "logout and cross-role login discard old shell listeners and forbidden destinations",
  { timeout: 120000 },
  async () => {
    const dir = mkdtempSync(join(tmpdir(), "propertypro-routing-"));
    const store = new Store(join(dir, "test.sqlite"));
    const password = "RoutingTest!2026";
    bootstrap(new Service(store), {
      adminPassword: password,
      managerPassword: password,
      tenantPassword: password,
      demo: true,
    });
    const origin = "http://127.0.0.1:8098";
    const app = createApp({
      store,
      dataDir: dir,
      env: { ALLOWED_ORIGINS: origin },
    });
    let browser;
    try {
      await new Promise((resolve, reject) => {
        app.server.once("error", reject);
        app.server.listen(8098, "127.0.0.1", resolve);
      });
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
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const go = async (path) => page.goto(origin + "/#" + path);
      const login = async (role, heading, path) => {
        await expect(page.locator("h1")).toHaveText("Welcome back");
        await page.locator(`[data-role="${role}"]`).click();
        // This click reproduced the old outside-menu listener replacing the login screen.
        await expect(page.locator("#login-password")).toBeVisible();
        await expect(page.locator(".app-shell")).toHaveCount(0);
        await page.locator("#login-password").fill(password);
        await page.locator("[data-sign-in]").click();
        await expect(page).toHaveURL(origin + "/#" + path);
        await expect(page.locator("h1")).toHaveText(heading);
        await expect(page.locator(".skeleton")).toHaveCount(0);
        if (page.viewportSize().width > 1100) {
          const animation = await page.locator(".sidebar").evaluate(sidebar => ({
            properties:getComputedStyle(sidebar).transitionProperty.split(",").map(value => value.trim()),
            durations:getComputedStyle(sidebar).transitionDuration.split(",").map(value => value.trim()),
          }));
          assert.equal(animation.durations[animation.properties.indexOf("width")], "0.8s", `${role} sidebar timing`);
        }
      };
      const logout = async () => {
        if (page.viewportSize().width <= 1100) await page.locator('.topbar [data-action="toggle-nav"]').click();
        else await page.locator(".sidebar").hover();
        await page.locator('.sidebar [data-action="sign-out"]').click();
        await expect(page).toHaveURL(origin + "/#/login");
        await expect(page.locator("h1")).toHaveText("Welcome back");
        await expect(page.locator(".app-shell")).toHaveCount(0);
        const cached = await page.evaluate(() =>
          JSON.parse(sessionStorage.getItem("propertypro.auth.session")),
        );
        assert.equal(cached.token, null);
      };

      await go("/login");
      await page.locator("[data-toggle-password]").click();
      await expect(page.locator("#login-password")).toHaveAttribute("type","text");
      await page.locator("[data-toggle-password]").click();
      await expect(page.locator("#login-password")).toHaveAttribute("type","password");
      await login("manager", "Dashboard", "/dashboard");
      await page.mouse.move(900, 80);
      await expect(page.locator('.topbar [data-action="toggle-nav"]')).toBeHidden();
      await expect(page.locator(".user-menu")).toHaveCount(0);
      await expect.poll(async () => Math.round((await page.locator(".sidebar").boundingBox()).width)).toBe(76);
      const contentX = (await page.locator(".app-main").boundingBox()).x;
      assert.equal(contentX, 76);
      assert.ok((await page.locator(".app-main").boundingBox()).width > 1000);
      await page.locator(".sidebar").hover();
      await expect.poll(async () => Math.round((await page.locator(".sidebar").boundingBox()).width)).toBe(264);
      assert.equal((await page.locator(".app-main").boundingBox()).x, contentX);
      await page.mouse.move(900, 80);
      await expect.poll(async () => Math.round((await page.locator(".sidebar").boundingBox()).width)).toBe(76);
      const railLink = page.locator('.sidebar').getByRole("link", {name:"Properties", exact:true});
      await railLink.focus();
      await page.keyboard.press("Enter");
      await expect(page.locator("h1")).toHaveText("Properties");
      await logout();
      await login("tenant", "My home", "/tenant");
      await go("/tenant/bills");
      await expect(page.locator("h1")).toHaveText("My Bills & Payments");
      await expect(page.locator(".skeleton")).toHaveCount(0);
      await expect(page.locator("body")).not.toContainText(
        "Your bills could not be loaded",
      );
      const billRow = page.locator("tr.is-clickable").first();
      await billRow.locator('td[data-column="totalDue"]').click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Tab");
      assert.ok(await page.evaluate(() => Boolean(document.activeElement.closest('[role="dialog"]'))));
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await billRow.focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await page.reload();
      await expect(page.locator("h1")).toHaveText("My Bills & Payments");
      await logout();
      await login("admin", "System Dashboard", "/admin");
      await logout();

      // A Tenant destination saved before authentication cannot send a Manager there.
      await go("/tenant/bills");
      await login("manager", "Dashboard", "/dashboard");
      await logout();
      await go("/dashboard");
      await login("tenant", "My home", "/tenant");
      await logout();
      await go("/tenant/bills");
      await login("tenant", "My Bills & Payments", "/tenant/bills");
      await logout();

      // Permitted deep links retain their query, while direct forbidden access stays denied.
      await go("/bills?tab=exceptions");
      await login("manager", "Bills & Payments", "/bills?tab=exceptions");
      await go("/admin");
      await expect(page.locator("h1")).toHaveText(/This view is not available/);
      await logout();
      await go("/unknown");
      await login("admin", "System Dashboard", "/admin");
      await logout();

      await page.setViewportSize({ width: 390, height: 844 });
      await login("tenant", "My home", "/tenant");
      // Updating an existing view must not shrink to a loading skeleton and jump up.
      await page.locator(".tenant-property-banner h2").waitFor();
      await page.evaluate(() => window.scrollTo({ top:400, behavior:"instant" }));
      await page.route("**/api/v1/tenants/tnt-001", async route => {
        await new Promise(resolve => setTimeout(resolve, 200));
        await route.continue();
      });
      const scrollPositions = await page.evaluate(async () => {
        const { renderTenantHome } = await import("/src/features/tenant/tenant-home.page.js");
        const before = window.scrollY;
        const refresh = renderTenantHome(document.querySelector("[data-outlet]").firstElementChild);
        await new Promise(resolve => setTimeout(resolve, 100));
        const during = window.scrollY;
        await refresh;
        return { before, during, after:window.scrollY };
      });
      assert.ok(scrollPositions.before > 0);
      assert.equal(scrollPositions.during, scrollPositions.before);
      assert.equal(scrollPositions.after, scrollPositions.before);
      await page.unroute("**/api/v1/tenants/tnt-001");
      await expect(page.locator(".sidebar")).toHaveAttribute("inert", "");
      await go("/tenant/bills");
      const phoneReport = page.locator("[data-report-bill]").first();
      await phoneReport.scrollIntoViewIfNeeded();
      const phoneAction = await phoneReport.boundingBox();
      assert.ok(phoneAction.x >= 0 && phoneAction.x + phoneAction.width <= 390);
      assert.ok(phoneAction.height >= 44);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.locator('.topbar [data-action="toggle-nav"]').click();
      await expect(page.locator(".app-shell")).toHaveClass(/is-nav-open/);
      await expect(page.locator(".sidebar")).not.toHaveAttribute("inert", "");
      // Session expiry can happen while the mobile drawer blocks the user menu.
      store.db.prepare("DELETE FROM sessions WHERE userId=?").run("usr-tenant");
      await page.evaluate(async () => {
        const { api } = await import("/src/api/client.js");
        await api.get("/auth/me").catch(() => {});
      });
      await expect(page).toHaveURL(origin + "/#/login");
      await expect(page.locator("h1")).toHaveText("Welcome back");
      await login("manager", "Dashboard", "/dashboard");
      await expect(page.locator(".app-shell")).not.toHaveClass(/is-nav-open/);

      // A delayed 401 from the previous account must not clear the new account's session.
      let expiredRequest;
      let announce;
      const intercepted = new Promise((resolve) => {
        announce = resolve;
      });
      await page.route("**/api/v1/routing-regression-expired", (route) => {
        expiredRequest = route;
        announce();
      });
      await page.evaluate(async () => {
        const { api } = await import("/src/api/client.js");
        window.previousAccountRequest = api
          .get("/routing-regression-expired")
          .catch((error) => error.status);
      });
      await intercepted;
      await logout();
      await login("admin", "System Dashboard", "/admin");
      await expiredRequest.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Old session expired" }),
      });
      assert.equal(
        await page.evaluate(() => window.previousAccountRequest),
        401,
      );
      await expect(page).toHaveURL(origin + "/#/admin");
      await expect(page.locator("h1")).toHaveText("System Dashboard");
      assert.equal(
        await page.evaluate(
          () =>
            JSON.parse(sessionStorage.getItem("propertypro.auth.session")).user
              .role,
        ),
        "admin",
      );
      assert.deepEqual(errors, []);
      await logout();
    } finally {
      if (browser) await browser.close();
      await app.close();
      rmSync(dir, { recursive: true, force: true });
    }
  },
);
