# Rentara tenant email templates

Sender account selected by the user: **rentara2026@gmail.com**. Use **Rentara** as its display name when configuring SMTP. Creating the account does not enable sending; authorized Gmail credentials still need to be configured locally. No email is sent by generating these previews.

Follow [the local Gmail setup guide](gmail-local-setup.md) and run `npm.cmd run integrations:check` for a configuration-only check. Marked showcase records remain blocked from external sends even when credentials are present.

| Notice | Subject | Main action |
| --- | --- | --- |
| Rent billing update | Rentara: rent billing update | View bill |
| Eligible rent reminder | Rentara: rent due-date reminder | View bill |
| Manager-confirmed rent payment | Rentara: rent payment confirmed | View payment record |

The sender includes both HTML and plain-text versions from `server/rent-email-template.js`. The responsive table layout uses inline CSS, a navy brand header, blue action button, fallback link and notification-preference instructions. It has no remote fonts, images, tracking pixels or attachments. Dynamic text and URLs are escaped for HTML. At the user's request, billing updates and reminders summarize the current bill total, billing month, due date and status. Bills containing advance rent identify it; full breakdowns, account identifiers and receipts remain behind portal sign-in. A confirmation notice does not substitute a possibly revised bill total for the original amount paid.

The existing eligibility, preferences, retry limits, duplicate prevention and delivery recording still apply. Utility email notices are excluded. Receipt links lead to the portal; sending a notice does not create another receipt or payment. Provider apps are not accessed.

Preview files are in [the email design folder](../../reports/email-previews). Their portal address is an illustrative `.example` URL and cannot open your running portal. Replace it through the existing `PORTAL_URL` configuration for an actual test; a phone cannot reach the laptop through `localhost`.

After SMTP is configured, restart Node and test with one authorized recipient outside the marked showcase. Check both Gmail desktop and phone rendering, fallback-link behavior, recipient preferences and the saved sending result. Server acceptance is not proof of inbox arrival or readership. Gmail-client rendering remains a live acceptance check.
