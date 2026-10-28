import { Store, DEFAULT_WORKSPACE } from "./store.js";
import { Service } from "./service.js";
import { bootstrap } from "./bootstrap.js";
import { philippineDate } from "./rules.js";
import { join } from "node:path";

// Controlled demonstration portfolio; never modifies showcase or acceptance data.
export function setupGroupDemo(dataDir, members, password = "LocalDemo!2026") {
  if (!Array.isArray(members) || members.length !== 3 ||
      members.filter(m => m.unit === "A").length !== 2 ||
      members.filter(m => m.unit === "B").length !== 1 ||
      members.some(m => !m.name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email)) ||
      new Set(members.map(m => m.email.toLowerCase())).size !== 3)
    throw new Error("Provide three named members with unique emails: two in A and one in B.");
  const s = new Store(join(dataDir, "propertypro.sqlite"));
  try {
    const existing = s.get("settings", "group-demo");
    if (existing?.ready) {
      const matches = members.every(m => existing.members.some(e =>
        e.name === m.name && e.email === m.email && e.unit === m.unit));
      if (!matches) throw new Error("Group demo already exists with different members; existing records preserved.");
      s.save("settings", { ...s.get("settings", "billing"), intakeMailbox: "rentara2026@gmail.com" });
      return { ...existing, reused: true };
    }
    if (s.all("users").length) throw new Error("Group setup requires an empty database; existing records preserved.");
    const service = new Service(s);
    bootstrap(service, { adminPassword: password, managerPassword: password, demo: false });
    s.save("settings", { ...s.get("settings", "billing"), intakeMailbox: "rentara2026@gmail.com" });
    s.withGlobal(() => s.save("workspaces", {
      ...s.getGlobal("workspaces", DEFAULT_WORKSPACE), name: "Group 3 Demonstration",
    }));
    const admin = s.get("users", "usr-admin"), manager = s.get("users", "usr-manager");
    const property = service.writeEntity(manager, "properties", {
      name: "Group 3 Demo Apartments", address: "Synthetic demonstration address",
      city: "Pasig City", type: "apartment",
    });
    const units = {};
    for (const code of ["A", "B"]) {
      units[code] = service.writeEntity(manager, "units", {
        propertyId: property.id, code: `G3-${code}`, floor: "Ground Floor",
        monthlyRent: code === "A" ? 6000 : 5000,
        arrangement: code === "A" ? "shared_occupancy" : "individual",
      });
      service.writeEntity(manager, "mappings", {
        unitId: units[code].id, provider: "Meralco", category: "electricity",
        account: code === "A" ? "G3000101" : "G3000102",
      });
    }
    const saved = [];
    for (const m of members) {
      const tenant = service.writeEntity(manager, "tenants", {
        unitId: units[m.unit].id, fullName: m.name, email: m.email,
        leaseStart: "2026-10-01", assignmentStart: "2026-10-01",
      });
      const user = service.userWrite(admin, {
        name: m.name, email: m.email, role: "tenant", tenantId: tenant.id,
        workspaceId: DEFAULT_WORKSPACE, password,
      });
      saved.push({ ...m, tenantId: tenant.id, userId: user.id });
    }
    service.generateRent(philippineDate());
    // No fabricated history is queued for external delivery.
    for (const n of s.all("notifications")) s.save("notifications", {
      ...n, delivery: "skipped", emailDelivery: "skipped",
    });
    const result = { id: "group-demo", ready: true, members: saved,
      units: Object.fromEntries(Object.entries(units).map(([k, v]) => [k, v.id])),
      createdAt: new Date().toISOString() };
    s.save("settings", result);
    return { ...result, reused: false };
  } finally { s.close(); }
}
