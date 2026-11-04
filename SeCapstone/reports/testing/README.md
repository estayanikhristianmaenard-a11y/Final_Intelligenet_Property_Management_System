# Group review and final testing

Prepared 2 November 2026. Start here instead of choosing random old bills or copying an earlier demonstration result.

| File | Purpose |
| --- | --- |
| [reviewer-guide.docx](reviewer-guide.docx) | Upload to Google Docs: Chapters I-IV explained, roles, function purposes, code map, demo order, review answers and evidence limits; Arial 12, justified, double-spaced |
| [reviewer-guide.md](reviewer-guide.md) | Editable source of the same guide |
| [simple-test-checklist.xlsx](simple-test-checklist.xlsx) | Recommended starting form: 19 workflow checks, six columns and two sheets. Fill only Result and Notes; Notes holds the actual result, feedback and screenshot link |
| [final-test-workbook.xlsx](final-test-workbook.xlsx) | Three sheets: Start Here, Test Cases, Issues & Retests; exact steps, expected results, actual-result/evidence/feedback fields and status dropdowns |
| [assets](assets/README.md) | Numbered fresh synthetic inputs and required mappings; A08 refers to the existing Bayan held source |

Start with simple-test-checklist.xlsx: read Read First, fill its shared session details and use Simple Checklist. It is the first walkthrough, not full advanced coverage. Keep the 77-case workbook as the detailed reference for advance, scheduler, backup/restore and developer-assisted checks. For the detailed version, fill Start Here and filter Test Cases to Core. Prepare notification registration before live A03/A04 intake; fresh events are not retroactively replayed. Keep the workbook and its assets folder together so relative asset links continue to work in Excel. If importing the workbook to Google Sheets, upload assets to an agreed Drive folder and replace the relative links there; file hyperlinks do not upload attachments automatically. Verify dropdowns and summary formulas after conversion.

Record each actual outcome, including failures and blockers. A Passed function can still have feedback. Later rounds and retests belong in Issues & Retests so the original failure is retained. Keep passwords, private source documents and unredacted evidence outside the repository. This workbook is a group manual acceptance record, not a participant questionnaire or a new automated test result.

The current manuscript is [Chapters I-IV](../../review/MANUSCRIPT_I_IV_REVISED.pdf). Chapter IV remains a development-based draft until actual evaluation findings are available. Do not convert the older 144-test result or the isolated asset verification into manual passes.

To reproduce the Word file and a blank workbook, run `python tools/build-final-review-kit.py` from rentara-portal. Python and openpyxl are tooling for this document, not new application runtime dependencies. The builder refuses to overwrite a workbook with actual results, feedback or issue/retest records. To edit the guide, change the Markdown source before rebuilding. Keep completed workbook copies privately by test session.

## Project cleanup review

The project-owned source, documents and artifacts were inventoried and their references checked. Runtime/private data, dependencies, recovery backups, installed skills, submitted papers, actual bills and dated test evidence were retained. Duplicate skill artwork and the PNG used by automated fixtures are intentional. The anonymized Meralco copy in its demo pack is intentionally retained for that separate demonstration.

The two old distribution ZIPs in reports/demo-files were redundant copies of still-retained canonical inputs. Their bundled README instructions were older than the current guides. They were removed after comparing every bundled non-README file byte-for-byte with its retained canonical counterpart; links now point to the current folders. The cleanup also removes selected ignored manuscript-preview PNGs/build logs and a duplicate exported PDF, while keeping verification JSON, reusable scripts and test transcripts. No source module or operational database is deleted merely because a name looks old. See the cleanup summary below for exact counts.

Cleanup completed: 16 files removed, 6,767,998 bytes (approximately 6.45 MiB). Two were tracked redundant distribution ZIPs; the other fourteen were ignored manuscript-preview images, reproducible build logs or the byte-identical extra PDF export. Original transcript/verification evidence and the canonical manuscript exports remain. The exact removed paths, sizes and SHA-256 hashes are recorded locally in `rentara-portal/data/cleanup-final-review-2026-11-02.json`.

Verification: the workbook contains 74 cases (44 Core, 7 Live, 23 Extended), all Not Started with blank actual results and feedback. All three sheets were reopened successfully; dropdown/formula ranges and Office XML were checked. Isolated checks confirmed that the generator refuses to overwrite actual results, feedback and issue/retest records. Word XML was checked for Arial 12, double spacing and justified paragraphs; the DOCX was not rendered in desktop Word. The guide source and Word text match. Workbook links are relative until the group uploads assets to its own shared folder.

The simplified workbook preserves all original detailed results. Save a new session copy for each role-rotation round; do not overwrite earlier failures. Its last two rows require live setup, and the Push setup must happen before creating the fresh email/billing event. If either live channel is blocked, record that specifically rather than marking the combined row Passed.

## SOA-layout cases added

S01 and S02 are fresh synthetic versions of the anonymized first-page Meralco layout, with different February/March 2027 periods and different totals. They passed real attachment OCR and allocation checks in a disposable portfolio. Use the final two rows of the simple checklist or TC-075/076 in the detailed workbook; earlier simple synthetic PDFs and email summaries remain available as other demo cases. The current detailed workbook has 77 cases (46 Core, 7 Live, 23 Extended); the earlier 74-case count above records the first kit verification. No actual manual result was pre-filled. See the [asset index](assets/README.md#additional-soa-layout-demonstration) for PDFs, email instructions and exact expected values.
