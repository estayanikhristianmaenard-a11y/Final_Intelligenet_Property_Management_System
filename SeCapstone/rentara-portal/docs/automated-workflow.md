# Automatic billing workflow

Updated 23 October 2026. Normal startup and the demo use the same automatic-processing code. Demo fixtures, credentials/enablement and separate databases do not replace the billing rules.

## What runs automatically

The running Node backend starts a cycle immediately and checks again every minute. A configured mailbox is eligible for retrieval every five minutes after the last attempt. Without configuration, mailbox retrieval is disabled; the remaining local work can continue.

1. Generate eligible rent cycles using the existing anniversary/occupancy rules, without duplicates.
2. Create eligible reminders using the existing 9 AM Philippine-time, three-calendar-day rules. Pending rent reports and currently self-marked utilities remain excluded; missed reminders are not sent retrospectively.
3. Retrieve supported emails from the configured mailbox/label. Parse MIME and readable body/PDF text; use OCR for supported images/scanned PDFs.
4. Apply existing validation, provider/account mapping, duplicate checks, classification and exact equal allocation. Valid bills finalize and publish their Tenant portal alerts. Invalid/unmapped records remain blocked in Exceptions.
5. Process eligible rent-email and optional Web Push delivery using their existing configuration, preference, retry and duplicate guards. Utility events never become rent emails.
6. Remove expired sessions as existing supporting maintenance.

Confirmed rent receipts remain automatic consequences of an authorized Manager payment confirmation. The scheduler does not confirm payments or create receipts for utility tracking. Staff proposals, Manager authorization and eligible final-cycle advance decisions remain deliberate actions.

## Reliability behavior

Each job records its own result. A rent-generation or reminder error no longer prevents mailbox intake or independent delivery jobs in that cycle. SMTP-job failure does not prevent the Push job. Existing workspace boundaries isolate each business. Database/storage failure still requires operator attention; this is not a distributed queue or guaranteed-delivery service.

Cycles do not overlap. Shutdown stops the timer and waits for active scheduled work before closing integration resources and SQLite. Failures are retried by later cycles subject to existing mailbox spacing and notification retry rules; uncertain SMTP submissions retain the existing no-repeat protection.

Only one `automation-cycle` settings record is updated per workspace, with fixed job names and latest timestamps/outcomes. It is saved at cycle start/end instead of creating a new audit/log row per minute. Existing mailbox/job records retain their own history and duplicate guards. No new dependency or table was introduced.

## Start it

From `SeCapstone/rentara-portal`:

```powershell
# Normal configured portfolio
npm.cmd start

# OR the existing Group 3 demo with its dedicated receiving label
npm.cmd run demo:group -- --receive
```

Choose one intended profile and open its printed URL/port. Do not rerun data preparation to start automation. Group 3 keeps outgoing rent email disabled; default/other workspaces use their own configured integration settings. The explicit `--receive` startup choice is not required per bill. Gmail's routing filter is still a separate one-time setup; creating an IMAP label does not create that filter.

After changing server code, stop and restart the existing process. Keep the laptop awake and the terminal running. Internet is needed for Gmail, SMTP and Push. Local extraction/allocation can work on available source files without internet. The system does not receive new Gmail content while the backend is stopped/offline. On restart, unprocessed labelled messages remain eligible; this does not imply backdated reminders or 24/7 hosting.

## See the recorded results

Staff/Manager: Bills > Incoming Bills > Automatic processing. The disclosure shows mailbox configuration, latest cycle, mailbox eligibility time and job states. `waiting` means the next allowed check has not arrived; `disabled` means the job/channel is not configured/enabled; `failed` requires attention; `needs_review` means retrieved email content was held. A recent failed mailbox attempt stays visible while waiting for its next retry. Refresh/reopen the page to obtain a new snapshot; no continuous live-update stream is claimed.

`completed` means that job returned without a top-level exception. It does not prove every bill was valid, a notification reached an inbox/device, or a payment was verified. Check Exceptions and the existing delivery records for those outcomes. Status access is read-only and does not run jobs or expose mailbox credentials. Tenant/Admin cannot call the workspace operational status endpoint; Admin retains the existing maintenance/status views.

## Verification and remaining acceptance

`tests/automation.test.js` covers actual timer startup/periodic execution with a simulated mailbox and real MIME/digital-PDF parsing through validation, Tenant billing and portal alert creation. It checks persistent UID duplicate protection, independent failed jobs, retry spacing, bounded status storage, stop/no-overlap behavior and authenticated workspace isolation. Existing OCR, reminders, rent, notifications, Staff and workspace suites provide regression coverage. These are controlled development tests, not real-provider delivery or representative accuracy results.

Still verify one fresh real labelled email, supported provider layouts and actual device/recipient access. Web Push remains retained but its device acceptance is deferred. See [QA status](qa-report.md), [email acceptance](email-billing-acceptance.md) and [manual test guide](manual-test-guide.md).

Code: `server/scheduler.js`, `Integrations.tick()` in `server/integrations.js`, workspace fan-out in `server/workspace-integrations.js`, and `createApp().startAutomation()` called by normal `server/index.js` startup.


### Reading the intake screen

Incoming Bills offers result filters for Processed, Needs review, Duplicate and Processing. These are presentation labels over existing validation states. A duplicate is held, not silently discarded or charged again. Source rows show the mapped unit code when available, and the source-review screen keeps the original evidence available.

Automatic processing shows the last mailbox attempt separately from the last completed scheduler cycle, next eligible mailbox check and practical connection/configuration guidance. It is a snapshot fetched when the page opens, with no extra background polling. Reopen the page for an updated snapshot.

Staff work queues distinguish Needs action, With Manager and Returned. Pending proposals take priority over older returned decisions for the same source. The Manager dashboard highlights decisions and escalated cases; it retains access to operational intake and investigation pages.
