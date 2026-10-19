# Admin system status

This is an operational maintenance view based on explicit code checks. It is not an ISO score, a research evaluation result, or proof that every feature works. Historical success is labeled **Recorded success**, with dates available under **What was checked**.

| Check | Input and rule | What the result establishes | Limit |
| --- | --- | --- | --- |
| Database connection | Run read-only SQLite `SELECT 1` | Connection answered now | Does not check integrity, every table, backups or restore |
| Property mailbox intake | Required IMAP settings and stored last-sync result | Missing configuration, unverified configuration, or a dated prior result | Does not connect to the provider or mailbox |
| Rent email | SMTP configuration and latest actual sending-attempt metadata | Disabled/missing setup or a dated transport result | Acceptance does not establish inbox delivery or reading |
| Bill extraction components | Resolve PDF.js, Tesseract.js and bundled English language packages | Packages are installed and resolvable | Does not run OCR or measure extraction accuracy |
| Billing validation rules | Confirm loaded `processIncoming` function | Processing entry point exists | Does not test billing correctness |
| Web Push | VAPID configuration, workspace delivery setting and sending history | Configuration state or a dated transport result | Does not prove device display, permission or reading |
| Exception records | Count open records within the workspace | Queue can be queried and shows its open count | Zero does not prove every bill is correct |

**Checked** means the metadata/availability check ran at that time. **Last attempt** and **Last success** refer to recorded synchronization or transport events. Missing dates display **Not recorded**; they are never replaced with today's date. Past success does not prove current connectivity. Future mailbox and Push attempts retain their prior success timestamps even when a later attempt fails. Older records can only expose dates that were actually saved.

Each check handles its own failure. Active workspaces are checked independently. Failed requests for accounts, maintenance events or status do not replace the whole dashboard. A failed refresh preserves the previous snapshot and its original time.

`GET /admin/services` loads the view. `POST /admin/status` refreshes and records **System status refreshed** in the maintenance audit. `/admin/health` remains a compatibility alias. All require Admin authorization. Responses contain no credentials or raw integration errors. Refresh sends no emails or Push messages, retrieves no mail, runs no OCR, and performs no full-database integrity scan. There is no automatic polling.

Use controlled sample bills and the billing regression tests for actual processing verification. Use separate, deliberate mailbox/email/Push tests for integration delivery. A backup restore and database integrity check are separate maintenance procedures. These distinctions provide a concrete answer when explaining the feature to an adviser.

Verification: `tests/system-status.test.js`, `tests/presentation.test.js`, and the Admin section of `tests/browser.test.js`.
