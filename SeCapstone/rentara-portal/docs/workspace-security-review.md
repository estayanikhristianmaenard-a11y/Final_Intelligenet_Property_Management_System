# Workspace change security review

Date: 15 October 2026. High-risk access-control/database change, reviewed using the installed API-security and differential-review guidance. This is a focused implementation review and local test record, not an independent penetration test or certification.

## Baseline and scope

The previous working checkout used one shared portfolio. `Service.own` allowed the Manager role to access any Tenant and `Service.bills` returned all Managers' bills. That was compatible with one property business but insufficient for independent owners. Git history/blame traces that original role boundary to `990cfb3`; many later improvements were already uncommitted before this task. No existing work was reset or checked out to perform the review, and unrelated changes in the working tree are not attributed to this task.

Primary change surface: `store.js`, `service.js`, `index.js`, `workspace-integrations.js`, `integrations.js`, demo provisioning and Admin account/workspace forms. A server search found 198 lines calling storage `all/get/save/remove` operations at review intake, so adding filters to a few UI screens would have left a broad bypass surface. The implemented storage/request boundary covers those callers centrally. Raw SQL usages were inspected: sessions are intentionally global, migration/backup/integrity are trusted system operations, and intake ordering now reads scoped records.

## Invariants and trust boundaries

- A Manager/Tenant request receives its workspace only from the current authenticated database membership. Role and workspace are distinct checks; body/query IDs do not grant scope.
- Admin-only account/workspace maintenance uses a separate explicit global context. Admin role still does not authorize property billing endpoints.
- Scoped storage lookups and writes cannot read or overwrite another workspace's record. Related records must belong to the same workspace, including financial/document parents. Settings and mailbox-message keys support the same logical ID in different workspaces.
- File authorization happens before filesystem access. New workspaces have separate source/document/temp directories; legacy default paths are preserved.
- Each background runtime has its own integration environment, locks, queues and transports. The scheduler visits explicit workspace contexts. External keys/mailboxes are not inherited from another owner.
- Original amounts, dates, financial history, receipt identity and approved Manager/Tenant actions remain governed by existing business rules.

## Findings addressed during implementation

| Risk | Resolution and evidence |
| --- | --- |
| Manager role acted as cross-owner access | Request-wide workspace context plus scoped storage; copied record IDs and query/body scope forgery tested through HTTP |
| Foreign parent IDs could connect an owner's row to another portfolio | Service lookups and storage foreign-parent workspace validation; cross-owner unit/account/message mutations denied |
| A correction request could create an exception before checking the source | Scoped source lookup now precedes exception creation |
| Global provider/account uniqueness prevented independent ownership configuration | Mapping uniqueness migrated to workspace/provider/account; identical source PDF independently finalized in each workspace |
| Shared settings or mailbox deduplication keys could overwrite another owner | Composite workspace/logical IDs; separate configuration and scheduler records tested |
| A new owner's integrations could use the first owner's credentials | Additional runtimes start unconfigured unless explicitly assigned private server configuration; inheritance and recipient tests pass |
| Legacy SQLite cannot add a non-null-default REFERENCES column to populated tables | Transaction adds nullable referenced columns then backfills preserved data; populated migration test and live migration passed |
| Failed migration could retain an open SQLite handle | Constructor closes the database on failure; rollback remains transactional |
| Missing bill-line IDs previously depended on nullable SQLite text keys | Bill saving supplies an ID when absent; email regression tests pass |

## Executed evidence

`npm.cmd test`: **59 passed, zero failures/cancellations/skips**, approximately 67 seconds. Includes all existing financial, extraction/OCR, email, portal, session and responsive tests, plus:

- HTTP A/B workspaces: own reads succeed, foreign property/unit/Tenant/bill/receipt/document/source reads denied; cross-owner mutations denied; same account and identical PDF remain independent between owners.
- Separate mailbox settings and unconfigured second-owner SMTP/IMAP; notification transports target their own workspace's Tenant.
- Owner-specific exports, repeated concurrent requests, forged profile context ignored and old sessions revoked after membership changes.
- Legacy database snapshot created once, preserved record names/credential hashes/settings, idempotent reopen, no foreign-key violations.
- Scheduler visits both workspaces without duplicate rent cycles and preserves separate schedule records across async operations.
- Browser Admin creates a workspace and assigns a Manager; two independent browser sessions see different portfolios; workspace name survives reload and fits phone width.

The local showcase was separately backed up and migrated. Original default-workspace counts and credential digest matched afterward, and SQLite reported no foreign-key violations. Live sign-ins passed for the original Manager/Maria/Alice and Riverside Manager/Luis. Riverside Manager's request for the default property's ID returned 404. These smoke checks did not send external email or Push.

## Remaining limits

Tests cover representative attack paths and existing regressions, not every possible payload or all timing combinations. Future endpoints must remain inside the authenticated workspace dispatch; raw SQL and explicit global storage access require security review. Server operators, database files and the private integration configuration are trusted and must be protected at deployment. Per-owner live Gmail/SMTP/Push delivery, hosted HTTPS/reverse-proxy settings, restore drills and workload limits require separate acceptance work. Email addresses remain globally unique and accounts have one workspace; self-service signup, cross-owner transfers and workspace deletion are not implemented.
