# CHAPTER III

**RESULTS AND DISCUSSIONS**

This chapter presents the system’s capabilities, development stages, and recorded testing results. Sections 3.1.1 to 3.1.4 answer the four research questions in Chapter I in the same order. Section 3.2 reports the test environment, procedures, results, identified issues, and recommendations. The discussion uses verified development evidence and distinguishes it from formal participant evaluation, which has not yet been conducted.

## 3.1 Project Capabilities and Testing Process Details

### 3.1.1 Development Stages Undertaken Using the Iterative Software Development Methodology

To answer the first research question, the system was developed through repeated planning, design, development, testing, and review. Related functions were added gradually and checked with the existing functions. The seven development areas below follow the iteration plan in Chapter II.

Development began with the billing scope, user responsibilities, record relationships, authentication, and workspace access. The system includes Admin, Staff, Manager, and Tenant roles. Staff handles permitted daily operations and investigation, while the Manager retains financial authority. Admin maintains accounts and inspects permitted workspace records through a read-only view, without confirming rent, changing operational records or opening private source files. Shared pages use the same records, while server permissions determine the information and actions available to each role. This does not create a second login identity or allow Admin impersonation.

Property and billing configuration connected properties, units, tenant occupancy, rent settings, and verified utility-account mappings. Saved settings determine individual and shared billing arrangements. Configured rent, generated charges, confirmed rent payments, and personal utility marks remain separate records.

Utility intake was added through the designated property mailbox and optional Staff or Manager uploads. Readable email summaries and digital PDFs use direct text extraction, while supported images and scanned PDFs use OCR. The system retains each source and extracts the amount due, due date, billing period, provider, and account or reference identifier. Unsupported, encrypted, unreadable, masked, or conflicting sources require review and a readable supported source when necessary. The system does not recover document passwords or guess hidden account details.

Validation checks required fields, dates, billing periods, account mappings, and duplicates. Staff may investigate an unfinalized source and submit a correction proposal with a reason. A proposal does not change live billing. Before applying an authorized correction, the system checks that the source and billing context are still current and repeats validation in one transaction. Rejected, outdated, or invalid proposals leave the proposed change unapplied. Valid sources proceed automatically without approval of every bill.

Billing computation follows the configured monthly rent anniversary and short-month rule. Shared charges are divided in whole centavos so that the shares equal the source total. Repeated processing is checked to prevent duplicate charges. Only the Manager may authorize final-cycle advance application, which reuses the original confirmed payment and receipt.

Rent reporting, confirmation, receipts, utility tracking, and notifications were then connected to tenant access. A Tenant may report rent payment for Manager confirmation after external checking. The Manager may also record an externally checked payment directly. Only confirmed rent produces a rent receipt. Electricity and water use personal tracking marks that do not verify provider payment. Portal alerts, supplementary rent email, and Web Push use separate channels. The calendar shows actual utility due dates and labelled future rent estimates.

The integrated system was checked through service, HTTP, browser, extraction, persistence, and access-isolation tests. Identified issues were investigated and corrected, then the affected tests were repeated. Section 3.2 presents the recorded results.

### 3.1.2 Integration of the Main System Functions

To answer the second research question, the implemented workflow connects utility-email retrieval or upload to source storage, direct extraction or OCR, validation, classification, allocation, finalization, and Tenant access. An unresolved source enters the review process without silently generating valid charges. Staff investigation and Manager decisions retain reasons and history. Repeated intake and repeated decisions must not create duplicate financial records.

Rent management follows its own reporting and confirmation path. A pending Tenant report is not a confirmed payment. Confirmed rent receipts retain the recorded transaction details. Personal utility tracking remains separate and does not produce utility receipts. Notification processing supports access to these records but does not change payment status or establish delivery to a human reader.

Scheduled processing requires a running backend. Live mailbox retrieval and external notifications also require internet access. Supported local processing can continue when its required files and components are available.

### 3.1.3 Testing Process and Evaluation Basis

Development testing used disposable and synthetic records to check expected behavior and failure handling. Functional checks exercised intake, corrections, computation, reports, receipts, and personal utility tracking. Reliability checks exercised replay, duplicate prevention, restart persistence, and independent job failures. Access-control checks exercised role and workspace restrictions through both interface actions and direct requests. Browser checks exercised desktop and phone-sized layouts.

The third research question concerns the five selected ISO/IEC 25010:2023 characteristics in Chapters I and II: Functional Suitability, Performance Efficiency, Interaction Capability, Reliability, and Security. Requirement tests, measured processing observations, browser tasks, recovery checks, and access-control checks provide development-level evidence. No participant ratings or overall ISO quality score are reported because the adviser-reviewed user evaluation has not yet been conducted.

Functional Suitability is supported by checks of intake, validation, allocation, correction handling, rent confirmation, receipt access, and personal utility tracking. The existing document catalog was also checked against its recorded field expectations. These results describe the exercised cases and support consistency checking; they do not establish extraction accuracy for a representative collection of provider bills.

Performance Efficiency was examined through local API response measurements and observed extraction times under the environment described in Section 3.2.1. Request timing included reading the complete response body, and sampled Node process memory was recorded. Section 3.2.3 states the small dataset and measurement limits. These observations do not establish production capacity, phone response time, or the number of concurrent users the system can support.

Interaction Capability was checked through automated browser tasks and phone-sized layouts. The interface now uses a shared Staff and Manager Case Sheet, clearer next actions, protected original-bill previews, and a rent-first Tenant home. Actual-device tasks and participant feedback remain pending.

Reliability checks covered duplicate prevention, repeated intake, retained records after restart, rollback of invalid corrections, and continued processing when an independent job failed. These tests cover the recorded scenarios rather than long-term availability.

Security checks covered selected authentication, role restrictions, record access, and workspace separation. A complete penetration test and legal compliance audit were outside these development checks.

### 3.1.4 Implementation Guide and User Manual

To answer the fourth research question, setup instructions, demonstration procedures, sample bill files, a manual test guide, and a user manual have been prepared. They explain account access, property and billing setup, utility intake, correction handling, rent confirmation, personal utility tracking, and receipt access. The guides cover the shared Case Sheet, recovery controls, and a three-person Staff, Manager, and Tenant walkthrough. Local HTTPS instructions support the controlled demonstration. Preparing these guides does not establish that users have completed the tasks successfully.

## 3.2 Project Testing Results

### 3.2.1 Test Environment

The current development verification was conducted on 28 October 2026 using an Acer TravelMate P215-53 laptop with an Intel Core i5-1135G7 processor at 2.40 GHz, four physical cores, eight logical processors, and approximately 7.78 GiB of system-reported physical memory. The operating system was Windows 11 Pro, 64-bit, version 10.0.26200, build 26200. These specifications describe the current run and are not assumed to describe earlier test runs.

The software environment used Node.js 24.21.0, SQLite 3.53.4, and the existing HTML, CSS, and JavaScript frontend. Automated browser tasks used Playwright 1.64.0 with headless Microsoft Edge 156.0.4314.50. Extraction used PDF.js 6.2.108 and Tesseract.js 6.0.1. The installed communication packages were MailParser 3.9.38, ImapFlow 1.7.8, Nodemailer 10.1.0, and web-push 3.6.7. Installed versions, source hashes, fixture hashes, individual observations, and procedures are retained in the dated development-evidence file.

The full suite ran one test file at a time. Measurements were collected separately after other automated test jobs finished, and the suite was then rerun after correcting a date-dependent test expectation. Scheduled production processing and external mail or Push delivery were not enabled for the measurements. Normal operating-system background activity was not fully controlled.

The automated runs used disposable portfolios, synthetic test data, and the existing anonymized document fixture where applicable. Mailbox transport was simulated in the relevant automated cases, while supported parsing and OCR were exercised through the actual libraries. The separate fixture comparison contained five bill cases represented by nine files: four synthetic cases and one anonymized actual-layout Meralco case. The earlier controlled Gmail test used a self-addressed synthetic bill and its configured demonstration label. No participant payments or representative field dataset were used.

### 3.2.2 Test Scope

Testing covered utility intake, extraction, account mapping, equal allocation, portal alerts, exception investigation, Staff proposals, Manager decisions, and duplicate prevention. It also covered rent reporting and confirmation, receipt reuse, personal utility tracking, retained records after restart, workspace separation, and responsive browser layouts. Some tests deliberately caused an automatic job to fail to check whether other jobs could continue.

Physical Android access, hotspot behavior, certificate trust, push permission and receipt, live rent-email receipt, representative provider extraction accuracy, and formal user evaluation were not established by the automated run. Security testing covered selected authorization and isolation rules rather than a comprehensive penetration test.

### 3.2.3 Executed Test Cases and Recorded Results

The complete automated run on 28 October 2026 executed 99 tests, with 99 passes and no failures, cancellations, or skips. It took approximately 327 seconds, giving a pass rate of 100 percent for the executed tests. These are development regression results rather than a measure of overall system completion, representative OCR accuracy, or participant acceptance. The dated log is retained with the development evidence.

On 1 November 2026, we completed an additional development security check after adding the Admin read-only workspace view. The final full run passed all 144 tests, with no failures, cancellations, or skips, in about 712 seconds. We checked harmful text in displayed values, quoted input fields, application links, and generated receipts. We also checked that a failed audit write returned no record data, and that parallel requests from two Managers did not duplicate a receipt or apply a correction twice. Four selected tests passed in unchanged source copies and failed when deliberate control bypasses were added to those copies. The working source files were unchanged by these negative checks. These results are separate from the 28 October measurements below. They cover selected development scenarios on one backend, not complete security, distributed operation, actual phone delivery, or participant evaluation. The harmful-input case used controlled OCR output and does not measure OCR accuracy.

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

Local response measurements used the authenticated reports-summary endpoint and a disposable file-backed SQLite database containing 4 properties, 4 units, 3 tenants, and 30 bills, with no payments or receipts. After five warm-up requests excluded from the measurements, 50 requests were sent sequentially. A second group used five concurrent request loops, each sending ten requests to the already warmed server. Timing started before each request and ended after the complete response body was read. The 95th percentile used the nearest-rank method.

For the sequential group, the mean response time was 5.23 milliseconds, the median was 4.67 milliseconds, and the 95th percentile was 8.50 milliseconds. For the five-loop group, the corresponding values were 23.29, 23.19, and 32.78 milliseconds. All 100 measured requests returned successful HTTP responses with readable JSON. The maximum sampled memory reading across both groups was approximately 181.90 MiB for the Node evidence process and its in-process server. Memory was sampled every 25 milliseconds and at the start and end of each group; short peaks could have been missed. These results exclude browser and operating-system memory, network travel to a phone, real user interaction, and production-sized data. No performance acceptance threshold or five-user capacity claim is inferred.

The document comparison checked provider, account reference, amount due, due date, billing-period start, and billing-period end. These are six stored values representing the five target field types because the billing period has two boundaries. Six direct-text representations, consisting of four digital PDFs and two email files, matched all 36 expected values. Three OCR representations, consisting of two scanned PDFs and one PNG, matched all 18 expected values. Thus, all 54 compared values matched the fixture records in this pass. File versions of the same bill were not counted as independent samples. The fixture expectations are development references, not an independently collected and manually verified evaluation set.

Observed extraction times ranged from 3.10 milliseconds to 1.74 seconds for direct PDF text extraction and from 0.34 to 15.69 seconds for image or scanned-PDF OCR in this single sequential pass. The first PDF and OCR operations included loading costs, and later OCR inputs reused a worker. Email handling used a different boundary that also included parsing and source processing, so its times were not combined with standalone PDF extraction. These observations explain why scanned documents can require more processing than readable text; they do not establish typical bill-processing time or representative OCR accuracy. Field extraction success also does not establish valid account mapping or billing finalization.

A separate controlled Gmail test on 23 October 2026 used a self-addressed synthetic scanned bill. The message entered the configured demonstration label and was retrieved by the scheduler. OCR and validation produced two charges of PHP 450.00 from a PHP 900.00 source, due on 29 October 2026. Both assigned Tenant accounts could access their bill and linked portal alert. Repeated synchronization did not create another charge. This result covers one controlled email-intake path. Rent-email sending and Web Push delivery were disabled during that test.

### 3.2.4 Defects and Issues

The QA records identify an intermittent profile-field reset during a browser task. A delayed response reproduced the issue: the same page rendered again while it was still loading. The application was corrected to reuse the ongoing render for the same account, role, and URL. The targeted regression test and the subsequent full test run passed.

Other application corrections addressed an empty category label on unmapped sources, currency formatting in proposal summaries, and narrow-screen wrapping. Separately, test scripts were updated after the demo-login shortcuts were removed. These script updates were adjustments to the tests rather than additional application defects.

An initial run on 28 October 2026 passed 98 of 99 tests. The remaining browser test assumed that a utility alert would use the current month, although its generated due date had crossed into the following month. The application displayed the due month correctly. The test expectation was corrected to use the fixture’s due month, and an assertion was added for the billing cycle. The targeted journey and the subsequent complete 99-test run passed. This was a test-script correction, not a change to billing behavior. An older timing-record date was also replaced with a current timestamp; its header-only timing was not used for the complete-response measurements reported here.

During the additional account-response check, we found that the older response helper removed the password hash but returned other stored fields without an explicit list. A private synthetic test value appeared in the account listing. We changed the helper to return only the supported public account details and notification preferences, and the relevant checks passed. This finding does not establish that actual credentials were exposed. Account creation, password resets, role permissions, and stored records were preserved. The security checks also clarified a test that previously assumed every list response was an array; it now checks for either a safe denial or records from the correct workspace.

These role restrictions apply to requests made through the active account. A trusted Admin who can create accounts or reset passwords could use another account, and a person controlling the server files or backups is outside this application-role boundary. Password resets revoke sessions and are audited; later actions are recorded under the account used. Our selected tests do not establish protection from every action by a trusted server operator.

The remaining evaluation gaps are actual-device acceptance, intended-recipient notification delivery, supported provider-email testing, representative extraction measurements, and the adviser-approved user evaluation. The interface redesign is implemented. Encrypted or insufficient sources remain processing limitations that require review and an available supported copy; their presence must not be silently treated as a valid bill.

### 3.2.5 Recommendations and Further Testing

The implemented interface should be checked through the prepared Staff, Manager, and Tenant walkthrough. Actual Android testing should check source review, rent reporting, receipt viewing, personal utility tracking, navigation, long content, keyboard behavior, retry controls, and scroll stability using the trusted HTTPS address. Further refinements should preserve billing calculations and role permissions.

Further testing should verify authorized live rent-email delivery and Web Push on supported devices. Extraction accuracy should be measured using consented, anonymized provider documents and manually checked field values, with direct text extraction and OCR reported separately. Future evaluation should record the hardware, software versions, sample counts, procedure, and failures. Participant selection, questionnaire scoring, and user tasks should follow the adviser-approved evaluation plan.

### 3.2.6 Overall Assessment and Next Steps

The recorded development results support a controlled demonstration of the included workflow. They cover automated regression checks, the known-fixture comparison, bounded local response measurements, and the earlier controlled Gmail-to-Tenant intake path. They do not complete the formal evaluation planned in Chapter II. The system can proceed to the prepared user walkthrough and adviser-reviewed evaluation, with actual-device, provider-format, delivery, and representative extraction results recorded before a final release or study-wide quality conclusion.