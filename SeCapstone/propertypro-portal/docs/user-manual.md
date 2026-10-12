# PropertyPro implementation and user manual

Version 2.0 · 11 October 2026 · Pasig City scope

## Start the website

Opening `index.html` as a `file://` URL blocks the application's ES modules. This application also requires its database/API server. Use the HTTP address below.

In PowerShell:

```powershell
Set-Location 'E:\xampp\htdocs\Final_Intelligenet_Property_Management_System\SeCapstone\propertypro-portal'
npm.cmd install
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

Once the first payment is confirmed, advance becomes credit. Recording the final applicable lease cycle applies that credit to an unpaid final rent bill, including one already generated. The bill retains gross charge, credit, remaining balance and the original advance receipt reference. Credit application does not create a new cash payment or receipt. A zero-balance bill cannot be reported for payment and receives no unpaid reminder; its payment status is not fabricated as a confirmed cash payment.

If the final cycle is already reported/paid, or the confirmed advance exceeds its final share, A01 review preserves the credit and transaction. A pending report can be rejected with a reason and revalidated. For an incorrect unpaid rent amount, **View bill → Correct rent** recomputes the whole cycle using frozen recipients and records a reason. Confirmed payments require Manager review and an approved settlement procedure; this version never silently rewrites them or invents a refund.

## Manager: utility intake and review

1. In **Settings → Mappings**, configure a unique provider/account identifier, target unit and electricity/water category. Configure these before intake.
2. Use **Bills & Payments → Upload source** for a digital PDF, PNG or JPEG, or **Sync intake** for the configured mailbox.
3. Intake retains the original document and extracted values. V01–V04, C01–C02 and A01 decide whether the document finalizes or enters the Exception Queue.
4. Under **Exception Queue**, download the source, enter the specific corrected field/value and reason, and save. Each correction retains the original value, Manager and revision. Correct both period endpoints separately when needed.
5. Revalidate after fixing an unresolved mapping or occupancy configuration. A failed revalidation stays open. Later duplicate documents remain held; correct the original source rather than generating a second charge.
6. Source corrections recompute unpaid charges and retain prior revisions. Frozen recipient lists remain fixed after finalization. Reported or confirmed source charges are protected.

The parser recognizes Meralco, Maynilad and Manila Water labels, common account/amount labels, and ISO billing-period endpoints (`YYYY-MM-DD to YYYY-MM-DD`). Other layouts or ambiguous values require review; OCR is not an autonomous billing decision. Digitally generated PDFs need a usable text layer. Scanned PDFs are held; upload a sufficiently clear image. Limits: 10 MB per document, 50 PDF pages, 30 attachments and 35 MB per email. Encrypted, unsupported or unreadable sources enter review when within intake limits; oversized emails/uploads are rejected and require operator handling.

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

1. Sign in with the account assigned by the Admin. **My Home** shows your assignment and balance; **My Bills & Payments** shows your own cycles and line details.
2. Report the **full outstanding amount** for a selected unpaid bill. Select Cash, Bank transfer or E-wallet. Electronic methods require a reference.
3. The status becomes **Tenant Reported Paid**. No receipt exists until the Manager confirms.
4. The Manager can confirm or reject a pending report with a reason. Rejected reports remain in history; the bill becomes unpaid and can be reported again.
5. After confirmation, status and line statuses become **Paid** and one unique receipt is issued. Repeated confirmations return the same receipt. Download the receipt as HTML; open it locally and use the browser's Print/Save as PDF if needed.
6. Manager-uploaded documents are available under My Bills. The Manager can upload/preview/download them in the tenant panel. Both routes enforce ownership and log downloads.
7. **Notifications** includes saved alerts and the authenticated portal inbox. **Mark all read** persists. Manager messages address the permanent tenant ID, even if two tenants have the same display name.
8. **Settings** saves profile/contact details, push preferences and password changes. Password changes invalidate sessions and require sign-in again.

There is no bank verification, payment gateway, SMS, or tenant email delivery.

## Web Push

Run `npm.cmd run push:keys` to save generated VAPID keys directly into local `.env` without printing the private key. Set `VAPID_SUBJECT` to your contact `mailto:` address and `PORTAL_URL` to the portal's public URL. Existing keys are preserved; rotating keys requires re-registering subscriptions. Restart the server.

In a supported browser on HTTPS or localhost, the Tenant chooses **Enable Web Push** and grants permission. The page registers `sw.js`, subscribes through PushManager and saves the actual endpoint/keys to the authenticated backend. The worker handles background notifications and opens the portal. Billing/correction events and eligible unpaid reminders are saved before delivery. The delivery worker retries transient failures up to five attempts and removes expired endpoints. Portal records remain accessible when delivery fails or permission is denied.

Reminder events are created once per bill/due date, exactly three **Philippine calendar days** before an existing unpaid bill is due. A new rent cycle generated on its due date does not exist three days earlier and therefore cannot have a prior unpaid reminder. Keep the server running; a day missed while offline does not retrospectively deliver a three-day reminder.

The service worker installed and activated in an actual Edge browser test. Encryption, payload creation, retry and deduplication passed with a test transport. **Actual provider-to-browser background delivery remains unverified** without configured deployment keys and an enrolled device.

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
