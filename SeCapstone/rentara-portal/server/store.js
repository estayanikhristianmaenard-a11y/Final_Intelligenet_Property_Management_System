import { DatabaseSync, backup } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import { AsyncLocalStorage } from "node:async_hooks";
import { HttpError } from "./rules.js";

export const DEFAULT_WORKSPACE = "ws-default";
const workspaceContext = new AsyncLocalStorage();
const workspaceTables = [
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
  "correction_proposals",
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
];

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
      CREATE TABLE IF NOT EXISTS correction_proposals(id TEXT PRIMARY KEY, data TEXT NOT NULL);
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
      CREATE INDEX IF NOT EXISTS sessions_user ON sessions(userId);
      CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expiresAt);`);
    this.columns = new Map();
    this.foreignKeys = new Map();
    try {
      this.migrateWorkspaces(filename);
      this.db.exec("CREATE INDEX IF NOT EXISTS audit_time ON audit(json_extract(data,'$.at') DESC,id DESC)");
      this.pruneExpiredSessions();
    } catch (error) {
      this.db.close();
      throw error;
    }
  }
  get workspaceId() {
    return workspaceContext.getStore()?.workspaceId ?? DEFAULT_WORKSPACE;
  }
  get globalScope() {
    return workspaceContext.getStore()?.global === true;
  }
  withWorkspace(workspaceId, fn) {
    if (!workspaceId || !this.getGlobal("workspaces", workspaceId))
      throw new HttpError(403, "Workspace unavailable");
    return workspaceContext.run({ workspaceId, global: false }, fn);
  }
  withGlobal(fn) {
    return workspaceContext.run({ global: true }, fn);
  }
  allGlobal(table) {
    return this.withGlobal(() => this.all(table));
  }
  getGlobal(table, id) {
    return this.withGlobal(() => this.get(table, id));
  }
  migrateWorkspaces(filename) {
    const migrated = this.db
      .prepare("PRAGMA table_info(properties)")
      .all()
      .some((c) => c.name === "workspaceId");
    // VACUUM INTO takes a consistent snapshot, including committed WAL data.
    if (
      !migrated &&
      filename !== ":memory:" &&
      this.db.prepare("SELECT count(*) AS n FROM users").get().n
    ) {
      const dir = dirname(filename) + "/backups";
      mkdirSync(dir, { recursive: true });
      this.db
        .prepare("VACUUM INTO ?")
        .run(`${dir}/before-workspaces-${Date.now()}-${randomUUID()}.sqlite`);
    }
    this.db.exec(
      "CREATE TABLE IF NOT EXISTS workspaces(id TEXT PRIMARY KEY,data TEXT NOT NULL)",
    );
    this.db
      .prepare("INSERT OR IGNORE INTO workspaces(id,data) VALUES(?,?)")
      .run(
        DEFAULT_WORKSPACE,
        JSON.stringify({
          id: DEFAULT_WORKSPACE,
          name: "Default workspace",
          status: "active",
        }),
      );
    if (migrated) {
      const columns = this.db.prepare("PRAGMA table_info(correction_proposals)").all();
      if (!columns.some(c => c.name === "workspaceId"))
        this.db.exec("ALTER TABLE correction_proposals ADD COLUMN workspaceId TEXT REFERENCES workspaces(id)");
      this.db.exec("CREATE INDEX IF NOT EXISTS correction_proposals_workspace ON correction_proposals(workspaceId)");
      return;
    }
    this.transaction(() => {
      for (const table of workspaceTables) {
        this.db.exec(
          `ALTER TABLE ${table} ADD COLUMN workspaceId TEXT REFERENCES workspaces(id)`,
        );
        this.db
          .prepare(
            `UPDATE ${table} SET workspaceId=CASE WHEN ?='users' AND json_extract(data,'$.role')='admin' THEN NULL ELSE ? END`,
          )
          .run(table, DEFAULT_WORKSPACE);
        this.db.exec(
          `UPDATE ${table} SET data=json_set(data,'$.workspaceId',workspaceId)`,
        );
      }
      // These logical keys are deliberately reusable across independent owners.
      for (const table of ["settings", "intake_messages"]) {
        this.db
          .exec(`CREATE TABLE ${table}_scoped(id TEXT NOT NULL,workspaceId TEXT NOT NULL REFERENCES workspaces(id),data TEXT NOT NULL,PRIMARY KEY(workspaceId,id));
          INSERT INTO ${table}_scoped SELECT id,workspaceId,data FROM ${table}; DROP TABLE ${table}; ALTER TABLE ${table}_scoped RENAME TO ${table}`);
      }
      this.db
        .exec(`CREATE TABLE mappings_scoped(id TEXT PRIMARY KEY,unitId TEXT NOT NULL REFERENCES units(id),provider TEXT NOT NULL,account TEXT NOT NULL,workspaceId TEXT NOT NULL REFERENCES workspaces(id),data TEXT NOT NULL,UNIQUE(workspaceId,provider,account));
        INSERT INTO mappings_scoped SELECT id,unitId,provider,account,workspaceId,data FROM mappings;DROP TABLE mappings;ALTER TABLE mappings_scoped RENAME TO mappings`);
      for (const table of workspaceTables)
        this.db.exec(
          `CREATE INDEX IF NOT EXISTS ${table}_workspace ON ${table}(workspaceId)`,
        );
    });
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
      "correction_proposals",
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
      "workspaces",
    ]);
    if (!allowed.has(name)) throw new Error("Invalid table");
    return name;
  }
  pruneExpiredSessions(now = new Date()) {
    return this.db
      .prepare("DELETE FROM sessions WHERE expiresAt <= ?")
      .run(now.toISOString()).changes;
  }
  decode(data) {
    const value = JSON.parse(data);
    if (value._storedOcrText?.encoding === "gzip") {
      value.rawText = gunzipSync(
        Buffer.from(value._storedOcrText.value, "base64"),
        { maxOutputLength: 32 * 1024 * 1024 },
      ).toString("utf8");
      delete value._storedOcrText;
    }
    return value;
  }
  all(table) {
    const scoped = !this.globalScope && table !== "workspaces";
    return this.db
      .prepare(
        `SELECT data FROM ${this.table(table)}${scoped ? ` WHERE workspaceId=?${table === "users" ? " OR workspaceId IS NULL" : ""}` : ""} ORDER BY rowid`,
      )
      .all(...(scoped ? [this.workspaceId] : []))
      .map((r) => this.decode(r.data));
  }
  auditPage({ limit = 50, offset = 0, action = "", from = "", until = "", actions = [] } = {}) {
    const clauses = [], values = [];
    if (!this.globalScope) { clauses.push("workspaceId=?"); values.push(this.workspaceId); }
    if (action) { clauses.push("instr(lower(json_extract(data,'$.action')),lower(?))>0"); values.push(action); }
    if (from) { clauses.push("json_extract(data,'$.at')>=?"); values.push(from); }
    if (until) { clauses.push("json_extract(data,'$.at')<?"); values.push(until); }
    if (actions.length) { clauses.push(`json_extract(data,'$.action') IN (${actions.map(() => "?").join(",")})`); values.push(...actions); }
    const where = clauses.length ? " WHERE " + clauses.join(" AND ") : "";
    const total = this.db.prepare("SELECT count(*) AS total FROM audit" + where).get(...values).total;
    const actualOffset = total ? Math.min(offset,Math.floor((total-1)/limit)*limit) : 0;
    const items = this.db.prepare("SELECT data FROM audit" + where + " ORDER BY json_extract(data,'$.at') DESC,id DESC LIMIT ? OFFSET ?")
      .all(...values, limit, actualOffset).map(row => this.decode(row.data));
    return {items, total, limit, offset:actualOffset};
  }
  get(table, id) {
    const scoped = !this.globalScope && table !== "workspaces";
    const row = this.db
      .prepare(
        `SELECT data FROM ${this.table(table)} WHERE id=?${scoped ? ` AND (workspaceId=?${table === "users" ? " OR workspaceId IS NULL" : ""})` : ""}`,
      )
      .get(id, ...(scoped ? [this.workspaceId] : []));
    return row ? this.decode(row.data) : null;
  }
  save(table, value) {
    this.table(table);
    if (table !== "workspaces") {
      const workspaceId =
        table === "users" && value.role === "admin"
          ? null
          : this.globalScope
            ? value.workspaceId
            : this.workspaceId;
      if (
        !workspaceId &&
        !(table === "users" && value.role === "admin") &&
        !(table === "audit" && this.globalScope)
      )
        throw new HttpError(403, "Workspace is required");
      if (
        !this.globalScope &&
        value.workspaceId !== undefined &&
        value.workspaceId !== workspaceId
      )
        throw new HttpError(403, "Workspace cannot be changed");
      const existing = this.getGlobal(table, value.id);
      if (
        existing &&
        existing.workspaceId !== workspaceId &&
        !["settings", "intake_messages", "users"].includes(table)
      )
        throw new HttpError(403, "Record belongs to another workspace");
      if (
        !this.globalScope &&
        table === "users" &&
        existing &&
        existing.workspaceId !== workspaceId
      )
        throw new HttpError(403, "Account belongs to another workspace");
      value = { ...value, workspaceId };
      if (!this.foreignKeys.has(table))
        this.foreignKeys.set(
          table,
          this.db.prepare(`PRAGMA foreign_key_list(${table})`).all(),
        );
      for (const fk of this.foreignKeys.get(table)) {
        if (fk.from === "workspaceId" || value[fk.from] == null) continue;
        const parent = this.getGlobal(fk.table, value[fk.from]);
        if (
          !parent ||
          (parent.workspaceId !== workspaceId &&
            !(fk.table === "users" && parent.role === "admin"))
        )
          throw new HttpError(
            403,
            "Related record belongs to another workspace or is unavailable",
          );
      }
    } else if (!this.globalScope && value.id !== DEFAULT_WORKSPACE)
      throw new HttpError(
        403,
        "Workspace maintenance requires administrator access",
      );
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
    let payload = value;
    if (
      table === "incoming" &&
      typeof value.rawText === "string" &&
      Buffer.byteLength(value.rawText) >= 1024 &&
      Buffer.byteLength(value.rawText) <= 32 * 1024 * 1024
    ) {
      const compressed = gzipSync(Buffer.from(value.rawText)).toString(
        "base64",
      );
      if (compressed.length + 80 < Buffer.byteLength(value.rawText)) {
        payload = {
          ...value,
          _storedOcrText: { encoding: "gzip", value: compressed },
        };
        delete payload.rawText;
      }
    }
    this.db
      .prepare(
        `INSERT INTO ${table} (${cols.join(",")},data) VALUES (${cols.map(() => "?").join(",")},?) ON CONFLICT(${["settings", "intake_messages"].includes(table) ? "workspaceId,id" : "id"}) DO UPDATE SET ${cols
          .filter((c) => c !== "id")
          .map((c) => `${c}=excluded.${c}`)
          .concat("data=excluded.data")
          .join(",")}`,
      )
      .run(...vals, JSON.stringify(payload));
    return value;
  }
  remove(table, id) {
    if (table === "workspaces")
      throw new HttpError(409, "Workspace deletion is not supported");
    this.db
      .prepare(
        `DELETE FROM ${this.table(table)} WHERE id=?${this.globalScope ? "" : " AND workspaceId=?"}`,
      )
      .run(id, ...(this.globalScope ? [] : [this.workspaceId]));
  }
  transaction(fn) {
    const depth = this.transactionDepth ?? 0;
    const point = `nested_${depth}`;
    this.db.exec(depth ? `SAVEPOINT ${point}` : "BEGIN IMMEDIATE");
    this.transactionDepth = depth + 1;
    try {
      const result = fn();
      this.db.exec(depth ? `RELEASE SAVEPOINT ${point}` : "COMMIT");
      return result;
    } catch (e) {
      if (depth) {
        this.db.exec(`ROLLBACK TO SAVEPOINT ${point}`);
        this.db.exec(`RELEASE SAVEPOINT ${point}`);
      } else this.db.exec("ROLLBACK");
      throw e;
    } finally {
      this.transactionDepth = depth;
    }
  }
  audit(user, action, target) {
    return this.save("audit", {
      id: newId("aud"),
      actor: user?.name ?? "System",
      actorId: user?.id ?? null,
      role: user?.role ?? "system",
      workspaceId:
        user?.workspaceId ?? (this.globalScope ? null : this.workspaceId),
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
