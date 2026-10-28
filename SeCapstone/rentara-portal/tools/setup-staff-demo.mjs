import { DatabaseSync, backup } from "node:sqlite";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Store } from "../server/store.js";
import { Service } from "../server/service.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const dir = join(root, "data/group-demo");
const database = join(dir, "propertypro.sqlite");
const original = new DatabaseSync(database, { readOnly: true });
try {
  const row = original.prepare("SELECT data FROM settings WHERE id='group-demo' AND workspaceId='ws-default'").get();
  if (!row || !JSON.parse(row.data).ready) throw new Error("Prepare the Group 3 demo first. No other database will be changed.");
  await mkdir(join(dir, "backups"), { recursive: true });
  await backup(original, join(dir, "backups", "before-staff-" + new Date().toISOString().replace(/[:.]/g, "-") + ".sqlite"));
} finally { original.close(); }
const s = new Store(database);
try {
  const marker = s.get("settings", "group-demo");
  const workspaceId = s.get("units", marker.units.A).workspaceId;
  const email = "staff.group3@example.test";
  const existing = s.all("users").find(u => u.email === email);
  if (existing) {
    if (existing.role !== "staff" || existing.workspaceId !== workspaceId)
      throw new Error("Existing account has another role/workspace; preserved without changes.");
    console.log("Existing Staff account preserved, including its password.");
  } else {
    const service = new Service(s);
    service.userWrite(s.get("users", "usr-admin"), { name: "Group 3 Operations Staff", email,
      role: "staff", workspaceId, password: "LocalDemo!2026" });
    console.log("Local-only Staff demo account created. Initial password: LocalDemo!2026");
  }
  console.log("Staff login: " + email);
  console.log("Bills, Tenant records, receipts and mappings preserved. No email sent or mailbox accessed.");
} finally { s.close(); }
