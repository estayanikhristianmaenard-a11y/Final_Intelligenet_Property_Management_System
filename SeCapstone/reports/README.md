# Rentara reports and visual assets

| Folder | Purpose |
| --- | --- |
| [mockups](mockups/README.md) | Current PNGs captured from the implemented portal, with synthetic records and capture metadata. |
| [email-previews](email-previews) | Current HTML, plain-text and PNG versions of the three rent email notices. No email is sent by generating these. |
| [branding/icon-options](branding/icon-options/preview.html) | Original icon options; option 02 is selected and implemented. Runtime favicon and brand component are in the application `src`. |
| consultations | Consultation records. |
| [updates](updates/README.md) | Current Report 4 source/exports, with older checkpoints archived separately. |
| [archive](archive/README.md) | Earlier design concepts and the superseded mockup PDF. |

From `SeCapstone/rentara-portal`, run `npm.cmd run previews:refresh` to regenerate all current UI, email and icon-comparison PNGs. It uses a temporary synthetic database and its own server on port 8113. It does not load `.env`, change the working database or send notifications. Microsoft Edge is used on Windows; `BROWSER_EXECUTABLE` can select another Chromium executable.

OCR fixture images are input documents, so they stay unchanged. Archived images preserve the historical design rather than being relabelled as current screenshots.

The current set includes the open OCR review and rent-report dialog, payment register before/after confirmation, rent receipts, and empty/loading/error states. Loading and error captures use explicitly controlled browser responses; they are examples of recovery UI, not claims that the running backend failed. The image reviewed in the OCR capture is a synthetic test document with an older billing period and intentionally remains in review in the current showcase occupancy.
