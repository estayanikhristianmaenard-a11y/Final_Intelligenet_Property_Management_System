import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { groupDemoOrigins } from "../server/group-demo-config.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const db = new DatabaseSync(join(root, "data/group-demo/propertypro.sqlite"), { readOnly: true });
db.close();
const base = parseEnv(readFileSync(join(root, ".env"), "utf8"));
if (!process.env.TLS_CERT_FILE || !process.env.TLS_KEY_FILE)
  throw new Error("Local HTTPS must be configured first: npm run setup:https -- --ip YOUR_LAPTOP_IP");
const receive = process.argv.includes("--receive");
if (receive && (!base.IMAP_HOST || !base.IMAP_USER || !(base.IMAP_PASSWORD || base.IMAP_ACCESS_TOKEN)))
  throw new Error("Property Gmail IMAP credentials must be configured in .env first.");
if (receive) {
  // A Gmail label is an IMAP mailbox. Prepare the dedicated empty label before
  // starting the scheduler; never fall back to scanning the general inbox.
  const { ImapFlow } = await import("imapflow");
  const mailbox = "Rentara-Group3-Demo";
  const client = new ImapFlow({
    host: base.IMAP_HOST, port: Number(base.IMAP_PORT || 993), secure: true,
    auth: base.IMAP_ACCESS_TOKEN
      ? { user: base.IMAP_USER, accessToken: base.IMAP_ACCESS_TOKEN }
      : { user: base.IMAP_USER, pass: base.IMAP_PASSWORD },
    logger: false, connectionTimeout: 15000, socketTimeout: 30000,
  });
  try {
    await client.connect();
    const mailboxes = await client.list({ reference: "", mailbox });
    if (!mailboxes.some(entry => entry.path === mailbox)) {
      await client.mailboxCreate(mailbox);
      console.log("Created dedicated Gmail label: " + mailbox);
    }
    const lock = await client.getMailboxLock(mailbox, { readOnly: true });
    lock.release();
    console.log("Gmail authentication and demo label access verified.");
  } catch {
    throw new Error("Cannot prepare Gmail demo label. Check internet, Gmail IMAP credentials and permission to create/access Rentara-Group3-Demo. No inbox fallback was enabled.");
  } finally {
    try { await client.logout(); } catch { client.close(); }
  }
}
console.log("Group 3 demo: HTTPS port 8444; rent email sending OFF.");
console.log(receive ? "Receiving only Gmail label Rentara-Group3-Demo. Apply this label to received demo emails in Gmail." : "Mailbox retrieval OFF. Add --receive when ready to receive demo bills.");
const result = spawnSync(process.execPath, ["server/index.js"], {
  cwd: root, stdio: "inherit", windowsHide: true,
  env: { ...process.env, DATA_DIR: "data/group-demo", WORKSPACE_CONFIG_FILE: "",
    HOST: "0.0.0.0", PORT: "8444", RENT_EMAIL_ENABLED: "false",
    ALLOWED_ORIGINS: groupDemoOrigins(process.env.ALLOWED_ORIGINS),
    IMAP_HOST: receive ? base.IMAP_HOST : "", IMAP_USER: receive ? base.IMAP_USER : "",
    IMAP_PASSWORD: receive ? base.IMAP_PASSWORD || "" : "",
    IMAP_ACCESS_TOKEN: receive ? base.IMAP_ACCESS_TOKEN || "" : "",
    IMAP_PORT: base.IMAP_PORT || "993", IMAP_MAILBOX: "Rentara-Group3-Demo",
  },
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
