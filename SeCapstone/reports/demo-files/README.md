# Demo bill files

For the anonymized actual-layout Meralco scan in the **same Group 3 portal**, use [the Unit A Meralco guide](group-3-meralco/README.md). This preserves the source dates and maps its dummy CAN to the two Unit A demo Tenants.

For a quick practice with just one Tenant, use [the single-Tenant scanned water bill and guide](single-tenant-practice/README.md). It routes PHP 275.50 to Jullian in G3-B only, independently of the two electricity cases.

For the current two-unit, three-member phone/email demonstration, use the separate [Group 3 bill pack and steps](group-3/README.md), or transfer [the phone ZIP](group-3-phone-bills.zip). It has new account references and a separate portfolio on HTTPS port 8444. The older generic sample bundle below is not the Group 3 portfolio.

All files are test copies. No original private bill or credentials are included. An anonymized bill remains a test representation, not a payment document.

## Demo order

1. Use a separate test workspace/portfolio. Set verified test account mappings and eligible Tenant occupancy before upload.
2. Upload synthetic/water-001/bill-digital.pdf to show direct PDF text extraction if not already imported.
3. Upload synthetic/unmapped-account-001/bill-digital.pdf to show an unmapped-account exception. Resolve the test mapping through Manager review.
4. Upload anonymized/meralco-001/bill-scanned.pdf to show OCR. Compare with bill-digital.pdf; importing the same case again should enter duplicate review.
5. Use synthetic/electricity-001/email-attachment.eml or email-summary.eml for developer email-parser verification. EML files are NOT accepted browser bill uploads. Do not upload EML through Upload source.

In the existing acceptance portfolio, meralco-001 and electricity-001 were already imported during setup/testing. Expect duplicate review there. Renaming or copying a file must not bypass duplicates. For first-time bill finalization, use a fresh isolated test workspace with matching mappings. Do not reset working data.

## Expected test accounts and amounts

- meralco-001: Meralco; account 9990000001; PHP 1567.17; due 2026-10-08; period 2026-08-27 to 2026-09-26.
- electricity-001: Meralco; account TEST-MERALCO-001; PHP 100.01; due 2026-10-18; period 2026-10-01 to 2026-10-14.
- water-001: Manila Water; account TEST-WATER-001; PHP 220.00; due 2026-10-18; period 2026-10-01 to 2026-10-14.
- unmapped-account-001: Meralco; account TEST-UNMAPPED-999; PHP 100.01; due 2026-10-18; period 2026-10-01 to 2026-10-14.

Account TEST-UNMAPPED-999 is deliberately unmapped for the exception demo. Meralco-001 requires occupancy covering its August-September 2026 bill period. Rent confirmation and receipts use existing portal records; these utility files do not authorize rent confirmation or utility receipts.

Actual Gmail retrieval in acceptance uses the dedicated Rentara-Utility-Acceptance label. External emails/Push need configured connectivity and permissions. A local parser file check is not evidence of a provider email arriving or a phone receiving Push.

This bundle contains one anonymized actual-layout source and three synthetic bill cases. Alternative formats and this ZIP do not add independent real bills.
