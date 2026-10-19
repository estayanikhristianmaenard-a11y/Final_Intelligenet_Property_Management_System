# Lightweight, responsive and accessible UI

The approach is performance-conscious responsive design: small assets, native browser controls, layouts that adapt to screen size and input method, and accessible feedback. Broad modern-browser support is the target; compatibility and smoothness on every device cannot be guaranteed by desktop emulation.

## Implemented interaction patterns

- Shared control transitions use 280 ms, page/calendar transitions 360 ms, and dialog entrances 420 ms. Desktop hover sidebars expand/collapse over 800 ms with 180 ms entry/260 ms leave delays; labels fade and slide over 420/520 ms. Gentle easing replaces the earlier abrupt 160-220 ms overrides across roles. Native disclosure content fades over 320 ms rather than continuously measuring height or intercepting scroll.
- Dialog and toast cleanup follows the computed CSS exit duration so slower transitions finish before removal. Buttons and requests respond immediately; only the visual transition is slower. Skeleton and processing indicators retain their existing loading cadence. No animation dependency was added.
- Copy changes to Copied only after clipboard success. Saving feedback follows the actual request, keeps a minimum button width, blocks duplicate submission and preserves values after errors.
- Utility intake displays an indeterminate processing indicator while waiting for the real upload/extraction response. It does not simulate stage completion or invent a percentage. Pending uploads protect their close controls; failed uploads retain the selected file for retry.
- Same-page route events preserve unsaved form values instead of redrawing the page. Clean pages still refresh after completed actions; leaving a page with edits retains the existing discard confirmation.
- Forms track changes in memory. Settings show Unsaved changes and Cancel changes; route changes, relevant dialog dismissal and browser unload warn before losing edited values. No offline drafts, passwords or billing data are saved to browser storage by this feature.
- Connectivity feedback is event-driven. Network availability is distinguished from an unreachable server; no timer polls connectivity and no failed write is automatically queued or retried.
- Reduced-motion preferences disable the added movement. Readable text, explicit status, keyboard controls, dialog focus handling and visible cancellation remain the primary feedback.

## Storage and runtime cost

No animation framework, CDN runtime, font package or frontend OCR worker was added. The three shared modules (`form-state.js`, `connection-status.js`, `action-feedback.js`) total approximately 4.8 KB of source, excluding edits to existing files and CSS. This is a source-size observation, not a network-transfer or speed benchmark. Motion runs on user actions; the processing indicator runs only while processing is pending.

The Audit Log retrieves one page through SQLite rather than materializing its entire history in browser memory. The UI requests 50 rows, the paged API caps requests at 100 rows, and a timestamp index supports ordered retrieval. Date/action filtering precedes pagination. Older logs remain stored and accessible. There is no automatic log deletion in this change.

## Reference and validation

Patterns were selected with reference to the [BrewedOps Motion Library](https://brewedops.cloud/motionlibrary/) and adapted in locally authored CSS/JavaScript. Its full catalog, demonstration autoplay, GSAP, Three.js and Lenis were not installed. See its [reuse terms](https://brewedops.cloud/motionlibrary/legal/license/) before copying additional source or third-party assets.

Use the [QA report](qa-report.md), [manual test guide](manual-test-guide.md) and [PNG index](../../reports/mockups/README.md). Automated coverage checks pagination beyond 50, date boundaries, access restrictions, cancellation of unsaved navigation, error recovery, duplicate-upload prevention and reduced-motion behavior. Real phone tests on slower hardware and variable networks remain necessary to judge perceived smoothness; PNGs show states, not animation quality.
