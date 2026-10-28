# Staff revision: implementation and handoff

Updated 23 October 2026. Implemented following the user's authorization. This document supersedes proposed-only wording in the earlier consolidated review. It does not claim adviser approval, public deployment, completed participant evaluation or representative OCR accuracy.

## Responsibilities

| Role | Daily work | Authority boundary |
| --- | --- | --- |
| Admin | Create/manage accounts, roles and business workspaces; search/filter all accounts; maintenance | No impersonation or rent confirmation |
| Staff | Workspace intake/upload/sync, operational records, investigate exceptions, add notes/escalate, prepare source corrections | Existing descriptive fields only; no billing setup, enrollment, mapping, rent confirmation, final-cycle credit or proposal authorization |
| Manager | All workspace operations, setup, occupancy, financial decisions, direct correction and proposal decisions | Own workspace only; confirms rent, never provider settlement |
| Tenant | Own bills, rent reports/receipts, utility personal tracking, permitted notifications/calendar | No operational intake access or other Tenant records |

Manager retains operational capability for cover and exceptional cases. Staff handles routine work; valid extracted bills still proceed automatically. No additional approval is required for every valid bill or every Manager action.

## Correction workflow

1. A failed/unfinalized utility source appears in Bills > Exceptions.
2. Staff reads the original and adds investigation notes, or selects Prepare correction.
3. One multi-field proposal per source may be pending. Proposed fields and reason are stored separately; live extracted values and bills stay unchanged.
4. Manager opens the same Exceptions page and authorizes or rejects. Reject requires a reason.
5. Authorization checks current source, related mappings/units/Tenants/settings and preparer's active Staff membership. Changed context produces `stale` and requires a fresh proposal.
6. All fields are applied and the existing validation/allocation engine runs in one transaction. Failed validation rolls back the source, corrections and generated billing changes; the proposal becomes `returned` with reasons. Success becomes `applied`.
7. A decided proposal cannot be approved again. Actor, previous/proposed values, reasons and decision times remain in history.

States: `pending`, `applied`, `rejected`, `stale`, `returned`. Applied means corrected and successfully revalidated, not payment verified. Manager may still correct directly using existing controls. Configuration and finalized-bill cases stay Manager-controlled; Staff escalates with notes.

## Existing-record fields Staff may change

- Property: name, letter, address, city, type.
- Unit: code, floor, floorNumber, type.
- Tenant: fullName, phone, emergencyContactName, emergencyContactPhone.

Staff cannot create these billing-linked records, delete them, change rent/lease/occupancy, change utility mappings, or edit a Tenant's login email. Account and role changes remain Admin functions. Staff can edit their own permitted profile and password.

## Code and data

- `server/staff-workflow.js`: proposals, contextual freshness, atomic decisions and investigation notes.
- `server/service.js` and `server/index.js`: server-enforced roles, ownership, descriptive fields and financial restrictions.
- `server/store.js`: additive workspace-scoped `correction_proposals` table. Existing database IDs/records are preserved.
- `src/auth/rbac.js`, navigation and shared pages: role-relevant controls; hiding a button is never the authorization boundary.
- Shared components remain one application. Module separation reduces duplication; it cannot guarantee an import/shared-code failure will affect only one role. Cross-role browser tests cover regressions.

No new dependency, service or framework was added. Email remains rent-only. Portal/Web Push still support rent and utilities. Rent estimates stay labelled; utility dates require received validated bills. Equal allocation and original receipt reuse remain unchanged.

## Try the Staff account in the existing Group 3 demo

From `SeCapstone/rentara-portal`:

```powershell
npm run demo:staff:prepare
```

This refuses an unprepared/non-Group-3 database and creates a timestamped SQLite backup before migration. It adds `staff.group3@example.test` with initial local demo password `LocalDemo!2026`. Re-running preserves an existing account/password. It does not reset Tenants, bills, mappings or receipts, and does not access/send email.

Restart the running Group 3 process to load new server code, using the same command/options you already use. For the labelled mailbox demo:

```powershell
npm run demo:group -- --receive
```

Open the URL printed by that command (normally `https://localhost:8444/` on the laptop). Phones use the laptop's current LAN IP and the same printed port. Certificate trust, shared network and firewall remain necessary. Login now uses ordinary email/password entry, without role-selection/demo buttons. Admin can also create a Staff account in the intended workspace.

## Verification and remaining acceptance work

Automated checks use disposable test databases and include real browser interaction. New checks cover Staff/Manager/Tenant/Admin navigation, API denials, proposals without live mutation, atomic rollback, stale/disabled preparers, duplicate decisions, workspace isolation and migration preservation. See the latest dated entry in [QA report](qa-report.md) for the completed full-suite result.

The Gmail filter and one authorized, self-addressed synthetic scanned-bill email were verified on 23 October 2026; this is not an actual provider-origin sample. See the latest QA report. Still manual: two Android devices over the current HTTPS address; Web Push permission/delivery; authorized live rent-email delivery; visual review of final exported diagrams/manuscript PDF; group/adviser review. No external mail or real-device check is implied by an automated pass. Web Push is retained and deferred, as requested.

The editable Chapter I/II Markdown and all three draw.io files were revised. The original submitted PDF is not rewritten automatically. Keep the fixed research title and existing citations when transferring the revised paragraphs.

## Team handoff

Use [turn-taking on main](team-branch-workflow.md): claim a turn, pull before editing, make one complete change, test, commit/push manually, then hand off. No commit or push is performed by this implementation task. Preserve local credentials and live demo data; never reset them to make tests pass.
