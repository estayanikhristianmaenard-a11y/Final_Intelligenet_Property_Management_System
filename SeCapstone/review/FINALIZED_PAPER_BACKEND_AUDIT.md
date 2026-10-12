# Finalized manuscript-to-backend audit

Baseline: `../papers/FINAL_MANUSCRIPT.pdf`, 40 pages; page numbers are PDF pages. This review supersedes using the archived 51-page reference as the approved baseline. Development tests are not participant evaluation or production certification.

## User-confirmed payment-policy revision — 12 October 2026

The revised agreement separates rent confirmation from personal utility tracking. Tenants arrange one payer for a shared utility bill; the system calculates shares but does not collect contributions or verify provider settlement. Intake includes property-email attachments and optional Manager uploads of clear printed-bill images. Handing out the paper alone does not create a portal record. Managers may record checked rent payments without Tenant reports. Confirmed advance is reserved for the final applicable rent cycle, with explicit Manager application and no reuse. Flexible credit requests and shield/heart behavior are postponed. Missed cycles retain original due dates; reminders use a 9 AM Philippine-time cutoff three calendar days before due. Consolidated rules are in [WORKFLOW_DECISION_NOTES.md](WORKFLOW_DECISION_NOTES.md), and remaining manuscript edits are in [UPDATED_PDF_CONTENT_REVIEW.md](UPDATED_PDF_CONTENT_REVIEW.md). The latest reviewed 46-page export incorporates the corrected manuscript passages; its Introduction and diagram updates remain pending. Backend alignment still requires separate verification. The audit below describes the earlier 40-page baseline, not verification of the revised functions.

| Requirement | Finding |
| --- | --- |
| Scope/rules, pp. 14–18 | Existing extraction engine and explicit rules; no autonomous AI, gateways or tenant SMS/email. |
| Roles, pp. 15, 29 | API role checks and Tenant isolation exist; Managers collaborate within one portfolio. Independent landlord ownership is not explicit in the paper. |
| Anniversary/short months/end cutoff, p. 23 | Calendar helpers and unique cycle keys exist. Historical catch-up requires policy reconciliation below. |
| Separate first advance, p. 23 | Current and advance lines exist; confirmed payment makes credit available. |
| Manager-confirmed credit, pp. 23, 30 | Fixed automatic application: Manager now explicitly confirms through `/bills/:id/apply-advance`. Generation, correction, scheduling and payment confirmation alone do not authorize credit use. |
| Paid final/original receipt, p. 23 | Fixed: fully covered final becomes Paid, reusing the original confirmed payment/receipt; no new cash payment/receipt. Retries reuse settlement, and audit records the Manager. |
| Whole centavos/frozen recipients, pp. 19, 26 | Integer split/remainders and stored recipients exist. Decimal conversion now parses digits instead of multiplying binary fractions. |
| Intake/OCR/validation/duplicates, pp. 23–25 | Engines, IMAP adapter, V01–V04 and source checks exist. Real provider/mailbox acceptance is outstanding. |
| Payment states/confirmation/rejection, p. 27 | Full-balance reporting, Manager-only confirmation/rejection and receipt uniqueness are tested. |
| Corrections/history, pp. 27–28 | Unpaid correction/revalidation and preserved recipients exist. Paid linked charge/balance revisions remain incomplete. |
| Push/reminders, pp. 28–29 | Three-day Philippine-date checks and dedup exist. External Push body now stays generic; complete billing remains authenticated. Exact cutoff needs further work. |
| Shared occupants/relationships, p. 28 | Multiple occupants and FK relationships exist. Historical transfers/renewals remain restricted. |
| Evaluation, pp. 39–40 | Automated development tests exist; representative samples, devices and instruments still need acceptance work. |

## Remaining gaps

1. **Paid linked revisions:** the paper requires retaining payment/receipt plus a linked revised charge/balance. Current discrepancy holds preserve transactions but do not complete that record-only correction workflow. No automatic refund is required.
2. **Missed rent cycles:** current catch-up processes historical cycles with historical due/coverage dates. The paper says generation occurs on the anniversary. Define recovery without claiming processing happened earlier or silently erasing debts.
3. **Missing rent occupants:** utility missing groups enter exceptions; a due active lease with no eligible rent occupants can be skipped. Such unprocessable due cases need A01 queue routing, distinct from inactive leases.
4. **Reminder cutoff:** scheduler checks during the three-day calendar date, but paper excludes bills available after the scheduled reminder time. A precise cutoff and late-availability tests remain necessary.
5. **External acceptance:** real mailbox, external HTTPS phone Push, actual provider layouts/scanned-PDF boundaries and devices remain unverified by fixture tests.

Historical settlements in retained databases are not rewritten automatically. Old zero-balance Unpaid records may need a separate Manager-led review. No independent-Manager organizations or historical transfer redesign were added without a confirmed requirement.

Credit regression tests now cover waiting for Manager action, Tenant/Admin denial, explicit confirmation, Paid status/original receipt reuse, retries and no extra payment/receipt. Existing allocation, payment, correction, extraction, reminder and browser checks remain applicable.
