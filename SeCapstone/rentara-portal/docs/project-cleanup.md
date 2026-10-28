# Project file cleanup

23 October 2026. Reviewed project source, tools, guides, research indexes and output folders. This is a dependency/reference and organization cleanup, not a new billing implementation or a claim that every file is semantically obsolete or unused.

## Removed or consolidated

| Previous item | Action and reason |
| --- | --- |
| `src/features/settings/settings-live.js` plus two-line `settings.page.js` re-export | Consolidated the implementation into `settings.page.js` and updated the page registry. One Settings implementation with the same functionality. |
| `src/models/index.js` | Removed unreferenced comment-only mock typedefs and empty export. No source/test/JSDoc consumer existed; several shapes were outdated. Actual schema remains `server/store.js`, with API behavior in the contract. |
| Disabled local demo-login branches/helpers | Removed unused role picker, demo credential filling, host detection and event handlers. Ordinary credentials still determine the authenticated server role; password visibility, errors and deep-link routing remain. |

## Archived with links updated

- `docs/core-billing-verification.md` -> [historical billing checkpoint](archive/checkpoints/core-billing-verification.md).
- `docs/staff-revision-review.md` -> [pre-implementation Staff review](archive/planning/staff-revision-review.md).
- The two 12 October development/public-deployment text plans -> [historical planning](archive/planning/README.md). They predate current workspaces, Staff and rent-email scope; use [development guide](development-guide.md) now.

These records were preserved rather than erased. Relative Markdown links were rebased both into and out of the moved documents. The earlier screenshot review is labelled as its 16 October checkpoint; the current gallery has 45 UI PNGs.

## Easier entry points

- [Application README](../README.md): where to start and which data profile to open.
- [Development guide](development-guide.md): current code map, workflow and integration boundaries.
- [Documentation index](README.md): current setup/usage references with historical planning separated.
- [Diagram index](../../diagrams/README.md): three complete diagrams versus reusable SVG illustration assets.
- [Research index](../../review/README.md): current Staff manuscript change record is visible.

## Intentionally retained

- All runtime source/components/styles, dependencies/lockfile, CLI tools, automated tests and distinct sample cases remain unless explicitly listed above. Lack of an importer is not sufficient to delete a CLI entry, generated output or documentation asset.
- `tests/fixtures/utility.png` intentionally duplicates a synthetic sample image: tests need a stable fixture independently of presentation/sample organization.
- The phone-ready anonymized Meralco scan intentionally duplicates its catalog source: the demo folder is a portable attachment pack. Removing it would break the intended phone demonstration/tool output.
- Current PNGs, email previews, editable SVG/draw.io assets, reports and manuscript snapshots have distinct uses. Archives retain historical evidence and submitted versions.
- The two `.gitignore` files have different directory scopes and remain valid. Their existing team-sharing policy was not changed.
- `data`, `.env` variants, backups, TLS files, private bills, dependencies and existing test output were preserved. Private/runtime folders were excluded from content scanning; no credential value was read or printed.

## Verification

- Scanned Markdown links and literal local JavaScript/module/HTML references; repaired links after file moves.
- No remaining frontend module without a static importer was found after consolidation. Dynamic/runtime behavior is checked separately by browser tests; this does not establish that every exported helper/CSS selector is used.
- Syntax checks passed for changed login and Settings modules. Cross-role browser checks exercise login, role switching, Staff proposals, Manager CRUD/settings and responsive page rendering. Results are recorded in the current [QA report](qa-report.md).
- No database reset, schema change, external mailbox access, email sending, Git commit or push was performed for this cleanup.

Final verification: four targeted browser tests passed, zero failures/skips/cancellations (approximately 165 seconds). Local Markdown/source references and scoped whitespace checks passed. The previous full backend/browser suite was 92/92; it was not rerun for this source-organization-only cleanup.


## Case Sheet consolidation - 27 October 2026

The four superseded concept folders (claude-navigation-review, manager-workspace, rentara-redesign and shared-workspace-directions) are preserved in `reports/archive/design-proposals-2026-10-27.zip`, relative to SeCapstone. Its 76 source files were checked against the ZIP with SHA-256 before removing the old folders. The ZIP contains ARCHIVE-MANIFEST.json. This archive preserves earlier reviews and generators for reference; those generators are historical and may need their original paths restored to run.

The active design-concepts folder now contains one selected SVG/PNG reference pair and a README linking the implemented screenshot gallery. Runtime files, fixtures, manuscripts, diagrams, credentials and application records were preserved. No Git push was performed.


## Pre-push generated-file cleanup - 28 October 2026

Removed the root and portal test-results folders: eight generated result/screenshot files. These are recreated by testing and are not application inputs. Added root ignore rules for Python bytecode/cache directories and operating-system metadata. Existing dependency, runtime-data and generated acceptance-profile exclusions remain; shared source and environment templates stay included. The diagram render cache remains locally because its tools read it directly, and remains excluded from Git. No working records, credentials, bills, dependencies, manuscripts or current preview PNGs were deleted. No Git staging, commit or push was performed.
