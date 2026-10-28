# Rentara: consolidated revision review

**Implementation update, 23 October 2026:** The user subsequently authorized this revision. Staff, scoped permissions, correction proposals, Manager decisions and shared UI are now implemented. The planning observations below are retained as historical context; see [current implementation and test handoff](../../staff-implementation-plan.md).

Reviewed 23 October 2026. Read this once before implementing the Staff revision. This is a source-based planning review, not a new full test run, exhaustive security audit or adviser approval. Staff and proposal authorization are not implemented yet. No implementation, database changes or Git operations were performed for this review.

## 1. Existing work we should reuse

| Existing capability | Evidence inspected | Revision approach |
| --- | --- | --- |
| One login with server-authorized role | `src/features/auth/login.page.js`, `src/auth/session.js`, `server/service.js` | Remove/restrict demo shortcuts; do not build a second authentication system. The three buttons fill credentials; they do not currently grant a chosen role. |
| Shared feature pages, shell and route guards | `src/app/app.js`, `src/config/navigation.js`, `src/auth/rbac.js` | Extend permissions and adapt shared pages. No separate frontend application or duplicated Staff/Manager controllers. |
| Validation, corrections and retained revisions | `server/service.js` | Reuse the processing/correction engine; add proposal preparation and authorization around it. Do not invent another validation engine. |
| Scoped records, transactions and audit | `server/store.js`, `server/service.js` | Preserve workspace isolation and financial history. Add only missing proposal/attribution information. |
| Admin account and maintenance functions | `src/features/admin/`, `server/service.js` | Improve search/grouping and navigation over existing actions. Do not reimplement accounts from scratch or silently remove audit access. |
| Utility extraction, allocation and permitted alerts | `server/integrations.js`, `server/rules.js` and the current scope | Preserve automatic valid-bill processing, exact-centavo equal allocation and rent-only email. |
| Reports, search, calendar, receipts, backup/recovery | Existing application routes and API contract | Keep existing approved support functions. A shorter menu is not authorization to remove them. |

Frontend role constants, navigation and RBAC currently define Admin, Manager and Tenant only. Backend operations are also explicitly role-restricted; adding a menu entry or a Staff role constant alone will not implement Staff safely.

## 2. Required revision checklist

| Area | What to do | What to avoid |
| --- | --- | --- |
| Login | One normal form; authenticate then route by actual role. Make demo autofill an explicit trusted development setting or remove it from the normal view. | Treating a private IP or `?demo=1` alone as proof that demo controls should be enabled. |
| Staff role | Add account validation, role labels, home route, navigation, backend checks and reproducible test accounts together. | Broadly changing every Manager check to Manager-or-Staff. |
| Staff operational pages | Allow the agreed scoped reads, uploads, monitoring and descriptive edits. | Sending Manager-only API requests during Staff page initialization and hiding only the controls afterward. |
| Field restrictions | Check direct writes on both create and update paths, including relationship IDs and bulk/action endpoints. | Allowing Staff to alter rent or occupancy through a create request or a different endpoint. |
| Manager | Retain operational abilities plus sensitive decisions; prioritize decisions on the dashboard. | Removing upload/encoding ability merely because Staff usually performs it. Manager authority still cannot bypass safeguards. |
| Corrections | Staff submits a bill-exception proposal with reason; original live values stay unchanged. Manager approves/rejects or corrects directly. | Proposal systems for every account/property action in the first delivery. |
| Concurrent changes | Check freshness, permissions, current mapping/eligibility, validation and application in one transaction. Apply each proposal once. | An old proposal overwriting new corrections or repeated approval generating another bill/alert. |
| Proposal life cycle | Keep only needed states, clearly distinguishing pending decision, rejection, stale/failed proposal and successful application. Return rejected/stale work with a reason. | A generic Approved badge being mistaken for successful billing, payment confirmation or verified provider settlement. |
| Accountability | Capture actor from authenticated context, source/previous values, proposed/new values, reason, decision and times. | Trusting submitted actor/role/workspace fields or duplicating audit content without a purpose. |
| Account changes | Respect deactivation, role changes and current workspace membership when an action is executed. Preserve action history. | A disabled Staff/Manager still using old access or a pending proposal being approved without rechecking current authority. |
| Admin | Searchable account directory plus a business filter/member view using the same components. Preserve account/maintenance boundaries. | Impersonation or copying a Manager's operational dashboard into Admin. |
| Navigation | Keep shared components with role-relevant menu entries and actions. Start from the existing page inventory. | A menu full of irrelevant view-only destinations or moving operational intake to Admin maintenance. |
| Tenant | Preserve rent-first Home, tracker below it, own utility history, rent reporting, confirmed receipts and labelled rent estimates. | Exposing raw intake/other Tenants' records or merging rent Paid with personal utility marks. |
| Interface | Improve readable type, spacing, contrast, actionable labels, button sizes, mobile layout and clear loading/error feedback. | Another full visual rewrite, heavy animation, or claiming usability improved before evaluation. |
| Phone access | Verify trusted HTTPS, current LAN origin/port, browser permissions and correct authenticated links on actual devices. | HTTP 200 alone being counted as proof that the interface rendered or Push works. |
| Email setup | Create the one-time routing filter and verify the dedicated-label journey. Preserve explicit live-send/receive controls. | Assuming automatic label creation also creates a Gmail filter, or enabling rent email over historical demo arrears without reviewing recipients/events. |
| Data migration | Back up first; preserve existing IDs, records, source files, receipts and roles. Use one schema owner and migration checks. | Resetting the working database or reusing the earlier demo date-alignment scripts as normal tenancy-edit tools. |
| Documentation | After decisions and implementation, update only affected user guides, manuscript paragraphs and diagrams. Keep exact labels consistent. | Presenting Staff as implemented now or rewriting the fixed title, entire chapters or approved scope without need. |

Shared modules reduce duplication; they do not guarantee that a Tenant-page code error can never affect other roles. The current bootstrap imports all page modules, so shared/import failures need cross-role regression checks. No separate app/service architecture is proposed for this revision.

## 3. Four decisions to settle before implementation

| Decision | Recommended first-delivery boundary |
| --- | --- |
| New Tenant/unit enrollment | Staff can edit allowed descriptive fields on existing records. Manager creates/activates billing-linked units and occupancy initially; Staff can prepare details. The existing Tenant-create operation requires unit and lease/assignment dates, so unrestricted Staff creation would grant billing authority. A richer Staff draft-enrollment flow can be decided separately. |
| Login accounts and contact email | Keep Admin creation/role/workspace management initially. Distinguish contact data from login identity; Staff must not indirectly change a user's login account. Retain permitted own-profile functions. |
| Staff data visibility | Own-workspace intake, exceptions and necessary operational details; rent status and existing receipts view-only if confirmed. Select specific existing report/export access after inspecting their contents. No general grant of every Manager financial summary. |
| First proposal scope | Incoming utility-bill exception fields only. Configuration requests can be escalated with notes and performed by Manager. Post-finalization financial corrections remain Manager-controlled; no duplicate override, utility-payment verification or automatic credit authority. |

These are recommendations for user review, not silently approved permissions. The main role split stays: Staff handles daily operations; Manager retains operations and sensitive authority; Admin manages access/maintenance; Tenant controls own permitted actions.

## 4. Defer unnecessary additions

- Permanent three-branch process: the group chose turn-taking on main. Use the [team guide](../../team-branch-workflow.md); optional temporary branches remain useful for unfinished/risky work.
- Separate Staff/Manager apps or copies of each page.
- Separate Approvals and Escalations modules when Exception Queue filters can serve the task.
- Mandatory second Manager review for direct authorized corrections.
- Approval on routine valid bills or a human step after every OCR extraction.
- A custom per-user permission builder, generalized approval platform or new account-proposal system.
- New duplicate acknowledgement/linking controls for the first delivery. Preserve existing duplicate protection and records.
- Admin impersonation, arbitrary allocation formulas, manual receipt issuance and a broad demo-reset UI.
- Renaming/restructuring every folder or deleting support features solely to make the project look smaller.

## 5. Proof required before saying the revision works

1. A valid upload/email bill processes automatically for the correct workspace, unit and Tenant, with exact shares and permitted notifications.
2. Staff direct restricted-field writes and forbidden rent/advance/account actions fail without changing records. Check create/update paths, not only buttons.
3. A Staff bill-correction proposal preserves live values. Manager authorization applies only a current, valid change, with attribution and retained history.
4. Rejection, stale changes, failed validation, two decision attempts, Manager direct correction and a disabled/moved account have clear, safe outcomes.
5. Tenant-own records and workspace isolation remain enforced. Authorized Admin account/maintenance access is an explicit exception, not a billing permission.
6. Rent report/confirmation/rejection, direct recording, original receipt reuse, advance rules and Tenant-only utility marks still behave correctly.
7. Shared pages initialize successfully for each role; login/role redirects, read-only actions, mobile layout and notification links work.
8. Existing data migrates without loss; relevant targeted checks pass, then the integrated regression run passes. Record the actual tested commit.
9. Real-phone HTTPS, Push display/opening, rent-email links, Gmail filtering and real provider samples are recorded separately. Synthetic local tests do not establish these outcomes or representative OCR accuracy.

The existing complete-suite result predates this proposed revision. It must not be presented as a passed Staff regression suite. This review did not run a new full suite or inspect every line/file.

## 6. Small implementation order

1. Confirm the four decisions and record the final permission/API contract after the relevant code inspection.
2. Add Staff identity/scoping and one complete permitted upload-to-Tenant journey.
3. Add the limited exception-proposal/Manager-decision flow using existing validation and history.
4. Adapt shared pages, login and role navigation; improve Admin account grouping and focused UI issues.
5. Verify migrations and all affected roles, then complete device/integration acceptance and update the affected documentation/diagrams.

No new framework, payment gateway, SMS, provider-app access, predictive utility dates or model training is part of this work. See [capstone boundaries](../../capstone-scope.md) for the preserved workflow.
