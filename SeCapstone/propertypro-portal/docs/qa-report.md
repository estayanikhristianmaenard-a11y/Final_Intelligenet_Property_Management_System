# Implementation and QA evidence report

PropertyPro 2.0 · 11 October 2026

## 1. Readiness and source of truth

**Local integrated workflows pass the verification suite. Production/provider acceptance remains pending.** The final suite has 25 tests: 24 backend/integration scenarios and one comprehensive real-browser scenario. Live Gmail retrieval and external provider-to-browser push delivery were not verified because the supplied email address is made up and no live integration configuration/device subscription was provided. Those checks are not marked resolved.

The primary reference is the newer 51-page **Intelligent Property Management Workflow with OCR-Enabled Automated Billing Classification and Tenant Notification.pdf**, in the parent SeCapstone directory. Pages 21–22 define the functions, pages 30–35 define rent/intake/allocation and the V01–R01 rules. This report also uses the actual existing source and the previously reported QA-001–QA-026 register. The research PDFs were read without modification.

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
| Persistent central storage and valid relationships | SQLite WAL; permanent keys, FKs, relationship indexes, transactions, assignments/leases, bills/lines/allocations/payments/receipts/corrections | T03, T09, T10, T23 — Verified |
| Distinct identities and real eligible occupants | Removed colliding/fictitious mock seed; one account link per tenant; actual tenant IDs for every allocation | T03, T06, T16, T25 — Verified |
| Property/unit/tenant CRUD and dates | Manager-only forms and API; individual overlap validation, date boundaries, protected deletion and historical changes | T02, T10, T18, T23, T25 — Verified within one-current-lease model |
| Utility email attachment intake | Real ImapFlow TLS adapter, UID/UIDVALIDITY deduplication, manual sync and five-minute polling; MIME attachment handling | T12 verifies MIME-to-bill; T10 verifies unconfigured failure. Live mailbox retrieval pending |
| Digital PDF and clear-image extraction | Real PDF.js text extraction and Tesseract.js with bundled English model; retained original files/raw text/confidence | T11–T14, T25 — Verified with generated PDF and clear PNG; provider layouts require acceptance |
| V01/V02 | Required/conflicting values; nonnegative centavo amounts, valid dates and ordered period; failures remain reviewable | T06, T07, T11, T14, T19 — Verified |
| V03/V04 | Unique normalized mapping; identical attachment and provider/account/period hold; original source remains correctable | T06, T11, T20 — Verified |
| C01/C02/A01 | Mapped electricity/water, valid individual/shared arrangement, eligible/frozen recipient list and integer reconciliation | T03, T06, T12, T16, T21 — Verified |
| R01 and anniversary rent | Original day, last-day fallback, generation=due date, coverage, first advance, lease cutoff, persisted cycle keys | T01–T03, T05, T15, T18, T24 — Verified |
| Advance credit once, without another receipt | Confirmed credit record; final-cycle application, revision, original receipt reference; review for protected/discrepant amounts | T04, T05, T15, T21 — Verified main paths; Manager settlement of confirmed discrepancies remains manual review |
| Shared equal allocation and centavo residual | Integer amounts and ascending permanent ID order; frozen recipients persist through corrections | T01, T03, T06, T12, T16, T21 — Verified |
| Manager corrections and retained history | Old/new field values, reason, Manager, revisions, revalidation; recurring failures retain the same open exception | T06, T07, T14–T16, T20–T21, T25 — Verified |
| Full payment report / confirmation / rejection | Tenant-only reporting, method/reference checks, line/status synchronization, rejected history, Manager confirmation | T04, T10, T17, T23, T25 — Verified |
| Unique confirmed receipt and real downloads | Receipt per confirmed payment; protected HTML receipt and actual document bytes, ownership and audit | T04, T23, T25 — Verified |
| Own tenant portal and inbox | Assigned unit, own bills/periods/balance/status/receipts/docs, permanent-ID-addressed messages | T10, T23, T25 — Verified |
| Web Push registration and background handling | Service worker, PushManager subscription path, persisted backend subscriptions, VAPID/encrypted transport, retries/expired endpoint handling | T22, T25 — Encryption/retry and actual worker installation verified; real enrollment/delivery pending |
| Three Philippine-calendar-day unpaid reminder, deduplicated | Server event scheduler; positive unpaid balance only; unique bill/due-date event | T01, T08, T24 — Verified locally |
| Portal independent of push failure | Notifications persisted first; browser denied/unconfigured handling; bill state unaffected by failed transport | T22, T25 — Verified |
| Frontend/backend role restrictions | Auth restore, session expiry/revocation, route guards and per-endpoint role/ownership | T10, T17, T23, T25 — Verified |
| Preserved UI and connected remaining actions | Original design system/shell; forms, cancel, searches, exports, profile, settings, Admin maintenance and downloads | T23, T25 — Verified connected representative paths; no redesign |
| Scope exclusions | No payment gateway/bank verification, tenant email, SMS, prediction, IoT, maintenance ticket, blockchain or mobile app | Source review; no such endpoints/modules added |

## 3. Test index and results

Backend scenarios are in [backend.test.js](../tests/backend.test.js). Browser scenario is in [browser.test.js](../tests/browser.test.js). [fixtures.js](../tests/fixtures.js) generates a real PDF/MIME message; `tests/fixtures/utility.png` is a real clear image. OCR/extraction are not replaced by fixture-returning stubs. The Web Push transport is intentionally substituted to avoid an unconfigured external send.

| ID | Scenario / assertions | Result |
| --- | --- | --- |
| T01 | Integer residual order, negative/extra-decimal rejection, February 31 fallback/leap year, Philippine calendar boundary | Pass |
| T02 | First rent/advance, subsequent ordinary rent, no rent after end, no duplicate cycles, FK integrity | Pass |
| T03 | Shared rent uses actual unique tenants; shares reconcile; eligible list retained | Pass |
| T04 | Invalid method/reference rejection, report → reject → resubmit → confirm, line consistency, idempotent receipt, available advance | Pass |
| T05 | Confirmed advance applies once to the final applicable cycle | Pass |
| T06 | Missing amount → queue → reasoned correction → shared utility bills; duplicate hold; confirmed record protected | Pass |
| T07 | Unmapped correction stays failed/open; repeated review retains the same exception ID without duplicating failures | Pass |
| T08 | Exact three-day unpaid reminder; event deduplication; reported bill excluded | Pass |
| T09 | File database and stored session survive close/reopen; logout invalidates token | Pass |
| T10 | Actual HTTP roles/ownership, settings persistence, prohibited policy rejection, inbox/read state, IMAP 503, private files and logout | Pass |
| T11 | Real digital PDF → finalized bill; repeat processing idempotent; duplicate/malformed document → queue | Pass |
| T12 | Real MIME email attachment → text extraction → reconciled shared bills, retained Message-ID | Pass |
| T13 | Clear PNG → real offline English OCR → correctly extracted fields/finalized bill | Pass |
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

## 4. QA-001–QA-026 resolution matrix

`Verified locally` resolves the identified local defect against the tests below. `Partial` retains the external acceptance gap.

| QA | Root cause verified in the original source | Affected files and correction | Evidence / result |
| --- | --- | --- | --- |
| QA-001 | `tnt-001` reused for Maria/B-203 and Bea/A-101; occupant links collided | Removed `src/api/mock/seed.js`; `server/store.js`, `bootstrap.js`, `service.js` use permanent keys/FKs and distinct actual occupants | T03/T06/T16/T25 — Verified locally |
| QA-002 | In-memory adapter discarded every mutation on reload/restart | Removed `src/api/mock/adapter.js`; `server/store.js`, `index.js`, `setup.js`, `src/api/client.js` use SQLite and live API | T09/T10/T23/T25 — Verified locally |
| QA-003 | API trusted frontend role checks and accepted unauthorized mutations | `server/index.js`, `service.js`, `src/auth/rbac.js` enforce role and ownership on every protected path | T10/T17/T23/T25 — Verified locally |
| QA-004 | Shell serialized the outlet through innerHTML, dropping listeners | `src/app/shell.js` moves the existing DOM outlet; `app.js` isolates pending route stages | T25 report modal still works after menu/badge refresh — Verified locally |
| QA-005 | Login ignored entered credentials/server user and switched demo roles | `src/auth/session.js`, `features/auth/login.page.js`, `components/sidebar.js`, `topbar.js`, `server/service.js` use real returned identity and remove demo-role grants | T10/T17/T25 wrong password and mismatched selected role — Verified locally |
| QA-006 | Correction controls discarded value/reason and merely changed queue state | `features/billing/exception-queue.js`, `app/workflows.js`, `server/service.js` persist affected field/old/new/reason/Manager, revalidate/recompute and retain recurring failures open | T06/T07/T14/T16/T21/T25 — Verified locally |
| QA-007 | Add/edit/delete/assign portfolio buttons had no operations | `features/properties/properties.page.js`, `units/units.page.js`, `tenants/tenants.page.js`, `app/workflows.js`, `server/service.js` connect forms and protected CRUD with lease/assignment dates | T02/T18/T23/T25 — Verified locally within documented tenancy model |
| QA-008 | No intake/OCR/rent engine; Sync/Manual controls inert | `server/integrations.js`, `rules.js`, `service.js`, `features/billing/bills.page.js`, `app/workflows.js` implement real extraction, IMAP and scheduler; label manual attachment action Upload source | T01–T03/T11–T14/T18/T24/T25 — Local extraction/rent verified; live mailbox retrieval pending — Partial |
| QA-009 | Manager settings Save/toggles/mappings simulated/hardcoded | `features/settings/settings-live.js`, compatibility `settings.page.js`, `app/workflows.js`, `server/index.js` store config/mappings and lock incompatible paper policies | T10/T25 configuration reload and mapping create/delete — Verified locally |
| QA-010 | Tenant profile/preferences/password changes returned success without storage | `features/tenant/tenant-settings.page.js`, `auth/session.js`, `server/service.js` save profile/preferences, verify current password and revoke sessions | T17/T25 phone/preferences persist and password change returns to login — Verified locally |
| QA-011 | Admin role/password/maintenance controls and health/audit were simulated | `features/admin/admin-settings.page.js`, `admin-dashboard.page.js`, `admin-audit.page.js`, `app/workflows.js`, backend account/maintenance routes report actual integrity/config/last observed integration state | T17/T23/T25 user creation, reset/revocation, health, backup, OCR restart, purge — Verified locally; health does not imply live-provider acceptance |
| QA-012 | Allocation arrays referenced 31 nonexistent occupant identities | `server/service.js`, `rules.js`, `store.js` calculate from eligible tenant records and freeze recipients | T01/T03/T06/T12/T16/T21 — Verified locally |
| QA-013 | Permission prompt was mistaken for actual Web Push delivery | `features/tenant/tenant-notifications.page.js`, `sw.js`, `server/index.js`, `integrations.js`, `server/keys.js` register/store subscriptions, encrypt/send through real adapter and distinguish unconfigured state | T22/T25 crypto/retry/worker activation verified; live browser enrollment/provider delivery unverified — Partial |
| QA-014 | Messages used display-name addressing and had no tenant inbox | `tenants/tenant-details.panel.js`, `tenant/tenant-notifications.page.js`, `server/index.js`, `store.js` save tenant-ID messages and show authenticated inbox | T10/T25 Manager message visible only in linked Tenant inbox — Verified locally |
| QA-015 | Document preview/download and receipt downloads had no files/handlers | `tenants/tabs/documents.tab.js`, `payments.tab.js`, `tenant-details.panel.js`, `tenant-bills.page.js`, `app/workflows.js`, backend documents/receipts routes serve actual protected bytes | T23/T25 lease upload/download and confirmed receipt download; denied other-tenant file — Verified locally |
| QA-016 | Bill line statuses were not synchronized with report/confirmation | `server/service.js`, `store.js` transactionally save bill, all lines and payment status on report/reject/confirm | T04/T23/T25 — Verified locally |
| QA-017 | Repeated confirmation generated more receipts/events/timestamps | `server/service.js`, unique receipts.paymentId in `store.js`, confirmation button guard return original confirmed payment | T04 preserved receipt/time/audit; T23/T25 receipt issued once — Verified locally |
| QA-018 | Invalid payment method/reference accepted; UI assumed cash | `app/workflows.js`, `tenant-bills.page.js`, `tenant-home.page.js`, `server/service.js` use explicit full-payment method/reference validation | T04/T25 E-wallet reference and invalid-method cases — Verified locally |
| QA-019 | Protected 401 left a stale authenticated UI/session | `src/api/client.js`, `auth/session.js`, `app/app.js`, `server/service.js` clear/revalidate tokens and render login on expiry/revocation | T09/T10/T17/T25 — Verified locally |
| QA-020 | Mark-all-read showed a toast without changing notification records | `tenant-notifications.page.js`, `server/index.js` persist only own read state and refresh unread badges/feed | T10/T25 — Verified locally |
| QA-021 | Root redirect denied valid users; global links assumed Manager | `auth/guards.js`, `app/shell.js`, `components/topbar.js` resolve role home/profile/alerts/search paths | T25 Tenant/Admin root redirects and forbidden route rejection — Verified locally |
| QA-022 | Counts/dashboard stayed stale after mutations | `app/app.js`, `shell.js`, `workflows.js`, feature callbacks reload derived backend records and badges; event handlers survive refresh | T10/T23/T25 creates, reports, confirmations and reloads — Verified locally |
| QA-023 | Exports/search/activity/source/profile buttons were disconnected | `app/workflows.js`, `reports/reports.page.js`, `billing/bills.page.js`, `dashboard/dashboard.page.js`, `tenant-details.panel.js`, `server/index.js` supply range CSV, searches, keyboard activity navigation, downloads and real profile form | T23/T25 CSV, source review, full profile, activity keyboard action and browser navigation — Verified locally |
| QA-024 | Modal bound only the first close control; footer Cancel failed | `components/modal.js` binds every data-close button; form dialog uses the same close callback | T25 cancel property/report dialogs — Verified locally |
| QA-025 | Singular unit endpoint/expected mock routes and options mismatched; range ignored | `src/api/endpoints.js`, `config/api.js`, `api/client.js`, `server/index.js`, `service.js` align live plural routes, filtering and report ranges; retired mock removed | T10/T23/T25 live units, settings, records, all-range export — Verified locally |
| QA-026 | Independently seeded bills/payments/receipts/activity contradicted identities, values or dates | Removed mock seed; `server/bootstrap.js`, `service.js`, `store.js` generate demo history through the actual engine and enforce transaction/idempotency/revision relationships | T02–T06/T09/T15/T16/T18/T21/T23/T25 — Verified locally |

## 5. Connected modules and end-to-end evidence

| Workflow | Result |
| --- | --- |
| Credential login → server role → permitted screen → forbidden route rejection → logout/session expiry | Verified through actual HTTP and browser |
| Property → unit → tenant assignment/lease → Admin account → own portal | Verified through CRUD forms/API and permanent relationships |
| MIME email fixture → actual PDF text extraction → configured mapping → V01–A01 → three shared bills | Verified; no live Gmail connection claimed |
| Clear image → real bundled-model OCR → validated utility charge | Verified offline |
| Missing/conflicting value → same source's queue → Manager field/reason → revalidation → finalization or continuing open exception | Verified, including preserved exception ID on repeated failure |
| Duplicate PDF/period → duplicate hold; original source corrected once | Verified |
| Original anniversary → short-month fallback → first advance → confirmed advance → final-cycle credit and end cutoff | Verified, including late advance confirmation and repeat requests |
| Whole source → integer equal shares/residual ordering → frozen correction recipients | Verified for rent and utility |
| Tenant full report → Manager rejection → retained history → resubmission → confirmation → synchronized lines/unique receipt → real download | Verified backend; report/confirmation/download verified in browser |
| Manager tenant-ID message → Tenant portal inbox → persisted read state | Verified |
| Billing/reminder event → retained portal notification → encrypted push request → transient transport failure/retry/dedup | Verified with test transport; external background delivery pending |
| New same-day assignment after scheduler's earlier run → next-minute generated rent | Verified |
| Database close/reopen and session recovery; backup/reopen/integrity | Verified |

Database/API checks verified PK/FK integrity, protected dependent deletes, unique mappings/receipts/cycles/events, all three roles, other-tenant denial, CORS denial, private Node static-file denial, settings persistence, real downloadable file bodies, and SQLite backup consistency. The complete endpoint/table list is in [api-contract.md](api-contract.md).

## 6. Selected ISO/IEC 25010:2023 characteristics

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

Follow [user-manual.md](user-manual.md) for setup, Admin/Manager/Tenant tasks, mailbox and push configuration, exception correction, backup/recovery and scope. Run `npm.cmd test` from the portal directory to reproduce verification. Use an isolated demo directory for review; the implementation does not fabricate or overwrite operational tenant/payment data.

The website's original blank-page trigger was opening its module entry through `file://`. `index.html` now explains that startup requirement when opened directly. The working address is the server's printed HTTP URL, normally **http://localhost:8080/**, after database setup and `npm.cmd start`.
