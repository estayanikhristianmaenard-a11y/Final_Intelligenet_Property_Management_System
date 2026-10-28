# CHAPTER III

**RESULTS AND DISCUSSIONS**

This chapter presents the system’s capabilities, development stages, and testing results. The discussion follows the research questions in Chapter I and the iterative development process in Chapter II. The results cover the recorded development tests and the controlled email-intake test. Formal user evaluation remains pending.

## 3.1 Project Capabilities and Testing Process Details

### 3.1.1 Development Stages Undertaken Using the Iterative Software Development Methodology

The system was developed through repeated planning, design, development, testing, and review. Related functions were added gradually and checked with the existing functions. The seven development areas follow the iteration plan in Chapter II.

Development began with the billing scope, user responsibilities, record relationships, authentication, and workspace access. The system includes Admin, Staff, Manager, and Tenant roles. Staff handles permitted daily operations and investigation, while the Manager retains financial authority. Admin maintains accounts without confirming rent or acting as another user.

Property and billing configuration connected properties, units, tenant occupancy, rent settings, and verified utility-account mappings. Saved settings determine individual and shared billing arrangements. Configured rent, generated charges, confirmed rent payments, and personal utility marks remain separate records.

Utility intake was added through the designated property mailbox and optional Staff or Manager uploads. Readable email summaries and digital PDFs use direct text extraction, while supported images and scanned PDFs use OCR. The system retains each source and extracts the amount due, due date, billing period, provider, and account or reference identifier. Unsupported, encrypted, unreadable, masked, or conflicting sources require review and a readable supported source when necessary. The system does not recover document passwords or guess hidden account details.

Validation checks required fields, dates, billing periods, account mappings, and duplicates. Staff may investigate an unfinalized source and submit a correction proposal with a reason. A proposal does not change live billing. Before applying an authorized correction, the system checks that the source and billing context are still current and repeats validation in one transaction. Rejected, outdated, or invalid proposals leave the proposed change unapplied. Valid sources proceed automatically without approval of every bill.

Billing computation follows the configured monthly rent anniversary and short-month rule. Shared charges are divided in whole centavos so that the shares equal the source total. Repeated processing is checked to prevent duplicate charges. Only the Manager may authorize final-cycle advance application, which reuses the original confirmed payment and receipt.

Rent reporting, confirmation, receipts, utility tracking, and notifications were then connected to tenant access. A Tenant may report rent payment for Manager confirmation after external checking. The Manager may also record an externally checked payment directly. Only confirmed rent produces a rent receipt. Electricity and water use personal tracking marks that do not verify provider payment. Portal alerts, supplementary rent email, and Web Push use separate channels. The calendar shows actual utility due dates and labelled future rent estimates.

The integrated system was checked through service, HTTP, browser, extraction, persistence, and access-isolation tests. Identified issues were investigated and corrected, then the affected tests were repeated. Section 3.2 presents the recorded results.

### 3.1.2 Integration of the Main System Functions

The implemented workflow connects utility-email retrieval or upload to source storage, direct extraction or OCR, validation, classification, allocation, finalization, and Tenant access. An unresolved source enters the review process without silently generating valid charges. Staff investigation and Manager decisions retain reasons and history. Repeated intake and repeated decisions must not create duplicate financial records.

Rent management follows its own reporting and confirmation path. A pending Tenant report is not a confirmed payment. Confirmed rent receipts retain the recorded transaction details. Personal utility tracking remains separate and does not produce utility receipts. Notification processing supports access to these records but does not change payment status or establish delivery to a human reader.

Scheduled processing requires a running backend. Live mailbox retrieval and external notifications also require internet access. Supported local processing can continue when its required files and components are available.

### 3.1.3 Testing Process and Evaluation Basis

Development testing used disposable and synthetic records to check expected behavior and failure handling. Functional checks exercised intake, corrections, computation, reports, receipts, and personal utility tracking. Reliability checks exercised replay, duplicate prevention, restart persistence, and independent job failures. Access-control checks exercised role and workspace restrictions through both interface actions and direct requests. Browser checks exercised desktop and phone-sized layouts.

The evaluation follows the five selected ISO/IEC 25010:2023 characteristics in Chapters I and II: Functional Suitability, Performance Efficiency, Interaction Capability, Reliability, and Security. Development tests provide preliminary evidence, while formal evaluation remains pending.

Functional Suitability is supported by recorded checks of intake, validation, allocation, correction handling, rent confirmation, receipt access, and personal utility tracking. These results apply to the exercised cases. Representative extraction accuracy still requires a declared sample set and manually checked reference values.

Performance Efficiency still requires controlled measurements of response time, resource use, and concurrent access. The suite duration in Section 3.2.3 is the time taken to execute the tests, rather than the time taken to process one bill.

Interaction Capability was checked through automated browser tasks and phone-sized layouts. The interface now uses a shared Staff and Manager Case Sheet, clearer next actions, protected original-bill previews, and a rent-first Tenant home. Actual-device tasks and participant feedback remain pending.

Reliability checks covered duplicate prevention, repeated intake, retained records after restart, rollback of invalid corrections, and continued processing when an independent job failed. These tests cover the recorded scenarios rather than long-term availability.

Security checks covered selected authentication, role restrictions, record access, and workspace separation. A complete penetration test and legal compliance audit were outside these development checks.

### 3.1.4 Implementation Guide and User Manual

Setup instructions, demonstration procedures, sample bill files, a manual test guide, and a user manual have been prepared. These explain account access, property and billing setup, utility intake, correction handling, rent confirmation, personal utility tracking, and receipt access. The guides have been updated for the shared Case Sheet and include a three-person walkthrough. Local HTTPS instructions support the controlled demonstration. Actual-device and provider-email results must still be recorded.

## 3.2 Project Testing Results

### 3.2.1 Test Environment

The development tests used a Node.js backend, SQLite storage, and an HTML, CSS, and JavaScript frontend. The project configuration requires Node.js 24 or later. The extraction and communication tools include Tesseract.js, PDF.js, MailParser, ImapFlow, Nodemailer, and web-push. Browser tests use Playwright, and the development records include Windows PowerShell commands. The retained test records do not include the exact CPU, RAM, operating-system build, browser build, or installed dependency versions for the reported run. This limits reproduction of the same test environment.

The full automated run used local disposable portfolios and synthetic documents. Mailbox transport was simulated within relevant automated cases, while actual supported document parsing and OCR were exercised. The separate live Gmail test used a controlled self-addressed synthetic bill and the configured demonstration label. No actual participant payments or representative field dataset were used in these checks.

### 3.2.2 Test Scope

Testing covered utility intake, extraction, account mapping, equal allocation, portal alerts, exception investigation, Staff proposals, Manager decisions, and duplicate prevention. It also covered rent reporting and confirmation, receipt reuse, personal utility tracking, retained records after restart, workspace separation, and responsive browser layouts. Some tests deliberately caused an automatic job to fail to check whether other jobs could continue.

Physical Android access, hotspot behavior, certificate trust, push permission and receipt, live rent-email receipt, representative provider extraction accuracy, and formal user evaluation were not established by the automated run. Security testing covered selected authorization and isolation rules rather than a comprehensive penetration test.

### 3.2.3 Executed Test Cases and Recorded Results

The retained automated test log dated 23 October 2026 records 99 tests, with 99 passes and no failures, cancellations, skips, or pending tests. The run took approximately 328 seconds. Its pass rate was 100 percent for the executed tests. This result does not measure OCR accuracy, overall system completion, or participant acceptance.

**Table 3.1: Summary of Recorded Automated Development Tests**

| Test area | Executed scenarios | Recorded result |
| --- | --- | --- |
| Utility intake | Scheduled simulated-mailbox retrieval, actual supported parsing/OCR, verified mapping, equal allocation, and linked portal alerts | Passed in the recorded full suite |
| Exception handling | Staff investigation and proposal, Manager rejection with reason, revision, authorization, stale-context checks, and invalid-change rollback | Passed in the recorded full suite |
| Duplicate prevention | Repeated mailbox identifiers, uploads, and equivalent source copies | Passed; no additional charge in the tested cases |
| Rent and receipts | Tenant report, rejection and resubmission, Manager confirmation, authenticated receipt access, and repeated-confirmation reuse | Passed in the recorded full suite |
| Personal utility tracking | Tenant-owned marks and separation from provider settlement and rent receipts | Passed in the recorded full suite |
| Persistence and access | Application/database close and reopen, retained sources and records, old-message replay, role restrictions, and workspace separation | Passed in the recorded full suite |
| Interface regression | Recorded role journeys, phone-sized layouts, and page-error checks | Passed in the recorded full suite; actual-device acceptance remains separate |

Table 3.1 groups the scenarios covered by the recorded run. The categories describe test coverage and are not additional tests beyond the reported total of 99.

A separate controlled Gmail test on 23 October 2026 used a self-addressed synthetic scanned bill. The message entered the configured demonstration label and was retrieved by the scheduler. OCR and validation produced two charges of PHP 450.00 from a PHP 900.00 source, due on 29 October 2026. Both assigned Tenant accounts could access their bill and linked portal alert. Repeated synchronization did not create another charge. This result covers one controlled email-intake path. Rent-email sending and Web Push delivery were disabled during that test.

### 3.2.4 Defects and Issues

The QA records identify an intermittent profile-field reset during a browser task. A delayed response reproduced the issue: the same page rendered again while it was still loading. The application was corrected to reuse the ongoing render for the same account, role, and URL. The targeted regression test and the subsequent full test run passed.

Other application corrections addressed an empty category label on unmapped sources, currency formatting in proposal summaries, and narrow-screen wrapping. Separately, test scripts were updated after the demo-login shortcuts were removed. These script updates were adjustments to the tests rather than additional application defects.

Remaining work includes actual-device acceptance, confirmation of notification delivery to the intended recipients, Web Push checks, and formal user evaluation. The interface redesign is implemented, with further changes to be guided by observed user difficulties. Encrypted or insufficient bill sources remain processing limitations that require review and an available supported source.

### 3.2.5 Recommendations and Further Testing

The implemented interface should be checked through the prepared Staff, Manager, and Tenant walkthrough. Actual Android testing should check source review, rent reporting, receipt viewing, personal utility tracking, navigation, long content, keyboard behavior, retry controls, and scroll stability using the trusted HTTPS address. Further refinements should preserve billing calculations and role permissions.

Further testing should verify authorized live rent-email delivery and Web Push on supported devices. Extraction accuracy should be measured using consented, anonymized provider documents and manually checked field values, with direct text extraction and OCR reported separately. Future evaluation should record the hardware, software versions, sample counts, procedure, and failures. Participant selection, questionnaire scoring, and user tasks should follow the adviser-approved evaluation plan.

### 3.2.6 Overall Assessment and Next Steps

The recorded results show that the system passed the included development tests and completed one controlled Gmail-to-Tenant intake test. The shared interface and recovery controls have also been implemented. These results support a controlled demonstration under the documented setup. Actual-device checks, intended-recipient notification delivery, representative extraction testing, and formal user evaluation remain necessary before an overall release assessment.