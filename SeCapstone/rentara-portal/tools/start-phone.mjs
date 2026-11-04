import { networkInterfaces } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Use the same data/configuration as npm start; only LAN addressing changes.
const root = fileURLToPath(new URL("../", import.meta.url));
const addresses = [...new Set(Object.values(networkInterfaces()).flat()
  .filter(entry => entry && entry.family === "IPv4" && !entry.internal &&
    !entry.address.startsWith("169.254."))
  .map(entry => entry.address))];
const ipIndex = process.argv.indexOf("--ip");
const address = ipIndex >= 0 ? process.argv[ipIndex + 1] : addresses.length === 1 ? addresses[0] : null;
if (!address || !addresses.includes(address))
  throw new Error(`Select a current laptop address: npm.cmd run start:phone -- --ip ADDRESS. Available: ${addresses.join(", ") || "none; connect the laptop to your network first"}`);
const port = Number(process.env.PORT || 8080);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("PORT must be a whole number between 1 and 65535.");
const scheme = process.env.TLS_CERT_FILE || process.env.TLS_KEY_FILE ? "https" : "http";
const url = `${scheme}://${address}:${port}`;
const allowed = new Set((process.env.ALLOWED_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean));
for (const origin of [url, `${scheme}://localhost:${port}`, `${scheme}://127.0.0.1:${port}`]) allowed.add(origin);
console.log(`Phone: ${url}/`);
console.log("Connect the phone to the same local network. Keep this terminal open.");
const result = spawnSync(process.execPath, ["server/index.js"], {
  cwd: root, stdio: "inherit", windowsHide: true,
  env: { ...process.env, HOST: "0.0.0.0", PORT: String(port), PORTAL_URL: `${url}/`, ALLOWED_ORIGINS: [...allowed].join(",") },
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
