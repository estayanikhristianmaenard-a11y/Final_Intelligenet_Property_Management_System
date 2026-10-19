# Final paper export check — 14 October 2026

Source: `D:/CAPSTONE/Papers/Intelligent Property Management Workflow with OCR-Enabled Automated Billing Classification and Tenant Notification.pdf`

Reviewed export: 50 PDF pages. SHA-256: `611d2d7b90729bed89121be23337694a4d371821842898c34d4e882a06171d9c`.

## Verdict

The Chapter I–II content can serve as the agreed development baseline. No major contradiction with the approved workflow was found in this review. The latest architecture, flowchart, and DFD are embedded. Another full rewrite or diagram redesign is unnecessary. This export still needs the small proofreading and presentation fixes below before calling the PDF submission-ready.

This check supersedes the unresolved-item list in UPDATED_MANUSCRIPT_REVIEW.md for this export. References and actual mockup screens remain deferred as previously requested; their absence is not a new body-content revision request.

## Remaining edits

| Location in this export | Issue | Action |
| --- | --- | --- |
| Section 2.1, page 35, paragraph beginning “Web Push will provide external alerts” | `Tenant'ss` has an extra `s` | Replace it with `Tenant's`. Correct sentence: “Rent email will use the Tenant's registered email address and a configured SMTP service through a TLS-protected connection.” |
| PDF page 50 | No manuscript body content; trailing page contains the school logo | Remove the trailing empty page. |
| Figure 2.1, image page 26 / caption page 27 | Caption is separated from its figure; small labels at manuscript scale | Keep the caption with the figure. Enlarge using an appropriate figure page, including landscape if allowed by the school. Check at 100% document zoom. Preserve the approved diagram content. |
| Figure 2.2, image page 39 / caption page 40 | Caption is separated; tall diagram is reduced to fit beside introductory text | Use a dedicated figure page and keep the caption with it. Enlarge the existing diagram; do not add more workflow detail. |
| Figure 2.3, page 41 | Caption is now with the diagram, but labels remain small at page scale | Enlarge the figure or use a landscape figure page if allowed. No additional DFD process is requested. |
| Table 2.1, caption page 30 / table begins page 31 | Caption is separated from its table | Move the caption with the first table rows. Repeated table headers already appear. |
| RRL topic headings, bottom of pages 5, 6, and 7 | Headings are separated from the opening text | Apply “Keep with next” to these headings. |

If the school requires chapters to begin on a new page, insert a page break before Chapter II, which currently begins on page 19 after the Chapter I limitations. This is template-dependent, not a system-scope defect.

## Confirmed corrections and retained requirements

- The missing finalized-correction paragraph is restored on page 34. It covers preserved values/history, pending reports, original paid-rent payments/receipts, linked revisions, utility correction history, and no automated external refunds or settlement.
- Introduction now explains the concept and contains correctly quoted “intelligent.” Earlier `Tenant?s` punctuation has been corrected; the remaining page-35 issue is the extra `s` above.
- The topical RRL retains its accepted scope, adds the rent email standards discussion, and uses the updated notification heading. No synthesis section is required by this review.
- Utility intake includes supported email summaries, attachments, and optional Manager uploads. Readable email/PDF text is extracted directly; clear images use OCR. Masked identifiers require review rather than guessing. Provider-app access and predicted future due dates remain excluded.
- Month-to-month occupancy, anniversary rent, short months, missed-cycle recovery, first-bill advance, final-cycle Manager-approved credit, receipt reuse, and no repeated credit/replacement advance are retained.
- Shared allocation uses eligible recipients at the declared date, frozen lists, whole-centavo computation, and deterministic remainder distribution. Provider payment arrangements remain outside the system.
- Rent reporting and direct Manager recording both require externally checked Manager confirmation. Utility tracking remains Tenant-owned, unverified by the provider, and separate from receipts.
- Stored portal notifications, rent/utility Web Push, and supplementary rent-only email are explicitly described. Reminder timing, late-bill handling, sending limitations, retries, and duplicate controls remain consistent.
- The embedded flowchart contains the added rent eligibility decision and conditional final-cycle advance wording. The architecture contains graphical OCR extraction. The DFD contains upload, utility tracking, and outgoing rent-email/result flows.
- The iteration table now names text extraction and Tenant notifications. Evaluation separates direct extraction from image OCR and distinguishes simulated sending from controlled real sending. No completed evaluation results are claimed.

## Boundaries of this check

All pages were text-extracted. Contact sheets for all 50 pages and enlarged renders of the diagram pages and relevant correction locations were inspected. This checks manuscript consistency and presentation; it does not establish that every system feature is implemented or working. Original cited publications and bibliography metadata were not independently re-verified in this pass. Evaluator counts, sample counts, and questionnaire scoring are explicitly awaiting adviser agreement before final data collection.

No source PDF was edited, repository baseline PDF replaced, or Git commit/push performed.
