# Next-session checklist

Saved 20 October 2026. Start here when development resumes. This separates unfinished acceptance checks from new code; do not rebuild functions that already exist or add modules outside the [capstone scope](capstone-scope.md).

## Where we stopped

- Latest complete regression run: **76 tests passed**, no failures or skips. This is development evidence, not participant evaluation.
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
2. Inspect backup completeness. The current Admin backup route produces a SQLite snapshot; determine and document how associated source/document files are included in recovery. If no complete handoff exists, implement a simple consistent package or companion procedure, then restore-test it. Database-only success does not prove source-file recovery.
3. Test how one malformed/oversized email affects later messages in the dedicated label. The current sync can stop on a thrown intake error; if reproduced as a blocking case, implement bounded per-message handling with visible failure/review records and safe retry rules. Do not silently discard bills or retry charges blindly.
4. Check whether the current status screens explain actual authorization, configuration and failures clearly. Improve only misleading/missing feedback; do not build another dashboard or invent delivery/readership.
5. After the core journey passes, fix device-specific layout/receipt issues and refresh affected PNGs if the UI changed. Avoid another full redesign by default.

Optional later operations: a deliberate always-on/autostart plan if the group needs longer unattended demonstrations. No public hosting, paid subscription or 24/7 availability guarantee is currently required or configured. Do not silently change Windows sleep/firewall/service settings.

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
