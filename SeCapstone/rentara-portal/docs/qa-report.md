# Current QA status

Last complete verification: **20 October 2026**, after adding controlled dedicated-label utility retrieval to acceptance startup.

**76 tests passed; zero failures, cancellations or skips.** The recorded run took approximately 184 seconds. This is local development evidence, not participant evaluation or production certification.

## Verified locally

| Area | Evidence |
| --- | --- |
| Billing and payments | Rent cycles, centavo allocation, corrections, Manager confirmation, final-cycle credit and receipt reuse passed regression checks. |
| Bill intake | Supported PDF/image extraction, email parsing, exception handling and duplicate protection passed isolated checks. |
| Tenant and Manager journeys | Actual browser journeys cover review, reporting, personal utility marks, receipts, notifications and settings. |
| Access control | Authentication, role restrictions, own-record access and independent workspaces passed checks. |
| Edited forms | A regression reproduced unsaved phone-number loss from delayed route events. The fix preserves edits; saving and reload now pass. |
| Responsive layout | Automated checks cover desktop, tablet and phone widths, control names and horizontal overflow. |
| Renamed folders and samples | Startup-helper syntax, current links, five case records and isolated sample generation were checked. Moved sample/report hashes were preserved. |
| Gmail authentication and controlled rent email | Authentication succeeded. After separate explicit approval on 20 October, SMTP accepted one labelled synthetic rent update to the agreed team inbox; an exact-Message-ID lookup verified its presence in INBOX. Only that test message's content was fetched. |
| Acceptance setup | A separate portfolio accepts the anonymized Meralco fixture, maps it to the agreed Tenant, skips seed notification delivery, preserves changes on rerun and refuses to replace another portfolio. |
| Email-to-bill acceptance | Real MIME/PDF extraction matched the synthetic case's expected fields, assigned the Tenant bill, created its portal alert and blocked an email-summary duplicate. An unrelated text attachment no longer suppresses a valid summary. |
| Mailbox lifecycle | Simulated IMAP tests verify processed UID skipping, UID-validity changes, bill-level duplicate protection, Manager access and cleanup/retry after interruption. Actual provider-mailbox behavior remains unverified. |
| Live utility retrieval | After explicit approval, a clearly labelled synthetic PDF email stored in the dedicated Gmail label was retrieved through actual IMAP, validated, assigned to the acceptance Tenant and linked to a portal alert. Repeat sync and rerun imported no extra charge. The restarted HTTPS API returned the resulting electricity bill. This is live transport evidence using synthetic content, not an actual provider bill. |
| Acceptance integration isolation | Tests verify retrieval defaults off, explicit dedicated-label opt-in, rejection of another account/general inbox, fixed acceptance data directory, disabled workspace overrides and rent email always off. |
| Local HTTPS | Invalid TLS settings fail before database creation. A separate HTTPS smoke check verified the local CA chain, IP certificate, Tenant login, origin rejection and blocked private files without disabling certificate validation. Android trust and real Push delivery remain manual checks. |

The current sample set contains one anonymized actual-layout Meralco bill and four synthetic cases, represented by nine input files. Alternative versions do not increase the number of independently collected bills.

## Still needs acceptance

- Actual provider email retrieval through the configured mailbox.
- Opening the verified rent self-test email's portal link on the receiving phone; delivery to other recipients remains unverified.
- Web Push on a supported actual device and secure context.
- Additional authorized provider bills with manually checked expected values, especially Manila Water.
- Real-device usability, physical printing/Save as PDF, and operational backup/restore acceptance.
- Planned participant evaluation and representative OCR accuracy measurements.

Showcase data continues to block external messages. Local tests and authentication alone do not establish inbox delivery, device display or general OCR accuracy.

The acceptance profile disables rent email sending. Utility retrieval defaults off but is now explicitly enabled for the dedicated **Rentara-Utility-Acceptance** Gmail label. Startup checks that setting and never scans the general inbox through this profile. The running acceptance server was restarted with intake enabled. Stable VAPID keys and the certificate are configured, but the Windows trust store and Android devices have not been modified automatically. Start, pause and certificate-transfer instructions are in the [local acceptance guide](local-acceptance-setup.md). The showcase remains the normal startup database.

An initial restricted rent-email attempt failed and automatic review required separate explicit permission. After the user granted it, one labelled synthetic rent update was accepted by SMTP and its exact message was found in the agreed team's INBOX. No other INBOX message contents were fetched and no actual payment was recorded. Outgoing rent mail remains off. A later separate instruction approved utility retrieval from the dedicated label, which is now enabled and verified with synthetic content. These checks do not prove provider-format compatibility, readership or phone-link access. The acceptance database had zero device Push subscriptions at the earlier readiness check. See [email billing acceptance](email-billing-acceptance.md) for the safe repeatable command and remaining actual-device steps.

## Commands and guides

Run from `SeCapstone/rentara-portal`:

```powershell
npm.cmd test
npm.cmd run integrations:check
```

`npm.cmd test` limits concurrency to two files. `integrations:check` reads default-workspace configuration presence without connecting, sending, importing or printing credentials.

Use the [manual guide](manual-test-guide.md), [Gmail setup](gmail-local-setup.md), [sample catalog](samples/utility-bills/README.md), [system-status definitions](system-status.md) and [current screenshots](../../reports/mockups/README.md).

Earlier results, test counts and detailed issue histories are preserved in [historical QA checkpoints](archive/checkpoints/qa-history-through-2026-10-20.md). They describe their recorded dates and are not the current setup checklist. The [earlier core-billing record](core-billing-verification.md) also retains historical investigation notes.
