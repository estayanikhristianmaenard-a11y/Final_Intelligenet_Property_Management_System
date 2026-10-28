# Manuscript alignment review ? 27 October 2026

Google Doc: https://docs.google.com/document/d/11tHstktR1Z7ES9N4QRY6-w-HZd9fXzOxjbDBV2ZELs8/edit

Chapters I?III were checked against the saved scope guard, Staff implementation handoff, available runtime paths, QA report, and retained 23 October full-suite log. This is a targeted manuscript alignment review, not a fresh full system test, independent reference audit, or final release certification. Chapter IV remains deferred by the user.

## Changes and complete replacement paragraphs

The existing title, Statement of the Problem, citations and reference-list wording were preserved. Chapter I/II sources now include the bounded alignment edits rather than leaving those edits only in the Google Doc. The Google Doc was edited in place with revision-guarded replacements; existing native tables and headings were preserved.

### CHAPTER_I_REVISED.md ? 1.2, OCR and Billing Document Extraction, paragraph 1

Complete current paragraph(s); paragraph indexes below are blank-line-delimited source blocks, including headings and tables, not page numbers.

Source block 14:

Within property-management operations, billing is one area where digital processing can support routine administrative work. Billing documents contain information such as amounts, dates, billing periods, providers, and account or reference identifiers. Kumar et al. (2020) examine the extraction of information from bill receipts using Optical Character Recognition (OCR), while Saout et al. (2024) provide an overview of invoice-data extraction involving document digitization, OCR, information extraction, and document-structure recognition. Similarly, Mohan (2023) presents an end-to-end pipeline for custom key-value extraction from commercial invoices. However, extracting information from a billing document is only the first stage of billing processing. In the proposed system, readable text from supported billing emails and digitally generated PDFs is extracted directly, while clear bill images undergo OCR. After extraction, the information undergoes validation before billing processing. Records that do not meet the required validation conditions are sent to the Exception Queue for Staff investigation and, when required, Manager decisions. Thus, text extraction and OCR provide information for subsequent checks rather than a guarantee that every extracted value is accurate. The OCR component may employ machine-learning-based text-recognition technology to convert visible characters and document text into machine-readable output. However, the proposed system does not use OCR output or machine-learning recognition to determine billing validity, classify payment status, compute charges, or make property-management decisions.

### CHAPTER_I_REVISED.md ? 1.2, Rule-Based Processing and Exception Handling, paragraph 1

Complete current paragraph(s); paragraph indexes below are blank-line-delimited source blocks, including headings and tables, not page numbers.

Source block 16:

Once billing information has been extracted, it must be checked and processed according to defined conditions. Rule-based processing uses explicit conditions and decision rules to classify, validate, and route information. Wu et al. (2022) demonstrate the use of rule-based information extraction to organize domain-specific information, while Baralis et al. (2022) discuss business-rule engines for representing and executing operational decisions in a structured manner. Extending this idea to process automation, Geyer-Klingeberg et al. (2024) present a rule-based method that analyzes decision logic and classifies business processes according to their suitability for robotic process automation, while Kim et al. (2011) examine proactive exception handling in business processes. These studies support the use of predefined and traceable conditions to determine whether a record proceeds through normal processing or requires additional review. Applying these principles, the proposed system uses defined rules for billing validation, provider and account/reference mapping, duplicate detection, and identifying individual or shared billing arrangements. Records that do not meet the defined conditions are sent to the Exception Queue for Staff investigation and, when required, Manager decisions. These rules, together with the separation between Tenant-reported rent and Manager-confirmed rent status, are system requirements rather than findings established by the cited studies. Digital rent receipts are created only after Manager confirmation. Personal utility tracking remains separate and does not establish provider settlement.

### CHAPTER_I_REVISED.md ? 1.5, paragraph 4

Complete current paragraph(s); paragraph indexes below are blank-line-delimited source blocks, including headings and tables, not page numbers.

Source block 44:

Utility bills will enter the system through supported email-body summaries and attachments received by the designated property-management email account, or through optional Staff or Manager uploads of clear photographs or scans of printed provider bills. The Manager may hand a printed bill directly to tenants without uploading it. Until a supported email or uploaded copy is received and validated, that bill will not be available in the portal for automatic allocation, personal tracking, history, or reminders. Readable email summaries and digitally generated PDFs will use direct text extraction, while clear bill images will use OCR. The five target fields will remain the amount due, due date, billing period, provider, and account or reference identifier. Processing will be limited to selected provider formats; the availability of a provider email, PDF attachment, or complete identifier will not be assumed. Required-field, mapping, period, and duplicate checks will precede classification and computation across all supported intake methods. Masked or incomplete identifiers will require Manager review against verified account information; the system will not infer hidden characters or assign a bill by guessing. Incomplete, uncertain, duplicated, unmappable, or otherwise invalid records will enter the Exception Queue for Staff investigation or Manager correction. Staff correction proposals will require Manager authorization, and accepted corrections will undergo system revalidation and reprocessing. Finalized corrections will preserve prior values and tracking history. Utility due dates will come from validated received billing information; the system will not predict the next billing period's due date.

### CHAPTER_I_REVISED.md ? 1.5, new supporting-infrastructure paragraph before exclusions

Complete current paragraph(s); paragraph indexes below are blank-line-delimited source blocks, including headings and tables, not page numbers.

Source block 48:

Independent business workspaces will separate each management group's operational records. Managers and Staff will access only their authorized workspace, while Tenants will access their own records. Admin access will support authorized account and workspace maintenance without operational rent-confirmation authority. The Tenant calendar will display actual validated bill dates and clearly labelled estimates of upcoming configured rent dates. Estimates will not create charges, establish payment obligations, or predict utility dates. Workspace separation and calendar presentation support the included billing workflow rather than introduce new research objectives.

Source block 49:

The study excludes mobile applications; installation or physical reading of smart meters or submeters; Internet or Wi-Fi billing; predictive profit analytics or billing; Generative AI and autonomous AI billing decisions; blockchain; automatic utility disconnection; payment gateways or bank integration; independent external payment verification; automatic access to provider apps or phone notifications; maintenance tickets; legal contract generation; and automated eviction. OCR will not cover handwritten, heavily damaged, severely distorted, or low-resolution documents. The study does not guarantee Web Push or email delivery or readership, establish a universally fair utility-allocation formula, or provide complete legal certification under the Philippine Data Privacy Act.

### CHAPTER_II_REVISED.md ? 2.1, intake description

Complete current paragraph(s); paragraph indexes below are blank-line-delimited source blocks, including headings and tables, not page numbers.

Source block 26:

The designated property-management mailbox will retrieve supported utility-bill email summaries and attachments. Staff or the Manager may also upload a clear photograph or scan of a printed provider bill. All supported sources will follow the same validation, mapping, and duplicate-checking workflow. Readable email summaries and digitally generated PDF text will be extracted directly, while an existing OCR engine will recognize text from clear images of selected provider layouts without researcher training or customization of a machine-learning model. Predefined extraction rules will obtain the amount due, due date, billing period, provider, and account or reference identifier while retaining the source reference. Text extraction and OCR will not establish payment status, billing validity, or Tenant charges; extracted fields will undergo validation and mapping. Actual validated utility due dates will be used for billing and reminders, without predicting dates for documents not yet received. The system will not automatically access provider apps or read phone notifications. A separately configured outgoing email function will send supplementary rent alerts; it will not depend on retrieving a utility-provider email.

### CHAPTER_II_REVISED.md ? 2.4.3, paragraph 1

Complete current paragraph(s); paragraph indexes below are blank-line-delimited source blocks, including headings and tables, not page numbers.

Source block 21:

The framework connects property and unit management, Tenant management, utility-provider and account mapping, and rent configuration with email intake, optional Staff or Manager bill uploads, direct text extraction, OCR, validation, rule-based classification, duplicate checking, billing computation, and the Exception Queue. Billing records, rent payment-status management, advance-credit application, confirmed rent receipts, personal utility tracking, Web Push notifications, and rent email notification records use the Centralized Database. The Admin, Manager, Tenant, and Utility Provider interact with these components according to their defined responsibilities.

Source block 66:

The planned iterations will be applied progressively, beginning with the system foundation and configuration functions and continuing with property-email intake, optional Staff or Manager bill uploads, direct text extraction, OCR extraction, rule-based processing, exception handling, Billing Computation, rent payment and receipt management, approved advance-credit application, personal utility tracking, Tenant access, Web Push Notifications, and supplementary rent email notifications. Each iteration will build upon related functions developed in earlier iterations.

### CHAPTER_II_REVISED.md ? 2.4.3, paragraph 3

Complete current paragraph(s); paragraph indexes below are blank-line-delimited source blocks, including headings and tables, not page numbers.

Source block 68:

The final iteration will integrate the developed functions and conduct system-wide testing and evaluation. The completed system will be evaluated using the selected ISO/IEC 25010:2023 quality characteristics: Functional Suitability, Performance Efficiency, Interaction Capability, Reliability, and Security. This chapter describes the planned methodology. Recorded development activities and testing results are presented separately in Chapter III; formal evaluation is reported only when completed.

### CHAPTER_II_REVISED.md ? 2.4.4, participant-task and scoring paragraph

Complete current paragraph(s); paragraph indexes below are blank-line-delimited source blocks, including headings and tables, not page numbers.

Source block 74:

Staff will upload bills, investigate exceptions and submit correction proposals. Managers will review escalations, authorize or reject proposals, make permitted direct corrections, record or confirm rent payments, and apply eligible final-cycle credit. Tenants will view bills and history, report outstanding rent, use personal utility tracking, access confirmed rent receipts, and follow permitted notification links to the authenticated portal. Controlled rent email receipt and link access will be checked separately from backend sending results. Task completion and difficulties will be recorded. Questionnaire responses will use the approved scale and scoring procedure, while technical results will use counts, percentages, time summaries, and failed-case descriptions. Evaluator selection and counts, document counts, and questionnaire scoring will be settled with the adviser before final data collection. This section specifies the evaluation procedure rather than its results. Chapter III distinguishes the completed development checks from the formal evaluation activities that remain pending.

### CHAPTER_III_WORKING.md ? 3.1.1, email intake, upload, and extraction paragraph

Complete current paragraph(s); paragraph indexes below are blank-line-delimited source blocks, including headings and tables, not page numbers.

Source block 9:

Email intake, upload, and extraction. The designated property mailbox and optional Staff or Manager uploads provide supported utility sources. Readable email and digital-PDF text use direct extraction, while supported image and scanned-PDF sources use OCR. These paths retain the source and extract the amount due, due date, billing period, provider, and account or reference identifier. Unsupported, encrypted, unreadable, masked, or conflicting inputs require review rather than guessed data. A password-protected attachment requires review and an available readable supported source; the system does not recover its password or infer hidden account characters.

### CHAPTER_III_WORKING.md ? 3.1.3, five quality-characteristic evidence paragraphs

Complete current paragraph(s); paragraph indexes below are blank-line-delimited source blocks, including headings and tables, not page numbers.

Source block 20:

The selected ISO/IEC 25010:2023 characteristics remain Functional Suitability, Performance Efficiency, Interaction Capability, Reliability, and Security, as defined in Chapters I and II. Each characteristic requires evidence appropriate to its purpose; a passed automated suite does not establish a score for every characteristic.

Source block 21:

Functional Suitability is supported by recorded checks of intake, validation, allocation, correction handling, rent confirmation, receipt access, and personal utility tracking. These results apply to the exercised cases. Representative extraction accuracy still requires a declared sample set and manually checked reference values.

Source block 22:

Performance Efficiency has not yet been established through a controlled response-time, resource-use, or concurrent-user study. The full-suite duration reported in Section 3.2.3 measures the time taken by the test suite and must not be presented as bill-processing latency or evidence of production capacity.

Source block 23:

Interaction Capability has preliminary evidence from automated browser journeys and phone-sized layout checks. These checks do not replace actual-device tasks, participant feedback, or an adviser-approved usability questionnaire. The proposed interface redesign remains separate from the implemented screens and must be checked after application.

Source block 24:

Reliability is supported by the recorded duplicate, replay, restart-persistence, invalid-correction rollback, and independent-job failure scenarios. These bounded checks do not establish long-term availability or operation while the server is shut down.

Source block 25:

Security has evidence from selected authentication, role, record-access, and workspace-isolation checks. It has not been established through a complete penetration test or legal compliance audit. No questionnaire ratings, respondent counts, OCR accuracy percentage, load capacity, or security certification are reported as completed results.

## Cross-chapter alignment matrix

| Topic | Chapter I | Chapter II | Chapter III / evidence boundary |
| --- | --- | --- | --- |
| Methodology and SOP | 1.4, SOP 1 | 2.4, seven iterative development areas | 3.1.1 describes recorded development; no invented sprint ceremonies |
| Function integration | 1.4, SOP 2; 1.5 | 2.1 and 2.2 | 3.1.2 connects intake, extraction, validation, allocation and Tenant access |
| Quality characteristics | 1.4, SOP 3 | 2.4.4 planned evaluation | 3.1.3 separates evidence and gaps for all five selected characteristics |
| Guide and manual | 1.4, SOP 4 | Documented setup and task procedures | 3.1.4 describes prepared guides, subject to final UI changes |
| Staff and Manager | 1.2 and 1.5 | Requirements, operation and proposal safeguards | Staff investigates/proposes; Manager authorizes; valid bills remain automatic |
| Workspace access | 1.5 supporting paragraph | Role/security requirements | Recorded isolation checks, not public SaaS deployment |
| Calendar | 1.5 supporting paragraph | Actual due-date and notification rules | Actual utilities; labelled rent estimates only |
| Rent / utilities | 1.5 | Payment, allocation and notification procedures | Manager-confirmed rent receipt; personal unverified utilities |
| Extraction limits | 1.5 | Supported extraction and exception checks | No masked-ID inference or automatic password recovery |
| Test evidence | Evaluation intent, not results | Testing procedure, not claimed participant outcome | 3.2: dated 99/99 suite; separate controlled Gmail self-test |
| UI | Responsive access within scope | Mockup design | New ledger redesign is a proposal; current screenshots are implementation evidence |

## Remaining evidence required before final submission

- Insert and visually verify the three current approved diagram exports; their explicit insertion notes remain in the Doc.
- Confirm exact hardware/software specifications for the reported test environment from retained records; do not backdate current machine specifications.
- Complete actual-device, authorized real-recipient notification, and adviser-approved participant evaluation; report actual counts and results.
- After applying the approved UI, repeat affected checks and replace screenshots. Do not present proposal SVGs as the implemented interface.
- Review the exported manuscript PDF for pagination, figure legibility and table splits. Native formatting readback alone does not prove page fit.
- Confirm Chapter IV outline before drafting it.

## Formatting and verification

The Google Docs formatting requests set Arial 12, 200% line spacing and justified paragraphs, preserving native heading styles and three native tables. Source title and citations were preserved. All seven new remote text replacements matched exactly once. No application code, database, secrets, email sending, live mailbox retrieval, Git commit or Git push was changed or performed by this review. The 99-test result remains dated 23 October evidence, not a new test run.


## Applied paragraph-form cleanup ? 27 October 2026

This update supersedes earlier notes about outstanding figure insertion and the front working-manuscript notice. The existing Google Doc was edited in place. The locked research title and reference list were preserved. Thirty-two paragraphs were revised for the approved Staff/Manager clarification, shorter wording, reduced repetition and clearer separation of application defects, test-script updates and unfinished evaluation. The five lettered quality criteria were incorporated into research question 3; the four numbered research questions and required section headings remain. Discussion uses paragraphs, without bullet lists. The front working note and internal Chapter IV drafting instruction were removed.

All three current diagram PNGs are now embedded with their captions. The document retains three native tables. Arial 12 was explicitly applied; body paragraphs remain justified with 200 percent line spacing. Image paragraphs are centered with single spacing to preserve their layout, and captions are centered. The figure page-break issue found in the first export was corrected. The final 49-page PDF was exported from Google Docs; its title and three figure pages were rendered locally and visually checked for clipping and caption placement. This is not a claim that every printed page or small diagram label was independently proofread.

The final native document contained 283 nonempty text paragraphs/cells, all matching the regenerated local manuscript payload. There were three embedded images, three tables, no native bullets and no leftover figure placeholders or selected drafting notes. The current PDF is MANUSCRIPT_I_III_REVISED.pdf. MANUSCRIPT_FINAL_CLEANUP_EDITS.json retains the exact before/after paragraph edits.

The 99-pass result is retained evidence from 23 October, not a new test run. Exact historical CPU, RAM and installed software builds could not be established from the inspected records; the test-environment section now states that reporting limitation instead of leaving an instruction or substituting present-day specifications. Actual-device and intended-recipient notification acceptance, representative OCR measurements and formal user evaluation remain incomplete. References were preserved rather than independently reverified. Chapter IV remains outside this update. No application code, database, integration configuration, Git commit or push was changed.


## Implemented interface alignment - 27 October 2026

Five Chapter III paragraphs were updated in the local source and existing Google Doc after the Case Sheet and final UI polish. References to the redesign as not yet implemented were replaced with the actual shared Case Sheet, readable next actions, source comparison, recovery controls and updated guides. Actual-device, provider-email, representative accuracy and formal evaluation limitations remain explicit. Chapters I-II, the locked research title and references were preserved. The five remote changes matched once each; readback retained 283 nonempty text paragraphs/cells and zero native bullet items. Edited body paragraphs remain justified, double-spaced and 12-point. The refreshed 49-page PDF includes the changed discussion on pages 41 and 42; page 41 was rendered and visually checked. The payload was regenerated. Existing 23 October results in the manuscript remain dated historical evidence; current 27 October software verification is recorded in the portal QA report (99/99, approximately 273 seconds). No participant findings were invented.
