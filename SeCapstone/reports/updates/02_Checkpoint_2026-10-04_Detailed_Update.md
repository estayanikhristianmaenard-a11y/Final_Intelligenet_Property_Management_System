# System Development Progress Report — Checkpoint 2

**Intelligent Property Management Workflow with OCR-Enabled Automated Billing Classification and Tenant Notification**

Group 10

Members: Casas, William Jake D.; Estayani, Khristian Maenard D.; Magtapat, Jullian Matthew B.

Consultation: 4 October 2026 (Online). Prepared for submission: 12 October 2026.

Second Checkpoint — Retrospective Integration and Billing Update

Methodology: Iterative Software Development Methodology.

<!-- PAGE BREAK -->

## 2. Introduction

This second-checkpoint report examines progress evidence for integrating portfolio configuration, document extraction, deterministic billing, exceptions, and financial records. The researchers separate what can be attributed to the consultation from the later system reference and the remaining acceptance tasks under the Iterative Software Development Methodology.


## 3. System Development Overview

Checkpoint state: To Be Confirmed. No dated source or demonstration establishes what was implemented by 4 October. The earliest inspected local commit is dated 9 October and describes a frontend baseline. Current Node/SQLite workflows and test results are therefore discussed as later evidence. Section 4 statuses refer to the inspected 12 October reference, not the second consultation.

The three reports distribute the same current system across foundation, billing integration, and payment/tenant/testing themes. Dates are consultation labels; undocumented completion dates are not inferred. Module statuses refer to the later inspected reference, and source paths are relative to SeCapstone/propertypro-portal.


## 4. Accomplished Features — This Report’s Scope

**Feature/Module:** Utility Provider and Account Mapping

**Development Status:** Completed locally

**Accomplishments:** Manager-configured mappings link a unique provider/account pair to a unit and electricity or water category. Ambiguous or missing targets enter review.

**Current Limitations:** Operators must configure mappings before finalization.

**Evidence:** src/features/settings/settings-live.js; T06, T10, T25.

**Feature/Module:** OCR Billing Extraction

**Development Status:** Partially implemented

**Accomplishments:** Actual PDF.js extraction, Tesseract image OCR, MIME attachment handling, retained source files, and an IMAP adapter are implemented.

**Current Limitations:** Live mailbox retrieval, provider-layout acceptance, and noisy images remain unverified.

**Evidence:** server/integrations.js; T11–T14.

**Feature/Module:** Rule-Based Billing Classification

**Development Status:** Partially implemented

**Accomplishments:** V01–V04, C01–C02, A01, and R01 perform traceable checks, duplicate holds, category mapping, equal centavo allocation, and recipient freezing.

**Current Limitations:** The approved-paper audit identifies incomplete missing-rent-recipient exception handling.

**Evidence:** server/rules.js; service.js; T01, T06, T16, T20.


<!-- PAGE BREAK -->

## 4. Accomplished Features — Continued

**Feature/Module:** Automated Rent Generation

**Development Status:** Partially implemented

**Accomplishments:** The local engine generates anniversary cycles, uses short-month fallback, separates first advance rent, prevents duplicates, and respects lease-end cutoff.

**Current Limitations:** Local automatic final credit differs from the explicit Manager approval in the approved manuscript/later branch. Missed-cycle recovery also needs reconciliation.

**Evidence:** server/service.js; T02, T05, T15; finalized-paper audit.

**Feature/Module:** Exception Queue

**Development Status:** Partially implemented

**Accomplishments:** Manager field corrections retain old/new values, reasons, responsible identity, and revisions; repeated unresolved failures remain open.

**Current Limitations:** Paid bills still lack the complete linked revised charge/balance workflow required by the approved paper.

**Evidence:** server/service.js; billing/exception-queue.js; T06, T07, T14, T21.

**Feature/Module:** Shared-Occupancy Allocation

**Development Status:** Completed locally

**Accomplishments:** Eligible rent recipients are determined on generation day; utility recipients use the source period’s final day. Charges use whole centavos, residual cents follow ascending permanent tenant ID, and finalized recipients remain frozen.

**Current Limitations:** Groups without valid eligibility enter review; conflicting shared rent anniversaries are held.

**Evidence:** server/rules.js; service.js; T01, T03, T06, T12, T16, T21.


## 4.1 Connected Workflow and Controls

Utility workflow: retrieve or upload a supported source, retain it, extract fields, validate required/conflicting values and dates, resolve a unique provider/account mapping, check duplicate attachments/periods, classify electricity/water, validate arrangement, allocate, and finalize. A failed stage enters review. A reasoned correction repeats the checks; unresolved failures stay open. OCR output alone never determines payment or confirms a tenant charge.


## 4.2 Verification and Practical Limits

The suite exercises actual PDF text extraction, clear-image OCR, MIME-to-shared-bill processing, missing/conflicting values, repeated processing, duplicate holds, and frozen corrections. PHP 100.00 split among three permanent IDs reconciles as PHP 33.34, PHP 33.33, PHP 33.33. Digital PDFs require a usable text layer; scanned PDFs currently require a sufficiently clear image upload.


<!-- PAGE BREAK -->

## 5. Development Progress per Checkpoint

| Checkpoint | Evidence-supported accomplishment | Status |
| --- | --- | --- |
| 27 September — first checkpoint | Dated baseline or demonstrated functions not supplied. | To Be Confirmed |
| 4 October — second checkpoint | No dated evidence establishes improvements since the first consultation. | To Be Confirmed |
| 9–12 October — later reference | Frontend baseline, integrated QA, and routing regression are dated after this checkpoint. | Later evidence only |


## 6. QA Findings and Issues Encountered

Integration findings included inactive extraction/intake/rent controls (QA-008), simulated corrections (QA-006), unsaved settings/mappings (QA-009), nonexistent allocation recipients (QA-012), and disconnected contracts (QA-025). Local extraction, correction, and allocation are tested. Live IMAP remains a QA-008 acceptance gap; provider layouts, poor images, and paid linked revisions remain open.


## 7. Improvements and Corrective Actions

The researchers implemented real extraction engines, source retention, unique mappings, traceable V01–R01 checks, integer allocations, frozen recipient lists, and reasoned revisions. Repeated failed reviews retain the same unresolved exception. The active local build still uses automatic final advance credit; later explicit Manager approval changes must be reconciled with the approved manuscript and re-tested before being claimed as adopted.

The original October QA matrix records 24 locally verified findings and two external acceptance gaps. T26 adds a later routing regression; those counts are different measures. A passing suite does not prove complete agreement with the approved manuscript, live provider delivery, or every supported browser.

Evidence classification: tested means the recorded local behavior passed; inspected means source or documentation was read; pending means required acceptance is outstanding; To Be Confirmed means historical attribution lacks dated evidence. These categories prevent UI appearance or an implementation claim from being treated as proof of operation.


<!-- PAGE BREAK -->

## 8. Ongoing System Development

The researchers still need representative provider documents, real mailbox access, and supported-device push tests. Approved-manuscript gaps include paid linked revisions, missing rent recipients, recovery for missed cycles, and reminder timing. Recorded payment-policy drafts and later branch changes require code, manuscript, and test reconciliation before adoption is claimed.


## 9. Next Development Priorities

1. Confirm the second-checkpoint source/demonstration and verify the locked database/API reference.
2. Recheck portfolio CRUD, dated assignments, individual overlap prevention, and dependency protection.
3. Test email retrieval, retained attachments, OCR fields, and duplicates against manually checked samples.
4. Complete rent/credit policy alignment, shared reconciliation, and paid linked correction records.
5. Verify reporting, rejection history, Manager confirmation, and repeat-safe receipt generation.
6. Define exact reminder timing and test actual background push independently of portal alerts.
7. Capture end-to-end evidence and acceptance boundaries for the five selected quality characteristics.


## 10. Conclusion

The second checkpoint’s historical integration progress cannot yet be verified. Later evidence demonstrates connected local billing workflows, while live-provider acceptance and specified manuscript gaps remain. The researchers should confirm consultation records and use the next iteration to close the documented gaps with reproducible tests.


## Evidence and Reproduction Notes

Evidence: approved 40-page FINAL_MANUSCRIPT.pdf and finalized-paper audit from recorded origin/main; local docs/qa-report.md; backend/browser/routing tests; dated Git records and inspected source. Earlier QA used a distinct 51-page reference. Later branch changes were inspected, not merged. Test fixtures are not operational transactions or participant evaluation.

Local demo: http://localhost:8080/#/login. In the portal directory, npm.cmd test reproduces the suite with isolated test databases. Email credentials and push keys are configured locally and are not included in these reports. No application code was changed to generate the documents.

