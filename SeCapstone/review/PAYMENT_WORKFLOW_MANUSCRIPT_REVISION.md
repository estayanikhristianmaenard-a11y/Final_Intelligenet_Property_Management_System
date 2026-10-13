# Complete manuscript replacements — revised billing and payment workflow

Updated 12 October 2026. Source: `../papers/FINAL_MANUSCRIPT.pdf`, the user-confirmed 40-page manuscript. Page numbers refer to this PDF before editing; use the quoted paragraph openings if pagination changes. This file supersedes the earlier rent-only confirmation revision draft.

**How to use:** find the named section and paragraph opening, replace that entire paragraph with the text under **Paste this**, and keep surrounding headings, numbering, citations and unrelated paragraphs. Where a paragraph spans pages, replace the complete paragraph across the page break. Instructions and tables in this file are not manuscript text.

Agreed changes: property-email intake plus Manager-uploaded clear photos/scans of printed bills; tenants choose one payer for shared utilities; rent reporting or direct Manager recording with external checking; personal unverified utility tracking; Manager-approved use of confirmed advance credit for a selected rent cycle; no automatic replacement advance; missed-cycle recovery; 9 AM Philippine-time reminders three calendar days before the actual due date.

The PDF and backend have not yet adopted all these changes. Do not claim completed implementation or evaluation. No next-period utility due-date prediction, provider payment integration, refunds, Tenant SMS/email, autonomous AI or payment gateway is added.

## 1. Chapter I — Scope and Limitations, page 14: billing and advance

**Replace the whole paragraph starting:** “Billing will cover rent, electricity and water only.”

**Paste this:**

Billing will cover rent, electricity, and water only. Fixed, non-prorated rent will be generated once per monthly lease cycle on the lease-anniversary date, which will also be its due date. Short months will use their final calendar day while preserving the original anniversary day for later months. If the server is unavailable on the scheduled date, missed eligible rent cycles will be generated once when processing resumes, retaining their original due dates and recording the actual creation dates. The first rent bill will show current rent and one-month advance rent separately. After payment confirmation, the advance will become available rent credit that may cover a selected rent cycle with Manager approval. Applied credit cannot be reused, and a fully consumed advance will no longer be available for the final cycle. The system will not automatically require another advance payment to replace used credit. Credit application will retain the original payment and receipt reference without recording another cash payment or creating a duplicate receipt. Individual charges will follow the configured lease or utility account, while shared charges will be split equally among eligible tenants in a Manager-configured group. Shares will use two decimal places and must total the source charge. For shared utilities, tenants will decide which person pays the entire provider bill; the system will calculate individual shares without collecting contributions or verifying settlement of the provider account.

## 2. Chapter I — Scope and Limitations, pages 14–15: utility intake

**Replace the whole paragraph starting:** “Electronic utility bills will be retrieved from the designated property-management email account.”

**Paste this:**

Utility bills will enter the system through attachments received by the designated property-management email account or through Manager uploads of clear photographs or scans of printed provider bills. OCR will extract the amount due, due date, billing period, provider, and account or reference identifier from supported digitally generated PDFs and clear images of selected provider layouts. Required-field, mapping, period, and duplicate checks will precede classification and computation, including checks across email and uploaded copies of the same bill. Incomplete, uncertain, duplicated, unmappable, or otherwise invalid records will enter the Exception Queue for Manager correction, revalidation, and reprocessing. Finalized corrections will preserve prior values and tracking history. Utility due dates will come from validated received documents; the system will not predict the next billing period's due date.

## 3. Chapter I — Scope and Limitations, page 15: payment and reminders

**Replace the whole paragraph starting:** “The bill payment statuses will remain Unpaid, Tenant Reported Paid, and Paid.”

**Paste this:**

Rent payment statuses will remain Unpaid, Tenant Reported Paid, and Paid. Tenants may report rent payments for Manager review. The Manager may also record and confirm an actual rent payment without a prior Tenant report, after checking it outside the system. Only the Manager may authorize confirmed rent receipts; rejected reports will return to Unpaid with a recorded reason. Utilities will use a separate Tenant-controlled tracker with Not Marked Paid and Self-Reported Paid, accompanied by “Provider payment not verified.” A mark will refer only to the Tenant's own utility bill or allocated share and will neither require Manager confirmation nor generate a system-issued utility receipt. For shared bills, one Tenant's mark will not mark other shares or the whole provider account as paid. The system will not independently verify payments. Tenants will access their billing history, rent statuses, utility tracking records, and confirmed rent receipts through the authenticated portal. Web Push reminders will be scheduled at 9 AM Philippine time, three calendar days before the actual due date, for eligible Unpaid rent and utility records Not Marked Paid. Pending rent reports and utilities marked Self-Reported Paid will be excluded. Bills unavailable before the scheduled reminder time, including rent generated on its due date, will receive billing updates rather than backdated reminders. Push permission, device support, or delivery failure will not prevent portal access, and an alert will not prove payment or readership. Tenant SMS and email notifications are excluded.

## 4. Chapter I — Scope and Limitations, page 15: roles and evaluation

**Replace the whole paragraph starting:** “Admin access will be limited to system maintenance.”

**Paste this:**

Admin access will be limited to system maintenance. The Manager will manage property and tenant records, utility mappings, uploaded bills, billing rules, exceptions, corrections, rent payment confirmation, advance-credit application, and confirmed rent receipts. Tenants will view their permitted records, report rent payments, maintain their own utility tracking marks, and receive permitted alerts. Authentication and role restrictions will protect centralized records. Evaluation will cover Functional Suitability, Performance Efficiency, Interaction Capability, Reliability, and Security under the selected ISO/IEC 25010:2023 characteristics. It will not establish long-term changes in revenue, profitability, payment compliance, or Tenant behavior.

**Keep the page 16 exclusion paragraph unchanged.** Physical printed bills are supported only as clear photos/scans; handwritten, heavily damaged, severely distorted and low-resolution documents remain excluded. Browser access on phones does not add a standalone mobile application.

## 5. Chapter II — 2.0 Project Overview / Project Information, pages 17–18

**Replace the whole paragraph starting:** “The system provides an integrated workflow for rent and utility billing.”

**Paste this:**

The system provides an integrated workflow for rent and utility billing. It receives utility-bill attachments through the designated property-management email account and accepts Manager uploads of clear photographs or scans of printed provider bills. OCR extracts available information, which is validated and processed through predefined rules before billing computation and finalization. The system manages exceptions, records rent payment reports and Manager confirmations, supports approved use of confirmed advance credit, and provides digital receipts for confirmed rent payments. Electricity and water use separate personal tracking marks maintained by the assigned Tenant, without provider payment verification or system-issued utility receipts. Permitted Web Push billing updates and due-date reminders direct tenants to the authenticated portal.

## 6. Chapter II — Requirements Definition / A. Business Requirements, pages 18–19: intake

**Replace the whole paragraph starting:** “The system shall retrieve supported utility-bill attachments from the designated property-management mailbox”.

**Paste this:**

The system shall retrieve supported utility-bill attachments from the designated property-management mailbox and accept Manager uploads of clear photographs or scans of printed provider bills. OCR shall extract the amount due, due date, billing period, provider, and account or reference identifier. Explicit, deterministic, and traceable rules shall check required values, provider/account mappings, periods, and duplicates across both intake methods, identify the billing category and individual or shared arrangement, and route unprocessable records to the Exception Queue. Only valid records shall proceed to computation and finalization. Manager corrections shall undergo revalidation and, where applicable, reprocessing or recomputation, including corrections to finalized records.

## 7. Chapter II — A. Business Requirements, page 19: computation and advance

**Replace the whole paragraph starting:** “Billing shall cover rent, electricity and water.”

**Paste this:**

Billing shall cover rent, electricity, and water. Fixed, non-prorated rent shall be generated once per lease cycle on the anniversary date, using the last calendar day when necessary and retaining the original day for later months. Missed eligible cycles shall be recovered once after server availability resumes, with original due dates and actual creation dates retained. One-month advance rent shall appear separately on the first bill and become available credit after payment confirmation. Only the Manager shall approve applying available credit to a selected rent cycle. Applied amounts shall not be reused, and the system shall not automatically create a replacement advance charge. Shared charges shall be split equally among eligible tenants in the configured group, using the scheduled rent-cycle date for rent and the final day of the source period for utilities. For recovered rent cycles, eligibility shall use the original scheduled date rather than the recovery date. The eligible list shall be stored. Whole-centavo computation and remainder distribution in ascending permanent Tenant-record identifier order shall preserve the source total. Missing groups or eligible tenants shall require exception review. Duplicate billing, repeated advance-rent lines, and repeated credit application shall be prevented. Tenants shall arrange who pays a shared provider bill outside the system; calculating shares shall not establish provider settlement.

## 8. Chapter II — A. Business Requirements, page 19: records and statuses

**Replace the whole paragraph starting:** “The centralized database shall retain property, unit, tenant, mapping, rent, billing”.

**Paste this:**

The centralized database shall retain property, unit, Tenant, mapping, rent, billing, rent-payment, utility-tracking, exception, correction, receipt, and applicable notification records. Rent bills shall use Unpaid, Tenant Reported Paid, and Paid. Tenant reports shall remain unconfirmed until Manager confirmation; the Manager may also record and confirm an actual rent payment without a prior report after external checking. Receipts shall be issued only for confirmed rent payments. Utilities shall use separate Not Marked Paid and Self-Reported Paid tracking labels, with the notice “Provider payment not verified.” Each utility mark shall belong to the reporting Tenant and the corresponding bill or allocated share, without authorizing a system-issued receipt or changing other tenants' marks. Tenants shall access their bills, history, rent statuses, personal utility tracking, and confirmed rent receipts through the authenticated portal. Eligible reminders shall be scheduled at 9 AM Philippine time, three calendar days before the actual due date. Routine valid billing records shall proceed automatically, while exceptions shall require Manager intervention. SMS, GSM, and Tenant email notifications shall not be used; the mailbox shall serve utility intake only.

## 9. Chapter II — B. User Requirements, page 20

**Replace the whole paragraph starting:** “The Admin shall perform only the implemented system-maintenance functions.” Keep the B. User Requirements heading and the following C. Security Requirements section.

**Paste this:**

The Admin shall perform only the implemented system-maintenance functions. The Manager shall log in with valid credentials and manage properties, units, tenants, utility providers, account mappings, rent, billing arrangements, and applicable rules. The Manager shall upload supported bill images, review OCR and billing results, resolve exceptions, and submit corrections for revalidation and recomputation. The Manager shall confirm or reject Tenant-reported rent payments, record and confirm actual rent payments without prior reports after external checking, approve available advance-credit application, and view confirmed rent receipts. The Manager shall not verify utility-provider payments or change a Tenant's personal utility tracking mark. The Tenant shall log in with valid credentials and view assigned property or unit information, rent and utility bills, categories, periods, amounts due, and historical records. Reporting rent payment shall change it to Tenant Reported Paid; Manager confirmation shall mark it Paid, while rejection with a recorded reason shall return it to Unpaid. For utilities, the Tenant may mark their own bill or allocated share as Self-Reported Paid and return it to Not Marked Paid when necessary. These changes shall retain dated history and display “Provider payment not verified.” Tenants shall view confirmed rent receipts and receive permitted Web Push alerts linking to the authenticated portal.

## 10. Chapter II — 2.1 Concept of the Study / Architectural Framework, page 21

**Replace the whole paragraph starting:** “The framework connects property and unit management”.

**Paste this:**

The framework connects property and unit management, Tenant management, utility-provider and account mapping, and rent configuration with email intake, Manager bill uploads, OCR, validation, rule-based classification, duplicate checking, billing computation, and the Exception Queue. Billing records, rent payment-status management, advance-credit application, confirmed rent receipts, personal utility tracking, and Web Push notifications use the Centralized Database. The Admin, Manager, Tenant, and Utility Provider interact with these components according to their defined responsibilities.

## 11. Chapter II — 2.1 component descriptions, pages 22–23: utility mapping

**Replace the complete passage beginning:** “Property and Unit Management manages property and unit information.” End the replacement after “The Manager configures the applicable mappings” on page 23. This includes the Tenant Management and utility-mapping descriptions across the page break.

**Paste this:**

Property and Unit Management manages property and unit information. Tenant Management manages Tenant information and its association with the applicable property or unit. Utility Provider and Account/Reference Mapping stores the provider, account or billing number, covered property or unit, and Manager-selected Individual or Shared-Occupancy Billing Arrangement. Individual utility bills follow the assigned account without splitting. Shared bills are divided equally among eligible tenants in the configured group. Tenants decide which person pays the whole shared provider bill outside the system; the allocation does not represent collection or verified payment.

## 12. Chapter II — 2.1 component descriptions, page 23: rent generation

**Replace the whole paragraph starting:** “Rent will be generated once per monthly lease cycle on the configured anniversary date”.

**Paste this:**

Rent will be generated once per monthly lease cycle on the configured anniversary date, which will also be its due date. The charge will be fixed and non-prorated, with its coverage period recorded. If the anniversary day is absent, the system will use the month's last day and retain the original day for later months; a January 31 anniversary therefore uses February 28 or 29 and then March 31. If the server is unavailable, missed eligible cycles will be recovered once when processing resumes. Each recovered bill will retain its original due date, coverage period, and scheduled eligibility date while recording its actual creation date. Generation checks will prevent duplicate cycles, repeated advance-rent lines, and new cycles after the lease end date. Existing unpaid charges will remain accessible, and later membership changes will not silently replace finalized bills.

## 13. Chapter II — 2.1 component descriptions, page 23: advance rent

**Replace the whole paragraph starting:** “The first bill will show current rent and one-month advance rent as separate rent lines.”

**Paste this:**

The first bill will show current rent and one-month advance rent as separate rent lines. Advance rent is not a security deposit and will become available credit only after Manager confirmation of its payment. Shared tenants will have separate current-rent and advance-rent shares. Available advance credit may cover a selected rent cycle with Manager approval rather than being reserved exclusively for the final cycle. The system will display the selected charge, confirmed available credit, and remaining balance before application. If the approved credit fully covers the charge, the bill will become Paid using the original confirmed payment and receipt reference, without another cash payment or duplicate receipt. Applied credit shall not exceed the available confirmed amount and shall not be reused. Fully consumed credit will no longer be available for another cycle, including the final cycle, and no replacement advance charge will be generated automatically. Only a remaining outstanding balance may be reported for payment. A mismatch between available credit and the selected charge will require Manager review rather than an invented refund or automatic settlement.

## 14. Chapter II — 2.1 component descriptions, pages 23–24: OCR intake

**Replace the whole paragraph starting:** “The designated property-management mailbox will retrieve supported utility-bill attachments”.

**Paste this:**

The designated property-management mailbox will retrieve supported utility-bill attachments and will not send Tenant notifications. The Manager may also upload a clear photograph or scan of a printed provider bill. Both intake methods will follow the same OCR, validation, mapping, and duplicate-checking workflow. An existing OCR engine will recognize text from selected provider layouts in digitally generated PDFs and clear images without researcher training or customization of a machine-learning model. Predefined extraction rules will obtain the amount due, due date, billing period, provider, and account or reference identifier while retaining the source reference. OCR will not establish payment status, billing validity, or Tenant charges; extracted fields will undergo validation and mapping. Actual validated utility due dates will be used for billing and reminders, without predicting dates for documents not yet received.

**Keep the following paragraph starting “Absent, unreadable or conflicting values” unchanged.** Keep Table 2.1 and its V01–V04, C01–C02, A01 and R01 rules; the same checks apply to email and uploaded copies.

## 15. Chapter II — 2.1 component descriptions, pages 26–27: shared allocation

**Replace the whole paragraph starting:** “Individual charges will follow the configured lease or utility account.”

**Paste this:**

Individual charges will follow the configured lease or utility account. Shared rent and utility charges will be split equally among eligible tenants in the Manager-configured property or unit group, without consumption estimates or meter readings. Eligibility will use active assignments on the scheduled rent-cycle date for rent and on the source period's final day for utilities, excluding assignments already ended. Recovered rent cycles will use their original scheduled eligibility dates. The system will retain the eligible list so later occupancy changes do not alter finalized charges. Missing groups, periods, or eligible tenants will enter the Exception Queue. Computation will divide the source charge in whole centavos, assigning equal base shares and distributing leftover centavos in ascending permanent Tenant-record identifier order. PHP 100.00 split among three tenants will produce PHP 33.34, PHP 33.33, and PHP 33.33. Shares will display two decimal places and must total the source charge before finalization. For shared utilities, tenants will arrange one person to pay the whole provider bill outside the system. Personal tracking will refer only to each Tenant's allocated share and will not establish payment of the full provider account.

## 16. Chapter II — 2.1 component descriptions, pages 27–28: payment and corrections

**Replace the complete paragraph starting:** “Billing Records will retain current and finalized charges using Unpaid, Tenant Reported Paid and Paid.” End replacement after “without automated settlement” on page 28. Use all three paragraphs below.

**Paste this:**

Billing Records will retain rent and utility charges while separating rent confirmation from personal utility tracking. Rent will use Unpaid, Tenant Reported Paid, and Paid. Tenants may report full payment of a selected outstanding rent balance; partial payments and overpayments will not be processed automatically. Tenant reports will remain pending until the Manager checks the payment outside the system. Rejection will record a reason, restore Unpaid, and preserve report history. The Manager may also record and confirm an actual rent payment without a prior Tenant report after external checking. Either confirmation path will retain the confirmed amount, payment date, Manager identity, and unique receipt. Repeated submission or confirmation of the same transaction will not create another payment or receipt.

Electricity and water will use the personal tracking labels Not Marked Paid and Self-Reported Paid, accompanied by “Provider payment not verified.” Tenants may change only their own bill or allocated-share mark, with dated history retained. In shared arrangements, tenants will decide which person pays the provider bill; a personal mark will not change other tenants' marks or establish settlement of the entire account. Utility tracking will require neither Manager confirmation nor a system-issued receipt. A mark will refer to the recorded bill or allocation version, so later charge corrections will preserve earlier history and require Tenant review of the revised information. The system will not independently verify cash, bank transfers, electronic-wallet transactions, Tenant contributions, or utility-provider payments.

Finalized corrections will preserve prior values and processing history. Unpaid rent charges may be corrected after revalidation and recomputation; pending reports must be reviewed against revised amounts. Paid rent bills will retain their original payment and receipt, with corrections recorded as linked revisions showing charge and balance changes. Utility corrections will retain their original source, allocation, and associated personal tracking history and undergo applicable validation and recomputation. External payments or refunds will remain outside automated settlement. Tenants will access current and historical records through the authenticated portal.

## 17. Chapter II — 2.1 component descriptions, page 28: database

**Replace the whole paragraph starting:** “The Centralized Database will relate properties, units, tenants, leases”.

**Paste this:**

The Centralized Database will relate properties, units, tenants, leases, utility mappings, billing sources, allocations, rent payment reports, Manager-recorded payments and confirmations, confirmed rent receipts, advance-credit applications, utility tracking history, exceptions, corrections, and notifications. Recorded assignments will support multiple tenants per shared unit. Allocations will link to their source and eligible group; rent payments and receipts will link to their bills. Personal utility tracking will link to the assigned Tenant and the relevant bill or allocated share. These relationships will preserve transaction history and support access restrictions. Corrections will remain centralized records rather than a separate architectural component. The database design will define storage relationships while the framework, flowchart, and DFD describe structure and operation.

## 18. Chapter II — 2.1 component descriptions, pages 28–29: Web Push

**Replace the paragraph starting:** “Web Push will be the only external tenant-notification channel.” Then replace the following paragraph starting “Notification records will distinguish” using the second paragraph below.

**Paste this:**

Web Push will be the only external Tenant-notification channel. On a supported browser, Tenant permission will allow creation and storage of an account/device subscription and the background handling needed to receive an alert. Alerts will open the authenticated billing record without revealing complete details beforehand or confirming payment. Finalization and relevant corrections will trigger billing updates. Reminders will be scheduled at 9 AM Philippine time, three calendar days before the actual due date, for eligible Unpaid rent and utility records Not Marked Paid. Rent reports awaiting Manager confirmation and utility records marked Self-Reported Paid will be excluded. A utility reminder will prompt the Tenant to check whether the bill or share has been paid; suppressing it after a personal mark will not establish provider settlement. Corrected due dates will replace pending schedules, and repeated events will not duplicate reminders. Bills unavailable before the scheduled reminder time, including same-day rent and late recovered bills, will receive billing updates rather than backdated reminders. If the server misses the reminder time, it will not send a retrospective reminder for that missed event.

Notification records will distinguish scheduling, attempts, and available push-service acceptance or failure results. Acceptance will not prove receipt or reading. Invalid subscriptions, denied permission, unsupported devices, and delivery failures will not prevent authenticated access to bills, rent statuses, personal utility tracking, or confirmed rent receipts. SMS, GSM, and Tenant email will remain excluded.

## 19. Chapter II — 2.1 component descriptions, page 29: roles

**Replace the whole paragraph starting:** “The Admin performs system-level maintenance.”

**Paste this:**

The Admin performs system-level maintenance. The Manager manages property information, Tenant records, utility mappings, billing configurations, bill uploads, exceptions, corrections, rent payments and confirmation, approved advance-credit application, and confirmed rent receipts. The Tenant views their billing information and history, reports rent payments, maintains their own utility tracking marks, views confirmed rent receipts, and receives permitted Web Push Notifications. The Utility Provider supplies electronic bills received through the designated property-management email account or printed bills submitted as clear images by the Manager. Provider settlement and the arrangement of shared-bill contributions remain outside the system's verification functions.

## 20. Chapter II — 2.1 component descriptions, page 29: integration

**Replace the whole paragraph starting:** “The components operate as an integrated web-based property-management system.”

**Paste this:**

The components operate as an integrated web-based property-management system. Property and Tenant management, utility mapping, and rent configuration provide the required information. Billing-processing components support email intake, Manager bill uploads, OCR extraction, validation, rule-based classification, duplicate checking, billing computation, and exception handling. Billing and payment components manage rent payment statuses, Manager-recorded confirmations, approved advance-credit applications, confirmed rent receipts, and separate personal utility tracking. The Web Push Notification component supports permitted billing and due-date alerts, while the Centralized Database stores the applicable system records. The Admin, Manager, Tenant, and Utility Provider interact with the system according to their defined roles and responsibilities.

## 21. Chapter II — 2.2 Conceptual Operation, page 30

**Replace the paragraph starting:** “The workflow uses property, tenant, utility-mapping and rent configuration”. Then replace the following paragraph starting “Shared charges use equal splitting” with the second paragraph below.

**Paste this:**

The workflow uses property, Tenant, utility-mapping, and rent configuration to process rent, electricity, and water charges. Monthly rent follows the fixed anniversary rule, with one-month advance rent shown separately on the first bill. Missed eligible cycles are recovered once with original due dates and actual creation dates retained. Utility processing receives property-email attachments or Manager-uploaded clear images of printed bills, extracts their fields through OCR, and validates required information, mappings, periods, and duplicates. Valid records proceed to classification, computation, and finalization; exceptions require Manager correction and renewed validation.

Shared charges use equal splitting among configured eligible tenants, using the scheduled rent-cycle date or the utility period's final day. Whole-centavo computation and consistent remainder distribution preserve the source total. Rent begins as Unpaid; Tenant reports become Tenant Reported Paid until Manager confirmation, while rejected reports return to Unpaid with recorded reasons. The Manager may also record and confirm externally checked rent payments without a Tenant report. Confirmed advance credit may cover a selected rent bill with Manager approval, reusing the original payment and receipt rather than recording another cash transaction. Consumed credit cannot be reused, and no replacement advance is charged automatically. Utilities use separate Tenant-controlled Not Marked Paid and Self-Reported Paid marks with “Provider payment not verified.” Tenants arrange the payer of a shared provider bill outside the system; individual marks do not confirm payment of the full account or authorize receipts. Permitted billing updates and eligible reminders at 9 AM Philippine time, three calendar days before the actual due date, link to the authenticated portal without proving payment, delivery, or reading.

## 22. Chapter II — Table 2.2 Development Iterations, pages 36–37

Only replace the following cells; keep the seven iterations and other rows intact.

| Row / cell | Paste this |
| --- | --- |
| Iteration 3 — Development Focus | Property-Management Email Intake, Bill Upload, and OCR |
| Iteration 3 — Main Functions | Designated email intake, attachment retrieval, Manager upload of clear printed-bill images, supported document processing, and OCR extraction |
| Iteration 6 — Development Focus | Rent Payment, Utility Tracking, Digital Receipt, and Web Push Notification |
| Iteration 6 — Main Functions | Rent statuses, Tenant rent reporting, Manager-recorded payments and confirmation, approved advance-credit application, confirmed rent receipts, personal utility tracking, Tenant portal access, and Web Push alerts |

## 23. Chapter II — 2.4.3 Application of the Methodology, page 37

**Replace the whole paragraph starting:** “The planned iterations will be applied progressively”.

**Paste this:**

The planned iterations will be applied progressively, beginning with the system foundation and configuration functions and continuing with property-email intake, Manager bill uploads, OCR extraction, rule-based processing, exception handling, Billing Computation, rent payment and receipt management, approved advance-credit application, personal utility tracking, Tenant access, and Web Push Notifications. Each iteration will build upon related functions developed in earlier iterations.

## 24. Chapter II — 2.4.5 System Testing and Evaluation Procedures, page 39

**Replace the whole paragraph starting:** “Validation, mapping, classification and exception routing will be checked”.

**Paste this:**

Validation, mapping, classification, and exception routing will be checked against predefined outcomes for both email attachments and Manager-uploaded printed-bill images. Rent and utility computations will be checked independently, including individual shares, exact source reconciliation, anniversary dates, short-month handling, and missed-cycle recovery without duplicate charges. Rent payment tests will verify Tenant reporting, direct Manager recording after external checking, Manager-only confirmation, approved advance-credit use, remaining-balance reporting, and original-receipt reuse without repeated credit or automatic replacement charges. Utility tracking tests will verify that only the assigned Tenant may change their own mark, dated history is retained, and no mark establishes provider settlement or generates a system-issued utility receipt. Reminder tests will check the 9 AM Philippine-time cutoff, three-calendar-day timing, late bills, pending rent reports, and self-reported utility marks. Repeated processing will be checked for duplicate charges, payments, credit applications, receipts, or reminders.

## 25. Chapter I — topical RRL: Rule-Based Billing Processing, page 7

This paragraph contains citations; preserve them exactly. Replace the complete paragraph starting “Once billing information has been extracted”.

**Paste this:**

Once billing information has been extracted, it must be checked and processed according to defined conditions. Rule-based processing uses explicit conditions and decision rules to classify, validate, and route information. Wu et al. (2022) demonstrate the use of rule-based information extraction to organize domain-specific information, while Baralis et al. (2022) discuss business-rule engines for representing and executing operational decisions in a structured manner. Extending this idea to process automation, Geyer-Klingeberg et al. (2024) present a rule-based method that analyzes decision logic and classifies business processes according to their suitability for robotic process automation, while Kim et al. (2011) examine proactive exception handling in business processes. These studies support the use of predefined and traceable conditions to determine whether a record proceeds through normal processing or requires additional review. Applying these principles, the proposed system uses defined rules for billing validation, provider and account/reference mapping, duplicate detection, and identifying individual or shared billing arrangements. Records that do not meet the defined conditions are sent to the Exception Queue for Manager review. These rules, together with the separation between Tenant-reported rent and Manager-confirmed rent status, are system requirements rather than findings established by the cited studies. Digital rent receipts are created only after Manager confirmation. Personal utility tracking remains separate and does not establish provider settlement.

## Diagram updates — retain the existing layout where practical

These are diagram instructions, not additional manuscript paragraphs.

| Diagram | Required revision |
| --- | --- |
| Architectural framework | Add Manager bill upload as an intake path; distinguish rent payment/receipt management from personal utility tracking. Keep the centralized correction/OCR components. |
| Process flowchart | Rent may enter through Tenant reporting or direct Manager recording, followed by Manager confirmation. Utilities go to personal tracking, not confirmation or receipt issuance. Replace final-cycle-only credit with Manager-approved available credit for a selected rent cycle. |
| DFD | Show Manager-uploaded bill input, rent payment/confirmation flows, Tenant utility-mark changes, and corresponding stored history. No utility-provider payment-confirmation connection is added. |

## What remains unchanged / what still needs a decision

Keep the approved title, research questions, topical literature headings, citations outside the replaced paragraph, evaluation characteristics, non-prorated rent, equal splitting, validation rules, and unrelated limitations. Do not add predicted utility due dates, provider settlement verification, Tenant SMS/email, bank/gateway integration, independent collection of Tenant contributions, or automatic refunds.

Historical unit transfers and lease renewals have not been decided in this discussion. Do not add them as completed functions or silently exclude an already-required workflow. They need a separate, explicit decision if the study will test them.

If confirmed advance exceeds the selected rent charge, do not silently discard money or invent a refund. Retain the discrepancy for Manager review. The draft preserves this boundary rather than introducing a new credit/refund policy.

After these replacements and diagram updates, export a new PDF for comparison before treating it as the revised finalized baseline. The current backend still needs the corresponding utility tracker, direct Manager payment path, selected-cycle advance behavior, and precise reminder cutoff; manuscript edits do not implement those functions.
