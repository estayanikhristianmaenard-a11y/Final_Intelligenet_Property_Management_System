# Intelligent Property Management System

BSIT capstone: **Intelligent Property Management Workflow with OCR-Enabled Automated Billing Classification and Tenant Notification**.

PropertyPro is the web interface for Managers, Tenants, and system-maintenance Admins. The existing HTML/CSS/JavaScript prototype is now served by Laravel at `/portal`, using the same origin as the API and real database records for the development foundation. The approved scope remains rent, electricity, and water management for selected boarding houses and residential apartments in Pasig City.

## Current development status

| Area | Status |
| --- | --- |
| Login/logout and session restoration | Implemented; cookie sessions and CSRF protection |
| Role and record ownership checks | Implemented on the server |
| Property, unit, tenant account records | Create, list, and edit implemented |
| Leases and dated occupancy assignments | Implemented with overlap, date, and capacity validation |
| Manager dashboard | Counts from the Manager's actual database records |
| Tenant home | Shows only that Tenant's assigned property/unit information |
| Fixed monthly rent | Implemented anniversary generation, separate first-cycle advance, exact shared allocation, and Tenant bill viewing |
| Account screen | Read-only authenticated identity |
| OCR, billing rules, exceptions, payments, receipts, Web Push | Planned; live screens display an under-development notice |
| Admin maintenance tools and operational summaries | Planned; no financial access for Admin |

The integrated portal keeps the prototype's sidebar, top bar, CSS, routing, dashboard, property cards, unit register, tenant directory/detail panel, and Tenant home. Backend responses match their display contracts and contain authorized database records. Create/edit forms open in the prototype's modal. Static serving of `propertypro-portal/index.html` still opens a separate mock preview; its records are not saved to MySQL. Demo role switching is unavailable in live mode. No framework rebuild or public deployment is included in this stage.

## Project folder structure

This is the canonical structure. Existing application folders stay in place to avoid breaking manuscript links and developer paths. Laravel's `database/` owns the database schema; there is no second competing SQL schema.

```text
Final_Intelligenet_Property_Management_System/
├── README.md                         Project overview and module responsibilities
├── .gitignore                        Local tools and secret exclusions
└── SeCapstone/
    ├── backend/                      Laravel application and API
    │   ├── app/
    │   │   ├── Http/Controllers/      Portal serving, authentication, record endpoints
    │   │   └── Models/                User model; domain models added as modules mature
    │   ├── bootstrap/                Application boot and middleware configuration
    │   ├── config/                   Database/session/storage/queue configuration
    │   ├── database/
    │   │   ├── README.md             Current relationships and planned database work
    │   │   ├── migrations/           Versioned schema; authoritative database definition
    │   │   ├── factories/            Automated test data
    │   │   └── seeders/              Controlled seed entry point; no default public password
    │   ├── public/                   Laravel web-server document root
    │   ├── resources/views/          Laravel view resources
    │   ├── routes/
    │   │   ├── web.php              Same-origin portal/API routes with session and CSRF
    │   │   └── console.php          Local account creation command
    │   ├── storage/                  Private runtime files, logs, framework cache
    │   ├── tests/                    Feature/unit tests; isolated testing database
    │   ├── composer.json             PHP dependencies
    │   ├── composer.lock             Reproducible dependency versions
    │   ├── .env.example              Configuration template without application secrets
    │   └── LOCAL_DEVELOPMENT.md       Workstation setup and startup instructions
    ├── propertypro-portal/           Existing frontend source
    │   ├── index.html                Portal entry; Laravel injects live configuration
    │   ├── README.md                 Frontend-specific overview
    │   ├── docs/                     Contracts and separate deployment plans
    │   ├── tests/                    Frontend integration tests
    │   └── src/
    │       ├── app/                  Bootstrap, hash routing, shared shell
    │       ├── api/                  JSON client, endpoints, separate mock adapter
    │       ├── auth/                 Server identity/session, UI route guards
    │       ├── config/               Mode, navigation, roles, constants
    │       ├── components/           Reusable controls, tables, panels, feedback
    │       ├── features/             Feature screens and live foundation forms
    │       ├── models/               Frontend data-shape documentation
    │       ├── styles/               Shared design system and page styles
    │       └── utils/                Escaped markup and formatting helpers
    ├── review/                       Final manuscript notes and retained diagram
    └── tools/                        Local Composer download/cache, ignored by Git
```

`vendor/`, `.env`, generated cache/logs, and local database files are runtime/dependency material, not source folders. Existing PDF material remains outside the application runtime. As billing and OCR are implemented, add `app/Services/`, `app/Jobs/`, `app/Http/Requests/`, and `app/Policies/` for actual domain rules, retryable background work, validation, and authorization; they are not implemented modules yet.

## Frontend and backend functions

| Module | Frontend responsibility | Backend responsibility |
| --- | --- | --- |
| Authentication | Collect credentials, restore identity, sign out, show permitted navigation | Verify password, rotate session, enforce role/ownership, reject unauthorized access |
| Property records | Forms, relationship selectors, tables, validation feedback | Validate/persist Manager-owned properties, units, tenant accounts, leases, dated assignments |
| Utility configuration — planned | Provider/account and permitted billing-rule forms | Store mappings and individual/shared arrangements; validate Manager configuration |
| Document intake/OCR — planned | Show extraction status and permitted source/field information | Retrieve designated-email attachments; existing OCR engine extracts five fields from supported documents |
| Validation/exceptions — planned | Show exceptions, correction forms and history | Required-field/mapping/period/duplicate checks; block invalid finalization; retain correction history and revalidate |
| Billing — planned | Itemized rent/utility bills and permitted billing status | Anniversary rent, separate first-cycle advance, exact allocation/reconciliation, eligibility snapshots and retry-safe finalization |
| Payments/receipts — planned | Tenant reports full outstanding balance; Manager reviews/rejects/confirms; show authorized receipts | Enforce Unpaid/Tenant Reported Paid/Paid transitions, external verification by Manager, reasons, unique/reused receipts and controlled final advance credit |
| Notifications — planned | Optional Push permission/subscription and portal access to billing | Web Push alerts, eligible three-calendar-day reminders, retry controls; no delivery/readership guarantee |
| Maintenance — planned | Restricted Admin maintenance screens | Maintenance-only functions; no Admin payment confirmation or billing operations |

The frontend never determines financial validity or authorizes a payment. Backend rules remain deterministic and traceable. OCR recognition may use machine learning in an existing engine; the study does not train/customize a model or allow autonomous AI billing decisions. Tenant SMS/email alerts, payment gateways, independent payment verification, smart-meter installation, and other manuscript exclusions remain outside scope.

## Database

Local database: **`propertypro_development`**, using XAMPP MySQL/MariaDB. Current domain tables are `users`, `properties`, `units`, `tenants`, `leases`, and `occupancy_assignments`; Laravel also maintains session/cache/job tables. Money is stored in integer centavos. Foreign keys establish relationships, and unit codes are unique within a property. See [database documentation](SeCapstone/backend/database/README.md) for the implemented schema and planned modules.

All persistent changes use migrations. Do not manually recreate tables or use `migrate:fresh` against retained development records. Tests use an isolated in-memory SQLite database. Real passwords, mailbox credentials, Push keys, and production personal data must remain outside version control.

## Run locally

Start XAMPP MySQL. From this repository root:

```powershell
Set-Location SeCapstone/backend
& 'C:\xampp\php\php.exe' artisan migrate
& 'C:\xampp\php\php.exe' artisan propertypro:create-user manager@example.test manager
& 'C:\xampp\php\php.exe' artisan serve --host=127.0.0.1 --port=8080
```

The account command prompts for a name/password and refuses duplicate email accounts. Skip it if your Manager account already exists. Open **http://127.0.0.1:8080/portal**. Create properties → units → tenants → leases → occupancy assignments. Tenants sign in at the same URL using their own account.

See [local setup](SeCapstone/backend/LOCAL_DEVELOPMENT.md) for fresh-checkout configuration and foundation restrictions.

```powershell
# Backend: from SeCapstone/backend
& 'C:\xampp\php\php.exe' artisan test
# Frontend: from repository root
& 'D:\Program Files\nodejs\node.exe' --test SeCapstone/propertypro-portal/tests/live-integration.test.mjs
```

## Next development stages

Monthly rent generation is now available in the original Bills & Payments screen. See [rent generation instructions and current limits](SeCapstone/propertypro-portal/docs/RENT_GENERATION.md). Payment confirmation, final-cycle advance credit, receipts, and Push remain unfinished; generated rent starts Unpaid. Run `artisan schedule:work` locally to enable the configured hourly rent check.

Property and Tenant management now includes direct property/unit editing, Tenant editing from the existing detail panel, live filters, and validated lease/occupancy forms. See the [module usage checklist](SeCapstone/propertypro-portal/docs/PROPERTY_MANAGEMENT_CHECKLIST.md). Current verification: 9 backend tests (70 assertions) and 5 frontend integration tests. These are automated checks, not completed user evaluation.

Implement utility mappings and rent configuration, then supported-document intake/OCR, validation and exceptions, billing/allocation, payments/receipts and Web Push, followed by workflow/security/quality evaluation. These are development stages, not completed or evaluated results.

Public hosting remains a separate future activity: [future public deployment plan](SeCapstone/propertypro-portal/docs/FUTURE_PUBLIC_DEPLOYMENT_PLAN.txt). The current PHP development server and XAMPP database are local tools.
