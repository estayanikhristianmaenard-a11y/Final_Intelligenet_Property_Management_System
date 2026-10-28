# Editable manuscript figures

**Content review finalized: 27 October 2026, for the current approved workflow.** The three draw.io files are the reviewed baseline. Source hashes and final checks are recorded in `exports/verification.json`. Reopen the content only when an approved workflow changes or a specific error is found. Manuscript figure placement and final print-scale readability still require document-level review.

| File | Use |
| --- | --- |
| [2.1 Architectural Framework](2.1_Architectural_Framework.drawio) | Main architecture, including Staff and graphical utility intake |
| [2.2 Process Flowchart](2.2_Process_Flowchart_SIMPLE.drawio) | Billing flow, Staff proposals and Manager decisions |
| [2.3 Full-Blown DFD](2.3_FullBlown_DFD.drawio) | Actors, processes and stored data flows |
| [Supporting artwork](assets/) | Reusable utility intake, bill extraction and illustrative bill SVGs |

The three draw.io files above are the current editable diagrams. Supporting artwork is in `assets/`, shareable figures in `exports/`, the export tool in `tools/`, and older versions and one-time revision records in `archive/`.

## Updated exports — 27 October 2026

Open the [figure gallery](exports/index.html) for all three updated figures. Each has a full SVG, PNG and figure-only PDF, plus a four-page landscape detail PDF with overlapping quadrants for readable labels on paper. The full figures are dense: do not shrink the overview into a small portrait text column and assume the labels remain readable. Use the vector original and enlarged detail views when preparing the manuscript.

| Figure | Full PNG | Full vector | Enlarged print views |
| --- | --- | --- | --- |
| 2.1 Architecture | [PNG](exports/2.1_Architectural_Framework.png) | [SVG](exports/2.1_Architectural_Framework.svg) | [PDF](exports/2.1_Architectural_Framework-print-details.pdf) |
| 2.2 Process flow | [PNG](exports/2.2_Process_Flowchart_SIMPLE.png) | [SVG](exports/2.2_Process_Flowchart_SIMPLE.svg) | [PDF](exports/2.2_Process_Flowchart_SIMPLE-print-details.pdf) |
| 2.3 DFD | [PNG](exports/2.3_FullBlown_DFD.png) | [SVG](exports/2.3_FullBlown_DFD.svg) | [PDF](exports/2.3_FullBlown_DFD-print-details.pdf) |

See the [alignment and verification record](archive/before-2026-10-27-alignment/DIAGRAM_ALIGNMENT_2026-10-27.md). Earlier editable diagrams are preserved in that same archive. The Google Docs manuscript and stored manuscript PDF are not automatically modified by these local diagram exports; insert the approved figures and review final pagination separately.

## Reproduce the exports

`node SeCapstone/diagrams/tools/render-diagrams.mjs` uses the portal's installed Playwright, local Edge on Windows, and the official diagrams.net viewer at `.render-cache/viewer-static.min.js`. That local dependency is excluded from Git; the exported figures remain shareable. Obtain it from `https://viewer.diagrams.net/js/viewer-static.min.js` when reproducing on another machine. The renderer serves it only on loopback, blocks external requests, and sends no diagram content to a remote rendering service. No npm dependency or app runtime change is needed.

The one-time `update-workflow-figures.py` is archived with its original snapshots for traceability. Continue normal manual editing in diagrams.net; the export command above renders current files without applying historical edits. Temporary print-preview PNGs were removed and are no longer generated; the complete PNGs and enlarged print PDFs remain.

To check editable XML, endpoint references and essential workflow boundaries, run `python SeCapstone/diagrams/tools/verify-diagrams.py`. It writes `exports/verification.json`. This is diagram verification, not a replacement for system tests or adviser review.

## Connector layout repair

The 27 October layout pass moved connector labels out of boxes, section headings and other connectors. Per the user's preference, crossings are plain intersections without arc bridges or jump effects. Lines must not pass through unrelated boxes or circles. The renderer captures native geometry in the ignored `.render-cache/`; run `python SeCapstone/diagrams/tools/verify-layout.py` after rendering to produce `exports/layout-verification.json`.

All connector segments are horizontal or vertical with square 90-degree turns. Measured fixed boundary ports on circular shapes prevent radial projection from introducing tiny diagonal endpoint segments. The layout verifier checks orthogonality as well as label and shape clearance.

The later straightening pass also removed unnecessary grid-snap stair steps and aligned near-shape arrow ports. Simple crossings or shared straight runs are allowed; they are reported rather than treated as errors. Do not add little detours solely to separate those lines. The current exports have no measured short internal stair-step segments, no connector/label collisions and no connectors through unrelated shapes.

Architecture-specific adjustment: Setup Records now runs vertically just right of Bill Processing. The embedded intake SVG's bill-details and source-storage connections are anchored to its visible output/border, and provider email connects to the visible Receive Billing Emails box. Short access links connect the permission summary to Property Setup and Utility Bill Intake.

`route-connectors.py` and `place-connector-labels.py` are optional repair tools using the last rendered geometry. They are not part of normal export and should not be run over later manual layout edits without reviewing the result. Normal export preserves the routes saved in draw.io.
