# Intelligent Property Management Workflow with OCR-Enabled Automated Billing Classification and Tenant Notification

**Rentara** is the system name. The application uses **Node.js 24+, SQLite, and HTML/CSS/JavaScript**.

## Find what you need

| I want to... | Open this |
| --- | --- |
| Work on the application | [Application start guide](SeCapstone/rentara-portal/README.md) |
| Edit shared Gmail or local settings | [.env](SeCapstone/rentara-portal/.env) (team-owned configuration) |
| Find bills for upload/OCR | [Bill sample catalog](SeCapstone/rentara-portal/docs/samples/utility-bills/README.md) |
| Check what works and what remains | [Current QA status](SeCapstone/rentara-portal/docs/qa-report.md) |
| Continue next session | [Pending tests and integrations](SeCapstone/rentara-portal/docs/next-session-checklist.md) |
| Follow a manual system check | [Manual test guide](SeCapstone/rentara-portal/docs/manual-test-guide.md) |
| Open the system on a phone | [Local-network guide](SeCapstone/rentara-portal/docs/local-network-demo.md) |
| Use separate test records and Android HTTPS | [Local acceptance setup](SeCapstone/rentara-portal/docs/local-acceptance-setup.md) |
| Configure email | [Gmail setup](SeCapstone/rentara-portal/docs/gmail-local-setup.md) |
| Find Report 4 | [Report source and exports](SeCapstone/reports/updates/04-2026-10-19/README.md) |
| See screenshots | [Current PNG gallery](SeCapstone/reports/mockups/README.md) |
| Open the stored manuscript | [Stored PDF snapshot](SeCapstone/papers/FINAL_MANUSCRIPT.pdf) |
| Find chapter drafts and paper review notes | [Research review guide](SeCapstone/review/README.md) |
| Edit the diagrams | [Diagrams](SeCapstone/diagrams/) |
| Find code responsibilities and current development steps | [Development guide](SeCapstone/rentara-portal/docs/development-guide.md) |
| Find another technical guide | [Application documentation index](SeCapstone/rentara-portal/docs/README.md) |

## Start the existing local system

From the repository root:

```powershell
Set-Location SeCapstone/rentara-portal
npm.cmd start
```

Open **http://localhost:8080/**. Keep the terminal running. For a new checkout, install dependencies with `npm.cmd ci` first. Initialize an empty database only when needed with `npm.cmd run setup`; setup refuses to overwrite existing accounts. See the [user manual](SeCapstone/rentara-portal/docs/user-manual.md) for account and demo instructions.

The [PowerShell helper](SeCapstone/tools/README.md) supports local and same-Wi-Fi startup. The former `propertypro-portal` folder has been renamed; reopen old VS Code tabs from the links above.

## Groupmate setup

The source, docs, diagrams, reports, anonymized samples, and project-local skills can all be committed and shared. `.gitignore` does not control repository member permissions. Your groupmates receive these changes after you commit and push them; no push is performed automatically.

For a fresh clone, use Node.js 24+ and run:

```powershell
Set-Location SeCapstone/rentara-portal
npm.cmd ci
if (!(Test-Path -LiteralPath '.env')) { Copy-Item -LiteralPath '.env.example' -Destination '.env' }
npm.cmd run demo:showcase
npm.cmd start
```

This recreates the populated local showcase instead of sharing a live database with sessions, uploads, and real records. Find the demo accounts in the [workspace guide](SeCapstone/rentara-portal/docs/workspaces.md). The owner has explicitly chosen to include the team-owned `.env` and shared Gmail credentials in Git; include that file in the manual commit if teammates need those settings. Anyone with repository access will then receive the app password. The showcase keeps external messages blocked. Dependencies are installed from the shared lockfile. To distribute an actual database snapshot later, use a deliberate private handoff that includes its required source documents.

## Where files belong

```text
SeCapstone/
  rentara-portal/       Application
    server/            Backend, billing rules, integrations, SQLite access
    src/               Frontend pages, components, styles
    tests/             Automated checks and fixtures
    docs/              Current setup, usage and developer guides
      samples/         Bill cases and expected values
      archive/         Historical technical checkpoints
    tools/             Sample generation, screenshots, readiness checks
    data/              Private database, source files and runtime data
    .env               Team-owned configuration, eligible for Git by owner choice
  papers/              Stored manuscript snapshot and older references
  review/              Chapter drafts, workflow decisions, paper review notes
  diagrams/            Editable architecture, flowchart and DFD
  reports/             Screenshots, email previews and submission reports
    updates/           Current Report 4; Reports 1-3 are archived
  tools/               Local/LAN PowerShell startup helper
```

`docs` explains the software; `review` supports the manuscript; `reports` holds outputs and submissions. A review draft or screenshot is not automatically the latest approved manuscript. Use each folder's README to identify its current files.

## System scope

Staff handles scoped utility intake, existing descriptive records, investigation and unfinalized correction proposals. Manager authorizes proposals and retains direct operational capability. See the [implemented role workflow](SeCapstone/rentara-portal/docs/staff-implementation-plan.md).

Managers manage their own workspace, property and tenant records, bill review, rent confirmation, eligible final-cycle advance, and rent receipts. Tenants view their own bills, report rent payments and maintain personal utility tracking. Utility tracking does not verify provider payment. Admin access is for system maintenance and workspace/account setup.

Supported email summaries and documents use direct text extraction or OCR, followed by explicit validation, mapping, duplicate checks and billing rules. Alerts use the portal, Web Push support and supplementary rent-only email. Provider-app access, payment gateways, tenant SMS, predicted utility due dates and autonomous AI billing decisions are excluded.

The authoritative database definition is [server/store.js](SeCapstone/rentara-portal/server/store.js); the database filename remains `propertypro.sqlite` under `DATA_DIR`. Existing account emails and session identifiers remain compatible. For details, see [the API/database contract](SeCapstone/rentara-portal/docs/api-contract.md) and [workspace guide](SeCapstone/rentara-portal/docs/workspaces.md).

## Private and historical material

Databases, original private bills, dependencies and local backups remain excluded from Git. The owner explicitly chose to share this project's team-owned `.env`; unrelated personal credentials do not belong in it. Project VS Code settings hide dependency/test-output folders and private backup work areas from Explorer; files remain on disk. `.env`, `data`, research files and archives remain visible. Hidden folders can be shown by changing `.vscode/settings.json`.

Older QA results are preserved in [historical checkpoints](SeCapstone/rentara-portal/docs/archive/checkpoints/qa-history-through-2026-10-20.md). Submitted reports remain fixed copies; edit their canonical source for later revisions. Working preferences and installed skill rules are in [AGENTS.md](AGENTS.md).
