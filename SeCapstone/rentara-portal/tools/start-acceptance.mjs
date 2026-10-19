import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { join } from "node:path";
import { acceptanceEnvironment } from "../server/acceptance-config.js";

// Keep acceptance testing isolated even when the terminal has inherited live
// settings. Utility intake is a separate explicit opt-in; rent email stays off.
if (!process.env.TLS_CERT_FILE || !process.env.TLS_KEY_FILE)
  throw new Error("Run npm run setup:https -- --ip YOUR_LAPTOP_IP first.");
const root = fileURLToPath(new URL("../", import.meta.url));
let intake = {};
try { intake = JSON.parse(readFileSync(join(root, "data/acceptance/utility-intake.json"), "utf8")); }
catch (error) { if (error.code !== "ENOENT") throw error; }
const base = intake.enabled === true ? parseEnv(readFileSync(join(root, ".env"), "utf8")) : {};
console.log(intake.enabled === true ? "Utility retrieval enabled for the dedicated acceptance label; rent email sending OFF." : "Utility retrieval OFF; rent email sending OFF.");
const result = spawnSync(process.execPath, ["server/index.js"], {
  cwd: root,
  env: acceptanceEnvironment(process.env, intake, base),
  stdio: "inherit", windowsHide: true,
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
