# Development guide

Current implementation: 23 October 2026. Replaces the archived 12 October development/deployment plans. The stack and capstone workflow remain fixed.

## Code map

| Folder/file | Responsibility |
| --- | --- |
| `index.html`, `src/app/app.js` | Browser entry and page registry |
| `src/config`, `src/auth` | Navigation, session and client permission presentation |
| `src/features` | Admin, Staff, Manager and Tenant pages using shared operational components |
| `src/features/settings/settings.page.js` | Single Manager Settings implementation; replaces the former settings-live.js plus wrapper |
| `src/components`, `src/styles`, `src/utils` | Shared controls, appearance and helpers |
| `server/index.js`, `server/scheduler.js` | Protected routes, static serving, scheduler startup/shutdown and read-only operational status |
| `server/service.js`, `server/rules.js` | Account/role checks, billing workflows, validation and centavo/date rules |
| `server/staff-workflow.js` | Staff proposals/notes and atomic Manager decisions |
| `server/store.js` | Authoritative SQLite schema, workspace-scoped persistence and migrations |
| `server/integrations.js`, `server/workspace-integrations.js` | Mail intake, extraction and per-workspace delivery configuration |
| `server/recovery.js` | Complete data/source-file recovery support |
| `tests` | Isolated backend/browser/fixture checks, not actual participant evaluation |
| `tools` | Explicit setup, sample generation, previews, restore and readiness commands |
| `data` | Working databases, sources, private integration settings, backups and local TLS; preserve |

`docs/api-contract.md` explains API behavior; server code defines actual stored/returned records. The old unreferenced mock-model typedef file was removed because it duplicated stale shapes. It was not an ORM/database model.

## Working safely

Follow [team turn-taking](team-branch-workflow.md). Read [scope](capstone-scope.md) and [role implementation](staff-implementation-plan.md) before changing billing/permissions. Share coherent changes and tests; the user handles Git commits/pushes. Keep all existing IDs and billing history through migrations.

New checkout: Node.js 24+ and `npm.cmd ci`. Start the configured default profile with `npm.cmd start`. Use the dedicated [Group 3 demo guide](../../reports/demo-files/group-3/README.md) or [acceptance setup](local-acceptance-setup.md) for their respective data profiles and printed ports. Frontend and backend are served from the same origin.

Use `npm.cmd test` for the full suite or the package's targeted backend/browser commands for affected work. Tests must use disposable records and suppress external delivery. Do not reset live/demo records just to pass a test. For source/page cleanup, verify imports, documentation links and cross-role browser navigation.

## Integration and actual operation

Independent workspaces and Staff are implemented. Each business uses its own records and authorized integration setup; it is no longer a single shared portfolio for all Managers. Use [workspaces](workspaces.md), [Gmail setup](gmail-local-setup.md), [email acceptance](email-billing-acceptance.md) and [remaining checks](next-session-checklist.md).

Email is rent-only; portal/Web Push support rent and utilities. Keep optional Web Push in the application while real-device checks are deferred. Tenant marks never verify provider settlement. Automatic processing requires a running backend; Gmail and external delivery require internet. A demo pass does not establish representative provider accuracy or 24/7 reliability.

Public hosting is deferred. It requires trusted HTTPS, persistent private data storage, a supervised running Node process, backups/restoration and measured resource/concurrency limits. Existing workspace isolation is supporting infrastructure, not proof of production readiness. Older hosting proposals are [historical planning records](archive/planning/README.md), not setup instructions.

## File organization

### What the team gets from Git

Both ignore files were checked on 28 October 2026. Application source, package manifests/lockfile, tests and fixtures, sample bills, project skills, setup tools, diagrams, reports, current PNGs and manuscript files are shareable. The existing team-owned `.env` remains included by the owner's explicit choice. `.env.example` and named templates such as `.env.acceptance.example` are included too; the latter is a reference, not a replacement for generated setup.

`node_modules`, generated test output/caches, private recovery folders, the original personal SOA, runtime `data` and generated `.env.acceptance` remain excluded. On another laptop, install Node.js 24+, run `npm.cmd ci`, and follow the Group 3 demo or local acceptance guide linked above. Setup recreates the chosen demo database; HTTPS setup generates that laptop's certificates and current LAN profile. Do not run initialization against an existing working portfolio. The local acceptance guide includes the required mkcert setup.

Git shares code and documents; it does not synchronize the main laptop's current tenants, payments, uploaded originals or mailbox-processing history. To reproduce that exact portfolio rather than regenerated demo data, use the existing [backup and recovery procedure](backup-and-recovery.md) with its source files. No tracked files were removed from the Git index by this ignore review.

Current setup/usage belongs in `docs`; outdated evidence belongs in `docs/archive`; research drafts in `../../review`; editable figures in `../../diagrams`; demo attachments and presentation outputs in `../../reports`. Keep intentional portable demo/test fixture copies; remove a dependency/file only after checking its consumers. See [cleanup record](project-cleanup.md).

The full/browser npm test scripts run one test file at a time to reduce competing browser/OCR workers on the demo laptop. This controls development-test resource use, not the number of application users or workspaces.
