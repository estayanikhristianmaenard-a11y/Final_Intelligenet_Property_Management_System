# Rentara portal

Node.js 24+, SQLite and HTML/CSS/JavaScript. This folder is the application; research documents, diagrams and generated presentation files live beside it under `SeCapstone`.

| Need | Open |
| --- | --- |
| Start/install the application | [Repository setup](../../README.md) |
| Run the current Group 3 demonstration | [Group 3 guide](../reports/demo-files/group-3/README.md) |
| Work on code / find the right files | [Development guide](docs/development-guide.md) |
| Understand Staff/Manager permissions | [Implemented role workflow](docs/staff-implementation-plan.md) |
| Test manually / inspect verification | [Test guide](docs/manual-test-guide.md), [QA evidence](docs/qa-report.md) |
| Find any other setup/integration guide | [Documentation index](docs/README.md) |

From this folder, install with `npm.cmd ci` on a new checkout. Use `npm.cmd start` for the configured default portfolio. Group 3 uses `npm.cmd run demo:group -- --receive` with its existing local acceptance configuration. Use the address printed by the selected command; these are different data profiles/ports.

Do not run demo/setup generators over working records to refresh the interface. Dependencies, local test output and live data are not obsolete source files. Backups preserve working records; source files and the lockfile allow dependency installation on another laptop.
