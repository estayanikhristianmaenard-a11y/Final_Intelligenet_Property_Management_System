# Local acceptance and Android HTTPS

This setup runs on the laptop without paid hosting. It keeps the populated showcase in its existing database and creates a separate portfolio at `data/acceptance/propertypro.sqlite`. The property, Tenant, rent and utility account numbers are test records. The Tenant's email is the agreed team account, **rentara2026@gmail.com**.

## Start the prepared setup

From the repository root:

```powershell
.\SeCapstone\tools\start-acceptance.ps1 -LanAddress 192.168.1.71
```

Use the laptop's current Wi-Fi IPv4 address from `ipconfig` if it changes. The helper refreshes the server certificate for that address, preserves the local CA and VAPID keys, preserves existing acceptance records, and starts HTTPS on port **8443**. Stop it with Ctrl+C. It does not change the normal showcase startup.

Alternatively, from `SeCapstone/rentara-portal`:

```powershell
npm.cmd run setup:acceptance
npm.cmd run setup:https -- --ip 192.168.1.71
npm.cmd run start:acceptance
```

The setup commands have already been run on this laptop. Setup refuses to replace another portfolio. Rerunning it does not reset payments or Tenant edits. The HTTPS profile lives in ignored `.env.acceptance`; shared Gmail credentials and stable VAPID keys remain in the team `.env`. Rent email sending always stays off in acceptance startup. Utility retrieval is off by default, but the user subsequently approved and enabled the dedicated Gmail-label intake described below. This setting survives certificate regeneration and does not affect normal showcase startup.

## Utility email intake

The dedicated Gmail label **Rentara-Utility-Acceptance** has been created and verified using a clearly labelled synthetic email fixture stored through IMAP. This was not an actual Meralco email and no provider email was sent or impersonated. Actual Gmail retrieval, PDF extraction, Tenant assignment, portal notification and repeat-sync protection passed for that fixture.

Acceptance startup now reads `data/acceptance/utility-intake.json`. When enabled, it retrieves only the dedicated label using the agreed Gmail account from `.env`, while keeping outgoing rent email off and ignoring workspace integration overrides. The scheduler checks about every five minutes while the backend runs; its one-minute tick does not mean it retrieves email every minute. Normal `npm.cmd start` still uses the existing showcase configuration.

For a groupmate's laptop, explicitly set up the label intake after the ordinary acceptance setup:

```powershell
npm.cmd run setup:utility-intake
npm.cmd run start:acceptance
```

The setup connects to Gmail, creates/reuses the label, appends the labelled synthetic fixture once, imports that label into the acceptance database, and checks a repeat sync. It does not send a utility email or enable outgoing rent mail. Do not run it against a different shared Gmail account. A failed verification does not newly enable intake. Configuration and the compact verification report remain under ignored `data/acceptance/`.

To pause retrieval:

```powershell
npm.cmd run setup:utility-intake -- --disable
```

Restart the acceptance server after enabling or disabling. Changing the file does not stop a server that already loaded the old settings.

### Route actual provider messages

Gmail does not automatically apply this new label to provider emails. When an authorized provider bill arrives, select it in Gmail and apply **Rentara-Utility-Acceptance**, or create a Gmail filter from its actual sender/billing criteria with that label as the action. Avoid a broad filter that labels all inbox messages. Follow [Google's filter instructions](https://support.google.com/mail/answer/6579). Gmail's filter requires a manual account-side step; IMAP setup does not create Gmail filters or subscribe an account to provider billing.

Configure the actual verified provider/account-to-unit mapping in Manager settings before importing actual bills. Current acceptance mappings are synthetic test accounts, not your real CAN. A masked account number must go to review; do not guess its hidden digits. No actual provider-format success is claimed from the synthetic fixture. Keep testing in this separate portfolio until actual authorized bills and mappings have been checked.

| Role | Email | Initial local password |
| --- | --- | --- |
| Tenant | rentara2026@gmail.com | LocalDemo!2026 |
| Manager | manager@propertypro.ph | LocalDemo!2026 |
| Admin | admin@propertypro.ph | LocalDemo!2026 |

These passwords are for this local test portfolio. The Tenant starts on 1 August 2026 with PHP 6,000 monthly rent; the first cycle includes a separate one-month advance. Catch-up rent cycles follow normal rules. The anonymized Meralco fixture provides an electricity bill of PHP 1,567.17 due 8 October 2026. These old dates are intentional test history, not live provider charges. Mappings also accept the catalog's `TEST-MERALCO-001` and `TEST-WATER-001` samples. Other sample accounts can correctly require Manager review. The prepared digital PDF uses direct text extraction; use the scanned version in a separate test to exercise OCR. Uploading the same bill again should produce a duplicate hold.

Setup notifications remain visible in the portal but are marked skipped for external delivery. They will not become an email backlog when a later check enables sending. Future permitted Web Push events require a subscribed device and a new eligible event.

## Trust the certificate on Android

1. Copy **only** `data/local-tls/rentara-local-ca.cer` from the laptop to each phone, for example through a USB cable.
2. On each Android phone, open Settings and search for **CA certificate** or **Encryption & credentials**. A common path is Security & privacy > More security settings > Encryption & credentials > Install a certificate > CA certificate. Choose the transferred file. A screen lock or confirmation may be required; labels vary by manufacturer.
3. Close and reopen Chrome, then open **https://192.168.1.71:8443/**. Use the current laptop address after regenerating the certificate if it changes. The page must open without a certificate warning before testing Push. Merely bypassing a warning does not establish a trusted secure context.
4. Sign in as the acceptance Tenant. In notification settings, enable browser notifications and accept Chrome's permission request. Test with a new eligible billing event; record whether the actual phone receives it.

Both phones and the laptop need a network that permits device-to-device traffic. Allow Node's inbound TCP port 8443 through Windows Firewall for the network being used; do not disable the firewall. A hotspot can block traffic between connected clients even when its own phone reaches the laptop. Using the same Wi-Fi does not by itself prove connectivity.

This CA is only for development devices you control. Never transfer or commit `data/local-tls/ca/rootCA-key.pem` or `data/local-tls/portal-key.pem`. Remove the installed test CA from the phone's user credentials after the demo. The entire `data/` folder remains ignored. Trusting this CA on a phone does not install trust on another phone.

Sources: [mkcert local and mobile certificates](https://github.com/FiloSottile/mkcert#mobile-devices), [Google Android certificate settings](https://support.google.com/pixelphone/answer/2844832), and [MDN Push API requirements](https://developer.mozilla.org/en-US/docs/Web/API/Push_API).

## Trust the laptop browser, if needed

To open `https://localhost:8443/` in a laptop browser without a warning, deliberately install the same CA for your Windows user:

```powershell
# From SeCapstone/rentara-portal. Public certificate only.
certutil -user -addstore Root data\local-tls\rentara-local-ca.cer
```

Review the Windows confirmation. This trust change has not been performed automatically. Remove this specific certificate afterward through Manage user certificates > Trusted Root Certification Authorities. Preserve its identity before removal; do not delete unrelated certificates.

## Recreate certificates on a groupmate's laptop

Install Node.js 24+ and the locked dependencies (`npm.cmd ci`). Download the official mkcert executable from [mkcert releases](https://github.com/FiloSottile/mkcert/releases), place it at `data/tools/mkcert.exe`, or set `MKCERT_PATH` to an existing mkcert executable. This laptop uses **mkcert v1.4.4**, downloaded from its official GitHub release. Run the three commands above with that laptop's address. Each laptop creates its own CA; do not share the private CA key to avoid repeating installation.

## Limits and remaining checks

- The laptop must stay on with the server running. This is LAN access, not access from unrelated Wi-Fi networks.
- Portal use and local OCR do not require a hosting subscription. Gmail sending/retrieval and browser Push services need internet access and remain subject to provider restrictions.
- No actual provider emails have been verified. A synthetic fixture was retrieved from the dedicated Gmail label, and an earlier separately authorized rent self-test reached the team inbox. Ongoing outgoing rent mail remains off.
- A trusted HTTPS request on the laptop does not prove Android trust, permission, Push delivery, inbox delivery, or representative OCR accuracy. Record those results separately in the [manual test guide](manual-test-guide.md).
