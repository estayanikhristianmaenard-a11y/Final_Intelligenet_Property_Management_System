# Consolidated workflow decisions

Finalized for manuscript drafting on 12 October 2026. This is the current agreed rule set and supersedes earlier exploratory notes. It does not mean the PDF or backend already implements every rule.

| Area | Agreed rule |
| --- | --- |
| Core focus | Property-email intake ? supported OCR ? validation/mapping/classification ? computation ? bill/history display ? permitted alerts. No additional features are being added. |
| Scope | Rent, electricity and water only; deterministic rules and Manager actions, not autonomous AI decisions. |
| Email | Designated property email is the main utility-bill source. |
| Physical bills | Optional Manager upload of a clear photo/scan uses the same pipeline. Manager may hand out the paper without uploading; no portal record exists until a copy is received and validated. |
| OCR | Extract amount due, actual due date, period, provider and account/reference. Supported layouts/documents only; uncertain results require review. No next-period due-date prediction. |
| Duplicates | Check both attachments and provider/account/period across email and upload. Retain one accepted charge; duplicate/revised copies require review. |
| Configuration | Manager saves provider/account, covered property/unit and Individual/Shared arrangement. |
| Allocation | Equal whole-centavo shares; remainder by ascending permanent Tenant ID. Store recipients. Use scheduled rent-cycle date, or utility-period end, for eligibility. |
| Shared provider payment | Tenants choose one payer outside the system. No contribution collection or verification of provider settlement. |
| Utility tracking | Tenant alone marks their own bill/share Not Marked Paid or Self-Reported Paid, with ?Provider payment not verified.? Undo is allowed with dated history. No proof upload, Manager approval or system-issued utility receipt. |
| Rent payment | Unpaid ? Tenant Reported Paid ? Manager-confirmed Paid. Manager may also record an externally checked actual payment without a Tenant report. Retain amount/date/Manager and unique receipt. |
| Rejected/duplicate reports | One pending rent report per bill. Retain rejection reason, restore Unpaid, and prevent duplicate payment/receipt creation on retries. |
| Advance | One month of configured Tenant rent/share, separate on the first bill; available only after payment confirmation. Reserved for the final applicable rent cycle. |
| Final credit | Manager confirms application; fully covered final rent becomes Paid using the original payment/receipt. No new cash payment/receipt, double use or automatic replacement advance. Only remaining balance may be reported. Credit mismatches require review. |
| Postponed credit features | No shield/heart allowance, flexible mid-tenancy use or in-app advance request/approval module. |
| Rental continuation | Month-to-month; start date recorded, end date blank until departure. No renewal transaction or automatic unit-transfer feature. |
| Departure | Full non-prorated rent remains. Stop cycles after end date; preserve history and unpaid balances. Existing Tenant account can access their own records and report outstanding rent for Manager confirmation. |
| Missed rent | Recover eligible cycles once after restart; retain original due/coverage/eligibility dates and actual creation time. |
| Reminders | 9 AM Philippine time, three calendar days before actual due date. Exclude pending rent reports and self-marked utilities. Late bills receive updates, not backdated reminders. No retrospective missed reminder. |
| Corrections | Revalidate, retain original/current values, reason and Manager. Preserve paid transaction/receipt and record linked differences; no automatic refunds or silent replacement. Utility marks refer to the recorded version and need Tenant review after a charge correction. |
| Access/interface | Admin maintenance, Manager operations, Tenant-own records. Responsive browser portal for phones/tablets/desktops; plain-language exceptions with technical rule IDs retained in history. |
| External limits | No Tenant SMS/email, gateways, provider payment verification, collection management, predictive billing or additional approval levels. Local HTTP demos do not verify external phone Push; actual integrations/devices require acceptance checks. |

## Next steps

Use UPDATED_PDF_CONTENT_REVIEW.md for the remaining manuscript edits. Finalize the manuscript, update the diagrams, export a revised PDF for comparison, then align backend behavior and tests. No completed implementation, participant evaluation or production readiness is claimed by this decision document.
