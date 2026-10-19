# Updated manuscript review — 14 October 2026

Reviewed source: `D:/CAPSTONE/Papers/Intelligent Property Management Workflow with OCR-Enabled Automated Billing Classification and Tenant Notification.pdf`, 49-page export. All pages were text-extracted, the body was compared with the prepared Chapter I and II drafts, and the three embedded figure images were inspected on a white background. A complete page-rendering inspection of margins and typography was not performed.

## Verdict

The revised text is substantially consistent with the agreed workflow. It needs one important paragraph restoration and several small clarity/formatting corrections. It does not require another complete rewrite. The embedded figures remain from an earlier workflow and require alignment before the combined manuscript can be called finalized. The uploaded PDF and the repository's stored baseline were not replaced or modified.

The revisions for email summaries/attachments, direct text extraction versus image OCR, masked-identifier review, rent-only email notifications, rent confirmation versus utility tracking, and prospective testing are present. Rent anniversary timing, final-cycle advance reuse, shared centavo allocation, and no provider-settlement verification remain intact. Most draft prose matches the export after whitespace normalization. The finalized-correction paragraph below is absent.

Paragraph numbering below counts prose within the named subsection, excluding headings, captions and tables. Page numbers refer to the supplied 49-page export. The opening words are the reliable location if pagination changes.

## 1. Required: restore the missing correction paragraph

**Section:** 2.1 Concept of the Study / Architectural Framework explanation. **Location:** page 34, after prose paragraph 12 beginning ?Electricity and water will use,? and before the paragraph beginning ?The Centralized Database will relate.? **Action:** insert this as paragraph 13; do not replace the database paragraph.

Finalized corrections will preserve prior values and processing history. Unpaid rent charges may be corrected after revalidation and recomputation; pending reports must be reviewed against revised amounts. Paid rent bills will retain their original payment and receipt, with corrections recorded as linked revisions showing charge and balance changes. Utility corrections will retain their original source, allocation, and associated personal tracking history and undergo applicable validation and recomputation. External payments or refunds will remain outside automated settlement. Tenants will access current and historical records through the authenticated portal.

This restores the rules for unpaid versus paid rent corrections, pending reports, preserved receipts, linked revisions, utility corrections and external refunds. The general Exception Queue paragraph does not fully replace these protections.

## 2. Required: correct punctuation introduced by draft encoding

| Section / page | Locate | Replace with |
| --- | --- | --- |
| 1.1 Introduction, paragraph 5, page 4 | `?intelligent?` | `"intelligent"` |
| 2.0 Requirements Definition / A. Business Requirements, paragraph 3, page 23 | `Tenant?s` | `Tenant's` |
| 2.1 notification explanation, paragraph beginning ?Web Push will provide external alerts,? page 35 | `Tenant?s` | `Tenant's` |

These characters also occurred in the generated draft files. Both drafts were corrected locally using standard quotation/apostrophe characters. The PDF needs correction in Google Docs followed by a new export.

## 3. Required clarification: name stored portal notifications explicitly

Bills being available in a portal is not itself an explicit description of a stored notification inbox. To document the intended three paths?portal, Web Push and rent email?use the following full paragraphs. These clarifications are already saved in the local chapter drafts.

**Section 1.5 Scope and Limitations, paragraph 6, pages 17?18. Replace the complete paragraph beginning ?Web Push will provide rent and utility billing updates.?**

Portal notifications will retain billing alerts that tenants can view after login. Web Push will provide rent and utility billing updates and eligible reminders. Supplementary email notifications will be limited to rent billing updates, eligible rent reminders, and Manager-confirmed rent payment notices sent to the Tenant's registered email address. Both channels will direct tenants to the authenticated portal; emails will not create another payment or receipt. Reminders will be scheduled at 9 AM Philippine time, three calendar days before the actual due date, for eligible Unpaid rent and utility records Not Marked Paid. Pending rent reports and utilities marked Self-Reported Paid will be excluded; utility reminders will use Web Push only. Bills unavailable before the scheduled reminder time, including rent generated on its due date, will receive billing updates rather than backdated reminders. A missed reminder will not be sent retrospectively. Email sending will require internet connectivity, configured sending credentials, and a running backend. Sending attempts and available channel acceptance or failure results will be recorded, with limited retries and duplicate prevention. Push permission, device support, unavailable email configuration, or delivery failure will not prevent portal access. An alert will not prove payment, inbox delivery, or readership. Tenant SMS and utility email notifications are excluded.

**Section 2.0 Requirements Definition / A. Business Requirements, paragraph 3, pages 22?23. Replace the complete paragraph beginning ?The centralized database shall retain.?**

The centralized database shall retain property, unit, Tenant, mapping, rent, billing, rent-payment, utility-tracking, exception, correction, receipt, and applicable notification records. Rent bills shall use Unpaid, Tenant Reported Paid, and Paid. Tenant reports shall remain unconfirmed until Manager confirmation; the Manager may also record and confirm an actual rent payment without a prior report after external checking. Receipts shall be issued only for confirmed rent payments. Utilities shall use separate Not Marked Paid and Self-Reported Paid tracking labels, with the notice “Provider payment not verified.” Each utility mark shall belong to the reporting Tenant and the corresponding bill or allocated share, without authorizing a system-issued receipt or changing other tenants' marks. Tenants shall access their bills, stored portal notifications, history, rent statuses, personal utility tracking, and confirmed rent receipts through the authenticated portal. Eligible reminders shall be scheduled at 9 AM Philippine time, three calendar days before the actual due date. Routine valid billing records shall proceed automatically, while exceptions shall require Manager intervention. Web Push shall provide permitted rent and utility alerts. Supplementary email notifications shall cover rent billing updates, eligible rent reminders, and Manager-confirmed rent payment notices only. Outgoing rent email shall be separate from utility-email intake. The system shall use the Tenant's registered email address and retain queued events, channel-specific attempts, and available acceptance or failure results. Limited retries and duplicate controls shall prevent repeated sends during normal processing. Sending failure shall not change payment status or prevent portal access. SMS, GSM, and utility email notifications shall not be used.

**Section 2.1 Architectural Framework explanation, paragraph beginning ?Notification records will distinguish,? pages 35?36. Replace the complete paragraph. After restoring the missing correction paragraph, this is prose paragraph 17.**

Portal notifications will retain alerts for tenants to view after login, regardless of external delivery. Notification records will distinguish scheduling, attempts, and available push-service or email-server acceptance and failure results for each channel. One billing event will link to its applicable channel records, with limited retries and duplicate prevention. An accepted message will not prove device delivery, inbox delivery, or readership. Email sending will require internet connectivity, protected sending credentials, and a running backend. Invalid subscriptions, denied permission, unsupported devices, unavailable email configuration, and sending failures will not prevent authenticated access to bills, rent statuses, personal utility tracking, or confirmed rent receipts. Tenant SMS, GSM, and utility email notifications will remain excluded.

**Section 2.3 Mockup Design, paragraph 1, page 41. Replace the complete paragraph beginning ?The mockups present.?**

The mockups present the proposed Admin, Manager, and Tenant interfaces. Admin screens cover the included maintenance functions. Manager screens show property records, billing configuration, utility intake, exceptions, rent payment recording and confirmation, and final-cycle credit application. Tenant screens show assigned bills and history, rent reporting, confirmed rent receipts, personal utility tracking, and stored portal notifications. Web Push and supplementary rent emails direct tenants to the authenticated portal. These designs guide development and do not represent completed or evaluated functions. Their actions and status labels will follow the approved workflow.

## 4. Small heading/table alignment

| Section / page | Current text | Revised text |
| --- | --- | --- |
| 1.2 RRL topic heading, page 8 | Web Push Notifications and Secure Notification Delivery | Web Push, Rent Email Notifications, and Secure Notification Delivery |
| 2.4.2 / Table 2.2, Iteration 3 Development Focus, page 44 | Property-Management Email Intake, Bill Upload, and OCR | Property-Management Email Intake, Bill Upload, Text Extraction, and OCR |
| 2.4.2 / Table 2.2, Iteration 6 Development Focus, page 44 | Rent Payment, Utility Tracking, Digital Receipt, and Web Push Notification | Rent Payment, Utility Tracking, Digital Receipt, and Tenant Notifications |

In Iteration 6 Main Functions, use ?Tenant portal access and stored notifications, Web Push alerts, and supplementary rent email notifications? for the final notification items. The underlying payment, credit and tracking functions remain unchanged. Iteration descriptions already contain the newer email and extraction functions; this aligns their labels.

## 5. Formatting before the next export

- Remove blank page 49.
- Keep the Table 2.1 caption with the first table rows; the caption is on page 30 while the table begins on page 31. Repeat table headers across pages as needed.
- Keep the 2.4.3 heading with its first paragraph; it currently ends page 44 alone.
- Keep Figure 2.3's caption close to its diagram, currently on pages 40?41.
- If the school's template starts chapters on separate pages, add a page break before Chapter II, currently starting after Chapter I text on page 19.

These are layout edits, not reasons to rewrite the workflow. This export ends without a reference section; the separately prepared reference list was not evaluated as embedded PDF content. Reference formatting and bibliography verification remain separate from this body review.

## 6. Diagram alignment ? next step

The embedded images differ from the currently described workflow:

| Figure | Observed mismatch | Required alignment |
| --- | --- | --- |
| 2.1 Architecture, page 26 | Email intake says attachment retrieval only; external alert box is Web Push only; payment-status block does not separate utility tracking | Add email summaries/direct text extraction, optional upload, portal/rent-email notification paths, and separate rent confirmation/receipts from personal utility tracking |
| 2.2 Flowchart, page 39 | Utility and rent paths both continue into advance credit and Manager payment confirmation; no direct Manager rent-recording branch or utility-tracking exit | Separate utility personal tracking before rent-only actions; preserve the direct Manager rent-recording path, final-cycle credit and original-receipt reuse; update extraction and notification labels |
| 2.3 DFD, image page 40 / caption page 41 | No outgoing email-service flow, Manager-upload flow, or Tenant utility-tracking update flow is shown; receipt/payment labels remain generic | Show supported intake sources, rent-only payment/receipt flows, Tenant-owned utility marks, and outgoing rent email plus available service results through the appropriate processes |

Keep the existing overall layouts where practical. The framework has crowded labels and the flowchart decision text is close to some shape boundaries; readability should be checked when exporting the aligned figures. No diagram file was redesigned by this review.

## 7. Wording and repetition assessment

The paper uses conventional formal academic English. No defensible authorship conclusion or AI percentage can be obtained from its wording. Repeated phrasing is an editing issue, not proof of AI generation.

The main style issues are long feature lists, repeated "In the proposed system" / "These studies support" transitions, and recurring disclaimers about payment verification and notification delivery. Repeating a rule in the Scope, Requirements and detailed operation is often useful, but the RRL can spend more space explaining its sources and less space repeating implementation restrictions. Avoid adding a synthesis section or rewriting every paragraph solely to chase detector scores.

**Optional replacement: Section 1.2, ?OCR and Billing Document Extraction,? paragraph 1, page 6.** The following wording is shorter and varies the sentence structure while retaining the three citations and extraction limitations:

Utility-bill processing begins with extracting amounts, dates, billing periods, providers, and account or reference identifiers. Kumar et al. (2020) examine information extraction from bill receipts using Optical Character Recognition (OCR). Saout et al. (2024) describe invoice-data extraction through document digitization, OCR, information extraction, and document-structure recognition, while Mohan (2023) presents an end-to-end pipeline for custom key-value extraction from commercial invoices. In the proposed system, readable email and digital-PDF text is extracted directly, while clear bill images undergo OCR. Extracted information must pass validation before billing processing; records that fail the required checks enter the Exception Queue for Manager review. The OCR engine may use machine-learning-based recognition to convert visible text into machine-readable output, but this does not guarantee accurate values. Defined rules and Manager actions determine billing validity, payment status, charges, and property-management decisions; OCR recognition does not make those decisions independently.

This optional edit is provided here but was not automatically applied to Chapter I. The email literature paragraph remains the accepted Klensin (2008) and Moore and Newman (2018) version; no loan or credit-card studies were added.

## Completed locally

Corrected encoding errors in both chapter drafts, explicitly named stored portal notifications in the relevant paragraphs, and retained the missing finalized-correction paragraph in CHAPTER_II_REVISED.md for reinsertion. No backend changes, PDF replacement, Git commit or push were performed. After these text corrections, align the figures and inspect the next export. This is a proposal-stage content/style review, not adviser approval, independent verification of every original citation, or completed system evaluation.
