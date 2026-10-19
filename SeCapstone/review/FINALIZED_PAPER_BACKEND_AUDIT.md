# Manuscript alignment - implementation status

Updated 12 October 2026 against the current 45-page manuscript and WORKFLOW_DECISION_NOTES.md. Changes are local and uncommitted. References and mockup approval remain excluded.

## Implemented audit fixes

| Requirement | Current implementation |
| --- | --- |
| Rent-only payments/receipts | Server rejects utility financial reports and confirmations. Payment lists exclude utility transactions from the current rent workflow. |
| Personal utility tracker | Tenant-only mark/undo, own-bill/share authorization, dated version history, no receipt, and unverified-provider notice. Available in Tenant bill table and bill details. |
| Direct Manager rent recording | Exact outstanding amount, actual payment date, explicit external-check confirmation and retry identifier. Pending reports cannot be duplicated. Atomic recording/confirmation uses nested SQLite savepoints. |
| Final-cycle advance | Existing Manager-only explicit application and original-receipt reuse preserved. Remaining balance may be reported or recorded. |
| Reminder cutoff | Three days before actual due date, 9 AM Asia/Manila. Minute scheduler processes the 9:00-9:01 slot; late arrivals and missed slots are excluded. Current utility marks and pending rent reports suppress reminders. |
| Paid rent corrections | Linked charge/balance revisions preserve original paid transactions and receipts. Nonzero differences require external settlement review; no automatic refund or duplicate receipt. Pending reports require review before correction. |
| Utility corrections | Source/bill revisions and earlier personal marks retained; current version must be reviewed before a new mark. |
| Missing due-rent recipients | Active unprocessable cycles create A01 exceptions, which resolve after assignment repair and successful generation. Ineligible/inactive occupancy is distinguished. |
| Core email/OCR processing | Existing common email/upload pipeline retained. Digital PDF, image recognition, MIME attachments, mapping, duplicate and exception tests remain applicable. |

## Validation

Full combined suite passed with 28 tests: 26 backend and two real-browser tests. It includes utility mark/undo browser interactions, role-routing regressions, rent receipts, OCR and existing billing protections. Two subsequently added focused tests passed for reminder cutoff/late arrivals and missing-rent exception recovery (30 distinct passing tests across these runs). Syntax checks and git diff whitespace checks passed. This is development testing, not participant evaluation or certification.

## Remaining external acceptance

Actual property-mailbox credentials/access, real selected-provider PDFs/photos, and HTTPS Web Push on actual Tenant phones have not been verified in this session. No claim of real delivery or readership is made. Supported layouts/limits and evaluator/sample counts still require documented acceptance and adviser agreement. The application does not train a model, predict next utility due dates, verify provider payment, or integrate gateways.

Older utility payment/receipt records remain historical and are not silently rewritten. Paid correction differences are recorded for external review rather than settled automatically. Existing shared-portfolio access does not claim independent landlord organization isolation or separate per-provider arrangement flexibility beyond saved unit configuration.

No commit or push was performed.
