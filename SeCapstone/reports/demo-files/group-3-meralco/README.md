# Actual-layout Meralco demonstration in the Group 3 portal

## Two-unit file selection

| Unit | File | Dummy CAN | Expected charge |
| --- | --- | --- | --- |
| G3-A | `meralco-anonymized-scan.pdf` | 9990000001 | William PHP 783.59; Khristian PHP 783.58 |
| G3-B | `unit-b-meralco-synthetic-scan.pdf` | 9990000002 | Jullian PHP 1,567.17, no charge to Unit A |

**Unit B is an explicitly synthetic derivative of the same anonymized source, not a second independently collected Meralco bill.** Its first-page image has a visible variant label and all occurrences of the dummy CAN replaced before creating an image-only PDF. The total's unrenderable source peso glyph is replaced with the equivalent PHP prefix. Amount and dates remain the same. Neither the original private SOA nor the Unit A fixture was changed.

For Unit B, email its PDF with subject **Group 3 Demo - Unit B Meralco**, apply **Rentara-Group3-Demo**, then use the same Manager Sync intake action or periodic check. Sign in as Jullian afterward. His synthetic occupancy/lease dates were also aligned to September 1 with a backup and audit record; September test rent is generated normally. No presentation utility bill is pre-imported by preparation. The separate `verification-unit-b.json` records OCR, routing, portal alert and duplicate checks. Developer command: `node tools/prepare-meralco-group-demo.mjs --unit-b`.

The following original guide describes Unit A.

Use **meralco-anonymized-scan.pdf**. It is the existing anonymized actual-layout SOA scan, copied without changing its amount or dates. The original private SOA is not read, sent, modified or included. The invented CAN 9990000001 is for testing only and must never be used for payment.

This uses the same Group 3 server on **https://localhost:8444/**, not a second portal. The two sample Unit A occupancy/lease starts were aligned to **1 September 2026** in a backed-up, audited development-fixture migration. Existing bills and member logins are preserved. September test rent also becomes eligible and is generated under the normal rent rules. This migration is not an application feature for changing actual billed lease starts; the normal Manager restriction remains intact. The preparation refuses Unit A records with payments, receipts or credits.

## Demonstration

1. Keep `npm.cmd run demo:group -- --receive` running. Use Chrome/Edge on the laptop or the same laptop IP with port 8444 on phones.
2. From your personal email, send to **rentara2026@gmail.com**. Subject: **Group 3 Demo - Actual-layout Meralco**. Attach only **meralco-anonymized-scan.pdf**.
3. In the property Gmail, apply **Rentara-Group3-Demo** to the received email. An automatic Gmail filter has not been configured by this tool.
4. Manager > Bills & Payments > **Sync intake**, or wait for the periodic check. The image-only PDF goes through actual OCR and then field parsing and validation.
5. Check provider Meralco, test CAN 9990000001, amount **PHP 1,567.17**, due **8 October 2026**, period **27 August-26 September 2026**, mapped to **G3-A**.
6. Open William's and Khristian's accounts separately. Each should see one electricity charge, totalling **PHP 783.59 + PHP 783.58 = PHP 1,567.17**, and their own portal alert. `verification.json` identifies which member receives the extra centavo. Jullian in G3-B must not receive this charge.

The October 8 due date is retained from the source bill, so it is already past due on October 22. That is expected; the demo does not change actual utility dates or send retrospective reminders. Utility tracking is personal only; no utility receipt or rent-email notice is created.

The preparation tests a clone of the current Group 3 database through the real email parser and OCR. It does **not** pre-import the Meralco bill into the presentation portfolio or send email. Re-importing the same bill afterward should enter duplicate review, not create another charge. This is one anonymized source and does not establish representative Meralco accuracy or genuine provider-email delivery.

Developer command: `node tools/prepare-meralco-group-demo.mjs`. Backup location: `rentara-portal/data/group-demo-reset-backups/`. Successful prepared shares and checks are recorded in `verification.json`.
