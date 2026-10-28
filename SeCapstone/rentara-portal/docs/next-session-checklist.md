# Next-session checklist

## Latest verification - 23 October 2026

After reverting the unapproved locked-PDF summary fallback, all 99 tests passed in a fresh full run. The five existing journeys were checked, including a new file-backed restart/replay/receipt test. Only tests and documentation changed during this verification. See [QA evidence](qa-report.md).

Next is the [five-journey actual-phone checklist](manual-test-guide.md#five-journeys-to-check-on-the-actual-demo-phones). Use the existing Group 3 database without resetting it; do not resend the already successful fixture just to force a fresh result. No new live email or actual Android test was performed in this automated run. Keep locked PDFs and unresolved masked accounts in review; the automatic summary fallback remains removed.


## Latest interface checkpoint ? 23 October 2026

Intake result filters, Staff work queues, Manager decisions, phone bill spacing and automatic-processing guidance are implemented. A fresh full suite passed all 98 tests; see [QA report](qa-report.md). The duplicate same-page loading regression is also covered.

Next: restart the running backend, refresh the browser, then check the updated screens on the actual Android phones. Inspect Staff Needs action / With Manager / Returned, Manager decisions and Tenant bill/receipt buttons. Keep the already successful Group 3 Gmail fixture; do not reset/resend it to rehearse. Gmail filter and live synthetic intake success remain recorded below. Actual provider-origin samples, device access and deferred Web Push delivery are separate acceptance checks.


**Latest checkpoint - 23 October 2026:** Gmail demo filter saved by the user and a fresh SMTP -> automatic label -> IMAP -> scanned-PDF OCR -> Unit A allocation -> Tenant portal-alert journey passed. Two PHP 450 shares are ready to view. Do not resend/reset this sample merely to rehearse. Full regression remains 96/96 from the preceding automation run. Current evidence is in [QA status](qa-report.md); older entries below retain their dated context. Remaining priorities are actual phones/provider-format acceptance, rent confirmation/receipt journeys and deferred Web Push.

Saved 20 October 2026; verification status updated 22 October. Start here when development resumes. This separates unfinished acceptance checks from new code; do not rebuild functions that already exist or add modules outside the [capstone scope](capstone-scope.md).

## Where we stopped

- Latest complete regression run: **83 tests passed** on 22 October, no failures or skips. Includes separate workspace access, job failure isolation, held-email handling/retry controls, partial-sync feedback and complete database/file recovery. This is development evidence, not participant evaluation or a workload-capacity benchmark.
- Email parsing, digital PDF extraction, image/scanned-PDF OCR, billing rules, exceptions, rent confirmation, receipts and portal alerts already exist.
- One clearly labelled rent test reached **rentara2026@gmail.com** and its exact message was verified in INBOX. Phone link opening remains unchecked.
- Actual Gmail IMAP retrieval passed using a synthetic bill stored in **Rentara-Utility-Acceptance**. It created a test Tenant bill and portal alert; repeated sync/setup created no extra charge. This was not an actual provider email. The digital PDF used text extraction, not OCR.
- Acceptance startup now retrieves only that dedicated label about every five minutes while running. Outgoing rent email stays **off**. Normal startup still uses the showcase, which blocks external messages.
- HTTPS certificates and stable Push keys are prepared. Android certificate trust and real Push delivery remain unchecked; the last readiness check found no acceptance device subscriptions.
- No Git commit or push was performed. The owner handles pushes manually.

## First: resume safely

1. Work in **SeCapstone/rentara-portal**. Old `propertypro-portal` tabs are stale.
2. Run `ipconfig` and use the laptop's current Wi-Fi IPv4 address; **192.168.1.71 was the last configured address**, not a permanent guarantee.
3. From the repository root, start the separate acceptance portfolio:

   ```powershell
   .\SeCapstone\tools\start-acceptance.ps1 -LanAddress YOUR_CURRENT_LAPTOP_IP
   ```

4. If port 8443 is already occupied by our earlier acceptance server, use that server or stop its terminal with Ctrl+C before restarting. Do not stop unrelated processes.
5. Initial local accounts: Tenant **rentara2026@gmail.com**, Manager **manager@propertypro.ph**, Admin **admin@propertypro.ph**. Initial password: **LocalDemo!2026**, unless deliberately changed. The Rentara Tenant is a test recipient; the same Gmail remains the system's intake/sending account.

The laptop must stay awake and the backend must run. Internet is needed for Gmail and external notifications. Local extraction/review can work without internet once a bill is available, but phone access still needs a working local connection. This does not promise that interrupted extraction jobs resume automatically. Stop the server with Ctrl+C when finished if you do not want retrieval to continue. Configuration is preserved for next startup.

## Actual tests still needed, in priority order

| Priority | Test | Pass condition |
| --- | --- | --- |
| 1 | Actual authorized Meralco bill email | Record expected fields manually, label the message, retrieve it and compare provider/account, amount, due date and billing period. Correct Tenant/workspace receives the bill; uncertainty enters review |
| 2 | Actual authorized Manila Water bill/email | Repeat with its real format. Do not claim support until checked; we still need suitable samples |
| 3 | Different real bill images/scans | OCR output matches manually checked values or requires review. Keep consent/anonymization; do not count copies or synthetic edits as independent real bills |
| 4 | Missing/masked account, unreadable value and duplicate | No wrong Tenant or second charge. Manager correction revalidates, retains history and finalizes only when valid |
| 5 | Two Android phones | Install only the public CA certificate, open warning-free HTTPS, allow notifications separately on each browser, receive a new eligible event and open the correct Tenant page |
| 6 | Rent email on a phone | Open the already delivered labelled test email; verify its summary and portal link on the reachable local network. Do not automatically resend the accepted test |
| 7 | Shared charges and utility marks on actual phones | Shares sum to the source amount. Each Tenant changes only their own tracker; no Manager utility approval, provider-verification claim or utility receipt |
| 8 | Rent report, Manager confirmation/rejection and receipt | Phone journey persists correct status/reason, prevents duplicate submissions and shows the original confirmed receipt. Also check direct Manager recording and final-cycle advance with test records |
| 9 | Scheduled reminders | Eligible records receive the approved 9 AM Philippine-time, three-day reminder. Pending rent reports/currently marked utilities are excluded; no late retrospective reminder or utility email |
| 10 | Connection loss, restart and account switching | Saved records survive; clear feedback appears; no duplicate bill/payment or cross-Tenant/workspace access. Check recovery of interrupted intake explicitly |
| 11 | Backup/restore and printing | Restore into a separate directory; bills, accounts, payments, original receipts and required source files remain accessible. Verify actual print/Save as PDF layout on devices |
| 12 | Participant evaluation | Settle adviser-approved participants, instruments, sample counts and Chapter 3 procedure before collecting/reporting results. Automated tests are not participant responses |

Use the detailed [manual guide](manual-test-guide.md), [email acceptance results](email-billing-acceptance.md) and [current QA status](qa-report.md). Record actual outcomes; leave unperformed checks pending.

## Integration/configuration still needed

| Item | What remains | Existing behavior to preserve |
| --- | --- | --- |
| Provider billing subscription | Verify an authorized owner/account can receive the actual supported provider content at the designated email. Check the provider's reply/subscription requirements | The system cannot retrieve a PDF that the provider never sends or access the provider app automatically |
| Gmail filter | Create a one-time filter from verified provider sender/billing criteria to apply **Rentara-Utility-Acceptance**. Until then, apply that label manually to an authorized bill | Only that label is retrieved in acceptance. No general inbox scanning or guessed sender filter |
| Actual utility mappings | Manager configures verified provider/account, covered unit and individual/shared setup | Current acceptance account identifiers are synthetic; masked digits must never be guessed |
| Android Push permission | Complete certificate installation and subscription on each actual device | Portal access works even when Push is denied or unavailable |
| Normal rent-email operation | After reviewing the self-test/link and intended recipients, choose the operational configuration separately | Acceptance deliberately keeps ongoing rent mail off. Do not remove showcase safeguards or email test arrears to actual Tenants |
| Other owners/workspaces | When an actual second owner is ready, configure their authorized mailbox/integrations and verify isolation | Additional workspaces do not automatically inherit the first owner's Gmail credentials |

Detailed setup/pause instructions: [local acceptance setup](local-acceptance-setup.md). Never put private keys or app passwords in this checklist.

## Coding priorities after evidence gathering

1. Fix observed intake, mapping, correction or notification failures first. Add a regression for each meaningful defect; preserve the existing stack and workflow.
2. Complete recovery support was implemented on 22 October: Admin backups now include the SQLite snapshot and referenced source/document files, with a manifest and checked offline restore into a new directory. Automated recovery/permission tests cover it; the group still needs to copy a package privately and verify it on the intended recovery device. See [backup and recovery](backup-and-recovery.md).
3. The oversized-message blocking case was reproduced and fixed on 22 October. Bad content is held once in the Exception Queue while later messages proceed. Managers can retry their workspace's message or close the notice with a recorded handling reason. Network/storage failures remain retryable rather than silently marked processed. Verify actual provider failures when available; do not silently discard bills or retry charges blindly.
4. Check whether the current status screens explain actual authorization, configuration and failures clearly. Improve only misleading/missing feedback; do not build another dashboard or invent delivery/readership.
5. After the core journey passes, fix device-specific layout/receipt issues and refresh affected PNGs if the UI changed. Avoid another full redesign by default.

Optional later operations: a deliberate always-on/autostart plan if the group needs longer unattended demonstrations. No public hosting, paid subscription or 24/7 availability guarantee is currently required or configured. Do not silently change Windows sleep/firewall/service settings.

For role-specific needs and remaining improvements, use the [Manager and Tenant user stories](user-stories.md). The new email/recovery support does not finish actual provider setup, Android permission/Push delivery, physical printing or participant evaluation.

## Deferred paper work

When manuscript review resumes, reconcile the later approved workspace isolation and labelled future rent dates with the saved baseline, using exact sections/paragraphs. Keep utility due-date prediction excluded. Chapter 3 is still being prepared. Do not claim all development, provider accuracy, usability evaluation or deployment is complete merely because code tests passed. Keep the fixed research title unchanged.

## Useful commands

From the application directory:

```powershell
# Safe local email-to-bill verification; no network/sending
npm.cmd run verify:email-billing

# Full isolated regression suite when changes justify it
npm.cmd test

# Explicitly connect to the agreed dedicated Gmail label and verify/reuse its fixture
npm.cmd run setup:utility-intake

# Pause utility intake on the next acceptance startup; restart required
npm.cmd run setup:utility-intake -- --disable
```

Do not use the separate live-send verification option just to repeat an already accepted email. Last compact local/live result files are under ignored `data/acceptance/`; the current guides summarize their outcomes without exposing secrets.

## Current Staff revision handoff ? 23 October 2026

Staff and Manager proposal workflow are implemented; do not recreate them from the earlier planning notes. Read [implementation and permissions](staff-implementation-plan.md) and the latest [QA evidence](qa-report.md). Restart the running demo to load the new server code.

Pending manual acceptance: one-time Gmail routing filter; newly sent labelled bill through intake to the correct Unit/Tenant; two Android devices and trusted current HTTPS address; rent-only live email if authorized; Web Push delivery (deferred); rendered diagram/exported manuscript review. Existing demo data must be preserved. Group review of Staff duties and documentation wording remains necessary.

Automatic job isolation/status is implemented; use [automatic workflow](automated-workflow.md). Restart the running backend before testing the new status endpoint. Next actual check: fresh Gmail-labelled bill to correct Tenant without pressing Sync. No live sending or receiving was enabled by the implementation/test run.
