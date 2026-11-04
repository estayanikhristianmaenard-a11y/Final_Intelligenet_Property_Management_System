# Main branch UI and finalization review

Reviewed 4 November 2026. The initial review below identified integration work; the follow-up at the end records its completion. Keep the Fresh Mint redesign. Actual-device and formal evaluation remain separate.

## Versions and review scope

GitHub was fetched before inspection. Reviewed `origin/main` at `1e04069cf03a56a929f309dce87c846aed27d283`, against shared ancestor `7903d4cb6a0eda2af9a614c5d1429ecd5fec70c8` and staging checkpoint `6cc9a61007c9d0219d02626f55fc0613182f0b59`.

Main has five subsequent commits: Fresh Mint theme, consistent role styling, expressive layouts/illustrations, motion, and validation polish. The change from the shared ancestor covers 109 files, including screenshot assets, with 1,789 text insertions and 69 deletions. Review focused on changed runtime paths, validation, navigation, role boundaries and integration risks; it is not an exhaustive security or accessibility certification.

The current checkout remains on staging. Existing uncommitted SOA assets, the simplified workbook and guide updates were preserved. No merge, commit, push, live mailbox retrieval, external delivery or working database change was performed.

## Findings before finalization

| Priority | Finding | Required action |
| --- | --- | --- |
| Blocking integration gap | Main does not contain the staging checkpoint. Admin inspection, profile safeguards, the newer security tests, Chapter IV and the testing kit are absent from that branch. | Combine both histories. Keep the UI improvements and the approved staging functions/documents. Do not replace the whole staging application with main's older backend. |
| Blocking integration compatibility | Staging's `tools/prepare-workspace-demo.mjs:55` sends `floor: 'Ground Floor'`. Main's `server/service.js:528` now requires a numeric floor on new units. | Change that fixture creation value to `floor: '0'` when integrating, and run `tests/group-demo-workspaces.test.js` against the combined code. Preserve existing databases. |
| Medium, existing hardening gap | Main's `server/service.js:43` still removes only `passwordHash` from public users. Staging already uses an explicit field and preference allowlist. | Preserve the staging allowlist while retaining main's newer login/profile validation. |
| Optional UX polish | `src/styles/living-details.css:11` creates large inner-page covers; dashboard heroes and the Tenant greeting also occupy substantial vertical space. | Shorten operational headers and the phone greeting if the team finds that routine actions require too much scrolling. Keep the approved palette and artwork. |
| Optional input polish | `src/utils/phone-input.js:15` rejects pasted numbers containing spaces, hyphens or an international prefix. | Keep the current 11-digit contract unless changed deliberately; add a visible format hint. Consider normalizing familiar pasted formats separately, with matching tests, rather than silently truncating them. |

The first finding is branch divergence, not a deletion introduced by the groupmate's five commits. The shared ancestor predates our staging checkpoint. Git blame also confirms main's public-user blacklist is old code, whereas staging's allowlist was added in `6cc9a61`. There is no evidence from this review that actual reset credentials were exposed.

The public-user helper has two direct call sites in main: identity construction and user-write responses. A synthetic object containing an extra top-level reset-token canary and nested preference canary returned both extra fields, while correctly omitting `passwordHash`. This demonstrates the allowlist gap under a future or extended user record, not the presence of those fields in working accounts.

The floor incompatibility was reproduced using main's actual Service and an in-memory database: the staging-style unit payload returned HTTP-style status 422 with `Floor must be a non-negative whole number`. This is a demonstrated interface incompatibility; the full combined workspace setup was not run.

## Verified progress

The Fresh Mint direction is implemented across Manager, Staff, Tenant, Admin, login, dialogs, drawers and shared navigation. Cream backgrounds, forest-green navigation, mint accents and local illustrations make it visually distinct from the earlier blue design. Financial actions and personal utility tracking retain their existing meanings in the reviewed UI diff.

The changes also add or improve validation for numeric floors, optional 11-digit phones, Tenant assignment dates, profile types and lengths, message string types, and normalized login attempt keys. The saved layout evidence shows readable navigation and separated source/correction areas. A newly generated phone unit form was visually inspected and showed the fields and Save/Cancel controls fitting its viewport.

## Fresh verification results

| Check | Result |
| --- | --- |
| Full suite on the isolated main snapshot | **105 passed; 0 failed, skipped or cancelled; 308,330.6017 ms** |
| JavaScript syntax | **133 JS/MJS files checked; 0 failures** |
| All-role responsive audit | Passed at 1440, 820, 390 and 320 px, including overflow, named controls, selected contrast checks and short-screen navigation |
| Form and interaction tests | Passed, including invalid inputs, unsaved changes, enabled/reduced motion, menu transitions and drawer cleanup |
| Billing and access regression tests present on main | Passed, including OCR, allocation, rent confirmation, Staff restrictions and independent workspace isolation |
| Additional synthetic public-user probe | Confirmed the existing blacklist behavior described above |
| Additional floor integration probe | Confirmed the staging payload is rejected by main's new validator |

Run: `node --test --test-concurrency=1 tests/*.test.js` without loading a project `.env`, inside an exported main snapshot with installed dependencies shared through a local directory junction. Tests used their isolated synthetic stores and test transports. These results are for main alone, not for a merged build. The older 144-test staging evidence and this 105-test result are different suite compositions, not comparable completion percentages.

Local diagnostic evidence is under `SeCapstone/rentara-portal/data/main-review-2026-11-04/`: `main-only-tests.log`, `public-user-review.json`, `floor-integration-review.json`, and `snapshot-summary.json`. This directory is ignored by Git.

## Integration order

1. Preserve and commit the latest testing-kit/SOA work on staging when the team is ready. Those uncommitted changes are not included in `6cc9a61`.
2. Merge the staging history with main, preserving Fresh Mint and the approved backend/manuscript work. Use a normal merge rather than copying entire older files over newer ones.
3. Fix the Bayan fixture's numeric floor and retain the public-user allowlist. Check the Admin workspace page in the new theme, since main's visual tests cannot exercise a page it does not contain.
4. Resolve QA history and screenshot conflicts deliberately. The read-only three-way preview found conflict markers in `docs/qa-report.md` and six screenshot paths: Manager dashboard, Admin dashboard, desktop login, Manager settings, Manager reports and the unsaved-changes screenshot. Regenerate affected previews from the combined application rather than discarding one branch's functions to match old pictures.
5. Run the combined suite, including Admin visibility, profile safeguards and Bayan workspace preparation. Then have the group follow the simplified checklist on actual phones and record outcomes.

The merge preview did not modify Git's index or working files. An automatic textual merge is not proof of semantic compatibility; the floor case demonstrates why the combined tests matter.

## Remaining acceptance limits

Actual Android keyboards, zoom, scrolling and motion feel; authorized fresh provider-email/SOA processing; live rent email and Web Push delivery; printing; and a separate-destination recovery rehearsal still need recorded acceptance. Development tests and synthetic layouts do not substitute for participant evaluation or representative provider-format accuracy. No new feature module or another redesign is recommended before these checks.

UI reference used: [Vercel Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md). The recommendations above apply its accessibility, input, motion and layout guidance to the existing vanilla JavaScript application; they do not require another framework or dependency.


## Integration completed locally - 4 November 2026

Main `1e04069` and staging `6cc9a61` are combined on staging, without a commit or push. The actual Git merge required one QA-history conflict resolution; both dated histories were retained. The earlier read-only merge preview over-predicted binary conflicts. Freshly regenerated pictures now replace the older versions. The newer Admin inspection, public-user allowlist, profile guards, Bayan setup, Chapters I-IV and testing kit are all retained.

The Bayan fixture now uses floor 0. Six additional validation regression scenarios cover typed and bounded names/emails, normalized account-email conflicts, preservation of unchanged preference opt-outs, scalar decimal amounts and typed payment references. Five scenarios failed before their repairs; the sixth covers the same coercion issue in rent references. Optional phone format remains blank or eleven digits. New browser coverage checks form limits and blank-name rejection. The harmful-text test now checks both invalid phone write rejection and safe rendering of contaminated historical values, preserving its original security purpose.

Fresh combined suite: **155 passed, zero failed/skipped/cancelled, 354,942.2249 ms**. Syntax checks: **151 JS/MJS files, zero failures**. Focused validation/Admin/forms: **9 passed**. Current gallery: **51 screenshots**, including desktop and phone Admin inspection, plus three email previews. The simplified workbook has **19 checks**; the detailed workbook has **77 cases**, with existing outcome fields preserved. Guides, local Chapters II-IV, the existing Google Doc and its 63-page local PDF export are aligned. The paper retains its actual evaluation limits. No extra business module or further visual redesign was added.

Evidence: `data/integrated-final-test-2026-11-04.log`, `data/integrated-previews-2026-11-04.log`, `data/input-validation-before-2026-11-04.log`, `data/integrated-forms-admin-after-2026-11-04.log`. These are local development logs, not actual-phone or provider-origin evidence. The disposable main checkout and dependency junction were removed after review; the four main-only evidence files above remain. Working databases, credentials, original bills and existing result records were preserved.

Ready for the separate final review. Before relying on release/readiness claims, the group must still complete actual-phone tasks, authorized provider/delivery tests and the adviser-approved evaluation. The local Git merge still needs the user's final commit and manual push.
