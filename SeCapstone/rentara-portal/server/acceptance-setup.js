import { readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Store, DEFAULT_WORKSPACE } from "./store.js";
import { Service } from "./service.js";
import { bootstrap } from "./bootstrap.js";
import { Integrations } from "./integrations.js";
import { philippineDate } from "./rules.js";

const root = fileURLToPath(new URL("../", import.meta.url));
export async function setupAcceptance({
  dataDir = join(root, "data/acceptance"),
  tenantEmail = "rentara2026@gmail.com",
  password = "LocalDemo!2026",
} = {}) {
  const s = new Store(join(dataDir, "propertypro.sqlite"));
  let integration;
  try {
    const existing = s.get("settings", "local-acceptance");
    if (existing?.ready) return { ...existing, reused: true };
    if (s.all("users").length)
      throw new Error("Existing database preserved. Acceptance setup requires an empty database or a completed acceptance setup.");
    const service = new Service(s);
    bootstrap(service, { adminPassword: password, managerPassword: password, demo: false });
    s.withGlobal(() => s.save("workspaces", {
      ...s.getGlobal("workspaces", DEFAULT_WORKSPACE),
      name: "Rentara Local Acceptance",
    }));
    const admin = s.get("users", "usr-admin");
    const manager = s.get("users", "usr-manager");
    const property = service.writeEntity(manager, "properties", {
      name: "Local Acceptance Apartments", address: "Synthetic local test property",
      city: "Pasig City", type: "apartment",
    });
    const unit = service.writeEntity(manager, "units", {
      propertyId: property.id, code: "T-101", floor: "Ground Floor",
      monthlyRent: 6000, arrangement: "individual",
    });
    const tenant = service.writeEntity(manager, "tenants", {
      unitId: unit.id, fullName: "Local Acceptance Tenant", email: tenantEmail,
      leaseStart: "2026-08-01", assignmentStart: "2026-08-01",
    });
    service.userWrite(admin, {
      name: tenant.fullName, email: tenantEmail, role: "tenant",
      tenantId: tenant.id, workspaceId: DEFAULT_WORKSPACE, password,
    });
    for (const [provider, account, category] of [
      ["Meralco", "9990000001", "electricity"],
      ["Meralco", "TEST-MERALCO-001", "electricity"],
      ["Manila Water", "TEST-WATER-001", "water"],
    ]) service.writeEntity(manager, "mappings", { unitId: unit.id, provider, account, category });
    service.generateRent(philippineDate());
    // Only the anonymized fixture is read. No real mailbox or SMTP configuration.
    integration = new Integrations(service, dataDir, {});
    const bytes = await readFile(join(root, "docs/samples/utility-bills/anonymized/meralco-001/bill-digital.pdf"));
    const result = await integration.ingest(bytes, "ANONYMIZED-meralco-001.pdf", "application/pdf");
    if (result.document.ocrStatus !== "validated")
      throw new Error("Acceptance sample needs review; existing records preserved.");
    // Never deliver fabricated setup history when sending is enabled later.
    for (const n of s.all("notifications")) s.save("notifications", {
      ...n, delivery: "skipped", emailDelivery: "skipped",
    });
    const settings = { id: "local-acceptance", ready: true, tenantEmail,
      tenantId: tenant.id, unitId: unit.id, createdAt: new Date().toISOString() };
    s.save("settings", settings);
    return { ...settings, reused: false };
  } finally {
    await integration?.close();
    s.close();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await setupAcceptance();
    console.log(result.reused ? "Existing acceptance records preserved." : "Separate acceptance portfolio prepared. All amounts are test data.");
    console.log(`Tenant: ${result.tenantEmail}; Manager: manager@propertypro.ph; Admin: admin@propertypro.ph`);
    console.log("Initial local-only password: LocalDemo!2026. Rent email stays off; utility retrieval requires the separate explicit setup.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
