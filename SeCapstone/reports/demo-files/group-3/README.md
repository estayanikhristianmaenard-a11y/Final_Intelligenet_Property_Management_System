# Group 3 phone-to-email demonstration

These are two different synthetic bills, not real Meralco statements and not independent evidence of OCR accuracy. No private bill or real provider account has been copied.

## Files to send to your phones

Attach the PDF, not this README, the ZIP, or the preview PNG.

| Attachment | Mapped unit | Amount | Expected Tenant charge | Processing |
| --- | --- | --- | --- | --- |
| `unit-a-meralco-scan.pdf` | G3-A, shared by two members | PHP 900.00 | PHP 450.00 each | Image-only PDF, actual OCR |
| `unit-b-meralco-digital.pdf` | G3-B, one member | PHP 1,200.00 | PHP 1,200.00 | Direct PDF text extraction |

The PNGs are previews of the same two bills, not additional test cases. Both bills have an actual test due date of 29 October 2026 and period 1-22 October 2026. Their fictional account references are G3000101 and G3000102. Do not edit the amounts or accounts without updating the matching test setup.

## Prepare the presentation

1. On a fresh laptop, from `SeCapstone/rentara-portal`, run `npm.cmd ci`, then `npm.cmd run demo:group`. This detects the local IP, prepares both test workspaces and local HTTPS, and starts port 8444. Stop/restart after changing Wi-Fi. If detection is ambiguous, use `npm.cmd run demo:group -- --ip YOUR_LAPTOP_IPV4`. On Windows x64, the missing mkcert tool is downloaded from its pinned official release and checksum-checked. Certificate trust on phones remains a device setup step.
2. The three agreed member identities are supplied by `tools/group-demo-members.example.json` and copied to local `data/group-demo-members.json` when absent. Two belong to G3-A and one to G3-B. If a prepared database already exists, missing member input is recovered from its existing setup marker instead of replacing identities. `npm.cmd run demo:group:prepare` can separately regenerate and verify this older pair of attachments; it does not import them into your presentation database. Existing showcase/acceptance records are preserved.
3. Incoming demo emails must have the exact Gmail label **Rentara-Group3-Demo**. Receiving startup creates this label if missing and checks access. Only apply it to these demo emails. The system does not scan the whole inbox in this demo profile.
4. Start with `npm run demo:group -- --receive`. This prepares/checks the Gmail label, uses existing local HTTPS configuration from `.env.acceptance`, listens on port **8444**, and receives only that Gmail label. Rent email sending stays off to avoid sending fabricated rent notices to member emails.
5. On laptop use `https://localhost:8444`; on phones use `https://YOUR_CURRENT_LAPTOP_IP:8444`. Devices must reach the laptop, trust its existing local certificate, and have the correct current IP covered by the certificate. Allow this Node server through the private-network firewall if needed. Port 8080 is the old showcase, not this group portfolio.
6. Manager login: `manager@propertypro.ph`. Each Tenant logs in with their submitted email. Initial local-demo password for all: `LocalDemo!2026`. These are development accounts, not production credentials.

If the page was previously blank on port 8444, restart after updating the startup helper, then reload Chrome. The helper now explicitly allows the demo's HTTPS localhost addresses and mirrors the configured acceptance LAN host from port 8443 to 8444. Previously the HTML could return 200 while the browser's JavaScript module request was rejected with 403. A server response alone did not establish that the interface rendered. The fix passed two focused origin checks and a temporary HTTPS browser login-render check with no JavaScript errors; this is not a new full-suite result.

## Live email demonstration

1. Phone 1: send an email to **rentara2026@gmail.com**, subject **Group 3 Demo - Unit A**, attaching only `unit-a-meralco-scan.pdf`.
2. Phone 2: send another email to the same inbox, subject **Group 3 Demo - Unit B**, attaching only `unit-b-meralco-digital.pdf`.
3. In property Gmail, apply **Rentara-Group3-Demo** to the two received messages. Labelling the received messages is a demo routing step; it does not extract or enter billing fields. An automatic Gmail filter may be created for these exact demo subjects, but has not been configured by the preparation script.
4. Keep the backend running with internet. Allow up to approximately five minutes for scheduled retrieval, or use the Manager's existing manual intake sync action. Refresh the billing list after processing.
5. Open each Tenant account. The two G3-A members should each see PHP 450.00, while the G3-B member should see PHP 1,200.00. All should have their own portal billing alert. Utility email notifications and utility receipts are outside the approved workflow.
6. A Tenant's utility mark is personal tracking only. It does not verify Meralco payment or mark another Tenant's share as paid.
7. Resending the same bill must not create another charge. Re-running setup does not reset the database, remove bills, or bypass duplicate checks. Do not test-import these bills into the presentation database before the live demo.

## Where to see the unit details

- **Manager > Units:** select Group 3 Demo Apartments. G3-A shows Shared with two occupants; G3-B shows Individual. **Edit** shows configured property, unit code, floor, monthly rent and arrangement. **Details** opens the listed Tenant's details; it is not a separate full list of all occupants.
- **Manager > Tenants:** search for G3-A or G3-B to see all assigned members and open their records.
- **Manager > Settings > Utility mappings:** account G3000101 points to G3-A; account G3000102 points to G3-B. Account mapping, not the email sender or subject, determines the assigned unit.
- **Tenant > My home / Bills:** each signed-in Tenant sees their assigned rent and personal utility charges, not the other unit's bills.

`verification.json` records the isolated attachment test. Successful local tests do not prove Gmail delivery, the live label configuration, phone connectivity or push delivery; demonstrate those separately.

## Completed live self-test - 23 October 2026

The user created the Group 3 subject/recipient filter. One fresh synthetic Unit A scan reached the demo label without manual labelling, passed actual automatic IMAP/OCR processing and created PHP 450.00 for each of the two G3-A members, due 29 October. The source and portal alerts remain in Group 3. Resending this exact bill should enter duplicate handling rather than make another charge. Restart/open the normal demo to inspect it; use a separately agreed new case for a future fresh-bill rehearsal. This self-addressed fixture is not an actual Meralco-origin email or evidence of representative extraction accuracy.


## Optional actual email and phone Push test

Normal demo startup still leaves outgoing email/Push off. Stop it first, then from `rentara-portal` run `npm.cmd run demo:group -- --receive --live-delivery`. This explicitly permits real delivery for new events to the three approved Group 3 Tenant emails printed at startup. Old notification queues are not replayed. It does not reset demo data, weaken billing rules or enable utility emails. Outgoing messages carry `[DEMO]` in the email subject/Push title.

On each test phone, log in through the current laptop HTTPS address on port 8444 and use Notifications > Browser notification settings > Enable Web Push / Refresh device registration after this startup. Existing saved subscriptions must be refreshed each live-demo session. The Manager's Settings > Enable Web Push delivery and Tenant preferences still apply. A fresh utility bill can demonstrate portal/Push alerts; a fresh rent update or new rent confirmation demonstrates rent email. Check the actual inbox and phone; a stored transport acceptance is not proof of display. Restarting without `--live-delivery` turns outgoing demo delivery off again. See the [current startup guide](../../../rentara-portal/docs/development-guide.md#controlled-live-demo-delivery).


## Provider-format email-body demo - 1 November 2026

Two readable copy-and-paste files are available: `unit-a-meralco-email.txt` and `unit-b-manila-water-email.txt`. They follow the supplied provider emails' greeting and billing labels, using fictional November details and existing demo account mappings. Original emails and their private attachments are not copied into this shareable pack. Tracking/payment links, actual references and password instructions are excluded.

Open the text file on a phone, copy its SUBJECT into Gmail's subject field, and copy only the text after EMAIL BODY into the message body. Send from your group member account to the listed property Gmail. Do not attach the `.txt` or original `.eml` as the bill; these examples specifically test body parsing, with no PDF attachment.

| Copy-and-paste file | Provider/account mapping | Expected result |
| --- | --- | --- |
| `unit-a-meralco-email.txt` | Meralco / G3000101 / G3-A | PHP 900 total, PHP 450 for each of two Tenants |
| `unit-b-manila-water-email.txt` | Manila Water / G3W0102 / G3-B | PHP 280 for the single Tenant |

Both dates are 30 November 2026. The existing live Group 3 database was inspected read-only and already contains these mappings; preparation does not add or change them in live data. If using another regenerated portfolio, Manager must verify the Manila Water mapping before the demo. Do not rerun database setup or guess account numbers to force allocation.

The supplied actual Meralco summary contains a masked CAN and must remain in review unless a complete supported reference is obtained. The water email contains a readable HTML summary and a password-protected attachment. These demo copies do not decrypt that attachment or demonstrate OCR. Both text copies passed the actual email-body ingestion/validation/allocation pipeline in a disposable Group 3 database, including repeated-input checks with no duplicate bill or alert. The water mapping was explicitly prepared in that disposable fixture. No email was sent and no live billing record was added. Provider-format synthetic copies are not actual provider-origin samples or independent OCR accuracy evidence.


## Second business for isolation testing

Run `npm.cmd run demo:workspaces:prepare` after the existing Group 3 preparation. The same demo profile then has **Group 3 Demonstration** and **Bayan Demo Rentals**. Each has one Manager, one Staff, two units and three Tenants. A pre-change SQLite backup is created before the additive setup; reruns preserve existing data and changed passwords. No second server/profile/database is required.

Bayan Manager: `manager.b.group3@example.test`; Staff: `staff.b.group3@example.test`; Tenant logins: `tenant.b1.group3@example.test`, `tenant.b2.group3@example.test`, `tenant.b3.group3@example.test`. New synthetic accounts initially use `LocalDemo!2026`. The first two Tenants share B-101; the third occupies B-102. These are fictional accounts and do not receive real email. The business is marked local-only, with external integrations off even during the original Group 3 live delivery demo.

Bayan has sample rent, PHP 450 electricity (PHP 225 each), PHP 180 water, and a staged due-date correction case with a retained synthetic PDF. These are seeded development records, not actual participants/payments or independent OCR samples. Existing Group 3 accounts, units, bills and Gmail routing remain unchanged. Follow the [two-workspace walkthrough](../../../rentara-portal/docs/manual-test-guide.md#two-workspace-final-walkthrough) for expected outcomes and evidence to collect. Do not rerun preparation to reset a case; decisions and confirmed receipts are intentionally preserved.
