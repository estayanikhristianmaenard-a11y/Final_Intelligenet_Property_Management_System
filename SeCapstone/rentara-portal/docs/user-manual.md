# Rentara implementation and user manual

Version 2.0 · 11 October 2026 · Pasig City scope

## Start the website

Opening `index.html` as a `file://` URL blocks the application's ES modules. This application also requires its database/API server. Use the HTTP address below.

In PowerShell:

```powershell
Set-Location 'D:\Systems\Final_Intelligenet_Property_Management_System\SeCapstone\rentara-portal'
npm.cmd ci
npm.cmd run setup
npm.cmd start
```

Setup asks for a password of 12–200 characters and creates an **empty portfolio** with these accounts:

| Account | Role |
| --- | --- |
| `admin@propertypro.ph` | System Administrator |
| `manager@propertypro.ph` | Property Manager |

Both initially use the password entered at setup. Assign separate passwords before real operation. Setup refuses to overwrite an initialized database.

Open **http://localhost:8080/**. Keep the terminal running while using the portal. Press Ctrl+C to stop the server. XAMPP Apache/MySQL are unnecessary for this Node/SQLite startup path.

For an isolated demonstration, copy `.env.example` to `.env`, set `DATA_DIR=data/demo`, and run `npm.cmd run setup -- --demo`. This explicitly creates four example properties, three distinct shared occupants, one tenant account, and first-cycle bills through the real rent engine. Example accounts are `admin@propertypro.ph`, `manager@propertypro.ph`, and `maria.santos@gmail.com`; the local demonstration password is `LocalDemo!2026`. Use a separate data directory for real records. Remove an inherited `INITIAL_PASSWORD` environment variable if you want the documented demo password.

The default database is `data/propertypro.sqlite`. Files, backups and OCR cache remain under the configured `DATA_DIR`, which must be a private server directory. The repository ignores this directory and `.env`.

If port 8080 is already occupied, set `PORT` in `.env` and use that port's HTTP address. For the existing Apache URL on port 80, start this backend on 8080; the frontend selects the local 8080 API. Custom Apache ports or remote deployment need a matching API configuration/reverse proxy and explicit `ALLOWED_ORIGINS`.

## Populated desktop and phone showcase

Independent owner support is documented in [Workspaces](workspaces.md). Existing records remain in the Default workspace. Admin creates another workspace and assigns its Manager under Users & Roles. The showcase also includes Riverside Rentals, with Manager `manager2@example.test` and Tenant `luis.garcia@example.test`, both using `LocalDemo!2026`. Each sees only that portfolio; the original Manager, Maria and Alice retain their existing records and credentials. Workspace names appear in the sidebar/mobile header.

On a desktop with a mouse, the sidebar begins as an icon rail. Move the pointer into it to expand the labels; move out to collapse it. Keyboard focus on a sidebar control also expands it. The desktop topbar has no sidebar menu button or user dropdown. **Log out** is directly above the user details at the bottom of the sidebar for every role. On phones/tablets, use the topbar menu button to open the drawer and its Close button to dismiss it. Settings remain available in the sidebar; the Tenant phone navigation also includes Settings.

Run `npm.cmd run demo:showcase` from the portal directory to create or reuse the separate `data/showcase` database and activate it by changing only `DATA_DIR` in the local `.env`. The command never replaces an existing initialized database. Restart the running Node server afterward. Accounts are `admin@propertypro.ph`, `manager@propertypro.ph`, and `maria.santos@gmail.com`; all use `LocalDemo!2026`.

The showcase includes two previous rent cycles with confirmed receipts, current outstanding rent, another Tenant's pending rent report, electricity/water bills and their calendar dates, a personal utility mark, saved alerts, a portal message, and a synthetic PDF needing account review. Bills and payments are created through the real billing and confirmation functions. Every sample PDF states that it is not a real provider bill. The showcase's explicit database marker disables outgoing SMTP, Web Push, and IMAP polling even if credentials exist locally.

For a second phone, Alice Reyes can sign in with `occupant2@example.test` and `LocalDemo!2026`. This synthetic login belongs to the existing second shared occupant, with her own bill shares and receipts. Rerunning the showcase command adds the missing login to a ready showcase without resetting existing accounts, passwords, bills or tracker history. Existing customized or conflicting identities are preserved rather than overwritten.

The Tenant utility tracker is directly beneath rent on desktop and phones. The calendar is beside these cards on desktop and follows the tracker on phones. To return to your previous database, set `DATA_DIR=data/demo` (or your previous directory) in `.env` and restart Node. Old records remain in their original directory. New changes made while the showcase is active are saved only to the showcase.

## Administrator

1. Sign in with the Admin account. Role selection on the login page only fills an example email; the server determines permissions from the account.
2. Open **Users & Roles** to add, edit, suspend or reset accounts. A Tenant account requires the permanent tenant ID created by the Manager. Usernames must use unique email addresses.
3. Resetting a password or changing an account invalidates that account's existing sessions. A Tenant can change their own password under Settings by supplying the current password.
4. Use **System Dashboard** to check database integrity and integration state, create a SQLite backup, restart the OCR worker, or purge temporary cache files. Purge leaves source documents, tenant documents and financial records intact.
5. Review/export **Audit Log**. Audit records are retained in the database; they are not a cryptographically signed or independently immutable ledger.

The last active Admin and the current Admin's own access cannot be removed. Admin cannot manage properties, inspect tenant bills, correct charges or confirm payments through the API.

## Manager: portfolio and leases

1. Add a property in Pasig City. Add units with the whole-unit monthly rent and an Individual or Shared arrangement.
2. Add a tenant and record the original lease start, assignment start, and optional lease/assignment end dates. Assignment start defaults to lease start. Individual units reject overlapping assignments.
3. Use the permanent tenant ID when asking the Admin to create the account. Do not create a second identity to represent another shared occupant; every occupant must have their own tenant record.
4. Use **Edit / End lease** or **View Full Profile** to update contact details and termination dates. End dates are inclusive. Changes to lease/assignment dates or rent settings with financial history require a reason and retain old/new values.
5. Delete only unused records. Records with dependent accounts, assignments or financial history are protected. Original lease start and unit transfer are restricted after billing; this version handles one current assignment/lease per tenant record, not renewal/transfer history under the same identity.

Shared rent uses a common anniversary for the unit's billing group. Conflicting tenant anniversary days enter C02 review rather than generating multiple whole-unit charges. Correct the group's configuration before generating rent; do not falsify lease dates to clear an exception.

The server checks rent every minute using the Philippine calendar date, including assignments added after an earlier check that day. **Generate rent** safely catches up eligible cycles and does not create duplicate lease/month charges. Generation and due date are the anniversary date; a missing day uses the month's last day and returns to the original day next month. Rent is fixed and non-prorated. The first cycle has separate rent and advance-rent lines.

Once the first payment is confirmed, advance becomes available credit. In Billing Records, the Manager selects **Apply advance** on the final applicable rent bill and confirms the application. Generation and payment confirmation alone do not apply it. The bill retains gross charge, credit, remaining balance and the original receipt reference. A fully covered bill becomes Paid using the original confirmed payment/receipt; no new cash payment or receipt is created. A remaining balance stays Unpaid and may be reported. Zero-balance bills cannot be reported and receive no unpaid reminder. Repeated application returns the existing settlement.

If the final cycle is already reported/paid, or the confirmed advance exceeds its final share, A01 review preserves the credit and transaction. A pending report can be rejected with a reason and revalidated. For an incorrect unpaid rent amount, **View bill → Correct rent** recomputes the whole cycle using frozen recipients and records a reason. Confirmed payments require Manager review and an approved settlement procedure; this version never silently rewrites them or invents a refund.

## Manager: utility intake and review

Rent generation remains automatic. **Check rent cycles** in Bills & Payments is a secondary recovery/check action; it generates eligible missing cycles and preserves already generated cycles. In Settings, expand **Billing rules** to read the fixed policy; mailbox settings remain editable separately.

1. In **Settings → Mappings**, configure a unique provider/account identifier, target unit and electricity/water category. Configure these before intake.
2. Use **Bills & Payments → Upload source** for a readable digital or scanned PDF, PNG or JPEG, or **Sync intake** for the configured mailbox.
3. Intake retains the original document and extracted values. V01–V04, C01–C02 and A01 decide whether the document finalizes or enters the Exception Queue.
4. In **Incoming Bills**, select **Review bill**; **Review & correct** in the Exception Queue opens the same review screen. Compare the original document with the extracted details, then select the incorrect field and enter its corrected value and a reason. **Save correction** revalidates the change and retains the original value, Manager and revision. Close or Cancel leaves records unchanged. Download original and extracted text remain available inside the review. Correct both period endpoints separately when needed.
5. Revalidate after fixing an unresolved mapping or occupancy configuration. A failed revalidation stays open. Later duplicate documents remain held; correct the original source rather than generating a second charge.
6. Source corrections recompute unpaid charges and retain prior revisions. Frozen recipient lists remain fixed after finalization. Reported or confirmed source charges are protected.

Provider-specific labelled templates recognize Meralco, Maynilad and Manila Water names and explicit account/amount labels. Meralco summaries support `Customer Account Number (CAN)`, `PHP` amounts and billing periods with English month names. The visible CAN is used for mapping; SIN is not substituted for CAN. Masked account identifiers require correction using verified account information. No hidden characters are recovered. Water templates support our selected labelled test formats; representative provider layouts still need acceptance checks.

Dates must be valid ISO dates or explicit English month dates such as `March 5, 2026` or `5 March 2026`; period endpoints use the same rules. Ambiguous numeric dates, impossible dates and malformed amounts require Manager review. Digital PDF pages use direct text extraction. Image-only pages are rendered temporarily and passed to the existing OCR worker. Limits: 10 MB per document, 50 total PDF pages, at most 3 image-only OCR pages, a rendered page no larger than 4096 pixels per side or 8 million pixels, 30 attachments and 35 MB per email. Canvas support supplied through PDF.js's optional dependencies must be installed for scanned-PDF rendering. OCR images are not saved as duplicate source files. Encrypted, unsupported, oversized-rendering or unreadable sources enter review when within intake limits; oversized emails/uploads are rejected and require operator handling.

Shared utility eligibility is evaluated on the source period's final day; rent eligibility on generation day. Shares use integer centavos, with residual cents assigned by ascending permanent tenant ID. All shares reconcile to the whole charge.

### Connect a real mailbox locally

`propertymanager@gmail.com` was supplied as a made-up address. Saving it in Settings does **not** create or connect a Gmail account.

Copy `.env.example` to `.env` and configure an account you control:

```dotenv
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_MAILBOX=INBOX
IMAP_USER=your-real-property-account@gmail.com
IMAP_PASSWORD=
IMAP_ACCESS_TOKEN=
```

Set a valid account-authorized IMAP password or OAuth access token **locally**, following the provider's account settings. Do not put credentials in source control or chat. Restart the server. Manual Sync and the five-minute scheduler retrieve attachments over TLS. UID/UIDVALIDITY records prevent importing completed messages again. Each batch processes up to 100 new messages. OAuth token refresh is an operator responsibility in this version.

No real mailbox credentials were supplied, so live Gmail authentication/retrieval is pending. MIME attachment parsing, digital PDF extraction, image OCR and finalization were tested locally with real documents.

## Tenant and payments

Paid bill rows keep their receipt actions. The additional **Receipt history** archive starts collapsed; expand it when you need the full list. Viewing, downloading or expanding history does not create another payment or receipt.

1. Sign in with the account assigned by the Admin. **My Home** shows your assignment and balance; **My Bills & Payments** shows your own cycles and line details.
2. Report the **full outstanding amount** for a selected unpaid bill. Select Cash, Bank transfer or E-wallet. The reference field appears and is required for electronic methods only. Changing back to Cash clears and excludes that reference.
3. The status becomes **Tenant Reported Paid**. No receipt exists until the Manager confirms.
4. The Manager can confirm or reject a pending report with a reason. Rejected reports remain in history; the bill becomes unpaid and can be reported again.
5. After confirmation, status and line statuses become **Paid** and one unique receipt is issued. Repeated confirmations return the same receipt. **View receipt** opens a compact black-and-white payment receipt without downloading. Select **Print** to print or save as PDF, or **Download** to save the HTML. The system generates this document from the original payment record when requested; it does not store a separate PDF or image for each receipt.
6. Manager-uploaded documents are available under My Bills. The Manager can upload/preview/download them in the tenant panel. Both routes enforce ownership and log downloads.
7. **Notifications** includes saved alerts and the authenticated portal inbox. New bills, rent confirmations/rejections, advance applications and eligible reminders appear here without requiring Web Push enrollment. Open Notifications or reload it to see current alerts; opening the page also refreshes the bell's unread count. **Mark all read** persists and affects only your own alerts. Manager messages address the permanent tenant ID, even if two tenants have the same display name.
8. **Settings** saves profile/contact details, push preferences and password changes. Password changes invalidate sessions and require sign-in again.

There is no bank verification, payment gateway, SMS, or utility email delivery. Supplementary rent emails are available when SMTP sending is configured.

## Web Push

Run `npm.cmd run push:keys` to save generated VAPID keys directly into local `.env` without printing the private key. Set `VAPID_SUBJECT` to your contact `mailto:` address and `PORTAL_URL` to the portal's public URL. Existing keys are preserved; rotating keys requires re-registering subscriptions. Restart the server.

In a supported browser on HTTPS or localhost, the Tenant chooses **Enable Web Push** and grants permission. The page registers `sw.js`, subscribes through PushManager and saves the actual endpoint/keys to the authenticated backend. The worker handles background notifications and opens the portal. Billing/correction events and eligible unpaid reminders are saved before delivery. The delivery worker retries transient failures up to five attempts and removes expired endpoints. Portal records remain accessible when delivery fails or permission is denied.

Reminder events are created once per bill/due date, exactly three **Philippine calendar days** before an existing unpaid bill is due. A new rent cycle generated on its due date does not exist three days earlier and therefore cannot have a prior unpaid reminder. Keep the server running; a day missed while offline does not retrospectively deliver a three-day reminder.

The service worker installed and activated in an actual Edge browser test. Encryption, payload creation, retry and deduplication passed with a test transport. **Actual provider-to-browser background delivery remains unverified** without configured deployment keys and an enrolled device.

## Rent email notifications

Rent emails supplement saved portal alerts and Web Push. They cover new/revised rent bills, eligible rent reminders, and Manager-confirmed rent payments. They link to the authenticated portal and do not attach receipts, verify payment, or change payment status. Utilities, personal utility tracking marks, rejection notices, and general Manager messages are not emailed.

Configure sending credentials locally in `.env`, then restart the Node server:

```dotenv
RENT_EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-authorized-sender@example.com
SMTP_PASSWORD=your-provider-approved-app-password
SMTP_FROM=your-authorized-sender@example.com
PORTAL_URL=http://localhost:8080/
```

Use credentials authorized for SMTP sending by your mail provider. The example above contains placeholders. For port 587 the sender requires STARTTLS; port 465 uses TLS from connection start. Certificate validation remains enabled. Keep these settings in the ignored `.env` file. `PORTAL_URL` must be an address the recipient can actually reach; localhost links open only on the same computer. Use the computer's LAN address for a same-network phone demo, or the HTTPS site address for deployment. Incoming IMAP credentials and outgoing SMTP credentials are separate settings.

The running scheduler checks every minute. Tenant Settings includes **Rent email notifications**; the billing, reminder, and payment category preferences also apply. Reminders retain the approved 9 AM Philippine-time, three-days-before-due rule. Pending reports, Paid rent, old reminder dates, and stale bill revisions are excluded. No email permission is required in the browser.

Each eligible saved event records its independent email status and up to three sending attempts, at least five minutes apart. SMTP acceptance is recorded as `accepted`; it does not establish inbox delivery or readership. Interrupted submissions with uncertain acceptance are marked `unknown` and are not automatically resent. The Admin service list reports SMTP configuration and observed acceptance. Events encountered while SMTP is disabled/unconfigured are recorded as `unconfigured` and are not retroactively sent when configuration changes. No real SMTP delivery is claimed by the automated tests, which use synthetic recipients and an injected transport.

## Utility source review

Open **Review** / **Correct source** from Bills or the Exception Queue. The dialog displays the original PDF or clear bill image beside the extracted provider, account/reference, amount, due date, and period dates. Select the field to correct; its current extracted value fills automatically. Enter the corrected value and a reason, then save. The backend preserves correction history and reruns validation; saving does not guarantee finalization when other problems remain.

Original files require Manager authentication. Email sources without an inline preview offer a download and escaped extracted text. Missing files do not prevent reviewing or correcting the extracted fields. Phones stack the original source and correction form vertically.

## Backup, recovery and deployment

Admin backups are SQLite snapshots under `DATA_DIR/backups`. Back up the entire data directory as well: SQLite backups alone do not include source/tenant document files. Recovery testing reopened a backup and verified database integrity and matching records.

For recovery, stop the server, preserve the current data directory, and restore a chosen backup to a **new private data directory** with its matching source/document folders. Set `DATA_DIR` to that directory and start the server. This avoids overwriting a live SQLite/WAL database.

Local operation is verified. Before real deployment, configure HTTPS/reverse proxy, private data-directory permissions, unique account passwords, allowed origins, real mailbox access, VAPID contact/keys, a continuously running server, and backup retention/recovery. Verify actual provider formats and live push delivery with an enrolled device. These deployment/provider acceptance checks are not implied by the local tests.

## Verification commands

```powershell
npm.cmd test
npm.cmd run test:backend
npm.cmd run test:browser
```

The browser suite uses installed Microsoft Edge on Windows. Set `BROWSER_EXECUTABLE` for another Chromium executable. On other platforms install Playwright's Chromium. Tests use temporary databases and do not change the configured operational database. Screenshots and a small-loopback performance sample are written under ignored `test-results/`.

See [QA report](qa-report.md) and [API/database contract](api-contract.md) for traceability and limits. Underlying integration references: [ImapFlow fetching guide](https://imapflow.com/docs/guides/fetching-messages/), [Web Push library](https://github.com/web-push-libs/web-push), and [Tesseract.js](https://github.com/naptha/tesseract.js).


## Revised rent and utility workflow

Tenants report rent through Report Payment. Only Managers confirm rent and issue rent receipts. Managers can also use Record rent on an unpaid rent row: enter the exact outstanding amount, actual payment date, method/reference, and confirm the payment was checked outside the system. A pending Tenant report must be reviewed instead of recording a second payment.

Utilities have a personal Mark personally paid / Undo mark button under My Bills & Payments. Each Tenant changes only their own bill/share. Provider payment is not verified, no Manager approval is required, and no utility receipt is issued. View bill shows dated tracking history; a corrected bill requires review of the current version. Shared tenants still arrange one provider payer outside the system.

Managers can correct paid rent through View bill > Correct rent. The original payment and receipt remain unchanged; a linked charge/balance revision is recorded. Nonzero differences require external settlement review, not automatic refunds, another payment, or a new receipt. Pending reports must be reviewed first. Utility source corrections preserve the original bill versions and personal marks.

The scheduler handles reminders during its 9:00-9:01 AM Philippine-time processing slot, three calendar days before the actual due date. Bills must exist by 9:00 AM. Later arrivals and missed slots do not produce backdated reminders. Pending rent reports and current-version self-marked utilities are excluded. Billing updates remain separate.

Historical utility payment/receipt records from older versions are retained, not converted into verified provider payments or automatically deleted. New utility financial reporting/confirmation is blocked. A local HTTP phone demo does not validate external Web Push; actual mailbox/provider documents and HTTPS devices still require acceptance testing.


## Billing usability improvements

For the complete upload → review → allocation → Tenant tracker journey and local bill fixtures, see [Utility-bill journey verification](archive/checkpoints/UTILITY_BILL_JOURNEY_QA.md). Recognized email-body summaries without attachments now use the same validation pipeline as bill uploads. New bill alerts provide **View bill** to open details directly.

### Simple rent journey

1. Tenant opens **My home**, checks the rent amount and due date, and selects **Report rent payment** after paying outside Rentara.
2. The bill becomes **Tenant Reported Paid**. The Tenant sees that Manager confirmation is pending; submitting a report does not issue a receipt.
3. Manager opens **Dashboard → Rent payments to review → Review rent**, checks the actual payment outside Rentara, and confirms or rejects the report in the payment register.
4. After confirmation, the Tenant can select **View receipt** directly from My home or Bills/history to read the original receipt inside the portal without saving a file. The preview provides **Print** and optional **Download**. Download rent receipt remains available separately. An HTML receipt can also be opened in a browser and printed/saved as PDF. The receipt adapts to phone widths and keeps the original payment details. Viewing or downloading it does not create another payment or receipt.

Electricity and water stay in the **Personal utility tracker** below rent. A Tenant can mark or undo their own paid mark. This does not confirm provider settlement, require Manager approval, change rent status, or generate a utility receipt.

The Tenant home screen separates outstanding rent from personal utility tracking. My Bills & Payments can filter bills by month, category and status, with Reset filters to restore all bills. Confirmed receipts and payment history remain available independently of the bill filters.

View bill explains shared allocations with the whole source charge, number of recipients and the Tenant share. Manager inbox cards have Review document: an authenticated original image/PDF is displayed alongside amount, due date, billing period, provider and account/reference. Use Correct source after checking the original; uncertain extraction still needs validation.

Exception cards explain a suggested next action while retaining the recorded reason and rule history. Record rent prefills the outstanding amount and Philippine date, then asks for confirmation of amount/date/method before saving. Notification screens explain HTTPS requirements, browser permission and unsupported browsers; permission alone does not establish an active subscription or delivery.

Account setup: the Manager creates the Tenant record and supplies its exact permanent record ID to the Admin when creating a Tenant login. The Admin links that ID and provides the assigned email and initial password privately. Tenants sign in using those credentials and change their password in Settings. Never give a Tenant another person's account or the Manager/Admin credentials.


Reports now show confirmed rent collections and outstanding rent separately from utility personal-tracking counts. Historical utility financial entries are retained but do not increase current rent collections. Bill filters remain selected after tracking updates. A revised utility mark requires review and is counted separately in reports. Restart the Node server after backend code changes; refresh the browser after frontend changes.

The compact bill list shows readable billing months and contextual actions. Due today/Overdue labels reflect actual bill dates in Philippine time; they do not predict future utility dates or verify provider payment. Utilities have no empty receipt action. Browser-alert setup is kept in one area above saved alerts and reports unsupported/blocked devices without removing portal access.

On the Manager intake screen, Direct text extraction means readable PDF/email text was used. Image OCR recognition estimates are labelled separately from validation. Needs review displays the recorded validation reason; it does not mean that hidden account characters can be recovered. Admin health distinguishes missing configuration, unverified setup and actual failed attempts.

Manager Settings separates **Locked billing rules** from **Mailbox settings**. Only the mailbox card has its own save action; this does not change the advance, rent, allocation or reminder rules. Admin home shows recent maintenance/account events; **Full log** retains authorized access to the complete audit history. The utility tracker heading includes its provider-verification disclaimer, and its outlined personal-mark buttons remain separate from the primary rent-report action.

The Billing calendar uses house, lightning and water-drop icons to identify rent, electricity and water. If several categories share a date, all applicable icons appear. Select the date for status, amount and the utility provider when present in the source. Icons and text labels supplement color.

Next month's rent date is a **scheduled estimate**, shown with a dashed border and an explicit label. It follows the original monthly anniversary and the short-month fallback, stops after a known occupancy end, and is replaced by an actual bill when available. It does not create a charge, payment, amount, receipt or notification. Utility due dates remain limited to received, validated bills; they are not predicted from the previous month. The user confirmed this distinction for the calendar.

Small control transitions, calendar selection feedback, dialog entry/exit and a brief post-save tracker highlight support interaction without changing payment status early. The tracker highlight appears only after a successful response. Reduced-motion settings disable decorative movement; the approved slow sidebar timing is retained.

## Staff and Manager handoff ? 23 October 2026

Sign in with your account email/password. Your role determines the available pages; there is no role-selection button. Staff starts at Daily operations. Open bill intake to upload or retrieve supported utility bills. Open Bills > Exceptions to inspect original documents, add investigation notes or escalate setup cases. Prepare correction sends proposed fields and a reason to Manager without changing the live bill.

Manager uses Bills > Exceptions to Authorize correction or Reject with a reason. Check the resulting state: applied is successfully revalidated; returned/stale requires another review. Managers may also use existing direct correction tools. Staff may edit only descriptive fields of existing properties/units/Tenants; Manager handles financial setup/enrollment and confirms rent. Utility marks remain personal Tenant tracking. Admin Settings lists all accounts with role, business and status filters; View members filters the directory without impersonating anyone.

Demo commands, boundaries and pending device checks: [Staff handoff](staff-implementation-plan.md).


### Finding the next action

Staff's Daily operations has three queues: **Needs action** for investigation, **With Manager** for submitted/escalated cases, and **Returned** for corrections needing another look. Select a queue to open its matching cases. Read the decision reason before preparing a revision. Use **All cases** to review older decisions.

The Manager dashboard starts with **Your decisions**: Staff proposals, rent reports and escalated cases. Managers still have access to daily operations when needed.

In Incoming Bills, the **Result** filter separates Processed, Needs review, Duplicate and Processing. A processed source has passed the existing billing workflow; it does not confirm utility payment. Duplicate records stay blocked for comparison. The mapped unit code appears beside each source when available. Select View bill for a processed source, or Review/Compare bill for a held source.

Expand Automatic processing for the latest recorded mailbox attempt, completed cycle, next eligible check and connection guidance. Reopen the page to refresh this snapshot. The laptop backend must remain running for scheduled work.


## Shared Case Sheet

Open **Bills & Payments > Exception Queue**. Select a work queue, then a case. The top of the sheet explains the issue and next step. **What the system extracted** expands the recorded fields; extracted does not mean independently verified. Pending and processed cases keep this section collapsed so the decision or history is easier to find.

Staff selects **Prepare correction**, opens the original bill and enters only corrections supported by readable evidence. Add a reason and source evidence, then **Submit for Manager review**. Manager compares the proposal with the original and selects **Authorize correction** or **Reject proposal**. Reject requires a reason. **Correct directly instead** remains available to Manager. Revalidation still controls whether charges can be published. Do not guess masked account digits or treat utility personal marks as provider settlement.

**Retry original** reloads only the protected source preview after a failed request and keeps entered corrections. **Try again** on a failed home, dashboard, bills or notifications page repeats its read request. These recovery controls do not repeat payment or billing writes. If a save reports an uncertain connection result, check the saved queue before submitting again. Use **Reload saved case** when saving succeeded but refreshing failed.

On phones, the original and correction form stack. Fields remain readable when focused, action buttons use the available width, and the page scrolls normally. The group walkthrough and actual email/device checks are in the [manual test guide](manual-test-guide.md).
