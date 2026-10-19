# Application tools

Run these commands from `SeCapstone/rentara-portal`:

| Command | Purpose |
| --- | --- |
| `node tools/generate-utility-samples.mjs` | Generate synthetic utility-bill fixtures for development checks |
| `npm.cmd run previews:refresh` | Refresh UI and email previews using disposable synthetic data |
| `npm.cmd run integrations:check` | Inspect default-workspace configuration presence and showcase restrictions without sending, connecting or printing credentials |
| `npm.cmd run verify:email-billing` | Check MIME/PDF intake, expected fields, Tenant billing data, portal alerts and duplicate protection in a disposable portfolio; no network connection or sending by default |
| `npm.cmd run setup:utility-intake` | Explicitly configure and verify the dedicated Gmail label with a synthetic fixture, then enable its retrieval in acceptance startup; outgoing rent email stays off |

See [email billing acceptance](../docs/email-billing-acceptance.md) for the verified results and remaining Android checks. The verification tool's explicit live-send option requires separate authorization. Acceptance startup keeps rent email off; mailbox retrieval is off by default and enabled only by the dedicated-label utility setup.

See [package.json](../package.json) for the script definitions and prerequisites. Generated previews live in [reports](../../reports/README.md); fixture guidance is in [utility samples](../docs/samples/utility-bills/README.md).

The separate [project tools directory](../../tools/README.md) contains the PowerShell local/LAN startup helper. Keep application fixture/preview generation here and workstation startup helpers there.
