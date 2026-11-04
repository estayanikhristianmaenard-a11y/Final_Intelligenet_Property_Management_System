# Capstone review records

The current Chapters I-IV manuscript is in [Google Docs](https://docs.google.com/document/d/11tHstktR1Z7ES9N4QRY6-w-HZd9fXzOxjbDBV2ZELs8/edit), with a checked [PDF export](MANUSCRIPT_I_IV_REVISED.pdf). The 28 October review adds measured development evidence and corrects citation metadata. The 1 November update aligns Admin read-only oversight, adds the recorded 144-test security checkpoint and replaces the architecture and DFD in Google Docs and the local PDF. Chapter IV follows the supplied Conclusions and Recommendations guide and remains limited to recorded development findings until formal evaluation is collected. The manuscript uses paragraph-based discussion, retains numbered research questions and existing tables, and includes the three current diagrams. See [the alignment record](MANUSCRIPT_ALIGNMENT_2026-10-27.md) for dated changes and remaining evidence gaps. Earlier paper reviews describe their own supplied exports; they are not reviews of this new copy.

The 4 November integration adds the Fresh Mint description and verified 155-test checkpoint while retaining the earlier evidence and formal-evaluation limits. The subsequent paper alignment shortens Section 1.5, explains local-network and remote-access conditions consistently across Chapters I-IV, and distinguishes invalid form submissions from utility-source exceptions. The native Google Doc and local source match across 307 nonempty text blocks. The current checked export is 60 pages; actual-device, live-delivery and formal participant evaluation remain pending.

| File | Purpose |
| --- | --- |
| [MANUSCRIPT_I_IV_REVISED.pdf](MANUSCRIPT_I_IV_REVISED.pdf) | Current 60-page manuscript, including the development-based Chapter IV draft; formal participant evaluation remains pending |
| [MANUSCRIPT_I_III_REVISED.pdf](MANUSCRIPT_I_III_REVISED.pdf) | Preserved 59-page checkpoint before Chapter IV was added |
| [export-manuscript.mjs](export-manuscript.mjs) | Local offline PDF reproduction after running `python SeCapstone/review/build-manuscript-payload.py`; uses the existing portal Playwright installation |
| [CHAPTER_IV_WORKING.md](CHAPTER_IV_WORKING.md) | Four SOP-ordered conclusions and five recommendations based on verified development findings; revise after formal evaluation |
| [CHAPTER_III_WORKING.md](CHAPTER_III_WORKING.md) | Completed development-results discussion mapped to all four SOPs; formal evaluation limits stated |
| [STAFF_REVISION_CHANGELOG.md](STAFF_REVISION_CHANGELOG.md) | Latest Staff-related Chapter I/II and diagram revisions; original PDF remains a snapshot |
| [FINAL_PAPER_REVIEW.md](FINAL_PAPER_REVIEW.md) | Latest export review and remaining submission fixes |
| [CHAPTER_I_REVISED.md](CHAPTER_I_REVISED.md) | Complete Chapter I draft for Google Docs, including revised intake and rent email scope |
| [CHAPTER_II_REVISED.md](CHAPTER_II_REVISED.md) | Complete Chapter II draft with requirements, operation, tables and prospective testing procedures; includes links to the current figure exports |
| [REFERENCES_REVISED.md](REFERENCES_REVISED.md) | Alphabetized reference list with 28 October author/DOI/page/version corrections; primary-source metadata checks recorded in the alignment record |
| [Historical manuscript checkpoints](archive/2026-10-manuscript-checkpoints/README.md) | Earlier 45-page and 49-page reviews and original rent-email amendment |
| [WORKFLOW_DECISION_NOTES.md](WORKFLOW_DECISION_NOTES.md) | Agreed workflow rules used to align the manuscript and application |
| [FINALIZED_PAPER_BACKEND_AUDIT.md](FINALIZED_PAPER_BACKEND_AUDIT.md) | Implementation findings and remaining acceptance work; read its dated updates |
| [REFERENCES_TO_RESTORE.txt](REFERENCES_TO_RESTORE.txt) | Recovered references for later restoration and verification |

For current software verification, use the [QA report](../rentara-portal/docs/qa-report.md) and [manual test guide](../rentara-portal/docs/manual-test-guide.md). Dated reviews remain evidence of their own checkpoints, not additional current specifications. Pending references and acceptance checks remain accessible above.

The obsolete 40-page checklist and completed payment-revision redirect were removed during cleanup. The current review and workflow decisions contain the applicable guidance; the previous manuscript remains in private recovery backups.

## Rebuild the current Chapters I-IV locally

Run `python SeCapstone/review/build-manuscript-payload.py --chapter-iv`, then `node SeCapstone/review/export-manuscript.mjs --chapter-iv`. These use the canonical chapter sources and current figure exports. Omitting the flag retains the earlier I-III export path. The local renderer has its own pagination; the checked current PDF is the Google Docs export. Rebuilding is a document operation and does not run the system or contact Gmail.

For group preparation, use the [reviewer guide and guided manual workbook](../reports/testing/README.md). It explains Chapters I-IV and role/function purposes without treating pending manual checks as completed findings.
