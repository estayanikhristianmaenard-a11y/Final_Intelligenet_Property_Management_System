# Utility-bill samples

Samples are grouped by origin and unique bill case. Different files inside one case folder are representations of the **same bill**, not additional independent samples.

There are **five distinct bill cases**: one anonymized actual-layout Meralco bill and four synthetic cases. There are nine input files in total. Synthetic cases are development fixtures and do not increase the number of independently collected provider bills.

Each case folder also includes `case.json`, which records its origin, expected billing fields, expected outcome, file versions and duplicate behavior. Read that record before setting up a mapping or comparing extraction results. These are fixture expectations, not an overall OCR accuracy result. The nine-file count excludes these metadata records and this guide.

## Folder structure

```text
utility-bills/
  README.md
  anonymized/
    meralco-001/
      bill-digital.pdf
      bill-scanned.pdf
  synthetic/
    electricity-001/
      bill-digital.pdf
      email-attachment.eml
      email-summary.eml
    electricity-002/
      bill-image.png
      bill-scanned.pdf
    water-001/
      bill-digital.pdf
    unmapped-account-001/
      bill-digital.pdf
```

## Choose a case

| Case | Source | Intended check |
| --- | --- | --- |
| [meralco-001](anonymized/meralco-001/) | One anonymized actual-layout bill | Compare digital text extraction and scanned-PDF OCR; hold the second representation as a duplicate |
| [electricity-001](synthetic/electricity-001/) | Synthetic Meralco bill; account `TEST-MERALCO-001`, amount 100.01 | Compare PDF upload, email attachment and email-body summary; prevent repeated charges for the same bill |
| [electricity-002](synthetic/electricity-002/) | Synthetic image bill; account `MER-12345`, amount 100.00 | Compare PNG OCR with scanned-PDF OCR; February 2026 period, due 5 March 2026 |
| [water-001](synthetic/water-001/) | Synthetic Manila Water bill; account `TEST-WATER-001`, amount 220.00 | Digital PDF extraction for a different provider |
| [unmapped-account-001](synthetic/unmapped-account-001/) | Synthetic bill; account `TEST-UNMAPPED-999` | Exception Queue review and correction of account mapping |

## Naming and regeneration

Use lowercase, hyphen-separated case IDs. Keep versions of the same bill together. A newly collected independent bill receives a new case ID; a scan, email copy or rotated version stays with its original case. Do not rename an actual bill as synthetic or count variants as independent provider samples.

Regenerate the simple synthetic fixtures from the portal directory:

```powershell
node tools/generate-utility-samples.mjs
```

The generator writes only the four `synthetic/` cases and their `case.json` records. It updates the dates of the generated digital bills, email representations and expected values together, retains the fixed OCR image case, and does not recreate or modify anonymized bills, change the database, or send email. Files inside each case continue to describe the same bill after generation.

## Manual use

Configure the matching provider/account in Manager Settings -> Mappings and assign it to a unit with eligible tenants. Use shared occupancy for split charges or an individual arrangement for a single full charge. Upload through Bills & Payments -> Upload source, using a demo database for invented billing records.

The fixed image/scanned case requires occupancy covering its February 2026 period. Otherwise review is expected instead of assigning the bill to current occupants. The same provider, account and billing period must not create another charge when received in a different format or through email.

An `.eml` file is a developer fixture, not an accepted browser bill upload. The browser accepts PDF, PNG and JPEG. Tests pass raw `.eml` contents to the email parser without connecting to a live mailbox.

## Anonymized actual-layout Meralco SOA

The two files under `anonymized/meralco-001/` are **test copies, not valid payment documents**. Customer name/address, CAN, meter/service identifiers, invoice/reference/print-sequence numbers, payment history and payment codes were removed or replaced. Personal identifiers are removed from underlying PDF content, not merely covered by an overlay. Metadata, attachments, annotations and links were cleared. The raster copy contains only rendered redacted pixels. The original private `SeCapstone/SOA.pdf` remains unchanged and is excluded from Git along with local working files.

The original amount and dates remain for extraction comparison: provider **Meralco**, dummy account **9990000001**, amount **1567.17**, due **2026-10-08**, period **2026-08-27 to 2026-09-26**. The account is invented and must never be used for payment. A demo-only mapping and assignments covering the period end are required to finalize a manual upload. Do not import the original bill into a demonstration database.

Run `node --test tests/meralco-soa.test.js` for isolated real extraction/OCR, validation, three-tenant allocation and duplicate prevention. Both representations describe the same source bill: importing both should hold the second as a duplicate. Parser regressions also cover conflicting dates/periods and masked accounts without substituting SIN.

This is **one real-layout source and two test representations**, not two independently collected bills. Additional rotations, altered values or copies are synthetic robustness cases and must not inflate the real-document sample size or an accuracy claim. Collect more authorized independent bills for broader provider acceptance. Do not rerun the simple sample generator expecting it to recreate or modify these redacted SOA fixtures.

For a complete isolated test, run `node --test tests/utility-journey.browser.test.js`. It tests upload, account correction, shared totals, calendar/history/alerts, mark/undo, ownership protection, duplicates across intake paths and actual image OCR, without changing your working database.
