# Application tools

Run these commands from `SeCapstone/rentara-portal`:

| Command | Purpose |
| --- | --- |
| `node tools/build-soa-demo-variants.mjs` | Reproduce the two fresh synthetic SOA-layout scanned PDFs; verify actual email-attachment OCR, allocation, Tenant visibility and duplicates in a disposable portfolio; no live data changes |
| `node tools/build-final-test-assets.mjs` | Reproduce fresh numbered synthetic inputs and verify real OCR/text/body parsing, allocation and held cases in a disposable portfolio; no working-data or Gmail changes |
| `python tools/build-final-review-kit.py` | Rebuild the Docs-ready reviewer Word file and blank 77-case workbook using Python/openpyxl; refuses to overwrite any recorded results or issue/retest data |
| `npm.cmd run setup:operational` | Prepare a separate local configuration and prompt privately for the initial workspace/Admin/Manager; empty portfolio, existing records preserved |
| `npm.cmd run start:operational` | Run the prepared operational database on port 8081 by default; shares allowlisted connection values only; separate data, label and enable switches |
| `node tools/prepare-meralco-group-demo.mjs` | Verify the anonymized SOA scan in a cloned Group 3 portfolio, back up and align Unit A's synthetic historical occupancy/mapping; add `--unit-b` to create/test a clearly labelled Unit B derivative. Does not import the presentation bill or send mail |
| `node tools/prepare-single-tenant-demo.mjs` | Generate/verify one scanned water bill for G3-B and prepare its mapping; no bill is pre-imported and no email is sent |
| `npm.cmd run setup:group -- --ip YOUR_LAPTOP_IPV4` | Prepare a fresh laptop: pinned official mkcert download on Windows x64, HTTPS/IP configuration, missing member input and two test workspaces; preserve existing records/passwords; no mailbox access or external delivery |
| `npm.cmd run demo:group` | Detect local IP, prepare missing Group 3 setup, refresh HTTPS only when needed, and start port 8444; `-- --ip ADDRESS` is the manual fallback; receiving/sending still require explicit switches |
| `npm.cmd run demo:group:prepare` | Generate and verify two Group 3 phone attachments, then prepare a separate two-unit/three-Tenant portfolio; missing member input comes from the shared example or existing demo marker; no utility bill is pre-imported |
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


For repeatable Chapter III development evidence, run the full suite first, wait for it to finish, then run `node tools/collect-chapter3-evidence.mjs --output ../reports/updates/chapter-3-development-evidence-YYYY-MM-DD.json`. Use the actual run date. The collector opens only disposable data and the existing sample catalog, records installed versions and complete-response loopback timings, and compares six normalized values per input representation. It does not load .env or use external mail/Push. Current Windows hardware metadata can be supplied through `data/chapter3-system.json`; it is whitelisted and optional. Interpret the JSON limits before quoting results: fixtures are not participants, variants are not independent bills, and loopback request loops are not human users or production capacity.


Group 3 restricted live delivery: `npm.cmd run demo:group -- --receive --live-delivery`. Receiving and outgoing delivery are separate options. Normal demo stays off. Live delivery uses only approved group recipients, new session events and freshly registered test-phone subscriptions; see the [controlled demo guide](../docs/development-guide.md#controlled-live-demo-delivery). This command may send actual messages when eligible new events occur; automated implementation checks use simulated transports.


`npm.cmd run demo:workspaces:prepare` adds the second synthetic business to an already prepared Group 3 database after a consistent SQLite backup. It refuses other profiles, preserves original business records and accounts, and never resets an existing fixture workspace. It adds a separate Manager/Staff/three Tenant logins, two units, sample utility/rent bills and one staged correction case. Bayan's external integrations are blocked. See the [test walkthrough](../docs/manual-test-guide.md#two-workspace-final-walkthrough).


`node tools/verify-security-guards.mjs` runs four targeted positive/negative guard checks in disposable source copies under ignored `data/security-guard-checks`. It copies no credentials, runtime databases or private originals, disables inherited integration settings for child runs, records logs/hashes and removes the copies afterward. The four negative child tests are expected to fail assertions; the driver exits successfully only when each baseline passes and the intended bypass is detected. It never mutates the working control files and is separate from the ordinary full regression suite. See the [verification record](../../reports/updates/admin-read-only-review-2026-11-01.md).
