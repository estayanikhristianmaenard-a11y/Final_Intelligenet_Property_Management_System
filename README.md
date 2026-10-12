# Intelligent Property Management System — PropertyPro

The locked stack is **Node.js 24+ + SQLite**, with the existing HTML/CSS/JavaScript frontend. The application lives in `SeCapstone/propertypro-portal`. There is one active backend. The retired implementation remains recoverable from Git branch `backup/local-laravel-20261012`.

The approved capstone covers rent, electricity and water for selected boarding houses and residential apartments in Pasig City. Existing OCR technology extracts supported documents; explicit rules and Manager actions handle validation and financial decisions. No model training, autonomous billing AI, tenant SMS/email alerts or payment gateways are introduced.

## Run locally

```powershell
Set-Location SeCapstone/propertypro-portal
npm.cmd ci
npm.cmd run setup
npm.cmd start
```

Requires Node.js 24+ on PATH. This workstation's executable is `D:\Program Files\nodejs\node.exe`. Setup prompts for an initial password and creates an empty portfolio with Admin and Manager accounts. It refuses to overwrite existing accounts. Open **http://localhost:8080/**. Keep the Node service running; do not open index.html directly.

For an explicitly isolated demonstration, configure `DATA_DIR=data/demo` and run `npm.cmd run setup -- --demo`. See the [user manual](SeCapstone/propertypro-portal/docs/user-manual.md) for demo credentials and startup. Old database accounts are not automatically migrated to SQLite.

A [PowerShell startup helper](SeCapstone/tools/README.md) is also provided. No public deployment was performed.

## Folder structure

```text
README.md                              Stack, structure, responsibilities
SeCapstone/
  propertypro-portal/
    index.html                         Existing web entry
    server/
      index.js                         HTTP API, private-file boundaries, scheduler
      service.js                       Authentication and business workflows
      store.js                         SQLite schema, transactions, backups
      rules.js                         Validation, calendar dates, centavo splitting
      integrations.js                  PDF/OCR, mailbox, Web Push
      bootstrap.js                     Explicit account/demo initialization
      setup.js                         Setup command
      keys.js                          Local Push key generation
    src/
      app/                             Bootstrap, routing, shell and workflows
      api/                             Backend client and endpoint contracts
      auth/                            Session identity and frontend permissions
      config/                          Navigation, roles, configuration
      components/                      Existing controls, modals, panels and tables
      features/                        Manager, Tenant and Admin screens
      styles/                          Existing design system
      models/                          Frontend entity documentation
      utils/                           Escaped markup and formatting
    sw.js                              Browser Push service worker
    docs/                              API/schema, manual, QA, development/deployment plans
    tests/                             Backend/browser tests and extraction fixtures
    package.json / package-lock.json   Node commands and locked dependencies
    .env.example                       Configuration template
    data/                              Private runtime DB/documents; ignored
  review/                              Final manuscript notes, references and diagram
  tools/                               Node startup helper and instructions
```

`.env`, `node_modules`, private databases/documents/backups, and generated test results are not version-controlled source. `.integration` contains local review worktrees and `.local-backups` contains retired local configuration; both are ignored.

## Frontend, backend and database responsibilities

| Module | Frontend | Backend / stored data |
| --- | --- | --- |
| Authentication | Credentials, session recovery, permitted navigation | Password hashing, expiring/revocable sessions, role and Tenant access checks |
| Portfolio | Existing property/unit cards, Tenant panels, forms and assignments | Properties, units, tenants, leases, dated assignments and protected mutations |
| Intake/OCR | Source status, extracted fields, review | Designated email adapter, PDF/image extraction, private source documents |
| Billing | Itemized rent/utility records and status | Mapping, validation, duplicates, classification, exact allocation, frozen recipients, rent cycles and advance credit |
| Exceptions | Corrections and recorded history | Blocked finalization, reviewed revisions, revalidation and retained failures |
| Payments | Tenant reports; Manager confirms/rejects; receipt access | Full-balance reporting, confirmation history, reasons, unique/reused receipts |
| Notifications | Optional permission/subscription and portal billing access | Persisted alerts, Web Push, eligible Philippine-calendar reminders and retries |
| Maintenance | Restricted Admin screens | Account controls, health, backups, audit and protected file access |

The authoritative database definition is `server/store.js`; the database is `DATA_DIR/propertypro.sqlite`. Core records include users/sessions, properties/units/tenants, leases/assignments, intake/mappings, bills/lines/allocations, payments/receipts, exceptions/corrections, credits/rent cycles, notifications/subscriptions, documents/messages, activity/audit/settings. See the [database and API contract](SeCapstone/propertypro-portal/docs/api-contract.md). Do not add a second schema or treat the previous database as interchangeable.

## Verification and remaining work

The inspected application passed 24 backend tests and one actual Edge browser test. Run `npm.cmd test` in the portal directory; tests use isolated databases. These development checks are not participant evaluation or production certification.

Managers currently collaborate in one shared portfolio. Separate landlords need ownership scoping. Historical transfers/renewals remain restricted. Live mailbox and external Push delivery, representative provider layouts, scanned-PDF handling, deployment security and load testing still need acceptance work. Notifications do not prove payment or readership.

- [Requirements, QA evidence and limits](SeCapstone/propertypro-portal/docs/qa-report.md)
- [Implementation and user manual](SeCapstone/propertypro-portal/docs/user-manual.md)
- [Locked development plan](SeCapstone/propertypro-portal/docs/DEVELOPMENT_AND_DEPLOYMENT_PLAN.txt)
- [Future public deployment plan](SeCapstone/propertypro-portal/docs/FUTURE_PUBLIC_DEPLOYMENT_PLAN.txt)
- [Integration inspection history](SeCapstone/review/GIT_INTEGRATION_REVIEW.md)

Keep manuscript review material separate from application runtime. References and mockups remain excluded from the finalized manuscript baseline at the user's request. Treat generated example data as demonstration material.
