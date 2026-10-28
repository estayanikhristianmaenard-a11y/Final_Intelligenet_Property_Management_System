# Local Gmail setup

Use the selected account, **rentara2026@gmail.com**. Gmail settings are in `.env`. The project owner has explicitly chosen to make this team-owned file eligible for Git so the three group members can share the account configuration. Anyone with repository access will receive credentials committed in that file. No message is sent by changing ignore rules.

## 1. Create the app password

1. Sign in to the correct Google account.
2. Open Google Account, then Security, and enable 2-Step Verification.
3. Open [App passwords](https://myaccount.google.com/apppasswords).
4. Create an app password named **Rentara local demo**.
5. Enter it in the fields below. Do not paste the password into chat, screenshots or reports; the owner has chosen the team-owned `.env` as the sharing method.

Google requires 2-Step Verification for app passwords. Some account configurations do not offer them; see [Google's app-password guidance](https://support.google.com/accounts/answer/185833?hl=en). The generated app password is different from the normal Gmail sign-in password.

## 2. Update the local file

Open `.env` inside `SeCapstone/rentara-portal`. Replace the blank values after these keys with the generated app password, without the display spaces:

```dotenv
SMTP_PASSWORD=
IMAP_PASSWORD=
```

Keep `RENT_EMAIL_ENABLED=false` until a deliberate sending check is ready. The prepared non-secret settings use `smtp.gmail.com` on port `587` and `imap.gmail.com` on port `993`. SMTP uses STARTTLS; IMAP uses TLS. See [Google's outgoing server settings](https://support.google.com/mail/answer/7104828?hl=en) and [incoming server settings](https://support.google.com/a/answer/9003945?hl=en).

Save the file. From the portal directory run:

```powershell
npm.cmd run integrations:check
```

This command reports missing **key names**, not their contents. It does not authenticate, send mail, retrieve messages, alter records or verify delivery. It checks the default workspace only, not private integration overrides for other workspaces.

## 3. Keep showcase records separate

The existing showcase intentionally blocks external integrations. `blocked_by_showcase` is expected even after passwords are saved. Do not remove the showcase marker or enable sending to its synthetic tenant addresses.

For the live acceptance session, use a separate non-showcase database/configuration, an agreed recipient and real authorized account addresses. First check authentication without sending, then confirm one agreed notification in the recipient's inbox. Confirm the portal link opens on that device. `localhost` links work only on the laptop; a phone needs an accessible laptop/network or hosted address.

The same Gmail account may support property-mailbox intake and outgoing rent email, but those are separate checks. Incoming provider formats and attachments still need to be verified with actual received samples. SMTP acceptance is not proof of inbox arrival or reading. Phone Web Push is another acceptance step and needs a supported secure context; ordinary LAN HTTP is not sufficient.

Restart the backend after changing configuration when the live session is ready. Sharing `.env` does not enable sending or remove showcase restrictions. No change to the approved billing or utility-tracking workflow is required.

## Group 3 automatic routing and live check - 23 October 2026

The user saved this Gmail filter on the property account: **To:** `rentara2026@gmail.com`; **Subject:** `Group 3 Demo`; **action:** apply `Rentara-Group3-Demo`. Existing matching conversations were left unchecked. No delete/archive/forward action was requested. This is a demo-routing rule, not a verified production sender rule; actual provider filters need their verified sender/format and the business's intended label. Account mapping, not subject/sender, determines the bill's unit.

One synthetic scanned Unit A email was sent through SMTP and observed under the label without manual labelling. Real IMAP retrieval and the normal automatic OCR/billing flow produced two PHP 450.00 Tenant shares and portal alerts. Duplicate sync did not create another charge. Tenant email/Push delivery stayed off. The fresh bill remains in Group 3 for viewing. See [dated QA evidence](qa-report.md).

From the application directory, `node tools/verify-gmail-demo.mjs --check` deliberately verifies Gmail authentication/label access without sending. `--send` is an explicit one-message, self-addressed live test and refuses when a prior submission is recorded. **Do not run --send again for this completed test.** `--verify` checks the exact recorded message/attachment, backs up the database and uses one automatic processing cycle; it does not start a persistent portal server. Its private report is `data/group-demo/live-gmail-test.json`. Normal Group 3 startup remains `npm.cmd run demo:group -- --receive`.

Google documents [filter creation/import](https://support.google.com/mail/answer/6579?hl=en). Programmatic filter creation needs the [Gmail settings OAuth scope](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.settings.filters/create); IMAP label creation is a separate capability. No connector or new OAuth configuration was installed for this check.
