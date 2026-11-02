# Fresh Mint interface

The user approved implementing the cream, mint and deep-green concept on 1 November 2026, with the existing functions preserved. This approval supersedes the earlier deferred visual-concept status; it does not authorize new research modules or billing rules.

The [approved visual reference](../../reports/design-concepts/fresh-mint-approved.png) is retained alongside the implemented screenshot gallery. Its illustrative sample dates/amounts are not a specification to change live billing records.

## Design

- Cream canvas (`#f8f7f1`), deep-green navigation/text (`#153e35`) and mint highlights (`#c8f0da`). Status colors still distinguish pending, error and confirmed states with text labels.
- Bold sans-serif headings, rounded cards, clear primary buttons and visible desktop navigation labels. Mobile retains the existing menu drawer and Tenant bottom navigation.
- Tenant Home follows the approved composition: friendly greeting, property/unit label, rent card, distinct personal utility cards, calendar and rent payment history. Actual amounts, due dates, status text and eligible actions come from the existing APIs.
- Apartment and plant SVG illustrations are decorative, local assets. The existing Rentara brand mark is preserved; its favicon background follows the new palette.
- The sidebar plant is shared by **all roles**, not restricted to Tenant accounts. It occupies a separate flexible area above the footer, keeping navigation scrollable and logout accessible on short screens. The decorative arch and orbit use the same botanical palette.
- Manager, Staff and Admin dashboards share an illustrated workspace header. Other pages use coordinated framed headings, subtle botanical outlines, navigation icon tiles, card accents, filters and panel surfaces. Tenant Home retains its existing illustrated greeting. These details add no new business actions or records.
- Manager, Staff and Admin screens use the same surfaces, typography, forms, panels and controls. Login uses the same identity. The topbar avatar is an identity label; account actions remain in the existing Settings/Account pages.

## Expressive design revision

The later user request for more design led to a stronger composition within Fresh Mint: dark forest dashboard banners, larger headings, separately tinted summary/queue cards, illustrated property cards and a framed Tenant greeting. Staff uses a bill-review desk illustration and Admin uses a house/key illustration; Manager retains the apartment scene. Decorative property artwork has apartment, townhouse and courtyard variants on sage, sand and clay backgrounds. These illustrations are not actual property photographs.

Rent cards use paper-like dashed separators and a calendar sticker; utility cards have distinct restrained category accents. Billing history rows, receipt archives, empty states and login surfaces follow the same paper/card treatment. All real figures, dates, labels, links and data-action bindings remain in their original workflows. No new business data is inferred from the decoration.

The browser audit also measures the rendered dashboard-heading contrast against its actual background (minimum 4.5:1). This guards against CSS cascade changes that could combine light text with the previous pale header. It is a focused heading check, not a claim of complete accessibility conformance.

## Jelly motion finalization

`src/styles/jelly-motion.css` follows the theme and supplies short, damped spring feedback: soft card lifts, control press/rounding and icon feedback, dropdown pops, page entrances, content fades, and dialog/drawer transitions. Timings range from 100 ms press feedback to a 520 ms drawer entrance. No perpetual decorative movement, external animation runtime or scroll hijacking is used. Press feedback keeps button hit-target dimensions unchanged; amounts and form fields are not scaled.

Page entrance motion belongs to the route host, not each `.page` repaint. Local refreshes such as utility marks therefore do not replay the whole-page animation. Phone menu open/close keeps its existing DOM and listeners so the native transform transition actually runs in both directions. Breakpoint, role and route changes retain the normal shell refresh; focus returns to the menu opener when closing from inside it.

Panel exit cleanup follows the actual animation duration. Opening a replacement panel disposes pending old exits, timers and listeners before mounting the replacement, preventing duplicate panels during rapid navigation. Dialog dismissal retains its existing unsaved-change guard and focus restoration. Reduced-motion preferences disable the new entrances, drawer/content animation and decorative transitions; essential states and controls remain usable.

Motion verification uses the existing browser feedback test with both `reduce` and `no-preference`. It checks actual menu DOM retention and a native transform transition, control dimensions during a press, retained unsaved text, dialog focus restoration, panel closure, and reduced-motion behavior. Existing route, billing and role tests remain applicable.

## Botanical editorial detail - 2 November 2026

The user's request for a more expressive, decorated interface is implemented in `living-details.css`, between the form and motion layers. It retains the approved cream/mint/forest palette and adds illustrated inner-page covers, larger hierarchy, arch-shaped section ornaments, layered paper edges, category-tinted queue cards, stronger table/filter treatments, decorated settings/panel surfaces, and an illustrated brand sign-off on short pages. Narrow screens retain small cover illustrations and stack actions; the Tenant greeting keeps a small neighborhood scene on phones.

`mint-neighborhood.svg` is a local decorative scene with balconies, brick texture, greenery, awning and a small water feature. It appears in Manager/Home/login compositions and relevant page covers. Staff and Admin retain their role-specific bill-review/key illustrations with matching framing and decorative icon tokens. Neither the scene nor its caption represents actual property information, service status or new business functions.

Visual review caught a CSS-specificity collision that duplicated the Tenant greeting as a large second header. The corrected Tenant-specific selector keeps its introduction compact, and the all-role browser audit now checks that introduction stays below 90 px at every audited width. See the dated QA entry for the reproduced failure, corrected checks and screenshot gallery refresh.

## Theme implementation

The later whitespace correction makes Incoming Bills a register with aligned fact columns and a right-side action area on desktop, switching to two-column facts and wrapped actions on smaller screens. Report cards retain natural heights, and header selectors use compact widths beside their actions. The layout audit uses actual synthetic incoming rows, including long filenames, so spacing checks cannot pass on an empty intake list.

`src/styles/fresh-mint.css` supplies the theme after the existing stylesheets, followed by `form-garden.css` for illustrated dialogs, `living-details.css` for the botanical editorial detail, and `jelly-motion.css` for interaction timing. Dialog artwork is local, decorative and outside form controls. Entity dialogs use two columns on desktop and a single column on phones; their body scrolls independently of the action footer. No font download, UI framework or additional package is required.

The 2 November form-validation pass replaces duplicate unit-floor controls with one non-negative whole-number input, and enforces optional-blank/exactly-eleven-digit phone values in the UI and write APIs. Existing data is not migrated; see the dated QA entry for compatibility and test evidence. This later validation change is separate from the original presentation-only theme work.

Tenant rent reporting, Manager confirmation, utility personal marks, calendar rules, correction proposals, role/workspace isolation and monochrome receipts retain their existing rules. The illustration and sample figures in the approved concept do not replace working records. Backend code, database schemas, live configuration and credentials were not modified for this theme.

## Checking the result

Start the intended profile normally and hard-refresh the browser (`Ctrl+Shift+R`) to reload the styles and modules. Do not recreate/reset the portfolio for a visual update.

The existing page audit checks named controls, phone tap sizes, page overflow and browser errors at 1440, 820, 390 and 320 px. Its appearance assertions now expect cream topbars. The route/session test now expects readable expanded desktop navigation and still checks keyboard navigation, phone menu behavior, logout and role changes. These replace assertions tied to the superseded blue/rail presentation.

The consistency pass explicitly includes Staff pages as well as Manager, Admin and Tenant. It checks that the shared plant image loads, does not overlap the navigation/footer on a 600 px tall desktop, and remains visible with logout when opening/closing the 390 × 600 phone drawer.

Current screenshots are in [the preview gallery](../../reports/mockups/README.md), generated with disposable synthetic records using `npm.cmd run previews:refresh`. Verification outcomes and log paths are in [QA evidence](qa-report.md). Actual phones and external notification delivery remain separate acceptance work.
