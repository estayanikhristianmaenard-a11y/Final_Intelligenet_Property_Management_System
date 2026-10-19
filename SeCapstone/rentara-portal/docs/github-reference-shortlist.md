# GitHub references for PropertyPro

Reviewed 14 October 2026. This is a research shortlist based on repository documentation, license files and selected source examples. The projects have not been run locally or fully audited. No external project code or new runtime dependency was installed during this review.

PropertyPro remains Node.js + SQLite + vanilla HTML/CSS/JavaScript. Adapt individual components and parsing patterns to the approved workflow: Manager confirmation for rent, personal unverified utility tracking, equal shared allocation, and exceptions before finalization.

## Recommended references

| Repository | Useful part | Fit and recommendation |
| --- | --- | --- |
| [Tabler](https://github.com/tabler/tabler) | Dashboard layouts, forms, tables, empty/error states and responsive navigation. [Live preview](https://preview.tabler.io/). | Best starting point for UI references. HTML/Bootstrap-based; adapt selected layouts to our existing CSS rather than introducing its entire stylesheet and plugin bundle. [MIT license](https://github.com/tabler/tabler/blob/dev/LICENSE). |
| [Parcelis](https://github.com/parcelis/parcelis) | Property/unit detail layouts, occupancy overview, tenant records and rent lists. Its README has screenshots and a demo link. | Good domain-specific visual reference. Its README explicitly says it is not production ready. [AGPL-3 licensing](https://github.com/parcelis/parcelis/blob/main/LICENSING.md): hold direct code copying until its obligations have been evaluated for our intended distribution/deployment. |
| [mohsin-rafique/property-management](https://github.com/mohsin-rafique/property-management) | Tenant portal screens, receipt layouts, linked property records and form validation presentation. | Laravel/Blade/Bootstrap project, so UI snippets require adaptation. Its roles, deposits and utility-receipt/submeter calculations differ from our scope. Treat its production-ready README claim as unverified. [MIT license](https://github.com/mohsin-rafique/property-management/blob/main/LICENSE). |
| [invoice2data](https://github.com/invoice-x/invoice2data) | Provider-specific templates, multiple field patterns, explicit date/number handling and required-field checks. | Strong reference for improving our utility parser. Python code must be translated into JavaScript; the deterministic template approach fits our study. Its optional AI fallback is outside our approved scope. [MIT license](https://github.com/invoice-x/invoice2data/blob/master/LICENSE.md). |
| [Tesseract.js](https://github.com/naptha/tesseract.js) | Node workers, worker reuse, progress logging and OCR settings. | Already used in our backend. Improve the existing integration using upstream examples. It does not accept PDF files directly. [Apache-2.0 license](https://github.com/naptha/tesseract.js/blob/master/LICENSE.md). |
| [Mozilla PDF.js](https://github.com/mozilla/pdf.js) | Direct PDF text extraction, page rendering and document previews. | Already used. The Node PDF-to-PNG example is a useful basis for a future scanned-PDF OCR fallback, with bounded page count/resolution and resource cleanup. That fallback is a candidate, not a verified implemented feature. [Apache-2.0 license](https://github.com/mozilla/pdf.js/blob/master/LICENSE). |
| [Nodemailer](https://github.com/nodemailer/nodemailer) and [MailParser](https://github.com/nodemailer/mailparser) | Outbound SMTP and inbound MIME bodies/attachments. | Both already used. Study upstream examples for transport errors, message bodies and attachment handling. Keep existing rent-only email scope and delivery-result logging. Nodemailer has an [MIT-0 license](https://github.com/nodemailer/nodemailer/blob/master/LICENSE); check the exact version/file license when copying MailParser source. |
| [FullCalendar](https://github.com/fullcalendar/fullcalendar) | Standard event calendar interactions and event selection. | Optional reference. Our small due-date calendar already fits the current task; only consider adoption if real usability problems justify the dependency. The standard project has an [MIT license](https://github.com/fullcalendar/fullcalendar/blob/main/LICENSE.md); premium plugins are separate. |

## Source examples worth inspecting next

- [invoice2data provider-template implementation](https://github.com/invoice-x/invoice2data/blob/master/src/invoice2data/extract/invoice_template.py): keyword matching, text normalization, field parsing and template options. Its floating-point amount handling should not replace our integer-centavo billing rules.
- [Tesseract.js Node recognition example](https://github.com/naptha/tesseract.js/blob/master/examples/node/recognize.js): create a worker, recognize an image, receive progress and terminate it. Retain our local language model configuration.
- [PDF.js Node PDF-to-PNG example](https://github.com/mozilla/pdf.js/blob/master/examples/node/pdf2png/pdf2png.mjs): render a page before passing the image to OCR. Check compatibility with our installed PDF.js version and Windows canvas support before adoption.
- [Tabler preview sources](https://github.com/tabler/tabler/tree/dev/preview): compare table, form, auth and dashboard patterns with our current role screens.

## Integration order

1. Compare Tabler and Parcelis screens, then select a small number of UI patterns that improve our actual Tenant/Manager tasks.
2. Improve `server/rules.js` using provider-specific parsing templates derived from supported Meralco/Manila Water samples. Record the source format and test the five required fields. A matching provider name alone must not finalize a bill.
3. Explore PDF.js rendering plus our existing Tesseract worker for scanned PDFs in `server/integrations.js`. Uncertain values must still enter review; OCR cannot recover masked account characters.
4. Refine existing SMTP/MIME handling with the official upstream examples. Preserve duplicate detection, ownership checks and accepted notification scope.

Before copying source, record the upstream file and commit/version, preserve the applicable copyright/license notices, adapt it to our stack and verify the affected workflow with our existing fixtures. Keep attribution for copied components in a project notice file when code is actually adopted. A capstone citation does not replace a software license notice.

Novu was also surveyed. Its notification platform is useful as an architectural reference, but introducing that platform would add unnecessary infrastructure for our existing portal + Web Push + rent email needs. It is not shortlisted for installation.

## Tabler live-design shortlist

Public examples checked on 14 October 2026. These are proposed reference designs; this research pass does not install Tabler or apply another UI redesign.

| Live example | PropertyPro application | What to adapt |
| --- | --- | --- |
| [Folded hover](https://preview.tabler.io/layout-folded-hover.html) | Shared desktop sidebar | Compact icon rail, expanded menu hierarchy and active-link treatment. Retain our role menus, keyboard access, phone drawer and chosen colours. |
| [Data grid](https://preview.tabler.io/datagrid.html) | Bill details and extracted-field review | Short labels paired with readable values, grouped sections and consistent spacing for provider, account, period, amount and due date. Highest-priority next detail-screen reference. |
| [Invoice](https://preview.tabler.io/invoice.html) | Confirmed rent receipt and print view | Document header, payer/property details, line items and aligned totals. Adapt to rent confirmation and original advance-credit receipt links. It must not issue utility receipts or imply provider verification. |
| [Settings](https://preview.tabler.io/settings.html) | Profile, password and notification preferences | Section navigation, grouped labels and a clear save area. Preserve existing supported preferences and roles. |
| [Activity](https://preview.tabler.io/activity.html) | Tenant alert feed and recent activity | Compact event rows with an icon, concise message and timestamp. Retain actual bill links, ownership and read/unread state. |
| [Tables](https://preview.tabler.io/tables.html) | Manager/Tenant billing lists | Divider-based rows, consistent action columns, readable amounts and statuses. Earlier passes already adapted related table patterns. |
| [Form elements](https://preview.tabler.io/form-elements.html) | Source correction and portfolio forms | Label/value alignment, helper text, select controls and validation presentation. Earlier passes already added inline workflow errors. |
| [Empty page](https://preview.tabler.io/empty.html) | No bills, no matches and unavailable records | A brief explanation and one relevant recovery action. Avoid decorative content that hides the actual task. |
| [Billing](https://preview.tabler.io/billing.html) | Optional compact Tenant bill-history list | Borrow the invoice-list layout only. The demo's subscriptions, saved cards and automatic charging are outside our approved workflow. |

Recommended next adaptation: Data grid for bill details, then Invoice for confirmed rent receipts. Use the folded-hover example as a visual comparison of our existing sidebar rather than replacing the current navigation behaviour. The examples use Tabler/Bootstrap classes; direct HTML copies need corresponding styles adapted to our current CSS. Preserve the applicable [MIT notices](https://github.com/tabler/tabler/blob/dev/LICENSE) when copying source.
