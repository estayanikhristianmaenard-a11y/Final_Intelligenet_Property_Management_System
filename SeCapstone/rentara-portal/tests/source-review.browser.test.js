import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { chromium, expect } from "@playwright/test";
import { createApp } from "../server/index.js";
import { Store } from "../server/store.js";
import { Service } from "../server/service.js";
import { bootstrap } from "../server/bootstrap.js";
import { utilityPdf, utilityText } from "./fixtures.js";

test("Manager compares protected PDF/image sources, corrects extracted values and uses the review on phones", { timeout: 60000 }, async () => {
  const dir = mkdtempSync(join(tmpdir(), "propertypro-source-review-"));
  const store = new Store(join(dir, "preview.sqlite"));
  bootstrap(new Service(store), { adminPassword: "PreviewTests!2026", managerPassword: "PreviewTests!2026", tenantPassword: "PreviewTests!2026", demo: true });
  const origin = "http://127.0.0.1:8101";
  const app = createApp({ store, dataDir: dir, env: { ALLOWED_ORIGINS: origin } });
  let browser;
  try {
    const pdf = await app.integrations.ingest(utilityPdf(), "sample.pdf", "application/pdf");
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6SAAAAABJRU5ErkJggg==", "base64");
    const image = await app.integrations.ingest(png, "sample.png", "image/png", {}, async () => ({ text: utilityText.replace("MER-12345", "IMAGE-12345"), confidence: 90 }));
    await new Promise(r => app.server.listen(8101, "127.0.0.1", r));
    browser = await chromium.launch({ headless: true, ...(process.platform === "win32" ? { executablePath: process.env.BROWSER_EXECUTABLE || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" } : {}) });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(origin);
    await page.locator("#login-email").fill("manager@propertypro.ph");
    await page.locator("#login-password").fill("PreviewTests!2026");
    await page.locator("[data-sign-in]").click();
    await page.waitForURL("**/#/dashboard");
    // The fragment changes before the async page finishes; opening a dialog
    // before routing settles lets that route replace the dialog underneath it.
    await expect(page.locator("main h1")).toHaveText("Dashboard");
    await expect(page.locator(".skeleton, .skeleton-line")).toHaveCount(0);
    const openSource = async id => {
      await page.evaluate(async id => { const { correctSource } = await import("/src/app/workflows.js"); await correctSource(id); }, id);
      await expect(page.locator(".source-review")).toBeVisible();
    };
    await openSource(pdf.document.id);
    await expect(page.locator(".source-review__pdf")).toHaveAttribute("src", /^blob:/);
    await page.locator('[data-edit-source-field="amountDue"]').click();
    await expect(page.locator('input[name="value"]')).toHaveValue("100");
    await page.locator('input[name="value"]').fill("111.11");
    await page.locator('textarea[name="reason"]').fill("");
    await page.locator("[data-workflow-save]").click();
    await expect(page.locator('textarea[name="reason"]')).toHaveAttribute("aria-invalid","true");
    await expect(page.locator('[data-workflow-field-error="reason"]')).toBeVisible();
    await expect(page.locator('input[name="value"]')).toHaveValue("111.11");
    await page.locator('textarea[name="reason"]').fill("Compare with the original document");
    await page.route("**/incoming/*/correct", route => route.fulfill({status:422,contentType:"application/json",body:JSON.stringify({message:"Check the corrected amount before saving."})}));
    await page.locator("[data-workflow-save]").click();
    await expect(page.locator('[data-workflow-error]')).toContainText("Check the corrected amount");
    await expect(page.locator('input[name="value"]')).toHaveValue("111.11");
    await expect(page.locator('[data-workflow-save]')).toBeEnabled();
    await page.unroute("**/incoming/*/correct");
    await page.locator("[data-workflow-save]").click();
    await expect(page.locator(".source-review")).toHaveCount(0);
    assert.equal(store.get("incoming", pdf.document.id).amountDue, 111.11);
    assert.equal(store.get("incoming", pdf.document.id).revision, 2);
    assert.ok(store.all("corrections").some(c => c.sourceId === pdf.document.id));
    await openSource(image.document.id);
    await expect(page.locator(".source-review__image")).toHaveAttribute("src", /^blob:/);
    await page.setViewportSize({ width: 390, height: 844 });
    const overflow = await page.locator(".modal").evaluate(e => e.scrollWidth > e.clientWidth);
    assert.equal(overflow, false);
    await page.keyboard.press("Escape");
    await expect(page.locator(".source-review")).toHaveCount(0);
    await page.route("**/incoming/*/source", route => route.fulfill({ status: 404, body: "missing" }));
    await openSource(pdf.document.id);
    await expect(page.locator("[data-source-preview-status]")).toContainText("unavailable");
    await expect(page.locator('input[name="value"]')).toBeVisible();
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await app.close();
    if (dirname(resolve(dir)) !== resolve(tmpdir())) throw new Error("Unexpected preview cleanup location");
    rmSync(dir, { recursive: true, force: true });
  }
});
