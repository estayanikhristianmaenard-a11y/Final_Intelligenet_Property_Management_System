# Tabler design adaptations

Updated 15 October 2026. These changes improve the existing Node.js, SQLite and vanilla HTML/CSS/JavaScript portal. They use selected Tabler presentation patterns with locally authored components and CSS. Tabler and Bootstrap are not installed, and no complete template replaces the application.

| Reference | PropertyPro adaptation |
| --- | --- |
| [Folded hover navigation](https://preview.tabler.io/layout-folded-hover.html) | Shared navigation styling, clear active destinations and compact icons across roles. Existing hover timing, keyboard access, mobile navigation and role restrictions remain connected. |
| [Data grid](https://preview.tabler.io/datagrid.html) | Bill details put amount, due date and status first; labelled fields, charge breakdowns, allocation notes and tracking history follow. Source-review fields use the same hierarchy beside the original document. |
| [Invoice](https://preview.tabler.io/invoice.html) | Confirmed rent receipts use a responsive, printable document layout. Original payment snapshots and receipt IDs are retained, including escaping of user-entered fields. Utilities do not receive rent receipts. |
| [Settings](https://preview.tabler.io/settings.html) | Clear section navigation, active indicators, grouped settings and consistent save areas. Tenant section scrolling respects reduced-motion preferences. |
| [Activity](https://preview.tabler.io/activity.html) | Portal notification rows distinguish title, message, unread state, timestamp and bill action. Repeated Web Push explanations are shortened without removing permission feedback. |
| [Tables](https://preview.tabler.io/tables.html) | Quiet headers, aligned numeric values, clear row actions and existing responsive layouts. |
| [Forms](https://preview.tabler.io/form-elements.html) | Existing labelled controls, inline errors, pending/save feedback and contextual helper text are retained in consistent groups. |
| [Empty states](https://preview.tabler.io/empty.html) | Compact icon, clear heading, brief explanation and relevant existing action. |

The main additions are `src/styles/tabler-patterns.css`, `src/features/billing/bill-details.js` and `server/receipt-view.js`. Notification and settings pages use their existing API actions. This pass does not add subscriptions, payment gateways, provider-payment confirmation or new billing rules.

Tabler is [MIT licensed](https://github.com/tabler/tabler/blob/dev/LICENSE), copyright 2018–2026 The Tabler Authors. These links acknowledge the design references. Any future copying of Tabler source or assets must retain its applicable license and copyright notice.

## Screenshot review follow-up — 16 October 2026

The follow-up retains the approved blue palette, black-and-white receipt document, slow shared sidebar hover and locked billing workflow. The [current PNG index](../../reports/mockups/README.md) includes additional Manager Units/Tenants/Reports screens, Admin audit/workspace screens, the mobile OCR editor and expanded mobile filters.

| Area | Improvement |
| --- | --- |
| Tenant home and login | Shorter mobile branding/greeting and tighter utility rows, with readable amounts and touch targets |
| Bill filters | Disclosure with active count, mobile collapsed default, filter/URL persistence and Reset filters |
| Receipts | Rent-cycle titles, shortened display references and full-reference Copy; original references remain in the protected document |
| Calendar | Today control, concise legend and expandable explanation; estimates still cover rent only |
| OCR review | Edit controls beside extracted values, missing-value styling, failed validation reasons, one-field correction/revalidation and retained history |
| Manager overview | One occupancy bar/count and labeled configured monthly rent |
| Notifications | Unread items first, readable complete dates and optional browser settings below the feed |
| Shared navigation | Accessible link names and a visible desktop workspace label |

Use the latest [QA report](qa-report.md) for final regression evidence and the [manual test guide](manual-test-guide.md) for real-device acceptance. PNGs establish appearance, not delivery, animation quality or accessibility conformance by themselves.

## Earlier verification checkpoint

All 50 automated checks passed in the final complete run, including Philippine-date urgency and service-state tests added in this pass. They cover role restrictions, billing and correction workflows, personal utility tracking, notification actions, browser navigation and responsive layouts. Receipt checks cover escaped text, the original payment snapshot, 320-pixel layout and print styling. Current mobile, tablet, Manager intake, property, OCR-review and Admin screenshots were visually inspected. Actual provider mailbox delivery and physical-device Web Push still require their configured acceptance checks. See [QA report](qa-report.md) for run details.

## Next improvements

1. Run a short usability session on actual phones: find a bill, report rent, mark a utility and open the receipt. Fix observed difficulties before further visual changes.
2. Validate extraction against authorized real Meralco and Manila Water documents. Synthetic fixtures establish pipeline behavior, not support for every provider format.
3. Test configured rent email and HTTPS Web Push delivery end to end, including failure and retry cases, while keeping portal alerts available.
4. Check larger realistic record sets before deciding whether server pagination or additional search controls are necessary.

## Review of current PNGs — 15 October 2026

All eight improvements below have now been applied. The observed-issue column records what the earlier screenshots showed; linked PNGs have since been refreshed. The review inspected desktop, tablet, phone, settings, intake and Admin captures and checked relevant markup. Screenshots establish appearance, not whether every interaction works.

| Priority | Earlier observed issue | Implemented direction |
| --- | --- | --- |
| High | [Utility intake](../../reports/mockups/03-billing-management.png) shows a failed/mapping-unresolved source beside a green 100% indicator. Code passes confidence 100 for direct PDF text extraction; it is not measured OCR accuracy. | Show Direct text extraction for readable PDFs; label actual image recognition confidence as an estimate. Separately show Needs review and the validation reason when appropriate. Do not present the default 100 as proof of correct billing fields. |
| High | [Phone home](../../reports/mockups/06-mobile-tenant.png) uses substantial height for the greeting and rent card; only the first utility is partly visible before scrolling. Tablet cards also stretch vertically. | Reduce internal empty space and greeting height. Preserve rent first, utility tracker directly below it, and the calendar after the tracker on narrow screens. Retain readable amounts and 44-pixel actions. |
| High | [Phone billing history](../../reports/mockups/11-tenant-bills-mobile.png) gives each record a large general table-to-card layout, including a receipt field for utilities. | Use compact bill cards: category, amount, due date, status, and one contextual action. Show receipt controls only where applicable; retain shared details and full references in View bill. |
| High | [Phone notifications](../../reports/mockups/12-tenant-alerts-mobile.png) repeats Web Push setup across a button, permission message and separate card before the feed. | Keep one concise device-status/setup area, then show saved alerts immediately. Offer Enable only when useful and retain actual permission feedback. Portal alerts must remain available independently. |
| Medium | [Tablet header](../../reports/mockups/14-tenant-tablet.png) has a menu and large search field but no visible Rentara wordmark. | Keep the approved logo/name visible at tablet widths and shorten or collapse search as space requires. Preserve the existing desktop and phone color choices. |
| Medium | Dates appear as 2026-10 or 2026-10-01 to 2026-10-15, with small secondary text and wrapped utility status badges. | Format display dates as October 2026 or Oct 1–15, 2026; add Due today/Overdue when derived from actual bill dates and status. Keep full approved status labels readable and stored dates unchanged. |
| Medium | [Admin health](../../reports/mockups/05-admin-dashboard.png) colors 4/7 operational green while several services require configuration. | Use an aggregate indicator reflecting the actual result. Distinguish Not configured, Unavailable/failed and Healthy rather than calling every optional unconfigured integration degraded. |
| Medium | Intake rows reserve a tall right-hand stack for download/review/correction. Property cards repeat building names and leave a blank decorative header band. | Use a tighter source summary with Review document as the clear action; keep secondary actions nearby. Simplify property headers without adding stock photography. |

Preserve the approved hover sidebar behavior. Improve spacing, status clarity and task visibility before adding effects, charts or additional modules. The demo shortcuts remain intentional for local demonstration; this review does not propose removing them.

The refreshed screenshot set now contains 30 portal/document PNGs, including desktop and mobile receipt-list spacing views and the independent Riverside workspace screens. `09-manager-bill-review.png` shows an actual synthetic bill image beside extracted fields. Added views cover the rent-report dialog, the payment register before/after Manager confirmation, desktop/phone receipts, an empty filter result, a deliberately paused loading response and a deliberately simulated recoverable API error. Manager confirmation still uses its existing payment-register action; no extra confirmation dialog or billing step was added. Email and icon PNGs are also regenerated by the same command.

Due today/Overdue labels use the Philippine calendar date and the received bill's actual due date. Paid rent, pending rent reports, zero balances and current-version self-marked utilities are excluded. Service health distinguishes Not configured, Not verified, Unavailable and Healthy; transport acceptance remains different from inbox/device delivery. The existing `status` API field remains operational/degraded, with a separate `healthState` for the more precise display.

## Follow-up: filtered external suggestions

The six accepted follow-ups are implemented: the utility disclaimer sits immediately below its heading; personal-mark buttons use the secondary outline style while rent reporting retains primary emphasis; Units has a door icon; read-only billing rules and editable mailbox settings occupy separate cards; the rules show their correct en dashes; and Admin home requests maintenance/account events through `scope=maintenance`.

The reminder description includes 9:00 AM Philippine time. Saving mailbox settings does not edit locked rules or configure Gmail credentials. Filtering the maintenance summary happens before its six-record limit; the authorized full audit remains available and its records are retained. New calendar dashboards, extra receipt navigation, optimistic financial status updates and account-email renaming were not adopted.


## Calendar and motion follow-up

The user selected estimated rent only. Next month uses the original rental anniversary with short-month fallback and known end-date checks, without creating charges or predicted amounts. Utility dates remain actual received/validated dates. House, lightning and drop markers identify categories, multiple categories can share a date, and selected details show the source provider when known. The provider is derived on read, not duplicated in stored bill records.

Existing button, skeleton and dialog-entry motion was retained. User-dismissed dialogs now have a short exit; successful Home utility tracking has a brief badge highlight only after saving; calendar details use a small fade. Reduced-motion support and the approved sidebar timing remain intact. Current previews include phone/desktop next-month calendar views.


## Receipt viewing

View receipt opens the existing ownership-protected receipt inside a sandboxed frame, without an automatic download. Tenant Home, bill/history receipt lists, the Manager payment register and Tenant payment panel offer the action. The original printable HTML layout and payment snapshot are retained; Print targets that document and Download is optional. Preview URLs are revoked on close, authentication tokens are never put in the URL, and a changed sign-in discards an in-flight preview response. No payment, receipt or provider-settlement verification is created by viewing.

## Workflow simplification — 15 October 2026

- Incoming utility cards now offer one **Review bill** action. It reuses the same protected source-and-correction screen reached from the Exception Queue. Original download and extracted text are inside the review. Cancel/Close saves nothing; **Save correction** still requires a reason and revalidation. No automatic approval was introduced.
- Tenant rent reports hide, disable and clear the reference field for Cash. Bank transfer and E-wallet require it before submission, with backend validation retained.
- Paid bill rows retain receipt access. The separate **Receipt history** archive starts collapsed and can be expanded without changing any payment records.
- Manager read-only **Billing rules** are collapsible; editable mailbox settings remain visible separately.
- The secondary **Check rent cycles** action preserves the automatic scheduler and generates only eligible missing cycles. Intake sync, upload and cycle checking have stable action identifiers. These toolbar actions are disabled while billing data loads.
- Existing receipt, correction, allocation, history and authorization rules remain unchanged. No dependencies or database fields were added.
