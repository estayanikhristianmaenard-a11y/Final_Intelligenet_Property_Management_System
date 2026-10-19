# Billing UI and UX update

The Manager Bills & Payments page uses selected Tabler patterns adapted to PropertyPro's existing HTML/CSS/JavaScript. No Tabler package, Bootstrap stylesheet, external font or backend replacement was added. The markup and CSS were authored for this application rather than copied from Tabler source.

References: [Tabler tables](https://docs.tabler.io/ui/components/table), [empty states](https://docs.tabler.io/ui/components/empty), and [form elements](https://docs.tabler.io/ui/forms/elements). These informed divider-based rows, grouped toolbar controls and contextual feedback. Our existing blue palette, mobile record layout and billing actions remain in use.

## Changes

- Billing Records groups search, category and status filters in one toolbar. Rent statuses and utility tracking statuses have separate labels. Visible result counts update as filters change; zero matches show recovery guidance and a Clear filters action.
- Filters survive reload through URL query parameters. Filtering changes existing row visibility without rebuilding the page, so typing retains focus. Switching tabs uses already loaded data and preserves scroll position; Arrow keys, Home and End operate the tab bar.
- The billing summary counts unpaid rent separately from utilities. Utility records no longer show an awaiting-rent-payment action label. Rejected rent reports are excluded from pending report counts.
- Intake empty-state guidance points to the existing upload and mailbox actions. Review document is the primary action on a source; downloads and corrections remain available.
- Shared workflow dialogs show native field-validation messages beside invalid fields and a persistent inline message for failed saves. Entered values remain intact, valid corrections clear field errors, and the existing busy/save feedback prevents repeated submissions. Server errors are not guessed to belong to a particular field.
- Table rows align values and actions consistently. Search/filter targets remain usable on phones, long actions wrap, and status explanations use secondary text.

## Verification

Four distinct existing browser suites passed: comprehensive role/workflow tests, routing and navigation tests, the all-role responsive audit, and source-review tests. Added checks exercise combined search/category/status filtering, zero-match recovery, reload persistence, keyboard tab switching, required-field feedback, and retained values after a simulated failed save followed by a real successful correction. The responsive audit covers 1440px, 820px, 390px and 320px screens.

These checks verify the exercised scenarios. This UI pass did not repeat the complete backend suite or live provider/SMTP acceptance tests. No Git push was made.
