# Professor demo: final verification and running order

For the later requested **two units with your three group members**, follow the [Group 3 phone-to-email demo](../../reports/demo-files/group-3/README.md). Its separate portal is **HTTPS port 8444**, with matching scanned/digital bill attachments and the submitted member identities. The showcase/acceptance accounts and ports below are preserved alternatives; do not mix their files or mappings with the Group 3 demo.

Prepared 22 October 2026. This guide uses the existing portfolios; it does not reset records, create new accounts, enable rent email or change mappings. Automated results are in the [QA report](qa-report.md).

## Before presenting

- Restart the chosen server to load the latest code. Keep the laptop awake, plugged in and the terminal open. Do not run setup/reset commands over existing data.
- At the final readiness check, showcase port 8080 returned HTTP 200; acceptance port 8443 was not running. Start acceptance explicitly if you plan to demonstrate its sample-file intake. Reachability is a point-in-time check, not a guarantee that a server remains running.
- Use `npm.cmd start` from `SeCapstone/rentara-portal` for the configured showcase at **http://localhost:8080/**.
- Use the separate [acceptance startup](local-acceptance-setup.md) for **https://CURRENT_LAPTOP_IP:8443/**. Phone access requires the current laptop address, a reachable local network and trusted HTTPS for Push. Do not assume the previously configured IP is unchanged.
- Keep the [demo ZIP](../../reports/demo-files/rentara-demo-bill-files.zip) extracted locally before presenting. Its 11 input/metadata entries were checked against current source hashes. EML is not an accepted browser bill upload.
- Start with the same laptop/browser/network you plan to use. Close unrelated tabs; use separate browser profiles or clearly sign out before changing roles. Do not assume a phone has granted notification permission.

## Accounts checked without changing records

All listed accounts were active and their initial local password **LocalDemo!2026** matched at the read-only readiness check. Do not reset them merely for rehearsal.

| Portal | Role | Email |
| --- | --- | --- |
| Showcase, port 8080 | Manager of default workspace | manager@propertypro.ph |
| Showcase, port 8080 | Tenant Maria | maria.santos@gmail.com |
| Showcase, port 8080 | Independent second Manager | manager2@example.test |
| Showcase, port 8080 | Admin | admin@propertypro.ph |
| Acceptance, port 8443 | Manager | manager@propertypro.ph |
| Acceptance, port 8443 | Test Tenant | rentara2026@gmail.com |

At that check the showcase had **two workspaces, 20 bills, one pending rent report and nine receipts**; acceptance had **five bills and no receipts/pending reports**. Both databases reported zero foreign-key violations. Counts will change during your demo; do not treat these as permanent expected totals or participant results.

## Main presentation: showcase

| Order | Action | Explain/check |
| --- | --- | --- |
| 1 | Manager opens Dashboard, property/unit and Tenant records | One business workspace contains its own portfolio. Other independent owners use another workspace |
| 2 | Open a shared bill and its breakdown | Equal eligible shares reconcile to the source amount; this is allocation, not collection/verification of provider payment |
| 3 | Tenant Maria opens her bills and personal utility tracker | Show the own-bill amount, mark/undo and "Provider payment not verified." No Manager utility approval or utility receipt |
| 4 | Maria reports an eligible unpaid rent bill, if available | Status becomes Tenant Reported Paid; it is not yet Manager-confirmed Paid |
| 5 | Manager reviews the report for that same Tenant and confirms the synthetic test payment | Correct Tenant/bill/amount and one confirmed receipt. Do not pick another Tenant's pending report and expect Maria to see its receipt |
| 6 | Maria views that confirmed receipt, or an existing confirmed rent receipt | Black-and-white preview opens without forcing download. Reopening must reuse the receipt |
| 7 | Sign out, then sign in as the second Manager | Show the independent portfolio; records and settings are separate. Two Managers in the same workspace would share its portfolio |
| 8 | Admin opens System Status and, if needed, Audit Log | Configuration/basic availability and recorded results, not an overall accuracy score. Showcase external channels are deliberately blocked |

Every bill/payment in this presentation is test data. If a rent bill was already confirmed during rehearsal, show its existing result or choose another eligible synthetic bill. Do not reset or forge transactions simply to repeat the sequence.

## Bill intake: acceptance portal

This portfolio has synthetic mappings `9990000001`, `TEST-MERALCO-001` and `TEST-WATER-001` and a Tenant whose start date covers these bill periods. The showcase uses different mappings, so uploading the same files there can correctly require review.

| File | Expected result in the acceptance portfolio |
| --- | --- |
| `synthetic/water-001/bill-digital.pdf` | If not previously imported, direct PDF text extraction, validated PHP 220.00 water bill and Tenant portal alert. If already imported during rehearsal, duplicate hold is correct |
| `synthetic/unmapped-account-001/bill-digital.pdf` | Account `TEST-UNMAPPED-999` is intentionally unmapped. Show the exception and explain that verified mapping/correction is needed before billing. Do not change it to another already-billed account just to force success |
| `anonymized/meralco-001/bill-scanned.pdf` | Actual image OCR, then duplicate review because the corresponding digital bill was already seeded. Show extracted fields and the duplicate reason; no second charge is the intended outcome |
| `anonymized/meralco-001/bill-digital.pdf` | Reference/comparison version of that same bill; it uses text extraction and must not create an independent second charge |
| `synthetic/electricity-001/*.eml` | Developer email-parser fixtures. Use the safe local verification command below; do not upload EML through the browser |

Use `case.json` beside each sample to compare the amount, due date, billing period, provider and account/reference. A PDF with selectable text is not evidence of OCR; the scanned version exercises OCR. Renaming a file must not bypass duplicate protection. A fresh first-time OCR finalization needs a clean isolated test setup and matching occupancy/mapping; this review did not reset the current acceptance portfolio.

For email parsing without connecting/sending, run from the app directory:

```powershell
npm.cmd run verify:email-billing
```

Actual Gmail label retrieval and one labelled rent email self-test passed in earlier controlled checks. They were not repeated during this final review. Acceptance can retrieve its explicitly enabled dedicated utility label while running; outgoing rent email remains off. Do not promise a live provider message, internet connection or delivery at presentation time.

## Only demonstrate these live after an actual rehearsal

- Android Web Push: certificate trusted, permission granted, subscription stored, new eligible event received and tapped successfully.
- Rent email: permitted recipient and working phone portal link. The existing self-test does not prove delivery to everyone.
- Actual provider compatibility: authorized actual email, verified account mapping and manually checked expected values. Synthetic/anonymized copies alone do not establish broad accuracy.
- Physical printing and a backup restored on another device. Automated package/restore tests do not replace those physical checks.

If an external channel is unavailable, demonstrate stored portal notifications and explain the limitation. Do not present that as a successful external delivery. Keep [manual acceptance](manual-test-guide.md) and the [Manager/Tenant user stories](user-stories.md) available for questions.

The one-form Manager Tenant-account change remains deferred. The current demo uses the existing Manager record/Admin-linked account workflow.

## Staff revision demo ? 23 October 2026

Staff was added to the existing Group 3 database after a timestamped backup, without resetting its records. Account: `staff.group3@example.test`; initial demo password: `LocalDemo!2026` (existing passwords are preserved on rerun). Restart the chosen server before rehearsing. Login has no role/demo shortcut buttons.

Use Staff > bill intake > failed source > Prepare correction > reason > submit. Show that live values remain unchanged. As Manager, open Bills > Exceptions, authorize the proposal and check `applied`; then show the resulting bill in the correct Tenant account. For a valid original bill, processing remains automatic. Use a fresh failed test source for correction rehearsal; do not alter a confirmed payment merely to demonstrate an exception.

See [implementation handoff](staff-implementation-plan.md) and [manual acceptance cases](manual-test-guide.md). Gmail filter, real-device delivery and manuscript figure/PDF export remain separate manual checks.
