# Fresh manual-test assets

Prepared 2 November 2026. All files here are synthetic test documents; they do not request actual payment. The dates deliberately use later non-overlapping periods. They are controlled fixtures, not forecasts or real provider-origin bills.

| ID | File or location | Required mapping | Expected result |
| --- | --- | --- | --- |
| A01 | a01-unit-a-electricity-scan.pdf | Group 3: Meralco / G3000101 -> G3-A | PHP 1,000.01, 2026-12-01 to 2026-12-14, due 2026-12-20; two shares PHP 500.00 and PHP 500.01 |
| A01 alternate | a01-unit-a-electricity-image.png | Same mapping and period | Same bill as A01 PDF; upload after PDF only for duplicate prevention, not another independent sample |
| A02 | a02-unit-b-water-digital.pdf | Group 3: Manila Water / G3W0102 -> G3-B | PHP 321.45, 2026-12-01 to 2026-12-14, due 2026-12-20; one PHP 321.45 charge |
| A03 | a03-unit-a-email-body.txt | Group 3: Meralco / G3000101 -> G3-A | PHP 900, 2027-01-01 to 2027-01-14, due 2027-01-20; PHP 450 each |
| A04 | a04-unit-b-email-body.txt | Group 3: Manila Water / G3W0102 -> G3-B | PHP 280, 2027-01-01 to 2027-01-14, due 2027-01-20; one PHP 280 charge |
| A05 | a05-unmapped-account.pdf | Deliberately absent | Full unmapped reference; hold for review, no arbitrary Tenant charge |
| A06 | a06-masked-account.pdf | Never invent missing digits | Masked account; hold for review, no automatic similar-digit match |
| A07 | a07-not-a-bill.txt | None | Unsupported browser bill input; no valid bill or charge |
| A08 | Existing Bayan staged Meralco source in Bills & Payments > Exceptions | Bayan B-101 mapping already prepared | Original shows 2026-12-20; PHP 600 becomes PHP 300 each only after Staff proposal and Manager authorization |

A08 is not an attachment in this folder. It is already prepared in the existing Bayan workspace. Its unreadable extracted date is deliberately staged; it does not demonstrate an actual OCR failure. If the case is already applied/rejected, record it and obtain a fresh controlled case before another decision round. Preparation commands do not reset decided cases.

For A03/A04, copy SUBJECT to Gmail's subject field and only the marked body to its body. Send to rentara2026@gmail.com through the agreed Group 3 exercise. Do not attach the TXT, original EML, workbook or ZIP. Confirm the Gmail filter applies Rentara-Group3-Demo automatically. These cases test body parsing, not OCR. Register phone Push before creating the event if checking actual Push delivery.

The full test mappings above and the absence of December/January source periods were checked read-only against the prepared Group 3 portfolio on 2 November. Occupancy/mappings can later change; verify them before testing. Do not import the inputs into a different workspace and expect the same assignment.

manifest.json records verification in a disposable portfolio using the real extraction and billing functions: scanned-PDF OCR, digital PDF text, two email-body cases, two held cases and repeated A01 input. No Gmail connection, real sending or working database mutation occurred. These fixture checks do not fill any manual Passed cells and are not representative OCR accuracy results.

Run `node tools/build-final-test-assets.mjs` from rentara-portal only to reproduce these files and their isolated verification. Reproduction does not make a consumed bill fresh: it retains the same account/period and duplicate protections. Actual provider-format and encrypted-PDF tests require separately consented private samples; they are not fabricated in this folder. Rent reporting uses existing unpaid demo rent; advance/changed-context cases require the workbook's dedicated prerequisites.
