# Final frontend/backend review - 2 November 2026

## Executive result

Reviewed the current working tree on `OVERALL-UI` against baseline commit `202d644` (the last committed jelly-motion pass). The later validation, decoration and spacing changes remain uncommitted. This is a focused differential review and regression run, not a penetration test, public-deployment approval or certification that every path is bug-free.

No new blocking vulnerability or functional regression was confirmed in the reviewed changes. Recommendation: suitable for continued local/manual acceptance, conditional on the real-device and live-service checks below. Authentication, billing and protected writes are intrinsically high-risk areas; the changed checks were reviewed accordingly rather than treating the entire change as cosmetic.

| New unresolved findings | Count |
| --- | --- |
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |

## Scope and baseline

The runtime contains 86 JavaScript source files in `src`/`server`. Reviewed the 14 changed/new runtime JavaScript files, emphasizing the two backend validation/authentication files and their storage/route callers. Inspected the new styles, local SVGs and HTML stylesheet ordering; reviewed test changes and sampled the refreshed screenshots. This is not a line-by-line security review of all 86 source files or all image pixels.

| Changed area | Review priority | What was checked |
| --- | --- | --- |
| `server/service.js` | High | Login normalization, profile validation/transaction boundaries, floor/phone validation, lease/assignment bounds, retained role restrictions. |
| `server/index.js` | High | Portal message types checked before trimming; Manager authorization and scoped Tenant lookup retained. |
| Three setup/showcase modules | Medium | Numeric floor fixtures match the new write contract; no resets or live setup was run. |
| `src/app/workflows.js` | Medium | One floor field serializes consistent floor values; password/phone constraints; conditional Tenant ID; existing save/error/discard behavior. |
| Modal, DOM and phone helpers | Medium | Escaped template content, local artwork paths, focus/dismiss guards, numeric entry/paste handling and server-side fallback validation. |
| Workspace artwork, login, billing and Tenant pages | Low/medium | Presentation-only markup preserves actions; Tenant profile checks do not replace API enforcement. |
| CSS, SVG and screenshots | Low | Local assets, noninteractive decoration, responsive layouts, readable headings, no new network dependency. |

Git blame traced the old login/profile/lease validation patterns to `990cfb38` and the scoped message route to `565eda86`. The present diff strengthens checks rather than removing role, ownership, transaction or amount validation. No checkout, history rewrite, commit or push was performed.

## Caller and data-flow review

Textual direct-call search in server source found:

- `service.login`: **1** call site, public login route; receives the socket address, not a client-supplied forwarded address.
- `service.profile`: **1** call site, authenticated profile route.
- `service.writeEntity`: **14** call sites, comprising two HTTP create/update dispatch sites and twelve development setup/showcase calls. Four entity types share the dispatcher, so compatibility and role checks were reviewed beyond the Unit form.

These are direct syntactic counts, not a complete dynamic call graph. API changes affect all roles that use profiles and both Manager/Staff descriptive edits. Shared rendering/form helpers have broader frontend reach, which is why the full all-role browser and form tests are required.

Baseline invariants retained: workspace ownership on reads/writes; Tenant-own records; Staff descriptive edits/proposals only; Manager-only rent decisions; personal utility marks without provider settlement; equal allocation and exact amounts; preserved receipt/history identifiers; rent-only email; no predicted utility bills.

## Adversarial checks and regression coverage

| Entry / scenario | Result reviewed |
| --- | --- |
| Public login with padded/case-varied email | Same normalized counter is used for lookup and throttling; existing regression verifies the limit cannot be reset with spaces. |
| Authenticated profile with array email, object/oversized name or invalid phone | Validation rejects malformed values before persistence; regression verifies identity remains unchanged. |
| Manager/Staff entity writes with letters, decimals, negative/conflicting floors or malformed phone values | Shared service checks reject invalid input; UI constraints are supplementary. Historical floor labels remain on unrelated edits without a bulk migration. |
| Manager assignment start after lease end with blank termination | Rejected before default end-date handling; existing record remains unchanged. |
| Manager portal message with array-valued subject/body | Returns a validation error rather than a trim exception; no message is created. Manager/scoped-recipient checks remain. |
| Tenant/Staff/Admin attempts at unauthorized financial/other-account operations | Existing role, ownership and workspace-isolation tests remain in the full run; these boundaries were not broadened by the changes. |
| Rapid/repeated UI actions, reduced motion and unsaved edits | Existing feedback/browser tests cover protected submission, focus/discard behavior and enabled/reduced motion. |
| Incoming Bills spacing | Audit now includes at least two sources and a long filename; checks action placement, filled/aligned fact columns and report-card natural height across the all-role page run. |

Changed high-risk functions have service/API regression coverage; no untested changed high-risk function was identified. This is not a statement of complete branch coverage. The new source fixtures are layout data, not evidence of OCR accuracy or actual provider bills.

## Verification evidence

- Full frontend/backend run: **105 passed, 0 failed, 0 cancelled, 0 skipped**, approximately **263 seconds** (`data/final-frontend-backend-test.log`). Includes the final spacing fixtures/guards and current validation changes.
- JavaScript syntax: **133 files checked, 0 syntax failures** across `src`, `server`, `tests` and `tools`.
- Running local website responded HTTP **200** at `http://localhost:8080/`.
- `git diff --check` passed.
- Recent visual evidence: refreshed 49-screen gallery, Incoming Bills desktop/tablet captures, and the spacing audit described in the preceding QA entry.
- Tests use isolated synthetic databases. No live mailbox retrieval, external message sending, working-data reset or restore over the running portfolio was performed.

## Remaining acceptance and limits

Physical-phone keyboards/paste/scrolling and motion feel, actual printing, live authorized rent email, real Web Push delivery/tap destinations, and actual provider bill formats remain manual acceptance items. Showcase intentionally disables external transports; simulated/test-transport success does not prove live delivery. The intended-device restore rehearsal must use a separate destination.

No new runtime fix was needed during this final review. No dependency/package update, database migration, production configuration change or Git push was made. Current work remains local on `OVERALL-UI`.
