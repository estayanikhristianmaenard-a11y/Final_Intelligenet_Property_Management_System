import { readFileSync, writeFileSync, existsSync } from "node:fs";
import webpush from "web-push";

const filename = ".env";
let config = readFileSync(
  existsSync(filename) ? filename : ".env.example",
  "utf8",
);
if (/^VAPID_(?:PUBLIC|PRIVATE)_KEY=\S+/m.test(config))
  throw new Error(
    "VAPID keys already exist. Keep them to preserve existing browser subscriptions.",
  );
const keys = webpush.generateVAPIDKeys();
for (const [name, value] of Object.entries({
  VAPID_PUBLIC_KEY: keys.publicKey,
  VAPID_PRIVATE_KEY: keys.privateKey,
})) {
  const pattern = new RegExp("^" + name + "=.*$", "m");
  config = pattern.test(config)
    ? config.replace(pattern, name + "=" + value)
    : config + "\n" + name + "=" + value + "\n";
}
writeFileSync(filename, config, { mode: 0o600 });
console.log(
  "Web Push keys saved locally in .env. Set VAPID_SUBJECT to your contact mailto: address, then restart the server. Private keys were not printed.",
);
