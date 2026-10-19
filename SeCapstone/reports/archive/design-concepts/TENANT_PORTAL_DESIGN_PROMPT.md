# PropertyPro design proposal

Status: concept for approval; no application changes authorized by this document.

## Reusable design prompt

Polish the existing PropertyPro web portal using its Node.js, SQLite, and vanilla HTML/CSS/JavaScript stack. Preserve existing routes, backend behavior, role permissions, and working actions. Start with the Tenant experience on phones, then adapt the same visual system to desktop and Manager/Admin pages.

Use warm white surfaces, dark charcoal text, and one muted teal accent. Use readable sans-serif typography, aligned currency figures, modest corner radii, subtle borders, and generous but practical spacing. Avoid gradients, decorative dashboard charts, oversized welcome banners, excessive cards, and unrelated features.

Prioritize what the tenant needs: rent amount and due date, rent payment status, utility bills and personal tracking, billing history, confirmed rent receipts, and saved notifications. Show rent and utilities separately. The rent action must say "Report rent payment" and must not imply online payment processing. Preserve Unpaid, Tenant Reported Paid, and Paid. Utility tracking must retain Not Marked Paid and Self-Reported Paid, with "Provider payment not verified." Never show a Manager-confirmed utility receipt.

Make one primary action prominent per section. Phone controls must have at least 44px touch targets, labels must remain readable, and key actions must not require horizontal scrolling. Use a compact header with menu, PropertyPro name, and notifications. Keep navigation accessible through the existing mobile drawer and desktop sidebar. Do not introduce new navigation destinations solely for the mockup.

Design clear loading, empty, error, pending, and success states. Include visible keyboard focus, sufficient contrast, semantic markup, and subtle 150–200ms feedback that respects reduced-motion settings. Approval is required before implementing this proposal.

## Image brief

Create a high-fidelity reference board showing the same Tenant home page on desktop and phone. Use illustrative data, not real tenant information. Show Maria Santos, Unit A-03, October 2026 rent of PHP 4,500.00 due October 20, Unpaid; electricity PHP 523.90 and water PHP 186.25, both Not Marked Paid. Make the desktop view and phone view consistent. The image illustrates appearance only; it does not prove functionality.
