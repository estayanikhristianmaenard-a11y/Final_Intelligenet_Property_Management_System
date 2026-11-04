# Staging integration review - 4 November 2026

## Result and scope

Integrated remote staging `18c4510` into local `main`, previously `1e04069`. Staging already contained the existing main/UI history, so Git advanced main by two commits without rewriting history. This incorporates `6cc9a61` (system/manuscript/testing-kit revision) and `18c4510` (combined UI/sidebar finalization). No push was performed.

The incoming range changes 203 tracked files (+8513/-335 text lines), including 12 server files, 23 frontend JavaScript files and 16 test files. Reviewed the runtime differences with emphasis on access control, profile isolation, delivery, validation and retained financial rules. Manuscript/diagram/testing artifacts were carried forward as committed; this integration is not a new academic or PDF-layout review.

No new blocking regression was confirmed during the source review or combined test run. Recommendation: accept this local integration for continued manual testing. The existing actual-device/live-service acceptance work remains. This is a focused differential review, not a comprehensive penetration test or public-deployment approval.

| New unresolved findings | Count |
| --- | --- |
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |

## Local work and conflict resolution

Two existing uncommitted files were preserved before the update: `docs/qa-report.md` and `tests/ui-audit.browser.test.js`. Backup patch: `data/pre-staging-local-qa-2026-11-04.patch`. Retained safety stash: `7ad2b243b9e117c3d7cbb3eef35621fa1fd0c185`, named “Preserve local QA edits before staging integration 2026-11-04”.

Restoring these edits caused one documentation conflict at the top of the QA report. Both histories were kept in date order. The theme guards applied cleanly to the expanded staging audit, including its Admin workspace route. Both files remain unstaged, matching their original local-edit state. No source conflict or custom runtime rewrite was needed, and the safety stash remains available.

## Priority review and callers

| Area | Risk | Review |
| --- | --- | --- |
| `server/admin-visibility.js`, Admin route and client view | High | Dedicated Admin-only GET capability; explicit workspace/record checks and response allowlists; financial writes and private original/raw-file access remain unavailable. |
| `server/profile-policy.js`, workspace integrations, mailbox intake and delivery | High | Demo delivery opt-in/recipient/session restrictions at send points; fixed profile data separation; mailbox-label collision checks; label-aware message history and deduplication. |
| `server/service.js`, scalar money validation | High/medium | Public-user allowlist, typed/bounded values, useful normalized-email conflicts, preference opt-outs, scalar centavos and typed references. Previous numeric-floor/phone/lease checks retained. |
| Operational/Group 3 preparation and startup tools | Medium | Explicit profiles, isolated paths and validation; Bayan fixture now submits numeric floor 0, compatible with main's validator. No working-profile setup was run during integration. |
| Sidebar motion and shell lifecycle | Medium | Expanded default, optional rail/hover/focus reveal, active marker, disposed observers/listeners and reduced-motion handling; existing role filtering remains. |
| Tenant search/details/billing presentation | Medium | Debounce/cancellation, shared personal-information presentation and billing-summary changes retain existing ownership/financial actions. |
| Test and presentation changes | Low | Existing Fresh Mint code is preserved; local palette/spacing regression guards were restored. Package scripts changed; dependency/lockfile replacement was unnecessary. |

Direct call-site review found one `adminWorkspaceRead` HTTP dispatch; five `recipientAllowed` send/subscription checks across Push and rent email; and one `restrictProfile` configuration return plus one `validateMailboxes` wrapper used at initialization/runtime selection. `publicUser` remains used by identity, account-write responses and the Admin user-list mapping. These are bounded direct-call counts, not a complete dynamic call graph. Changes to profile policy affect scheduler, manual mailbox synchronization, Push configuration and both delivery transports.

Git history attributes the profile/Admin additions to `6cc9a61`; the integrated sidebar code is delivered by `18c4510`. The earlier main validation/UI work remains in staging's ancestry, so it was not replaced with an older tree. No access-control guard was removed as a conflict resolution.

## Concrete boundary checks

- Non-Admin callers must be denied the Admin inspection API; mutation verbs must be refused. Original files/raw extraction and nonallowlisted nested fields must not appear in read responses. Covered by Admin visibility API/browser cases.
- Admin inspection must not create rent approval authority. Existing real pending-report tests require the owning Manager to confirm, while Admin remains denied.
- Demo/workspace switches must not bypass send-point restrictions or consume queued delivery state. Profile safeguards exercise enabled keys, workspace overrides, old subscriptions, recipient/session bounds and separate mailbox labels using test transports.
- Same UID in another mailbox must not hide a new message; old processed/failed history must remain safe and duplicate billing must stay blocked. Mailbox/profile tests cover these cases.
- Duplicate email, malformed text/preferences/amounts/references must fail before changing records; partial preference edits must preserve opt-outs. New input regressions cover these paths.
- Restored local theme guards must still pass on the new Admin route, sidebar behavior and existing bill/report layouts. The full browser audit includes these checks.

## Verification and limits

Full combined run: **155 passed, 0 failed, 0 cancelled, 0 skipped**, approximately **374 seconds** (`data/staging-integration-2026-11-04.log`). Syntax check: **152 JS/MJS files, zero failures** (`data/staging-syntax-2026-11-04.json`). Integration metrics: `data/staging-integration-metrics-2026-11-04.json`. No unresolved Git index entries remain. Final fetch reconfirmed that local main and remote staging both point to `18c4510`; local main is two commits ahead of `origin/main`.

No application server was listening on port 8080 before the integration, so no running old server had to be stopped. No working database, credential, original bill, local HTTPS setup or live delivery setting was reset. Tests use isolated data. Actual phones, live authorized provider intake/rent email/Push, physical printing and manuscript/adviser acceptance remain separate. The new profile setup commands were imported but were not run against local working data.
