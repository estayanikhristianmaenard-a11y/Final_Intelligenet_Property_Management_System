# PropertyPro — Node integration candidate

The active app is `SeCapstone/propertypro-portal`: existing frontend, Node.js server, SQLite storage. `SeCapstone/backend` preserves the inactive Laravel implementation for reference. Do not use Laravel to serve this candidate's portal.

Requires Node 24+. From this candidate checkout:

```powershell
Set-Location SeCapstone/propertypro-portal
$env:Path = 'D:\Program Files\nodejs;' + $env:Path
npm.cmd ci
$env:DATA_DIR = 'data-demo-review'
npm.cmd run setup -- --demo
$env:PORT = '8081'
npm.cmd start
```

Open http://localhost:8081/. This uses an isolated demo database and avoids the existing Laravel server on 8080. Set DATA_DIR each time when using the review database. Node accounts differ from Laravel's accounts; setup prints its own credentials. Follow the [portal README](SeCapstone/propertypro-portal/README.md) and [user manual](SeCapstone/propertypro-portal/docs/user-manual.md).

```text
SeCapstone/
  propertypro-portal/       Active application
    server/                API, persistence, rules and integrations
    src/                   Existing interface and components
    tests/                 Backend, browser and extraction fixtures
    docs/                  Contracts, QA report and user manual
    package-lock.json      Locked dependencies
  backend/                 Inactive preserved Laravel source
  review/                  Manuscript material
  tools/                   Local ignored tools
```

The fetched Node portal passed 24 backend tests and one actual Edge browser test. This candidate retains that portal unchanged, with integration documentation and inactive Laravel reference code alongside it. Use `npm.cmd test` to reproduce tests in isolated temporary databases.

Managers share one organization/portfolio. Historical tenancy transfers and renewals remain restricted. Real mailbox/Push, provider-layout acceptance, public hosting and security/load checks remain pending. Existing MySQL records and accounts are not migrated to SQLite.

Both histories are preserved: Laravel `ffbb2b4` and main `990cfb3`. Keep backup/local-laravel-20261012. Review this branch before a pull request. No remote push or main merge was performed during inspection.
