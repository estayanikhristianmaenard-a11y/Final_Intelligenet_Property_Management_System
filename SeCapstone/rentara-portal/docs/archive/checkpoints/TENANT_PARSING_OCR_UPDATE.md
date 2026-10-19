# Tenant billing, parsing and scanned-PDF update

Implemented in the existing Node.js + SQLite + HTML/CSS/JavaScript application. This extends the current workflow without replacing the backend or introducing an AI extraction service.

## Tenant billing UX

Month, category and status filters stay together and persist in the URL across reloads. Local filter changes reuse loaded data and restore keyboard focus. Utility filters now check personal tracking status rather than rent payment status. Rent reporting and receipt download actions sit beside their relevant bills. Utilities show personal, unverified tracking and no applicable system receipt. Changed utility bills offer confirmation of the personal mark. Empty lists distinguish unavailable bills from zero filter matches; a load failure offers Try again.

The Tenant Home layout remains rent first, with the utility tracker directly below it and the billing calendar available on desktop and phones.

## Labelled provider templates

`server/utility-templates.js` contains provider selectors and explicit account-label patterns. `server/rules.js` retains validation/conflict reporting and records the chosen template identifier with the intake record. This is a locally authored adaptation of the deterministic template approach illustrated by [invoice2data](https://github.com/invoice-x/invoice2data), not installation of its Python library or AI fallback.

The Meralco summary pattern covers the labels supplied by the user: Customer Account Number (CAN), Current Amount Due with PHP, English-month billing-period endpoints, and Due Date. CAN is treated as a string, preserving leading zeroes. SIN is not substituted for CAN. Masked identifiers stay as printed and require review; hidden characters are never inferred. Multiple/conflicting identifiers, malformed amounts and invalid dates remain blocked by validation. Configured account mappings and eligible recipients are still required before finalization.

Manila Water and Maynilad templates cover selected simple labelled fixtures. This does not establish support for every real provider PDF, email or app layout; representative documents still require acceptance checks.

## Scanned PDFs

Digital pages continue to use direct text extraction. Pages without usable digital text are rendered temporarily through PDF.js and passed to the existing local Tesseract worker. Rendering follows the API demonstrated in Mozilla's [Node PDF-to-PNG example](https://github.com/mozilla/pdf.js/blob/master/examples/node/pdf2png/pdf2png.mjs). PDF.js retains its Apache-2.0 licensing through the existing dependency.

Limits: 50 total PDF pages, at most 3 OCR pages, render scale 2, no more than 4096 pixels per side or 8 million rendered pixels per page. PDF image decoding is capped at 16 million pixels. Page/canvas resources are released, and rendered images are not saved as duplicate source files. Existing attachment limits, OCR confidence checks, validation, duplicate handling, allocation and correction history remain active. Missing optional canvas support, unreadable/encrypted PDFs and unsupported layouts require review. Local success does not establish readiness on every hosting environment.

The source record retains its extraction method and scanned-page count. No new table or duplicate bill storage was added.

## Verification and manual sample

The full suite passed 46 tests with zero failures. Added checks cover Meralco's labelled summary, masked/conflicting identifiers, real image-only PDF recognition, cross-format duplicate prevention, oversized render rejection, the 3-page OCR cap, Tenant utility-status filters, filter persistence and focus recovery. The all-role layout audit also passed at 1440px, 820px, 390px and 320px.

The notification upload fixture now waits for and verifies the actual HTTP upload response before checking dialog completion, so concurrent PDF/OCR test load is not mistaken for an immediate upload failure.

Try [bill-scanned.pdf](../../samples/utility-bills/synthetic/electricity-002/bill-scanned.pdf) using Manager Upload source in a demo database. It is synthetic: Meralco account MER-12345, amount 100.00, February 2026 period, due 5 March 2026. A matching account mapping and February occupancy are necessary for finalization; otherwise review is expected. It represents the same bill as the clear PNG fixture and should be held as a duplicate if that fixture has already finalized.

Working database records and Git remotes were not changed. Restart the running backend to load the new parser/OCR code, then hard-refresh the portal for the UI changes.
