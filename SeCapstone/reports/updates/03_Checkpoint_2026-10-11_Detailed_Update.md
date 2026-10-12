# System Development Progress Report — Checkpoint 3

**Intelligent Property Management Workflow with OCR-Enabled Automated Billing Classification and Tenant Notification**

Group 10

Members: Casas, William Jake D.; Estayani, Khristian Maenard D.; Magtapat, Jullian Matthew B.

Consultation: 11 October 2026 (Online). Prepared for submission: 12 October 2026.

Third Checkpoint — Verified Integration and Subsequent Demo Repairs

Methodology: Iterative Software Development Methodology.

<!-- PAGE BREAK -->

## 2. Introduction

The third-checkpoint report presents the recorded integrated system milestone and the subsequent 12 October localhost/demo corrections. The researchers distinguish the 11 October test record from later fixes, remaining dependencies, and manuscript differences so that consultation progress is reported without inventing earlier accomplishments.


## 3. System Development Overview

The 11 October QA record reports 25 passing tests: 24 backend/integration scenarios and one real Edge browser scenario. Commit 990cfb3 is dated 11 October at 22:08:49 Philippine time; the consultation time was not supplied, so before/after consultation placement remains unconfirmed. After that checkpoint, the password toggle, persistent localhost demo, and logout/routing repair were verified; the local suite now passes 26 tests.

The three reports distribute the same current system across foundation, billing integration, and payment/tenant/testing themes. Dates are consultation labels; undocumented completion dates are not inferred. Module statuses refer to the later inspected reference, and source paths are relative to SeCapstone/propertypro-portal.


## 4. Accomplished Features — This Report’s Scope

**Feature/Module:** Payment Reporting and Confirmation

**Development Status:** Partially implemented

**Accomplishments:** Full-balance reports, validated methods/references, Manager confirmation/rejection, retained rejected history, and synchronized bill lines are implemented.

**Current Limitations:** Recorded rent-only confirmation and personal utility tracking revisions are not fully adopted.

**Evidence:** server/service.js; T04, T17; payment-policy revision notes.

**Feature/Module:** Digital Receipts

**Development Status:** Completed locally

**Accomplishments:** Confirmed payments produce protected unique receipts; repeated confirmation returns the existing receipt without another payment.

**Current Limitations:** The later branch’s Manager-approved credit settlement and receipt reuse were not re-tested in the active local build.

**Evidence:** server/index.js; service.js; T04, T23, T25.

**Feature/Module:** Tenant Dashboard

**Development Status:** Completed locally

**Accomplishments:** The portal presents the authenticated tenant’s unit, bills, balances, statuses, receipts, documents, and inbox. Tenant Bills reload and role switching are now verified.

**Current Limitations:** Policy revisions must be reflected consistently in future displays.

**Evidence:** src/features/tenant/; T10, T23, T25, T26.


<!-- PAGE BREAK -->

## 4. Accomplished Features — Continued

**Feature/Module:** Web Push Notifications

**Development Status:** Partially implemented

**Accomplishments:** Service-worker handling, subscription infrastructure, encrypted requests, retries, persistent portal alerts, and three-day Philippine-date reminders exist.

**Current Limitations:** External delivery, actual devices, and the precise cutoff remain unverified/incomplete; later generic-message changes are outside the active build.

**Evidence:** sw.js; server/integrations.js; T08, T22, T25.

**Feature/Module:** Logout and Role-Routing Repair

**Development Status:** Completed locally

**Accomplishments:** The researchers reproduced the old menu listener replacing login after logout and removed its listener/timer. Logout clears shell state and navigates to /login. Saved destinations must match the new role; delayed old-account responses cannot clear the new session.

**Current Limitations:** The portal has Admin, Manager, and Tenant roles; no separate Staff role was introduced.

**Evidence:** app/shell.js; app/app.js; api/client.js; login.page.js; T26.

**Feature/Module:** Integrated Development Testing

**Development Status:** Completed locally

**Accomplishments:** The latest suite passes 26 tests: 24 backend/integration scenarios and two real-browser scenarios. Coverage includes role switches, Tenant Bills reload, shared cents, corrections, receipt idempotency, persistence, backups, extraction, and controlled push retry.

**Current Limitations:** Development checks are not participant evaluation, provider acceptance, or production certification.

**Evidence:** tests/backend.test.js; browser.test.js; routing.browser.test.js; QA report, 12 October.


## 4.1 Connected Workflow and Controls

Financial workflow: a Tenant reports the full outstanding bill with a supported method and required reference; the report awaits Manager verification outside the system. Rejection records a reason and retains history; confirmation synchronizes lines and creates one receipt. Repeated confirmation reuses that receipt. No bank, wallet, or utility-provider settlement is verified automatically. Payment-policy drafts are not fully adopted.


## 4.2 Verification and Practical Limits

The five selected quality characteristics have bounded development evidence: Functional Suitability through workflow tests; Performance Efficiency through small-fixture measurements; Interaction Capability through desktop/mobile and keyboard checks; Reliability through persistence/retries/recovery; Security through roles, sessions, and ownership. The latest 50-request/3-bill local sample averaged 1.89 ms (p95 3.15 ms, maximum 3.86 ms); it is not a load benchmark.


<!-- PAGE BREAK -->

## 5. Development Progress per Checkpoint

| Checkpoint | Evidence-supported accomplishment | Status |
| --- | --- | --- |
| 27 September / 4 October | No dated evidence establishes pre-consultation implementation. | To Be Confirmed |
| 11 October — third checkpoint | 25-test QA milestone and dated integrated commit; consultation cutoff unavailable. | Verified dated record; meeting placement unconfirmed |
| 12 October — subsequent update | Password visibility, active localhost demo, and role-switch/routing regression; 26 tests pass. | Verified locally after checkpoint |


## 6. QA Findings and Issues Encountered

Financial/UI findings included unsynchronized line statuses (QA-016), duplicate confirmations/receipts (QA-017), invalid payment methods (QA-018), stale authentication (QA-019), read-state failures (QA-020), wrong role navigation (QA-021), stale dashboards (QA-022), and disconnected downloads/exports (QA-015/023). Local corrections pass. QA-013 remains partial because real external background push has not been demonstrated.


## 7. Improvements and Corrective Actions

The researchers linked reports, confirmations, rejection reasons, bill lines, and unique receipts in stored workflows. On 12 October, they initialized the persistent localhost demo and verified all three real logins and password toggles. T26 adds the reproduced logout fix, permitted saved-link checks, mobile expiry cleanup, and old-token 401 isolation. The full 26-test suite passed after these changes.

The original October QA matrix records 24 locally verified findings and two external acceptance gaps. T26 adds a later routing regression; those counts are different measures. A passing suite does not prove complete agreement with the approved manuscript, live provider delivery, or every supported browser.

Evidence classification: tested means the recorded local behavior passed; inspected means source or documentation was read; pending means required acceptance is outstanding; To Be Confirmed means historical attribution lacks dated evidence. These categories prevent UI appearance or an implementation claim from being treated as proof of operation.


<!-- PAGE BREAK -->

## 8. Ongoing System Development

The current local build and recorded origin/main branch differ: the latter contains explicit Manager credit approval, generic push text, and revised policy notes, but has not been merged or freshly tested here. Live intake/push, actual provider/device acceptance, paid linked revisions, missing rent recipients, and precise reminder/recovery policy remain open.


## 9. Next Development Priorities

1. Reconcile the approved manuscript and active build; retain relationship, persistence, and security checks.
2. Preserve tested CRUD and clarify historical transfers, renewals, and separate-Manager ownership.
3. Connect a real property-management mailbox and validate selected documents against checked field values.
4. Finish approved credit behavior, paid linked revisions, missing-recipient exceptions, and missed-cycle recovery.
5. Reconcile rent-only confirmation/utility tracking drafts and verify original-receipt reuse without duplicate money.
6. Implement the precise Philippine-time cutoff and verify HTTPS background push on actual devices.
7. Re-run the adopted build’s suite and conduct representative-sample/device/participant evaluation.


## 10. Conclusion

The researchers have a locally integrated system with 26 passing development tests and a working localhost demonstration. The routing defect reported after the third checkpoint is corrected. External acceptance, policy/build reconciliation, and remaining manuscript requirements must be completed before full-system or production readiness is claimed.


## Evidence and Reproduction Notes

Evidence: approved 40-page FINAL_MANUSCRIPT.pdf and finalized-paper audit from recorded origin/main; local docs/qa-report.md; backend/browser/routing tests; dated Git records and inspected source. Earlier QA used a distinct 51-page reference. Later branch changes were inspected, not merged. Test fixtures are not operational transactions or participant evaluation.

Local demo: http://localhost:8080/#/login. In the portal directory, npm.cmd test reproduces the suite with isolated test databases. Email credentials and push keys are configured locally and are not included in these reports. No application code was changed to generate the documents.

