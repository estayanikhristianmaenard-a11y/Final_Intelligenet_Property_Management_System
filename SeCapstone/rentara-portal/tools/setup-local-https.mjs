import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isIP } from "node:net";
import { spawnSync } from "node:child_process";
import { X509Certificate } from "node:crypto";
import webpush from "web-push";

const root = fileURLToPath(new URL("../", import.meta.url));
const address = process.argv[process.argv.indexOf("--ip") + 1];
if (!process.argv.includes("--ip") || isIP(address) !== 4)
  throw new Error("Provide the laptop Wi-Fi IPv4 address: npm run setup:https -- --ip 192.168.1.71");
const tlsDir = join(root, "data/local-tls");
const caDir = join(tlsDir, "ca");
const mkcert = process.env.MKCERT_PATH || join(root, "data/tools", process.platform === "win32" ? "mkcert.exe" : "mkcert");
if (!existsSync(mkcert)) throw new Error("Install the official mkcert executable in data/tools, or set MKCERT_PATH. See docs/local-acceptance-setup.md.");
mkdirSync(caDir, { recursive: true });
const result = spawnSync(mkcert, [
  "-cert-file", join(tlsDir, "portal-cert.pem"),
  "-key-file", join(tlsDir, "portal-key.pem"),
  "localhost", "127.0.0.1", address,
], { env: { ...process.env, CAROOT: caDir }, stdio: "inherit", windowsHide: true });
if (result.error || result.status !== 0) throw new Error("mkcert did not finish; startup profile was not changed.");
const ca = new X509Certificate(readFileSync(join(caDir, "rootCA.pem")));
writeFileSync(join(tlsDir, "rentara-local-ca.cer"), ca.raw);
const envFile = join(root, ".env");
let config = readFileSync(existsSync(envFile) ? envFile : join(root, ".env.example"), "utf8");
const value = name => config.match(new RegExp("^" + name + "=(.*)$", "m"))?.[1]?.trim();
const set = (name, content) => {
  const pattern = new RegExp("^" + name + "=.*$", "m");
  config = pattern.test(config) ? config.replace(pattern, `${name}=${content}`) : config + `\n${name}=${content}\n`;
};
if (Boolean(value("VAPID_PUBLIC_KEY")) !== Boolean(value("VAPID_PRIVATE_KEY")))
  throw new Error("Incomplete VAPID key pair. Existing configuration was preserved; review both keys before proceeding.");
if (!value("VAPID_PUBLIC_KEY")) {
  const keys = webpush.generateVAPIDKeys();
  set("VAPID_PUBLIC_KEY", keys.publicKey);
  set("VAPID_PRIVATE_KEY", keys.privateKey);
}
if (!value("VAPID_SUBJECT")) set("VAPID_SUBJECT", "mailto:rentara2026@gmail.com");
writeFileSync(envFile, config, { mode: 0o600 });
writeFileSync(join(root, ".env.acceptance"), [
  "# Local acceptance only. Inherits credentials/Push keys from .env.",
  "DATA_DIR=data/acceptance", "HOST=0.0.0.0", "PORT=8443",
  `PORTAL_URL=https://${address}:8443/`,
  `ALLOWED_ORIGINS=https://localhost:8443,https://127.0.0.1:8443,https://${address}:8443`,
  "TLS_CERT_FILE=data/local-tls/portal-cert.pem", "TLS_KEY_FILE=data/local-tls/portal-key.pem",
  "RENT_EMAIL_ENABLED=false", "IMAP_HOST=", "IMAP_USER=", "IMAP_ACCESS_TOKEN=", "",
].join("\n"), { mode: 0o600 });
console.log(`Prepared: https://${address}:8443/`);
console.log("VAPID keys preserved/generated without printing secrets. No email sent or mailbox accessed.");
console.log("Android: install ONLY data/local-tls/rentara-local-ca.cer as a CA certificate. Never share rootCA-key.pem or portal-key.pem.");
console.log("Laptop trust is not installed automatically. See the local acceptance guide.");
