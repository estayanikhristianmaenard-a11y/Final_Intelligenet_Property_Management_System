# Git integration review — 12 October 2026

Recommendation: use the groupmate's Node.js/SQLite application for controlled local capstone development. It covers more approved workflows and retains a coherent frontend/server combination. This is not a claim of production readiness or an error-free system.

## Preserved versions

- Laravel: `ffbb2b4` on local staging and `backup/local-laravel-20261012`.
- Fetched main: `990cfb3`.
- Node review checkout: `.integration/main-review`.
- Combined-history branch: `integration/node-review`, at `.integration/node-candidate`.
- Main, remote branches, local secrets, and existing MySQL records were not replaced or pushed.

## Checks

Local Laravel passed 12 backend tests, 94 assertions. Fetched Node passed 24 backend tests and one actual Edge browser test, covering portfolio, roles, corrections, payments, receipts, settings, downloads and session recovery. Real PDF/image fixtures exercised extraction. Fixture and test-transport results do not establish real Gmail or external Push acceptance.

## Integration method

Cookie/CSRF Laravel authentication, numeric IDs and MySQL migrations are incompatible with Node bearer sessions, text IDs and SQLite schema. The candidate therefore retains the groupmate's whole portal/server module rather than mixing API clients or authentication implementations. Local Laravel frontend adapters/plans/tests are preserved in the backup commit. Laravel backend source is retained as inactive reference code. Both commit histories are retained.

## Material limits

1. Node Managers share one organization/portfolio. Unlike local Laravel, it does not isolate independent Managers' property ownership. Separate landlords need explicit ownership scoping before use.
2. Node has one current lease/assignment per Tenant; billed transfers/renewals are protected rather than fully implemented. Laravel's multiple dated assignment model is not retained by Node.
3. Node generates eligible historical rent cycles; Laravel generates only today's due cycle. Verify the recovery behavior against the approved billing rules.
4. Live IMAP, external Push, real provider variants/scanned PDFs, public deployment, security and load testing retain acceptance gaps.
5. MySQL data/accounts are not migrated into SQLite. Node setup needs its own isolated database and accounts. Do not run setup against retained operational data without review.

## Next step

Review and run the candidate, then push a review branch and open a pull request if the team accepts the direction. Do not force-push, merge directly into main, combine the two databases automatically, or reintroduce Laravel API adapters into the Node portal.
