# System Development Progress Report — Checkpoint 1

**Intelligent Property Management Workflow with OCR-Enabled Automated Billing Classification and Tenant Notification**

Group 10

Members: Casas, William Jake D.; Estayani, Khristian Maenard D.; Magtapat, Jullian Matthew B.

Consultation: 27 September 2026 (Online). Prepared for submission: 12 October 2026.

First Checkpoint — Retrospective Evidence and Foundation Update

Methodology: Iterative Software Development Methodology.

<!-- PAGE BREAK -->

## 2. Introduction

The researchers are developing a web-based property management system for selected boarding houses and residential apartments in Pasig City. This first-checkpoint report records the available evidence, the foundation requirements, and the current reference implementation. It does not assign later development or testing to September without dated records.


## 3. System Development Overview

Checkpoint state: To Be Confirmed. No source revision, test log, or demonstration dated on or before 27 September was supplied. The current reference uses HTML/CSS/JavaScript, Node.js, and SQLite. Its connected billing workflows were tested later. All module statuses in Section 4 describe that later local reference as inspected on 12 October; they are not September accomplishments.

The three reports distribute the same current system across foundation, billing integration, and payment/tenant/testing themes. Dates are consultation labels; undocumented completion dates are not inferred. Module statuses refer to the later inspected reference, and source paths are relative to SeCapstone/propertypro-portal.


## 4. Accomplished Features — This Report’s Scope

**Feature/Module:** Admin Dashboard and System Maintenance

**Development Status:** Completed locally

**Accomplishments:** The researchers connected user administration, audit records, database health checks, backups, OCR-worker restart, and temporary-cache cleanup.

**Current Limitations:** External-service acceptance and production security are outstanding.

**Evidence:** src/features/admin/; server/index.js; T17, T23, T25.

**Feature/Module:** Manager Dashboard

**Development Status:** Completed locally

**Accomplishments:** The researchers connected portfolio summaries, activity navigation, outstanding balances, and refreshes following stored mutations.

**Current Limitations:** Concurrent and large-portfolio performance has not been evaluated.

**Evidence:** src/features/dashboard/; server/service.js; T23, T25.

**Feature/Module:** Property and Unit Management

**Development Status:** Completed locally

**Accomplishments:** The researchers implemented create, view, edit, and protected delete operations, whole-unit rent, occupancy configuration, and dated assignment controls.

**Current Limitations:** Financial dependencies restrict deletion and historical changes.

**Evidence:** src/features/properties/ and units/; T23, T25.


<!-- PAGE BREAK -->

## 4. Accomplished Features — Continued

**Feature/Module:** Tenant Management

**Development Status:** Partially implemented

**Accomplishments:** Distinct tenant records, linked accounts, profiles, lease dates, assignment dates, and shared occupants are stored and tested.

**Current Limitations:** Historical transfers and renewals under one identity remain restricted.

**Evidence:** server/store.js; service.js; T03, T18, T25.

**Feature/Module:** Authentication and Role-Based Access

**Development Status:** Completed locally

**Accomplishments:** Credentials, hashed passwords, revocable sessions, ownership checks, role routes, logout cleanup, and old-session response isolation are verified.

**Current Limitations:** Independent Manager portfolios and production security assessment remain outside verified coverage.

**Evidence:** src/auth/; app/shell.js; api/client.js; T10, T17, T26.

**Feature/Module:** Login Password Visibility

**Development Status:** Completed locally

**Accomplishments:** The researchers added an eye/Show–Hide button within the password field. Passwords remain masked by default, and toggling preserves the entered value. Mouse, keyboard, mobile, and all-role sign-in checks passed.

**Current Limitations:** The control changes visibility only; a running API and valid credentials are still required.

**Evidence:** src/features/auth/login.page.js; styles/pages/entities.css; direct browser checks, 12 October.


## 4.1 Connected Workflow and Controls

Foundation workflow: the Manager creates a property, unit, and distinct tenant with lease/assignment dates; the Admin creates a linked Tenant account; that account accesses only its own portal records. Database relationships connect assignments, bills, reports, and receipts. Dependent records block unsafe deletion, and account changes revoke sessions. Managers currently share one portfolio; separate landlord organizations are not implemented.


## 4.2 Verification and Practical Limits

Verification includes actual stored CRUD, FK integrity, overlap checks, wrong credentials, selected-role/account mismatch, other-tenant denial, database reopen, backup reopen, password reset, and last-Admin protection. Screenshots use isolated sample data. The local demo uses data/demo; databases and local configuration are ignored by Git.


<!-- PAGE BREAK -->

## 5. Development Progress per Checkpoint

| Checkpoint | Evidence-supported accomplishment | Status |
| --- | --- | --- |
| 27 September — first checkpoint | Pre-consultation implementation and testing evidence unavailable. | To Be Confirmed |
| 4 October — second checkpoint | A later scheduled consultation; dated accomplishments also unavailable. | To Be Confirmed |
| 11–12 October — later reference | 25-test record, then a 26-test routing update; neither establishes September completion. | Later evidence only |


## 6. QA Findings and Issues Encountered

Foundation findings included duplicate tenant identities (QA-001), volatile storage (QA-002), missing API authorization (QA-003), dropped listeners (QA-004), simulated login (QA-005), and inactive CRUD (QA-007). October tests verify the core corrections. The later logout/menu-listener defect is separately covered by T26; prior results did not expose that interaction.


## 7. Improvements and Corrective Actions

Corrective actions replaced the mock adapter with SQLite, established permanent keys and valid relationships, required backend credentials and ownership, connected forms, and retained outlet listeners. The password toggle was added for the localhost demo. Logout now disposes the old shell and returns to /login; new-role routing checks permissions and ignores old-session responses. These are later verified improvements, not September completion claims.

The original October QA matrix records 24 locally verified findings and two external acceptance gaps. T26 adds a later routing regression; those counts are different measures. A passing suite does not prove complete agreement with the approved manuscript, live provider delivery, or every supported browser.

Evidence classification: tested means the recorded local behavior passed; inspected means source or documentation was read; pending means required acceptance is outstanding; To Be Confirmed means historical attribution lacks dated evidence. These categories prevent UI appearance or an implementation claim from being treated as proof of operation.


<!-- PAGE BREAK -->

## 8. Ongoing System Development

The foundation evidence still needs historical confirmation. Current open work concerns manuscript alignment, historical tenancy boundaries, provider-document acceptance, live integrations, and production security. The researchers’ next iteration should use the approved requirements and recorded implementation gaps rather than an assumed completion percentage.


## 9. Next Development Priorities

1. Confirm September records and freeze one manuscript/build reference before attributing foundation progress.
2. Verify permanent identities, foreign keys, persistence, session isolation, backup, and recovery.
3. Demonstrate property/unit/tenant CRUD and protected historical changes with dated evidence.
4. Validate OCR samples, mapping rules, rent cycles, shared centavos, and unresolved exceptions.
5. Confirm report/reject/confirm consistency and unique receipts under repeated requests.
6. Configure real mailbox and push acceptance separately from localhost demonstration.
7. Preserve dated integration results and clarify remaining manuscript gaps before evaluation.


## 10. Conclusion

The first checkpoint’s actual implementation history remains unconfirmed. The researchers now have a tested local foundation, but it would be inaccurate to backdate that evidence to September. This report provides a detailed later reference while keeping historical claims and future priorities distinct.


## Evidence and Reproduction Notes

Evidence: approved 40-page FINAL_MANUSCRIPT.pdf and finalized-paper audit from recorded origin/main; local docs/qa-report.md; backend/browser/routing tests; dated Git records and inspected source. Earlier QA used a distinct 51-page reference. Later branch changes were inspected, not merged. Test fixtures are not operational transactions or participant evaluation.

Local demo: http://localhost:8080/#/login. In the portal directory, npm.cmd test reproduces the suite with isolated test databases. Email credentials and push keys are configured locally and are not included in these reports. No application code was changed to generate the documents.

