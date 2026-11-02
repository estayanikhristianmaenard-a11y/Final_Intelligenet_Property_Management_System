# Rentara: Group Reviewer and Final Testing Guide

Prepared 2 November 2026. This is our study and demonstration guide, not a new manuscript chapter or a completed evaluation report. The companion Word file can be uploaded to Google Docs. Use the Excel workbook to record what actually happens during testing.

## 1. What our project is about

Our research title is Intelligent Property Management Workflow with OCR-Enabled Automated Billing Classification and Tenant Notification. Rentara is the name of our application. We focus on billing for selected boarding houses and residential apartments in Pasig City, covering rent, electricity and water.

Our system receives supported utility emails or uploaded bills, reads available text or uses OCR, checks the extracted details, identifies the billing arrangement and calculates permitted charges. It places unresolved records under review instead of silently publishing uncertain charges. Tenants can view their own records, report rent payments and maintain their personal utility tracking.

When asked why the system is called intelligent, we should explain that it combines OCR-assisted text recognition with defined billing rules. We did not train a model. The OCR engine recognizes text; our application rules and authorized users handle validation and financial decisions. We should not describe this as an AI that independently decides whether a provider was paid.

## 2. How Chapters I-IV connect

### Chapter I: The Problem and Its Background

Chapter I explains the billing and record-handling problem, the related literature, the significance of the study, our research questions, and the scope and limitations. The literature supports our chosen approach; it does not prove that our own system has already improved payment compliance or user satisfaction. We should explain the need for organized billing records without inventing interview findings or measured business benefits.

Our first SOP asks what development stages we used under the Iterative Software Development Methodology. The second asks how OCR, rules, exceptions, payment management, receipts and notifications work together. The third asks how the system performs under Functional Suitability, Performance Efficiency, Interaction Capability, Reliability and Security from ISO/IEC 25010:2023. The fourth asks what implementation guide and user manual we prepared.

Our included billing types are rent, electricity and water. Payment gateways, bank verification, SMS, provider-app access, prediction of utility bills, model training and maintenance tickets are outside our scope. Workspaces, backups and local HTTPS support the workflow; they are not additional research objectives or proof of public deployment.

### Chapter II: Methodology

Chapter II explains our requirements, architecture, conceptual operation, diagrams, mockup design, iterative development plan and testing/evaluation procedures. Iterative development means we planned, designed, built, checked and reviewed related functions repeatedly. It does not mean that every feature was built correctly in one attempt.

The architecture shows the system components and how they are connected. The process flowchart explains the steps and decisions in billing, correction handling, rent and utility tracking. The DFD shows information moving among users, processes and the centralized database. The repeated D1 symbols in the DFD refer to the same logical database, not separate databases for each symbol.

Our implementation uses Node.js for the backend, SQLite for persistent records, and HTML, CSS and JavaScript for the interface. A browser calls protected API endpoints; the backend checks the account's role and workspace before reading or changing records. Pages share components and records, but each role receives only permitted information and actions. Shared code can still cause cross-role regressions, so shared pages do not guarantee that a bug affects only one role.

### Chapter III: Results and Discussions

Section 3.1 discusses the development stages, integrated functions, evaluation basis and user guides in the same order as our four SOPs. Section 3.2 records the environment, scope, executed tests, defects, recommendations and readiness limits. Our manual workbook links each case to the relevant sections so we can check whether the paper matches the application.

The full automated run recorded on 1 November 2026 passed 144 tests. The earlier 28 October run passed 99 tests after a date-dependent test expectation was corrected. These are separate dated checkpoints, not 243 different tests or a percentage of total project completion. Four separate isolated checks confirmed that selected tests detected deliberately introduced control bypasses; those checks are not additional participant responses.

The 28 October fixture comparison matched 36 of 36 expected direct-extraction values and 18 of 18 OCR values across the stated test representations. That is known-fixture consistency, not representative provider accuracy: copies, scans and edited versions of one case are not independent real bills. The local response measurements describe the recorded laptop, dataset and loopback requests, not public hosting capacity or phone performance.

Actual Android behavior, fresh supported provider-email intake, actual notification receipt, representative extraction accuracy and formal participant evaluation still need their own recorded evidence. Our group walkthrough can identify defects and confusion, but it must not be presented as an adviser-approved participant survey unless that procedure has actually been agreed and conducted.

### Chapter IV: Conclusions and Recommendations

Chapter IV uses the supplied Conclusions and Recommendations outline. Section 4.1 has four conclusion paragraphs answering the four SOPs in order. Section 4.2 gives practical recommendations and identifies development findings and technical limitations as their basis. We did not copy the sample SARIMA project, its scores or its cloud-migration suggestions into our study.

Our Chapter IV is currently a development-based draft. We can explain what we implemented and checked, but we cannot claim completed user acceptance or an overall ISO quality rating. After actual testing and formal evaluation, we must update the affected Chapter III findings and Chapter IV conclusions together.

## 3. Each user and their responsibility

### Administrator

Admin manages login accounts, roles, workspace assignments and permitted system-maintenance tasks. Admin can inspect approved properties, units, Tenant profile/contact information, bills, allocations, rent status and system-generated rent receipts across workspaces through a read-only view. That view excludes private uploaded documents, original utility sources, raw extraction, full utility references and authentication secrets.

Admin cannot use inspection to change occupancy or charges, confirm rent, prepare or authorize corrections, or change a Tenant's utility mark. Admin is not automatically logged in as a Manager. If asked why the higher role cannot confirm rent, explain that oversight and account management are separate from the Manager's financial responsibility. A trusted Admin who controls passwords or the server remains outside the protection offered by a restricted active Admin token; account/reset actions are audited, and later actions identify the account used.

### Manager

Manager handles the assigned business workspace, including properties, units, occupancy, verified utility mappings, rent settings, billing arrangements and financial decisions. Manager reviews Staff proposals, authorizes or rejects them, may correct sources directly with reasons and history, and confirms externally checked rent payments. Manager can also perform operational work when Staff is unavailable.

Staff reduces routine investigation and preparation, but does not remove all Manager work. Manager still handles financial authority and exceptions that require a decision. Only the Manager's own workspace is accessible; having a higher role within one business does not grant access to another business. The Manager does not verify Meralco or Manila Water settlement through this system.

### Staff

Staff handles utility intake, source review, investigation, notes, escalations and correction proposals in the assigned workspace. Staff may edit permitted descriptive details on existing records, such as a property address, unit label or Tenant phone number. Staff cannot create billing-linked occupancy, change rent or mappings, confirm rent, apply advance credit or authorize a proposal.

An unresolved utility source can have one pending correction proposal. Staff provides readable evidence and a reason; the proposal does not immediately alter live billing. A valid bill already passing the rules continues automatically without routine Staff or Manager approval.

### Tenant

Tenant sees only their own permitted bills, history, rent statuses, confirmed rent receipts, alerts and account settings. Tenant can report rent paid, but the report is pending until the Manager checks and confirms it. Tenant can also mark a utility personally paid for their own tracking; that mark is not a provider-verified payment and creates no utility receipt.

In a shared unit, each occupant has a separate Tenant record and login. A mark by one occupant must not mark another occupant's share paid. Tenants arrange who pays the full provider bill outside the system; our allocation is not a contribution-collection service.

## 4. What each function is for

### Sign-in and shared navigation

We use one email/password sign-in form. The server identifies the account's role; users do not select an Admin, Manager or Tenant role through three login buttons. Shared navigation and reusable pages reduce duplication. Backend permission checks still apply even if someone tries a route directly rather than using the visible buttons.

### Profiles, workspaces, properties and units

A startup profile selects a dataset and delivery policy. Group 3 demo uses its prepared local database and port 8444; Operational uses separately prepared data and settings. A workspace separates one management business from another inside a profile. A workspace may contain several properties at different locations; separate buildings do not automatically require separate workspaces.

Properties group units, and units identify occupancy and individual/shared arrangements. Verified provider/account mappings connect a utility bill to the correct unit. Email subject, sender display name or a similar-looking masked CAN alone must not determine the Tenant. We do not invent missing account digits to force a match.

### Email parsing, direct extraction and OCR

ImapFlow retrieves eligible messages from the configured Gmail label. MailParser reads message headers, body and attachments. Readable email summaries and digital PDF text use direct extraction; PDF.js reads PDF text and supports scanned-PDF rendering, while Tesseract.js recognizes text from supported clear images. These tools do different jobs: email parsing opens the message structure, and OCR reads visible text from images.

Supported bill attachments take priority when present. A recognized readable summary can be processed when there is no supported bill attachment. A supported PDF that cannot be read, including an encrypted attachment, is not automatically solved by copying a password or assuming a fallback. Unresolved sources remain for review; no password guessing, provider-app access or masked-CAN guessing is part of our workflow. A text-only email demonstration does not demonstrate OCR.

### Validation, classification and allocation

Validation checks required values, provider/account mapping, period consistency and duplicates. Classification identifies the supported bill category and saved arrangement. Individual charges go to the mapped eligible Tenant. Shared amounts are split equally in whole centavos, with a consistent remainder distribution so the shares add up to the source total.

For example, PHP 1,000.01 shared by two eligible Tenants produces PHP 500.01 and PHP 500.00, not two rounded PHP 500.01 charges. The record order determines which share receives the remaining centavo; do not claim a particular member gets it without checking the actual result. Allocation does not prove anyone has paid.

### Review and correction

The Case Sheet lets permitted Staff and Managers compare extracted values with the original source. Staff submits a proposal. Manager authorizes or rejects it, and a rejection needs a reason. Authorization checks the current source, relevant mappings and billing context, and the preparer's current access before applying all fields and revalidating in one transaction.

The stored proposal states are pending, applied, rejected, stale and returned. The screen may describe pending as With Manager and stale as Needs recheck. Applied means the correction passed revalidation, not that a provider received payment. Changed context can make a proposal stale; failed revalidation returns it without publishing the proposed billing change. Manager direct correction uses the existing safeguards rather than requiring another Manager signature.

### Rent and advance

Monthly rent follows the configured anniversary day, with the last day used for a short month. It is fixed and non-prorated. The first cycle includes rent and one-month advance separately. The backend can recover missed eligible cycles without creating the same obligation twice.

A Tenant report is not a bank transfer or automatic bank check. Manager checks the agreed external evidence and confirms or rejects the report; Manager may also directly record an externally checked test payment. Only confirmed rent creates the corresponding receipt. Reopening or retrying confirmation must not create another payment effect.

Confirmed advance is reserved for the final eligible rent cycle. It is applied only through the Manager's explicit action when the required conditions are met, reusing the original confirmed transaction and receipt. It is not flexible mid-tenancy credit, another cash payment or a replacement advance charged automatically. Test this only on a dedicated eligible fixture, not by changing a groupmate's current lease just to make the button work.

### History, calendar, reports and messages

History retains billing, correction, payment and receipt information so users can review how a record reached its current state. The calendar uses validated received utility dates and clearly labelled future rent estimates; an estimate does not create a bill. Manager reports and CSV export summarize authorized recorded information, not predicted income or verified utility collections. Manual portal billing messages support the included billing workflow and are not a general chat or utility-email service.

### Portal alerts, email, Push and reminders

Portal alerts are saved inside the application. Nodemailer submits permitted rent email, while the web-push library uses VAPID configuration and browser subscriptions for permitted Push. Portal and Web Push support rent and utilities; supplementary email supports rent updates, eligible reminders and confirmed rent notices only. Neither sending-server acceptance nor a stored alert proves that a person received or read it.

Eligible reminders follow 9 AM Philippine time, three calendar days before the actual due date. Pending rent reports and currently self-marked utility records are excluded. A bill created after the reminder time does not receive a backdated reminder. Do not change the laptop clock to manufacture a manual pass; use a properly scheduled fixture or mark the manual check Blocked while retaining separate automated evidence.

### Status, audit and recovery

System status reports the backend's defined database and service/configuration checks; it is not an ISO quality score. A missing mailbox credential or unconfigured transport is not automatically an application crash. Audit records identify permitted account and record actions but are not an independently immutable or cryptographically signed ledger. Backups support recovery; a database-only snapshot is not a complete file backup if original source documents are also required.

## 5. Our actual testing setup

Use the existing Group 3 profile on the main laptop. From SeCapstone/rentara-portal run npm.cmd run demo:group. Keep the terminal open and laptop awake. Do not run setup commands to reset the portfolio. Phones connect to the reachable laptop LAN HTTPS address printed by startup, using port 8444, not localhost and not the older acceptance port 8443.

Group 3 Demonstration and Bayan Demo Rentals are two workspaces in this same demo database. Each has one property, two units and three Tenants at the prepared checkpoint; counts can change after tests. Bayan uses fictional accounts and stays local-only even during the original Group 3 live-delivery session. Use the account list in the workbook; passwords are shared privately and must not be written into the workbook or screenshots.

Use separate browser profiles/private sessions, or sign out before changing accounts. If devices cannot connect, check that Node is still running, the IP/port is current, the network allows device-to-device access and the local certificate is trusted. A certificate expiry date or a prepared HTTPS configuration does not itself start the server. Local extraction requires available files/components; Gmail and external delivery also require internet.

For the agreed live exercise, stop the normal server and run npm.cmd run demo:group -- --receive --live-delivery. Receiving uses Rentara-Group3-Demo. The existing Gmail filter must apply that label to the received test message; verify it rather than manually labelling and calling the filter passed. The live mode permits fresh events only for approved Group 3 recipients, and old queues are not replayed. Refresh device registration after startup and check both Manager delivery settings and Tenant preferences. Stop/restart without the live flag to return to blocked external demo sending.

## 6. How the three of us should test

In round one, one member acts as Staff, another as Manager and the third as Tenant. Follow the prepared steps, then rotate roles in later rounds. Use a new valid case or a still-unused transaction for each irreversible decision. Do not reset the working database or resend a successful source while expecting it to create a new bill; that is a duplicate test.

First, run the workbook's Core cases with the assets labelled A01-A07. Demonstrate a valid bill, duplicate prevention, Staff preparation, Manager decision, Tenant visibility and personal tracking, rent reporting and receipt access, workspace separation and Admin inspection. The separate Extended cases cover setup-dependent advance, scheduler, recovery and direct-request checks. A missing prerequisite means Blocked, not Passed and not automatically Failed.

Our workbook records each behavior rather than every mouse click. Leave Actual result, Tester, Device/browser, Date and Evidence blank until a person performs the task. Status begins as Not Started. Passed means the observed result matches the expected result; Failed means it does not; Blocked means the required setup, eligible record, service or timing is unavailable. Record the blocker clearly.

Feedback and Suggested improvement are separate fields on every case. A correct function can still have confusing wording or difficult navigation. Record the task, what was confusing and the proposed improvement without immediately expanding scope. A screen recording is optional for a full journey or a hard-to-explain bug; screenshots of important outcomes and every error are normally enough. Use evidence names such as TC-012_round1_android_2026-11-02.png in your private/shared evidence location.

Link each defect to its test ID in Issues & Retests. Keep the original failure, the correction and the retest result; do not replace the failure with a pass and lose the history. Later role-rotation runs also go there as new runs. The workbook summary is a count of recorded manual statuses, not a percentage of system completion. Our three-person group walkthrough is not automatically formal participant evaluation.

## 7. Using the fresh test assets

The assets beside the workbook are synthetic and labelled as test bills. A01 is a scanned shared electricity bill for December 2026; A02 is an individual digital water bill for December. A03 and A04 are email-body-only examples for January 2027. These future periods distinguish the controlled cases from older prepared bills; they are not predicted provider bills. They require the verified mappings and occupancy shown in the asset index. If a case has already been consumed, keep its outcome and use a deliberately prepared new case for another first-intake test.

A05 has a readable but unmapped account; A06 has a masked account that must not be guessed. A07 is deliberately unsupported as a bill upload. A08 refers to Bayan's existing staged correction source: the retained original shows 20 December 2026 but the prepared extracted due date is unreadable. This is a staged workflow scenario, not an actual OCR failure or a representative accuracy sample. If A08 is already decided, the owner must prepare a new controlled case before repeating its decision path.

For email-body cases, copy SUBJECT into Gmail's subject and only the marked body into its body. Do not attach the text file, original EML, ZIP, workbook or README as the bill. For an attachment/OCR case, attach the exact PDF. Do not attach an alternate format of the same bill and expect another charge. Compare the source values with the Tenant result independently of the application's extracted display.

## 8. Explaining the system during the review

If asked whether validated means paid, answer that it means the source passed the defined checks for billing. If asked whether every bill needs Manager approval, explain that valid bills proceed automatically; review is for unresolved cases and permitted corrections. If asked why the Manager still has Staff functions, explain operational cover while Staff handles the routine work.

If asked whether higher authority means unrestricted actions, explain the responsibility split: Admin sees permitted records across workspaces, Manager controls the assigned business's financial decisions, Staff prepares and investigates, and Tenant accesses own records. The application does not let an Admin inspection page act as the Manager. Shared layouts do not remove server-side authorization.

If asked whether the system works 24/7, answer that scheduled functions require the backend to stay running; internet is also needed for Gmail and external delivery. Emails may wait in the mailbox while the laptop is offline, but our application cannot retrieve or review them while stopped. Local HTTPS/hotspot access is a controlled local setup, not public deployment.

If asked whether our tests prove the system is fully secure, accurate or accepted by users, answer with the actual evidence and its limits. We have recorded automated development checks and controlled fixtures; manual device, supported provider and participant results are separate. It is better to show a correctly held incomplete bill than to force a successful match or invent a result.

## 9. What happens after testing

We should freeze features while completing the agreed walkthrough. A confirmed software failure needs a focused fix and retest. A mismatch between the paper and intended, verified behavior needs the affected paragraph corrected. Missing setup needs to be completed before retrying the blocked case. Feedback is reviewed for practical improvements inside the current scope rather than treated as an automatic request for a new module.

Add actual manual findings to Chapter III with dates, devices, procedures and failures. Update any affected Chapter IV conclusion or recommendation using those findings. Keep the dated automated results separate and obtain the adviser's approval for formal participant tasks and scoring before reporting participant evaluation. Our goal is a clear, supported demonstration and an honest paper, not a claim that no future revision can ever be needed.

## 10. Where to look when asked about the code

server/index.js contains API routing and request access checks. server/service.js connects records, billing, rent and related business operations; server/rules.js contains core parsing and billing rules. server/store.js defines SQLite storage and workspace scoping. server/integrations.js handles supported email/document ingestion and extraction, and server/staff-workflow.js handles proposals and atomic decisions. server/admin-visibility.js builds the permitted read-only Admin responses.

server/scheduler.js handles scheduled work; server/rent-email.js controls rent-only email. src/auth/rbac.js and src/config/navigation.js control visible role navigation as an additional interface guard. src/features contains role-relevant pages and shared components. The tests folder contains automated development checks, not actual participant answers. Explain the purpose of these files rather than memorizing every line of code.

For exact procedures, use docs/user-manual.md, docs/manual-test-guide.md, docs/development-guide.md and docs/next-session-checklist.md. The current Chapters I-IV sources and checked manuscript PDF are in SeCapstone/review. The diagram sources and enlarged exports are in SeCapstone/diagrams. This reviewer guide summarizes those materials; it does not replace the fixed research title, chapter evidence or approved workflow.
