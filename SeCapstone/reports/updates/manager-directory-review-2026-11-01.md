# Manager directory change review

Implementation follow-up, 1 November 2026: the user subsequently authorized integration and repairs. `main` was fast-forwarded to the reviewed `7903d4c` commit without creating a new commit or pushing. Both overlapping local QA/test changes were combined, with private recovery copies and hash checks preserving unrelated manuscript/evidence work. The stale-directory refresh, delayed/cancellable top-search reads, category-specific billing summary, whole-unit/recorded-share labels and narrow-phone receipt wrapping were implemented. Ten focused tests passed, followed by a fresh complete run with **109 passed, 0 failed/cancelled/skipped**, approximately **333 seconds**. See the latest dated entry in [QA evidence](../../rentara-portal/docs/qa-report.md) for the verification scope. The original review below records the pre-repair findings and actions at that time.

Reviewed 1 November 2026. Comparison: local committed baseline `013e2f7117626c382c8c37864792bd0f594d5ffc` to fetched `origin/main` commit `7903d4cb6a0eda2af9a614c5d1429ecd5fec70c8` (28 October, Khristian Estayani). Local uncommitted manuscript, evidence and design work was excluded from the comparison and preserved.

## Review decision

Keep these improvements, with a small follow-up for stale directory data and request efficiency. This is useful search, validation and phone-layout work; it is not a new visual redesign or a backend workflow revision.

| Severity | Confirmed change-related findings |
| --- | ---: |
| Critical | 0 |
| High | 0 |
| Medium | 1 |
| Low | 1 |

The medium finding affects data shown after a successful edit, not whether the edit is saved. The low finding creates unnecessary network work; this review did not establish a capacity failure or measurable page lag.

## What changed

One commit, ten changed files, 806 added and 17 removed lines. All ten changed-file diffs were reviewed. Runtime review followed related Tenant panel, API, escaping, role, form and table code.

| File under `SeCapstone/rentara-portal` | Added / removed | Purpose |
| --- | --- | --- |
| `src/app/shell.js` | 12 / 3 | Manager/Staff top-search suggestions and opening a Tenant panel |
| `src/app/workflows.js` | 41 / 4 | Inline Tenant date checks, telephone inputs, readable arrangement labels and error scrolling |
| `src/components/tenant-search.js` | 89 / 0 | Shared combobox, keyboard selection and obsolete-response guards |
| `src/features/tenants/tenants.page.js` | 39 / 9 | Local directory filtering while keeping the input mounted |
| `src/styles/components.css` | 1 / 0 | Scrolling panel body can shrink within its flex layout |
| `src/styles/pages/tenants.css` | 30 / 0 | Suggestion layout, phone identity stacking and stable tab height |
| `tests/manager-directory.browser.test.js` | 132 / 0 | Search, dates and drawer checks at four viewport widths |
| `tests/utility-journey.browser.test.js` | 3 / 1 | Assert the actual bill due-month cycle across a month boundary |
| `docs/qa-report.md` | 23 / 0 | Dated QA evidence and remaining improvements |
| `docs/module-qc-checklist.md` | 436 / 0 | Manual walkthrough and 242 unchecked acceptance checks |

## Findings introduced by this change

### Medium: edits through top search leave the directory and its search stale

Relevant new lines: `src/app/shell.js:158`, `src/features/tenants/tenants.page.js:27`, `:30` and `:54`, at commit `7903d4c`.

The top search opens `openTenantPanel(tenant.id)` without the directory's `onChanged: load` callback. The directory now filters a cached `allTenants` array. The existing panel broadcasts `app:data-changed` after an edit, but the application listener only reloads badges, not that cached directory.

Reproduced in an isolated showcase:

1. Open Tenants and find Maria Santos using the top search.
2. Open Edit tenant profile, change the name to `Maria Review Changed`, and save.
3. The database and panel both show the new name.
4. Close the panel. The directory still shows `Maria Santos`.
5. Search the directory for `Maria Review Changed`: zero rows and `No matching tenants`.

Recorded values: stored name `Maria Review Changed`; displayed directory name `Maria Santos`; matching rows `0`. Reloading the directory is a workaround. Ordinary directory-row/suggestion opens already supply a change callback; the new top-search entry point does not.

Recommended repair: refresh the active directory's cached records after a relevant successful Tenant change, regardless of which entry point opened the panel. Preserve the mounted search input, keyword and property filter. Reuse the existing change notification/callback mechanism; no new database table or automatic polling is needed. Add a browser regression for the exact edit-through-top-search journey.

### Low: global autocomplete sends a request on every character

Relevant lines: `src/components/tenant-search.js:43`, `:64` and `src/app/shell.js:157`, at commit `7903d4c`.

`input` invokes `search` immediately, which calls the API-backed `find`. The sequence guard correctly ignores outdated responses, but it does not prevent the earlier requests from being sent. The eight-row limit is applied after receiving the response.

Reproduced with `Marian Sample Tenant`: 20 typed characters produced 20 `/api/v1/tenants?q=...` requests. This is unnecessary for a short autocomplete query, especially over a phone connection. Local directory filtering itself is synchronous and does not need a delay.

Recommended repair: apply a short delay, approximately 200–250 ms, to the network-backed top search. Clear pending work on blur/selection and retain session/sequence guards. Abort obsolete in-flight reads where useful. Keep Enter's normal search fallback. Add a request-count/race regression; do not claim a performance improvement until measured.

## Existing issues worth improving next

These are present in the baseline and were also identified in the new QA notes. They are not regressions caused by the new commit.

| Priority | Existing issue | Evidence and bounded recommendation |
| --- | --- | --- |
| First | Current Billing can imply a category balance is zero when only a different latest bill was selected | `src/features/tenants/tabs/overview.tab.js:16` chooses only `tenant.bills[0]`; `:53` labels it Current Billing. Either explicitly label it as one bill, or show clearly separated current rent/electricity/water records with their own dates. Distinguish absent records from zero balance; preserve personal utility tracking semantics. |
| First | Shared Tenant views label the whole unit's rent as though it were personal rent | `server/service.js:408` returns `u.monthlyRent`; the directory, panel header and Overview display this as monthly rent. Label the value Whole-unit monthly rent. If showing a Tenant amount, use the recorded applicable allocation; do not divide by today's occupants for past bills. |
| Later | Enrollment date terminology needs short explanations | Explain original lease dates versus assignment dates, including what blank assignment dates inherit. Keep existing history protections and Manager authority. |
| Later | The new manual checklist is long and partly repeats the existing guide | It has 436 lines and 242 unchecked checks. Retain its useful coverage, but establish one detailed source and a short daily/demo checklist linking to it. Its Progress section still calls the 27 October 99-test run the latest, while the new QA entry reports a later 100-test run. Record dates and commit IDs; do not overwrite older manuscript measurements with a different revision's count. |

## Verification performed in this review

| Check against isolated `7903d4c` application | Result |
| --- | --- |
| New `tests/manager-directory.browser.test.js` | Passed, 1/1, about 29.7 seconds including runner overhead; test body about 24.8 seconds |
| Existing `tests/browser.test.js` | Passed, 1/1, about 84.3 seconds including runner overhead; test body about 81.4 seconds |
| Edit through global search, compare stored/panel/directory names, then search new name | Confirmed stale directory finding |
| Count global suggestion requests during a 20-character query | Confirmed 20 requests |
| Separate mobile-emulation context with touch enabled; tap Alice suggestion | Passed; correct Tenant panel opened |
| Browser page errors in the additional desktop reproduction | None recorded |
| `tests/staff-workflow.browser.test.js` and `tests/workspaces.test.js` | Passed, 5/5, about 29.1 seconds together; includes Staff proposals, Manager decision, Tenant isolation, Admin filters and independent-workspace checks |
| `git diff --check HEAD..origin/main` | Passed |

The first attempt at the additional review script used an ephemeral port without adding its origin to the isolated server's allowlist. Browser modules were correctly denied and the script could not reach the login form. The test harness was corrected to use an explicitly allowed loopback origin before the successful reproduction. This was not counted as an application failure.

## Security, history and affected callers

The backend, database schema, dependencies and financial rules are unchanged in this commit. New suggestion content goes through the existing escaping `html` helper; queries use the existing encoded API endpoint. Requests still use existing authenticated, workspace-scoped routes. No removed authorization or financial-validation check was identified in the changed code.

`git blame` attributes the new top-search callback and directory cache to `7903d4c`; the existing row-open callback already passes `onChanged: load`. The due-month assertion corrects the test's calendar assumption and does not change billing generation.

Static call-expression counts: the new `bindTenantSearch` has two consumers, the shared shell and Tenant directory; `dialogForm` has sixteen consumers; `openTenantPanel` has five call sites. These are direct call-site counts, not runtime frequencies or a claim of complete transitive coverage. Shared shell/forms justify checking other roles and existing workflows despite the Manager-focused commit title.

The review found no new critical/high security issue in the analyzed change. This is not a complete security assessment of the application or its dependencies.

## Integration and preservation notes

`main` remains at `013e2f7`; the fetched `origin/main` is `7903d4c`. No pull, checkout, merge, application repair, commit or push was performed. An isolated tracked-code copy under ignored application `data/review-7903d4c` was used for browser runs and removed after review. No `.env` or working database was copied. Test writes used disposable portfolios; no external mail, mailbox retrieval or Push was enabled.

Two locally modified files overlap the incoming commit: `docs/qa-report.md` and `tests/utility-journey.browser.test.js`. Preserve and combine both sides before integration. The local test checks all three allocated bills' due-month cycles; the remote test checks the selected bill's cycle. Both agree that the alert follows the actual due month. The two QA entries describe different verified runs and should both retain their revision/date context. Do not discard local manuscript/evidence work to force a pull.

The proposed property-led SVG remains a separate design proposal. This Manager directory commit does not implement it.

## Limits and confidence

Confidence is high for the reproduced stale-cache/request findings and the recorded focused runs. This was a ten-file differential review with selected related-code tracing, not a fresh full-suite run. The author's 100-test QA claim was read but not independently rerun in full here. Headless Edge viewport/touch emulation is not an actual-phone result. No provider-origin accuracy, live notification delivery, public hosting, formal participant result or manuscript completion is established by these checks.
