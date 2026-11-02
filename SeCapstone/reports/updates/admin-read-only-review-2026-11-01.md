# Admin workspace visibility: implementation and security review

Reviewed 1 November 2026. User-authorized revision; not a claim of adviser confirmation, penetration-test certification, participant evaluation or public deployment. Baseline Git HEAD is `7903d4c`; this revision is uncommitted. Earlier unrelated working-tree changes were preserved. No Git commit/push, real financial-record edit or external delivery was performed.

## Outcome and risk

Admin retains account/system maintenance and can explicitly inspect workspaces. Manager/Staff membership and Tenant ownership remain enforced. Admin gains no financial actions, operational editing or private-original access. The change is high-risk by category because it expands a read authorization boundary, even though no money calculation or authentication contract changes.

| Review result | Count / status |
| --- | --- |
| Confirmed critical/high/medium vulnerabilities introduced in reviewed paths | None identified in this targeted review |
| Admin runtime files reviewed | 11 |
| New regression cases | 3 HTTP/security cases and 1 browser journey |
| Existing shared Tenant summary cases checked | 8 passed |
| Full regression result | Latest security follow-up: 144 passed; earlier Admin checkpoint: 138 plus 12 focused |
| Recommendation | Proceed with the bounded read capability; retain manual acceptance and manuscript-alignment work |

No findings is not proof that no exploitable issue exists. This is a focused differential review of this revision, not an assessment of every dependency, operator configuration or existing account-administration feature.

## Changed paths and blast radius

`server/admin-visibility.js` contains the Admin-only reader and response projections. `server/index.js:210` dispatches the new API after ordinary authentication, without removing existing role/ownership checks. Git blame identifies the retained authentication and scoped-dispatch baseline at commit `565eda86`; there is no deleted authentication or ownership guard in this revision.

`src/features/admin/admin-workspace.page.js` is the read-only composition. Existing Admin Dashboard and Users & Roles provide entry links; the shell, route registry and capability map expose the page only to Admin. `src/features/tenants/tenant-personal-info.js` is shared with the existing Tenant operational Overview. `src/features/billing/bill-details.js` adds observer wording with the existing default unchanged. App registration, RBAC, navigation, both Admin entry pages, shared contact/Overview and bill details complete the 11 runtime files.

Quantitative direct callers: the new server reader has one HTTP dispatch caller; the shared contact renderer has two runtime callers; bill details has two runtime callers (ordinary workflows and Admin inspection). The unchanged rent-receipt renderer is reused by the new authenticated HTML response. Broader browser/role tests cover effects through the common app shell and navigation. No schema migration, token format, role, profile, business module or calculation rule was introduced.

## Endpoint contract

`GET /api/v1/admin/workspace-view?workspaceId=ID` returns workspace counts and allowlisted property/unit/Tenant/bill records. Optional property/unit/search filters are validated. `GET /admin/workspace-view/tenants/:id`, `/bills/:id` and `/receipts/:id` resolve the record's workspace when omitted; an explicit mismatch returns 404. Non-Admin callers are rejected before global lookup. Writes to this API return 405.

The generated receipt supports `?workspaceId=ID&format=html`, using the existing escaped receipt snapshot renderer. This is not an uploaded private file. Tenant/bill/receipt inspections retain the actual Admin actor and inspected workspace in the audit log. Protected responses use existing no-store headers.

The new response contract excludes original file bytes, original filenames, storage identifiers/paths, document hashes, raw email/OCR text, full utility account references, government ID, authentication secrets and arbitrary nested record properties. File metadata is limited to type, recorded date and status. Missing historical dates remain missing. Extracted provider, dates and amount are visible only in the approved financial view. Structured proposal history for published utility bills is available; raw unfinalized sources, free-text investigation notes and private attachments remain restricted.

## Adversarial checks

An authenticated Admin token was used to attempt contact updates, record creation, rent recording/confirmation, utility marking, direct correction, Staff proposal/authorization, private source/document requests, Manager exports and mutations against the new reader. They were refused. Manager, Staff and Tenant tokens cannot invoke the Admin reader; a Manager-supplied workspace selector does not override membership on existing routes. Mismatched detail/related IDs fail rather than mixing records from different businesses.

A canary was placed in a disposable source's raw text, account reference, private fields, filename and storage reference, and in nested bill/allocations and Tenant/document fields. It did not appear in the new overview, Tenant or bill JSON. Generated-receipt HTML uses the existing escaping renderer, and its iframe is sandboxed; original source HTML is never embedded.

The browser journey checks selection and URL context, shared Tenant details, the absence of financial/edit actions, a permitted Manager contact update appearing after Admin reload, native Back, original receipt viewing, 820/390/320 px layouts and logout followed by Back. Tests use disposable databases and no external transport.

## Remaining limits and decisions

The authorization boundary is attached to the authenticated role, not an absolute sandbox around a person. Existing Admin powers include creating/resetting accounts; a trusted administrator who controls Manager credentials or the server filesystem has powers beyond an Admin inspection token. This revision does not remove those previously approved maintenance functions. Any stronger separation against a malicious system operator needs an explicit threat-model/scope decision, not a claim that hidden buttons solve it.

Existing global audit and recovery/backup administration remain unchanged. Recovery operators must handle private originals appropriately; web file-open denial does not encrypt documents away from the laptop operator. Real-device acceptance, broader performance/concurrency measurements and dependency/security testing remain bounded by actual evidence. The new read response currently follows the application's small-portfolio list model; large-scale pagination/load capacity has not been established.

Editable manuscript role descriptions, especially Chapter I Section 1.5 (maintenance-only Admin paragraph), Chapter II User Requirements and Chapter III role overview, and corresponding figure annotations must reflect this accepted visibility expansion before the next final export. Existing citations, title, research objectives and testing evidence must remain unchanged. The manuscript PDF and Google Doc were not regenerated by this implementation.

## Copy-and-paste prompt for Claude

```text
Review Rentara for concrete loopholes after this bounded Admin revision. Do not propose another redesign or new modules. If you cannot see code, label a concern as an assumption and ask for the relevant excerpt; do not claim a confirmed vulnerability.

Stack: Node.js 24+, SQLite, vanilla HTML/CSS/JS. Opaque hashed server sessions; no JWT migration. One business workspace may contain multiple properties. Manager/Staff belong to one workspace; Tenant accesses own records. Admin retains account/system maintenance and has explicit cross-workspace read visibility, without impersonation.

Implemented Admin reader:
- GET /api/v1/admin/workspace-view?workspaceId=ID, with propertyId/unitId/q filters.
- GET /admin/workspace-view/{tenants|bills|receipts}/:id. Record-derived workspace; supplied workspace must match. Admin-only; write methods denied.
- DTO allowlists expose profile/contact/unit information, bills/allocations/rent status, Tenant-recorded unverified utility marks, selected extracted provider/amount/dates, structured proposal history for published utility bills, generated rent receipt records and file type/date/status metadata.
- No original bytes/filenames/storage paths, raw email/OCR, full utility account references, government ID or credentials. Uploaded documents and raw unfinalized sources remain restricted. Generated rent receipt HTML reuses an escaped snapshot renderer, never an uploaded file.
- Manager-only financial authority and Staff proposals unchanged. New endpoint does not bypass old Manager routes. Account maintenance remains separately authorized. Specific detail views are audited as Admin.
- Admin workspace context is URL state, not a mutable session workspace. Shared contact/bill/table/receipt components, explicit read-only label, no financial/edit actions. Data appears after reload, not a new real-time module.

Review these invariants:
1. Direct-request permission checks, mismatched/forged workspace IDs, concurrent scopes and response-field leaks.
2. Private source/document URLs, generated versus uploaded receipts, HTML injection, errors/search/audit and logout/Back.
3. Existing Admin account/password-reset and backup powers: distinguish trusted-operator limits from an Admin-token API bypass. Do not silently remove approved maintenance functions.
4. Whole-workflow consistency: exact-centavo equal allocations, frozen recipients, rent anniversary/advance, personal utility tracking, duplicate source/account/period detection, and atomic Staff proposal revalidation.
5. Demo versus Operational controls, explicit live-demo allowlist/fresh events/devices, workspace Gmail routing and mailbox replay history. Wrong-label mail with a valid receiving-workspace mapping can process there; do not assume perfect routing.

Relevant files: server/admin-visibility.js, server/index.js, server/staff-workflow.js, server/service.js, server/profile-policy.js, server/workspace-integrations.js, server/integrations.js; src/features/admin/admin-workspace.page.js; tests/admin-visibility.test.js and tests/admin-visibility.browser.test.js. Ask for additional source before asserting implementation defects.

Return at most 10 prioritized concerns. For each: confirmed versus assumed, exact entry point, actor, reproduction steps, impact, existing defense and smallest in-scope fix/test. Separate bugs, expected policy trade-offs and optional improvements. No transfers, impersonation, Owner role, payment gateway, predictive utilities, SMS, microservices or automatic provider settlement verification. Do not equate synthetic tests with actual evaluation or certification.
```


## Completed verification

The full run passed 138 tests with no failures/cancellations/skips in 657,868 ms. The final directly affected follow-up passed 12 tests in 37,197 ms, including the Users & Roles shortcut and revised utility-mark display. Transcripts remain local in `rentara-portal/data/admin-read-only-full-test-2026-11-01.log` and `admin-read-only-focused-test-2026-11-01.log`. Syntax and whitespace checks passed. Existing working data/configuration was preserved. No live provider/device or participant result is inferred from these synthetic runs.


## Five-step verification follow-up - 1 November 2026

The user authorized the verification-focused follow-up after Claude's text-only review. All scenarios use disposable synthetic records. No external mail, real payment, live account reset or working-database edit is part of these checks.

### Confirmed response-projection gap and repair

The older `publicUser` helper removed `passwordHash` and returned every other stored user field. The new older-endpoint canary initially failed on `/admin/users`: deliberately stored reset/token/private fields were returned. This proves a permissive serialization boundary, not that actual tokens were present in live user rows or that a Tenant could store these fields through the public API.

`server/service.js` now projects only supported public account fields and the four boolean notification preferences. The change also protects the existing identity/profile responses that reuse this helper. Stored records, passwords and role rules are not rewritten. Account, preference and maintenance regression checks pass after the repair.

### Recorded focused checks

| Step | Scenario | Recorded result |
| --- | --- | --- |
| Malicious rendering | Tenant text; quotes in search/input values; javascript-like strings; email subject/body; controlled OCR output; contaminated stored display values; generated receipt | Passed in a real browser. Values remain text; no injected image/event-handler node or dangerous link is produced, and no attack marker executes. |
| Failed audit | A temporary SQLite trigger rejects detailed Admin inspection audit inserts | Tenant, bill, JSON receipt and rendered-receipt requests return errors containing no record payload. |
| Concurrent confirmation | Two different owning-Manager tokens send parallel requests for one actual pending rent report | Both return the same original receipt; exactly one receipt and one confirmation audit effect; amount retained to the centavo. |
| Concurrent authorization | Two owning-Manager tokens send parallel decisions for one pending Staff proposal | One succeeds and one returns 409; one applied correction, two PHP 300 bills, PHP 600 total, one applied-decision audit effect. |
| Older Admin outputs | Accounts, workspaces, service status, status refresh, backup reply, OCR restart, temp purge, audit JSON/CSV and generated receipt | Private canaries are absent after the serializer fix. Real note/reason text is not copied into audit targets. Existing global audit permission remains unchanged. |
| Main guard sensitivity | Four selected baseline tests, followed by deliberate source-copy bypasses | Four baseline passes and four intended assertion failures; no syntax/process failure counted as detection. |

The malicious-input test passes controlled OCR text into the existing ingestion boundary; it does not measure Tesseract recognition accuracy. URL checks establish that the selected application builds trusted routes instead of treating record text as URL destinations. HTML escaping alone is not claimed to validate URL schemes. No Content-Security-Policy change was required by an observed rendering failure.

Concurrency covers two Manager identities sending parallel HTTP requests to one Node/SQLite backend, matching the current single-main-laptop architecture. It does not establish multi-server/distributed correctness or formal race freedom. Audit failure uses an actual SQLite trigger, not merely a mocked successful return.

### Isolated-copy guard evidence

The successful experiment is retained locally at `rentara-portal/data/security-guard-checks/2026-11-01T13-13-56-457Z/results.json`, with eight baseline/negative transcripts and source hashes. Only `server`, `src`, `tests`, `tools`, the package manifest, public index and credential-free operational example were copied. No `.env`, runtime database, original private bill or dependency directory was copied. Isolated source copies were deleted after execution; the nine small evidence files remain. The working control-file hashes match the unmodified positive-control versions.

| Control | Deliberate fault in the copy | Detection |
| --- | --- | --- |
| Admin financial barrier | Insert an Admin-as-Manager confirmation bypass for an actual pending payment | Expected 403 assertion fails when the bypass returns success. |
| Field projection | Spread the full stored bill into the Admin DTO | Private canary assertion fails. |
| Workspace membership | Replace authenticated membership with a caller-supplied workspace before scoping | Foreign-Tenant ownership assertion fails. |
| Normal Demo clamp | Make the delivery-policy check always allow delivery | Disabled-configuration assertion fails; no actual transport is used. |

The first preliminary experiment remains at `data/security-guard-checks/2026-11-01T13-10-17-814Z`. Removing only the financial role check remained blocked by storage scope, demonstrating another defensive layer. Changing only request scope remained blocked by membership enforcement. One old test reported a type error for that denial; it was improved to assert an explicit safe response and nonempty ownership checks instead. These preliminary outcomes are not counted as four successful mutation detections. The final mutations deliberately bypass complete controls and produce assertion failures with valid positive controls.

Repeat the bounded experiment with `node tools/verify-security-guards.mjs`. Its overall command succeeds only if all four selected positive controls pass and all four intended bypasses are detected. Red child-test logs are expected in these intentionally broken copies. This is not comprehensive mutation testing, fuzzing or a claim that every test detects every defect.

### Remaining limits

The final full suite passed 144 tests, with zero failures, cancellations or skips, in 712,044 ms. The local transcript is `data/security-verification-full-test-2026-11-01.log`. Actual phone/provider delivery and participant evaluation remain separate. Existing account-reset actions revoke sessions and are audited; actions through a later Manager login identify that account. Filesystem access outside the app is not necessarily logged. Admin-role restrictions do not sandbox a trusted person who controls Manager credentials, the database or recovery files.


## Text-only results to send Claude

```text
We completed the five-step verification. You do not have repository access, so these remain reported results rather than your independent findings.

1. Malicious-input browser test passed for Tenant text, quoted input values, javascript-like record strings, real email-body ingestion, controlled OCR output and generated receipts. Text stayed inert, no injected event/image nodes appeared, no application URL used a dangerous scheme, and the attack marker remained unchanged. OCR output was supplied at the ingestion boundary; this is not OCR accuracy evidence or a global URL-sanitizer claim.

2. A temporary SQLite trigger rejected Admin inspection audit inserts. Tenant, bill, JSON receipt and rendered-receipt responses were errors with only message/code and no record data. This confirms fail-closed behavior for the tested detail routes.

3. Two owning-Manager identities made parallel HTTP requests to one Node/SQLite backend. Rent confirmation returned one original receipt to both requests and created one confirmation effect. Proposal authorization returned one success and one 409, with one correction and exact PHP 600 total across two PHP 300 shares. This is not a distributed concurrency claim.

4. We found and fixed one existing defensive gap. The old public-user serializer stripped passwordHash but returned unknown stored fields. Injected reset/token/private canaries appeared in the account response. The replacement explicitly allowlists supported account fields and four boolean preferences. We do not claim actual tokens were present in live user rows. Account/identity, maintenance/status, backup response, audit JSON/CSV and generated-receipt checks now exclude the private canaries. Audit writes from the tested note/reason operations store record identifiers instead of those private input strings. Global audit and recovery powers remain authorized.

5. In isolated source copies, four selected positive-control tests passed and four deliberate complete-control bypasses failed assertions: Admin-as-Manager confirmation, spreading a full bill into an Admin DTO, overriding authenticated membership from a workspace query, and disabling the Demo policy gate. Initial removal of just one layer remained blocked by other guards; we did not call that a successful bypass detection. The final tests detect the intended faults rather than syntax errors or crashes. Working source hashes were unchanged and copies were removed. No credentials or runtime databases were copied, and no external sending occurred.

Final full regression: 144 passed, zero failures/cancellations/skips. The four intentional negative runs are separate from that count. Role restrictions still do not sandbox trusted operators controlling accounts, passwords, databases or backups. Account changes/reset actions are audited and revoke sessions; later actions identify the account used. Filesystem access outside the app is not necessarily logged.

Please identify only a concrete contradiction or essential missing verification. Mark assumptions clearly and ask for a small relevant excerpt if needed. Do not propose more modules, a rewrite, a mandatory reset workflow or a new receipt constraint. Actual phone/Gmail/provider/participant evaluation and manuscript export remain separate.
```

## Manuscript and final walkthrough handoff

Chapters I-III and the architecture/DFD now match the approved read-only Admin boundary. The shared Google Doc was updated in place, both revised figure images were inserted after explicit upload permission, and the checked 59-page PDF is saved in `SeCapstone/review/MANUSCRIPT_I_III_REVISED.pdf`. All 293 nonempty text blocks match the local payload; body formatting is Arial 12, justified and double-spaced, without native bullets. The full-suite 144-test and four control-bypass results were confirmed from their saved logs, not rerun for document-only changes. See the manuscript alignment record for the exact export hash and limits.

The two-workspace demo database was checked read-only and remains prepared, with zero foreign-key violations. The existing manual test guide and next-session checklist identify the physical phone, Gmail/provider delivery, restore and formal participant tasks that the group still needs to perform and record. No fresh live sending or participant result is claimed.
