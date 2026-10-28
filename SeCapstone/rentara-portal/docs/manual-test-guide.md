# Rentara manual test guide

Start with **Tenant on your phone**. First verify that someone can understand their bill and complete an action without help. Then check the Manager side of the same action.

For the current email-to-bill work, see [verified results and remaining two-phone steps](email-billing-acceptance.md). The default local check uses disposable synthetic records and does not send email. Gmail sending/retrieval remains a separate explicit acceptance step; Android Push still needs actual device permission and delivery checks.

For held emails, verify **Retry email** and **Close email notice** on the Manager's Exception Queue. A bad message must not block a later valid bill, and closing requires a handling reason without marking a bill/payment valid. For maintenance, copy the whole [recovery package](backup-and-recovery.md), restore to a new directory, and check source viewing and original receipts. Use the [role user stories](user-stories.md) to guide the walkthrough; actual provider/device checks remain separate from automated results.

## Latest UI review checks

Added checks for the lightweight interaction pass:

1. Admin Audit Log: use Next/Previous to reach records beyond 50, reload page 2, filter by action/date, and reset. Check the total and page boundaries. Export still covers the full authorized log.
2. Edit a settings field, then try another section or page. Cancelling the discard warning must preserve the entered value. Cancel changes restores the last saved value; a failed save retains edits for retry.
3. Upload a supported bill. While pending, check the processing indicator and disabled submission/close controls. A failure must preserve the selected file. No percentage or completed stage is invented.
4. Enable the device's reduced-motion preference. Dialogs and disclosures should remain usable with added movement disabled. Copy should still confirm success, and errors should remain readable.
5. Test network loss and recovery. The status explains the connection issue; a failed payment/report/upload is never silently queued or automatically replayed.

See [performance and motion](performance-and-motion.md) for the implementation boundaries.

Use the [current PNG index](../../reports/mockups/README.md) to compare the implemented layouts.

| Screen | Check | Expected result |
| --- | --- | --- |
| Phone login | Open with the keyboard closed, then focus Email | Short branding area; readable fields and reachable Sign in button |
| Tenant home | Read rent and utilities; change a personal utility mark | Rent appears first, utility tracker follows, amounts/statuses stay correct |
| Bills | Expand Filters, select a category/status, then Reset filters | Active count updates, panel stays open during editing, URL/reload retains selected filters |
| Receipt history | Expand history; Copy a reference; View receipt | Readable rent-cycle title, full reference copied, original full reference retained in receipt |
| Calendar | Browse next month, select estimated rent, then Today | Future rent is labeled estimated, no utility dates are invented, Today selects the current date |
| Notifications | Compare unread/read entries and open browser notification settings | Unread alerts appear first; readable full dates; browser settings remain accessible below the feed |
| Manager OCR review | Choose Edit beside Amount due; enter a correction and reason | Editor appears beside that field; one correction is saved, revalidated and recorded in history |
| Manager dashboard | Open a property card | Occupancy count and configured monthly rent have clear labels; card opens that property's units |
| All desktop roles | Focus sidebar links with Tab | Labels become accessible through keyboard expansion; workspace remains visible in the top bar |

On a phone using local HTTP, check Copy separately: browser clipboard access varies, and the interface offers a fallback or a clear error. Confirm smoothness and reduced-motion behavior on real devices; PNGs cannot establish those results.

The automated checks already passed; this guide records your own device and usability results. The boxes below are intentionally unchecked.

## Before testing

1. Use demo records for payment reports, corrections and uploads. These actions save changes. Do not use genuine unpaid bills to simulate payments.
2. If the server is already running, stop it in its terminal with **Ctrl+C** and restart it once to load the receipt changes. From `SeCapstone/rentara-portal`, run `npm.cmd start`. Open **http://localhost:8080/** on the laptop and press **Ctrl+F5**.
3. For a phone, connect both devices to the same Wi-Fi. Check your current Wi-Fi IPv4 address with `ipconfig`; your previous `192.168.1.71` may have changed. Stop the existing server before starting the LAN helper. From the repository root, run:

   ```powershell
   .\SeCapstone\tools\start-local.ps1 -LanAddress YOUR_CURRENT_IP
   ```

   Replace `YOUR_CURRENT_IP` with the actual address. On the phone, open `http://YOUR_CURRENT_IP:8080/`. Keep the laptop awake and the terminal running. See [phone setup](local-network-demo.md) if it cannot connect.
4. Enter the account email and password, then select **Sign in**. There are no role-selection shortcuts. Use your existing demo accounts. The documented showcase accounts use `LocalDemo!2026`:

   | Role | Email |
   | --- | --- |
   | Tenant | `maria.santos@gmail.com` |
   | Tenant 2 (Alice Reyes) | `occupant2@example.test` |
   | Manager | `manager@propertypro.ph` |
   | Manager 2 (Riverside Rentals) | `manager2@example.test` |
   | Tenant Luis (Riverside Rentals) | `luis.garcia@example.test` |
   | Admin | `admin@propertypro.ph` |

   These credentials apply to the demo/showcase, not automatically to every initialized database. If you need populated demo records, follow [Populated desktop and phone showcase](user-manual.md#populated-desktop-and-phone-showcase). Reusing that showcase preserves changes from previous attempts; it does not reset the data. Its external email, Push and mailbox connections are deliberately disabled.

   For two-phone showcase testing, sign in as Maria on one phone and Alice on the other, both using `LocalDemo!2026`. Alice's address is a synthetic demo login, not a real mailbox. Each account has its own rent, shared utility allocations, receipts, tracker and alerts. A utility mark on one account must not mark the other account paid. Existing showcase folders receive Alice's login when `npm.cmd run demo:showcase` is rerun; existing accounts, passwords and bills are preserved.

## First pass: Tenant on a phone

### Check independent owners first

The default workspace and Riverside Rentals are separate property businesses. Use two browser profiles or phones so their sessions remain independent. All showcase accounts above use `LocalDemo!2026`; manually replace the filled email when using Manager 2 or Luis.

| Done | What to do | What should happen |
| --- | --- | --- |
| [ ] W1 | Sign in as the original Manager on one device and `manager2@example.test` on another. | Sidebar/mobile header names differ. The original Manager sees the existing portfolio; Manager 2 sees Riverside's portfolio only. |
| [ ] W2 | Copy the full View bill URL from one Manager's portfolio and open it while signed in as the other Manager. | Access is denied/not found. No other owner's name, amount, source file or receipt is shown. |
| [ ] W3 | Sign in as Maria and Luis on different phones; change a personal utility mark. | Each sees their own bills and history. The other person's tracker and rent status are unchanged. |
| [ ] W4 | Sign in as Admin, open Users & Roles, create a test workspace and assign a new Manager to it. | The new Manager starts with an empty portfolio in that workspace and cannot see existing owners' records. |
| [ ] W5 | Inspect each Manager's billing settings and exports. | Mailbox addresses, mappings and exported portfolio records belong to that Manager's workspace. A new workspace reports mailbox integration unconfigured until the operator configures it. |

See [workspace setup, migration and recovery](workspaces.md). Real Gmail/Push checks remain separate; showcase workspaces deliberately disable external delivery.

Allow about 10–15 minutes. If a required bill or receipt is missing, record **Blocked: no suitable demo record** rather than marking the check passed.

| Done | What to do | What should happen |
| --- | --- | --- |
| [ ] T1 | Sign in as Tenant and open **My home**. | Rent amount, due date and status are easy to find. Personal utility tracker sits below rent. Calendar follows on a phone. |
| [ ] T2 | Scroll, rotate the phone, open/close the menu and use the bottom navigation. | Text stays readable; buttons remain reachable; the page does not slide sideways. Navigation never covers the last content/action. |
| [ ] T3 | Open **Bills and history**, then **View bill**. | Amount, due date and status appear first. Labels, references and charge breakdown fit. Close returns to the same screen without an unexpected jump to the top. |
| [ ] T4 | Mark one electricity/water bill personally paid. Refresh, then undo the mark. | Status changes to **Self-Reported Paid**, survives refresh, then returns to **Not Marked Paid** after undo. Rent status stays unchanged. No utility receipt or Manager approval is requested. |
| [ ] T5 | Select a highlighted calendar date and change months. | House, lightning and drop icons identify the matching received bills. The selected date shows their status, amount and provider when known. Next month's scheduled rent is dashed and labelled as an estimate without an invented amount. No predicted utility date appears. |
| [ ] T6 | Open **Alerts/Notifications**, open a bill from an alert and use **Mark all read**. | The correct bill opens. Unread counts update and stay updated after refresh. Local portal alerts work even when phone Web Push is unavailable. |
| [ ] T7 | Find an existing confirmed rent receipt and select **View receipt**. Scroll inside the preview; try Print on the laptop. Download only if you want a saved copy. | The original receipt opens inside the portal without an automatic download. Name, amount and receipt reference agree with the confirmed payment. Long references wrap. Print targets the receipt document; downloading/reopening shows the same receipt and never creates another payment. |
| [ ] T8 | Open **Settings** and select Profile, Notifications and Security. | Each button reaches the correct section and shows an active state. Forms and save controls fit. Browser Back and navigation still work. |

**First decision:** Could you find the next amount due, understand rent versus utility tracking, and finish an action without guessing? Record any confusing wording or hard-to-find button before changing colors again.

## Second pass: one rent payment from start to finish

Use a demo **Unpaid** rent bill. Keep Tenant open on the phone and Manager in a separate laptop browser profile/private window so the sessions do not replace each other.

| Done | What to do | What should happen |
| --- | --- | --- |
| [ ] R1 | Tenant selects **Report rent payment**, tries Cash and E-wallet, then completes the form and submits once. | Reference is hidden for Cash and required for electronic payments. Returning to Cash clears an entered reference. Bill becomes **Tenant Reported Paid** only after a valid submission. No confirmed receipt yet. |
| [ ] R2 | Manager opens the pending rent report. Reject it with a demo reason. | Tenant sees **Unpaid** again after refresh; rejection reason/history remains available. |
| [ ] R3 | Tenant reports again. Manager checks the details and confirms once. | Bill becomes **Paid**. Tenant can download the confirmed rent receipt and sees the payment notice in the portal. |
| [ ] R4 | Refresh both sessions and download the receipt twice. | Status remains Paid. Both downloads show the same receipt ID and original amount; no second payment or receipt appears. |
| [ ] R5 | On another eligible Unpaid demo rent bill, Manager uses **Record rent** without a Tenant report. | Manager can record a checked payment and confirm it. No prior Tenant report is required. This action is unavailable for utility tracking. |

For now, rent email delivery is a separate configured test. A saved portal notice or showcase payment does not demonstrate that an email reached an inbox.

## Third pass: Manager UI and utility intake

| Done | What to do | What should happen |
| --- | --- | --- |
| [ ] M1 | On desktop, enter and leave the sidebar with the pointer; then use Tab to focus a menu item. Repeat for Tenant and Admin. | Expansion/collapse feels consistent across roles. Focused labels are visible; content does not jump. Log out remains above the sidebar user details. |
| [ ] M2 | Open Dashboard, Properties, Units, Tenants, Bills & Payments, Reports and Settings. | Headings and spacing are consistent, numbers align, tables remain usable, and each screen has a clear main action. |
| [ ] M3 | Search/filter a populated list, then choose filters with no matches and reset them. | Results match the selection. Empty state explains the situation. Reset restores records. A personal utility mark is not displayed as a verified rent payment. |
| [ ] M4 | Open a creation/edit form. Try saving with a required field blank; then correct it or cancel. | A clear field error appears. Entered values remain available. Cancel saves nothing. Save shows progress and prevents repeated submission. |
| [ ] M5 | In demo data, configure a matching account mapping and upload a sample bill. | Extraction shows progress. Valid data creates the expected bill/share; invalid or unmapped data goes to review instead. |
| [ ] M6 | Open **Review bill**, compare all five fields with the source, and correct an uncertain field with a reason. | Original source is visible alongside the details. Correction is retained and rechecked before finalization. |
| [ ] M7 | Upload the same provider/account/period again. | Duplicate is held for review; Tenant does not receive another charge for the same source bill. |

Use the [sample kit](samples/utility-bills/README.md) for M5–M7. Compare **provider, account/reference, billing period, amount due and due date**. Digital PDFs test direct text extraction; the clear PNG/image-only PDF tests actual OCR. The old OCR fixtures require February 2026 occupancy and represent the same bill, so uploading both should trigger duplicate handling. A review result can be correct behavior; do not change genuine occupancy dates just to force a pass. `.eml` fixtures are for developer tests, not browser uploads.

For shared bills, add the displayed shares and compare with the source total, including centavos. One Tenant's personal mark must not mark all shares paid.

## Fourth pass: Admin and session boundaries

| Done | What to do | What should happen |
| --- | --- | --- |
| [ ] A1 | Sign in as Admin, review System Dashboard, Users & Roles and Audit Log. | Maintenance screens load. Admin does not gain Manager billing/payment actions. |
| [ ] A2 | Log out and use browser Back; then sign in as another role. | Protected screens require sign-in. The new role gets its own navigation and permitted records without old-role actions. |
| [ ] A3 | Stop and restart Node, sign back in and inspect your demo actions. | Saved payment, receipt, tracking and correction records remain consistent. |

## Record a problem

Copy this for each failure or confusing interaction:

```text
Check ID: T3 / R1 / etc.
Result: Pass / Fail / Blocked
Device and browser:
Role and page:
Steps I followed:
Expected:
What actually happened:
Screenshot or exact error:
```

Do not include passwords, tokens or full real provider account numbers in shared reports. Prioritize wrong amounts, missing saved records, duplicate payments/receipts and wrong-account access before visual preferences.

## Later, with configured services

Real authorized provider samples, live property-mailbox retrieval, actual rent email acceptance and HTTPS phone Web Push need separate acceptance sessions. They are not passed by the offline/showcase steps above. Reminders also need eligible due dates and the scheduled Philippine-time run; do not change your laptop clock to simulate them. The isolated automated suite covers scheduler cases without changing your working database.

## Admin status verification

Open Admin Dashboard and select **Refresh status**. Confirm one completion message, a new check time, and a maintenance audit entry. Expand **What was checked** to read the method, limits and recorded dates. Missing email/Push configuration should say **Not configured** or **Disabled**. Installed OCR packages should say **Available**, without claiming extraction accuracy. A previous sending success should say **Recorded success**, not currently connected. Refresh must not send messages or process bills. Check the page at phone width and use keyboard navigation to open the disclosures. See [check definitions](system-status.md).


## Staff revision acceptance ? 23 October 2026

Use test/demo records, not actual participant/payment records. Prepare the Staff account with `npm run demo:staff:prepare`; restart the existing server.

1. Verify the normal login has email/password fields and no three-role/demo buttons. Log in as Staff.
2. Check Daily operations, upload/intake, existing properties/units/Tenants and Account on desktop and phone. Staff cannot create/delete enrollment or edit rent, lease, mapping or login email.
3. Submit a multi-field correction on a failed source. Confirm live extracted values/bills do not change while pending. A second pending proposal must be blocked. Add a note/escalate a setup case.
4. As Manager, authorize a correct proposal. Confirm it becomes applied, the source is validated, exact equal shares total to the bill, and the right Tenant sees it. No utility receipt is created.
5. With separate test cases, reject with a reason; change source/context before approval; disable the preparer; submit an invalid correction. Confirm rejected/stale/returned states, preserved reasons and no unintended live billing changes. Retry an already decided proposal: it must not create another bill.
6. Check Staff cannot authorize proposals, confirm rent, apply advance, change config or reach another business. Manager retains those permitted financial/setup actions; Admin cannot confirm rent.
7. As Admin, search accounts and filter Staff/business/status; View members must filter without switching identity. Verify Tenant still sees only own records.
8. Check live Gmail filter/label receipt, two-device HTTPS, rent-only email and optional Web Push separately. These require real-device/external-service checks.

## Automatic processing acceptance ? 23 October 2026

1. Restart the selected server; enable only the intended receiving profile. Open Staff/Manager > Incoming Bills > Automatic processing. Expect a completed startup cycle and the intended mailbox state.
2. Send a new supported bill and let Gmail apply the configured label. Wait for the next eligible five-minute mailbox check; do not click Sync. Check incoming source, validated fields, correct unit/Tenant, exact shares and portal alert. Refresh/reopen the page to read current data.
3. Send the same bill again and check duplicate handling; an invalid bill must enter Exceptions instead of finalizing. Staff proposes corrections only where permitted; Manager still authorizes them.
4. Check rent cycles/reminders using controlled dates in isolated tests. Do not change the operating laptop clock or create real arrears merely to demonstrate reminders. Confirm notification-channel restrictions and no utility receipts.
5. For an authorized connectivity rehearsal, confirm a failed mailbox attempt is visible and does not stop local jobs. Restore connectivity and wait for the next eligible retry. Do not expose app passwords in screenshots/logs.
6. Stop/restart normally; already processed UID/source/bill keys must prevent a second charge. Keep external-email/phone delivery checks separate from local transport acceptance.


## Intake and work-queue usability check ? 23 October 2026

1. As Staff, open Daily operations. Needs action, With Manager and Returned link to the matching work queue. Counts represent exception cases, so several reasons for one source can be separate cases.
2. Submit a correction for an unfinalized bill. Its open cases move out of Needs action and appear With Manager; live bill values remain unchanged until authorization.
3. As Manager, open Your decisions. Staff proposals, rent reports and escalated cases lead to their existing controls. A case covered by a pending proposal is not counted again as an escalated case.
4. Reject or return a proposal, then open Returned as Staff. Read the decision reason and prepare a revised correction. Applied proposals belong in Resolved; historical decisions remain available under All cases.
5. In Incoming Bills, switch Result among All results, Needs review, Duplicate, Processed and Processing. An empty result shows guidance rather than a blank list. Duplicate indicates a failed duplicate rule; it is still blocked and must be compared, not charged again.
6. Confirm each source displays the actual mapped unit code, amount, date and failure reason when available. Long account references are visually shortened but retained in the title/source view. Processed means validation and bill processing passed, not utility payment verification.
7. Expand Automatic processing. Check the last mailbox attempt, last completed cycle, next eligible check and configuration/failure guidance. This is a page-load snapshot; reopen to refresh. A next eligible time is not a promise of retrieval while the backend is stopped.
8. On a narrow phone viewport, inspect amounts, due dates, references and action spacing. View bill, report rent, personal utility marks and receipt controls must retain their existing behavior. Check on actual phones after browser checks.

Use disposable test data for rejection/correction checks. Do not reset the successful live Gmail fixture or send it again just to repeat this guide.


## Five journeys to check on the actual demo phones

Run this after the automated workflow verification. The automated tests use temporary synthetic portfolios; they do not reset or replace the Group 3 database and do not send Gmail messages.

Start the existing Group 3 demo with `npm.cmd run demo:group -- --receive` from `SeCapstone/rentara-portal`. Use the HTTPS address and port printed by the running process. Each phone uses the laptop's current LAN address, not localhost. Keep the laptop awake and use the reachable shared network/certificate setup already documented in [local acceptance](local-acceptance-setup.md). Never run prepare/reset commands over the working portfolio just to repeat a test.

| Journey | Actions and pass condition |
| --- | --- |
| Valid utility bill | Send a fresh synthetic bill yourself using the existing Gmail demo filter and [Group 3 files](../../reports/demo-files/group-3/README.md). A fresh bill needs a genuine different test billing identity/period, not just a renamed copy. Keep the server running and allow the next eligible mailbox cycle (normally up to five minutes). Without clicking Sync, verify the received source, full account mapping, correct unit, shares summing to the source amount, each Tenant's own bill and linked portal alert. |
| Problem bill | Use an unfinalized source with a known correction. Staff reads evidence and submits a proposal. Live values stay unchanged. Manager rejects with a reason, Staff revises, and Manager authorizes. Only a successful revalidation creates bills; invalid proposals remain returned/held. Mapping/configuration changes belong to Manager. |
| Duplicate | Re-send/upload the same synthetic bill or its equivalent readable copy. No extra Tenant charge may appear. A duplicate hold can be the correct result; do not remove its guard to make the demo look successful. |
| Rent and receipt | One Tenant reports a synthetic rent payment. It remains awaiting confirmation. The Manager checks the test record externally and confirms, or rejects with a reason. Confirmation produces one black-and-white receipt. Tenant can view/download it; reopening/retrying must reuse the same receipt. This is not a bank transfer or bank verification. |
| Restart and isolation | Note the bill/receipt references, stop and restart the same chosen backend, then sign in again on both phones. Prior records and alerts remain, the old mailbox item creates no extra charge, and new eligible work continues. Each Tenant sees only their own share/payment/receipt. Another workspace must not see these records. |

For each row, record the date, account used, bill/source/receipt reference, expected result, actual result and Pass/Fail/Not tested. Do not put account passwords or Gmail app passwords in the record. Check real tapping, scrolling, receipt tabs and the calendar on both phones. Browser emulation does not establish hotspot reachability or actual Android behavior.

The locked-PDF summary fallback was reverted at the user's request. Readable attachments retain priority; a recognized summary is used when no supported attachment is present. Locked PDFs or unresolved masked accounts remain for review. No PDF password storage, masked-CAN guessing or automatic bank verification is part of this check. External rent-email and deferred Web Push delivery require separate, explicitly authorized acceptance checks.


## Final three-person walkthrough ? record actual results

Use disposable demo records and the running server profile's exact printed address/port. A phone uses the laptop LAN address, not localhost. Do not rerun setup against an existing working portfolio just to begin this walkthrough. Assign one member as Staff, one as Manager and one as Tenant; use Admin separately to check account visibility. Each person should attempt their task without instructions from the developer first.

| Task | Expected result | Actual result / device / tester / date |
| --- | --- | --- |
| Staff opens a held utility case | Issue and next step are clear; original opens; extracted values are separate from a proposal | Pending |
| Staff enters a correction and reason | Failed preview retry keeps inputs; blank reason blocks submission; pending proposal shows With Manager | Pending |
| Manager reviews the same case | Original and before/after values are available; authorize revalidates; reject records a reason | Pending |
| Tenant checks the resulting bill | Correct account/unit, amount and actual due date; no held bill or utility receipt | Pending |
| Tenant reports rent, then Manager confirms | Report stays pending until confirmation; one viewable monochrome receipt | Pending |
| Tenant uses utilities and calendar | Personal mark affects own tracking only; estimates are rent-only and labelled | Pending |
| Phone forms and recovery | Keyboard does not hide the reachable controls; long content fits; retrying a failed read does not repeat a payment | Pending |
| Separate workspace login | Other portfolio records and protected originals cannot be opened | Pending |

Record any moment when someone asks what a label means or cannot find the next action. Save the task, confusing wording and expected behavior in the existing QA report; do not mark a task passed from a screenshot or an automated result.

## Actual provider email acceptance

Use the dedicated demo label and one consented supported provider email whose full account has a verified mapping. Keep the original Gmail message and an independently checked reference for provider, account, amount, due date and billing period. Do not invent missing account digits or remove a PDF password through guessing.

Check that Gmail applies the configured label automatically; let the running backend reach its next eligible retrieval. Compare the incoming record against the original. A complete valid source should reach the correct Tenant; missing, ambiguous or unreadable details must remain in review. Repeat retrieval and confirm there is no second charge. Check a second mapped unit independently. A supported clear email summary and PDF/image attachment should each be exercised, including a held unsupported/encrypted attachment case according to the current intake behavior.

For rent email, check only an agreed test recipient with clearly labelled test data; confirm inbox presence and the link on the phone. Keep utility email notifications excluded. Browser Push needs its separate permission/trust/delivery check. Record Message-ID or source reference and outcome privately, without app passwords or raw personal bill details in the report. Actual provider delivery, physical-phone results and formal user evaluation remain pending until someone performs and records these steps.
