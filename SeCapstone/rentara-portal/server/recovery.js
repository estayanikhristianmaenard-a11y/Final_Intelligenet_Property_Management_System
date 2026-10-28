import { promises as fs, createReadStream, constants } from "node:fs";
import { resolve, join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { DEFAULT_WORKSPACE } from "./store.js";

const allowedPath = /^(?:propertypro\.sqlite|(?:workspaces\/[a-zA-Z0-9_-]+\/)?(?:sources|documents)\/[a-zA-Z0-9_-]+)$/;
async function safeFile(root, relative) {
  if (!allowedPath.test(relative)) throw new Error("Invalid recovery file path.");
  let target = resolve(root);
  const rootStat = await fs.lstat(target);
  if (rootStat.isSymbolicLink()) throw new Error("Recovery does not follow symbolic links.");
  for (const part of relative.split("/")) {
    target = join(target, part);
    const stat = await fs.lstat(target);
    if (stat.isSymbolicLink()) throw new Error("Recovery does not follow symbolic links.");
  }
  if (!(await fs.stat(target)).isFile()) throw new Error("Recovery requires a regular file.");
  return target;
}
async function fingerprint(filename) {
  const hash = createHash("sha256");
  let size = 0;
  for await (const chunk of createReadStream(filename)) { size += chunk.length; hash.update(chunk); }
  return { size, sha256: hash.digest("hex") };
}
function references(database) {
  const files = new Map();
  for (const table of ["incoming", "documents"]) {
    for (const row of database.prepare(`SELECT id,workspaceId,data FROM ${table}`).all()) {
      const data = JSON.parse(row.data);
      const id = table === "incoming" ? data.sourceFileId ?? row.id : row.id;
      const relative = (row.workspaceId === DEFAULT_WORKSPACE ? "" : `workspaces/${row.workspaceId}/`) + (table === "incoming" ? "sources/" : "documents/") + id;
      if (!allowedPath.test(relative)) throw new Error("Invalid stored document path; backup was not finalized.");
      files.set(relative, table === "incoming" ? data.documentHash : null);
    }
  }
  return files;
}
function inspect(filename) {
  const db = new DatabaseSync(filename, { readOnly: true });
  try {
    if (db.prepare("PRAGMA integrity_check").get().integrity_check !== "ok" || db.prepare("PRAGMA foreign_key_check").all().length)
      throw new Error("Recovery database integrity check failed.");
    return references(db);
  } finally { db.close(); }
}

export async function createRecoveryBackup(store, dataDir) {
  const name = `backup-${Date.now()}-${randomUUID()}`;
  const directory = join(resolve(dataDir), "backups", name);
  await fs.mkdir(directory, { recursive: true });
  const snapshot = join(directory, "propertypro.sqlite");
  await store.backup(snapshot);
  // Reference the consistent SQLite snapshot, not a changing live record list.
  const expected = inspect(snapshot);
  const files = [{ path: "propertypro.sqlite", ...await fingerprint(snapshot) }];
  for (const [relative, expectedHash] of expected) {
    const source = await safeFile(dataDir, relative);
    const dest = join(directory, ...relative.split("/"));
    await fs.mkdir(resolve(dest, ".."), { recursive: true });
    await fs.copyFile(source, dest, constants.COPYFILE_EXCL);
    const hash = await fingerprint(dest);
    if (expectedHash && hash.sha256 !== expectedHash) throw new Error("A source bill differs from its recorded hash; backup was not finalized.");
    files.push({ path: relative, ...hash });
  }
  // No manifest means incomplete. Never report a partial copy as recoverable.
  await fs.writeFile(join(directory, "manifest.json"), JSON.stringify({ format: "rentara-recovery-v1", createdAt: new Date().toISOString(), files }, null, 2) + "\n", { flag: "wx" });
  return { filename: `${name}/propertypro.sqlite`, bundle: name, files: expected.size };
}

export async function restoreRecoveryBackup(bundle, destination) {
  const root = resolve(bundle), target = resolve(destination);
  if (target === root || target.startsWith(root + "/") || target.startsWith(root + "\\"))
    throw new Error("Restore destination must be outside the backup package.");
  try { await fs.lstat(target); throw new Error("Restore destination already exists. Choose a new directory; nothing was overwritten."); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  if ((await fs.lstat(root)).isSymbolicLink() || (await fs.lstat(join(root, "manifest.json"))).isSymbolicLink())
    throw new Error("Recovery does not follow symbolic links.");
  const manifest = JSON.parse(await fs.readFile(join(root, "manifest.json"), "utf8"));
  if (manifest.format !== "rentara-recovery-v1" || !Array.isArray(manifest.files)) throw new Error("Unsupported recovery manifest.");
  const paths = new Set();
  for (const entry of manifest.files) {
    if (paths.has(entry.path)) throw new Error("Duplicate recovery file path.");
    paths.add(entry.path);
    const filename = await safeFile(root, entry.path);
    const actual = await fingerprint(filename);
    if (actual.sha256 !== entry.sha256 || actual.size !== entry.size) throw new Error("Recovery file checksum mismatch; nothing was restored.");
  }
  if (!paths.has("propertypro.sqlite")) throw new Error("Recovery database missing.");
  const references = inspect(join(root, "propertypro.sqlite"));
  if (paths.size !== references.size + 1 || [...references.keys()].some(path => !paths.has(path)))
    throw new Error("Recovery manifest does not cover the database's source documents.");
  await fs.mkdir(target, { recursive: true });
  for (const entry of manifest.files) {
    const filename = await safeFile(root, entry.path);
    const dest = join(target, ...entry.path.split("/"));
    await fs.mkdir(resolve(dest, ".."), { recursive: true });
    await fs.copyFile(filename, dest, constants.COPYFILE_EXCL);
    const copied = await fingerprint(dest);
    if (copied.sha256 !== entry.sha256 || copied.size !== entry.size) throw new Error("Recovery copy changed; do not use the incomplete destination.");
  }
  const restored = new DatabaseSync(join(target, "propertypro.sqlite"));
  try { restored.exec("DELETE FROM sessions"); } finally { restored.close(); }
  inspect(join(target, "propertypro.sqlite"));
  return { directory: target, files: references.size, sessionsRevoked: true };
}
