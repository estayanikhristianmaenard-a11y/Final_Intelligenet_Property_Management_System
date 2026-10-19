import { createInterface } from "node:readline/promises";
import { resolve } from "node:path";
import { Store } from "./store.js";
import { Service } from "./service.js";
import { bootstrap } from "./bootstrap.js";
const demo = process.argv.includes("--demo"),
  readline = createInterface({ input: process.stdin, output: process.stdout });
try {
  const password =
    process.env.INITIAL_PASSWORD ||
    (demo
      ? "LocalDemo!2026"
      : await readline.question(
          "Initial password for Admin and Manager (12+ characters): ",
        ));
  const s = new Store(
    resolve(process.env.DATA_DIR || "data", "propertypro.sqlite"),
  );
  try {
    bootstrap(new Service(s), {
      adminPassword: password,
      managerPassword: password,
      tenantPassword: password,
      demo,
    });
    console.log(
      "Setup complete. Admin: admin@propertypro.ph; Manager: manager@propertypro.ph" +
        (demo
          ? "; Tenant: maria.santos@gmail.com. Local demo password: LocalDemo!2026"
          : ""),
    );
  } finally {
    s.close();
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  readline.close();
}
