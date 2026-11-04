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


## Chapters I-III evidence and reference review - 28 October 2026

Chapters I and II were checked against the implemented scope and Staff handoff. Their four research questions and seven-iteration methodology remain coherent. Chapter III sections 3.1.1-3.1.4 answer those four questions in order; no Chapter IV content was introduced. Three older Chapter II passages were aligned with Staff investigation and Manager decisions, including the Iteration 4 table cell. The locked research title and approved billing workflow were preserved.

Eleven reference entries were corrected or clarified using publisher, official specification, institutional or author-deposited records. Four narrative author citations were corrected, and W3C citations were pinned to the actual 2024 Push API Working Draft and 2022 Service Workers Candidate Recommendation Draft. The intended Kim and Levinson papers were retained with corrected DOIs; the original Mayr 2025 record was linked rather than confused with the revised 2026 PDF. Cammarata's ending page and Saputra's initials were corrected. The references were alphabetized again. Exact sections and whole old/new paragraphs or cells are in MANUSCRIPT_ALIGNMENT_EDITS.json under reviewedAt 2026-10-28, with primary metadata links on the reference records. These were metadata and accessible-content checks, not a claim to have independently reproduced every cited study. The IEEE Kumar title/DOI resolves to the intended paper, but the automated primary page did not expose its full author metadata; that author check remains partial, and no unsupported replacement was made.

Current OS/CPU/RAM, Node/SQLite/browser/package versions, raw timings, source hashes and all nine fixture representations were collected in reports/updates/chapter-3-development-evidence-2026-10-28.json. The catalog contains five bill cases and only one anonymized actual-layout case. Direct text/email matched 36/36 expected stored values; OCR matched 18/18. These are known-fixture consistency results, not representative provider accuracy. Local complete-response API timings cover only the stated small dataset and loopback route; memory measurements cover the Node process, not the browser or operating system.

The initial fresh suite had 98 passes and one date-dependent browser expectation failure. Its source bill was due in the next month, and the application correctly used that due month. After correcting the test expectation and asserting the cycle, the targeted journey and the fresh complete suite passed: 99/99, zero failures, cancellations or skips, approximately 327 seconds. Both dated transcripts are retained in reports/updates. The old header-only performance test's fixed date was corrected to a timestamp; it is not the complete-response benchmark reported in Chapter III. No application business rule was changed for this paper update.

Chapter III now covers the professor's requested environment, scope, executed cases and rates, defects, recommendations and overall assessment. It includes actual development observations while stating that no formal participant results exist. The user's confirmed absence of participant forms was respected. No questionnaire ratings, actual-phone outcomes, live provider acceptance, representative accuracy percentage, production capacity or overall ISO score were invented.

The existing Google Doc was updated in place. All 290 nonempty text paragraphs/cells match the regenerated local payload; three native tables and three embedded diagrams remain, with no native bullets. Effective Chapter III/reference body formatting was checked as Arial 12, justified and double-spaced. The current PDF has 52 pages. Its environment, measurement and first reference pages were rendered and inspected; required results and removal of the corrected stale citations were checked by PDF text extraction. Earlier 49-page and 23 October notes above remain historical. Working databases, email settings, Git staging, commits and pushes were not changed.


## Admin read-only alignment and export - 1 November 2026

Chapter I Section 1.2 (quality/access discussion) and Section 1.5 (role and workspace scope), Chapter II Sections 2.0 (requirements/framework), 2.1 (actor responsibilities), 2.2 (DFD and mockup explanations) and 2.4 (role testing), and Chapter III Section 3.1.1 now reflect the implemented Admin read-only inspection. Admin retains account maintenance but cannot mutate operational/financial records or open private originals. Staff prepares; Manager authorizes and confirms rent; Tenant controls only own utility marks. The unchanged research title and reference sources were preserved. Whole revised paragraphs remain in the chapter sources; the 10 bounded replacements were appended to the existing 43-entry alignment history.

Chapter III Sections 3.2.3 and 3.2.4 include the separately dated full 144-test result, four successful isolated guard sensitivity checks, the account-response allowlist finding and repair, and trusted-operator limitations. The 28 October performance and known-fixture observations remain dated measurements; they were not relabelled as new results. Formal participant evaluation, actual Android delivery, a fresh provider-email acceptance journey and representative extraction accuracy remain uncollected. Chapter IV remains deferred.

All 293 nonempty Google Docs text paragraphs/table cells match the regenerated local payload exactly. Three native tables and three embedded figures remain; no native bullets were found. All nonempty paragraphs are justified and double-spaced. Explicit text runs and inherited named styles resolve to Arial 12; the three requirement subheadings inherit the 12-point Heading 4 style. The Google Docs architecture and DFD images were replaced after explicit upload permission. The exported PDF has 59 pages; all-page thumbnails and enlarged architecture, DFD, new security-results and limitations pages were visually checked. An inserted-paragraph spacing reset was found and corrected before the final export. The title page is the only page with fewer than 130 extracted characters; no unintended empty page was found. Figure details remain available as enlarged PDFs because the overview diagrams are dense.

The stored PDF is a Google Docs export. `export-manuscript.mjs` also reproduces a local offline PDF from the canonical payload and current local figures using the existing Playwright installation. That local reproduction has its own browser pagination; it is not represented as a byte-identical Google Docs export. No application business rules, live emails, passwords or working financial records changed in this document-alignment pass. The prepared Group 3 database was inspected read-only: two workspaces, each with one property, two units, three Tenants and nine bills; no foreign-key violations. Manual results remain pending in the existing test guide.

Final PDF SHA-256: `4bb6f8c1c56aeffbf94edfc220aef3fe3e035d7aa3845242c958d6c39a847190`. Size: 1250848 bytes.


## Chapter IV draft added - 1 November 2026

The user supplied `D:/CAPSTONE/Guidelines for Writing Chapter IV.pdf` and authorized drafting Chapter IV. Its confirmed title is Conclusions and Recommendations, with a brief introduction, Section 4.1 Conclusions and Section 4.2 Recommendations. The local source is CHAPTER_IV_WORKING.md. Chapter IV was inserted before References in the existing Google Doc without changing Chapters I-III, their title, references, native tables or embedded figures.

Four conclusion paragraphs follow the four existing SOPs in order. Each contains three sentences and uses only the Chapter III development findings, including the separately dated 144-test result and its limits. Five recommendation paragraphs identify responsible people and practical follow-up actions; each contains three sentences. The attribution paragraph identifies development tests and technical limitations as the basis, not uncollected surveys, interviews or participant scores. No SARIMA examples, sample ratings, provider-payment verification, new modules or new research objectives were imported from the guide. The chapter remains a development-based draft until actual-device, provider/delivery and formal evaluation findings are collected.

The complete local payload and Google Doc match across 308 nonempty text blocks. The new chapter has 15 paragraphs, no native bullets and no measured paragraph-format errors: Arial 12, justified, double-spaced. References retain their separate page break. The current native export is MANUSCRIPT_I_IV_REVISED.pdf, 62 pages, with Chapter IV on pages 55-57. All three Chapter IV pages were rendered and visually inspected for text spacing and page breaks. The earlier 59-page I-III export remains an identified checkpoint, not the current combined paper. No system code, records, credentials or email delivery changed in this drafting task.

Chapters I-IV PDF SHA-256: `447ec6c1c5f3674017745f2bad984ebc65f11256bac40caa93aed7fe6e768620`; size 1268996 bytes.


## Integrated interface and development evidence - 4 November 2026

Chapters II-IV were aligned with the combined Fresh Mint/main and staging implementation. Chapter I objectives and scope, citations, roles, financial boundaries and all three diagrams remain unchanged. Chapter II describes the cream/mint/forest interface without claiming measured usability. Chapter III adds the separately dated 155-pass, 354,942.2249 ms integration run, 151 syntax checks and the observed validation/setup repairs. Chapter IV uses that latest development checkpoint while retaining the limits on provider accuracy, actual devices, delivery and formal participant evaluation. Earlier 99- and 144-test evidence remains dated and separate.

The existing Google Doc was edited in place with five exact text replacements and revision protection. Readback matched all 310 nonempty canonical text blocks, retaining three native tables, three embedded diagrams and no native bullets. Changed paragraphs retain Arial 12, justified alignment and 200 percent line spacing. The exported PDF was rendered for checking; extra inserted paragraph gaps were removed and Table 3.1 now starts with its caption and data on page 50. Chapter IV begins on page 56. No diagram upload or new manuscript copy was needed.

Current native PDF: MANUSCRIPT_I_IV_REVISED.pdf, 63 pages, 1,273,979 bytes. SHA-256: `d8f1f091354b0f5e46e5d9e704790dffc570a56f49a8bd19580048d299e55844`. The I-III checkpoint is preserved. Automated passes were not copied into the manual-testing workbook. Actual phones, authorized live provider/email/Push checks and adviser-approved participant evaluation remain outstanding.


## Deferred concise Section 1.5 and whole-paper alignment - 4 November 2026

The user asked to keep the proposed shorter Scope and Limitations draft for the later whole-paper update, including the existing Google Doc. This is a saved proposal for that later revision, not an edit to the current canonical chapters, native document or PDF. Do not claim that the deployment paragraph has already been inserted. Do not begin a tunnel deployment from this manuscript decision.

When resumed, align Chapters I-IV, the existing Google Doc, the canonical payload and the current PDF. Keep the fixed title, citations, paragraph-based college tone, Arial 12, justified text and double spacing. Retain the detailed reminder schedule, rent/advance conditions, proposal states, retries and permission rules in Chapter II; shortening Chapter I does not remove those requirements. Preserve the recorded development evidence and distinguish it from still-pending actual-device, live provider/delivery and participant evaluation. Supporting infrastructure remains outside new research objectives.

Saved proposed replacement follows. Confirm it still matches the implementation and evidence when the paper revision resumes.

### 1.5 Scope and Limitations of the Study

Our study will develop and evaluate a web-based property-management workflow for selected boarding houses and residential apartments in Pasig City during Academic Year 2026-2027. It will cover rent, electricity and water billing, with access assigned to Admin, Manager, Staff and Tenant accounts. Admin will handle account and system maintenance and permitted read-only inspection. Staff will perform authorized daily tasks and prepare corrections, while the Manager will control financial settings, correction decisions and rent confirmation. Tenants will access their own records and permitted functions.

Our system will receive supported utility-email summaries and attachments, together with optional uploads of clear printed-bill photographs or scans. It will use direct text extraction or OCR to obtain billing details, validate them, identify the billing arrangement and calculate individual or equal shared charges. Processing will depend on readable supported documents and verified account mappings. Missing, masked, conflicting or otherwise invalid information will require review rather than guessed values or automatic finalization. Unsupported password-protected attachments will require review and an available supported copy.

Rent functions will include fixed monthly billing, approved one-month advance handling, payment reporting, Manager confirmation and confirmed rent receipts. Utility payment marks will remain personal Tenant tracking and will not establish provider settlement or produce utility receipts. Billing history, actual bill dates, labelled rent estimates, portal alerts, rent and utility Web Push, and supplementary rent-only email will support Tenant access. Workspaces, basic reports, access controls, system-status checks and backups will support the included workflow rather than serve as separate research objectives.

Our evaluation will use controlled conditions and selected properties. Local portal access will require a connection to the server's network, while remote access will require a separately configured reachable HTTPS address. The server must remain running for portal access and scheduled processing. Gmail retrieval and external notifications will require internet connectivity. The study will not establish readiness for large-scale deployment or guarantee continuous public availability, notification delivery or readership.

The study will exclude native mobile applications, smart-meter installation or reading, internet-service billing, payment gateways, automatic bank or provider-payment verification, provider-app access, SMS, predictive billing, model training, autonomous AI decisions, blockchain, maintenance tickets, legal-contract generation and automated eviction. OCR will not cover handwritten, heavily damaged, severely distorted or low-resolution documents. Evaluation will address the five selected ISO/IEC 25010:2023 characteristics under the stated test conditions; it will not establish universal extraction accuracy, long-term business improvements or complete legal certification.

## Concise scope applied and Chapters I-IV aligned - 4 November 2026

The user resumed paper finalization. The earlier deferred draft above is retained as history and has now been applied with small scope-preserving refinements. Chapter I Section 1.5 paragraphs 1-9 were replaced by five paragraphs covering the purpose and roles, supported intake and review, rent and utility boundaries, operating conditions, and exclusions. Fixed non-prorated anniversary rent, final-cycle advance handling, automatic valid-bill processing, labelled rent estimates and excluded automatic transfers/renewals remain explicit. Detailed permission, reminder, allocation and correction rules remain in Chapter II. The fixed research title, four SOP questions, literature citations and figures were preserved.

Chapter II Section 2.0 Project Information now includes a third paragraph explaining the locked stack, same-network local access, local certificate setup, separately configured remote HTTPS, running-backend requirement and external-service internet dependency. Section 2.0 C. Security Requirements paragraph 1 now distinguishes rejected invalid form/API submissions from utility-source processing exceptions. Chapter III Section 3.1.2 paragraph 3 uses the same access conditions. The paragraph following Table 3.1 identifies its 28 October 99-test baseline and clarifies that the later 144- and 155-test runs are separate checkpoints. Chapter IV Section 4.2 recommendation paragraph 4 aligns the operating-guide advice without claiming remote deployment. Whole replacement text is retained in MANUSCRIPT_ALIGNMENT_EDITS.json.

The existing native Google Doc was updated in place with revision protection. Readback matches all 307 canonical nonempty text blocks; three native tables, three embedded diagrams and zero native bullets are retained. All nonempty text runs resolve to Arial 12, and their paragraphs are justified with 200 percent line spacing. The revised PDF was rendered and the changed scope, operating conditions, security requirements, Table 3.1 continuation and Chapter IV pages were visually checked. Table 3.1 begins on page 47 and Chapter IV on page 53. No new document copy, diagram upload, runtime feature, delivery test or participant result was introduced.

Current native PDF: MANUSCRIPT_I_IV_REVISED.pdf, 60 pages, 1,254,815 bytes. SHA-256: `0721ba8bde92311f1e8e17ae208ac0af8826b0715b11b6b8942c782880edb4cd`. The I-III checkpoint remains unchanged. No placeholder text or Markdown bullets were found in the chapter sources. Literature citations and reference entries were retained; this wording pass did not independently repeat the earlier external-source metadata verification. Formal participant evaluation, representative provider extraction results, actual-phone acceptance and live intended-recipient delivery remain outstanding. This is an aligned development-based manuscript, not a declaration that the study's formal evaluation is complete.
