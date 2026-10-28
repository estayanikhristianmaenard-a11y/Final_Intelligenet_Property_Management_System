# Current QA status

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
