# PropertyPro development foundation

Iteration 1 provides real session authentication, Manager-owned properties, units, tenant accounts, leases, and dated occupancy assignments. Tenants can view only their own assignments. Admin accounts cannot operate property records. Billing, OCR, receipts, and Web Push are subsequent iterations and are not implemented here.

The existing `../propertypro-portal` frontend is integrated at `/portal`, retaining its dashboard, property cards, unit register, tenant directory/detail panel, and Tenant home with real database responses. Create/edit forms open in the existing modal. Laravel serves source assets on the same origin and injects live API configuration. Unfinished modules show under-development notices. `/foundation` redirects to `/portal`. Serving the frontend directly through a static server still opens a separate mock preview.

## Start on this Windows workstation

Start MySQL in the XAMPP Control Panel. Apache is not required for the PHP development server below.

From the repository root:

```powershell
Set-Location SeCapstone/backend
& 'C:\xampp\php\php.exe' artisan migrate
& 'C:\xampp\php\php.exe' artisan propertypro:create-user manager@example.test manager
```

The account command prompts for a name and a password of at least 12 characters. It does not install a shared default password. Create tenant accounts through the Manager screen.

```powershell
& 'C:\xampp\php\php.exe' artisan serve --host=127.0.0.1 --port=8080
```

Open **http://127.0.0.1:8080/portal**. Keep the terminal running. This server is for local development.

## Enter records in this order

1. Create a property.
2. Create its units using the property selector.
3. Create tenant accounts with unique emails and passwords.
4. Create a lease using the unit selector, dates, monthly rent in centavos, and arrangement.
5. Create occupancy assignments using lease and tenant selectors and dates within the lease.

Use the edit selector to update a record. Dates are inclusive. A tenant cannot have overlapping assignments. Individual leases allow one occupant; shared occupancy uses the unit capacity. Overlapping leases for the same unit are rejected. Leases with assignments, and the property/capacity of units with leases, are protected against changes in this foundation stage; amendment workflows need to be designed before enabling those changes.

## Database and configuration

The local `.env` selects XAMPP MySQL/MariaDB and `propertypro_development`. It is excluded from version control. The separate database was created without dropping any existing database. Set the database password in `.env` if your XAMPP root account has one. Never reuse the local root connection for public deployment.

For a fresh checkout, install Composer dependencies, copy `.env.example` to `.env`, run `artisan key:generate`, create the named database, and run migrations. PHP 8.2+ is required by this installation. On this workstation PHP lives at `C:\xampp\php\php.exe`. Composer is stored locally in `../tools/composer.phar`; installation used `-d extension=zip` rather than changing global PHP settings.

## Verification

```powershell
& 'C:\xampp\php\php.exe' artisan test
```

Feature tests use an isolated in-memory SQLite database, not development records. They cover login/logout, role restrictions, Manager isolation, Tenant isolation, lease overlap, assignment date boundaries, duplicate occupancy, and shared capacity.

Future public deployment remains documented separately in `../propertypro-portal/docs/FUTURE_PUBLIC_DEPLOYMENT_PLAN.txt`.
