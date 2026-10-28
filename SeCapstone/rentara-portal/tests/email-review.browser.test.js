import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { chromium, expect } from "@playwright/test";
import { Store } from "../server/store.js";
import { Service } from "../server/service.js";
import { bootstrap } from "../server/bootstrap.js";
import { createApp } from "../server/index.js";
import { utilityEmail } from "./fixtures.js";

test("Manager sees a held-email explanation and retries through the real review button without dead source controls", { timeout: 90000 }, async () => {
  const dir = mkdtempSync(join(tmpdir(), "rentara-email-review-ui-"));
  const store = new Store(":memory:"), service = new Service(store), password = "EmailReview!2026";
  bootstrap(service, { adminPassword: password, managerPassword: password, tenantPassword: password, demo: true, demoStart: "2026-01-01" });
  store.save("mappings", { ...store.get("mappings", "map-demo"), account: "MER-12345" });
  const origin = "http://127.0.0.1:8116";
  const app = createApp({ store, dataDir: dir, env: { ALLOWED_ORIGINS: origin, IMAP_HOST: "imap.example.test", IMAP_USER: "test@example.test", IMAP_PASSWORD: "synthetic-only" } });
  let browser;
  try {
    let repaired = false, mailboxUid = 1;
    app.integrations.forWorkspace("ws-default").mailboxClient = async () => ({
      mailbox: { uidValidity: 1 }, async connect() {}, async getMailboxLock() { return { release() {} }; },
      async search() { return [mailboxUid]; }, async fetchOne() { const source = utilityEmail(); return { source, size: repaired ? source.length : 36 * 1024 * 1024 }; }, async logout() {},
    });
    await app.integrations.syncMailbox(store.get("users", "usr-manager"));
    const held = store.all("exceptions").find(e => e.intakeMessageId);
    await new Promise((r, reject) => { app.server.once("error", reject); app.server.listen(8116, "127.0.0.1", r); });
    browser = await chromium.launch({ headless: true, ...(process.platform === "win32" ? { executablePath: process.env.BROWSER_EXECUTABLE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" } : {}) });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = []; page.on("pageerror", e => errors.push(e.message));
    const requests=[]; page.on("request",r=>{if(r.url().includes("/api/v1/"))requests.push({method:r.method(),url:r.url()});});
    await page.goto(origin + "/#/login");
    await expect(page.locator("#login-email")).toBeVisible({ timeout: 5000 }).catch(async error => {
      throw new Error(JSON.stringify({ errors, body: (await page.locator("body").innerText()).slice(0, 300) }), { cause: error });
    });
    await page.locator("#login-email").fill("manager@propertypro.ph");
    await page.locator("#login-password").fill(password);
    await page.locator("[data-sign-in]").click();
    await expect(page.locator(".app-shell")).toBeVisible();
    await page.goto(origin + "/#/bills?tab=exceptions");
    const card = page.locator(".exception-card").filter({ hasText: "Email needs attention" });
    await expect(card).toContainText("other bills can continue");
    await expect(card.locator("[data-exc-source]")).toHaveCount(0);
    repaired = true;
    // Real PDF loading can outlast a generic 5s DOM assertion on a busy laptop.
    // Await the actual retry response before asserting its persisted outcome.
    const [retryResponse] = await Promise.all([
      page.waitForResponse(response => response.url().endsWith(`/exceptions/${held.id}/retry-email`) && response.request().method() === "POST"),
      card.getByRole("button", { name: "Retry email", exact: true }).click(),
    ]).catch(async error=>{throw new Error(JSON.stringify({errors,requests,caseText:await page.locator(".case-sheet").innerText(),buttonDisabled:await page.locator("[data-exc-retry-email]").isDisabled()}),{cause:error});});
    assert.equal(retryResponse.status(), 200);
    await expect.poll(() => store.get("exceptions", held.id).state).toBe("revalidated");
    assert.ok(store.all("bills").some(b => b.sourceId));
    repaired = false; mailboxUid = 2;
    await app.integrations.syncMailbox(store.get("users", "usr-manager"));
    const next = store.all("exceptions").find(e => e.intakeMessageId && e.state === "open");
    await page.reload();
    await page.locator(`[data-case-select="${next.sourceId || next.billId || next.id}"]`).click();
    await page.locator(`[data-exc-close-email="${next.id}"]`).click();
    await page.locator("#email-close-reason").fill("Uploaded a replacement copy for separate bill validation");
    await page.getByRole("button", { name: "Close notice", exact: true }).click();
    await expect.poll(() => store.get("exceptions", next.id).state).toBe("closed");
    await expect(page.locator(".exception-card").filter({ hasText: "Handled: Uploaded a replacement copy" })).toBeVisible();
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close(); await app.close();
    assert.equal(dirname(resolve(dir)), resolve(tmpdir()));
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
