# Task-focused Manager dashboard concept

Status: visual reference for user review. The live dashboard was not modified.

Open `MANAGER_DASHBOARD_CONCEPT.png` for the desktop and phone comparison. `MANAGER_DASHBOARD_CONCEPT.svg` is the editable vector source. The preview uses illustrative records based on the separate showcase: a pending rent report, two unpaid rent records, and one unmapped utility source. It is not a live API capture or a result of participant evaluation.

## Direction

- Keep the approved navy/blue palette and desktop hover sidebar. Logout remains above the sidebar user avatar; phone navigation uses the existing drawer. No top-right account dropdown.
- The menu area scrolls vertically when navigation exceeds the available height. Keep the brand header and Logout/user footer visible; apply this to the desktop rail, expanded sidebar, and phone drawer.
- Put work requiring a Manager decision first. A rent report opens review rather than immediately changing the bill to Paid. The actual payment must be checked before confirmation.
- Replace the four equally prominent statistical cards with a compact text summary. Group related rent records in one panel, use restrained borders, and avoid nested decorative cards and dashboard slogans.
- Place the original-source review task beside rent on desktop. Utility intake remains distinct from rent payment confirmation. No Manager-confirmed utility payments or utility receipts are implied.
- Stack review tasks on phones with readable details and 44px primary actions. Supporting property totals and full history can remain in their existing destinations.
- Retain actual loading, empty, error, and pending states when implemented. This SVG shows a populated example only; no new backend functions, analytics, or notification promises are proposed.

## Intended existing destinations

Upload bill opens the existing utility upload workflow. Review report opens the existing pending rent report; Review source opens the protected source-comparison/correction workflow. Outstanding rent, property records, and activity links use existing authorized views. Review navigation should preserve context after a correction or confirmation.

The concept follows the installed Taste redesign guide. An accessibility/usability check can follow implementation; this preview does not claim compliance or complete functionality. The Tenant home remains a separate role-specific screen with rent, personal utility tracking, calendar, and history.
