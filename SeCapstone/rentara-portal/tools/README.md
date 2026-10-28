# Application tools

Run these commands from `SeCapstone/rentara-portal`:

| Command | Purpose |
| --- | --- |
| `node tools/prepare-meralco-group-demo.mjs` | Verify the anonymized SOA scan in a cloned Group 3 portfolio, back up and align Unit A's synthetic historical occupancy/mapping; add `--unit-b` to create/test a clearly labelled Unit B derivative. Does not import the presentation bill or send mail |
| `node tools/prepare-single-tenant-demo.mjs` | Generate/verify one scanned water bill for G3-B and prepare its mapping; no bill is pre-imported and no email is sent |
| `npm.cmd run demo:group:prepare` | Generate and verify two Group 3 phone attachments, then prepare a separate two-unit/three-Tenant portfolio from local `data/group-demo-members.json`; no utility bill is pre-imported |
| `npm.cmd run demo:group -- --receive` | Prepare/check Gmail label `Rentara-Group3-Demo`, start Group 3 on local HTTPS port 8444 and receive only that label; rent email sending stays off |
| `node tools/generate-utility-samples.mjs` | Generate synthetic utility-bill fixtures for development checks |
| `npm.cmd run previews:refresh` | Refresh UI and email previews using disposable synthetic data |
| `npm.cmd run integrations:check` | Inspect default-workspace configuration presence and showcase restrictions without sending, connecting or printing credentials |
| `npm.cmd run verify:email-billing` | Check MIME/PDF intake, expected fields, Tenant billing data, portal alerts and duplicate protection in a disposable portfolio; no network connection or sending by default |
| `npm.cmd run setup:utility-intake` | Explicitly configure and verify the dedicated Gmail label with a synthetic fixture, then enable its retrieval in acceptance startup; outgoing rent email stays off |
| `npm.cmd run backup:restore -- BACKUP_FOLDER NEW_DATA_DIRECTORY` | Validate and restore a complete recovery folder into a new directory; does not start the server or enable integrations |

See [email billing acceptance](../docs/email-billing-acceptance.md) for the verified results and remaining Android checks. The verification tool's explicit live-send option requires separate authorization. Acceptance startup keeps rent email off; mailbox retrieval is off by default and enabled only by the dedicated-label utility setup.

See [package.json](../package.json) for the script definitions and prerequisites. Generated previews live in [reports](../../reports/README.md); fixture guidance is in [utility samples](../docs/samples/utility-bills/README.md).

The separate [project tools directory](../../tools/README.md) contains the PowerShell local/LAN startup helper. Keep application fixture/preview generation here and workstation startup helpers there.

- `setup-staff-demo.mjs` / `npm run demo:staff:prepare`: back up the existing Group 3 database and add a local Staff account without resetting business records. See [handoff](../docs/staff-implementation-plan.md).

- `node tools/verify-gmail-demo.mjs --check|--send|--verify`: deliberate Gmail self-test with fixed property-account recipient, pre-send backup, submission replay guard, observed label routing and the actual Group 3 OCR/billing pipeline. The 23 October sample is already verified; use `--verify`, not another send. See [Gmail setup](../docs/gmail-local-setup.md).
