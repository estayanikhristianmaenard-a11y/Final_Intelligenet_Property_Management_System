# Diagram alignment — 27 October 2026

Reviewed the three current editable figures against Chapters I–III, the scope guard and implemented Staff handoff. This was a diagram/source alignment and rendering task, not a fresh application test or formal evaluation.

## Figure 2.1 — Architectural framework

- Corrected Staff/Tenant overlap and the Tenant's actor-group parent.
- Replaced the crossing per-button role connections with an authenticated access summary. The four internal roles and external Utility Provider remain visible; the provider supplies bill email, not a portal login.
- Made Admin account/workspace maintenance explicit without financial authority.
- Retained property setup, optional Staff/Manager upload, email intake, graphical OCR/direct extraction, validation, allocation, review, billing, personal utility tracking, rent confirmation/advance, rent receipts, permitted notifications and centralized storage.
- Clarified workspace-scoped storage, exact mapping and atomic revalidation. Valid bills continue automatically; utilities remain unverified personal tracking.

## Figure 2.2 — Process flowchart

- Kept the anniversary-cycle eligibility and no-new-rent-bill path, source extraction, valid-bill path, personal utility path, final-cycle advance, rent reporting and confirmation paths.
- Staff's proposed values remain separate from live billing.
- Manager authorization leads to a current-context check and atomic revalidation. Failed validation rolls back; rejection/staleness retains a reason and returns for investigation. Success commits and joins the validated finalization path.
- Manager direct correction is a separate operational route back through validation; no Staff approval requirement is imposed on it.
- Utility marks produce no utility receipt; outgoing supplementary email is rent-only.

## Figure 2.3 — DFD

- Retained the original processes 1.0–6.0, while clarifying validation/proposal flow and Staff's descriptive-only record updates.
- Added the existing Admin support process 7.0 for accounts/workspaces with account-record inputs and outputs. This represents implemented infrastructure, not a new research objective.
- D1 is repeated near the Admin support process for legibility; both D1 symbols denote the same logical database. Admin has no direct rent-confirmation flow.
- Incoming provider email remains distinct from outgoing rent email and its sending result. Portal/Web Push scope and personal unverified utility tracking are stated in the figure note.

## Verification and remaining document work

The source XML was parsed and checked for unique IDs, valid parent references and valid edge endpoints. The official diagrams.net/mxGraph viewer rendered all three sources locally. Full PNG/SVG/PDF exports were generated and the PNGs were visually inspected; actor overlap and crossing correction labels discovered during rendering were revised. Landscape detail PDFs provide enlarged overlapping views; they are figure supplements, not finished manuscript pages.

These figures show supported design and workflow, not proof of Web Push delivery, completed participant evaluation, public hosting, representative OCR accuracy or defect-free operation. The proposed ledger UI redesign is not represented as already implemented.

Insert the approved figure exports into Chapter II, keep captions with their images and inspect the complete manuscript PDF at its intended print scale. Chapter III may refer back to these figures rather than duplicate them. The existing Google Docs insertion notes remain until that separate placement step is completed. The Chapter II DFD paragraph was updated locally and in the existing Google Doc to name Admin process 7.0 and clarify the repeated D1 symbol; its saved text was verified. No application code, billing data, credentials, live email access, Git commit or push was changed.

All three full PDFs were verified as one page each and all three landscape detail PDFs as four pages each, with extractable text on every page. Gallery links and source XML endpoints were checked. A detail preview was also inspected. These checks do not establish final manuscript page fit.

## Follow-up correctness review — 27 October 2026

Compared Staff proposal and decision handling with `server/staff-workflow.js`, including unfinalized-source eligibility, Manager-only decisions, stale checks, nested-transaction rollback and processing-generated bills. The flowchart's Staff branch is now explicitly limited to unfinalized utilities; rent/setup/direct corrections stay Manager-controlled. The finalization join is labelled as an available finalized result rather than a second finalization action. DFD reads now explicitly include source/proposal and rent/advance records. Connector labels have white backgrounds and selected offsets to improve separation from paths.

`tools/verify-diagrams.py` verifies all three diagrams' XML, unique IDs, connected endpoints, parents, the Tenant actor parent, key authority/payment labels, reachability of every flowchart vertex, correction/rollback and rent-confirmation paths, the terminating personal-utility path, and named DFD flows through processes. Every DFD process has input and output, and Admin connects only to the account/workspace process. Results are in `exports/verification.json`. Updated PNGs were visually inspected and all exports regenerated after the fixes. These finite diagram assertions support the review but do not prove every application state or final manuscript layout.

## Final content checkpoint — 27 October 2026

Closed two remaining ambiguities: the notification queue now continues to the main rent/utility branch rather than terminating as a dangling rectangle, and the DFD's portal read explicitly includes persisted Tenant, bill and history records. Delivery failure does not block access to finalized billing. The personal-utility branch still terminates without rent confirmation or receipt issuance. Rechecked all decision paths, regenerated the figure exports, inspected the refreshed flowchart, verified SVG parsing, gallery links and the six PDF page counts/text, and recorded SHA-256 hashes of the reviewed sources in `exports/verification.json`.

The diagram content is the finalized review baseline for the current scope. This is not an adviser-approval claim or a guarantee of every runtime state. Manuscript insertion and print-scale review remain separate; no additional diagram redesign is planned without an approved workflow change or a specific discovered error.

## Visual overlap correction after user review — 27 October 2026

The previous content-finalized wording did not establish that connector geometry was clean. The user's overlap report was reproduced with native mxGraph geometry: 7 architecture, 6 flowchart and 5 DFD edge pairs shared a line segment longer than 8 pixels. Routes now use independent ports and obstacle-aware orthogonal paths; distinct crossings use arc bridges. Measured label bounds were repositioned, the utility branch was widened, and an unnecessary continuation label was removed. Edge source/target relationships and billing permissions remain unchanged.

After rerendering, all three figures have zero shared connector segment pairs, no measured label/label, label/node or label/connector intersections, and no connectors through unrelated leaf-node boxes. Current geometry and source hashes are recorded by `tools/verify-layout.py` in `exports/layout-verification.json`. Structural/workflow checks and all six PDF page-count/text checks passed. The updated full PNGs were inspected. This supersedes the earlier visual-completion claim; final manuscript scaling still requires its own review.

## Subsequent user preference — direct, plain orthogonal routes

The user clarified that ordinary crossings are acceptable and that both jump bridges and small stair-step detours are unwanted. Jump effects were removed. A further pass removed 42 unnecessary bends in the architecture, 35 in the flowchart and 88 in the DFD, aligned shape ports, and straightened the provider-to-extraction link. Source and target IDs were preserved. One label was moved to keep the two email-flow names clear after straightening.

The current verification allows plain crossings/shared runs and checks horizontal/vertical segments, label clearance and unrelated-shape clearance. Current figures have zero measured label collisions and zero short internal segments below 30 pixels. One shared straight run remains in architecture and one in the flowchart, as permitted; the earlier zero-shared-run checkpoint above is historical, not the current visual requirement. Exports were regenerated and the updated architecture/DFD PNGs inspected. Do not rerun the older one-time alignment or grid router over the saved layout to reintroduce small detours.
