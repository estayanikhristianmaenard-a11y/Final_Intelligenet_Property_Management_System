# PropertyPro — persistent property management portal

The existing portal now uses a Node.js API and a centralized SQLite database. The original layout is retained. In-memory mock data, simulated login, and toast-only business operations have been replaced with stored, authorized workflows.

Use Node.js **24 or newer**. From this directory:

```powershell
npm.cmd ci
npm.cmd run setup
npm.cmd start
```

Open **http://localhost:8080/**. Opening `index.html` directly as a file blocks its ES modules. Setup creates an empty portfolio with Admin and Manager accounts and asks for an initial password. It refuses to overwrite existing accounts.

For an isolated local demonstration, set `DATA_DIR=data/demo` in `.env` and use `npm.cmd run setup -- --demo`. The explicit demo accounts and password are described in the manual. Test databases and sample provider messages do not represent operational data.

The implemented workflows include property/unit/tenant CRUD, lease and assignment records, mappings, digital PDF and offline image OCR, real IMAP integration, V01–V04/C01–C02/A01/R01 validation, anniversary rent, whole-centavo shared allocation, reviewed corrections, tenant reports, Manager confirmation/rejection, receipts, protected documents, portal inbox, stored alerts, service-worker registration, encrypted Web Push delivery, reports, and Admin maintenance.

**Live Gmail retrieval and provider-to-browser push delivery still require real local configuration and acceptance testing.** `propertymanager@gmail.com` was a made-up address and is not connected. The software never presents credential-free integrations as live services.

Run the verification suite:

```powershell
npm.cmd test
```

The suite uses temporary databases, real PDF/image extraction, a real Edge browser, HTTP authorization checks, and a test transport for push delivery. On Windows it uses the installed Microsoft Edge executable; set `BROWSER_EXECUTABLE` for another Chromium installation. Other platforms need a Playwright Chromium installation.

- [Implementation and user manual](docs/user-manual.md): startup, roles, billing, mailbox configuration, push setup and recovery.
- [Requirements and QA-001–QA-026 report](docs/qa-report.md): implementation checklist, test evidence, remaining dependencies and readiness.
- [Database and API contract](docs/api-contract.md): relationships, endpoints, payloads and authorization.

`server/` contains the database, rule engine, authorization, intake, delivery and HTTP API. `src/` retains the existing browser UI and connects its controls to that API. `sw.js` handles background push. `tests/` contains the verification suites.

Runtime files are under private `data/` by default. `.env`, databases, source files, OCR cache, backups, dependencies, and generated test results are ignored by Git. The Node server serves only public frontend files. Apache `.htaccess` also restricts private application directories; remote deployment still requires HTTPS, private directory permissions and a suitable reverse proxy.
