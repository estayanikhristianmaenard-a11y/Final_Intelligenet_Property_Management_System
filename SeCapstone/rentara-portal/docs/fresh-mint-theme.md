# Fresh Mint interface

The user approved implementing the cream, mint and deep-green concept on 1 November 2026, with the existing functions preserved. This approval supersedes the earlier deferred visual-concept status; it does not authorize new research modules or billing rules.

The [approved visual reference](../../reports/design-concepts/fresh-mint-approved.png) is retained alongside the implemented screenshot gallery. Its illustrative sample dates/amounts are not a specification to change live billing records.

## Design

- Cream canvas (`#f8f7f1`), deep-green navigation/text (`#153e35`) and mint highlights (`#c8f0da`). Status colors still distinguish pending, error and confirmed states with text labels.
- Bold sans-serif headings, rounded cards, clear primary buttons and visible desktop navigation labels. Mobile retains the existing menu drawer and Tenant bottom navigation.
- Tenant Home follows the approved composition: friendly greeting, property/unit label, rent card, distinct personal utility cards, calendar and rent payment history. Actual amounts, due dates, status text and eligible actions come from the existing APIs.
- Apartment and plant SVG illustrations are decorative, local assets. The existing Rentara brand mark is preserved; its favicon background follows the new palette.
- Manager, Staff and Admin screens use the same surfaces, typography, forms, panels and controls. Login uses the same identity. The topbar avatar is an identity label; account actions remain in the existing Settings/Account pages.

## Implementation

`src/styles/fresh-mint.css` is the final theme layer after the existing stylesheets. It overrides presentation tokens and components while keeping route, API, data attributes and event handling in their existing modules. SVGs live in `src/assets/mint-apartments.svg` and `src/assets/mint-plant.svg`. No font download, UI framework or additional package is required.

Tenant rent reporting, Manager confirmation, utility personal marks, calendar rules, correction proposals, role/workspace isolation and monochrome receipts retain their existing rules. The illustration and sample figures in the approved concept do not replace working records. Backend code, database schemas, live configuration and credentials were not modified for this theme.

## Checking the result

Start the intended profile normally and hard-refresh the browser (`Ctrl+Shift+R`) to reload the styles and modules. Do not recreate/reset the portfolio for a visual update.

The existing page audit checks named controls, phone tap sizes, page overflow and browser errors at 1440, 820, 390 and 320 px. Its appearance assertions now expect cream topbars. The route/session test now expects readable expanded desktop navigation and still checks keyboard navigation, phone menu behavior, logout and role changes. These replace assertions tied to the superseded blue/rail presentation.

Current screenshots are in [the preview gallery](../../reports/mockups/README.md), generated with disposable synthetic records using `npm.cmd run previews:refresh`. Verification outcomes and log paths are in [QA evidence](qa-report.md). Actual phones and external notification delivery remain separate acceptance work.
