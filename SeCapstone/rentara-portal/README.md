# Rentara portal

Node.js 24+, SQLite and HTML/CSS/JavaScript. This folder is the application; research documents, diagrams and generated presentation files live beside it under `SeCapstone`.

| Need | Open |
| --- | --- |
| Start/install the application | [Repository setup](../../README.md) |
| Run the current Group 3 demonstration | [Group 3 guide](../reports/demo-files/group-3/README.md) |
| Start a clean operational portfolio | [Operational profile](docs/development-guide.md#separate-operational-profile) |
| Work on code / find the right files | [Development guide](docs/development-guide.md) |
| Understand Staff/Manager permissions | [Implemented role workflow](docs/staff-implementation-plan.md) |
| Test manually / inspect verification | [Test guide](docs/manual-test-guide.md), [QA evidence](docs/qa-report.md) |
| Find any other setup/integration guide | [Documentation index](docs/README.md) |

For a new groupmate laptop, run these commands from this folder:

```powershell
npm.cmd ci
npm.cmd run demo:group
```

`demo:group` detects the current local IPv4, prepares missing member input, both Group 3 test workspaces, Staff accounts, HTTPS certificates and `.env.acceptance`, then starts the server. Valid HTTPS settings are reused; a changed IP or expiring/mismatched certificate causes a refresh. Common VM/VPN adapters are skipped. Windows default-route information helps select a physical network; if unavailable, an unambiguous Wi-Fi/local adapter is used. No external internet probe is needed to detect the IP. If selection is ambiguous, use `npm.cmd run demo:group -- --ip YOUR_LAPTOP_IPV4` rather than guessing.

On Windows x64, missing mkcert is downloaded from the pinned official v1.4.4 release and SHA-256 checked before installation. Initial tool/dependency downloads require internet. An existing `MKCERT_PATH` is supported; other platforms need their own mkcert installation. Existing demo records, passwords and the local certificate authority are preserved on rerun. Shared files supply the setup; generated private databases and certificate keys stay local. `npm.cmd run setup:group -- --ip YOUR_LAPTOP_IPV4` remains available to prepare configuration without starting the server.

Use `https://localhost:8444/` on the hosting laptop and `https://YOUR_LAPTOP_IP:8444/` on phones connected to the same Wi-Fi. Trust that laptop's CA using the [Android/laptop certificate guide](docs/local-acceptance-setup.md#trust-the-certificate-on-android); setup does not silently change device trust or firewall rules. Keep the server terminal open. Each hosting laptop has its own database, not a Git-synchronized copy of another laptop's records.

After changing Wi-Fi, stop with Ctrl+C and rerun `npm.cmd run demo:group`; the new IP is detected at startup. The launcher does not switch networks while already running. Ordinary pulls do not require resetting the database. Email intake and external delivery stay off by default; use `npm.cmd run demo:group -- --receive` only for the configured labelled email exercise. Add `--live-delivery` only for the agreed recipient exercise. The general `npm.cmd start` command remains the separate configured default portfolio on port 8080.

For a separate clean operational portfolio, run `npm.cmd run setup:operational` once to choose your Admin/Manager accounts, then `npm.cmd run start:operational`. It uses `.env.operational` and `data/operational` on port 8081 by default. Existing demos are preserved. Only shared connection settings are inherited; Operational intake and rent sending start off. Demo email and Push are blocked.

Do not run demo/setup generators over working records to refresh the interface. Dependencies, local test output and live data are not obsolete source files. Backups preserve working records; source files and the lockfile allow dependency installation on another laptop.
