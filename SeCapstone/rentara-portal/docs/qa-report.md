# Current QA status

## Mobile recent-activity alignment - 5 November 2026

Reproduced the reported overlap at 390px with an actual Utility Bill Received event and a long filename in the isolated all-role browser audit. The event label's nowrap rule exceeded its half-width mobile field. Recent activity now gives Event and Timestamp full-width rows, places Triggered by and Status side by side, and wraps titles, references and dates within their fields. The CSS is scoped to the activity table at 720px and below; data and click behavior are unchanged.

The new field-containment assertion failed before the fix and passed afterward at 390px and 320px. The complete 182 role/route/width audit passed in about 45 seconds with no runtime/overflow/control issues. Visually inspected the current Group 3 Manager activity list at 390px (`data/mobile-activity-alignment-390.png`). Git whitespace checks passed. No working billing data changed and no push performed.

## Latest staging merged with local responsive UI - 5 November 2026

Fetched and fast-forwarded local main from `18c4510` to staging `79f79c0`, then restored all saved local changes. Retained backup stash `552f999806ebbec4a71b45ae09b25aa80babe14b` and ignored patch `data/pre-staging-local-2026-11-05.patch`. Only this report conflicted; both histories were retained. Responsive width, all-role bottom navigation and their audit are identical to the saved versions. Both old start:phone and new automatic demo:group scripts are present. Changes remain local/unstaged; no push performed.

Fresh targeted combined regression: **31 passed, zero failures/skips/cancellations**, about 107 seconds, covering the new laptop setup/start, Group 3 origins/workspaces, Admin boundaries, all-role responsive UI, cross-role routing and interaction feedback. All **157 JS/MJS syntax checks** and git whitespace checks passed. No working Demo initialization, mail retrieval or delivery was run; the selected existing-Demo data was not replaced. See [5 November integration review](staging-integration-review-2026-11-05.md) for scope, preservation details and limits.

## Automatic local-IP Group 3 startup - 5 November 2026

`npm.cmd run demo:group` now detects a usable local IPv4, prepares missing demo/HTTPS files, then launches the existing restricted demo process. Windows physical default-route information is used when available, with Wi-Fi/unambiguous-adapter fallback; common virtual/VPN, loopback and self-assigned addresses are excluded. Ambiguous selection stops with a manual `--ip` instruction. Receiving and live delivery still require their existing explicit switches. There is no internet connectivity probe, automatic firewall modification or automatic installation of device trust.

Valid configured HTTPS is reused after checking the IP, local hostname, validity period, certificate/key match, CA signature and required profile/Push configuration. An IP change or invalid/expiring configuration triggers setup while preserving the CA and existing demo records. Detection occurs at startup, so a Wi-Fi change requires stopping and restarting the command. This supports separate local laptop installations; it does not synchronize their databases or provide access between different homes.

Verification: all 28 tests passed with no failures/skips/cancellations in 21.653 seconds across the two laptop setup/start suites and existing Group 3 config/workspace/Admin suites. Seven added launcher tests cover VM/VPN exclusions, physical-route preference, ambiguous/offline detection, explicit arguments, missing-profile setup before launch, delivery-switch forwarding and failure-before-backend behavior. An isolated real setup detected this laptop's IPv4, generated certificates and served the frontend module over verified HTTPS with the allowed demo origin. A second run retained the identical certificate, and a manual changed-IP run refreshed it while preserving the CA. A future-date check rejected an expired certificate. No live Gmail/delivery, system trust installation or working-portfolio changes occurred. These are targeted setup results, not actual-phone acceptance or a new full 155-test run.

## Fresh-laptop Group 3 setup - 5 November 2026

Fixed a reproducibility gap: `demo:group:prepare` previously required an unshared local member-input file, and local HTTPS required a preinstalled executable. The tracked member template and `npm.cmd run setup:group -- --ip YOUR_LAPTOP_IPV4` now prepare the missing input, Group 3 portfolio, second test workspace/Staff accounts, HTTPS tool and local profile. Windows x64 downloads mkcert v1.4.4 from its official release only when absent and checks the pinned SHA-256. Existing member input is retained; if missing beside an existing prepared database, identities are recovered from the stored setup marker rather than overwritten from the example. No role, billing, delivery or manuscript rule changed.

Focused verification: 21 tests passed, zero failures/skips/cancellations, in 17.104 seconds across `group-laptop-setup`, `group-demo-config`, `group-demo-workspaces` and `admin-visibility`. Six new tests cover fresh setup, all four roles/two workspaces, rerun preservation of account changes and financial-record counts, member-input recovery/preservation, invalid IP/tool/certificate failures, executable reuse and rejected failed/corrupt downloads. An additional isolated setup used the actual downloaded executable and certificate generator; both the initial IP and a changed IP were covered, the CA was preserved and the demo was reused. It did not access Gmail, send notifications, install a system-trusted CA or alter the working portfolios. This is setup/development evidence, not actual groupmate-phone acceptance or a rerun of the earlier 155-test full suite.

The root/application READMEs, tool guide, Group 3 bill guide and network guide now distinguish the current HTTPS Group 3 startup on port 8444 from the plain-HTTP showcase on port 8080. Generated databases, sessions and private certificate keys remain local; source, member template, setup code and tests are shareable. Each hosting laptop retains a separate database. Device certificate trust and appropriate network/firewall access remain required for the local phone demonstration.
## Mobile bottom navigation for every role - 4 November 2026

The existing bottom bar was Tenant-only, so other roles had no bottom destinations on phones. The shell now derives mobile destinations from the same role-filtered navigation registry as the sidebar. Manager/Staff have Dashboard, Properties, Bills and More (opens the existing full drawer); Admin has its four permitted destinations; Tenant retains Home, Bills, Alerts and Settings. Active states, badge counts, drawer expanded state, safe-area padding and desktop hiding are retained. No permissions or backend behavior changed.

All 182 role/route/width audit combinations passed, including four bottom controls at mobile/tablet widths, viewport-bottom positioning, page clearance and existing palette/overflow checks. A separate 390px touch viewport smoke check passed Manager Properties navigation/active state, visibility after scrolling, More opening, Units selection and drawer closing. The routing/cross-role logout and interaction/reduced-motion browser tests also passed (2/2). Desktop remains sidebar-based. Screenshot: ignored `data/mobile-bottom-nav-manager-390.png`.

## Fluid workspace width - 4 November 2026

Replaced Fresh Mint's 1440px page cap with the available workspace width and fluid desktop edge padding (24-36px); existing tablet/phone spacing and text-length limits remain. This removes the large centered side gutters on wide screens without changing backend logic or business workflows. Existing grids reflow within the wider canvas.

Expanded the all-role browser audit to 320, 390, 820, 1280, 1440, 1920 and 2560 CSS pixels. All 182 role/route/width combinations passed, including symmetric page gutters (15-37px), no document overflow, navigation, controls and existing theme checks. Chromium/Edge automation passed in about 43 seconds. Captured and inspected Manager dashboard/Properties previews at desktop and phone sizes; physical Brave, Opera GX and Chrome comparison remains a manual check. Browser zoom, operating-system scaling and sidebars can change the available CSS viewport. No Git push performed.

## Dedicated Demo HTTPS setup - 4 November 2026

Ran the requested `setup:https -- --ip 192.168.100.207` sequence. The first attempt identified a missing local mkcert tool; downloaded official v1.4.4 from the project's GitHub release into ignored `data/tools`, checked release asset size/version, then reran successfully. Created the local HTTPS certificate/public CA export and `.env.acceptance`; checked certificate coverage for localhost and the current IP. Existing VAPID keys were retained and the shared `.env` was backed up before the command. No system certificate trust was installed automatically.

The elevated firewall helper successfully created the separate Private/LocalSubnet Node rule for TCP 8444. Actual `npm.cmd run demo:group` startup was attempted and stopped with `ERR_SQLITE_ERROR: unable to open database file` because `data/group-demo/propertypro.sqlite` is absent. The user selected an existing Demo, so no replacement portfolio, member list or synthetic accounts were generated. HTTPS/network preparation is ready; the dedicated Demo is **not running** pending the existing Demo database and source files from its prepared folder/PC. No mailbox retrieval or live delivery was enabled.

## Phone LAN access setup - 4 November 2026

Added `npm.cmd run start:phone`, which uses the normal `.env` profile/data and detects a current laptop IPv4 address (or requires explicit `--ip` when several exist). It sets process-local LAN binding, portal URL and allowed origins, preserving the shared `.env`. Current URL: `http://192.168.100.207:8080/`; current profile remains Showcase. No TLS/Push configuration, profile initialization, reset or external delivery was enabled.

Windows required administrator privileges to add the inbound rule. After the prepared helper was launched through Windows elevation, creation succeeded and its result reported ready: `Rentara-Phone-LAN-8080`, Node executable only, TCP 8080, Private network and LocalSubnet. The persistent helper is `tools/enable-phone-firewall.ps1`. A later separate inspection from the ordinary process was denied by Windows; readiness is based on the elevated helper's successful creation result. Laptop-side checks: LAN page HTTP 200, phone-origin preflight 204, Maria Tenant login 200 and authenticated session 200, followed by logout. JavaScript/PowerShell syntax and whitespace checks passed. Physical-phone access remains to be confirmed on the same network. See [phone instructions](phone-access.md). No financial records were edited and no Git push was performed.

## Latest staging merged into local main - 4 November 2026

Advanced local `main` from `1e04069` to latest `origin/staging` commit `18c4510`, importing two commits. Staging already included the existing Fresh Mint history. Preserved the two uncommitted local QA files in stash `7ad2b243b9e117c3d7cbb3eef35621fa1fd0c185` and an ignored backup patch before merging. Restoring them required one QA-report conflict resolution; both histories were retained, and the theme checks applied cleanly to the expanded audit. No application source conflict or runtime fix was needed.

Fresh combined `npm.cmd test`: **155 passed, 0 failed, 0 cancelled, 0 skipped**, approximately 374 seconds (`data/staging-integration-2026-11-04.log`). Syntax: **152 JS/MJS files, zero failures** (`data/staging-syntax-2026-11-04.json`). The suite covers the new Admin read-only inspection/private-file restrictions, profile/delivery safeguards, input validation, sidebar motion, existing billing and role workflows, and restored local theme/spacing guards. `git diff --check` passed. Final fetch reconfirmed local main matches latest remote staging; it is two commits ahead of `origin/main`.

See [integration review](staging-integration-review-2026-11-04.md) for reviewed boundaries, caller scope and backup details. Working databases, credentials, original bills and live settings were preserved; no profile setup or live delivery was run. No commit or push was performed. Actual phones, live authorized intake/email/Push, printing and adviser/manuscript acceptance remain separate checks.

## Sidebar motion follow-up - 4 November 2026

Restored both requested navigation effects in Fresh Mint: a desktop collapse button with hover/keyboard rail reveal, and a moving active-link highlight. Expanded labels remain the initial state; mobile drawer behavior remains. Shell disposal cancels its observers/listeners, and reduced-motion preferences suppress animation. Role filtering, links, data and financial rules are unchanged.

Focused browser regression: **3 passed, 0 failed/skipped/cancelled**, 164,090.297 ms (`data/sidebar-motion-verified-2026-11-04.log`). Covers routing/logout across roles, desktop collapse/hover/keyboard expansion, marker movement and alignment, reduced motion, mobile interaction and all-role layouts. Changed JavaScript passed syntax checks and the working diff passed whitespace checks. Regenerated 51 UI screenshots, three email previews and icon comparison; visually inspected collapsed and selected states. No live delivery or working-data changes occurred. The earlier 155-test run is retained below and was not represented as a fresh full run for this follow-up.

## Integrated Fresh Mint and staging verification - 4 November 2026

Combined main `1e04069` with staging `6cc9a61` locally, preserving the newer Admin inspection, public-user allowlist, profile restrictions, two-workspace setup and manuscript/testing kit. Both branches' dated QA histories were retained. The Bayan setup now supplies numeric floor 0. No commit or push was performed.

Reproduced five common-input gaps in isolated tests, then added strict text types/lengths, normalized email checks with useful duplicate-account conflicts, scalar decimal amounts, typed payment references and boolean preference patches that preserve unchanged opt-outs. The inherited numeric-floor/11-digit-phone/date checks remain. The harmful-text browser fixture now separately verifies rejection of invalid phone writes and rendering of contaminated historical values; its defense-in-depth coverage remains intact.

Fresh complete regression: **155 passed, 0 failed, 0 cancelled, 0 skipped; 354,942.2249 ms** (`data/integrated-final-test-2026-11-04.log`). Syntax: **151 JS/MJS files, 0 failures**. Nine focused validation/Admin/form checks also passed. Refreshed **51 UI screenshots**, three email previews and the icon comparison using disposable data; inspected the new desktop/phone Admin read-only views. Added the Admin workspace route to the responsive audit. This is not actual-phone or live-delivery acceptance.

Testing kit: 19 simplified checks and 77 detailed cases, including a common-invalid-input exercise, with prior result fields preserved. Fresh synthetic SOA assets remain available. The working database and external accounts were not changed. Use the current integration review for remaining device, provider and formal evaluation limits.

## Role/module theme and function confirmation - 3 November 2026

Verified `main` at `1e04069`. The page audit covers **25 role-specific views at four widths (1440, 820, 390 and 320 px): 100 page/viewport combinations**, plus Manager Settings subsections. Admin covers Dashboard/Audit/Settings; Manager covers Dashboard/Properties/Units/Tenants/billing tabs/Reports/Settings; Staff covers Dashboard/Properties/Units/Tenants/intake/exceptions/Account; Tenant covers Home/Bills/Notifications/Settings.

Added rendered-style regression checks for the shared forest sidebar and green/mint primary-action palette on every audited page, alongside existing cream topbar, heading contrast, plant loading/navigation separation, phone controls, overflow, incoming-column alignment and report-spacing checks. Focused theme audit passed (`data/role-module-theme-audit.log`). Reviewed the retained current dashboard screenshots for all four roles against the approved Fresh Mint direction. Consistency means the shared visual system; role-specific content, illustrations and permitted actions remain distinct.

Fresh full `npm.cmd test`: **105 passed, 0 failed, 0 cancelled, 0 skipped**, approximately 292 seconds (`data/role-module-consistency-test.log`), including the strengthened theme audit. Functions covered include portfolio/search/validation, Tenant detail tabs, OCR/intake/duplicates, correction proposals and decisions, exact allocation, rent reports/confirmation/advance/receipts, personal utility marks, calendar/notifications, permissions, sessions, persistence, workspaces and recovery. No new application bug was confirmed, and no production UI/backend change was needed; only test guards and this report were updated locally. No push was performed. Actual-device motion/keyboard behavior, actual provider formats, physical printing and authorized live email/Web Push delivery remain separate acceptance work.

## Post-merge QA on main - 2 November 2026

Verified active branch `main` at `1e04069`, synchronized with `origin/main` after fetch. Fresh full `npm.cmd test`: **105 passed, 0 failed, 0 cancelled, 0 skipped**, approximately 299 seconds (`data/main-branch-qa-test.log`). This includes the final incoming-row/report spacing guards, validation, all-role UI at 1440/820/390/320 px, Staff/Manager/Tenant/Admin permissions, protected source review, rent/utility workflows, OCR/duplicate handling, sessions, workspace isolation, persistence and recovery.

Additionally exercised the running `http://localhost:8080/` with four existing demo accounts: Manager, Admin, Maria and Alice (three distinct roles; Staff is covered by the isolated suite). **34 page/viewport combinations passed** at 1440 and 390 px, with no captured page errors, load-error states or horizontal overflow (`data/main-live-smoke.json`, summary `data/main-live-smoke.log`). These live checks performed navigation and normal sign-in/sign-out only, with no financial writes or setup/reset operations.

Read-only checks on the configured local SQLite database passed `PRAGMA quick_check`, with **0 foreign-key violations** (`data/main-database-check.json`). Local HTTP returned 200. No new bug was confirmed in these checked paths, and no application code fix was needed. Only this local QA report was updated; no commit or push was performed. Actual-device keyboard/motion, physical printing, real provider formats and authorized live email/Web Push delivery remain separate acceptance checks. Test transports and showcase navigation do not establish live external delivery or complete security coverage.

## Final frontend/backend verification - 2 November 2026

Fresh full `npm.cmd test` against the current layout and validation changes: **105 passed, 0 failed, 0 cancelled, 0 skipped**, approximately 263 seconds (`data/final-frontend-backend-test.log`). Covers all four roles, responsive UI/spacing, forms and motion, authenticated APIs, protected originals, OCR/duplicate intake, allocation, rent reporting/confirmation/advance/receipts, personal utility tracking, notifications/calendar, persistence, workspace isolation and recovery. Syntax checks passed for **133 JavaScript files** across source, server, tests and tools. Local HTTP returned 200; `git diff --check` passed.

Completed a focused differential review against `202d644`, with baseline blame and direct-call checks on authentication, profile and entity writes. No new blocking vulnerability or functional regression was confirmed, and no runtime fix was needed in this final pass. The [final review](final-frontend-backend-review-2026-11-02.md) records scope, caller counts, attack scenarios, evidence and limits. Actual phones, provider formats, physical printing and authorized live email/Push delivery remain manual acceptance work. Tests used disposable data; no working-data reset or Git push was performed.

## Whitespace and alignment correction - 2 November 2026

Reproduced the Incoming Bills gap: an older two-column rule placed actions below the details, while flex-sized extracted fields used only the left side of the register. Added a scoped incoming-register surface with fixed proportional fact columns and a desktop action column. At tablet/phone widths, fields switch to two columns and actions wrap below. Long filenames wrap; existing result-filter hiding, status labels and review handlers remain.

The broader screenshot review also found report cards stretched to their tallest neighbor and the report period selector occupying the full toolbar width. Cards now align at their natural height, and header selects share a compact action row with their buttons. Intake result count aligns to the toolbar's right edge on wider screens. No filler data or additional artwork was added to disguise gaps.

Expanded the all-role page audit with two explicit incoming-source fixtures (including a long filename), non-vacuous row-count checks, desktop action/detail alignment and cross-row field-column checks. Added a report-card stretch check. Both defects failed before repair (`data/spacing-before.log`, `data/report-spacing-before.log`). Final page/form/motion audit: **3 passed, 0 failed** (`data/spacing-audit-final.log`). The page audit covers Manager, Staff, Tenant and Admin at 1440, 820, 390 and 320 px, including overflow, named controls, phone target sizes and preserved Tenant header sizing.

Refreshed 49 UI screenshots plus the standard synthetic email/icon previews (`data/spacing-previews-final.log`), with no capture overflow/runtime errors. Visually inspected the current incoming register at desktop/tablet widths (`data/incoming-spacing-desktop.png`, `data/incoming-spacing-tablet.png`), phone Staff intake, Reports, Settings and the source-review dialog. Source-review, phone utility journey and presentation checks: **6 passed, 0 failed** (`data/spacing-workflows.log`), making **9 passing targeted test cases** across both runs. `git diff --check` passed. This targeted layout pass did not rerun the entire backend suite; the prior full 105-test result is dated below. No backend, billing rules, permissions, dependencies or financial records were changed. No Git push was performed.

## Botanical editorial visual pass - 2 November 2026

Expanded the approved Fresh Mint theme across dashboard and inner-page covers, card/queue/section treatments, property cards, tables/filters, settings, panels, dialogs, login and short-page sign-offs. Added a detailed local neighborhood SVG and matching decorative icon tokens. Tenant Home shares the new artwork while Staff/Admin retain their existing role-specific scenes. This pass changes presentation only; previous validation fixes, role boundaries, financial workflows and motion preferences remain.

Visual review found a CSS cascade collision that produced a duplicate full-size Tenant Home header. Added an audit assertion limiting the introduction height, reproduced the failure (`data/living-header-before.log`), and corrected the selector. The expanded all-role responsive audit, enabled/reduced-motion interaction checks and form-validation browser journey all pass (`data/living-design-audit-final.log`, three test cases).

Refreshed 49 application screenshots, three synthetic email PNGs and the icon comparison (`data/living-design-previews-final.log`); capture checks found no page overflow or runtime errors. Visually inspected Manager, Staff and Admin dashboards, property cards, corrected Tenant Home, phone bills/Staff Account and login. The refreshed [gallery](../../reports/mockups/README.md) contains current implemented screenshots. Final full `npm.cmd test`: **105 passed, 0 failed, 0 cancelled, 0 skipped**, approximately 269 seconds (`data/living-design-full-test.log`). `git diff --check` passed.

No backend, dependencies, schema, permissions, working records or live configuration were changed by this presentation pass. Tests and captures use disposable synthetic data; no messages were sent. Physical-device motion/visual acceptance remains manual. No Git push was performed.

## Follow-up QA audit - 2 November 2026

Targeted audit reproduced four backend failures: assignment start after lease end when termination is omitted; whitespace variants bypassing the per-email login attempt counter; malformed profile input causing an exception/coercion; and malformed message fields causing a server error. Fixed all four and added regression checks. Added browser validation for new-password length, required Tenant profile fields and Admin's permanent Tenant ID when the Tenant role is selected. These preserve existing role/financial rules.

Before-fix evidence: `data/qa-validation-before.log`; focused repaired checks: `data/qa-validation-fixed.log`. Focused backend/form-browser run: **40 passed, 0 failed** (`data/qa-audit-targeted.log`). Final full `npm.cmd test`: **105 passed, 0 failed, 0 cancelled, 0 skipped**, approximately 269 seconds (`data/qa-audit-full-test.log`). `git diff --check` passed. See the [concise findings and dashboard coverage](qa-update-2026-11-02.md) for the individual changes and remaining actual-device/live-service acceptance work. Test writes use disposable data; no Git push was performed.

## Numeric inputs and illustrated forms - 2 November 2026

Reproduced missing floor validation with a failing service regression (`data/form-validation-before.log`). Add/Edit Unit now uses a single whole-number Floor input, with 0 for ground, rather than independent free-text and decimal floor fields. API writes validate non-negative safe integers and reject conflicting floor values. Existing historical display labels are retained on unrelated API edits; no working records were migrated. Development setup fixtures now use numeric floors.

All phone and emergency-phone inputs share numeric keyboard, eleven-digit pattern/length, letter-entry and invalid-paste handling. Optional fields may remain blank. Manager/Staff tenant edits and all account profile API writes reject nonblank phones that do not contain exactly eleven ASCII digits. Tenant Settings now checks phone validity before dispatch as Manager Settings already does. No SMS workflow was added.

Shared dialogs have illustrated Fresh Mint headers, clearer hierarchy, tinted surfaces and revised field spacing. Entity forms use two columns on desktop and one on phones. Local plant, townhouse and water-garden illustrations decorate relevant headers/empty states without intercepting controls. Existing motion, unsaved guards, focus handling and financial permissions remain. Corrected shared modal class handling to accept multiple styling classes.

Focused service and desktop/phone browser checks pass (`data/form-garden-targeted.log` for service checks; `data/form-garden-browser-final.log` for the corrected browser run). The initial full run passed 101 checks and failed the new test because its invalid-value fill was blocked by the new typing guard. The corrected test explicitly injects invalid values to exercise submit validation separately; it passes. That earlier result is retained in `data/form-garden-full-test.log`; final regression evidence is `data/form-garden-full-test-final.log`.

Final full `npm.cmd test`: **102 passed, 0 failed, 0 cancelled, 0 skipped**, approximately 262 seconds. `git diff --check` passed. Includes all-role responsive UI audit, protected source review, Staff permissions, rent payments/receipts, utility OCR, workspace isolation and recovery.

Captured and inspected `data/unit-form-desktop.png` and `data/unit-form-phone.png`; the desktop form is compact, and the phone form scrolls with Save/Cancel accessible. Automated writes use disposable databases. Actual-device keyboard/paste and visual acceptance remain manual. No dependencies, schema, live credentials, working financial records or Git pushes were changed by this task.

## Jelly motion finalization - 1 November 2026

Added `jelly-motion.css` after the Fresh Mint layer: short damped spring transitions for clickable cards and icons, soft press/rounding feedback without shrinking buttons, route entrances, dropdown/content fades, modal pops and drawer entrances/exits. Form fields and financial values are not scaled. No animation package, external resource, decorative idle loop or scroll hijacking was introduced. Reduced-motion preferences disable the new entrances and decorative movement.

Motion belongs to the route host so utility-mark/API repaints do not replay a whole-page entrance. Phone-menu-only toggles retain the same DOM/listeners, update inert/expanded state, and restore opener focus when closing from inside; breakpoint/role/route changes retain normal shell refresh behavior. A test reproduced the former menu replacement and now verifies actual native transform-transition creation. Panel exits follow their CSS duration, and replacement panels immediately clean up pending old exits/timers/listeners. The initial broad run exposed two overlapping closing/opening panels; the existing journey passes after this lifecycle fix.

Focused enabled/reduced-motion and broad four-role browser journeys passed (`data/jelly-motion-interaction-final.log`). Coverage includes unchanged pressed-button dimensions, unsaved text/discard guards, modal focus restoration, panel/tab behavior, phone menu open/close, actual transition creation, reduced-motion modal behavior and existing portfolio/payment/receipt workflows. Final full evidence is in `data/jelly-motion-full-test-final.log`; the earlier failed run is retained in `data/jelly-motion-full-test.log`.

Fresh full `npm.cmd test`: **100 passed, 0 failed, 0 cancelled, 0 skipped**, approximately 257 seconds. `git diff --check` passed.

Static Fresh Mint screenshots remain applicable; this pass changes interaction timing rather than their settled appearance. Backend source, dependencies, database schema, billing rules, permissions and live configuration were not edited. Automated writes use disposable test data. Actual-device motion/performance acceptance remains separate from browser checks.

## Expressive Fresh Mint compositions - 1 November 2026

Implemented a stronger visual revision after the user requested more design: dark forest illustrated dashboard banners; larger heading hierarchy; individual summary/queue cards; role-specific Staff bill-review and Admin house/key illustrations; varied property artwork; framed Tenant greeting; paper-style rent/billing cards; category accents; receipt archive and empty-state treatments. The plant remains shared across all roles. Added local SVG illustrations without new packages or font/network dependencies.

Preview review found that an older pale-header selector initially overrode the new dark background while the heading had already changed to light text. Added a rendered heading-contrast assertion, reproduced its failure, corrected the selector precedence, and passed the expanded four-role audit (`data/fresh-mint-expressive-audit.log`). The check requires at least 4.5:1 for dashboard headings at the existing desktop/tablet/phone audit widths. This does not establish full accessibility conformance.

Refreshed 49 application screenshots, three synthetic email previews and the icon comparison after the correction (`data/fresh-mint-expressive-previews-final.log`), with no capture overflow/runtime errors. Visually inspected the corrected Manager and Staff dashboards, Admin/property illustrations, Tenant Home and phone billing cards. Final regression evidence is in `data/fresh-mint-expressive-full-test.log`.

Fresh full `npm.cmd test`: **100 passed, 0 failed, 0 cancelled, 0 skipped**, approximately 227 seconds. `git diff --check` passed. Actual phone/provider acceptance remains separate from these automated checks.

No backend source, dependencies, database schema, billing rules, permissions or live integration settings were changed. Automated writes and screenshot captures use disposable synthetic data; physical devices and actual provider formats remain separate acceptance work.

## Fresh Mint consistency and decorative detail - 1 November 2026

Removed the Tenant-only sidebar background. A shared decorative plant is now rendered for every role/account, in its own flexible sidebar area above the footer. It cannot cover menu items as a background image could; the menu keeps its independent scroll region. Short displays use a smaller plant rather than removing it.

Manager, Staff and Admin now share the same illustrated workspace-header component. Other pages have coordinated framed headings and botanical outlines; navigation icon tiles, avatar rings, card accents, queue surfaces, filters and panels extend the approved Fresh Mint identity. The Tenant greeting and actual bill/status/action bindings are preserved. No new financial or communication action was introduced.

Expanded the existing layout audit to include Staff pages, shared-plant image loading, navigation/footer separation on a 600 px tall desktop and open/close phone-drawer checks at 390 × 600 for all roles. The initial expanded four-role page audit passed (`data/fresh-mint-detail-audit.log`); full regression evidence is in `data/fresh-mint-detail-full-test.log`.

Final fresh `npm.cmd test`: **100 passed, 0 failed, 0 cancelled, 0 skipped**, approximately 292 seconds. This includes the final all-role short-phone menu/logout checks. `git diff --check` passed.

Refreshed 49 UI screenshots, three synthetic email previews and the icon comparison with isolated synthetic data (`data/fresh-mint-detail-previews.log`). Capture checks found no page overflow or runtime errors. Visually inspected Manager, Admin, Staff and Properties previews; all show the shared sidebar illustration and coordinated styling. Actual phones remain separate acceptance work. Backend code, permissions, billing rules, live configuration and working financial records were not edited.

## Approved Fresh Mint implementation - 1 November 2026

Implemented the user-approved cream/mint/deep-green design across Tenant, Manager, Staff, Admin and login. A final vanilla-CSS theme layer provides the palette, bold headings, rounded cards, readable controls, light topbars and consistent forms/panels. Desktop navigation now keeps its labels visible; mobile retains its menu drawer and Tenant bottom navigation. Tenant Home follows the approved greeting, apartment artwork, rent card, grouped utility cards and calendar composition, with existing live data and actions. Local decorative SVGs and the existing brand mark require no new library or network font. See [theme notes and reference](fresh-mint-theme.md).

Fresh full `npm.cmd test`: **100 passed, 0 failed, 0 cancelled, 0 skipped**, approximately 240 seconds (`data/fresh-mint-full-test.log`). Targeted routing/session and page-audit tests also passed (`data/fresh-mint-targeted.log`). The appearance assertions now expect the approved cream topbar and visible desktop navigation; keyboard, logout, role, overflow and control-size checks remain. Browser coverage includes 1440, 820, 390 and 320 px. Billing, exact allocation, reports, rent confirmation/receipts, utility marks, correction proposals, reminder/channel rules, persistence and workspace isolation passed their existing checks.

Refreshed 49 application screenshots, three synthetic email previews and the icon comparison with disposable data (`data/fresh-mint-previews-final.log`). Capture checks detected no page overflow or runtime errors. Visually inspected Tenant desktop/phone, Manager dashboard and login; the final phone rent card was also checked after spacing refinements. [Current gallery](../../reports/mockups/README.md).

Backend source, database schema, billing calculations, permissions, integration settings and credentials were not edited. No portfolio reset, manual financial-record mutation, external mail send/receive, manuscript edit or Git push was performed. The configured local showcase was started for review; it retains its normal scheduler and external-channel safeguards. Actual-device usability and live provider/Push acceptance remain separate checks; these results do not establish representative OCR accuracy or participant evaluation.

## Reviewer/testing kit verification - 2 November 2026

Prepared a Docs-ready reviewer guide and a 74-case blank manual workbook with evidence, feedback, blocker and retest fields. Six fresh synthetic asset cases passed actual local extraction/body parsing/validation/allocation checks in a disposable portfolio, including real scanned-PDF OCR, two held sources and duplicate prevention. Three isolated generator-guard checks refused overwriting recorded results, feedback or issue history. These are tooling/fixture checks, not a new full application regression run, phone acceptance, real sending, representative OCR accuracy or participant evaluation. The working Group 3 mappings and source-period readiness were inspected read-only; no live data changed. The existing 144-test result remains its own dated checkpoint. See [the kit](../../reports/testing/README.md) for procedure and cleanup details.

## Five-step security verification - 1 November 2026

Completed the authorized rendering, forced-audit-failure, concurrent financial-action, older-Admin-response and isolated guard-sensitivity checks. The only runtime repair is the shared public-user response projection in `server/service.js`. It previously removed passwordHash and returned all other stored fields. An initially failing synthetic canary test demonstrated that unknown reset/token/private fields could be exposed. The helper now returns only supported public account fields and the four boolean notification preferences. No live credential exposure is asserted, and no stored account/password data, permission policy or reset workflow was changed.

The Admin HTTP test file now has eight scenarios. New checks use an actual pending rent report for Admin denial, abort audit inserts with a temporary SQLite trigger, send parallel requests under two owning-Manager tokens, and inspect older account/maintenance/audit/receipt responses. Failed inspection audit writes return 409 JSON with only message/code and no Tenant/bill/receipt data. Concurrent rent confirmation returns the same receipt twice but creates one receipt and one confirmation audit effect. Concurrent proposal decisions produce one applied result and one 409, one correction and two PHP 300 bills totalling PHP 600. Account, workspace, service/status, backup reply, OCR restart, purge, audit JSON/CSV and rendered-receipt outputs exclude the private canaries after the fix. Backup contents remain sensitive recovery data; this is a check of their HTTP metadata response, not a claim that backups contain no private information.

A real-browser malicious-input journey covers Tenant text, single/double quotes in an input value, javascript-like record strings, actual email-body ingestion, controlled OCR-extraction output, stored extracted/display text and generated receipts. No injected image/event-handler nodes or unsafe application links appear, and the attack marker remains unchanged. The OCR result is deliberately supplied to the ingestion boundary; this check is not a Tesseract accuracy measurement. The rendering-site inventory found the shared html renderer plus restoration of previously rendered button markup; no runtime callers of the raw escape hatch or insertAdjacentHTML were found in this source scan. These observations are limited to the inspected code and tested paths.

Four isolated-copy sensitivity checks completed: every selected baseline passes and every deliberate complete-control bypass fails an assertion. The faults simulate Admin-as-Manager confirmation, a full-record Admin DTO spread, trusting a caller's workspace instead of authenticated membership, and an always-allow Demo policy. The first preliminary one-layer removals remained blocked by other guards; a scope assertion was improved to handle explicit denials and avoid a type-error false signal. Final evidence is `data/security-guard-checks/2026-11-01T13-13-56-457Z/results.json`, eight child transcripts and hashes. Working source hashes match the positive controls. Source copies were removed; credentials, runtime databases and private bills were never copied. The standalone driver is `node tools/verify-security-guards.mjs`; intended negative child failures are separate from the ordinary regression count.

Final complete `npm.cmd test`: **144 passed, 0 failed, 0 cancelled, 0 skipped**, approximately **712 seconds**. Transcript: `data/security-verification-full-test-2026-11-01.log`. Earlier focused post-fix checks passed all eight Admin HTTP tests, and the malicious browser case passed independently. Syntax/whitespace checks passed. The complete run includes real OCR/browser/role/workspace/recovery regressions alongside these controlled security scenarios, without external delivery. Concurrency evidence covers one Node backend, not distributed deployment. Actual devices, provider-origin email, representative extraction accuracy and participant evaluation remain unverified by this run.

The existing [Admin review](../../reports/updates/admin-read-only-review-2026-11-01.md) includes detailed outcomes, preliminary/final experiment distinctions and a self-contained text reply for Claude. Chapter III's working Markdown receives a dated development-evidence addition; previous 28 October measurements remain tied to that snapshot. No PDF/Google Doc export, real mailbox access, live financial edit, account reset or Git commit/push was performed.

## Admin read-only workspace hierarchy - 1 November 2026

Implemented the user-approved expansion from maintenance-only Admin visibility to a distinct, read-only inspection capability across workspaces. Admin Dashboard remains the maintenance landing. Inspect workspaces / Workspaces opens a URL-scoped selector, overview, property/unit/Tenant/bill lists and read-only details. Users & Roles offers direct Tenant links. Contact presentation, tables, bill breakdown and the generated rent-receipt renderer are shared rather than copying business records or granting a Manager identity. Published-bill correction history and limited extracted values/file metadata are visible. Tenant utility marks are explicitly unverified; obsolete revision marks are shown as needing review.

New `/api/v1/admin/workspace-view` GET routes require authenticated Admin and use allowlisted response projections. Non-Admin workspace scoping is unchanged. Explicit workspace/record mismatches are refused. Admin receives no raw extraction, full utility account references, government ID, private filenames/storage fields or uploaded original bytes, and cannot mutate contact/occupancy/billing, confirm rent, change utility marks, propose/authorize corrections or use Manager exports. System-generated rent receipts remain viewable without opening uploaded evidence. Detailed views are audited under Admin's actual identity. Account/system administration and global audit/recovery powers remain as previously authorized; this is an application-role boundary, not a sandbox against an operator with filesystem/credential control.

Fresh complete `npm.cmd test`: **138 passed, 0 failed, 0 cancelled, 0 skipped**, approximately **658 seconds**. Local ignored transcript: `data/admin-read-only-full-test-2026-11-01.log`. The full run includes new Admin HTTP/browser cases plus existing role journeys, responsive audit, OCR/utility journey, Staff atomic proposals, independent workspaces, receipts, notifications, replay history and recovery. After final stale-mark display/account-lookup refinements, **12/12 directly affected checks passed** again, approximately **37 seconds**, including the Users & Roles Tenant shortcut. Focused transcript: `data/admin-read-only-focused-test-2026-11-01.log`. `git diff --check` and syntax checks passed.

Specific regressions use disposable data: direct Admin financial/file-action attempts; non-Admin access to the new routes; foreign workspace/related IDs; nested private canaries omitted from JSON; generated versus uploaded receipts; shared contact updates after reload; URL/Back context; 820/390/320 px pages; logout and Back without private content. No live message, real financial modification, account reset, profile/database creation or Git commit/push was performed by this revision. These results are development evidence, not participant/security certification. Real-device/user acceptance and manuscript/figure/export alignment remain separate work.

The scope, Staff handoff, API contract, user manual and manual test guide now reflect this accepted boundary. Editable manuscript role paragraphs and final PDF/Google Doc were not regenerated. A focused differential review, trust-model limits and ready-to-copy Claude loophole prompt are saved in [Admin review](../../reports/updates/admin-read-only-review-2026-11-01.md).

## Two-workspace Group 3 testing portfolio - 1 November 2026

Added `demo:workspaces:prepare`, a guarded, additive development-fixture tool. It requires the Group 3 readiness marker and takes a consistent SQLite backup before its first write. The saved Group 3 database now has Group 3 Demonstration and Bayan Demo Rentals, each with one Manager, one Staff, two units and three Tenants. Bayan uses fictional `.test` accounts and is marked as a local-only demo workspace; it cannot inherit the original group's Gmail/SMTP/Push integration, including during restricted live-demo delivery. Normal production setup and business permissions are unchanged.

Bayan includes rent fixtures, shared electricity PHP 450 / PHP 225 each, individual water PHP 180, and one staged unreadable-due-date case. Synthetic original PDFs are retained under that workspace's source directory. The staged original shows 20 December 2026, while its deliberately prepared extraction is unreadable; the existing Staff proposal/Manager authorization engine must revalidate before producing PHP 300 shares from its PHP 600 total. This is a scripted development scenario, not measured OCR failure/accuracy or an actual payment. Seed notifications are never queued for external delivery.

Verification: **28 passed, 0 failed, 0 cancelled, 0 skipped**, approximately **70 seconds**, across the new four-case fixture suite and existing workspace, Staff workflow, browser and profile-safeguard suites. The ignored transcript is `data/two-workspace-regression-2026-11-01.log`. New checks cover preserved original business records/passwords, a readable pre-change backup, non-destructive reruns with changed passwords, allocations, atomic Staff/Manager correction, duplicate authorization denial, HTTP record/source ownership, rent confirmation denials, local-only integrations and refusing another profile without byte changes. The previous full-suite checkpoint remains separately dated; this is a targeted run, not a fresh complete-suite claim.

The additive command was then run on the saved Group 3 database and rerun to confirm reuse. Read-only comparison with `data/group-demo/backups/before-workspace-demo-2026-11-01T08-05-40-853Z.sqlite` confirmed all original properties, units, Tenants, mappings, incoming sources, bills, payments, receipts, notifications, mailbox history and existing account records were unchanged. No actual mailbox connection or message sending occurred. The local runtime data/backup are not synchronized through Git; teammates can use the same preparation command on their own prepared Group 3 database. User steps and results to record are in the [two-workspace walkthrough](manual-test-guide.md#two-workspace-final-walkthrough). Final participant/phone results still require actual evaluation before the paper can claim them.

## Controlled live-demo delivery - 1 November 2026

Added `npm.cmd run demo:group -- --receive --live-delivery` as an explicit, process-only delivery option. Normal Demo stays off; `--receive` independently controls Gmail intake. The live option permits only the three approved Group 3 Tenant emails, notification events created after this startup and, for Push, subscriptions registered/refreshed during this session. Old queues and excluded recipients are left unchanged. Existing preferences, Manager Push setting, rent-only email, reminder timing and deduplication still apply. Showcase workspace restrictions remain intact. SMTP configuration is checked before live-demo startup; stable VAPID keys can be reused from the existing local HTTPS configuration. No credentials or live data were rewritten, and no actual message or mailbox access occurred during implementation/testing.

Tenant Notifications now offers Refresh device registration when a browser already has a subscription, allowing the existing record to be registered for the current session/account. This avoids clearing browser data. Outgoing demo email subjects and Push titles carry `[DEMO]`. Notification links preserve the configured HTTPS laptop host and use Group 3 port 8444, not Acceptance port 8443.

Verification: **76/76 targeted checks passed**, approximately **70 seconds**, covering profile restrictions/live allowlists, actual browser-to-API registration refresh, backend/OCR, automation, rent email, startup origins/URLs, Operational/Acceptance and workspace isolation. The local ignored transcript is `data/live-demo-regression-2026-11-01.log`. After the final demo-label wording change, the directly affected profile/rent-email/Group 3 checks passed **21/21** again. The previous **125-test full-suite** checkpoint below predates this live-demo option; it is not presented as a new complete-suite result. Transports and browser Push APIs are simulated in these checks. Actual Gmail inbox arrival, Android display/certificate trust and current hotspot connectivity still require the controlled manual checks in the [startup guide](development-guide.md#controlled-live-demo-delivery) and [module checklist](module-qc-checklist.md).

## Profile and mailbox safeguards - 1 November 2026

Implemented a small shared profile policy, allowlisted connection sharing for Operational, final Demo email/Push restrictions and preflight mailbox collision checks. Fixed startup commands select the named profile; legacy startup does not automatically select Operational. Shared settings cannot select Operational data paths, mailbox labels, workspace configuration or enable switches. A new/older Operational configuration defaults utility intake and rent email to off; the initial portfolio also has Push off. Existing `.env`, named profiles, working data and demo Tenant identities were not rewritten. Additional Admins use the existing account page.

All enabled workspace readers are checked before connection using trimmed, case-insensitive account plus label. Operational workspaces cannot use the Group 3 Demo label. Configuration errors stop intake rather than clearing records or adding a database uniqueness migration. Different processes still require an operator comparison of startup account/label summaries; there is no global cross-process registry. Wrong-label mail can process in a receiving workspace with a valid mapping, so verified mapping ownership and Gmail filter routing remain required.

Mailbox history now includes the exact folder as well as host/account/UIDVALIDITY/UID. Account/workspace-scoped exact-message hashes suppress replay processing after relabelling/reset; changed-envelope copies still run billing-level duplicate validation. Existing processed and failed history is retained, with old failed review links still retryable. Legacy processed rows require one safe re-examination because their folder cannot be inferred. Re-reading does not create another bill or notification; a changed duplicate source can still enter review. No new dependency, business module, database schema or UI redesign was added.

Validation: nine new focused safeguards pass, including a forced eligible rent reminder with zero external delivery, workspace-level delivery overrides, connection loading order, explicit Demo intake, label collisions, wrong-label/mapping behavior, same-UID different-folder messages, UIDVALIDITY resets and legacy history/retries. Fresh complete `npm.cmd test`: **125 passed, 0 failed, 0 cancelled, 0 skipped**, approximately **504 seconds**. The local ignored transcript is `data/profile-safeguards-full-test-2026-11-01.log`. This includes backend, OCR, browser/role, responsive layout, workspace isolation, recovery and notification regressions. This entry supersedes the earlier same-day profile checkpoint's isolated-credential loading behavior; shared connections are now allowlisted as described above. Tests use disposable records and simulated transports/mailboxes, not actual Gmail or phone acceptance. Daily commands and manual checks are in [development guide](development-guide.md#separate-operational-profile) and [module checklist](module-qc-checklist.md).

## Separate operational profile - 1 November 2026

Added `setup:operational` and `start:operational`, a shared `.env.operational.example`, and a locally prepared `.env.operational`. The profile has fixed separate `data/operational` storage and defaults to `http://localhost:8081/`. Preparation created no database/account and did not contact any mailbox or recipient. Initial account setup is deliberately left for the user's own terminal, where workspace/Admin/Manager names, separate emails and hidden passwords are entered. It seeds no properties, Tenants, bills, receipts or demo logins. Default bootstrap identities remain unchanged for existing demos; only the optional operational identity inputs are new.

Startup reads only the operational profile for application settings, blocks inherited demo data/credentials/workspace overrides, validates address/transport consistency, and requires its prepared database marker before launching. Re-running setup preserves records and changed passwords; copied demo/unknown databases are refused read-only. SMTP, IMAP and Push remain off until explicitly configured for this profile. Existing authentication, role, allocation and notification rules are reused.

Verification: **16/16 focused profile/workspace checks passed**, including 7 new operational tests; **38/38 existing backend/acceptance checks passed**, approximately 31 seconds for the latter run. Cases cover configuration preservation, isolation, invalid setup without database creation, chosen identities/separate passwords, no seeded billing data, non-destructive reruns, demo-database refusal and an authenticated HTTP smoke test with Manager denial on Admin routes. The local backend transcript is `data/operational-bootstrap-regression-2026-11-01.log`. Syntax and Git-ignore checks confirm the generated profile is local and the template is shareable. The complete 109-test run below predates this profile addition; this task used 54 selected checks rather than claiming another full-suite result. Interactive terminal password masking and actual operational accounts/devices remain user setup/acceptance steps.

## Integrated Manager directory follow-up - 1 November 2026

Fast-forwarded to reviewed commit `7903d4c`, then combined both existing local QA entries and due-month assertions. Private recovery copies were created before integration, and unrelated manuscript/evidence files were checked for preservation. No new commit or push was made. The working database and local credentials were not changed.

Tenant profile changes now refresh the mounted directory through the existing data-change notification, regardless of whether the panel opened from a row or top-search suggestion. Its search input, keyword and property filter stay mounted. Top-search suggestions wait 250 ms after typing, cancel pending/obsolete reads and retain session/sequence guards and keyboard selection. Local directory filtering remains immediate.

Overview now selects the latest rent, electricity and water records separately and displays each recorded category amount, actual due date and applicable status. A missing category is not displayed as a zero balance. First-cycle advance, applied advance and a stale utility mark remain explicit. Whole-unit monthly rent is labelled in the directory/header/Overview; a shared Tenant's latest billed rent share uses the saved regular-rent line, including its recorded gross amount after advance application, without recalculating old allocations. No allocation, payment, permission, database or notification rule was changed.

Focused regression: **10 passed, 0 failed**, approximately 21 seconds. Before repair, the typing-burst regression reproduced three reads for three characters; after repair it produced one, including cancellation of a pending escaped query. The top-search edit regression checks the new stored/panel/directory name, suggestions, unchanged keyword/property filter and the original input element remaining connected. Eight summary cases cover separate categories/dates, missing versus genuine zero records, first-cycle advance, applied credit, historical shares, mixed historical bills, revised utility marks and unchanged source payloads. Browser checks cover drawer tabs and widths of 1440, 820, 390 and 320 px. An existing long receipt reference overflow at 320 px was reproduced and fixed by wrapping the panel's payment-reference row; full reference values are preserved.

Fresh complete `npm.cmd test` on the integrated working tree with these follow-up changes: **109 passed, 0 failed, 0 cancelled, 0 skipped**, approximately **333 seconds**. This includes the broad role journey, Staff/Manager proposal workflow, responsive page audit, shared utility/OCR journey and workspace isolation. The local ignored transcript is `data/directory-integration-full-test-2026-11-01.log`. `git diff --check` passed. These automated fixture results do not establish actual-device/provider delivery, representative extraction accuracy or participant evaluation. Chapter III's earlier measurements remain tied to their original development revision and were not replaced with this update's test counts.

## Manager directory QA and fixes - 28 October 2026

Reproduced the reported disappearing Billing navigation in the running showcase: the long Billing body flex-shrank the Tenant panel's tab bar until its labels were clipped. A new browser assertion failed against that layout before the fix. The tab bar now retains its height while the body scrolls. Checks switch all four tabs at 1440, 820, 390 and 320 px. The phone Tenant header now stacks identity and unit details instead of overlapping them.

Added partial, case-insensitive Tenant suggestions to the directory and Manager/Staff portal search. Typing `Ali` suggests Alice Reyes; choosing a result opens that Tenant. Suggestions support pointer selection, Arrow keys, Enter and Escape, show no-match/failure guidance, respect workspace/property scope and discard obsolete requests. Directory filtering keeps its search input mounted instead of replacing it while typing. Existing Tenant/Admin global-search destinations are preserved.

The Tenant form now explains invalid lease/assignment ordering beside the affected fields before submission and scrolls to the first invalid field. Server-save errors also scroll into view. Phone inputs use telephone keyboards; unit options say Shared occupancy instead of the internal enum. No backend financial rule or permission was changed.

Focused checks passed for search/filtering, all four Tenant tabs, phone layout, rejected invalid-date submission without record creation, correcting errors, and cancellation. The existing broad four-role browser journey also passed. Screenshots are under ignored `test-results/manager-search-fixed.png`, `manager-billing-fixed.png` and `manager-panel-phone-fixed.png`.

The initial full run had 99 passes and one existing date-sensitive test failure: the phone utility journey expected today's month in the alert although its actual bill due date, four days later, was in the next month. Corrected the assertion to check the actual due-month cycle and reran that journey successfully. No application billing-cycle rule changed. Initial evidence: `data/manager-directory-full-test.log`; final full-run evidence: `data/manager-directory-full-test-final.log`.

Final fresh `npm.cmd test`: **100 passed, 0 failed, 0 cancelled, 0 skipped**, approximately 228 seconds. `git diff --check` passed. These are isolated automated results, not actual-device/provider accuracy or formal participant evidence.

Remaining improvements identified during this focused QA:

- **Billing summary clarity:** Tenant Overview currently summarizes only `tenant.bills[0]`. A latest water bill can therefore show Rent as zero despite separate rent records. Clearly distinguish a single-bill summary from account balances, and show category totals with their own actual dates.
- **Whole-unit rent versus Tenant share:** shared Tenant rows/header show the unit's configured monthly rent. Label that as whole-unit rent and distinguish the actual personal share; do not change allocation rules.
- **Enrollment guidance:** explain original lease versus assignment dates and make the default-to-lease behavior clearer. Keep advanced date changes and history safeguards available.
- **Acceptance:** finish actual authorized provider formats, physical phones, receipt printing and separately configured notification delivery. Browser emulation and synthetic fixtures do not complete those checks.

The running showcase was checked by reading pages and opening Tenant panels. Disposable portfolios were used for automated writes. No working Tenant/bill/payment records were reset or changed, no external mail was sent/received, and no Git push was made.

## Chapter III verification - 28 October 2026

Fresh complete run: **99 passed, 0 failed, cancelled or skipped**, approximately 327 seconds. Shareable transcripts and environment/fixture/API measurements are in `reports/updates/chapter-3-*2026-10-28.*`, relative to SeCapstone. The initial run's 98/99 result is retained separately: a browser expectation used the current month despite its test bill due date crossing into November. The app's November cycle was correct; the test now expects the due month and explicitly checks it. The targeted journey passed before the final full run. An obsolete hardcoded date in the older header-only timing artifact was also replaced with actual measurement time.

The separate evidence collector uses disposable data without .env, mail or external delivery. It records 5 cases/9 representations, 36 direct-text and 18 OCR exact field matches, and two 50-request complete-response loopback API groups. These measurements have explicit small-dataset, initialization, resource-sampling and generalization limits. All paper numbers were checked against the JSON. Chapters I-II citation metadata and Staff wording were corrected; Chapter III now reports these development observations and formal-evaluation limits. Google/local text parity, three tables/three diagrams, no native bullets, effective Arial 12/justified/200% body formatting and the 52-page PDF were checked. No participant or physical-device outcome was fabricated.

## Final UI polish and documentation alignment - 27 October 2026

Implemented clearer Case Sheet next steps, collapsed extracted details for pending/processed cases, one Tenant utility disclaimer in the billing footer, readable phone correction fields with decimal keyboard hints, and stacked phone correction actions. Failed source previews now expose Retry original; failed Manager dashboard, operational bills, Tenant home/bills/notifications reads expose Try again. These retries do not replay financial writes. Existing permissions and server billing rules were preserved.

Fresh full suite after all application changes: **99 passed, 0 failed, 0 cancelled, 0 skipped**, approximately 273 seconds (`data/ui-polish-full-test.log`). The three targeted journeys also passed (`data/ui-polish-targeted.log`). Added assertions deliberately fail protected source retrieval and Tenant home loading, then verify recovery, preserved correction fields and continued operation. The local email verification passed real MIME/PDF parsing, expected fields, Tenant bill/alert and duplicate hold (`data/ui-polish-email.log`); no external messages were sent or received in this pass.

Refreshed 49 UI PNGs, three email previews and the icon comparison using disposable synthetic data, with no recorded page overflow or browser runtime errors (`data/ui-polish-previews.log`). Inspected the refreshed Manager phone decision view and the updated manuscript discussion page. The user manual now explains the Case Sheet and retries; the manual test guide removes obsolete role-button instructions and includes the three-person walkthrough and actual provider acceptance procedure. Actual provider formats, intended-recipient delivery, physical phones/Push and formal user evaluation remain pending and are not counted as passes.

Five Chapter III paragraphs were updated locally and in the connected Google Doc to describe implemented UI rather than a future redesign. All five replacements matched once and passed readback; the document retains 283 text paragraphs/cells with no native bullet items. Checked edited paragraphs retain justified alignment, 200 percent spacing and 12-point text; the existing research title, Chapters I-II and references were preserved. The refreshed Google-exported PDF remains 49 pages and includes the updated discussion. Local manuscript payload was regenerated. No Git commit/push or working-portfolio mutation was performed.

## Final regression rerun - 27 October 2026

Reran the complete current suite after the Case Sheet implementation and preview refresh: **99 passed, 0 failed, 0 cancelled and 0 skipped**, approximately 260 seconds. Command: `npm.cmd test`. Evidence: `data/final-regression-test.log`. No application changes were needed during this rerun. `git diff --check` also passed; Git reported line-ending conversion notices only.

Coverage includes the four-role permission boundaries, Staff correction submission and Manager decisions, protected source previews, Tenant isolation, portfolio changes, real PDF/text/image extraction fixtures, duplicate handling, exact allocation, rent reports and receipts, reminder/email rules with test transports, held-email recovery, backups, session persistence, workspace isolation, and responsive UI journeys. The responsive page audit checks 1440, 820, 390 and 320 px viewports. This is automated regression evidence using development fixtures, not confirmation of live Gmail delivery, physical-phone Web Push, representative OCR accuracy, comprehensive security or measured production load. Working portfolio data and credentials were not changed by this test run.

## Shared Case Sheet and design cleanup - 27 October 2026

Implemented the selected Case Sheet in Bills & Payments > Exception Queue, using shared Staff/Manager components and existing API permissions. Related source exceptions form one selectable case. The sheet keeps extracted values, authenticated original access and proposal state separate. Staff prepares a correction with a reason; Manager authorizes, rejects or corrects directly. Pending Staff proposals remain read-only. Held-email retry and other non-bill cases retain their existing controls. No backend, database schema, financial rule or working portfolio was changed.

Fresh full regression: **99 tests passed, zero failures, cancellations or skips**, using `npm.cmd test`, approximately 303 seconds. Evidence: `data/case-sheet-full-test.log`. The three targeted browser journeys also passed before the full run (`data/case-sheet-targeted.log`). They cover Staff submission, Manager rejection/revision/authorization, protected originals, Tenant isolation, held-email retry/close, phone PDF correction, allocation, calendar, personal utility marks, duplicate intake and real image OCR. Staff checks additionally verify required reasons, retained input after a simulated failed save, no premature proposal record, and no second submission control while pending. Tests were updated to use the actual Case Sheet controls and explicit case selection after reload.

Refreshed all 49 UI PNGs, three email previews and the icon comparison against disposable synthetic data. The capture run checked horizontal page overflow and browser runtime errors. Staff desktop and phone Case Sheets and the Manager phone decision screen were visually inspected. Evidence: `data/case-sheet-previews.log`; [current gallery](../../reports/mockups/README.md). Physical devices, live Gmail/provider delivery, performance benchmarks and formal participant evaluation are not established by this run.

Consolidated 76 superseded concept files from four folders into one verified ZIP with a SHA-256 manifest. The active [design index](../../reports/design-concepts/README.md) retains one reference SVG/PNG pair and links to implemented screenshots. Current source, sample bills, diagrams, manuscripts, credentials and application records were preserved. No Git commit or push was made.

## Shared interface and source comparison ? 27 October 2026

Applied the approved blue workspace presentation with fewer repeated containers, a Manager list of individual pending decisions, compact Staff queues, and a rent-first Tenant home with utilities below rent. Existing desktop sidebar timing, phone bottom navigation, calendar rules and monochrome receipts are preserved. Staff correction proposals now reuse the authenticated original-source preview used by Manager review. Preview requests abort and temporary blob URLs are released on close. No backend, database, billing rule, integration setting or role authority was changed.

Ran all 12 existing browser journeys. Eleven passed initially; the responsive audit stopped at its hard-coded previous desktop top-bar color. Updated only that expected color to the approved palette and reran the complete responsive audit successfully. Its desktop, tablet, 390px and 320px checks retain overflow, touch-target, named-control and runtime-error assertions. Other passing journeys cover broad role/CRUD/payment/receipt/session behavior, held-email controls, reduced motion and unsaved edits, portal alerts, cross-role login, protected source review on desktop/phone, Staff proposal/rejection/revision/authorization and Tenant isolation, Admin status, Tenant profile persistence, the actual phone-sized utility intake/OCR/calendar/tracking path, and independent workspace sessions. The Staff journey additionally verifies original-source access while proposing a correction. Evidence: `data/ui-redesign-browser.log` and `data/ui-redesign-layout.log`. This is browser regression evidence, not a newly repeated 99-test full suite or physical-phone acceptance.

Refreshed 49 UI PNGs, three email PNGs and the icon comparison using disposable synthetic records, with no working portfolio/configuration change or external messages. The capture run checked page overflow and browser errors. Its initial new Staff screenshot selection assumed a Returned case existed; the synthetic source was Manager-owned, so the capture was changed to open an actual unfinalized source through Staff intake. The final capture run succeeded. Inspected the Manager dashboard, Tenant desktop/mobile home, Staff dashboard/source comparison and Admin overview. See [interface direction](interface-design.md), [current screenshots](../../reports/mockups/README.md) and `data/ui-redesign-previews.log`. Physical devices, live delivery, performance benchmarking and formal user evaluation remain separate acceptance work.


## Five-journey verification after fallback rollback - 23 October 2026

**Fresh full run: 99 tests passed, zero failures/cancellations/skips**, using `npm.cmd test`, about 328 seconds. Local evidence: `data/workflow-verification.log`. Application behavior was not changed in this pass; the added test covers persistence across application/SQLite close and reopen. The locked-PDF summary fallback remains removed.

| Journey | Automated evidence |
| --- | --- |
| Valid utility intake | Scheduled startup retrieves a simulated mailbox message, then uses real MIME/PDF extraction, full account mapping, exact allocation and linked portal alerts without manual Sync. Existing real image/scanned-PDF OCR checks also passed. |
| Problem bill | Browser Staff investigation/proposal, Manager rejection with a reason, revision and authorization passed. Separate checks retain live values until authorization, roll back invalid decisions and enforce Staff/Manager/workspace authority. |
| Duplicate | Repeated mailbox UIDs, repeated uploads and equivalent email/document copies did not create an additional charge. Duplicate holds remain intentional. |
| Rent and receipt | Tenant report, rejection/resubmission, Manager confirmation, receipt viewing/download, immutable receipt data and repeat-confirmation reuse passed. Utility marks remain personal and produce no utility receipt. |
| Restart, isolation and responsive use | The new file-backed test closes/reopens the application/database, preserves utility bills/source bytes/alerts/session/rent receipt, skips the old mailbox UID, imports a newly eligible bill and serves the old confirmed receipt through authenticated HTTP. Browser tests check separate users/workspaces, phone-sized interactions, layouts and page errors. |

No live Gmail/SMTP/Push access, demo reset, credential/mapping change, new product feature or Git commit/push was performed. The full suite includes deliberately injected job failures; those console messages test failure isolation and are not failed assertions.

Limits: this was automated local verification with synthetic/disposable portfolios and simulated mailbox transport. It does not establish actual Android hotspot/certificate/touch behavior, a fresh provider-origin email, delivery to real recipients or representative OCR accuracy. The earlier live Gmail self-test below is dated evidence, not a new live test in this run. Follow [the five phone journeys](manual-test-guide.md#five-journeys-to-check-on-the-actual-demo-phones) for hands-on acceptance.


## Intake, work queues and phone readability ? 23 October 2026

**Final fresh full run: 98 tests passed, zero failures/cancellations/skips**, using `npm.cmd test` (about 324 seconds). The local log is `data/queue-improvements-final.log`. Checks use disposable records, not actual participants or payments.

- Incoming results now distinguish Processed, Needs review, Duplicate and Processing, with result filtering, an empty-result explanation, actual mapped unit codes and recorded failure reasons. Duplicate holds keep their existing validation restrictions.
- Staff queues separate Needs action, With Manager and Returned. Pending proposals supersede older returned decisions for the same source. Proposal history remains under All cases.
- Manager's Your decisions puts Staff proposals, rent reports and escalated cases first. Pending proposals are not counted again as escalated cases. Existing operational capabilities remain available.
- Phone intake and Tenant bill rows have clearer amount/date spacing, wrapping, abbreviated visual references and touch-sized controls. Full references remain available in the original/source or existing receipt controls.
- Automatic processing now distinguishes the last mailbox attempt from cycle completion, shows the next eligible check and practical setup/failure guidance, and labels its page-load snapshot. It adds no continuous polling.

The first full attempt had 97 passes and an intermittent profile-field reset in the broad browser journey. A standalone rerun passed, then a controlled delayed-response test reproduced redundant same-route rendering while loading. The application now shares an in-progress render for the same account, role and URL. The controlled regression, subsequent editing/save check, rejection?revision?authorization journey and final full suite passed. No timing delay was added to the UI to conceal the issue.

The screenshot review then removed an empty category chip on unmapped sources and formatted proposal amounts as currency. Three focused queue/Staff browser checks passed after the display changes; regenerated previews exercise the final rendering. Refreshed 47 UI screenshots, three rent-email PNGs and the icon comparison with disposable data, including dedicated phone intake and Manager decision views.

This pass did not access Gmail, send messages, reset working data, change billing calculations/permissions or add dependencies. Automated responsive checks do not replace actual Android network, touch, certificate or delivery acceptance. See the latest screenshot gallery after preview refresh.


## Live Gmail filter and scanned bill - 23 October 2026

**Live self-test passed.** After the user saved the Gmail rule (To `rentara2026@gmail.com`, Subject `Group 3 Demo`, apply `Rentara-Group3-Demo`), sent one explicitly authorized synthetic Unit A PDF email from the property account to itself. SMTP acceptance, presence of that exact message under the demo label, exact message-ID/attachment-hash matching and a completed IMAP intake record were verified. The verification tool did not manually label or append the email. This is observed routing success after the user's filter setup, not an API inspection of Gmail filter settings.

The normal automatic scheduler retrieved the email and performed actual scanned-PDF OCR (`pdf_ocr`, one scanned page). It validated the G3000101 source and created two Unit A bills of PHP 450.00 each (PHP 900.00 total), due 29 October 2026. Both assigned Tenant accounts could retrieve their bill and had a linked portal alert. A repeat mailbox sync retained the same bill IDs and created no additional charge. SQLite foreign-key check returned zero violations.

Timestamped SQLite backups were taken before sending and before test intake. The private result is `data/group-demo/live-gmail-test.json`; its message ID guards against accidental repeat submission. Use `tools/verify-gmail-demo.mjs --verify` to inspect/resume the recorded test instead of sending it again. This run kept rent-email sending and Web Push delivery disabled; the only SMTP submission was the authorized self-addressed incoming-bill fixture. No Tenant email or utility receipt was issued.

Limits: synthetic bill sent through actual Gmail, not an actual provider-origin email or independent OCR accuracy sample. Actual phone display/links, provider formats, scheduled real-time reminders and deferred device Push still need their own checks. The tool ran one automatic startup cycle and closed; start the normal demo server to continue portal access/background work. Source code changes for the live-check helper passed syntax checks; the previous full-suite 96/96 result predates this helper and was not repeated for the external check. Nothing was committed or pushed.

## Automatic workflow verification - 23 October 2026

**Latest full suite: 96 passed; zero failures, cancellations or skips**, approximately 299 seconds (`npm test`, one test file at a time). The runtime and test changes are implemented; real Gmail/phone delivery remains separate acceptance work.

- Confirmed normal and demo startup call the same scheduler. Existing parsing, validation, allocation, notifications and approval rules were reused rather than replaced.
- Added independent per-job outcomes: rent/reminder errors no longer skip mailbox intake and remaining delivery jobs; a channel-level exception does not stop the other channel. Failed mailbox attempts retain five-minute spacing. Existing transport retries/uncertain-send protection remain intact.
- An actual startup/periodic timer with a simulated mailbox ran real MIME/digital-PDF parsing through validation, source billing and a linked Tenant portal alert without a manual Sync request. Persisted UID/source protection retained one charge across later cycles. No real Gmail connection or email send occurred.
- Controlled failure tests verified independent continuation, serialized cycles, shutdown waiting for active work, bounded status storage and absence of test secrets in returned status.
- Read-only `/automation/status` was verified for Staff/Manager with current workspace isolation; Tenant/Admin denied. Reading status did not start jobs. Staff's browser checked the new Incoming Bills disclosure. The existing Admin maintenance views remain separate.
- Fixed test synchronization discovered during parallel runs: retry verification awaits the actual processing response; upload-count verification waits for request dispatch; login/source-review helpers wait for the rendered home page before navigating/opening dialogs. Business, permission and duplicate assertions were retained. The final full/browser npm commands use one test file at a time to reduce competing browser/OCR workers; application-user concurrency is unchanged.
- Existing real image/scanned-PDF OCR, rent, receipt/advance, Staff proposal rollback/authorization, portal alert, reminder, workspace, recovery and responsive browser cases passed in the full run.

The latest automatic-cycle status uses one small settings record per workspace, saved at cycle start/end, not a growing per-minute audit trail. Job completion indicates an executed job, not guaranteed provider accuracy, external delivery, readership, verified payment, 24/7 service or completed participant evaluation. No dependency/schema migration, live data reset, integration enablement, Git commit or push was performed.

Refreshed 45 UI screenshots, three rent-email PNGs and the icon comparison using disposable synthetic data; inspected the updated billing screen. No operating data or configuration changed, and no message was sent by preview generation.

Restart the existing backend to load the new scheduler/status route. See [automatic workflow](automated-workflow.md) for startup, timing, failure states and manual acceptance. Gmail's one-time filter, a fresh real labelled bill, actual device access and deferred Web Push delivery remain to verify.

## File cleanup verification ? 23 October 2026

After the Staff implementation, consolidated the Manager Settings implementation, removed unused mock typedefs and disabled demo-login branches, and archived superseded plans with updated links. **All four targeted browser checks passed**, with zero failures/skips/cancellations, approximately 165 seconds: broad role/CRUD/settings/session workflow, cross-role routing, Staff-to-Manager proposal journey and all-role responsive UI audit. No backend/database behavior changed in this cleanup; the 92-test full-suite result below is the preceding Staff verification, not a newly repeated full suite after cleanup.

The final file-reference scan found no missing literal local source imports/assets or broken local Markdown file links. Syntax and scoped diff-whitespace checks passed. Actual Gmail/phone/Push acceptance remains pending as previously documented. See [cleanup record](project-cleanup.md) and [current development map](development-guide.md).

## Staff revision verification ? 23 October 2026

**Latest full suite: 92 passed, zero failures, skips or cancellations**, approximately 195 seconds (`npm test`). New Staff service/HTTP/migration checks also passed separately after the descriptive-edit side-effect safeguard: 6 passed. A focused browser rerun covering login, role switching and responsive pages passed 3/3 before the full run. Local disposable fixtures are development evidence, not participant results, representative accuracy or production certification.

- Staff proposal stays separate from live data; successful Manager decision revalidates and allocates once with actor attribution.
- Invalid multi-field approval rolls back source, corrections and generated bills. Changed context/disabled preparer produces stale; rejection retains reason; repeat decisions cannot duplicate billing.
- Staff cannot create billing-linked enrollment, write financial fields, confirm rent, authorize proposals or access another workspace. Contact edits do not rewrite assignments, leases, credits or login email. Private Tenant documents remain excluded.
- Real browser journey checked ordinary login, Staff mobile correction submission, Manager authorization, resulting Tenant bill, Tenant denied operational access, Admin Staff/business filtering and no page runtime errors/overflow.
- Existing intake, direct corrections, billing/allocation, rent confirmation/advance/receipt reuse, personal utility marks, reminders, workspace isolation, recovery and all-role browser checks remain passing.
- Additive proposal-table migration preserves existing records and passes SQLite foreign-key checks. Group 3 was backed up before adding its Staff account; its bills/Tenants/mappings were not reset. Setup and screenshot refresh sent no email or mailbox request.
- Refreshed 45 UI PNGs, three email PNGs and icon comparison using disposable synthetic data. Staff dashboard/mobile exceptions/account previews were added; login role/demo shortcuts were removed. Inspected Staff desktop/mobile and Manager dashboard PNGs.
- All three draw.io files were updated and checked for well-formed XML and valid edge references. No installed draw.io exporter was available for rendered connector/layout verification. Chapter I/II revised Markdown was updated; the original PDF was not overwritten.

An earlier full run caught test assumptions about deleted login shortcuts, narrow Admin cards and a profile-response timeout. The login assertions/mobile wrapping were fixed, and profile checks now capture the actual PATCH response before asserting the submitted/saved phone number. The final full run passed; do not replace entered-value assertions with timeout retries.

Still required manually: newly sent Gmail bill and one-time routing filter; two actual Android devices on current trusted HTTPS; authorized live rent-email delivery; optional Web Push delivery (retained, deferred); final draw.io layout/export and manuscript PDF review; group/adviser acceptance. Automated passes do not establish external delivery, readership, payment verification, resource capacity or usability results.

See [implementation handoff](staff-implementation-plan.md), [manual acceptance guide](manual-test-guide.md) and [targeted security review](staff-security-review.md).

## Previous verification ? 22 October 2026

Previous complete verification: **22 October 2026**, repeated for the professor-demo readiness review after the intake/recovery improvements.

**83 tests passed; zero failures, cancellations or skips.** The latest repeated run took approximately 258 seconds; the earlier intake/recovery run took approximately 215 seconds. Earlier complete runs passed 77 tests on 22 October and 76 on 20 October. This is local development evidence, not participant evaluation, a capacity benchmark or production certification.

## Professor-demo readiness review — 22 October

- Repeated the full backend/browser/OCR/recovery/workspace suite: 83 passed, no skipped or cancelled cases. No application code change was needed in this review.
- Verified the demo ZIP's integrity and all 11 input/metadata entries against current fixture hashes. Startup PowerShell helpers passed syntax checks.
- Read-only checks confirmed active initial-password demo accounts in both portfolios and zero foreign-key violations. Showcase: two workspaces, 20 bills, one pending rent report and nine receipts. Acceptance: one workspace, five bills, no pending reports/receipts and the matching water-test mapping. Counts can change during rehearsal.
- A local GET returned HTTP 200 from the showcase on port 8080. The acceptance server on 8443 was not listening at that checkpoint; start it explicitly before using its mapped sample files. No server was restarted and no working data, credentials, mapping or live integration state was changed by these checks. Restart any previously running server before presentation to load current backend code.
- Current showcase mappings differ from the supplied acceptance samples. Already seeded Meralco/electricity fixtures should enter duplicate review; this is not a new OCR/billing failure. The pending rent report can belong to another Tenant: confirm the intended Tenant/bill before expecting its receipt under a particular login.
- External sending/retrieval was not repeated. The showcase configuration continues to block external channels. Real provider formats, Android Push display, phone-link access, physical printing and an actual copied recovery package remain acceptance gaps.

Use the [professor demo checklist](professor-demo-checklist.md) for verified logins, portfolio selection, sample behavior and the running order. The one-form Manager Tenant-account change remains deferred.

## Intake reliability, recovery and role stories — 22 October

- Reproduced an oversized email aborting the whole mailbox sync. The fix holds content failures once for Manager review, continues later valid bills, retains retryable transport/storage failures, and exposes partial-sync status. Existing UID, duplicate and workspace rules remain in force.
- Added Manager-only, own-workspace Retry email and Close email notice actions. A close requires a handling reason, actor and time, and neither validates a replacement bill nor creates payment/receipt records. API tests reject Tenant/cross-workspace access; an actual 390px browser journey exercises both buttons and the visible handling reason.
- Admin backups now contain a consistent SQLite snapshot and the referenced source/document files from every workspace, with a checksum manifest written only on completion. Restore verifies paths, files, reference coverage and database integrity, refuses an existing destination, and revokes old sessions. Synthetic recovery tests retain confirmed rent/receipts, document bytes and separate workspace paths; corrupt/missing/path-traversal cases are rejected. The existing Admin browser test now verifies the actual manifest rather than the former filename toast.
- The first full run exposed that outdated toast expectation; after updating the assertion to the complete-package behavior, the full suite passed all 83 tests. No production data repair, real provider import, live sending or integration configuration change was performed in this task.
- [Manager and Tenant user stories](user-stories.md) distinguish implemented functions from real-provider/device acceptance and role-specific improvements. [Recovery instructions](backup-and-recovery.md) explain the complete-folder handoff and separate restore procedure.

Actual provider formats/mappings/filter setup, Android Push permission/delivery, phone email links, printing and a copied recovery package on the intended device remain acceptance items. The running application must be restarted to load changed code; no live server was restarted as part of this isolated verification.

## Manager workspace review — 22 October

- The full suite passed after adding a regression for independent mailbox configurations and failure isolation. A simulated failed job in workspace A did not stop workspace B on either of two scheduler cycles; workspace B's status record remained invisible in workspace A. No live mailbox connection or external sending was performed during this review.
- Existing HTTP/browser tests passed for separate Manager sessions, own-workspace records, related-record validation, files, receipts, exports, settings, concurrent requests, membership-change session revocation and independent duplicate detection. Scheduler/email tests used controlled transports, not real recipient messages.
- A separate read-only inspection of the configured showcase found two active workspaces: the default workspace has one Manager and three Tenants; the second demo workspace has one Manager and one Tenant. SQLite reported zero foreign-key violations. No showcase business record or integration setting was changed.
- Separation is **per workspace/business**, not automatically per Manager account. Managers assigned to the same workspace share that business portfolio. An independent owner/business needs its own workspace and explicitly configured integrations.
- Workspaces still share one Node process and SQLite database. The tests verify the covered access and scheduling behavior, not unlimited workload capacity, separate machines, real-provider compatibility or fresh Android Push delivery. The remaining acceptance list below still applies.

That earlier workspace-only review changed a test and documentation; the subsequent intake/recovery work above also changes application behavior. No manuscript, credentials or live integration settings were changed. No Git commit/push was performed.

## Verified locally

| Area | Evidence |
| --- | --- |
| Billing and payments | Rent cycles, centavo allocation, corrections, Manager confirmation, final-cycle credit and receipt reuse passed regression checks. |
| Bill intake | Supported PDF/image extraction, email parsing, exception handling and duplicate protection passed isolated checks. |
| Tenant and Manager journeys | Actual browser journeys cover review, reporting, personal utility marks, receipts, notifications and settings. |
| Access control | Authentication, role restrictions, own-record access and independent workspaces passed checks. |
| Edited forms | A regression reproduced unsaved phone-number loss from delayed route events. The fix preserves edits; saving and reload now pass. |
| Responsive layout | Automated checks cover desktop, tablet and phone widths, control names and horizontal overflow. |
| Renamed folders and samples | Startup-helper syntax, current links, five case records and isolated sample generation were checked. Moved sample/report hashes were preserved. |
| Gmail authentication and controlled rent email | Authentication succeeded. After separate explicit approval on 20 October, SMTP accepted one labelled synthetic rent update to the agreed team inbox; an exact-Message-ID lookup verified its presence in INBOX. Only that test message's content was fetched. |
| Acceptance setup | A separate portfolio accepts the anonymized Meralco fixture, maps it to the agreed Tenant, skips seed notification delivery, preserves changes on rerun and refuses to replace another portfolio. |
| Email-to-bill acceptance | Real MIME/PDF extraction matched the synthetic case's expected fields, assigned the Tenant bill, created its portal alert and blocked an email-summary duplicate. An unrelated text attachment no longer suppresses a valid summary. |
| Mailbox lifecycle | Simulated IMAP tests verify processed UID skipping, UID-validity changes, bill-level duplicate protection, Manager access and cleanup/retry after interruption. Actual provider-mailbox behavior remains unverified. |
| Live utility retrieval | After explicit approval, a clearly labelled synthetic PDF email stored in the dedicated Gmail label was retrieved through actual IMAP, validated, assigned to the acceptance Tenant and linked to a portal alert. Repeat sync and rerun imported no extra charge. The restarted HTTPS API returned the resulting electricity bill. This is live transport evidence using synthetic content, not an actual provider bill. |
| Acceptance integration isolation | Tests verify retrieval defaults off, explicit dedicated-label opt-in, rejection of another account/general inbox, fixed acceptance data directory, disabled workspace overrides and rent email always off. |
| Local HTTPS | Invalid TLS settings fail before database creation. A separate HTTPS smoke check verified the local CA chain, IP certificate, Tenant login, origin rejection and blocked private files without disabling certificate validation. Android trust and real Push delivery remain manual checks. |
| Held emails and recovery | New synthetic/API/browser checks verify content isolation, protected retry/closure, partial-sync feedback and complete database/file restore. Actual recovery on another device remains unverified. |

The current sample set contains one anonymized actual-layout Meralco bill and four synthetic cases, represented by nine input files. Alternative versions do not increase the number of independently collected bills.

## Still needs acceptance

- Actual provider email retrieval through the configured mailbox.
- Opening the verified rent self-test email's portal link on the receiving phone; delivery to other recipients remains unverified.
- Web Push on a supported actual device and secure context.
- Additional authorized provider bills with manually checked expected values, especially Manila Water.
- Real-device usability, physical printing/Save as PDF, and operational backup/restore acceptance.
- Planned participant evaluation and representative OCR accuracy measurements.

Showcase data continues to block external messages. Local tests and authentication alone do not establish inbox delivery, device display or general OCR accuracy.

The acceptance profile disables rent email sending. Utility retrieval defaults off but is now explicitly enabled for the dedicated **Rentara-Utility-Acceptance** Gmail label. Startup checks that setting and never scans the general inbox through this profile. The running acceptance server was restarted with intake enabled. Stable VAPID keys and the certificate are configured, but the Windows trust store and Android devices have not been modified automatically. Start, pause and certificate-transfer instructions are in the [local acceptance guide](local-acceptance-setup.md). The showcase remains the normal startup database.

An initial restricted rent-email attempt failed and automatic review required separate explicit permission. After the user granted it, one labelled synthetic rent update was accepted by SMTP and its exact message was found in the agreed team's INBOX. No other INBOX message contents were fetched and no actual payment was recorded. Outgoing rent mail remains off. A later separate instruction approved utility retrieval from the dedicated label, which is now enabled and verified with synthetic content. These checks do not prove provider-format compatibility, readership or phone-link access. The acceptance database had zero device Push subscriptions at the earlier readiness check. See [email billing acceptance](email-billing-acceptance.md) for the safe repeatable command and remaining actual-device steps.

## Commands and guides

Run from `SeCapstone/rentara-portal`:

```powershell
npm.cmd test
npm.cmd run integrations:check
```

`npm.cmd test` limits concurrency to two files. `integrations:check` reads default-workspace configuration presence without connecting, sending, importing or printing credentials.

Use the [manual guide](manual-test-guide.md), [Gmail setup](gmail-local-setup.md), [sample catalog](samples/utility-bills/README.md), [system-status definitions](system-status.md) and [current screenshots](../../reports/mockups/README.md).

Earlier results, test counts and detailed issue histories are preserved in [historical QA checkpoints](archive/checkpoints/qa-history-through-2026-10-20.md). They describe their recorded dates and are not the current setup checklist. The [earlier core-billing record](archive/checkpoints/core-billing-verification.md) also retains historical investigation notes.
