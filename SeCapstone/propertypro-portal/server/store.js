import { DatabaseSync, backup } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

export const newId = (prefix) => `${prefix}-${randomUUID()}`;
export class Store {
  constructor(filename = ":memory:") {
    if (filename !== ":memory:")
      mkdirSync(dirname(filename), { recursive: true });
    this.db = new DatabaseSync(filename);
    this.db
      .exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS properties(id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS units(id TEXT PRIMARY KEY, propertyId TEXT NOT NULL REFERENCES properties(id), data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS tenants(id TEXT PRIMARY KEY, unitId TEXT NOT NULL REFERENCES units(id), propertyId TEXT NOT NULL REFERENCES properties(id), data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS leases(id TEXT PRIMARY KEY, tenantId TEXT NOT NULL REFERENCES tenants(id), unitId TEXT NOT NULL REFERENCES units(id), data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS assignments(id TEXT PRIMARY KEY, tenantId TEXT NOT NULL REFERENCES tenants(id), unitId TEXT NOT NULL REFERENCES units(id), data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE, tenantId TEXT UNIQUE REFERENCES tenants(id), data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES users(id), expiresAt TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS incoming(id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS mappings(id TEXT PRIMARY KEY, unitId TEXT NOT NULL REFERENCES units(id), provider TEXT NOT NULL, account TEXT NOT NULL, data TEXT NOT NULL, UNIQUE(provider,account));
      CREATE TABLE IF NOT EXISTS bills(id TEXT PRIMARY KEY, tenantId TEXT NOT NULL REFERENCES tenants(id), propertyId TEXT NOT NULL REFERENCES properties(id), sourceId TEXT REFERENCES incoming(id), cycleKey TEXT NOT NULL UNIQUE, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS lines(id TEXT PRIMARY KEY, billId TEXT NOT NULL REFERENCES bills(id) ON DELETE CASCADE, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS allocations(id TEXT PRIMARY KEY, sourceId TEXT REFERENCES incoming(id), billId TEXT NOT NULL REFERENCES bills(id), tenantId TEXT NOT NULL REFERENCES tenants(id), cents INTEGER NOT NULL CHECK(cents>=0), data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS payments(id TEXT PRIMARY KEY, billId TEXT NOT NULL REFERENCES bills(id), tenantId TEXT NOT NULL REFERENCES tenants(id), data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS receipts(id TEXT PRIMARY KEY, paymentId TEXT NOT NULL UNIQUE REFERENCES payments(id), billId TEXT NOT NULL REFERENCES bills(id), tenantId TEXT NOT NULL REFERENCES tenants(id), data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS exceptions(id TEXT PRIMARY KEY, sourceId TEXT REFERENCES incoming(id), billId TEXT REFERENCES bills(id), data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS corrections(id TEXT PRIMARY KEY, sourceId TEXT REFERENCES incoming(id), billId TEXT REFERENCES bills(id), managerId TEXT NOT NULL REFERENCES users(id), data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS notifications(id TEXT PRIMARY KEY, tenantId TEXT NOT NULL REFERENCES tenants(id), eventKey TEXT NOT NULL UNIQUE, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS subscriptions(id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES users(id), data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY, tenantId TEXT NOT NULL REFERENCES tenants(id), data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS documents(id TEXT PRIMARY KEY, tenantId TEXT REFERENCES tenants(id), data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS credits(id TEXT PRIMARY KEY, tenantId TEXT NOT NULL REFERENCES tenants(id), billId TEXT UNIQUE REFERENCES bills(id), data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS rent_cycles(id TEXT PRIMARY KEY, unitId TEXT NOT NULL REFERENCES units(id), data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS activity(id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS settings(id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS intake_messages(id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS bills_tenant ON bills(tenantId);
      CREATE INDEX IF NOT EXISTS payments_bill ON payments(billId);
      CREATE INDEX IF NOT EXISTS notifications_tenant ON notifications(tenantId);
      CREATE INDEX IF NOT EXISTS sessions_user ON sessions(userId);`);
    this.columns = new Map();
  }
  table(name) {
    const allowed = new Set([
      "properties",
      "units",
      "tenants",
      "leases",
      "assignments",
      "users",
      "incoming",
      "mappings",
      "bills",
      "lines",
      "allocations",
      "payments",
      "receipts",
      "exceptions",
      "corrections",
      "notifications",
      "subscriptions",
      "messages",
      "documents",
      "credits",
      "rent_cycles",
      "activity",
      "audit",
      "settings",
      "intake_messages",
    ]);
    if (!allowed.has(name)) throw new Error("Invalid table");
    return name;
  }
  all(table) {
    return this.db
      .prepare(`SELECT data FROM ${this.table(table)}`)
      .all()
      .map((r) => JSON.parse(r.data));
  }
  get(table, id) {
    const row = this.db
      .prepare(`SELECT data FROM ${this.table(table)} WHERE id=?`)
      .get(id);
    return row ? JSON.parse(row.data) : null;
  }
  save(table, value) {
    this.table(table);
    if (!this.columns.has(table))
      this.columns.set(
        table,
        this.db
          .prepare(`PRAGMA table_info(${table})`)
          .all()
          .map((c) => c.name)
          .filter((c) => c !== "data"),
      );
    const cols = this.columns.get(table),
      vals = cols.map((k) => value[k] ?? null);
    this.db
      .prepare(
        `INSERT INTO ${table} (${cols.join(",")},data) VALUES (${cols.map(() => "?").join(",")},?) ON CONFLICT(id) DO UPDATE SET ${cols
          .filter((c) => c !== "id")
          .map((c) => `${c}=excluded.${c}`)
          .concat("data=excluded.data")
          .join(",")}`,
      )
      .run(...vals, JSON.stringify(value));
    return value;
  }
  remove(table, id) {
    this.db.prepare(`DELETE FROM ${this.table(table)} WHERE id=?`).run(id);
  }
  transaction(fn) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      this.db.exec("COMMIT");
      return result;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  audit(user, action, target) {
    return this.save("audit", {
      id: newId("aud"),
      actor: user?.name ?? "System",
      actorId: user?.id ?? null,
      role: user?.role ?? "system",
      action,
      target,
      at: new Date().toISOString(),
    });
  }
  activity(
    type,
    subject,
    status = "Pending",
    href = "#/bills",
    actor = "System",
  ) {
    return this.save("activity", {
      id: newId("act"),
      type,
      subject,
      actor,
      status,
      href,
      timestamp: new Date().toISOString(),
    });
  }
  async backup(filename) {
    await backup(this.db, filename);
  }
  close() {
    this.db.close();
  }
}
