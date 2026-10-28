# Rentara walkthrough and module QC checklist

Prepared and expanded 28 October 2026 from the current source, navigation and saved QA evidence. Covers user-facing functions and important validation, role, persistence and recovery paths; it is not a claim that every internal code path has been tested. These boxes are manual checks to perform, not completed results. Use Pass / Fail / Blocked / Not tested in your test notes; tick only checks you actually pass.

## QA execution rules

1. Use the running showcase at `http://localhost:8080/` for the initial local pass. Note the workspace and account on every result.
2. Run sections 1–18 for the module pass, then 19–28 for individual controls and negative cases. Each checkbox has a unique check ID; keep results by ID.
3. **READ** means inspecting existing records. **WRITE** means changing an agreed synthetic record. Mark each result accordingly in your notes. Never edit a real record merely to manufacture a test condition.
4. **FIXTURE** below means a disposable synthetic scenario must be prepared first. If the required state is unavailable, mark Blocked with the missing prerequisite. Do not force the state by editing SQLite or changing the laptop clock.
5. **LIVE** below means an explicitly configured external-service or actual-device session. Showcase blocks SMTP, Push sending and mailbox retrieval by design. Do not mark a live check Failed merely because it is disabled there; record Blocked or Not tested.
6. Start a new bill/payment scenario for incompatible outcomes: confirming and rejecting need different pending reports. Retain confirmed receipts, accepted fixtures and audit history.
7. For each write, verify the success/error feedback, reload, and verify the saved state from the other relevant role. For a failed write, check that no partial record or duplicate was created.
8. Stop and report immediately if another account's private records appear, an amount is wrong, a charge/payment/receipt duplicates, or saved financial history disappears. Record the identifiers before further actions.

## Open the website

Use PowerShell from the application directory:

```powershell
Set-Location 'E:\xampp\htdocs\Final_Intelligenet_Property_Management_System\SeCapstone\rentara-portal'
```

Node.js 24+ is required. Dependencies and the showcase were prepared during the startup troubleshooting in this chat. On this laptop, use `npm.cmd start` for subsequent starts; do not reinstall or regenerate data every time. On a fresh checkout, install the locked dependencies first:

```powershell
npm.cmd ci
```

Choose ONE profile for your walkthrough. The profiles use different databases; actions in one do not appear in another.

| Profile | Startup command from the application directory | Laptop address | Use |
| --- | --- | --- | --- |
| Configured default, normally showcase | `npm.cmd start` | Normally `http://localhost:8080/`; follow terminal output | General module tour; uses the current `.env` data directory |
| Existing Group 3, retrieval off | `npm.cmd run demo:group` | `https://localhost:8444/` | Inspect existing Group 3 records and Staff workflow without mailbox retrieval |
| Existing Group 3, retrieval on | `npm.cmd run demo:group -- --receive` | `https://localhost:8444/` | Deliberate Gmail demonstration; retrieves only `Rentara-Group3-Demo`; rent email remains off |
| Separate acceptance portfolio | `npm.cmd run start:acceptance` | Normally `https://localhost:8443/`; follow terminal output | Dedicated acceptance records; see the local acceptance guide for prerequisites |

Group 3 needs its existing prepared database and local HTTPS configuration. Acceptance needs its existing acceptance configuration. This checkout lacked `.env.acceptance` and the Group 3 database when checked in this chat, so use the showcase for now. If these are missing on a fresh clone, use the setup guides instead of copying another person's private database or rerunning generators against working records.

Keep the terminal open and laptop awake. Stop with Ctrl+C. Do not double-click `index.html`; the Node API and SQLite database are required. XAMPP Apache/MySQL do not need to run for this path. If the port is occupied, reuse the intended server or stop its own terminal before restarting.

On a phone, use the laptop's current Wi-Fi IPv4 address from `ipconfig`, for example `https://YOUR_LAPTOP_IP:8444/`, on a reachable shared network. `localhost` on a phone refers to the phone. Local HTTPS needs a certificate covering the current address and trust configured on the device; follow [local acceptance setup](local-acceptance-setup.md). Do not bypass certificate warnings as a successful HTTPS/Push check.

## Demo sign-ins

Initial local demo password: `LocalDemo!2026`, unless previously changed. These are documented demo accounts, not a fresh password verification.

| Profile | Role | Email |
| --- | --- | --- |
| Showcase | Manager | `manager@propertypro.ph` |
| Showcase | Tenant Maria | `maria.santos@gmail.com` |
| Showcase | Second shared Tenant | `occupant2@example.test` |
| Showcase | Independent Manager | `manager2@example.test` |
| Showcase / prepared Group 3 | Admin | `admin@propertypro.ph` |
| Group 3 | Manager | `manager@propertypro.ph` |
| Group 3 | Staff, if already prepared | `staff.group3@example.test` |
| Group 3 | Tenants | Each member's previously configured email |
| Acceptance | Test Tenant | `rentara2026@gmail.com` |

Log out before switching roles, or use separate browser profiles. Login uses ordinary email/password fields. Do not reset records or passwords merely to rehearse.

## Progress at this checkpoint

- The latest saved full regression on 27 October reports **99 passed, 0 failed, 0 skipped, 0 cancelled**. This walkthrough did not rerun it or perform a fresh browser acceptance test.
- Four-role access, portfolio records, intake/extraction, validation, correction proposals, allocation, rent payments/receipts, personal utility tracking, calendar, alerts, reports and recovery have implementation and automated evidence.
- The latest UI work includes the shared Case Sheet, phone correction forms, clearer next steps and safe retries of failed reads.
- A self-addressed synthetic Group 3 scanned utility email passed automatic Gmail-label retrieval, OCR and allocation on 23 October: PHP 900 split into two PHP 450 charges. Preserve that existing fixture. This is not actual provider-origin evidence.
- Pending: actual provider formats, additional authorized samples especially Manila Water, physical-phone usability and email links, actual Web Push delivery, physical printing, recovery on the intended device and formal participant/OCR evaluation. No defensible overall completion percentage follows from the test count.

## Suggested walkthrough order

Manager Dashboard → Properties → Units → Tenants → Bills & Payments → Reports → Settings. Next inspect Staff intake and corrections, then Tenant My Home → My Bills & Payments → Notifications → Settings. Finish with Admin maintenance, access isolation and phone checks. Test changes only with agreed synthetic/disposable records; viewing existing records is enough for the initial tour.

## 1. Login, navigation and sessions

- [ ] L01 Each available demo role signs in and lands on its permitted home page; incorrect credentials show useful feedback.
- [ ] L02 Navigation matches the role and shows the correct workspace. Desktop labels expand with pointer/keyboard; the phone menu opens and closes.
- [ ] L03 Logout removes access; browser Back cannot expose protected data. Switching accounts does not retain the previous account's records/actions.
- [ ] L04 Directly opening another role's protected route is denied or redirected safely.
- [ ] L05 A permitted password change persists; the old password no longer signs in. Use a disposable account and record the change privately.

## 2. Manager Dashboard

- [ ] D01 Totals match the underlying records and filters; utility marks are not presented as verified collections.
- [ ] D02 Decision links open the relevant rent report, Staff proposal or escalated case.
- [ ] D03 A failed read shows Try again; retry restores the view without repeating a financial action.

## 3. Properties

- [ ] P01 Search, details and available filters show only this workspace's properties.
- [ ] P02 Manager can create/edit an agreed synthetic property; required fields and supported location rules are enforced.
- [ ] P03 Records with dependencies cannot be deleted in a way that loses units, Tenants or billing history.

## 4. Units

- [ ] U01 Each unit shows the correct property, code, floor, monthly rent and Individual/Shared arrangement.
- [ ] U02 Manager can create/edit a synthetic unit; invalid rent and conflicting records are rejected clearly.
- [ ] U03 Individual occupancy rejects overlapping assignments; shared occupants have separate Tenant records.
- [ ] U04 Shared unit details and Tenant search let you identify the intended occupants without confusing one Tenant's profile with all occupants.

## 5. Tenants, enrollment and leases

- [ ] T01 Search, profile, contact information, unit assignment and documents show the correct Tenant and workspace.
- [ ] T02 Manager creates a synthetic Tenant record; Admin links its login to the permanent Tenant ID. No duplicate identity is needed.
- [ ] T03 Lease/assignment dates are validated; history-sensitive changes require a reason and preserve previous values.
- [ ] T04 End-lease handling preserves financial history; blocked transfer/renewal/deletion actions explain their limits.
- [ ] T05 Protected Tenant documents open only for authorized users; other Tenants/workspaces cannot retrieve them.

## 6. Utility intake and automatic processing

- [ ] I01 Upload a supported digital PDF: original is retained and readable text is extracted directly.
- [ ] I02 Upload a supported image/scanned PDF: actual OCR extracts values or the source is held for review.
- [ ] I03 Compare provider, full account/reference, amount, billing period and actual due date against manually checked expected values.
- [ ] I04 Verified provider/account mapping selects the correct unit and electricity/water category; email sender/subject alone does not assign a Tenant.
- [ ] I05 Missing, masked, unreadable or invalid required values enter review without guessing or issuing a bill.
- [ ] I06 Re-uploading/renaming/emailing the same bill does not create another charge.
- [ ] I07 Incoming Bills filters show All results, Needs review, Duplicate, Processed and Processing correctly, including useful empty results.
- [ ] I08 Automatic processing shows meaningful last-attempt, completed-cycle and next-eligible-check information; stopped/offline status is not represented as guaranteed future delivery.
- [ ] I09 In an explicitly selected receiving profile, a fresh agreed labelled synthetic bill processes without pressing Sync. Allow the next eligible polling cycle, normally around five minutes.
- [ ] I10 A held content error does not block later valid messages. Authorized retry/closure retains its handling reason and prevents duplicate billing.

Do not resend the already accepted Group 3 fixture for another first-time-success demonstration. Use a separately agreed fresh test identity/period; a renamed copy is still a duplicate. Browser upload accepts supported documents, not developer `.eml` fixtures.

## 7. Exceptions, Case Sheet and corrections

- [ ] C01 A selected case shows the issue, next step, extracted values and authenticated original; related reasons do not appear as unrelated bills.
- [ ] C02 Original preview/download works. Retry original recovers a failed read while preserving entered correction fields.
- [ ] C03 Staff submits permitted corrections with a required reason; live source values and charges stay unchanged while pending.
- [ ] C04 A pending proposal is read-only and cannot be submitted a second time; queues show Needs action / With Manager / Returned appropriately.
- [ ] C05 Manager compares evidence and before/after values, then authorizes a valid proposal; revalidation and bill creation succeed together.
- [ ] C06 Manager rejection requires a reason visible to Staff; revision preserves decision history.
- [ ] C07 Invalid, stale or disabled-preparer proposals stay returned/held without partially changing live billing. Exercise these with controlled disposable cases.
- [ ] C08 Repeating an already completed decision creates no extra bill. Finalized/configuration cases retain Manager authority.

## 8. Allocation and billing records

- [ ] B01 An individual source reaches only the mapped eligible Tenant; a shared source reaches the correct eligible occupants.
- [ ] B02 Equal shares, including centavo rounding, sum exactly to the original charge.
- [ ] B03 Bill amount, period, due date, source, Tenant and status remain correct after reopening/reload.
- [ ] B04 Invalid occupancy or unresolved mapping holds billing rather than using an arbitrary Tenant.
- [ ] B05 Search, filters, bill detail and history agree; failed read retries do not replay writes.

## 9. Rent cycles, reports and Manager confirmation

- [ ] R01 Fixed monthly anniversary rent uses the correct configured share, short-month handling and separate first-cycle advance line; no proration is introduced.
- [ ] R02 Check rent cycles catches up eligible missing cycles without duplicating existing ones. Use isolated date tests rather than changing the laptop clock.
- [ ] R03 Tenant reports an eligible rent payment; it remains awaiting Manager confirmation, with duplicate reports blocked.
- [ ] R04 Manager confirms the correct synthetic report after external checking; balance and history update once.
- [ ] R05 Manager rejects a separate report with a reason visible to the Tenant; no confirmed receipt is created.
- [ ] R06 Direct Manager recording preserves the correct Tenant, bill, amount and reference; Staff/Admin cannot confirm rent.
- [ ] R07 Correction of an eligible unpaid rent cycle requires a reason and preserves history; confirmed transactions are not silently rewritten.

## 10. Advance application and receipts

- [ ] A01 Only confirmed configured advance is available; Manager explicitly applies it to an eligible final-cycle bill.
- [ ] A02 Gross charge, credit and remaining balance reconcile; repeating application does not reuse credit or create another receipt.
- [ ] A03 Ineligible/pending/conflicting final-cycle cases enter review without losing the credit or original transaction.
- [ ] A04 A confirmed rent receipt opens, downloads and prints legibly in monochrome; correct amount, identity, reference and date appear.
- [ ] A05 Reopening a receipt reuses its original identifier. Fully covered final rent retains the original payment/receipt, with no invented cash payment.

## 11. Tenant My Home, bills and utility tracking

- [ ] H01 My Home shows only the signed-in Tenant's unit, rent, utility shares and relevant history.
- [ ] H02 My Bills & Payments filters/details agree with My Home and the Manager's authorized records.
- [ ] H03 Personal utility mark/undo persists after reload and changes only that Tenant's tracking.
- [ ] H04 Utility wording explains provider payment is not verified; there is no Manager utility approval or utility receipt.
- [ ] H05 Another Tenant's bill, source, payment or receipt cannot be opened through a copied link.

## 12. Calendar

- [ ] K01 Actual bills use their recorded dates and open the correct bill.
- [ ] K02 Future rent entries are clearly labelled estimates and do not create bills, payments or receipts.
- [ ] K03 No future utility dates are predicted; utilities use validated received bill dates.
- [ ] K04 Month navigation and narrow-phone layout keep dates and actions usable.

## 13. Notifications and messages

- [ ] N01 A new eligible bill/event creates the correct Tenant portal alert; read state, history and destination persist.
- [ ] N02 Manual Manager billing messages remain portal-only and reach the intended permitted recipients.
- [ ] N03 Where separately authorized/configured, rent email content and phone portal links are correct. Utility events never send utility email.
- [ ] N04 On each actual supported phone, trusted HTTPS, permission and subscription allow a new eligible Web Push; tapping opens the correct own-account page. Otherwise record Not tested/Blocked.
- [ ] N05 Reminder checks respect 9 AM Philippine time, three days before actual due date, duplicate prevention and exclusions for pending rent reports/current utility marks. Use isolated scheduler evidence for date cases.
- [ ] N06 Denied Push or unavailable email leaves portal access usable; status does not claim delivery/readership without evidence.

## 14. Manager Reports and Settings

- [ ] M01 Report filters and CSV exports reconcile with recorded occupancy, charges and confirmed rent; utility self-marks are not verified revenue.
- [ ] M02 Provider/account mappings are unique, workspace-scoped and point to the correct unit/category.
- [ ] M03 Billing rules display the approved fixed policies; no flexible allocation/proration or extra charge module is introduced.
- [ ] M04 Integration/settings changes persist with appropriate validation and safe feedback; secrets are not exposed in shared screenshots/exports.
- [ ] M05 Staff cannot edit financial configuration, mappings or Manager-only settings/reports.

## 15. Staff daily operations and Account

- [ ] S01 Staff can read scoped operational records and perform permitted upload/sync, investigation, notes and escalation.
- [ ] S02 Existing property/unit descriptive fields and Tenant contact fields can be edited; changes persist.
- [ ] S03 Staff cannot create/delete enrollment or change rent, occupancy/lease setup, mapping or Tenant login email.
- [ ] S04 Staff cannot authorize proposals, approve their own corrections, confirm rent or apply advance, including by direct protected URLs.
- [ ] S05 Staff Account permits only their allowed profile/password changes; financial screens remain unavailable.

## 16. Admin Dashboard, Users & Roles, Audit Log and Settings

- [ ] AD01 Account search/filter and View members show correct role, workspace and active status without switching identity.
- [ ] AD02 Create/edit/suspend/reset a disposable account; correct Tenant linking and session revocation apply.
- [ ] AD03 Last-active-Admin and self-access protections prevent accidental lockout.
- [ ] AD04 System status refresh shows method, check time and limits; Available/Disabled/Not configured/Recorded success do not claim overall accuracy or live delivery.
- [ ] AD05 Audit filtering/export preserves actors, actions, reasons and times for permitted operations.
- [ ] AD06 Maintenance controls respect protected records; cache cleanup does not delete original bills/documents or financial history. Test only in an agreed disposable profile.
- [ ] AD07 Admin has maintenance authority without gaining Manager rent-confirmation or operational billing authority.

## 17. Workspaces, recovery and resilience

- [ ] W01 A second independent workspace cannot see the first's records, originals, receipts, exports, mappings or job status. Managers in one workspace intentionally share its portfolio.
- [ ] W02 Account/workspace membership changes revoke affected sessions; reopening does not reveal old-workspace data.
- [ ] W03 An authorized backup contains the consistent database, referenced documents and completed checksum manifest.
- [ ] W04 Restore into a separate new directory verifies package/integrity and preserves bills, sources, payments and original receipts. Never restore over the working portfolio for QC.
- [ ] W05 Restart the same profile: saved records remain, and processed mailbox items/bills/payments do not duplicate.
- [ ] W06 In an agreed interruption test, connection errors are clear and recovery does not repeat a payment or lose correction input. A mailbox failure does not halt unrelated local jobs.

## 18. Phone, keyboard and printing

- [ ] UX01 Check desktop and actual phones: no clipped amounts, horizontal overflow, overlapping actions or inaccessible navigation.
- [ ] UX02 Keyboard can reach controls; focus is visible; inputs have useful labels and validation messages.
- [ ] UX03 Phone correction inputs remain readable; decimal keyboard hints and stacked actions work with the on-screen keyboard open.
- [ ] UX04 Loading, empty, error and retry states explain the next action; repeat taps do not duplicate submissions.
- [ ] UX05 Receipt tabs, download, actual print/Save as PDF, calendar and notification links work on the intended devices.

## 19. Login and common form controls: individual checks

- [ ] F01 Submit login with both fields blank: required-field feedback; no session is created.
- [ ] F02 Submit a malformed email: clear validation; no sign-in.
- [ ] F03 Submit a correct email with a wrong password: no access and no private account details in the error.
- [ ] F04 FIXTURE — Sign in with a suspended account: denied even if its password is correct.
- [ ] F05 Refresh an authenticated page: session and permitted route behave consistently, without switching identity.
- [ ] F06 Open each visible sidebar item: the page title, selected item and content agree; no dead control.
- [ ] F07 Close a dialog using its displayed Cancel/Close control: no write is saved.
- [ ] F08 On dialogs supporting Escape, press Escape: focus returns to the launching control and no record is changed.
- [ ] F09 Edit a guarded form and navigate away: cancelling Discard keeps the entered values; accepting Discard abandons them.
- [ ] F10 Enter markup-like text in a permitted synthetic name/note, such as `<b>QA example</b>`: displayed as text, not interpreted as HTML.
- [ ] F11 Double-click a Save/Submit action: one logical change is saved, with useful pending feedback.
- [ ] F12 FIXTURE — Fail a save request: entered values/reason remain available; success is not falsely reported; check the saved state before retrying an uncertain result.

## 20. Portfolio and Tenant detail controls: individual checks

- [ ] E01 Properties: search a known record, an unknown value and then clear search; matching, empty and restored lists are correct.
- [ ] E02 Properties: open each available filter and combine it with search; only matching records appear.
- [ ] E03 Properties: create a valid synthetic record; reopen Edit and verify every saved field.
- [ ] E04 Properties: blank required fields and invalid supported-location inputs are rejected without creating a record.
- [ ] E05 Properties: cancel an edit; reopening shows the previous saved values.
- [ ] E06 FIXTURE — Delete an unused synthetic property through its confirmation; dependent properties remain protected.
- [ ] E07 Units: change property selection and search; counts/cards belong to the selected property.
- [ ] E08 Units: create and edit a synthetic unit; code, floor, rent and arrangement survive reload.
- [ ] E09 Units: reject blank required fields, invalid rent and conflicting codes/assignments according to the displayed rules.
- [ ] E10 Units: Details opens the intended Tenant; Add occupant is available only for an eligible shared unit and permitted Manager.
- [ ] E11 FIXTURE — Delete an unused unit; a unit with protected assignments/history cannot be removed.
- [ ] E12 Tenants: search by name/unit and exercise each available status/arrangement filter; clearing restores the list.
- [ ] E13 Tenants: open Overview, Billing, Payments and Documents; each tab retains the selected Tenant identity.
- [ ] E14 Overview: edit permitted contact and emergency-contact values; verify reload and the relevant profile view.
- [ ] E15 FIXTURE — Manager adds a Tenant with valid dates to an available unit; correct first-cycle records/eligibility result, not another Tenant's assignment.
- [ ] E16 FIXTURE — Reject an assignment end before its start and an overlapping Individual assignment; no partial enrollment.
- [ ] E17 FIXTURE — End a lease using a valid date/reason; historical bills/receipts remain accessible and later-cycle eligibility follows the end date.
- [ ] E18 Tenant Billing tab: View bill opens the correct bill and source/allocation, not a similarly named Tenant's bill.
- [ ] E19 Tenant Payments tab: pending, rejected and confirmed entries retain their actual dates, amounts and references.
- [ ] E20 Documents: upload an allowed synthetic PDF; it appears with the correct Tenant and metadata after reload.
- [ ] E21 Documents: upload an allowed synthetic image; preview is readable and attached to the correct Tenant.
- [ ] E22 Documents: preview and download each file type; download content matches the original and access is audited.
- [ ] E23 Documents: cancel file selection; no empty document row is created.
- [ ] E24 FIXTURE — Submit an unsupported or over-limit document using the implementation's accepted-type/size limits: clear rejection and no stored document row. Record the exact size/type tested.

## 21. Incoming source and Case Sheet controls: individual checks

- [ ] Q01 Upload source: cancel the dialog/file picker; no source/bill is created.
- [ ] Q02 Upload source: unsupported/corrupt input produces safe rejection or a reviewable failure; it never silently finalizes.
- [ ] Q03 Incoming Bills: open a Processed row's View bill; Tenant/source/amount agree with that row.
- [ ] Q04 Incoming Bills: open Needs review and Duplicate rows; Review/Compare identifies the right reason and source.
- [ ] Q05 Case Sheet: switch between cases and expand/collapse What the system extracted; values do not leak from the previous selection.
- [ ] Q06 Case Sheet: open original, download original and view available extracted text; values are readable and source access is protected.
- [ ] Q07 FIXTURE — Missing/failed original: feedback explains the failure; Retry original does not erase proposal fields or publish a charge.
- [ ] Q08 Staff: add an investigation note; author, reason and case association remain after reload.
- [ ] Q09 Staff: escalate a setup case; Manager can find it and read the note without Staff altering configuration.
- [ ] Q10 Staff: submit a correction with blank reason/evidence required by the form: validation prevents submission.
- [ ] Q11 Staff: correct each supported field independently, then a supported multi-field combination using separate fixtures; proposal before/after values match the inputs.
- [ ] Q12 Staff: leave an unaffected field alone; it is not cleared or included as an accidental correction.
- [ ] Q13 Manager: cancel Authorize/Reject/Correct directly actions before submission; case remains unchanged.
- [ ] Q14 Manager: reject with a reason; Staff reads it in Returned and submits an evidence-based revision.
- [ ] Q15 Manager: use Correct directly instead on an eligible unfinalized fixture; correction history identifies Manager and successful validation is still required.
- [ ] Q16 FIXTURE — Save succeeds but refresh fails: Reload saved case shows the existing saved proposal/decision without another write.
- [ ] Q17 Queues: Needs action, With Manager, Returned, Resolved and All cases lead to their matching states; old history remains available.
- [ ] Q18 LIVE — Manual Sync displays successful/partial/failed intake accurately; pressing it again does not bypass source/bill duplicates.

## 22. Rent report and direct-record controls: individual checks

- [ ] PAY01 Tenant: Cash report shows the full outstanding amount and does not require an electronic reference.
- [ ] PAY02 Tenant: Bank transfer requires its reference; valid submission retains method/reference in the pending report.
- [ ] PAY03 Tenant: E-wallet requires its reference; valid submission retains method/reference in the pending report.
- [ ] PAY04 Tenant: switch Bank/E-wallet to Cash before submission; obsolete reference is cleared/excluded.
- [ ] PAY05 Tenant: Cancel report leaves the bill unpaid and creates no payment or receipt.
- [ ] PAY06 Tenant: a pending-report bill cannot be reported again; no premature receipt action appears.
- [ ] PAY07 Tenant: after Manager rejection, reason/history remain and an eligible full outstanding amount can be reported again.
- [ ] PAY08 Manager: Review rent opens the intended pending report; confirm checks the correct amount, Tenant and bill.
- [ ] PAY09 Manager: reject without a reason is blocked; Cancel leaves the report pending.
- [ ] PAY10 Manager Record rent: outstanding amount and Philippine payment date prefill correctly; final confirmation summarizes date/method/amount.
- [ ] PAY11 Manager Record rent: nonmatching outstanding amount, invalid date or missing electronic reference is rejected according to validation; no receipt is created.
- [ ] PAY12 Manager Record rent: missing external-check confirmation blocks submission; the portal never claims automatic bank verification.
- [ ] PAY13 Manager Record rent: pending Tenant report must be reviewed rather than accepting a parallel direct payment.
- [ ] PAY14 FIXTURE — Paid/zero-balance bill cannot accept another rent report or cash record.
- [ ] PAY15 Receipt history: expand/collapse independently of bill filters; View, Print and Download retain the same original payment/reference.
- [ ] PAY16 FIXTURE — Correct confirmed rent: original payment/receipt stay intact; any nonzero difference is identified for external settlement review, without an automatic refund/new receipt.
- [ ] PAY17 FIXTURE — Correct an eligible unpaid rent cycle: all frozen recipients reconcile to the revised cycle; old/new amount and reason remain in history.
- [ ] PAY18 FIXTURE — Advance application leaves a partial final balance: only the remaining balance can be reported; repeat application does not consume credit twice.

## 23. Tenant home, history, tracker and calendar controls

- [ ] TH01 My Home Report rent payment opens the correct current eligible rent bill.
- [ ] TH02 My Home View receipt opens the confirmed original receipt for that bill.
- [ ] TH03 Bills: month filter alone returns matching bills; no-match month shows useful empty guidance.
- [ ] TH04 Bills: category filter alone separates rent, electricity and water.
- [ ] TH05 Bills: each status filter alone matches actual bill/tracking state.
- [ ] TH06 Bills: combine month/category/status; Reset filters restores the full own-bill list.
- [ ] TH07 Tracker: Mark personally paid changes only the selected own utility bill/version; rent balance remains unchanged.
- [ ] TH08 Tracker: Undo mark restores current tracking status and preserves dated history.
- [ ] TH09 Tracker: mark/undo preserves active bill filters and highlights only after successful saving.
- [ ] TH10 FIXTURE — Utility bill revision retains old tracking history and requires reviewing the current version; an old mark is not silently treated as current confirmation.
- [ ] TH11 Calendar: previous/next month works, including December/January; selecting a date shows that day's correct entries.
- [ ] TH12 FIXTURE — Several categories due the same day: all applicable icons/text are represented and each entry opens its own bill.
- [ ] TH13 FIXTURE — Future rent estimate stops after a known occupancy end; an actual bill replaces its corresponding estimate.
- [ ] TH14 Tenant documents/receipt links still work after changing bill filters or reopening history.

## 24. Notifications and Tenant settings controls

- [ ] TS01 Notifications opens saved alerts; unread count refreshes when the page opens.
- [ ] TS02 Mark all read persists after reload and affects only the signed-in Tenant's alerts.
- [ ] TS03 An alert's View bill/linked action opens the intended own-account record; logged-out access requires authentication.
- [ ] TS04 A portal message addressed by Tenant ID reaches the correct account even if another Tenant has the same display name.
- [ ] TS05 Profile Save changes persists permitted name/contact/email changes; invalid/duplicate email is rejected without overwriting another identity.
- [ ] TS06 Assigned unit remains non-editable from Tenant Settings.
- [ ] TS07 Billing updates preference saves independently and survives reload.
- [ ] TS08 Due-date reminder preference saves independently and survives reload.
- [ ] TS09 Payment confirmation preference saves independently and survives reload.
- [ ] TS10 Rent email notifications preference saves independently; utility email/SMS cannot be enabled.
- [ ] TS11 Change password rejects wrong current password and a new password outside the displayed policy; old access remains unchanged on rejection.
- [ ] TS12 Change password Cancel makes no change; successful change invalidates sessions and requires the new password on sign-in. Use a disposable account.
- [ ] TS13 Settings Profile/Notifications/Security navigation reaches the correct section; Sign out ends the session.
- [ ] TS14 LIVE — Push permission denied/unsupported: useful guidance appears and saved portal alerts remain usable.
- [ ] TS15 LIVE — Permission allowed: actual subscription status is distinct from browser permission; a new allowed event reaches each enrolled intended phone.

## 25. Manager settings and Reports controls

- [ ] MS01 Billing rules expands/collapses; fixed rent, advance, equal allocation and reminder policies have no editable override.
- [ ] MS02 Save mailbox settings persists a valid address; changing this address alone does not claim that IMAP credentials/connectivity are verified.
- [ ] MS03 Invalid mailbox address is rejected; Cancel changes restores saved values.
- [ ] MS04 Mappings: Add mapping saves a valid provider/account/unit/category in this workspace; Cancel creates none.
- [ ] MS05 Mappings: Edit changes the intended mapping only; duplicate/invalid target data is rejected.
- [ ] MS06 FIXTURE — Mappings: Delete unused synthetic mapping follows its confirmation; any dependency protection is respected. Historical bills are retained.
- [ ] MS07 Notifications: Enable Web Push delivery preference saves; disabling it does not delete bills or portal access and enabling it does not itself establish delivery.
- [ ] MS08 Manager profile: name/email/phone Save persists valid values; invalid/duplicate email cannot take another account's identity.
- [ ] MS09 Settings section switch with edits: Discard cancellation preserves input; Cancel changes restores saved values; successful save clears Unsaved changes.
- [ ] MS10 Reports: Current month, Today, Last 30 days, Last 365 days and All recorded dates use the selected recorded-date range.
- [ ] MS11 Reports: compare one known confirmed rent record and one outstanding rent record against the selected totals; historical utility financial entries do not increase current rent collections.
- [ ] MS12 Reports: export CSV under the selected range/filters; rows/amounts match the report and do not include another workspace.

## 26. Admin account, workspace and maintenance controls

- [ ] AC01 Users & Roles: search known/unknown email/name and clear search; correct matching/empty/restored results.
- [ ] AC02 Independently select Business, Role and Status filters, then combine them; selected directory and counts are consistent.
- [ ] AC03 Create Manager/Staff in a synthetic workspace; each lands with its permitted navigation and scoped records.
- [ ] AC04 Create Tenant account with a valid permanent Tenant ID; wrong/missing/conflicting linkage is rejected without creating the wrong account.
- [ ] AC05 Create user: duplicate/malformed email, blank required fields and invalid password are rejected; Cancel creates no account.
- [ ] AC06 Edit user: permitted role/workspace/contact changes persist and affected sessions lose their old privileges.
- [ ] AC07 Suspend a disposable account: new login and old sessions cannot access protected records; reactivation restores the intended permitted access.
- [ ] AC08 Reset password on a disposable account: previous sessions/password cease working and assigned new credentials work.
- [ ] AC09 Create workspace then Rename it: directory/header/member association use the updated name without moving another business's data.
- [ ] AC10 View members filters accounts to that workspace without impersonating a member or changing the Admin's identity.
- [ ] AC11 Audit Log: exercise available search/action/date filters, empty results and export; recorded actors/reasons match the operation.
- [ ] AC12 Dashboard Full log opens the authorized complete audit view rather than just recent maintenance.
- [ ] AC13 Refresh status: one completion result and updated check time/audit entry; no message sending or bill processing is triggered.
- [ ] AC14 FIXTURE — Backup action creates a completed package/manifest, with useful failure feedback rather than a false success if completion fails.
- [ ] AC15 FIXTURE — Restart OCR worker: maintenance feedback/audit appears and a later OCR fixture can run; no existing financial records are lost.
- [ ] AC16 FIXTURE — Purge temporary cache: confirmation/cancellation works; source files, Tenant documents and financial history survive.

## 27. Permissions matrix to execute with separate sessions

For each row test the visible controls, direct protected route and, with a technical tester, the corresponding existing protected API. A hidden button alone is not evidence of server enforcement. Use the existing browser/API tests for request-level cases when you are not comfortable constructing requests manually.

| Action | Admin | Manager | Staff | Tenant |
| --- | --- | --- | --- | --- |
| Manage users/workspaces and system maintenance | Allow | Deny | Deny | Deny |
| Read workspace portfolio and operational intake | Deny | Own workspace | Own workspace | Deny |
| Create/delete portfolio enrollment; change rent/lease/mappings | Deny | Own workspace | Deny | Deny |
| Edit existing permitted descriptive/contact fields | Deny | Own workspace | Allowed field subset | Own allowed profile only |
| Submit utility correction proposal | Deny | Manager direct correction/decision workflow | Own workspace, eligible source | Deny |
| Authorize proposal / confirm rent / apply advance | Deny | Own workspace | Deny | Deny |
| Submit own rent report / own utility mark | Deny | No Tenant impersonation | Deny | Own eligible bill |
| Retrieve Tenant bill/receipt/source | No operational billing authority | Authorized own workspace | Permitted own-workspace operational access | Own permitted records only; no operational source endpoint |
| Reports / billing settings | Deny | Own workspace | Deny | Deny |

- [ ] SEC01 Execute each applicable Allow cell with the intended account and synthetic record; allowed actions succeed.
- [ ] SEC02 Execute each Deny cell using direct navigation/request as appropriate; no protected data or write is returned.
- [ ] SEC03 Replace a permitted bill/document/receipt identifier with another Tenant/workspace's identifier: denied with no private content.
- [ ] SEC04 Submit a forbidden financial field through Staff's existing-record update request: rejected, not merely hidden in the form.
- [ ] SEC05 Reuse a logged-out/suspended/moved account's old session: denied without old-role data.

## 28. External and recovery acceptance: separate from showcase

- [ ] LIVE01 Authorized actual Meralco content: independently record the five expected fields, retrieve via the agreed mailbox/label, and compare output/assignment or correct review hold.
- [ ] LIVE02 Authorized actual Manila Water content: repeat with that provider's actual format; do not assume Meralco evidence establishes compatibility.
- [ ] LIVE03 Collect additional independent authorized image/scan formats; record exact fields/holds rather than treating renamed fixture copies as new samples.
- [ ] LIVE04 On each intended actual phone, verify reachable current LAN HTTPS, trusted certificate, login, tapping/scrolling and keyboard accessibility.
- [ ] LIVE05 On an authorized rent-email session, inspect actual inbox delivery and open the reachable portal link on the recipient phone. SMTP acceptance alone is insufficient.
- [ ] LIVE06 Phone Push: receive a new eligible event in the supported browser/background state and tap it; correct Tenant authentication/destination is enforced.
- [ ] LIVE07 During an agreed mailbox-connectivity interruption, processing status explains failure; restored connection allows eligible retry without duplicate charges.
- [ ] LIVE08 Copy a complete backup privately and restore to a new directory on the intended recovery device; originals, accounts, bills, payments and original receipts open correctly.
- [ ] LIVE09 Restart the same selected profile after recording references; records persist and already processed sources do not generate more bills.
- [ ] LIVE10 Print/Save as PDF an actual generated test receipt on the intended device; no clipped identity/amount/reference or blank extra content.

Formal participant evaluation and representative extraction-accuracy measurement require the approved procedure and separate evidence. Completing this functional checklist does not itself complete those research activities.

## Record each result

```text
Check ID:
Result: Pass / Fail / Blocked / Not tested
Date / tester:
Profile and URL / workspace:
Device / browser / role:
Bill, source, proposal or receipt reference (where relevant):
Steps:
Expected:
Actual:
Screenshot / exact error:
```

Prioritize wrong-account access, wrong amounts, lost history and duplicate charges/receipts before cosmetic issues. Do not include passwords, keys or full private provider account numbers in shared reports. Synthetic test outcomes are not participant responses or representative provider-accuracy measurements.

References: [current QA evidence](qa-report.md), [manual test guide](manual-test-guide.md), [Group 3 demonstration](../../reports/demo-files/group-3/README.md), [Staff responsibilities](staff-implementation-plan.md), [scope](capstone-scope.md), [backup and recovery](backup-and-recovery.md).
