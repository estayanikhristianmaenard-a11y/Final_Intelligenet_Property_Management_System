> Historical snapshot through 20 October 2026. Read [current QA status](../../qa-report.md) for the latest verified state. Earlier counts and limitations below describe their own checkpoints and are not current setup instructions.

# Historical QA checkpoints

Folder and sample organization verification (20 October 2026): after renaming the application to `SeCapstone/rentara-portal`, `npm.cmd test` passed **67 tests** with zero failures/cancellations/skips in approximately 184 seconds. Current path references, package metadata and the PowerShell LAN helper were updated; helper syntax, current catalog links and the credential-redacted integration checker passed. The `.env` hash matched before/after the folder rename, and private data/dependency folders remain Git-ignored.

Five bill cases now have `case.json` expectations. An isolated generator check produced seven synthetic input files and four matching metadata records without changing any existing sample or creating anonymized bills. Moved sample/report hashes were preserved. Current Report 4 source, Word export and submitted PDF are grouped together; older reports are archived. Submitted content and the approved title were not rewritten. Historical archived exports may retain the former application path.

Gmail authentication acceptance (20 October 2026): an authorized authentication-only check using the locally saved account settings succeeded for Gmail SMTP and IMAP. Nodemailer `verify()` established sending-service authentication; ImapFlow connected and logged out without selecting a mailbox or reading messages. The initial restricted-environment connection was blocked; the permitted network retry succeeded. No password or token was printed, no message was sent/imported, and no showcase safeguard was removed. This verifies authentication only; actual notification receipt, provider-bill retrieval and device link access remain separate checks.

Latest development verification (20 October 2026): `node --test --test-concurrency=2 tests/*.test.js` passed **67 tests**, with zero failures/cancellations/skips, in approximately 168 seconds. The same concurrency limit is now the default for `npm.cmd test`; `test:browser` includes the additional browser regression files.

The initial run exposed an outdated sidebar-duration assertion and intermittent loss of an edited Tenant phone number. A focused browser regression reproduced field loss when same-page route events arrived after editing. Same-page refresh now preserves dirty forms, while clean-page refresh and navigation discard confirmation remain supported. The focused regression passed after the fix; the final complete suite also passed. The profile workflow check now waits for the actual PATCH response and verifies both the submitted number and saved database value instead of relying only on a possibly older toast.

Added `npm.cmd run integrations:check`: a configuration-only default-workspace check with credential redaction, read-only database inspection, showcase blocking, and portal-link classification. Its tests cover missing/disabled/configured/showcase states and invalid URLs. Prepared non-secret Gmail settings locally; sending remains disabled, credentials are still required, and no email, Push or mailbox request was made. See [Gmail setup](../../gmail-local-setup.md). Live authentication/delivery, additional representative documents and actual-device acceptance remain pending; this run does not establish production readiness or participant evaluation.

Latest status pass (16 October 2026): the complete regression command `node --test --test-concurrency=2 tests/*.test.js` passed **64 tests**, with zero failures/cancellations/skips, in approximately 178 seconds while screenshot capture was also running. It includes actual OCR, billing, workspace isolation, all-role browser journeys and three new backend status checks. The added `tests/system-status.browser.test.js` subsequently passed its phone-width journey for single-request refresh, pending state, restored focus, evidence disclosure, snapshot retention on failure and independently available sections. A targeted Web Push regression also passed after tightening the acceptance timestamp rule for failed multi-device retries. These focused follow-up runs do not represent another complete-suite run.

All **42 UI/document PNGs**, three email PNGs and the icon comparison were regenerated with isolated synthetic data; capture checks found no horizontal overflow at the recorded viewports and no browser runtime errors. No working database/configuration changed and no external messages were sent. See [status criteria](../../system-status.md) and [screenshot findings](../../mockup-review.md). Live provider connectivity, actual inbox/device delivery, backup recovery and OCR accuracy on a representative evaluation set remain separate checks; the Admin view does not certify them.

Previous complete regression (16 October 2026, lightweight motion/form safeguards and audit pagination): `node --test --test-concurrency=2 tests/*.test.js` passed **61 tests**, zero failures/cancellations/skips, in approximately 110 seconds. New HTTP coverage reaches 123 synthetic history rows across pages, filters before paging, checks Philippine date boundaries, clamps excessive page requests, rejects invalid parameters, preserves legacy array responses and enforces Admin-only access without deleting records. The complete financial/OCR/workspace and all-role responsive suites passed.

The new browser journey checks unsaved route/dialog cancellation, settings reset and failed-save recovery, actual upload pending/error states with duplicate submission prevention, persistence of page 2 after reload, reduced-motion disabling and absence of third-party animation/font/CDN requests in that journey. Source-review and notification regressions also passed. Investigation fixed a navigation regression by coalescing popstate/hashchange pairs while retaining same-fragment refresh behavior. No existing test timeout or assertion was weakened.

The three new shared UI modules total approximately 4.8 KB of source; this is not a download-speed benchmark. Motion uses existing CSS/native APIs; no animation framework was added. Audit history is retrieved in bounded SQL pages with a timestamp index. Refreshed 40 UI/document PNGs, three email PNGs and the icon comparison using disposable synthetic data. New previews show processing with a deliberately paused response, unsaved settings and older audit records; no working data/configuration changed and no messages were sent. Real-device frame rate, low-end phone behavior and slow-network acceptance remain manual checks. See [performance and motion](../../performance-and-motion.md) and the updated [manual guide](../../manual-test-guide.md).

Latest complete regression (16 October 2026, screenshot-driven UI polish): `node --test --test-concurrency=2 tests/*.test.js` passed **59 tests**, zero failures/cancellations/skips, in approximately 89 seconds. Existing end-to-end checks now use the inline OCR Edit controls and expandable mobile filters. Added assertions verify copying the full receipt reference and returning the calendar to Today. The all-role responsive/typography/named-control audit passed. The filter disclosure preserves its open state through repainting, and calendar selected dates now expose explicit true/false ARIA values.

The earlier default-concurrency run passed 58 tests with one settings-navigation timeout; that audit passed independently and in the final two-file-concurrency run without increasing its timeout or weakening assertions. Current UI changes preserve existing API contracts, payment/receipt snapshots, utility ownership, financial rules and workspace isolation. Screenshot regeneration uses disposable synthetic data. Real-device animation/clipboard checks, live delivery and the existing acceptance gaps below remain separate from automated evidence.

Latest complete regression (15 October 2026, independent-owner workspaces): `npm.cmd test` passed **59 tests**, zero failures/cancellations/skips, in approximately 67 seconds. This includes the populated legacy migration/backup test, two-owner HTTP access and mutation tests, scoped scheduler and notification transport tests, Admin workspace/account browser setup, independent Manager browser sessions, and all existing financial/OCR/responsive regressions. The current showcase was backed up and migrated; default-workspace record counts and credential digest matched afterward, with no foreign-key violations. The updated local server was restarted and live logins passed for both Managers and all three showcase Tenants. Manager B's request for the default property returned 404, and Admin service health includes both workspaces. Current previews contain 30 UI/document PNGs, including Riverside's Manager desktop and Tenant phone screens. No external notifications were sent and no Git push was made.

See [workspace operating/migration guide](../../workspaces.md), [focused security review](../../workspace-security-review.md), and [manual cross-owner checks](../../manual-test-guide.md). This establishes tested local isolation; it does not replace hosted deployment acceptance, live per-owner mailbox/SMTP/Push checks, a restore drill or an independent security review. Older checkpoint counts below are retained as historical evidence.

Latest complete regression (15 October 2026, actual-layout Meralco follow-up): `npm.cmd test` passed **55 tests**, zero failures/cancellations/skips, in approximately 65 seconds. The user-supplied private two-page SOA exposed unsupported printed labels and OCR column ordering. Meralco-specific parsing now recognizes below-label CAN/due-date values, adjacent Bill Date columns, repeated period headers and an unrecognized currency glyph without inferring hidden account characters. Existing malformed-field and conflict checks remain. The original PDF's five target fields matched the inspected document after the fix; its private identifier was not logged in the verification result. The original remains unchanged and Git-ignored.

The new anonymized digital and raster PDF fixtures both recover all five target fields. Actual scanned-PDF OCR finalizes three correctly reconciled shared charges in an isolated database; the digital representation of that same bill is then held as a duplicate. Additional checks hold conflicting dates/periods and masked CAN rather than substituting SIN. Privacy verification checked removed identifying text and identifier tokens, cleared metadata/attachments/annotations/links, and reviewed both redacted pages visually. Monetary values and dates were intentionally retained for comparison. These are two representations of **one** real-layout source, not independent real-document samples or proof of general OCR accuracy. See [fixture provenance and usage](../../samples/utility-bills/README.md#anonymized-actual-layout-meralco-soa).

The 55-test run also includes the second showcase Tenant login isolation test. No working tenant charges or external messages were created by the SOA tests. Live mailbox receipt, real-device Push delivery and broader provider samples remain separate acceptance checks.

Latest complete regression verification (15 October 2026): `npm.cmd test` passed all **52 tests**, with **zero failures, cancellations or skips**, in approximately 58 seconds. This run includes the compact black-and-white receipt and workflow simplification changes. Added browser assertions cover the single utility review action, closing review without a saved correction, electronic-reference validation and clearing on Cash selection, expandable receipt history, and duplicate-free repeated rent-cycle checking. The phone upload journey also passed after disabling toolbar actions while billing data loads. It covers rent generation and allocation, payment reports/rejections/confirmation, advance credit, corrections and protected history, duplicate intake, real digital-PDF/scanned-PDF/image OCR, email parsing, reminder scheduling, portal notifications, ownership/session restrictions, storage deduplication, rent email transport behavior and calendar estimates. All six browser scenarios passed, including receipt viewing without automatic download, original receipt identity, no duplicate receipt, printing-control availability, downloads, role switching and the phone utility journey. The all-role page audit checks 18 routes at 1440, 820, 390 and 320 pixels (72 screen states) for overflow, control names, typography, touch targets and runtime errors. Tests use isolated temporary/in-memory data and substituted external notification transports; this is local regression evidence, not live-provider acceptance. Current previews include 28 UI/document PNGs, three email PNGs and the icon comparison.

Remaining manual acceptance checks: actual Gmail mailbox retrieval and rent email receipt in a real inbox; real-device Web Push permission/subscription/delivery; phone access over the local Wi-Fi network; physical printing or browser Save as PDF of the compact receipt; and extraction accuracy against additional authorized, representative Meralco/Manila Water bills. Synthetic OCR fixtures and simulated email/Push transports do not establish those results. Use [the manual test guide](../../manual-test-guide.md) to record device and usability results.

Previous complete-suite checkpoint (15 October 2026): the complete working-checkout suite passed all 50 tests in one run, with zero failures or skips. New checks cover Philippine-midnight due labels and the distinction between unconfigured, unverified and failed integrations. Existing billing, personal tracking, receipt, email, source-review and all-role responsive checks passed, including the corrected 320-pixel Admin health layout. The preview command regenerated 22 current UI/document PNGs, three email PNGs and the icon comparison from disposable synthetic data. See [Tabler adaptations](../../tabler-design-adaptation.md), [current screenshot index](../../../../reports/mockups/README.md), [Tenant/parsing/OCR update](TENANT_PARSING_OCR_UPDATE.md) and [core billing verification](../../core-billing-verification.md) for details and remaining live-integration checks. Older counts below describe their recorded checkpoints.

PropertyPro 2.0 Â· 11 October 2026

## 1. Readiness and source of truth

**Local integrated workflows pass the verification suite. Production/provider acceptance remains pending.** The final suite has 25 tests: 24 backend/integration scenarios and one comprehensive real-browser scenario. Live Gmail retrieval and external provider-to-browser push delivery were not verified because the supplied email address is made up and no live integration configuration/device subscription was provided. Those checks are not marked resolved.

The reference used when this QA report was prepared was the 51-page manuscript, now preserved at [additional manuscript reference](../../../../papers/archive/ADDITIONAL_MANUSCRIPT_51_PAGES.pdf). Pages 21â€“22 define the functions, pages 30â€“35 define rent/intake/allocation and the V01â€“R01 rules. The report also used the actual source and the previously reported QA-001â€“QA-026 register. The research PDFs were read without modification.

Repository organization update: the user-confirmed finalized baseline is the distinct [40-page manuscript](../../../../papers/FINAL_MANUSCRIPT.pdf). This report's earlier description of the 51-page copy as newer does not establish approval of that copy. Its verification provenance remains the 51-page reference; differences must be reconciled before claiming complete agreement with the finalized baseline.

Adjustments made to conform to that paper:

- The prior in-memory demo and simulated role selection were replaced by database-backed credentials and authorization.
- Equal splitting, fixed non-prorated rent, a separate first advance and three-day reminders are enforced policy. Conflicting settings choices are no longer editable toggles.
- V02 accepts a zero utility amount and valid period endpoints. An earlier implementation's extra condition that due date must follow period end was removed because the paper does not require it.
- R01 deduplicates the lease/month cycle. Consecutive individual leases in one unit/month can each have their applicable charge; a unit-only key would incorrectly suppress the replacement lease.
- Advance credit retains the original paid advance/receipt reference, does not generate another cash receipt, and can apply to a final unpaid bill generated before the advance was confirmed.
- Shared groups with conflicting anniversary configuration are held for C02 review. This implementation requires a common shared-group rent anniversary rather than guessing a schedule.
- The local demo is explicit and isolated. Its histories are generated through the same engine and payment workflows used by the real API.

The earlier no-code-change audit instruction was superseded by the user's subsequent master development/repair request. Changes are in the working tree; no production deployment, commit, or external message was made.

## 2. Requirements-to-implementation checklist

`Verified` means the stated local behavior has test evidence. It does not imply live-provider acceptance or ISO certification.

| Requirement | Implementation | Verification / status |
| --- | --- | --- |
| Persistent central storage and valid relationships | SQLite WAL; permanent keys, FKs, relationship indexes, transactions, assignments/leases, bills/lines/allocations/payments/receipts/corrections | T03, T09, T10, T23 â€” Verified |
| Distinct identities and real eligible occupants | Removed colliding/fictitious mock seed; one account link per tenant; actual tenant IDs for every allocation | T03, T06, T16, T25 â€” Verified |
| Property/unit/tenant CRUD and dates | Manager-only forms and API; individual overlap validation, date boundaries, protected deletion and historical changes | T02, T10, T18, T23, T25 â€” Verified within one-current-lease model |
| Utility email attachment intake | Real ImapFlow TLS adapter, UID/UIDVALIDITY deduplication, manual sync and five-minute polling; MIME attachment handling | T12 verifies MIME-to-bill; T10 verifies unconfigured failure. Live mailbox retrieval pending |
| Digital PDF and clear-image extraction | Real PDF.js text extraction and Tesseract.js with bundled English model; retained original files/raw text/confidence | T11â€“T14, T25 â€” Verified with generated PDF and clear PNG; provider layouts require acceptance |
| V01/V02 | Required/conflicting values; nonnegative centavo amounts, valid dates and ordered period; failures remain reviewable | T06, T07, T11, T14, T19 â€” Verified |
| V03/V04 | Unique normalized mapping; identical attachment and provider/account/period hold; original source remains correctable | T06, T11, T20 â€” Verified |
| C01/C02/A01 | Mapped electricity/water, valid individual/shared arrangement, eligible/frozen recipient list and integer reconciliation | T03, T06, T12, T16, T21 â€” Verified |
| R01 and anniversary rent | Original day, last-day fallback, generation=due date, coverage, first advance, lease cutoff, persisted cycle keys | T01â€“T03, T05, T15, T18, T24 â€” Verified |
| Advance credit once, without another receipt | Confirmed credit record; final-cycle application, revision, original receipt reference; review for protected/discrepant amounts | T04, T05, T15, T21 â€” Verified main paths; Manager settlement of confirmed discrepancies remains manual review |
| Shared equal allocation and centavo residual | Integer amounts and ascending permanent ID order; frozen recipients persist through corrections | T01, T03, T06, T12, T16, T21 â€” Verified |
| Manager corrections and retained history | Old/new field values, reason, Manager, revisions, revalidation; recurring failures retain the same open exception | T06, T07, T14â€“T16, T20â€“T21, T25 â€” Verified |
| Full payment report / confirmation / rejection | Tenant-only reporting, method/reference checks, line/status synchronization, rejected history, Manager confirmation | T04, T10, T17, T23, T25 â€” Verified |
| Unique confirmed receipt and real downloads | Receipt per confirmed payment; protected HTML receipt and actual document bytes, ownership and audit | T04, T23, T25 â€” Verified |
| Own tenant portal and inbox | Assigned unit, own bills/periods/balance/status/receipts/docs, permanent-ID-addressed messages | T10, T23, T25 â€” Verified |
| Web Push registration and background handling | Service worker, PushManager subscription path, persisted backend subscriptions, VAPID/encrypted transport, retries/expired endpoint handling | T22, T25 â€” Encryption/retry and actual worker installation verified; real enrollment/delivery pending |
| Three Philippine-calendar-day unpaid reminder, deduplicated | Server event scheduler; positive unpaid balance only; unique bill/due-date event | T01, T08, T24 â€” Verified locally |
| Portal independent of push failure | Notifications persisted first; browser denied/unconfigured handling; bill state unaffected by failed transport | T22, T25 â€” Verified |
| Frontend/backend role restrictions | Auth restore, session expiry/revocation, route guards and per-endpoint role/ownership | T10, T17, T23, T25 â€” Verified |
| Preserved UI and connected remaining actions | Original design system/shell; forms, cancel, searches, exports, profile, settings, Admin maintenance and downloads | T23, T25 â€” Verified connected representative paths; no redesign |
| Scope exclusions | No payment gateway/bank verification, tenant email, SMS, prediction, IoT, maintenance ticket, blockchain or mobile app | Source review; no such endpoints/modules added |

## 3. Test index and results

Backend scenarios are in [backend.test.js](../../../tests/backend.test.js). Browser scenario is in [browser.test.js](../../../tests/browser.test.js). [fixtures.js](../../../tests/fixtures.js) generates a real PDF/MIME message; `tests/fixtures/utility.png` is a real clear image. OCR/extraction are not replaced by fixture-returning stubs. The Web Push transport is intentionally substituted to avoid an unconfigured external send.

| ID | Scenario / assertions | Result |
| --- | --- | --- |
| T01 | Integer residual order, negative/extra-decimal rejection, February 31 fallback/leap year, Philippine calendar boundary | Pass |
| T02 | First rent/advance, subsequent ordinary rent, no rent after end, no duplicate cycles, FK integrity | Pass |
| T03 | Shared rent uses actual unique tenants; shares reconcile; eligible list retained | Pass |
| T04 | Invalid method/reference rejection, report â†’ reject â†’ resubmit â†’ confirm, line consistency, idempotent receipt, available advance | Pass |
| T05 | Confirmed advance applies once to the final applicable cycle | Pass |
| T06 | Missing amount â†’ queue â†’ reasoned correction â†’ shared utility bills; duplicate hold; confirmed record protected | Pass |
| T07 | Unmapped correction stays failed/open; repeated review retains the same exception ID without duplicating failures | Pass |
| T08 | Exact three-day unpaid reminder; event deduplication; reported bill excluded | Pass |
| T09 | File database and stored session survive close/reopen; logout invalidates token | Pass |
| T10 | Actual HTTP roles/ownership, settings persistence, prohibited policy rejection, inbox/read state, IMAP 503, private files and logout | Pass |
| T11 | Real digital PDF â†’ finalized bill; repeat processing idempotent; duplicate/malformed document â†’ queue | Pass |
| T12 | Real MIME email attachment â†’ text extraction â†’ reconciled shared bills, retained Message-ID | Pass |
| T13 | Clear PNG â†’ real offline English OCR â†’ correctly extracted fields/finalized bill | Pass |
| T14 | Conflicting extracted amount held; explicit affected-field correction removes conflict and revalidates | Pass |
| T15 | Advance confirmed after final bill generation applies to unpaid final; old revision retained; moving an applied final cycle rejected | Pass |
| T16 | Utility amount correction keeps frozen recipients after assignment change; prior revision retained; shares reconcile | Pass |
| T17 | Password reset/revocation, suspended account, last-Admin/self protection, expired session, Manager report denied | Pass |
| T18 | Consecutive individual leases within one unit/month are separate; replay generates no extra charge | Pass |
| T19 | V02 zero amount/valid earlier due date accepted; negative amount rejected; zero balance receives no reminder | Pass |
| T20 | Later identical failed upload cannot block correction of the original source | Pass |
| T21 | Reviewed unpaid rent correction recomputes frozen whole-unit shares/revisions; confirmed group rejected | Pass |
| T22 | Real encrypted Web Push request generation, simulated transport failure/retry, successful deduplication and retained portal record | Pass; test transport only |
| T23 | HTTP creates/edits/deletes and protects dependencies; file ownership/receipt download; CSV/range export; actual backup/reopen/integrity; 50 measured requests | Pass |
| T24 | A new assignment after an earlier same-day scheduler run is picked up on the next minute tick without duplicates | Pass |
| T25 | Real browser all-role routes, wrong credentials/server role, property/unit/tenant forms, full profile, inbox, document upload/download, mapping create/delete, source and rent corrections, exports, payment report/confirmation/receipt, settings/reload/preferences/password, service-worker activation, push-unconfigured handling, forbidden routes, root redirects, preserved handlers, mobile navigation, Admin account/maintenance, expired session | Pass |

Latest full run: **25 passed, 0 failed, 0 skipped**, approximately 21.5 seconds. Node 24.21.0, installed Microsoft Edge 155.0.4283.45, Windows PowerShell. `npm.cmd test` reproduces the run with temporary databases. All owned test HTTP servers, browser processes and OCR workers close in teardown.

Additional startup checks passed using an isolated temporary database: the actual setup CLI created accounts, the actual server CLI served the homepage and authenticated the initialized Manager, and repeated setup refused to overwrite the database. The owned server and temporary database were removed afterward. On the existing XAMPP Apache URL, `index.html` returned HTTP 200; `server/service.js`, `package.json` and `.env.example` each returned HTTP 403.

The browser test generated `test-results/admin-browser.png` (1440-pixel desktop viewport) and `test-results/mobile-tenant.png` (390-pixel mobile viewport). The mobile screenshot was visually inspected. Generated screenshots/results are ignored runtime evidence, not deployed tenant data.

## 4. QA-001â€“QA-026 resolution matrix

`Verified locally` resolves the identified local defect against the tests below. `Partial` retains the external acceptance gap.

| QA | Root cause verified in the original source | Affected files and correction | Evidence / result |
| --- | --- | --- | --- |
| QA-001 | `tnt-001` reused for Maria/B-203 and Bea/A-101; occupant links collided | Removed `src/api/mock/seed.js`; `server/store.js`, `bootstrap.js`, `service.js` use permanent keys/FKs and distinct actual occupants | T03/T06/T16/T25 â€” Verified locally |
| QA-002 | In-memory adapter discarded every mutation on reload/restart | Removed `src/api/mock/adapter.js`; `server/store.js`, `index.js`, `setup.js`, `src/api/client.js` use SQLite and live API | T09/T10/T23/T25 â€” Verified locally |
| QA-003 | API trusted frontend role checks and accepted unauthorized mutations | `server/index.js`, `service.js`, `src/auth/rbac.js` enforce role and ownership on every protected path | T10/T17/T23/T25 â€” Verified locally |
| QA-004 | Shell serialized the outlet through innerHTML, dropping listeners | `src/app/shell.js` moves the existing DOM outlet; `app.js` isolates pending route stages | T25 report modal still works after menu/badge refresh â€” Verified locally |
| QA-005 | Login ignored entered credentials/server user and switched demo roles | `src/auth/session.js`, `features/auth/login.page.js`, `components/sidebar.js`, `topbar.js`, `server/service.js` use real returned identity and remove demo-role grants | T10/T17/T25 wrong password and mismatched selected role â€” Verified locally |
| QA-006 | Correction controls discarded value/reason and merely changed queue state | `features/billing/exception-queue.js`, `app/workflows.js`, `server/service.js` persist affected field/old/new/reason/Manager, revalidate/recompute and retain recurring failures open | T06/T07/T14/T16/T21/T25 â€” Verified locally |
| QA-007 | Add/edit/delete/assign portfolio buttons had no operations | `features/properties/properties.page.js`, `units/units.page.js`, `tenants/tenants.page.js`, `app/workflows.js`, `server/service.js` connect forms and protected CRUD with lease/assignment dates | T02/T18/T23/T25 â€” Verified locally within documented tenancy model |
| QA-008 | No intake/OCR/rent engine; Sync/Manual controls inert | `server/integrations.js`, `rules.js`, `service.js`, `features/billing/bills.page.js`, `app/workflows.js` implement real extraction, IMAP and scheduler; label manual attachment action Upload source | T01â€“T03/T11â€“T14/T18/T24/T25 â€” Local extraction/rent verified; live mailbox retrieval pending â€” Partial |
| QA-009 | Manager settings Save/toggles/mappings simulated/hardcoded | `features/settings/settings-live.js`, compatibility `settings.page.js`, `app/workflows.js`, `server/index.js` store config/mappings and lock incompatible paper policies | T10/T25 configuration reload and mapping create/delete â€” Verified locally |
| QA-010 | Tenant profile/preferences/password changes returned success without storage | `features/tenant/tenant-settings.page.js`, `auth/session.js`, `server/service.js` save profile/preferences, verify current password and revoke sessions | T17/T25 phone/preferences persist and password change returns to login â€” Verified locally |
| QA-011 | Admin role/password/maintenance controls and health/audit were simulated | `features/admin/admin-settings.page.js`, `admin-dashboard.page.js`, `admin-audit.page.js`, `app/workflows.js`, backend account/maintenance routes report actual integrity/config/last observed integration state | T17/T23/T25 user creation, reset/revocation, health, backup, OCR restart, purge â€” Verified locally; health does not imply live-provider acceptance |
| QA-012 | Allocation arrays referenced 31 nonexistent occupant identities | `server/service.js`, `rules.js`, `store.js` calculate from eligible tenant records and freeze recipients | T01/T03/T06/T12/T16/T21 â€” Verified locally |
| QA-013 | Permission prompt was mistaken for actual Web Push delivery | `features/tenant/tenant-notifications.page.js`, `sw.js`, `server/index.js`, `integrations.js`, `server/keys.js` register/store subscriptions, encrypt/send through real adapter and distinguish unconfigured state | T22/T25 crypto/retry/worker activation verified; live browser enrollment/provider delivery unverified â€” Partial |
| QA-014 | Messages used display-name addressing and had no tenant inbox | `tenants/tenant-details.panel.js`, `tenant/tenant-notifications.page.js`, `server/index.js`, `store.js` save tenant-ID messages and show authenticated inbox | T10/T25 Manager message visible only in linked Tenant inbox â€” Verified locally |
| QA-015 | Document preview/download and receipt downloads had no files/handlers | `tenants/tabs/documents.tab.js`, `payments.tab.js`, `tenant-details.panel.js`, `tenant-bills.page.js`, `app/workflows.js`, backend documents/receipts routes serve actual protected bytes | T23/T25 lease upload/download and confirmed receipt download; denied other-tenant file â€” Verified locally |
| QA-016 | Bill line statuses were not synchronized with report/confirmation | `server/service.js`, `store.js` transactionally save bill, all lines and payment status on report/reject/confirm | T04/T23/T25 â€” Verified locally |
| QA-017 | Repeated confirmation generated more receipts/events/timestamps | `server/service.js`, unique receipts.paymentId in `store.js`, confirmation button guard return original confirmed payment | T04 preserved receipt/time/audit; T23/T25 receipt issued once â€” Verified locally |
| QA-018 | Invalid payment method/reference accepted; UI assumed cash | `app/workflows.js`, `tenant-bills.page.js`, `tenant-home.page.js`, `server/service.js` use explicit full-payment method/reference validation | T04/T25 E-wallet reference and invalid-method cases â€” Verified locally |
| QA-019 | Protected 401 left a stale authenticated UI/session | `src/api/client.js`, `auth/session.js`, `app/app.js`, `server/service.js` clear/revalidate tokens and render login on expiry/revocation | T09/T10/T17/T25 â€” Verified locally |
| QA-020 | Mark-all-read showed a toast without changing notification records | `tenant-notifications.page.js`, `server/index.js` persist only own read state and refresh unread badges/feed | T10/T25 â€” Verified locally |
| QA-021 | Root redirect denied valid users; global links assumed Manager | `auth/guards.js`, `app/shell.js`, `components/topbar.js` resolve role home/profile/alerts/search paths | T25 Tenant/Admin root redirects and forbidden route rejection â€” Verified locally |
| QA-022 | Counts/dashboard stayed stale after mutations | `app/app.js`, `shell.js`, `workflows.js`, feature callbacks reload derived backend records and badges; event handlers survive refresh | T10/T23/T25 creates, reports, confirmations and reloads â€” Verified locally |
| QA-023 | Exports/search/activity/source/profile buttons were disconnected | `app/workflows.js`, `reports/reports.page.js`, `billing/bills.page.js`, `dashboard/dashboard.page.js`, `tenant-details.panel.js`, `server/index.js` supply range CSV, searches, keyboard activity navigation, downloads and real profile form | T23/T25 CSV, source review, full profile, activity keyboard action and browser navigation â€” Verified locally |
| QA-024 | Modal bound only the first close control; footer Cancel failed | `components/modal.js` binds every data-close button; form dialog uses the same close callback | T25 cancel property/report dialogs â€” Verified locally |
| QA-025 | Singular unit endpoint/expected mock routes and options mismatched; range ignored | `src/api/endpoints.js`, `config/api.js`, `api/client.js`, `server/index.js`, `service.js` align live plural routes, filtering and report ranges; retired mock removed | T10/T23/T25 live units, settings, records, all-range export â€” Verified locally |
| QA-026 | Independently seeded bills/payments/receipts/activity contradicted identities, values or dates | Removed mock seed; `server/bootstrap.js`, `service.js`, `store.js` generate demo history through the actual engine and enforce transaction/idempotency/revision relationships | T02â€“T06/T09/T15/T16/T18/T21/T23/T25 â€” Verified locally |

## 5. Connected modules and end-to-end evidence

| Workflow | Result |
| --- | --- |
| Credential login â†’ server role â†’ permitted screen â†’ forbidden route rejection â†’ logout/session expiry | Verified through actual HTTP and browser |
| Property â†’ unit â†’ tenant assignment/lease â†’ Admin account â†’ own portal | Verified through CRUD forms/API and permanent relationships |
| MIME email fixture â†’ actual PDF text extraction â†’ configured mapping â†’ V01â€“A01 â†’ three shared bills | Verified; no live Gmail connection claimed |
| Clear image â†’ real bundled-model OCR â†’ validated utility charge | Verified offline |
| Missing/conflicting value â†’ same source's queue â†’ Manager field/reason â†’ revalidation â†’ finalization or continuing open exception | Verified, including preserved exception ID on repeated failure |
| Duplicate PDF/period â†’ duplicate hold; original source corrected once | Verified |
| Original anniversary â†’ short-month fallback â†’ first advance â†’ confirmed advance â†’ final-cycle credit and end cutoff | Verified, including late advance confirmation and repeat requests |
| Whole source â†’ integer equal shares/residual ordering â†’ frozen correction recipients | Verified for rent and utility |
| Tenant full report â†’ Manager rejection â†’ retained history â†’ resubmission â†’ confirmation â†’ synchronized lines/unique receipt â†’ real download | Verified backend; report/confirmation/download verified in browser |
| Manager tenant-ID message â†’ Tenant portal inbox â†’ persisted read state | Verified |
| Billing/reminder event â†’ retained portal notification â†’ encrypted push request â†’ transient transport failure/retry/dedup | Verified with test transport; external background delivery pending |
| New same-day assignment after scheduler's earlier run â†’ next-minute generated rent | Verified |
| Database close/reopen and session recovery; backup/reopen/integrity | Verified |

Database/API checks verified PK/FK integrity, protected dependent deletes, unique mappings/receipts/cycles/events, all three roles, other-tenant denial, CORS denial, private Node static-file denial, settings persistence, real downloadable file bodies, and SQLite backup consistency. The complete endpoint/table list is in [api-contract.md](../../api-contract.md).

## 6. Selected ISO/IEC 25010:2023 characteristics

**12 October finalized-baseline update:** the [40-page backend audit](../../../../review/FINALIZED_PAPER_BACKEND_AUDIT.md) identifies remaining manuscript gaps. Automatic advance settlement was replaced with explicit Manager confirmation; covered final bills now reuse the original payment/receipt and become Paid. Pending credit must be reviewed before reporting the remaining final balance. The earlier verification record below describes the previous build and does not establish full agreement with the finalized manuscript.

These are evidence-based evaluations of the five characteristics requested by the paper/user, not certification or a full standard conformance claim.

| Characteristic | Evidence and practical limit |
| --- | --- |
| Functional Suitability | 25 tests cover the required local billing/portfolio/role workflows and controlled failures. Live Gmail, external push and representative provider-layout acceptance remain open. |
| Performance Efficiency | 50 sequential authenticated loopback summary requests on a 3-bill fixture: mean **1.37 ms**, p95 **1.50 ms**, maximum **3.35 ms**. Actual extraction/worker tests finish within the suite. This is a small local sample, not a concurrent/load/large-portfolio benchmark. Raw current sample: `test-results/performance.json`. |
| Interaction Capability | Actual browser route/action/cancel/password/profile/download checks, keyboard activity navigation, preserved shell listeners, and 1440/390-pixel viewports. Mobile screenshot visually inspected. No formal accessibility audit or participant usability study was performed. |
| Reliability | Reopen/recovery/backup tests, immutable revisions, recurring exception retention, protected transactions, event/cycle/receipt idempotency, push failure independent of billing, same-day scheduler regression. Server downtime misses exact-date reminders; keep the service running. |
| Security | Server-side role/ownership, salted scrypt, hashed expiring/revocable sessions, input/money/date checks, explicit CORS, protected file paths, escaped HTML/receipts/CSV, account safeguard and dependency audit. PDF.js was upgraded to the patched 6.2.108 range; npm then reported zero known package vulnerabilities. No penetration test, full legal/privacy audit, or deployment hardening acceptance is claimed. |

## 7. Remaining issues, limits and dependencies

1. **Live email acceptance:** Supply a real property-management mailbox locally. The made-up Gmail address cannot authenticate. Provider IMAP enablement, valid app-password/OAuth authorization and token refresh must be configured; real UID polling/reconnect behavior has not been exercised against Gmail.
2. **Live Web Push acceptance:** Configure stable VAPID keys/contact/public HTTPS or localhost URL, register an actual device subscription and verify background display/click while the page is closed. Local worker activation/encryption/retry tests do not prove external delivery.
3. **Provider formats/OCR:** Real generated PDF and clear PNG fixtures pass. The extraction parser covers specified labels/ISO period endpoints. Real provider variants, noisy images and scanned PDFs require review; scanned PDFs need a clear image. Size/page/email limits are documented in the manual.
4. **Tenancy model:** One current lease/assignment per tenant record. Historical billed unit transfers and renewals under the same identity are protected rather than implemented as a multi-lease-history feature. This must be extended before using such workflows operationally.
5. **Financial discrepancies:** Unpaid cycles have a reviewed correction workflow. Already confirmed final bills and advance credits exceeding the final share remain reviewable; no retroactive receipt edit, bank refund or automatic settlement is invented.
6. **Runtime/deployment:** Keep the Node service running. Exact three-day reminders are not retrospectively sent for missed offline days. Configure HTTPS, private filesystem permissions, unique passwords, real allowed origins, monitoring and full-directory backups before production. SQLite supports this single-server architecture; large/concurrent deployment performance is unmeasured.
7. **Browser support:** Local Edge browser was exercised. Actual Firefox/Safari/iOS push enrollment/background delivery was not tested. Browser permission denial leaves billing available.

Accordingly, **24 local QA defects are verified locally; QA-008 and QA-013 retain live-integration acceptance gaps**. All 26 are accounted for in the matrix. The local demo/controlled evaluation is ready after the documented initialization and startup. Production readiness is conditional on the above external and operational checks.

## 8. Implementation and user guidance

Follow [user-manual.md](../../user-manual.md) for setup, Admin/Manager/Tenant tasks, mailbox and push configuration, exception correction, backup/recovery and scope. Run `npm.cmd test` from the portal directory to reproduce verification. Use an isolated demo directory for review; the implementation does not fabricate or overwrite operational tenant/payment data.

The website's original blank-page trigger was opening its module entry through `file://`. `index.html` now explains that startup requirement when opened directly. The working address is the server's printed HTTP URL, normally **http://localhost:8080/**, after database setup and `npm.cmd start`.

## 9. Routing regression update â€” 12 October 2026

An additional logout defect was reproduced in the localhost demo: the previous user menu's outside-click listener survived the login render and could replace that screen with stale shell markup when a role option was clicked. Logout also retained the previous protected URL, which could become an unauthorized destination for the next account.

`src/app/shell.js` now disposes its menu listener/timer and resets shell state when unmounted. `src/app/app.js` unmounts the shell for unauthenticated screens, sends logout/expiry to `#/login`, and ignores badge responses belonging to a previous session. `src/features/auth/login.page.js` honors saved destinations only when permitted for the authenticated account, retains allowed query strings, and uses the router even when the target hash is unchanged. `src/api/client.js` prevents a delayed 401 for an old token from clearing a newly authenticated session.

T26 in [routing.browser.test.js](../../../tests/routing.browser.test.js) verifies Manager â†’ Tenant â†’ Admin switching, logout URL/session cleanup, working Tenant Bills and reload, allowed/forbidden/unknown saved destinations, retained queries, role denial, mobile drawer cleanup on actual session revocation, and delayed old-account 401 handling. The complete local suite passed **26 tests, 0 failures, 0 skipped**, approximately 24.3 seconds. The existing demo on port 8080 was also checked directly for all three roles and remained running. Earlier measurements and the 25-test record above describe the 11 October run; generated `test-results` files are updated by subsequent runs. These results do not resolve live email/push or manuscript-alignment acceptance gaps.


### Manuscript workflow alignment (12 October 2026, local changes)

Full suite: 28 passed; two additional focused tests passed (30 distinct checks across runs). New coverage includes utility own-record/version tracking, mark/undo browser interaction, Manager direct rent recording and retries, rent receipt preservation after linked correction, 9 AM reminder/late-arrival suppression, and missing-recipient exception recovery. Old utility financial-confirmation expectations were replaced by the revised personal-tracking requirements. Real property mailbox/provider samples and HTTPS phone Push remain acceptance work.


Usability update: both browser tests passed, including authenticated OCR document preview, Tenant category-filter/reset, personal tracking, role routing and mobile navigation. Billing filters do not hide the separate receipt/history sections. Actual-phone and real-provider acceptance remain pending.


Report/filter follow-up: complete suite passed (31 tests). Confirmed rent-only collection/status denominators, exclusion and retention of legacy utility payments, separate utility tracking counts, filter retention after mark/undo, and existing browser flows. Saving states and revised-bill text updated; breakpoint listener is removed on logout and reattached on mounting the shell. No real-provider or phone-delivery accuracy claim is added.


UI polish: both real-browser regression tests passed after adding the presentation stylesheet. Reviewed the generated 390px-wide Tenant settings screenshot: controls and sections fit the viewport. Added subtle page entry, button/navigation transitions, visible keyboard focus and reduced-motion overrides. Actual-phone acceptance remains pending.


Storage update: complete suite passed (33 tests). Original source-file deduplication preserves separate intake history, OCR text compression is lossless and conditional on space savings, and expired-session cleanup preserves active sessions and financial records. Existing databases/files remain readable; no bulk migration or financial-history purge was performed.


Button audit: inventoried 101 button declarations across 26 active frontend files. Fixed refresh error/busy handling, misleading profile/source labels and shared preview routing. Full suite passed (33 tests); extended browser checks also passed for desktop sidebar, password visibility, notification mark-read and direct Manager rent recording. See BUTTON_FUNCTIONALITY_AUDIT.md for coverage limits.

### Frontend polish â€” 14 October 2026

Applied the project-local `redesign-existing-projects` skill to the existing vanilla frontend. Updated the shared accent to muted teal, simplified surfaces and typography, standardized brand colors through CSS variables, removed decorative gradient circles, and shortened login copy to describe actual user tasks. The sidebar now names the authenticated role instead of always saying Manager; the brand uses the existing building icon rather than an unsupported icon name.

Desktop sidebar collapse now preserves an operable icon rail with accessible link names, titles, focus/hover labels, and 44px-or-larger navigation targets. Inactive phone navigation uses `inert` until opened. Tenant summary statistics fit together on phones. Tenant bill tables become labeled records on phone screens, retaining the same payment/tracking controls and table roles instead of clipping those actions off the visible area. Reduced-motion support remains enabled, with brief entry and button feedback for other users.

Final `npm.cmd run test:browser`: three passed, zero failed or skipped, approximately 37 seconds. Coverage includes the existing portfolio/payment/correction flows, notification ownership and persistence, desktop rail keyboard navigation, mobile bill action visibility, mobile drawer state, and role/session routing. The notification restart fixture explicitly closes its own HTTP connections before restarting to avoid a shutdown timeout under an open browser; this changes test lifecycle handling only.

An isolated demo rendered 13 screen/viewport combinations at desktop and 390px phone widths with no page-level horizontal overflow or captured browser exceptions. Tables on Manager screens may still scroll within their table containers. These checks used installed Edge, not physical phones or every browser. No new framework, external font dependency, billing feature, backend payment-rule change, or Git push was introduced.

Current visual previews: [Manager dashboard](../../../../reports/archive/design-concepts/2026-10-14-frontend-polish/manager-dashboard.png), [Tenant phone home](../../../../reports/archive/design-concepts/2026-10-14-frontend-polish/tenant-home-mobile.png), and [Tenant phone bills](../../../../reports/archive/design-concepts/2026-10-14-frontend-polish/tenant-bills-mobile.png).

## High-priority feature update â€” 14 October 2026

Implemented supplementary SMTP rent emails and a Manager source-review dialog with original PDF/image beside extracted fields. Rent email event metadata and delivery attempts are stored in the existing notification records; no duplicate email table or bill copy was added. Source preview uses the protected Manager download route and temporary browser blob URLs, which are revoked when the dialog closes.

Validation completed for this update: 32 existing backend tests, 5 new rent-email policy tests, and 1 new source-review browser test passed (38 targeted tests). Email tests cover rent-only scope, idempotent confirmation, concurrent delivery, category/channel preference suppression, stale revisions, delayed/bounded retries, unknown in-flight outcomes, missing configuration, pending-payment reminder suppression and missed-day expiry. Browser verification covers authenticated PDF/image previews, saved correction/revalidation and history, responsive 390px layout, and missing-source fallback. Synthetic transport acceptance does not establish actual SMTP submission, inbox delivery or readership. No real email was sent. A live authorized SMTP account and recipient-visible portal URL remain necessary for live email acceptance.

Run the new checks with `node --test tests/rent-email.test.js tests/source-review.browser.test.js`. Other pre-existing browser suites were not rerun for this update. SMTP setup and source review instructions are in `user-manual.md`; configuration placeholders are in `.env.example`.

## Shared navigation update â€” 14 October 2026

Desktop navigation now uses an icon rail that expands on mouse hover or keyboard focus and collapses when the pointer/focus leaves. Expansion overlays the content without changing its position. Desktop hamburger/manual collapse controls and the top-right user dropdown were removed. Sidebar Logout sits directly above the authenticated user's details for Admin, Manager, and Tenant. Phone/tablet menu and Close controls remain available.

Verification: all-role interactive checks passed for hover, mouse leave, keyboard expansion, stationary content, mobile drawer opening/closing and logout. All four browser suites passed, including portfolio/forms, payment/receipt workflows, notifications, session recovery and OCR source review. A grid-placement defect found during verification was fixed by explicitly placing desktop content in the second grid column. Browser assertions check the content's offset and usable width. Tests were updated for the approved login labels and navigation controls; source-review browser testing uses its own port to avoid concurrent-suite collisions.

### Interaction polish

Shared buttons use short hover/press transitions; the sidebar uses a separate 420ms expand/collapse transition. Calendar dates retain keyboard focus after selection, and phone controls have 44px touch targets. Bill rows open details by pointer or Enter/Space without overriding nested actions. Dialogs keep keyboard focus inside and restore it without scrolling. Unread Tenant alerts fade their highlight after a successful read update. Shared form saves and tracking actions provide progress/confirmation and block duplicate submissions. Reduced-motion preferences remain supported.

Validation: all four existing browser suites passed. Additional routing checks passed for clicking bill rows, keyboard activation, dialog focus, and Escape dismissal. Existing payment, receipt, correction, notification, and session workflows passed.

### Simple rent and utility journeys

Manager Dashboard now puts pending rent reports before portfolio statistics, showing the Tenant, amount and method/reference with a link to the payment register. Tenant Home provides rent reporting, pending guidance and direct access to an existing confirmed rent receipt. Reporting explains that Manager verification is still required. The utility tracker remains a separate Tenant-controlled action below rent.

The browser regression now follows the rent journey from Tenant Home to the Manager dashboard review link and back to the Tenant receipt, including a phone-sized viewport and mobile logout. Receipt downloads must retain the single existing receipt. Existing utility-mark tests continue to check personal tracking independently of confirmed rent collections. Current verification results are recorded in the session.

Verification: the updated phone rent journey passed in the comprehensive browser suite, including direct receipt download from Tenant Home and one retained receipt. Source-review and all-role responsive-layout suites also passed after the shared-dialog and dashboard changes.

### Complete regression recheck

At the user's request, the complete current suite was rerun using `npm test`: 44 passed, 0 failed, 0 skipped (about 61 seconds). This includes backend/API and financial rules, email-summary parsing, real PDF extraction and image OCR, all-role browser workflows, source review, responsive layouts and the shared/individual utility journey.

The configured local SQLite database was separately opened read-only: `PRAGMA integrity_check` returned `ok`, and `PRAGMA foreign_key_check` returned zero violations. `git diff --check` reported no whitespace errors. No working records were changed or Git pushes made.

These results establish the tested local scenarios, not universal correctness. Real provider documents, live mailbox connectivity, actual email inbox delivery and physical-phone Web Push remain external acceptance checks.

### Dashboard and motion refinement

The Manager dashboard now shows rent reports, utility bills awaiting validation, and exceptions together in one review queue. Compact portfolio figures follow the queue, with property occupancy and recent activity below. Removed duplicate queue summaries and reduced repeated helper text. The Admin dashboard keeps real maintenance controls while removing the static role-count tile and repeated scope notice. Sidebar movement is 420ms with shorter label transitions; ordinary controls remain quicker, and reduced-motion settings still apply.

Verification: the complete suite passed again after these changes: 44 passed, 0 failed, 0 skipped. This includes the Manager review link, all-role responsive layout audit, payment flows, and navigation timing assertions. No billing rules or database records changed.
