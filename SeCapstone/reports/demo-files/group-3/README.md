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

1. The three member identities are stored locally in `rentara-portal/data/group-demo-members.json`. The first two are assigned to G3-A and the third to G3-B. Personal member details are not included in this shareable bill pack.
2. From `SeCapstone/rentara-portal`, run `npm run demo:group:prepare`. This validates both attachments in a temporary database and prepares `data/group-demo`. It preserves showcase/acceptance data and does not import the two utility bills into your presentation database.
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
