# Manager and Tenant user stories

Updated 22 October 2026. These stories describe the existing capstone workflow and the improvements needed to finish it. They are not additional research modules or participant evaluation results. Use the [scope guide](capstone-scope.md) and [current QA evidence](qa-report.md) with this document.

"Implemented" means the function exists. It does not mean an actual provider, phone or participant has verified it. Priorities: P1 = finish first; P2 = verify after the main billing journey.

## Manager

| ID | User story | What the Manager needs | Current status / improvement | Priority |
| --- | --- | --- | --- | --- |
| M01 | As a Manager, I want to see only my property's business records, so another owner's information stays separate. | Admin assigns the account to the correct workspace. Independent businesses use separate workspaces; Managers in the same workspace share its portfolio. | Workspace isolation is implemented and regression-tested. Configure each real owner's authorized integrations separately. | P1 |
| M02 | As a Manager, I want to register units, Tenants and utility accounts once, so incoming bills reach the right people. | Verified provider/account number, unit, occupancy dates and individual/shared setup. | Implemented. Actual account mappings still need verified values; existing acceptance numbers are synthetic. Do not guess masked digits. | P1 |
| M03 | As a Manager, I want utility emails collected automatically, so I do not enter every bill by hand. | Running backend, internet, authorized Gmail access and a one-time provider filter to the dedicated label. | Actual Gmail retrieval passed with a synthetic fixture. Configure the real filter and verify actual Meralco/Manila Water content. | P1 |
| M04 | As a Manager, I want to upload a printed bill when no supported email arrives, so it can use the same billing process. | Clear PDF/photo/scan and a matching account. | Upload, text extraction and OCR exist. Test different authorized real bills and readable phone photos; low-quality results must require review. | P1 |
| M05 | As a Manager, I want one bad email held for review while other bills continue, so intake does not stop. | Plain-language error, one persistent notice, deliberate retry, and a way to record how an unusable message was handled. | Added held-email handling, Retry email and Close email notice with a required reason. Closing a notice does not validate a bill or confirm payment. Test the actual failure case when available. | P1 |
| M06 | As a Manager, I want to check and correct extracted values, so incorrect charges are not finalized silently. | Original bill, extracted values, correction reason, revalidation and retained history. | Implemented. Verify real masked/incomplete accounts, conflicting dates and corrections after finalization. | P1 |
| M07 | As a Manager, I want equal shared charges to match the provider total, so no centavo is lost or added. | Eligible occupants, configured group and stable rounded shares. | Implemented and regression-tested. Walk through a real group's setup with synthetic charges first. Tenant contribution collection remains outside the system. | P1 |
| M08 | As a Manager, I want duplicate bills blocked, so receiving the same bill twice does not charge Tenants twice. | Duplicate checks across email, upload and repeated sync, scoped to the workspace. | Implemented. Verify a real emailed bill against its previously uploaded copy and check that another business stays independent. | P1 |
| M09 | As a Manager, I want to confirm rent after checking payment outside the portal, so the rent status and receipt are reliable. | Tenant report or direct Manager entry, actual payment check, rejection reason and retry protection. | Implemented. Test both phone journeys and confirm that utilities cannot use rent confirmation or receipts. | P1 |
| M10 | As a Manager, I want the confirmed advance applied only to an eligible final rent cycle, so it is not reused or counted as another cash payment. | Recorded departure, eligible confirmed advance, Manager confirmation and original payment/receipt links. | Implemented and regression-tested. Demonstrate full and partial remaining rent with test records; no flexible shield/heart allowance. | P2 |
| M11 | As a Manager, I want visible intake and notification results, so I know what needs attention. | Distinguish held emails, network failures, missing setup and service acceptance from actual delivery. | Partial-sync feedback was improved. Portal alerts exist; actual phone Push, provider formats and normal recipient delivery still need acceptance. | P1 |
| M12 | As a Manager, I want access to existing billing history after a restart, so I can continue work without rebuilding records. | Persistent records and a tested Admin recovery procedure including source documents. | Complete database-and-file recovery support was added. Admin operates the backup; Manager permissions are unchanged. Check a private copied package on the group's recovery device. | P2 |

## Tenant

| ID | User story | What the Tenant needs | Current status / improvement | Priority |
| --- | --- | --- | --- | --- |
| T01 | As a Tenant, I want to see my own bills and history, so I understand what I owe without seeing someone else's records. | Assigned account, own-record access, clear amount, category, period and due date. | Implemented and regression-tested. Verify actual phone readability and account switching. | P1 |
| T02 | As a Tenant, I want rent and my personal utility tracker easy to find, so I can check them quickly. | Rent first, utility tracker below it, clear individual/shared amounts and simple status labels. | Implemented. Test with both phones and different record counts; adjust only observed layout issues. | P1 |
| T03 | As a Tenant, I want to mark my utility bill/share personally paid, so I can remember what I already handled. | Own-mark/undo history and the reminder that provider payment is not verified. | Implemented. Verify that one Tenant's mark changes neither another share nor the full provider account, and creates no receipt. | P1 |
| T04 | As a Tenant, I want to report a rent payment, so the Manager can check and confirm it. | Clear report form, pending status, duplicate prevention and a rejection reason when applicable. | Implemented. Complete the actual two-role phone journey; sending a report must not immediately create a Paid status. | P1 |
| T05 | As a Tenant, I want to view a confirmed rent receipt without downloading it, so I can check it easily on my phone. | Simple black-and-white receipt, correct stored details and optional download/print. | Implemented. Test physical printing/Save as PDF, long references and smaller screens. | P2 |
| T06 | As a Tenant, I want billing alerts inside the portal, so I can still find them when browser notifications are unavailable. | Stored alerts, read/unread state, safe links and access after login. | Implemented and regression-tested. Verify actual device navigation and state after restart. | P1 |
| T07 | As a Tenant, I want to choose browser notifications and rent emails, so reminders reach a channel I allow. | Per-device Push permission and saved notification preferences. | One controlled rent email reached the agreed inbox. Its phone link and actual Android Push still need testing. Acceptance rent-email sending stays off; utility email is excluded. | P1 |
| T08 | As a Tenant, I want due dates visible on a calendar, so I can plan payments. | Actual bill dates, category icons and clearly labelled next-month rent estimates. | Implemented. Verify short months, ended occupancy and multiple due dates. Utility dates must come from actual validated bills. | P2 |
| T09 | As a Tenant, I want clear feedback when the connection fails, so I do not repeatedly submit the same action. | Preserve failed inputs, show failure/pending/success honestly, and prevent accidental duplicate submissions. | Feedback safeguards exist. Test internet loss separately from local-network/server loss on actual phones. Do not promise fully offline phone access or automatic replay. | P1 |
| T10 | As a Tenant, I want to retain my old bills and receipts after moving out, so my records and outstanding rent remain accessible. | Own history retained, ended occupancy stops later rent cycles, outstanding rent still reportable. | Implemented and regression-tested. Include this case in the final manual walkthrough. | P2 |

## Improvements being completed now

| Improvement | Expected result | Evidence to record |
| --- | --- | --- |
| Per-message intake failure handling | An oversized/unprocessable email is held once; a later valid bill proceeds; retry stays workspace-protected | Regression for held/valid messages, repeat sync, permission checks and the actual Manager review buttons |
| Complete recovery package | Database and referenced source/document files recover together without overwriting a running portfolio | Restored amounts, original receipts, file bytes, workspace separation, revoked old sessions and rejected corrupt/path-traversal packages |
| Clearer partial-sync feedback | A sync with held messages is not described as an entirely successful intake | Manager warning and Admin recorded status; subsequent review keeps the handling reason |

The Admin remains a supporting maintenance role. Backups, account/workspace assignment and recovery are not new Tenant/Manager permissions. Recovery is a separate offline operator procedure, not a public restore button.

## Next real-world acceptance session

1. Use an authorized actual provider email and verified account mapping; apply the dedicated Gmail label or its one-time filter.
2. Compare every target field with the source, check allocation, and import a copy to test duplicate protection.
3. On both phones, complete portal alert, utility mark, rent report/confirmation, receipt viewing and account-switch checks.
4. Finish Android HTTPS trust/Push permission and receive a new eligible event. Open the already delivered rent test email's portal link.
5. Copy a complete recovery folder privately and verify recovery into a new directory. Keep real-provider/device results separate from synthetic tests and questionnaire evaluation.

Use the [next-session checklist](next-session-checklist.md), [email acceptance guide](email-billing-acceptance.md) and [recovery guide](backup-and-recovery.md). Do not add payment gateways, utility payment confirmation, predicted utility dates, provider-app access or other excluded modules to satisfy these stories.
