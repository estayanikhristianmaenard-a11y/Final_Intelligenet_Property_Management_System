# Email-to-bill acceptance checks

Checked 20 October 2026. Keep this work inside the [approved capstone boundaries](capstone-scope.md). No paid hosting, new framework, manuscript revision or Git push is part of these checks.

## Local recheck - 27 October 2026

The default verification was rerun after UI polish and passed real MIME/PDF extraction, checked fields, correct Tenant bill/portal alert and duplicate hold. Evidence: `data/ui-polish-email.log` and `data/acceptance/email-verification.json`. No mailbox retrieval or email send was performed in this recheck. Earlier live results below retain their original dates and limits. Use the actual-provider procedure in the [manual test guide](manual-test-guide.md) for the remaining checks.

## Results and limits

| Check | Result | Evidence/limit |
| --- | --- | --- |
| MIME email with PDF attachment | Passed locally | The catalog's synthetic electricity email was parsed through mailparser, PDF.js and the existing billing service; no extractor stub |
| Expected bill fields | Passed locally | Provider, account, amount, due date and both billing-period boundaries matched the case record |
| Tenant assignment and display data | Passed locally | The authenticated Tenant's bill query returned the correct source bill and PHP 100.01 amount |
| Portal alert | Passed locally | The bill created an alert for that Tenant; utilities had no rent email type |
| Same bill as an email summary | Passed locally | Cross-format duplicate entered review without another charge |
| Valid summary plus unrelated attachment | Fixed and verified | A text attachment previously suppressed the summary. Only PDF/PNG/JPEG candidates now take precedence; unrelated formats do not create bills |
| Repeated mailbox sync | Passed with simulated IMAP client | Actual ingest/extraction ran; recorded UIDs were skipped on the next sync |
| Dedicated Gmail-label retrieval | Passed live with synthetic fixture | Created/reused Rentara-Utility-Acceptance; stored a labelled fixture there through IMAP and retrieved it through the actual pipeline. Tenant bill and portal alert were present, and repeat sync imported zero messages without another charge |
| Changed mailbox UID validity | Passed with simulated IMAP client | New mailbox identity was processed while bill-level duplicate protection prevented another charge |
| Network failure cleanup | Passed with simulated IMAP client | Lock released, logout attempted, sync flag reset and unfinished message remained retryable |
| Oversized-message isolation | Added and checked 22 October | A held email no longer prevents a later valid bill. Repeated sync does not create duplicate notices. Manager retry is scoped to the held message/workspace and still applies duplicate validation |
| Rent email to the agreed inbox | Passed controlled self-test | After explicit user approval, SMTP accepted one labelled synthetic rent update to rentara2026@gmail.com, and its exact Message-ID was found in INBOX. Only that test message's content was fetched; phone link opening and readership were not verified |
| Real Android Web Push | Pending user device steps | The acceptance database had zero subscriptions at the readiness check; neither device trust nor delivery is claimed |
| Actual provider mailbox ingestion | Still pending | Synthetic emails and simulated IMAP do not establish that Meralco/Manila Water emails arrive in the supported format |

The digital PDF check exercises direct text extraction. Existing raster-image/scanned-PDF regressions separately exercise OCR. One synthetic email or multiple versions of one bill do not measure general OCR accuracy. Supported inline images are still extraction candidates; this change does not claim to distinguish every provider logo from bill content.

The Exception Queue now shows **Retry email** for a held mailbox message. If it cannot be used, the Manager can upload a supported copy and **Close email notice** with a handling reason. Closing only records how the notice was handled; it does not validate the replacement bill or confirm payment. Network/storage failures still require recovery/retry and are not silently treated as bad content. The Manager sync warning and Admin status expose partial completion.

## Repeat the safe local check

From `SeCapstone/rentara-portal`:

```powershell
npm.cmd run verify:email-billing
node --test tests/email-intake.test.js
```

The first command uses a disposable portfolio, the existing fixture files and real MIME/PDF parsing. It does not connect to Gmail, send email, run a live scheduler or modify the showcase/working acceptance records. It saves the latest compact result at `data/acceptance/email-verification.json` and removes the disposable database/source copies. Existing live-result metadata is preserved.

The explicit `--send-rent-email` self-test completed on 20 October 2026 after the user separately approved live sending and exact-message retrieval. One clearly labelled synthetic rent update reached **rentara2026@gmail.com**, using the existing rent-notification service and template. It never selects recipients from a working database, does not mark rent paid, and prefixes the subject/body to state this is test data with no real payment requested. The exact test Message-ID was found in INBOX; no other message contents were fetched. An accepted or uncertain prior submission blocks another send. Inbox presence does not prove readership, phone-link access or delivery to other recipients. Outgoing rent mail remains off in acceptance startup. The user later separately authorized ongoing utility retrieval from the dedicated acceptance label; this does not enable scanning the general inbox. See the [intake setup and Gmail filter step](local-acceptance-setup.md).

## Complete the two-phone Push check

1. Start the separate HTTPS acceptance server using the [Android/local setup guide](local-acceptance-setup.md). Both phones need its public CA certificate installed, a warning-free HTTPS page, and a network that permits laptop access.
2. Sign in as **rentara2026@gmail.com** on each Android Chrome browser. This is a local test Tenant only. In Tenant Settings enable Web Push and accept the browser permission. The same Tenant can subscribe on two devices; each needs its own subscription.
3. On the laptop, sign in as **manager@propertypro.ph** in the acceptance portal. Upload `docs/samples/utility-bills/synthetic/water-001/bill-digital.pdf` if that bill has not been imported in this portfolio. It maps to the test Tenant and should create a new water bill and portal alert. Its historical dates are synthetic test data. Do not repeatedly upload the same bill expecting new alerts: duplicate protection should hold it.
4. Let the running scheduler process the new event, then check both phones. Record whether the alert appears, whether tapping opens the permitted Tenant page, and whether the portal alert remains available. Utility alerts must not produce an email or utility receipt. If the fixture was already imported, use another authorized bill/account/period rather than bypass duplicate validation.
5. Deny notifications on one browser and reload. Portal bills/alerts must remain usable. Re-enable permission through Chrome site settings if needed. A denied browser must not be described as a delivery failure in the backend.

Use **LocalDemo!2026** for these initial local test logins unless the passwords have been deliberately changed. Actual phone delivery, browser permission, certificate trust, and tapping behavior must be recorded by the person using the phone; automated transport tests cannot substitute for them.

## Remaining provider acceptance

When an authorized provider email is available, record the expected fields from its actual content before importing it. Check that it maps to the correct workspace/account, that masked identifiers enter review, and that a previously uploaded copy does not create another charge. Do not promise that an email subscription includes a full PDF, unmasked account number or a supported layout without checking the actual provider message.
