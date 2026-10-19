# Rentara manual test guide

Start with **Tenant on your phone**. First verify that someone can understand their bill and complete an action without help. Then check the Manager side of the same action.

For the current email-to-bill work, see [verified results and remaining two-phone steps](email-billing-acceptance.md). The default local check uses disposable synthetic records and does not send email. Gmail sending/retrieval remains a separate explicit acceptance step; Android Push still needs actual device permission and delivery checks.

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
4. On localhost or a private Wi-Fi IP address, choose **Tenant**, **Manager** or **Admin** on the login page to fill the demo email and password. You still select **Sign in** to log in. Use your existing demo accounts. For the documented showcase, all three roles use `LocalDemo!2026`:

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

