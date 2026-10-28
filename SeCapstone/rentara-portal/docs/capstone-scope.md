# Capstone scope and development boundaries

Reviewed 20 October 2026 against the saved Chapter I Section 1.5, the accepted workflow notes, the final-paper review and the later user-approved workspace/calendar decisions. This is an implementation boundary, not a new manuscript revision or a claim of adviser approval. The research title remains unchanged.

## Main purpose

Receive supported utility bills, extract their details using text extraction or OCR, validate and classify them, calculate permitted charges, and show bills/history with permitted Tenant notifications. Rent management supports that workflow. Do not turn this into a general property-business platform.

| Area | Included behavior | Boundary |
| --- | --- | --- |
| Utility intake | Supported property-mailbox summaries/attachments and optional Staff/Manager uploads | No automatic access to provider apps, phone notifications or unavailable provider PDFs |
| Extraction | Amount due, actual due date, billing period, provider and account/reference | Readable email/PDF text uses direct extraction; bill images use OCR. No guessing masked characters or training a model |
| Validation | Required values, verified mappings, period checks, duplicates, Staff correction proposals and Manager authorization/revalidation | Uncertain records must not silently finalize |
| Billing | Rent, electricity and water; individual charges or equal shared allocation with exact centavo totals | No Wi-Fi charges, late-fee module, expense accounting or predictive profit analytics |
| Rent cycles | Fixed non-prorated monthly anniversary rent, short-month handling and missed-cycle recovery | No renewal transaction, automatic unit transfer or automatic eviction |
| Advance | One month of configured rent/share, confirmed before use, Manager-approved final-cycle application | No shield/heart allowance, flexible mid-tenancy credit, duplicate receipt or automatic replacement advance |
| Rent payments | Tenant report or direct Manager record after external checking; only Manager confirmation creates confirmed rent receipt | Recording a bank/e-wallet reference does not perform a transfer or verify it with a bank |
| Utilities | Tenant's own Not Marked Paid / Self-Reported Paid tracker and history | Provider payment not verified; no Manager approval, contribution collection or utility receipt |
| Notifications | Stored portal alerts, rent/utility Web Push, and supplementary rent email | Email only for rent updates, eligible rent reminders and confirmed rent payment notices. No Tenant SMS or utility email |
| Reminders | Approved 9 AM Philippine-time schedule three days before actual due date, eligibility checks and duplicate prevention | No retrospective missed reminders; pending rent reports and currently self-marked utilities are excluded |
| Calendar | Actual bill dates and clearly identified future rent estimates | No estimated future utility dates; estimates do not create bills or receipts |
| Roles | Admin accounts/maintenance, Staff daily operations, Manager operations/financial authority and Tenant-own records | Admin does not become a rent approver; no separate Owner role or public onboarding marketplace |

## Supporting features, not additional research modules

| Support | Why it can remain | Limit |
| --- | --- | --- |
| Independent workspaces | User-approved separation of different owners' records | Access isolation only; no SaaS subscriptions, cross-owner transfers or self-service business signup |
| Authentication, audit and status checks | Protect records and show whether included services are configured or responding | No claim of legal certification, guaranteed delivery or comprehensive security testing |
| Backups and restore checks | Preserve the included records and their source documents | Operational support, not a new research objective |
| Search, filters, responsive pages and restrained animation | Make existing billing tasks easier to use | No new business workflow; keep controls accessible and respect reduced motion |
| Basic reports and CSV export | Summarize recorded occupancy, charges and confirmed rent | No forecasting or verified utility collections; operational totals do not establish improved profitability |
| Manual portal billing messages | Support communication about the included billing records | Keep use to billing; no live chat, maintenance ticketing or general messaging service |
| Local HTTPS and VAPID configuration | Enable a supported secure-context phone Push demo | Not public hosting and not a certificate-installation requirement for future users of trusted public HTTPS |
| Acceptance accounts and anonymized/synthetic bills | Allow controlled development checks without altering the showcase | Not actual participants, real rent payments, independent real bill samples or proof of representative OCR accuracy |

Workspaces and calendar rent estimates were approved after the saved paper baseline. Their presence should not be described as though that earlier PDF already explicitly defines them. When the manuscript review resumes, reconcile only the relevant access/calendar wording if needed; do not add new research objectives or reopen the paper during development.

## Code paths checked

- `server/service.js`: rent-only reporting/direct recording, final-cycle credit, utility allocation/tracking and scheduled reminders.
- `server/rent-email.js`: explicit rent-update, rent-reminder and rent-confirmed allowlist; rejects utility billing from email delivery.
- `server/index.js`: fixed equal allocation, no proration and three-day reminder policy; protected operational/Admin routes.
- `src/features/tenant/calendar-model.js`: rent estimates and actual received utility dates.
- `src/config/navigation.js`: the shared four-role page registry.
- `server/acceptance-setup.js`, `tools/start-acceptance.mjs` and `docs/local-acceptance-setup.md`: separate test portfolio, disabled email/mailbox access, and local certificate steps.

One misleading Manager message hint was corrected: manual messages stay portal-only, while the system separately supports approved rent email alerts. No feature module was added or removed during this review.

This was a targeted source review, not a fresh full security audit, manuscript PDF extraction, complete route-by-route review or new real-device acceptance run. The previous 70-test result remains dated evidence, not proof that every scope rule or external service works in practice.

## Next development

Keep the next work inside the existing intake-to-bill journey: inspect the configured email intake, run an authorized sample through extraction and validation, check the Tenant's resulting bill, then check permitted notifications. Fix observed failures before proposing more modules. An addition must support an included task, preserve the payment/channel rules above, and avoid introducing a new research objective. Any genuine conflict should be brought to the user rather than silently expanding the manuscript or deleting previously approved behavior.

Sources: [Chapter I, Section 1.5](../../review/CHAPTER_I_REVISED.md), [accepted paper review](../../review/FINAL_PAPER_REVIEW.md), [workflow decisions](../../review/WORKFLOW_DECISION_NOTES.md), [workspaces](workspaces.md), and [current QA evidence](qa-report.md).

## Staff revision ? 23 October 2026

The user authorized Staff implementation and the related manuscript/diagram wording. Staff handles existing descriptive records, utility intake, investigation and proposals for unfinalized sources. Manager authorizes proposals or corrects directly. Staff cannot create billing-linked enrollment, change financial configuration, confirm rent or approve their own corrections. This is an implementation decision, not a claim of adviser approval. See [implementation handoff](staff-implementation-plan.md).
