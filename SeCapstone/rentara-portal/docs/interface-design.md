# Current interface direction

The 27 October 2026 implementation applies the approved blue workspace direction to the existing HTML/CSS/JavaScript portal. It keeps the desktop sidebar, the pale blue-gray desktop top bar, and the blue phone/tablet header with Tenant bottom navigation. Existing slow sidebar expansion is preserved across roles. No external fonts, animation library, framework, or UI service is added.

Shared colors, type, spacing, focus styles and motion are defined in the existing tokens and the final `src/styles/workspace-design.css` presentation layer. This layer follows the earlier styles deliberately; it scopes the new layout rules rather than changing financial behavior. Subsequent visual changes should use these shared rules instead of adding new role-specific palette overrides.

The Manager dashboard leads with individual Staff proposals, Tenant rent reports and escalated cases. The date stubs show submission dates, not bill due dates. The six oldest waiting items are shown; existing queue links expose the remaining work. Reported rent amounts are not presented as confirmed payments. Property summaries use divided rows rather than another grid of cards, and recent activity remains available.

Staff and Manager share the Case Sheet in Bills & Payments, under Exception Queue. Related exceptions are grouped into one selectable source case. The sheet separates extracted fields, the original bill and the correction proposal. Source outcomes and proposal states remain separate; pending proposals appear as With Manager, and Staff cannot submit another while one is pending. Non-bill cases retain their existing retry, findings and close controls.

Staff prepares corrections inline with a required reason and source evidence. Manager can authorize or reject a proposal, or use the existing direct-correction action. These actions use existing protected endpoints and server-side revalidation. Missing extracted fields are highlighted without calling other extracted values verified. Failed saves preserve entries, local case changes warn about unsaved corrections, and successful saves cannot be submitted again merely because refreshing failed.

The original opens on demand through authenticated source access. PDF and image previews are supported; other sources retain text and download access. Desktop comparison and phone stacking follow the available space. Preview requests abort and temporary object URLs are released when the case is replaced or the page closes. No new processing states, OCR crop coordinates, financial authority or database fields were introduced.

Tenant home keeps rent first and the personal utility tracker immediately below it. A quiet rent surface carries the primary action; the greeting and utility section no longer each need a surrounding box. The calendar remains alongside on desktop and follows utilities on smaller screens. Rent estimates stay labelled, utility dates stay tied to received validated bills, and personal utility marks do not verify provider payment.

Interactive feedback uses existing native controls and short color transitions. It does not delay saves, run continuous decorative effects, animate every row into place, or take control of scrolling. Existing reduced-motion handling remains in effect. Receipt documents remain monochrome and separate from the workspace styling.

The selected SVG reference remains a historical visual proposal. Older alternatives are preserved in one ZIP; start from the design-concepts README or the current PNG gallery. This implementation adopts selected layout principles, not every drawing or fictional record. Browser verification and the refreshed PNG gallery are recorded in the current QA report. Physical-device acceptance and formal user evaluation remain separate work.


The final polish adds a next-step sentence to the Case Sheet and collapses extracted details for pending/processed cases. Original-preview recovery preserves form input; failed read pages expose Try again. Phone correction inputs use readable text sizes and decimal input hints, and action buttons stack. Tenant bill rows share one provider-payment disclaimer in the table footer. No animation dependency was added.
