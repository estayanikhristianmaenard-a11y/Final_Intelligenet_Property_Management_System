# UI and functional audit

Reviewed 14 October 2026 using the project-local Taste guide and the existing Node/SQLite application. Changes remain local; no Git push was made.

## Screens inspected

All 14 routed role pages were rendered at 1440px, 820px, 390px and 320px widths. Additional billing tabs bring the automated sweep to 72 page states. All four Manager settings sections were also opened at each width. The sweep checks page overflow, browser exceptions, unnamed buttons and visible phone button heights. It also checks the blue-gray desktop header, blue mobile/tablet header and Tenant-only bottom navigation. Screenshots were inspected for Tenant settings, Manager billing/settings and Admin accounts. This does not constitute a full accessibility certification or testing on every physical device.

| Role | Pages | Functional evidence |
| --- | --- | --- |
| Admin | Dashboard, audit, accounts/settings | Existing browser and backend tests exercise account creation, account access controls, password resets/suspension and last-Admin protection. Layout sweep verifies the displayed screens and named controls. |
| Manager | Dashboard, properties, units, tenants, billing/intake/review/payments, reports, settings | Existing tests cover portfolio forms, mappings, source preview/correction, rent generation/report/confirmation, direct rent recording, receipts, settings and protected records. The sweep opens every billing tab and settings section. |
| Tenant | Home, bills/history, alerts/inbox, settings | Existing tests cover rent reporting, utility marks/undo, filters, receipts, read alerts, profile/preferences/password changes, mobile navigation and session recovery. Additional tests cover bill-row mouse/keyboard activation and dialog focus. |

## Improvements applied

- Kept the existing system font stack for consistent rendering without extra downloads. Body text is 15px, card headings 18px, secondary card text 14px, and small metadata at least 12px through shared tokens. Page headings retain the existing responsive scale.
- Phone form text is 16px. Billing tabs, settings navigation, calendar dates and preference switches have at least 44px vertical targets. Switches keep a compact visual track inside the larger target.
- Manager/Admin data tables become labeled cards on phones so actions remain reachable without horizontal table scrolling. Permission comparison matrices keep their table layout. Billing summary tiles use two columns on phones.
- Retained full receipt identifiers with wrapping, visible focus indicators, reduced-motion handling and the approved sidebar animation.
- Replaced repeated Manager summary cards and the second “Needs attention” panel with one review queue for rent reports, utility intake and exceptions, followed by compact portfolio figures.
- Removed the Admin dashboard's static role-count tile and repeated scope notice while keeping working maintenance actions.
- Set sidebar expansion to 420ms with shorter label fades; button and dialog feedback remain brief, and reduced-motion preferences disable transitions.
- Shortened the Tenant SMS-unavailable explanation.
- Fixed a save-refresh race: after a user navigates away, a delayed completion callback can no longer navigate back to its previous page. Refreshing the current page retains its current filters/tab.

## Verification and limits

The full suite passed 44 tests after the dashboard and motion refinements. The layout sweep and main browser workflow suite passed with the revised Manager queue and navigation timing.

The inventory covers rendered controls and the tests cover the listed workflows. It is not a claim that every possible button/data combination or destructive action was individually exercised. Empty demo lists hide controls that only appear with additional records; populated workflow tests cover several of these cases separately.

Actual SMTP inbox delivery, real provider mailbox retrieval and phone Web Push over HTTPS still require configured services and live-device checks. Demo/test credentials and isolated databases were used; real tenant records were not changed.

Run `npm test` for the complete suite or `npm run test:browser` for browser checks. Set `UI_AUDIT_OUTPUT` to a local directory when running `tests/ui-audit.browser.test.js` to save screenshots and a control inventory.
