// Development-only Chapter III evidence. No .env, working database or mail access.
// Run after other tests/OCR/browser jobs finish; timings depend on current load.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, mkdtemp, rm, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import { resolve, join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { chromium } from "@playwright/test";
import { Store } from "../server/store.js";
import { Service } from "../server/service.js";
import { bootstrap } from "../server/bootstrap.js";
import { Integrations } from "../server/integrations.js";
import { parseUtilityText } from "../server/rules.js";
import { createApp } from "../server/index.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const workspace = resolve(root, "../..");
const samples = join(root, "docs/samples/utility-bills");
const outputArgument = process.argv.indexOf("--output");
const output = resolve(root, outputArgument >= 0 ? process.argv[outputArgument + 1] : "../reports/updates/chapter-3-development-evidence.json");
assert.ok(output.startsWith(workspace + sep), "Evidence output must stay inside this workspace");
assert.equal(output.endsWith(".json"), true, "Evidence output must be a JSON file");
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const isoNow = () => new Date().toISOString();
const round = value => Number(value.toFixed(3));
const password = "Chapter3Disposable!2026";
const fieldKeys = ["provider", "accountRef", "amountDue", "dueDate", "periodStart", "periodEnd"];
const dataDir = await mkdtemp(join(os.tmpdir(), "rentara-chapter3-"));
const report = {
  schemaVersion: 1,
  startedAt: isoNow(),
  timezone: "Asia/Manila",
  purpose: "Reproducible development evidence using disposable synthetic records and the existing fixture catalog",
  isolation: { workingPortfolioOpened: false, envFileRead: false, externalMailOrPushUsed: false, externalNetworkRequired: false },
  environment: {},
  apiTiming: null,
  extraction: null,
  limitations: [
    "Development fixtures are not actual participants or a representative provider-document sample.",
    "Different representations of one case are not independent bills. Only one catalog case comes from an anonymized actual-layout source.",
    "Field exact-match checks are not character-level OCR accuracy or general extraction accuracy.",
    "Loopback API requests are not page-load times, physical-phone/hotspot results, live provider delivery or a production load test.",
    "Five concurrent request loops are technical clients, not five observed human users.",
    "No formal ISO questionnaire, participant acceptance, comprehensive penetration test or long-term uptime is established.",
    "A mean or percentile is reported as an observation; no unapproved performance acceptance threshold is invented.",
  ],
};
let app, extractionIntegration, extractionStore;

function summarize(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    count: sorted.length,
    meanMs: round(sorted.reduce((a, b) => a + b, 0) / sorted.length),
    p50Ms: round(sorted[Math.ceil(sorted.length * 0.5) - 1]),
    p95Ms: round(sorted[Math.ceil(sorted.length * 0.95) - 1]),
    minMs: round(sorted[0]), maxMs: round(sorted.at(-1)),
    percentileMethod: "Nearest rank: ceil(p*n), with one-based rank",
  };
}

async function packageVersion(name) {
  const file = join(root, "node_modules", ...name.split("/"), "package.json");
  try { return { version: JSON.parse(await readFile(file, "utf8")).version, source: "installed package.json" }; }
  catch (error) { return { version: null, source: "not read", error: error.code ?? error.message }; }
}

async function collectEnvironment() {
  const cpus = os.cpus();
  const packages = {};
  for (const name of ["@playwright/test", "pdfjs-dist", "tesseract.js", "@tesseract.js-data/eng", "@napi-rs/canvas", "mailparser", "imapflow", "nodemailer", "web-push"])
    packages[name] = await packageVersion(name);
  const sources = {};
  for (const name of ["package-lock.json", "server/integrations.js", "server/rules.js", "server/service.js", "server/index.js"])
    sources[name] = sha256(await readFile(join(root, name)));
  const browserOptions = process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE }
    : process.platform === "win32" ? { executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" } : {};
  let browser;
  let browserVersion;
  try {
    browser = await chromium.launch({ headless: true, ...browserOptions });
    browserVersion = { browserEngine: "Chromium", version: browser.version(), executableName: browserOptions.executablePath ? browserOptions.executablePath.split(/[\\/]/).at(-1) : "Playwright default Chromium", headless: true };
  } catch (error) {
    browserVersion = { version: null, error: "Could not launch the configured local browser; inspect the local environment separately" };
  } finally { await browser?.close(); }
  report.environment = {
    checkedAt: isoNow(), platform: os.platform(), architecture: os.arch(), osRelease: os.release(),
    cpuModel: cpus[0]?.model ?? "unavailable", logicalCpuCount: cpus.length,
    totalPhysicalMemoryBytes: os.totalmem(), nodeVersion: process.version,
    browser: browserVersion, packages, sourceSha256: sources,
    noHostOrAccountNamesCollected: true,
  };
  const windowsCapture = join(root, "data/chapter3-system.json");
  if (existsSync(windowsCapture)) {
    const captured = JSON.parse((await readFile(windowsCapture, "utf8")).replace(/^\uFEFF/, ""));
    const allowed = ["collectedAt", "timezone", "operatingSystem", "osVersion", "osBuild", "architecture", "cpu", "physicalCores", "logicalProcessors", "installedRamBytes", "manufacturer", "model"];
    report.environment.windowsHardwareCapture = Object.fromEntries(allowed.filter(key => Object.hasOwn(captured, key)).map(key => [key, captured[key]]));
    report.environment.windowsHardwareCaptureNote = "Current hardware metadata supplied by the local Windows inventory; does not establish the environment of historical runs.";
  }
}

async function collectApiTiming() {
  const store = new Store(join(dataDir, "api.sqlite"));
  const service = new Service(store);
  bootstrap(service, { adminPassword: password, managerPassword: password, tenantPassword: password, demo: true, demoStart: "2026-01-01" });
  app = createApp({ store, dataDir: join(dataDir, "api"), env: { RENT_EMAIL_ENABLED: "false", ALLOWED_ORIGINS: "http://localhost:8080" } });
  await new Promise((resolveListen, reject) => {
    app.server.once("error", reject);
    app.server.listen(0, "127.0.0.1", resolveListen);
  });
  report.environment.sqliteVersion = store.db.prepare("SELECT sqlite_version() AS version").get().version;
  const base = `http://127.0.0.1:${app.server.address().port}/api/v1`;
  const response = await fetch(base + "/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "manager@propertypro.ph", password }),
  });
  assert.equal(response.status, 200, "Disposable Manager login must succeed");
  const { token } = await response.json();
  assert.ok(token, "Login must return a token");
  const request = async () => {
    const started = performance.now();
    const result = await fetch(base + "/reports/summary?range=all", { headers: { Authorization: "Bearer " + token } });
    const text = await result.text();
    const elapsed = performance.now() - started;
    const body = JSON.parse(text);
    return { elapsed, status: result.status, bytes: Buffer.byteLength(text), validJsonObject: Boolean(body) && typeof body === "object" };
  };
  for (let i = 0; i < 5; i++) assert.equal((await request()).status, 200);
  const groups = [];
  for (const clients of [1, 5]) {
    const results = [], memory = [process.memoryUsage().rss];
    const sampler = setInterval(() => memory.push(process.memoryUsage().rss), 25);
    const startedAt = isoNow(), start = performance.now();
    try {
      await Promise.all(Array.from({ length: clients }, async () => {
        for (let i = 0; i < 50 / clients; i++) results.push(await request());
      }));
    } finally { clearInterval(sampler); memory.push(process.memoryUsage().rss); }
    const counts = {};
    results.forEach(r => { counts[r.status] = (counts[r.status] ?? 0) + 1; });
    groups.push({
      startedAt, completedAt: isoNow(), concurrentRequestLoops: clients, requestsPerLoop: 50 / clients,
      warmupRequestsExcluded: clients === 1 ? 5 : 0, sharesPreviouslyWarmedServer: true,
      ...summarize(results.map(r => r.elapsed)), elapsedWallMs: round(performance.now() - start),
      statusCounts: counts, jsonResponses: results.filter(r => r.validJsonObject).length,
      responseBytes: [...new Set(results.map(r => r.bytes))],
      successfulResponses: results.filter(r => r.status === 200 && r.validJsonObject).length,
      sampledNodeRss: { sampleIntervalMs: 25, samples: memory.length, startBytes: memory[0], endBytes: memory.at(-1), minBytes: Math.min(...memory), maxBytes: Math.max(...memory), scope: "Node evidence collector and in-process HTTP server; excludes Edge, OS-wide usage and short spikes between samples" },
      requestDurationsMs: results.map(r => round(r.elapsed)),
    });
  }
  report.apiTiming = {
    measuredAt: isoNow(), endpoint: "GET /api/v1/reports/summary?range=all", transport: "HTTP loopback, authenticated Manager",
    timingBoundary: "Immediately before fetch through complete body read; login and warmups excluded",
    database: "Fresh disposable file-backed SQLite, synthetic bootstrap demo; no scheduler started",
    datasetCounts: Object.fromEntries(["properties", "units", "tenants", "bills", "payments", "receipts"].map(name => [name, store.all(name).length])),
    groups,
  };
  await app.close(); app = null;
}

async function collectExtraction() {
  extractionStore = new Store(":memory:");
  const service = new Service(extractionStore);
  bootstrap(service, { adminPassword: password, managerPassword: password, tenantPassword: password, demo: true, demoStart: "2026-01-01" });
  extractionIntegration = new Integrations(service, join(dataDir, "extract"), {});
  const cases = [], records = [];
  for (const origin of ["anonymized", "synthetic"]) {
    for (const entry of (await readdir(join(samples, origin), { withFileTypes: true })).filter(x => x.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
      const directory = join(samples, origin, entry.name);
      const metadataBytes = await readFile(join(directory, "case.json"));
      const definition = JSON.parse(metadataBytes);
      cases.push({ id: definition.id, origin: definition.origin, independentActualBill: definition.independentActualBill, metadataSha256: sha256(metadataBytes), inputRepresentations: definition.files.length });
      for (const input of definition.files) {
        const path = resolve(directory, input.path);
        assert.ok(path.startsWith(directory + sep), "Catalog input must stay within its case folder");
        const bytes = await readFile(path), isEmail = path.endsWith(".eml");
        const type = path.endsWith(".pdf") ? "application/pdf" : path.endsWith(".png") ? "image/png" : "message/rfc822";
        const record = { caseId: definition.id, origin: definition.origin, independentActualBill: definition.independentActualBill, input: relative(samples, path).split(sep).join("/"), bytes: bytes.length, sha256: sha256(bytes), catalogMethod: input.method, expectedFields: definition.expectedFields, expectedBusinessOutcome: definition.expectedOutcome, startedAt: isoNow() };
        const start = performance.now();
        try {
          let fields;
          if (isEmail) {
            const results = await extractionIntegration.ingestEmail(bytes);
            assert.equal(results.length, 1, "Catalog email should produce one source representation");
            fields = results[0].document;
            record.method = fields.intakeMethod === "email_body" ? "email_text" : "email_attachment";
            record.underlyingExtractionMethod = fields.extractionMethod ?? (record.method === "email_text" ? "direct_email_text" : null);
            record.businessProcessingOutcome = fields.processingOutcome ?? fields.ocrStatus;
            record.validationFailures = results[0].failures ?? [];
          } else {
            const extracted = await extractionIntegration.extract(bytes, type);
            fields = parseUtilityText(extracted.text);
            record.method = extracted.method ?? "image_ocr";
            record.scannedPages = extracted.scannedPages ?? 0;
          }
          record.actualFields = Object.fromEntries(fieldKeys.map(key => [key, fields[key] ?? null]));
          record.fieldComparisons = fieldKeys.map(key => ({ field: key, expected: definition.expectedFields[key], actual: fields[key] ?? null, exactMatch: fields[key] === definition.expectedFields[key] }));
          record.matchedFields = record.fieldComparisons.filter(field => field.exactMatch).length;
          record.comparedFields = fieldKeys.length;
          record.allFieldsMatch = record.matchedFields === fieldKeys.length;
          record.extractionError = fields.extractionError ?? null;
        } catch (error) {
          record.extractionError = error.message;
          record.actualFields = null;
          record.matchedFields = 0;
          record.comparedFields = fieldKeys.length;
          record.allFieldsMatch = false;
        }
        record.elapsedMs = round(performance.now() - start);
        record.completedAt = isoNow();
        records.push(record);
      }
    }
  }
  const groups = {};
  for (const [group, choose] of Object.entries({ directText: r => !["pdf_ocr", "image_ocr"].includes(r.catalogMethod), ocr: r => ["pdf_ocr", "image_ocr"].includes(r.catalogMethod) })) {
    const included = records.filter(choose);
    groups[group] = { inputRepresentations: included.length, distinctCaseIds: [...new Set(included.map(r => r.caseId))], comparedFieldValues: included.reduce((sum, r) => sum + r.comparedFields, 0), matchingFieldValues: included.reduce((sum, r) => sum + r.matchedFields, 0), representationsWithAllFieldsMatching: included.filter(r => r.allFieldsMatch).length, extractionErrors: included.filter(r => r.extractionError).length };
  }
  report.extraction = {
    measuredAt: isoNow(),
    procedure: "Every current case.json input was read unchanged. PDF/images use real Integrations.extract plus parseUtilityText; EML files use real ingestEmail. Six normalized values are compared exactly with case.json, without guessing or manual correction.",
    fixtureInterpretation: "An unmet business mapping or duplicate hold is distinct from a field-extraction mismatch. This extraction audit does not configure every catalog account/occupancy for finalization; end-to-end validation and isolation are covered by the separate automated suite.",
    timingLimits: "One sequential pass, no document timing warmups; first PDF/OCR may include module and worker initialization. Later OCR inputs reuse the local worker. This is not a stable throughput benchmark.",
    cases, distinctCases: cases.length, independentActualLayoutBills: cases.filter(c => c.independentActualBill).length,
    inputRepresentations: records.length, normalizedFieldKeys: fieldKeys, groups, records,
  };
  await extractionIntegration.close(); extractionIntegration = null;
  extractionStore.close(); extractionStore = null;
}

try {
  await collectEnvironment();
  // Measure API before OCR so OCR worker allocations do not become its baseline.
  await collectApiTiming();
  await collectExtraction();
  report.completedAt = isoNow();
  report.status = report.extraction.records.every(record => record.allFieldsMatch && !record.extractionError) && report.apiTiming.groups.every(group => group.successfulResponses === group.count) ? "passed_for_recorded_development_checks" : "recorded_failures_require_review";
} catch (error) {
  report.status = "collector_failed";
  report.error = error.message;
  report.completedAt = isoNow();
  process.exitCode = 1;
} finally {
  await app?.close();
  await extractionIntegration?.close();
  extractionStore?.close();
  assert.equal(dirname(resolve(dataDir)), resolve(os.tmpdir()), "Refusing cleanup outside the temporary root");
  assert.ok(dataDir.split(sep).at(-1).startsWith("rentara-chapter3-"), "Refusing unexpected cleanup target");
  await rm(dataDir, { recursive: true, force: true });
  report.isolation.disposableDataRemoved = !existsSync(dataDir);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + "\n");
}
console.log(JSON.stringify({ status: report.status, output: relative(workspace, output).split(sep).join("/"), cases: report.extraction?.distinctCases ?? null, representations: report.extraction?.inputRepresentations ?? null, groups: report.extraction?.groups ?? null }));
if (report.status !== "passed_for_recorded_development_checks") process.exitCode = 1;
