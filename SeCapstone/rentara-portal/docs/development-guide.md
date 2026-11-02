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

### Separate operational profile

Use this for a clean local portfolio rather than changing the Group 3/showcase records. It is the same Node application with its own configuration and SQLite database; it is not a claim of public deployment or completed acceptance.

| Setting | Operational profile |
| --- | --- |
| Configuration | `.env.operational`, created from the shared `.env.operational.example` |
| Database and originals | `data/operational/` |
| Default laptop URL | `http://localhost:8081/` |
| Initial records | Your chosen workspace, Admin and Manager; no properties, units, Tenants, bills or receipts |
| Mail and Web Push | Intake and rent email off by default; new portfolio Push off; allowlisted connections may come from shared `.env` |

From `SeCapstone/rentara-portal`, run once in your own terminal:

```powershell
npm.cmd run setup:operational
```

Enter the management/workspace name, then the Admin and Manager names, separate emails and passwords. Passwords are entered and confirmed locally without showing the typed characters. Existing password rules apply: 12–200 characters. Do not paste passwords into chat. Setup reruns preserve existing operational records and passwords; another profile's database is refused. The default demo accounts are not created in this profile.

For subsequent starts:

```powershell
npm.cmd run start:operational
```

Sign in with the credentials you entered. Manager adds properties, units, verified utility mappings and Tenant records; Admin creates/links the corresponding accounts and Staff using the existing workflow. No demo database is copied or cleared.

Shared `.env` supplies only the allowlisted SMTP/IMAP connection values, VAPID keys and OCR path. `.env.operational` supplies this profile's database, URL/port, mailbox label and delivery/intake switches; nonblank connection overrides take precedence. Blank connection fields inherit shared values. Shared data paths, TLS paths, mailbox labels, workspace files and delivery switches are never inherited. Existing profile files are preserved; `UTILITY_INTAKE_ENABLED=false` is the default even if an older file lacks that line.

Set `UTILITY_INTAKE_ENABLED=true` in `.env.operational` only after preparing the operational label/filter. Use `Rentara-Utilities` or another dedicated operational label; `Rentara-Group3-Demo` is refused for Operational workspaces. Set `RENT_EMAIL_ENABLED=true` separately when approved rent sending is ready. Web Push still needs trusted HTTPS, keys and the existing Manager preference. The default new portfolio has Push off. Optional workspace integration JSON stays under `data/operational`; additional workspaces need explicit integration configuration and do not inherit the default workspace's credentials.

Normal daily use has two commands: `npm.cmd run demo:group` and `npm.cmd run start:operational`. Normal Demo external email and Push stay blocked at the send points, even if workspace settings enable them. An explicit live-demo option is described below. Demo reads only `Rentara-Group3-Demo` after explicit `-- --receive`. Acceptance remains a developer test tool, and the existing default startup remains available without automatically choosing Operational. The startup summary identifies the profile and enabled mailbox account/label without passwords or keys. Connection settings changing on disk require a restart.

### Controlled live demo delivery

Stop the running Group 3 server with Ctrl+C, then use:

```powershell
npm.cmd run demo:group -- --receive --live-delivery
```

Omit `--receive` if you only need outgoing delivery. Without `--live-delivery`, outgoing email/Push remain off regardless of inherited settings. The flag applies only to that process; starting normally again returns to delivery off. It uses the same Group 3 database, accounts and billing workflow. No records are reset and old notifications are not replayed.

Live delivery is restricted to the three approved Group 3 Tenant emails printed at startup. New notification events must be created after this startup; changing an account email or restarting does not make an old event eligible. Rent-only email, Tenant preferences, reminder timing and duplicate/retry rules still apply. Demo outgoing email subjects and Push titles carry `[DEMO]`. The SMTP settings come from `.env`; stable VAPID keys may come from the existing local HTTPS configuration. Missing SMTP settings stop live-demo startup before sending; missing Push keys are reported without disabling an otherwise configured rent-email demo.

For each test phone, open the printed HTTPS address on port 8444, log in as an approved Tenant, open Notifications / Browser notification settings, and select Enable Web Push or Refresh device registration. This renews the existing subscription record without clearing the browser. Only subscriptions registered after this server startup can receive live-demo Push. The Manager must also enable Web Push delivery in Settings, and the Tenant must permit that notification category. Browser certificate trust, permission and internet access remain necessary. Enable/refresh registration again after restarting the live demo.

Use a fresh agreed utility bill to check intake, the Tenant bill and portal/Push alerts. Utility bills never send Tenant email. To check rent email, use a new rent-update event or report/confirm an unpaid demo rent payment through the existing workflow; confirmation creates a new event even for an older bill. Scheduled reminders remain at the approved Philippine-time schedule; do not change the system clock or erase history to force them. The notification links preserve the configured laptop host and use port 8444, not acceptance port 8443. Verify arrival on the actual Gmail inbox/phone separately from a server acceptance result.

The initial Admin creates the other two team Admin accounts through the existing Users & Roles page, using separate identities/passwords. Demo Tenant identities are unchanged. No additional registration flow is needed.

For phones on the same reachable network, set `HOST=0.0.0.0`, use the laptop's current IPv4 address and port in `PORTAL_URL`, and add that exact origin to `ALLOWED_ORIGINS`. Keep localhost/127.0.0.1 origins too. For HTTPS, supply both local certificate/key paths and use matching HTTPS URLs/origins. The launcher checks transport, port and origin consistency; it does not configure the firewall or certificate trust. The laptop and Node process must remain running. This remains a local setup, with no paid hosting required.

The team shares the template and code through Git. The generated profile and working data stay local, following the existing named-profile policy. All actual users should connect to the intended main laptop; separate laptops' databases do not synchronize through Git. Existing demo/acceptance commands retain their own records and configuration.

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
