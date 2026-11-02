# Independent property workspaces

Implemented 15 October 2026. Rentara retains Node.js, SQLite and the existing HTML/CSS/JavaScript frontend. No Git push or manuscript edit is part of this change.

## Operating model

One workspace represents one independent property business and may contain several properties and Managers. A Manager or Tenant account belongs to one workspace. System Admin accounts maintain accounts, workspaces, audits and backups, and may inspect approved business records through the explicit read-only workspace view. Their role does not authorize operational/financial mutations or private-file access. There is no separate Owner role in this version: an owner uses a Manager account.

The Admin opens **Users & Roles**, selects **Create workspace**, enters the business name, then uses **Add user** to assign a Manager to it. Manager-created properties, units, tenant records and mappings inherit the authenticated workspace. When creating a Tenant login, Admin selects the same workspace as that permanent Tenant record. The sidebar and mobile header show the signed-in workspace. Admin can rename a workspace without moving its records.

Workspace selection is not public registration. Email addresses remain globally unique and there is no account workspace switcher. Workspace deletion/merging, cross-owner tenant transfers, separate Owner permissions and self-service invitations are deferred.

## Migration and recovery

The storage constructor migrates a legacy database transactionally. Before changing populated legacy tables, it creates a consistent `before-workspaces-*.sqlite` snapshot under that database directory's `backups/`. Existing business records become members of `ws-default` (Default workspace), with original IDs, account passwords, amounts and dates retained. Existing Admin accounts remain system accounts. Settings and mailbox-message keys become workspace-specific; provider/account mappings can repeat across separate owners. The migration is idempotent.

Existing default-workspace source/document paths stay unchanged. Additional workspace files live under `DATA_DIR/workspaces/<workspace-id>/`. The same bill in two separate owners' workspaces is processed independently; the same bill twice in one workspace is held by the existing duplicate rules.

Stop the old Node process before migrating a populated database and run the updated server afterward. Do not run an older server build against the migrated schema. Keep the pre-migration database snapshot and the entire data directory, including source/document files. Recovery should use a separate restored directory and the matching application version; never overwrite a running database or copy only its main file while WAL writes are active.

## Backend enforcement

Authentication reads the global account/session registry and verifies the current membership. Each authenticated request then runs in a server-selected `AsyncLocalStorage` workspace context. Request bodies and query parameters cannot select that context. Role checks reject a Manager/Tenant used in another workspace context.

The shared storage layer scopes reads, lookups, writes and deletions across business tables. Writes stamp the server-selected workspace, reject cross-workspace identifiers and check that related records belong to the same workspace. User/account maintenance is an explicit Admin-only global operation; changing an account's membership revokes its old sessions. Foreign keys and workspace indexes remain enabled.

This boundary applies to portfolio records, bills, allocations, rent cycles, incoming sources, corrections, exceptions, payments, credits, receipts, documents, messages, notifications, subscriptions, settings and mailbox intake records. File routes check the scoped record before accessing the workspace's private directory. No client receives database or filesystem access.

## Mailboxes, notifications and jobs

Every workspace has an integration runtime, private source/temp directory, mailbox sync lock, OCR queue and email transport. The scheduler explicitly visits each active workspace. Rent generation, reminders, duplicate checks, sender recipients and subscription queries run in that context. A failure in one workspace is logged by workspace ID and does not prevent the next workspace's scheduler attempt. Admin service checks include the workspace name.

Only `ws-default` inherits legacy `.env` integration credentials. Additional workspaces start with external integrations unconfigured; they never silently inherit the first owner's mailbox, SMTP or Push keys. An operator can set `WORKSPACE_CONFIG_FILE` to a private JSON file under the ignored data directory:

```json
{
  "ws-REPLACE-WITH-ACTUAL-ID": {
    "IMAP_HOST": "imap.gmail.com",
    "IMAP_PORT": "993",
    "IMAP_USER": "owner-account@example.test",
    "IMAP_PASSWORD": "SET-LOCALLY",
    "SMTP_HOST": "smtp.gmail.com",
    "SMTP_PORT": "587",
    "SMTP_USER": "owner-account@example.test",
    "SMTP_PASSWORD": "SET-LOCALLY",
    "SMTP_FROM": "Rentara <owner-account@example.test>",
    "RENT_EMAIL_ENABLED": "true",
    "PORTAL_URL": "https://your-rentara-domain.example/"
  }
}
```

The workspace ID is returned by the Admin workspace API (`GET /api/v1/admin/workspaces`). These are placeholder credentials, not a working configuration. Store actual secrets only on the server, never in Git, screenshots, shared reports or chat. Restart Node after changing this file. Saving an intake mailbox address in the Manager UI does not configure credentials. Optional VAPID keys may also be supplied explicitly per workspace. Marked showcase/demo workspaces disable outgoing email, Push and mailbox retrieval even if credentials are present.

## Two-workspace showcase

Run `npm.cmd run demo:showcase` to add/reuse these synthetic portfolios. Existing default-workspace records are preserved. The second portfolio is added once; it is not regenerated when the command is repeated.

| Workspace | Role | Email | Password |
| --- | --- | --- | --- |
| Default workspace | Manager | `manager@propertypro.ph` | `LocalDemo!2026` |
| Default workspace | Tenant Maria | `maria.santos@gmail.com` | `LocalDemo!2026` |
| Default workspace | Tenant Alice | `occupant2@example.test` | `LocalDemo!2026` |
| Riverside Rentals | Manager Paolo | `manager2@example.test` | `LocalDemo!2026` |
| Riverside Rentals | Tenant Luis | `luis.garcia@example.test` | `LocalDemo!2026` |
| System maintenance | Admin | `admin@propertypro.ph` | `LocalDemo!2026` |

The added addresses are synthetic demo logins, not mailboxes. Existing customized passwords are not reset. Riverside contains an independent apartment/unit, tenant, previous confirmed rent receipts, current rent, utility bills, calendar dates and portal alerts.

## Verification and limits

`tests/workspaces.test.js` checks HTTP isolation, related-record validation, cross-owner file/receipt access, settings separation, independent duplicate detection, profile-context forgery, exports, concurrent requests, session revocation, legacy migration/backup and scoped scheduler/email transports. `tests/workspaces.browser.test.js` exercises Admin workspace creation/Manager assignment and independent browser sessions with a mobile workspace label. Run `npm.cmd test` for the entire regression suite.

On 22 October 2026 the workspace-focused suite checkpoint passed 77 tests, and the later complete intake/recovery run passed **83 tests**. An added regression checks distinct per-workspace mailbox credentials/folders and verifies that a failed workspace A job does not prevent workspace B from running on subsequent scheduler cycles or expose its saved status to A. The newer checks also reject cross-workspace held-email retries and preserve separate workspace source paths during recovery. These use synthetic settings and controlled jobs; they do not contact live providers. A read-only check of the configured showcase found two active independent workspaces and no foreign-key violations. See [current QA results](qa-report.md) for the coverage and remaining acceptance work.

These checks establish local behavior for the tested routes; they are not a penetration-test certification, load benchmark or live-provider acceptance. Pilot deployment still needs HTTPS, protected persistent storage, tested restore procedures, monitoring and live per-owner integration checks. SQLite remains the current database; larger workloads and multi-server operation require separate capacity planning.

The manuscript's future revision should explicitly state independent owner workspaces, membership/access boundaries and per-workspace intake/notification configuration. Chapters and diagrams are not automatically rewritten by this implementation.


## Profile and mailbox safeguards ? 1 November 2026

Demo and Operational use the same business rules with separate database/source directories. Startup validates all enabled workspace mailbox configurations before connecting. Two readers in the same profile cannot use the same trimmed, case-insensitive account plus label; the same label under different accounts is allowed. Existing records are not rewritten or removed to resolve a conflict. Edit the actual integration configuration and restart. There is no separate mailbox-label editor in the portal. Separate running processes do not share a configuration registry: check their printed account/label pairs when setting up multiple instances.

Gmail filters remain essential. A wrongly labelled message stays in the receiving workspace: an unknown provider/account mapping is held for review, while a valid matching mapping can produce bills there. The collision check does not establish intended ownership. Managers must verify mapping ownership and operators must test routing with the intended filters.

New IMAP history identities include host, account, exact folder name, UIDVALIDITY and UID. Exact message hashes, scoped to the account and workspace, prevent repeated source processing after relabelling or a UIDVALIDITY reset. Different messages sharing a numeric UID in another folder still get examined. The existing document/provider/account/period validation remains the financial duplicate backstop for changed email copies. Message-ID alone is not trusted.

Old history is retained. Old processed identities lack the folder, so they are re-examined once under the new identity; billing validation blocks duplicate bills and alerts. Old held messages remain explicitly retryable, and their original review links are retained. A label/UIDVALIDITY change can require downloading messages again; it does not promise zero rescanning. A copied bill can appear as a duplicate review item, but must not create another charge or alert. Restart after configuration changes.
