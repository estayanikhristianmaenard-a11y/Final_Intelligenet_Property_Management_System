> **Historical investigation record.** Its dated findings and limitations are retained for traceability. For the latest verified behavior and remaining work, use [Current QA status](../../qa-report.md).

# Core billing workflow verification

Verified locally on 13 October 2026 against the working checkout. All runs used isolated fixture databases and temporary source files; the operational database and live mailbox were not used. Changes were not committed or pushed.

## Results

`npm.cmd test` passed all 34 tests: 32 backend/integration tests and two actual browser tests. Before the repair, the existing backend suite passed 31 tests, but the added regression reproduced an invalid extracted date being finalized.

| Stage | Evidence | Limit |
| --- | --- | --- |
| Email attachment intake | A generated MIME email with a real PDF attachment runs through parsing, extraction and shared-bill finalization | Live IMAP authentication and retrieval were not exercised |
| Digital PDF extraction | A real generated text-layer PDF is extracted and finalized; malformed PDFs enter exceptions | Representative provider PDF layouts still require checked samples |
| Image OCR | A clear PNG is recognized using the bundled English model locally | No accuracy claim for real provider photos, damaged bills or unsupported layouts |
| Mapping and allocation | Provider/account mapping, eligible recipients, exact centavo sharing and frozen recipients pass existing tests | Provider/account mappings must be configured correctly |
| Duplicate handling | Duplicate sources are held; identical uploads share stored bytes while retaining intake history | Live mailbox restart/retry acceptance is still pending |
| Correction and history | Revalidation, shared-charge revisions and retained history pass existing tests | Real document acceptance remains separate from synthetic fixtures |
| Tenant access and payment separation | HTTP ownership checks, personal utility tracking, rent-only confirmation and browser history/payment flows pass | No utility-provider settlement is verified |
| Notifications | Persisted alerts, reminder rules and encrypted Push requests with a test transport pass | External background delivery and actual phones remain unverified |

## Parser repair

The original parser used JavaScript's permissive date conversion. `2026-02-30` was normalized to `2026-03-02` and accepted. Its amount expression captured only the beginning of a malformed number: `100.001` and `1,00.00` could both become `100`.

The parser now validates the complete amount token and a real calendar date. Invalid precision, misplaced thousands separators and negative amounts require review. Due dates accept valid ISO dates (`YYYY-MM-DD`) and explicit English month dates such as `March 5, 2026` or `5 March 2026`. Ambiguous numeric dates such as `03/05/2026` require Manager correction rather than a guessed interpretation. Billing-period endpoints retain their existing ISO format requirement.

The new regression uses real PDF extraction and verifies that malformed or ambiguous values create open exceptions without creating bills. Existing PDF, MIME email, offline OCR and conflicting-value checks also passed after the repair.

## Next acceptance step

No local `.env` file was present during inspection. Mailbox and Web Push configuration was not established by this check. Before claiming live integration, configure the designated mailbox locally, obtain representative bills with manually checked field values, and verify retrieval, correct mapping, duplicate retry behavior, tenant visibility and exceptions. Scanned PDFs remain outside the implemented digital-PDF path; a clear PNG/JPEG upload is the supported alternative. Oversized messages require operator handling under the existing intake limits.

This is development verification, not participant evaluation, provider acceptance or production certification.

## Portal notification verification — 14 October 2026

The complete suite passed 35 checks: 32 backend/integration checks and three real-browser checks. The new `tests/notifications.browser.test.js` uses a temporary SQLite database and separate Manager/Tenant browser sessions. It creates a real digital-PDF upload through the Manager interface, rejects and confirms Tenant rent reports through the Manager interface, and applies final-cycle advance credit through that interface. Fixture setup and a controlled future clock exercise the existing reminder scheduler; this does not demonstrate real-time reminder delivery.

Verified saved alerts include new bills, rent-report rejection reasons, confirmed receipt notices, advance-credit notices, and eligible utility reminders. Confirmation, credit, and reminder retries do not create duplicate alerts. Tenant API queries and read requests cannot substitute another recipient. Marking one Tenant's alerts read preserves another Tenant's unread status. Alerts and read flags survive a full server/database restart even without mailbox credentials or configured Web Push keys.

The browser check reproduced a stale bell count: after Manager confirmation in another session, opening the Tenant notification feed showed the receipt alert but retained the previous unread count. Loading the notification page now refreshes the shell's badges. Page wording now identifies saved portal alerts and describes browser Push as optional. This refresh occurs when the feed is opened; no continuous live-update mechanism is claimed.

The 390px mobile viewport fits without horizontal overflow. A screenshot is generated at `test-results/portal-notifications-mobile.png`. The operational database was not used. No external notifications were sent, and no Git commit or push was performed.
