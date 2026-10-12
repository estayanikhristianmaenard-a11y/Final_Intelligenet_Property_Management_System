# Payment workflow revision — 12 October 2026

User-confirmed policy: Tenants pay utility providers directly, including shared utility obligations. Managers confirm rent payments only. This file provides replacement text for the 40-page FINAL_MANUSCRIPT.pdf. The PDF and application code have not yet been changed. Keep the existing headings, numbering, citations and all unrelated text.

Rent retains Unpaid, Tenant Reported Paid and Paid. Utility tracking uses Not Marked Paid and Self-Reported Paid, displayed with “Provider payment not verified.” These utility labels describe the Tenant's own tracking record, not an official provider settlement status. The proposed utility tracker is not implemented by the current backend.

## Page 15 — Scope and Limitations: payment paragraph

Replace the passage beginning “The bill payment statuses will remain” through “Tenant SMS and email notifications are excluded.”

Rent payment statuses will remain Unpaid, Tenant Reported Paid, and Paid. A Tenant's rent report will remain unconfirmed until the Manager verifies the payment outside the system. Only the Manager may confirm rent payment and authorize its digital receipt. Rejected rent reports will return to Unpaid with a recorded reason. Electricity and water payments will be made directly to the utility providers and will use a separate Tenant-controlled tracker. Tenants may mark their own utility bill or allocated share as Self-Reported Paid or leave it Not Marked Paid. Self-Reported Paid will be displayed with the notice “Provider payment not verified”; it will not require Manager confirmation or generate a system-issued payment receipt. In shared arrangements, each mark will refer only to the reporting Tenant's allocated share and will not establish settlement of the entire provider account. The system will not independently verify payments. Tenants will access their bills, rent payment statuses, utility tracking history, and confirmed rent receipts through the authenticated portal. Web Push will provide billing updates and eligible reminders three calendar days before the due date. Rent reminders will exclude reports awaiting Manager confirmation, while utility reminders will exclude records marked Self-Reported Paid. Records available after the scheduled reminder time, including rent generated on its due date, will receive billing updates rather than backdated reminders. Push permission, device support, or delivery failure will not prevent portal access, and an alert will not prove payment or readership. Tenant SMS and email notifications are excluded.

In the following Admin/Manager paragraph, replace “payment confirmation and receipts” with “rent payment confirmation and rent receipts.” Keep the rest of that paragraph.

## Page 19 — A. Business Requirements: centralized-records paragraph

Replace the paragraph beginning “The centralized database shall retain” and ending “the mailbox shall serve utility intake only.” Keep the preceding computation and allocation paragraph.

The centralized database shall retain property, unit, tenant, mapping, rent, billing, rent-payment, utility-tracking, exception, correction, receipt, and applicable notification records. Rent bills shall use Unpaid, Tenant Reported Paid, and Paid. Tenant-reported rent payments shall remain unconfirmed until Manager confirmation, and digital receipts shall be issued only for confirmed rent payments. Utility payments shall be made directly to providers and recorded through a separate personal tracker using Not Marked Paid and Self-Reported Paid. The latter shall carry the notice “Provider payment not verified” and shall not establish official payment status or authorize a system-issued receipt. A shared utility mark shall refer only to the Tenant's allocated share, not the entire provider bill. Tenants shall access their billing details, rent statuses, utility tracking history, and confirmed rent receipts through the authenticated portal. Permitted Web Push billing updates and eligible reminders three calendar days before the due date shall direct them to that portal. Routine valid billing records shall proceed automatically, while exceptions shall require Manager intervention. SMS, GSM, and tenant email notifications shall not be used; the mailbox shall serve utility intake only.

## Page 20 — B. User Requirements

Replace the complete B. User Requirements paragraph, preserving its heading. Leave C. Security Requirements in place.

The Admin shall perform only the implemented system-maintenance functions. The Manager shall log in with valid credentials and manage properties, units, tenants, utility providers, account mappings, rent, billing arrangements, and applicable rules. The Manager shall review billing and OCR results, resolve exceptions, correct billing or rent-payment information, and submit corrections for revalidation and recomputation where applicable. The Manager shall confirm or reject tenant-reported rent payments and view rent payment statuses and confirmed rent receipts. Utility-payment tracking shall not require Manager confirmation. The Tenant shall log in with valid credentials and view assigned property or unit information, rent and utility bills, categories, periods, amounts due, and applicable tracking records. Reporting rent payment shall change a rent bill to Tenant Reported Paid rather than Paid; Manager confirmation shall mark it Paid, while rejection with a recorded reason shall return it to Unpaid. For electricity and water paid directly to providers, the Tenant may mark their own bill or allocated share as Self-Reported Paid and return the personal tracking mark to Not Marked Paid when necessary. The system shall retain these changes with their dates and shall display “Provider payment not verified.” Tenants shall view confirmed rent receipts and receive permitted Web Push billing and due-date alerts linking to the authenticated portal.

## Pages 27–28 — Billing Records and finalized corrections

Replace the paragraph beginning “Billing Records will retain” through “without automated settlement” on the following page. Leave the surrounding exception, database and notification paragraphs in place.

Billing Records will retain finalized rent and utility charges while separating rent payment confirmation from utility tracking. Rent will use Unpaid, Tenant Reported Paid, and Paid. Tenants may report full payment of the selected outstanding rent balance; partial payments and overpayments will not be processed automatically. Rent reports will remain unconfirmed pending Manager verification outside the system. Rejection will record a reason, restore Unpaid, and preserve report history. Manager confirmation will mark the rent bill Paid and retain the confirmed amount, date, Manager identity, and unique receipt. Repeated confirmation will return the existing receipt.

Electricity and water payments will be made directly to providers. Tenants may record their own utility bill or allocated share as Self-Reported Paid for personal tracking. This mark will be accompanied by “Provider payment not verified” and will not require Manager confirmation, authorize a system-issued payment receipt, or establish settlement of the whole shared provider account. Tenants may return their own mark to Not Marked Paid, with dated history retained. A personal tracking mark will refer to the recorded bill or allocation version; later charge corrections will preserve the earlier mark and require Tenant review of the revised billing information. The system will not independently verify cash, bank transfers, electronic-wallet transactions, or utility-provider payments.

Finalized corrections will preserve prior values and processing history. Unpaid rent charges may be corrected after revalidation and recomputation, while pending rent reports must be reviewed against revised amounts. Paid rent bills will retain their original payment and receipt, with corrections recorded as linked revisions showing charge and balance changes. Utility corrections will retain the original source, allocation, and associated tracking history and will undergo the same applicable validation and recomputation checks. External payments or refunds will remain outside automated settlement; the system will not confirm utility-provider transactions or create refunds. Tenants will access current and historical records through the authenticated portal.

## Page 28 — Centralized Database paragraph

Replace the paragraph beginning “The Centralized Database will relate” through “structure and operation.”

The Centralized Database will relate properties, units, tenants, leases, utility mappings, billing sources, allocations, rent payment reports, Manager confirmations, rent receipts, utility tracking records, exceptions, corrections, and notifications. Recorded assignments will support multiple tenants per shared unit. Allocations will link to their source and eligible group; rent payments and receipts will link to their bills. Utility tracking records will link to the reporting Tenant and the corresponding bill or allocated share. These relationships will preserve transaction history and support access restrictions. Corrections will remain centralized records rather than a separate architectural component. The database design will define storage relationships while the framework, flowchart, and DFD describe structure and operation.

## Pages 28–29 — Web Push paragraph

Replace the two-paragraph Web Push passage beginning “Web Push will be the only external” and ending “tenant email will remain excluded.”

Web Push will be the only external tenant-notification channel. On a supported browser, Tenant permission will allow creation and storage of an account/device subscription and the background handling needed to receive an alert. Alerts will open the authenticated billing record without revealing complete details beforehand or confirming payment. Finalization and relevant corrections will trigger billing updates. Philippine-time reminders will be scheduled three calendar days before the due date for eligible outstanding Unpaid rent records and utility records Not Marked Paid. Rent reports awaiting Manager confirmation and utility records marked Self-Reported Paid will be excluded from these reminders. Suppressing a utility reminder will reflect the Tenant's tracking choice rather than verified provider settlement. Corrected due dates will replace pending schedules, and repeated events will not duplicate reminders. Bills available after the scheduled reminder time, including rent generated on its due date, will receive billing updates rather than backdated reminders.

Notification records will distinguish scheduling, attempts, and available push-service acceptance or failure results. Acceptance will not prove receipt or reading. Invalid subscriptions, denied permission, unsupported devices, and delivery failures will not prevent authenticated access to bills, rent statuses, utility tracking records, or confirmed rent receipts. SMS, GSM, and tenant email will remain excluded.

## Page 29 — role and component descriptions

In the role-description paragraph, change “payment confirmations, and receipts” to “rent payment confirmations, and rent receipts.” Change the Tenant description to:

The Tenant views billing information and rent payment status, reports applicable rent payments, records personal utility tracking marks, views confirmed rent receipts, and receives permitted Web Push Notifications.

In the component-description paragraph, replace the sentence beginning “Billing and payment components manage” with:

Billing and payment components manage billing records, rent payment statuses, confirmed rent receipts, and separate Tenant-controlled utility tracking records.

## Page 30 — 2.2 Conceptual Operation: payment passage

Replace the passage beginning “Finalized charges begin as Unpaid” through the end of the paragraph. Keep the preceding billing and allocation discussion.

Finalized rent bills begin as Unpaid. When a Tenant reports rent payment, the status changes to Tenant Reported Paid. Only Manager confirmation changes rent to Paid and authorizes a rent receipt. Rejected rent reports return to Unpaid with retained history. Final rent covered by confirmed advance credit follows Manager-confirmed credit application using the original payment and receipt, without another cash transaction or duplicate receipt. Electricity and water payments are made directly to providers and tracked separately by the Tenant as Not Marked Paid or Self-Reported Paid. Each utility mark carries the notice “Provider payment not verified” and refers only to the Tenant's bill or allocated share. Utility tracking does not authorize a system-issued receipt or establish settlement of a shared provider account. Permitted billing alerts and eligible reminders three calendar days before the due date link to the authenticated portal without proving payment, delivery, or reading.

## Page 21 — Architectural Framework introduction

Replace “Billing records, payment-status management, digital receipts and Web Push notifications use the Centralized Database.” with:

Billing records, rent payment-status management, confirmed rent receipts, personal utility tracking, and Web Push notifications use the Centralized Database.

## Page 37 — Table 2.2, Iteration 6 and methodology application

Replace the Iteration 6 Development Focus cell with:

Rent Payment, Utility Tracking, Digital Receipt, and Web Push Notification

Replace its Main Functions cell with:

Rent payment statuses, Tenant rent reporting, Manager rent confirmation, confirmed rent receipts, personal utility tracking, tenant portal access, and Web Push alerts

In the first paragraph of 2.4.3, replace “payment and receipt management” with “rent payment and receipt management, personal utility tracking”. Leave the other methodology activities and evaluation criteria unchanged.

## Page 39 — 2.4.5 testing paragraph

Replace “Payment tests will verify Manager-only confirmation, correct advance-credit settlement and receipts only for confirmed payments.” with:

Rent payment tests will verify Manager-only confirmation, correct advance-credit settlement, and receipts only for confirmed rent payments. Utility tracking tests will verify that only the assigned Tenant may change their own mark, that dated history is retained, and that self-reported utility payment neither requires Manager confirmation nor creates a system-issued receipt or proves provider settlement. Reminder tests will check the separate rent and utility eligibility rules.

## Consistency edits before the revised PDF is finalized

In Table 2.2, Iteration 6, qualify payment reporting/confirmation/receipts as rent functions and include utility tracking within that iteration. Keep the existing seven-iteration structure.

Where Chapter I describes the separation between Tenant Reported Paid and Manager-confirmed status, qualify it as rent payment status. In the Rule-Based Billing Processing topic, replace “Digital receipts are created only after payment confirmation.” with “Digital rent receipts are created only after Manager confirmation of rent payment.” Keep its citations and literature discussion unchanged. Qualify other generic Manager payment-confirmation and confirmed-receipt references as rent where they describe operational behavior; retain the general exclusion of independent verification for all external payments.

In the framework/flowchart/DFD, retain the existing billing-intake and allocation paths. Separate the payment path into rent reporting → Manager confirmation/rejection → confirmed rent receipt, and utility tracking → Tenant-controlled mark → dated tracking record. Utility tracking must not lead to Manager confirmation, rent advance credit, or system-issued receipt generation. This is a necessary update to the adopted workflow, not an additional provider integration.

No prediction of a future provider due date is added. Utility reminders use the actual validated due date from a received source bill. Existing OCR validation, allocation, duplicate checking, exception routing, privacy boundaries, and direct-provider-payment verification exclusions remain in place.

The current backend still applies its original general payment-confirmation workflow to utilities. It will require category-specific reporting, statuses, history, receipt guards, reminder eligibility, and revised-bill review after this manuscript revision is adopted. Do not describe the utility tracker as implemented yet.
