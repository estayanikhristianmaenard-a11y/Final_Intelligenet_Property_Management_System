import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { chromium, expect } from "@playwright/test";
import { Store } from "../server/store.js";
import { Service } from "../server/service.js";
import { bootstrap } from "../server/bootstrap.js";
import { createApp } from "../server/index.js";

test(
  "Admin creates a workspace and assigns a Manager; separate browser sessions see only their portfolio",
  { timeout: 90000 },
  async () => {
    const dir = mkdtempSync(join(tmpdir(), "rentara-workspace-ui-")),
      store = new Store(":memory:"),
      password = "WorkspaceUI!2026";
    bootstrap(new Service(store), {
      adminPassword: password,
      managerPassword: password,
      tenantPassword: password,
      demo: true,
    });
    const app = createApp({
      store,
      dataDir: dir,
      env: { ALLOWED_ORIGINS: "http://127.0.0.1:8115" },
    });
    let browser;
    try {
      await new Promise((r) => app.server.listen(8115, "127.0.0.1", r));
      browser = await chromium.launch({
        headless: true,
        ...(process.platform === "win32"
          ? {
              executablePath:
                process.env.BROWSER_EXECUTABLE ||
                "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
            }
          : {}),
      });
      const page = await browser.newPage({
          viewport: { width: 1440, height: 1000 },
        }),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const login = async (page, email) => {
        await page.goto("http://127.0.0.1:8115/#/login");
        await page.locator("#login-email").fill(email);
        await page.locator("#login-password").fill(password);
        await page.locator("[data-sign-in]").click();
        await expect(page.locator(".app-shell")).toBeVisible();
      };
      const save = async () => {
        await page.locator("[data-workflow-save]").click();
        await expect(page.getByRole("dialog")).toHaveCount(0);
      };
      await login(page, "admin@propertypro.ph");
      await page.goto("http://127.0.0.1:8115/#/admin/settings");
      await page
        .getByRole("button", { name: "Create workspace", exact: true })
        .click();
      await page.locator('[name="name"]').fill("Owner B business");
      await save();
      await expect(page.locator("main")).toContainText("Owner B business");
      const workspace = store
        .allGlobal("workspaces")
        .find((w) => w.name === "Owner B business");
      assert.ok(workspace);
      await page.getByRole("button", { name: "Add user", exact: true }).click();
      await page.locator('[name="role"]').selectOption("manager");
      await page.locator('[name="workspaceId"]').selectOption(workspace.id);
      await page.locator('[name="name"]').fill("Manager B");
      await page.locator('[name="email"]').fill("manager-b@example.test");
      await page.locator('[name="password"]').fill(password);
      await save();
      await expect(page.locator("main")).toContainText(
        "manager-b@example.test",
      );
      await page.locator('[data-action="sign-out"]').click();
      await login(page, "manager-b@example.test");
      await expect(page.locator(".sidebar__wordmark")).toContainText(
        "Owner B business",
      );
      await page.goto("http://127.0.0.1:8115/#/properties");
      await expect(page.locator("main")).not.toContainText("Building B");
      await page
        .getByRole("button", { name: "Add property", exact: true })
        .click();
      for (const [key, value] of Object.entries({
        name: "Owner B residence",
        letter: "R",
        address: "Synthetic address",
      }))
        await page.locator(`[name="${key}"]`).fill(value);
      await save();
      await expect(page.locator("main")).toContainText("Owner B residence");
      await page.reload();
      await expect(page.locator(".sidebar__wordmark")).toContainText(
        "Owner B business",
      );
      const other = await browser.newPage();
      await login(other, "manager@propertypro.ph");
      await other.goto("http://127.0.0.1:8115/#/properties");
      await expect(other.locator("main")).toContainText("Building B");
      await expect(other.locator("main")).not.toContainText(
        "Owner B residence",
      );
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(page.locator(".workspace-label")).toHaveText(
        "Owner B business",
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      assert.deepEqual(errors, []);
    } finally {
      await browser?.close();
      await app.close();
      if (dirname(resolve(dir)) !== resolve(tmpdir()))
        throw new Error("Unexpected browser test directory");
      rmSync(dir, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 100,
      });
    }
  },
);
