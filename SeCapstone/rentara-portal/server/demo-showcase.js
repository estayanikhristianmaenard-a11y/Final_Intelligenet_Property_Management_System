import { promises as fs } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Store } from "./store.js";
import { Service, passwordHash } from "./service.js";
import { bootstrap } from "./bootstrap.js";
import { Integrations } from "./integrations.js";
import { philippineDate, addDays, anniversary } from "./rules.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const password = "LocalDemo!2026";

async function ensureIndependentWorkspace(service, dataDir) {
  const s = service.s,
    id = "ws-demo-b";
  const existing = s.getGlobal("workspaces", id);
  if (existing?.demoSeeded) return;
  if (existing)
    throw new Error(
      "Second demo workspace exists but is incomplete; existing records were preserved.",
    );
  s.withGlobal(() =>
    s.save("workspaces", {
      id,
      name: "Riverside Rentals",
      status: "active",
      demo: true,
    }),
  );
  const admin = s
    .allGlobal("users")
    .find((u) => u.role === "admin" && u.status === "active");
  const manager = service.userWrite(admin, {
    name: "Paolo Reyes",
    email: "manager2@example.test",
    role: "manager",
    workspaceId: id,
    password,
  });
  await s.withWorkspace(id, async () => {
    const today = philippineDate(),
      now = new Date(today + "T12:00:00Z");
    const month = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1),
    );
    const start = anniversary(
      month.getUTCFullYear(),
      month.getUTCMonth() + 1,
      Number(today.slice(-2)),
    );
    const property = service.writeEntity(manager, "properties", {
      name: "Riverside Apartments",
      letter: "R",
      address: "Synthetic demo property",
      city: "Pasig City",
      type: "apartment",
    });
    const unit = service.writeEntity(manager, "units", {
      propertyId: property.id,
      code: "R-101",
      floor: "Ground Floor",
      monthlyRent: 6000,
      arrangement: "individual",
    });
    const tenant = service.writeEntity(manager, "tenants", {
      unitId: unit.id,
      fullName: "Luis Garcia",
      email: "luis.garcia@example.test",
      leaseStart: start,
      assignmentStart: start,
    });
    const user = service.userWrite(admin, {
      name: tenant.fullName,
      email: tenant.email,
      role: "tenant",
      tenantId: tenant.id,
      workspaceId: id,
      password,
    });
    service.generateRent(today);
    for (const bill of s.all("bills").filter((b) => b.dueDate < today))
      service.confirm(
        manager,
        service.report(user, bill.id, { method: "cash" }).payment.id,
      );
    const integrations = new Integrations(
      service,
      join(dataDir, "workspaces", id),
      {},
    );
    try {
      for (const [provider, account, category, amount, days] of [
        ["Meralco", "DEMO-MERALCO-001", "electricity", "1200.50", 4],
        ["Manila Water", "DEMO-WATER-001", "water", "275.25", 7],
      ]) {
        service.writeEntity(manager, "mappings", {
          unitId: unit.id,
          provider,
          account,
          category,
        });
        await integrations.ingest(
          samplePdf(
            `DEMO - NOT A REAL PROVIDER BILL\n${provider}\nAccount: ${account}\nAmount Due: ${amount}\nDue Date: ${addDays(today, days)}\nBilling Period: ${today.slice(0, 7)}-01 to ${today}`,
          ),
          `DEMO-riverside-${category}.pdf`,
          "application/pdf",
        );
      }
    } finally {
      await integrations.close();
    }
    service.notify(
      tenant.id,
      "Welcome to Riverside Rentals",
      "These sample records belong only to your property workspace.",
      "billing",
      "demo-workspace-ready",
    );
  });
  s.withGlobal(() =>
    s.save("workspaces", {
      ...s.getGlobal("workspaces", id),
      demoSeeded: true,
    }),
  );
}

// Add a login for an existing synthetic occupant without regenerating any bills.
function ensureSecondTenant(service) {
  const s = service.s;
  if (s.get("settings", "demo-showcase")?.status !== "ready")
    throw new Error("Only a ready showcase can receive the second demo login.");
  const tenant = s.get("tenants", "tnt-002");
  if (
    !tenant ||
    tenant.fullName !== "Alice Reyes" ||
    tenant.email !== "occupant2@example.test"
  )
    throw new Error(
      "Expected showcase tenant is missing or changed; no account was added.",
    );
  const existing = s.all("users").find((u) => u.tenantId === tenant.id);
  if (existing) return;
  if (
    s.get("users", "usr-tenant-alice") ||
    s
      .all("users")
      .some((u) => u.email.toLowerCase() === tenant.email.toLowerCase())
  )
    throw new Error(
      "Demo login identity is already in use; existing accounts were preserved.",
    );
  s.transaction(() => {
    s.save("users", {
      id: "usr-tenant-alice",
      name: tenant.fullName,
      email: tenant.email,
      role: "tenant",
      tenantId: tenant.id,
      unitCode: s.get("units", tenant.unitId)?.code,
      status: "active",
      passwordHash: passwordHash(password),
    });
    service.notify(
      tenant.id,
      "Demo portal ready",
      "Your sample bills, receipts and personal utility tracker are ready. Other tenants' tracking marks stay separate.",
      "billing",
      "demo-second-tenant-ready",
    );
    s.save("messages", {
      id: "demo-message-alice",
      tenantId: tenant.id,
      subject: "Welcome to your demo portal",
      body: "These are dummy records for testing a second phone. Try your own rent report, utility tracker and calendar.",
      senderId: "usr-manager",
      sender: s.get("users", "usr-manager").name,
      channel: "portal_inbox",
      sentAt: new Date().toISOString(),
    });
    s.audit(null, "Second showcase Tenant login created", tenant.id);
  });
}

function samplePdf(text) {
  const content =
    "BT /F1 16 Tf 50 750 Td " +
    text
      .split("\n")
      .map(
        (line, i) =>
          (i ? "0 -30 Td " : "") +
          "(" +
          line.replace(/[\\()]/g, "\\$&") +
          ") Tj",
      )
      .join("\n") +
    " ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 900 850] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const [i, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf +=
    `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` +
    offsets
      .slice(1)
      .map((n) => String(n).padStart(10, "0") + " 00000 n \n")
      .join("") +
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}

export async function createShowcase(dataDir = resolve(root, "data/showcase")) {
  const s = new Store(join(dataDir, "propertypro.sqlite"));
  const service = new Service(s);
  const integrations = new Integrations(service, dataDir, {});
  try {
    if (s.all("users").length) {
      if (s.get("settings", "demo-showcase")?.status !== "ready")
        throw new Error(
          "Showcase directory contains existing or incomplete records; no accounts or bills were overwritten.",
        );
      ensureSecondTenant(service);
      await ensureIndependentWorkspace(service, dataDir);
      return;
    }
    const today = philippineDate();
    const current = new Date(today + "T12:00:00Z");
    const month = new Date(
      Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - 2, 1),
    );
    const start = anniversary(
      month.getUTCFullYear(),
      month.getUTCMonth() + 1,
      Number(today.slice(-2)),
    );
    bootstrap(service, {
      adminPassword: password,
      managerPassword: password,
      tenantPassword: password,
      demo: true,
      demoStart: start,
    });
    s.save("settings", {
      id: "demo-showcase",
      status: "building",
      createdAt: new Date().toISOString(),
    });
    const manager = s.get("users", "usr-manager");
    const tenant = s.get("users", "usr-tenant");
    for (const bill of s.all("bills").filter((b) => b.dueDate < today)) {
      const report = service.report(
        { role: "tenant", id: tenant.id, tenantId: bill.tenantId },
        bill.id,
        { method: "cash" },
      );
      service.confirm(manager, report.payment.id);
    }
    const pending = s
      .all("bills")
      .find((b) => b.tenantId === "tnt-003" && b.dueDate === today);
    service.report(
      { role: "tenant", id: tenant.id, tenantId: pending.tenantId },
      pending.id,
      { method: "bank_transfer", reference: "DEMO-RENT-REPORT" },
    );
    s.save("mappings", {
      ...s.get("mappings", "map-demo"),
      account: "DEMO-MERALCO-001",
    });
    s.save("mappings", {
      id: "map-demo-water",
      unitId: "unt-b",
      provider: "manila water",
      account: "DEMO-WATER-001",
      category: "water",
    });
    const billText = (provider, account, amount, due) =>
      `DEMO - NOT A REAL PROVIDER BILL\n${provider}\nAccount: ${account}\nAmount Due: ${amount}\nDue Date: ${due}\nBilling Period: ${today.slice(0, 7)}-01 to ${today}`;
    await integrations.ingest(
      samplePdf(
        billText("Meralco", "DEMO-MERALCO-001", "2550.00", addDays(today, 4)),
      ),
      "DEMO-electricity.pdf",
      "application/pdf",
    );
    const water = await integrations.ingest(
      samplePdf(
        billText("Manila Water", "DEMO-WATER-001", "660.00", addDays(today, 7)),
      ),
      "DEMO-water.pdf",
      "application/pdf",
    );
    const personalWater = s
      .all("bills")
      .find(
        (b) =>
          b.sourceId === water.document.id && b.tenantId === tenant.tenantId,
      );
    service.trackUtility(tenant, personalWater.id, {
      status: "self_reported_paid",
      revision: personalWater.revision,
    });
    await integrations.ingest(
      samplePdf(
        billText("Meralco", "DEMO-UNMAPPED-999", "1798.30", addDays(today, 9)),
      ),
      "DEMO-needs-account-review.pdf",
      "application/pdf",
    );
    s.save("messages", {
      id: "demo-message",
      tenantId: tenant.tenantId,
      subject: "Welcome to your demo portal",
      body: "These are sample records. Try the utility tracker, rent report, calendar, and confirmed receipts.",
      senderId: manager.id,
      sender: manager.name,
      channel: "portal_inbox",
      sentAt: new Date().toISOString(),
    });
    service.notify(
      tenant.tenantId,
      "Demo portal ready",
      "Sample bills and history are available. No external notifications are sent.",
      "billing",
      "demo-showcase-ready",
    );
    for (const n of s.all("notifications"))
      s.save("notifications", {
        ...n,
        delivery: "skipped",
        emailDelivery: "skipped",
      });
    s.save("settings", {
      id: "demo-showcase",
      status: "ready",
      createdAt: new Date().toISOString(),
    });
    ensureSecondTenant(service);
    await ensureIndependentWorkspace(service, dataDir);
  } finally {
    await integrations.close();
    s.close();
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    await createShowcase();
    if (process.argv.includes("--activate")) {
      const path = join(root, ".env");
      const text = await fs.readFile(path, "utf8").catch((error) => {
        if (error.code === "ENOENT") return "";
        throw error;
      });
      await fs.writeFile(
        path,
        /^DATA_DIR=/m.test(text)
          ? text.replace(/^DATA_DIR=.*$/m, "DATA_DIR=data/showcase")
          : text + "\nDATA_DIR=data/showcase\n",
      );
    }
    console.log(
      "Showcase ready in data/showcase. Existing data/demo records were preserved. All demo roles use LocalDemo!2026. External sending and mailbox sync are disabled for showcase records.",
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
