# Current interface review ? 27 October 2026

The implemented gallery now contains 49 UI screenshots. The current shared presentation uses a blue sidebar, blue-gray desktop header and pale blue phone bottom navigation. Manager decisions are shown as individual pending records, Staff and Manager now share a selectable Case Sheet with extracted values, protected original access and inline correction forms, and Tenant home groups rent and personal utility tracking without another surrounding card for every section. Existing tables, record status labels and role-permitted actions remain in their respective application pages.

The final polish adds next-step guidance, collapsible extracted fields and recoverable preview/page loads; the 49 screenshots were regenerated again. The 27 October Case Sheet refresh includes the Manager decision view and Staff desktop/phone correction sheets (47, 48 and 49). The regenerated screenshots were checked for horizontal page overflow and runtime errors. Manager, Tenant desktop/mobile, Staff source comparison/dashboard and Admin overview were visually inspected. Browser regression evidence and its limits are recorded in the [QA report](qa-report.md); screenshots alone do not establish actual-device acceptance, performance or user satisfaction. See [the design rules](interface-design.md) and [the current gallery](../../reports/mockups/README.md).

The findings below are historical observations from 16 October, rather than instructions to reapply without checking the current screens.

# Interface screenshot review ? 16 October checkpoint

The gallery was refreshed to 45 UI screenshots on 23 October, including Staff. Findings below describe the 16 October checkpoint and should be rechecked against the [current gallery](../../reports/mockups/README.md) before implementation.

Reviewed 16 October 2026 after regenerating all 42 portal/document screenshots, the three email previews and icon comparison from isolated synthetic data. The gallery is [here](../../reports/mockups/README.md). Screenshots demonstrate appearance; automated browser tests separately check interactions. Contact sheets were used to compare all screens, with the new Admin desktop, phone and evidence views inspected at full size.

The blue-gray desktop header, dark-blue mobile header, light bottom navigation, distinct rent and utility actions, OCR side-by-side review, and compact monochrome receipts form a consistent design. The capture script detected no horizontal page overflow at its recorded viewports and no browser runtime errors. This does not establish support for every device or full accessibility conformance.

| Priority | Finding and example | Recommended next improvement |
| --- | --- | --- |
| High | The Admin phone view spends most of the first screen on three summary cards ([41](../../reports/mockups/41-admin-status-mobile.png)) | Use one compact summary strip on phones so actual status results appear sooner. Keep the detailed desktop view. |
| High | Long user references wrap across recent-maintenance entries ([05](../../reports/mockups/05-admin-dashboard.png)) and audit rows ([34](../../reports/mockups/34-admin-audit.png)) | Lead with the person and action; reveal the complete reference on demand with a copy option. Preserve the full stored/exported ID. |
| Medium | The status list contains useful but lengthy operator guidance ([42](../../reports/mockups/42-admin-status-evidence.png)) | Keep one-line results visible; move less urgent next-step guidance into the existing evidence disclosure, with failure guidance always visible. |
| Medium | Utility reminders/disclaimers recur across bill, tracker and history surfaces ([11](../../reports/mockups/11-tenant-bills-mobile.png), [27](../../reports/mockups/27-receipt-list-desktop.png)) | Retain "Provider payment not verified" at the tracking action; consolidate repeated explanatory footnotes within each page. |
| Medium | Desktop settings and portfolio screens have substantial unused space with small demo datasets ([10](../../reports/mockups/10-manager-settings.png), [02](../../reports/mockups/02-property-management.png)) | Keep forms at a readable width; add concise setup guidance only for genuinely empty states. Avoid filling space with extra charts or decorative cards. |
| Medium | The phone home prioritizes rent and utilities; its calendar sits farther down ([06](../../reports/mockups/06-mobile-tenant.png), [23](../../reports/mockups/23-calendar-next-month-mobile.png)) | Offer a small "Next due" link that scrolls to the existing calendar. Keep rent estimates distinct from actual utility dates. |

These are recommendations, not newly implemented features or manuscript changes. Prioritize the first two before adding animation or new dashboard metrics. Native disclosures and CSS transitions remain sufficient; no additional UI or animation library is needed for these refinements.
