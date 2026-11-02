import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join, relative, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import { DatabaseSync } from "node:sqlite";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { Store, DEFAULT_WORKSPACE } from "../server/store.js";
import { Service } from "../server/service.js";
import { bootstrap } from "../server/bootstrap.js";
import { sharedConnectionKeys } from "../server/profile-policy.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const defaults = {
  DATA_DIR: "data/operational", HOST: "127.0.0.1", PORT: "8081",
  PORTAL_URL: "http://localhost:8081/",
  ALLOWED_ORIGINS: "http://localhost:8081,http://127.0.0.1:8081",
  TLS_CERT_FILE: "", TLS_KEY_FILE: "", RENT_EMAIL_ENABLED: "false",
  SMTP_HOST: "", SMTP_PORT: "587", SMTP_USER: "", SMTP_PASSWORD: "", SMTP_FROM: "",
  IMAP_HOST: "", IMAP_PORT: "993", IMAP_MAILBOX: "Rentara-Utilities",
  IMAP_USER: "", IMAP_PASSWORD: "", IMAP_ACCESS_TOKEN: "",
  VAPID_SUBJECT: "", VAPID_PUBLIC_KEY: "", VAPID_PRIVATE_KEY: "",
  OCR_LANG_PATH: "", WORKSPACE_CONFIG_FILE: "",
  UTILITY_INTAKE_ENABLED: "false",
};

/** Ignore inherited application configuration; retain the OS environment for Node/OCR. */
export function operationalEnvironment(profile = {}, inherited = process.env, projectRoot = root, shared = {}) {
  const env = { ...inherited, ...defaults };
  for (const key of sharedConnectionKeys) if (shared[key]) env[key] = shared[key];
  for (const key of Object.keys(defaults)) if (profile[key] !== undefined && (!sharedConnectionKeys.includes(key) || profile[key] !== '')) env[key] = profile[key];
  env.RENTARA_PROFILE = 'operational';
  if (env.IMAP_MAILBOX.trim().toLowerCase() === 'rentara-group3-demo')
    throw new Error('Operational must use a separate mailbox label, not Rentara-Group3-Demo.');
  if (!['true','false'].includes(env.UTILITY_INTAKE_ENABLED) || !['true','false'].includes(env.RENT_EMAIL_ENABLED))
    throw new Error('Delivery and intake switches must be true or false.');
  const dataDir = resolve(projectRoot, "data/operational");
  if (resolve(projectRoot, env.DATA_DIR) !== dataDir)
    throw new Error("Operational DATA_DIR must be data/operational; other profiles are preserved.");
  const port = Number(env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("Operational PORT must be an integer from 1 to 65535.");
  if (Boolean(env.TLS_CERT_FILE) !== Boolean(env.TLS_KEY_FILE))
    throw new Error("Operational HTTPS requires both certificate and key paths.");
  let portal;
  try { portal = new URL(env.PORTAL_URL); } catch { throw new Error("Set a valid operational PORTAL_URL."); }
  if (!["http:", "https:"].includes(portal.protocol) || portal.username || portal.password || portal.hash || portal.search || portal.pathname !== "/")
    throw new Error("Operational PORTAL_URL must be an HTTP(S) root address without credentials, query or fragment.");
  if ((portal.protocol === "https:") !== Boolean(env.TLS_CERT_FILE))
    throw new Error("Operational PORTAL_URL must match the configured HTTP/HTTPS transport.");
  const expectedPort = Number(portal.port || (portal.protocol === "https:" ? 443 : 80));
  if (expectedPort !== port) throw new Error("Operational PORTAL_URL must use the configured PORT.");
  const origins = env.ALLOWED_ORIGINS.split(",").map(value => value.trim()).filter(Boolean);
  if (!origins.includes(portal.origin)) throw new Error("Include the operational PORTAL_URL origin in ALLOWED_ORIGINS.");
  if (env.WORKSPACE_CONFIG_FILE) {
    const config = resolve(projectRoot, env.WORKSPACE_CONFIG_FILE);
    const within = relative(dataDir, config);
    if (!within || within.startsWith("..") || isAbsolute(within))
      throw new Error("Operational workspace integration settings must stay inside data/operational.");
    env.WORKSPACE_CONFIG_FILE = config;
  }
  env.DATA_DIR = dataDir;
  env.ALLOWED_ORIGINS = origins.join(",");
  // Existing setup's shared password shortcut must not affect this profile.
  delete env.INITIAL_PASSWORD;
  return env;
}

export function prepareOperational(projectRoot = root) {
  const filename = join(projectRoot, ".env.operational");
  try {
    writeFileSync(filename, readFileSync(join(projectRoot, ".env.operational.example")), { flag: "wx", mode: 0o600 });
    return { filename, created: true };
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    return { filename, created: false };
  }
}

/** Check identity before any migration/server job can open a working database. */
export function assertOperationalDatabase(filename) {
  if (!existsSync(filename)) throw new Error("Run npm.cmd run setup:operational first; no operational database exists yet.");
  const db = new DatabaseSync(filename, { readOnly: true });
  try {
    const rows = db.prepare("SELECT id,data FROM settings WHERE workspaceId=? AND id IN (?,?)")
      .all(DEFAULT_WORKSPACE, "operational-profile", "demo-showcase");
    const marker = rows.find(row => row.id === "operational-profile");
    if (!marker || JSON.parse(marker.data).ready !== true || rows.some(row => row.id === "demo-showcase") || !db.prepare("SELECT count(*) AS n FROM users").get().n)
      throw new Error("Not a prepared operational database.");
    return true;
  } catch {
    throw new Error("Operational startup refused: this database is unprepared or belongs to another profile. Existing records were preserved.");
  } finally { db.close(); }
}

function validateAccounts({ workspaceName, admin, manager }) {
  if (typeof workspaceName !== "string" || workspaceName.trim().length < 2 || workspaceName.trim().length > 100)
    throw new Error("Workspace name must contain 2 to 100 characters.");
  for (const account of [admin, manager]) {
    if (typeof account?.name !== "string" || account.name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email?.trim() ?? ""))
      throw new Error("Each initial account needs a name and valid email.");
    if (typeof account.password !== "string" || account.password.length < 12 || account.password.length > 200)
      throw new Error("Each password must contain 12 to 200 characters.");
  }
  if (admin.email.trim().toLowerCase() === manager.email.trim().toLowerCase())
    throw new Error("Admin and Manager must have separate email addresses.");
}

/** New, empty portfolio only. Never replace/reset an existing database or account. */
export function initializeOperational(options, projectRoot = root) {
  validateAccounts(options);
  const filename = join(projectRoot, "data/operational/propertypro.sqlite");
  if (existsSync(filename)) {
    assertOperationalDatabase(filename);
    return { filename, reused: true };
  }
  const store = new Store(filename);
  try {
    store.transaction(() => {
      const service = new Service(store);
      bootstrap(service, {
        demo: false,
        adminPassword: options.admin.password, managerPassword: options.manager.password,
        adminName: options.admin.name.trim(), adminEmail: options.admin.email.trim().toLowerCase(),
        managerName: options.manager.name.trim(), managerEmail: options.manager.email.trim().toLowerCase(),
      });
      const admin = store.getGlobal("users", "usr-admin");
      service.workspaceWrite(admin, { name: options.workspaceName }, DEFAULT_WORKSPACE);
      store.save("settings", { id: "operational-profile", ready: true, createdAt: new Date().toISOString() });
      const billing = store.get("settings", "billing");
      store.save("settings", { ...billing, pushEnabled: false });
    });
    return { filename, reused: false };
  } finally { store.close(); }
}

async function promptAccounts() {
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw new Error("Run setup:operational in your own terminal to enter account details privately.");
  let muted = false;
  const output = new Writable({ write(chunk, encoding, done) { if (!muted) process.stdout.write(chunk, encoding); done(); } });
  const rl = createInterface({ input: process.stdin, output, terminal: true, historySize: 0 });
  const secret = async label => {
    process.stdout.write(label);
    muted = true;
    try { return await rl.question(""); }
    finally { muted = false; process.stdout.write("\n"); }
  };
  try {
    const workspaceName = await rl.question("Workspace / management name: ");
    const account = async role => {
      const name = await rl.question(`${role} full name: `);
      const email = await rl.question(`${role} email: `);
      const password = await secret(`${role} password (12–200 characters; hidden): `);
      if (password !== await secret("Confirm password (hidden): ")) throw new Error("Passwords did not match. No account was created.");
      return { name, email, password };
    };
    return { workspaceName, admin: await account("Admin"), manager: await account("Manager") };
  } finally { rl.close(); output.end(); }
}

async function main() {
  const action = process.argv[2];
  if (!["prepare", "setup", "start"].includes(action)) throw new Error("Use npm.cmd run setup:operational or npm.cmd run start:operational.");
  const prepared = prepareOperational();
  const profile = parseEnv(readFileSync(prepared.filename, "utf8"));
  const sharedFile = join(root, '.env');
  const shared = existsSync(sharedFile) ? parseEnv(readFileSync(sharedFile, 'utf8')) : {};
  const env = operationalEnvironment(profile, process.env, root, shared);
  if (action === "prepare") {
    console.log("Operational configuration prepared. No database, account, mailbox connection or message was created.");
    return;
  }
  const filename = join(env.DATA_DIR, "propertypro.sqlite");
  if (action === "setup") {
    if (existsSync(filename)) {
      assertOperationalDatabase(filename);
      console.log("Operational setup already complete. Existing records and passwords preserved.");
      return;
    }
    initializeOperational(await promptAccounts());
    console.log("Operational setup complete. Empty portfolio; your Admin and Manager accounts are ready. Run npm.cmd run start:operational.");
    return;
  }
  assertOperationalDatabase(filename);
  console.log(`Operational profile: ${env.PORTAL_URL}`);
  console.log(`Separate operational database: ${env.DATA_DIR}. Shared .env supplies connection settings only; demo data/settings are not loaded.`);
  console.log(`Rent email ${env.RENT_EMAIL_ENABLED === "true" ? "enabled by profile configuration" : "off"}; utility retrieval ${env.UTILITY_INTAKE_ENABLED === 'true' ? 'enabled by profile configuration' : 'off'}.`);
  const result = spawnSync(process.execPath, ["server/index.js"], { cwd: root, env, stdio: "inherit", windowsHide: true });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
