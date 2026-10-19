# Utility-bill journey verification

Local verification, 14 October 2026. All automated work uses isolated databases and synthetic fixtures. No live mailbox, email delivery, or working Tenant records were changed.

The complete suite passed **44 tests**, including the new utility journey and email-body regression. The HTML-body extension was also checked with a focused backend run.

## Implemented improvements

- Email intake now accepts recognized provider billing summaries in plain-text or HTML email bodies when the email has no attachments. Attachments retain priority to avoid processing both copies in one email. Ordinary provider announcements are ignored. Extracted body values go through the existing validation, account mapping, allocation and duplicate checks.
- Uploads show extraction progress and prevent repeat clicks. Review-required results explain where to go next. Successful results explain that the finalized bill is available to Tenants.
- Review shows the original source beside the five target fields. Billing period is one summary field; start/end dates remain separately editable. Correction fields have readable labels.
- New bill alerts identify rent, electricity or water. A **View bill** action opens authorized details directly from the Tenant notification feed.

## End-to-end evidence

| Journey | Evidence |
| --- | --- |
| Shared electricity upload | Actual digital PDF is uploaded through the Manager interface on a 390px viewport. An unmapped account enters review and generates no Tenant bills. |
| Correction and finalization | Manager previews the PDF, corrects the account and records a reason. Revalidation produces three Tenant bills; allocated centavos total the 100.01 source charge. Correction history is retained. |
| Tenant access | Electricity appears beneath rent, its actual due date is highlighted in the calendar, and its bill appears in history and portal alerts. View bill opens details from the alert. |
| Personal tracking | Mark and undo work. Another Tenant's share is unchanged, access to their mark is rejected, rent statuses remain unchanged and no receipt is created. |
| Duplicate intake | The same provider/account/period received as an email attachment is held for review without generating another set of bills. |
| Image OCR | A real clear PNG goes through bundled Tesseract recognition without a stub; the known account MER-12345 and amount 100.00 are extracted and validated into three shared bills. |
| Individual water | A separately configured individual unit receives one 220.00 water bill, with no split. Its Tenant sees Water in the personal tracker and can mark it personally paid without a receipt. |
| Email body | A recognized synthetic body summary finalizes through the normal shared-bill path. An attachment copy is held, unrelated provider mail is ignored, and a masked/unmapped account stays in review without inferring hidden characters. |

The browser journey is `tests/utility-journey.browser.test.js`; backend summary checks are in `tests/backend.test.js`. Source preview/correction, reminder eligibility and additional duplicate/financial-history checks remain in the existing regression suites.

## Try it manually

Use the [sample kit](../../samples/utility-bills/README.md) in a demo database. Configure the stated account mapping, upload a PDF/image, review any exceptions, then sign in as its Tenant. The generated `.eml` files are developer fixtures for the email parser, not browser bill uploads. Generate fresh dates using `node tools/generate-utility-samples.mjs`.

## Remaining external checks

Synthetic clear fixtures do not establish accuracy on all real Meralco or Manila Water layouts or handwritten/damaged bills. Bounded scanned-PDF rendering and OCR have since been added and tested; see [Tenant/parsing/OCR update](TENANT_PARSING_OCR_UPDATE.md) for the current limits and 46-test verification. Missing, unsupported or uncertain values must stay in review.

Still required: owner-authorized real bill samples with known correct values, genuine property-mailbox retrieval, and supported phone Web Push over HTTPS. A masked account cannot be reconstructed. Provider apps are not accessed, utility settlement is not verified, and no system-issued utility receipt is created. No future utility due date is predicted.
