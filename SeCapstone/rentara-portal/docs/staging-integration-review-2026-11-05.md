# Staging integration review - 5 November 2026

## Result

Fetched origin/main and origin/staging and fast-forwarded local main from `18c4510` to `79f79c0` (Simplify demo startup with automatic IP and HTTPS setup). Main and the fetched staging tip are identical; main is three commits ahead of the fetched origin/main. No push performed.

Preserved all tracked/untracked local work in retained stash `552f999806ebbec4a71b45ae09b25aa80babe14b`; tracked-diff backup is ignored `data/pre-staging-local-2026-11-05.patch`. Restored responsive page width, all-role phone bottom navigation, phone helpers and local QA changes. Compared shell.js, fresh-mint.css and ui-audit.browser.test.js with the saved stash: no differences. Package scripts combined cleanly. Only qa-report.md conflicted; retained both dated histories and cleared the conflict. All restored edits remain unstaged.

## Scope and risk review

Incoming commit changes 16 tracked files. No server business-logic, authentication, authorization, billing or dependency/lockfile changes occur in this incoming range. Setup tooling still deserves attention because it downloads an executable and initializes local accounts/data.

| Files/area | Review |
| --- | --- |
| tools/setup-group-laptop.mjs | Fixed official mkcert release URL with pinned SHA-256; a rejected/failed download is not installed. Existing tool or explicit configured path is reused. External prerequisites are checked before Demo data creation. Existing member input is preserved; missing input beside a prepared database is recovered from its marker using a read-only connection. Existing Group 3 and workspace setup routines remain responsible for data preservation. |
| tools/start-group-laptop.mjs | Strict option parsing; skips common virtual/loopback/link-local adapters, uses physical default-route preference/fallback, and stops on ambiguous detection. Explicit IP bypasses detection. Child launch uses argument arrays, preserving delivery opt-in. No mailbox access unless explicitly requested. |
| tools/setup-local-https.mjs, tools/prepare-group-demo.mjs | Error guidance points to the new setup; member loading uses the shared preservation helper. Neither change alters extraction/allocation or login logic. |
| package.json, .gitignore, member template | New setup script and automatic Demo wrapper; data/certificates remain ignored. Local start:phone script is preserved separately. Shared member template initializes missing synthetic data; it is not a synchronized live database. |
| Two new setup/start test files | Cover account/record preservation, identity recovery, tool failures/checksum rejection, adapter/flag handling, setup-before-launch and failure-before-backend. Tests use disposable fixtures and injected transports. |
| Root/app READMEs, network/tool/next-session/Group 3 guides and QA report | Carry forward the new one-command startup and preserve both QA histories. Updated local phone-access.md so it no longer describes the older missing-database behavior as current. |

Production caller scope: setupGroupLaptop has two entry points (setup CLI and automatic launcher); loadGroupMembers has two production callers (setup and attachment preparation); localHttpsReady is used by setup reuse; ensureMkcert is its fallback prerequisite; startGroupLaptop has one CLI caller. Existing group/workspace initialization and the restricted start-group-demo backend are reused. Git history attributes these changes to `79f79c0`; no removed authentication/financial security guard required blame investigation.

Adversarial boundaries reviewed: a corrupt download must stop before executable installation; invalid/malformed options must stop before launch; an existing prepared portfolio must retain identities/passwords; changing network configuration must not enable delivery; missing data may initialize only the separate synthetic Demo. No new blocking security regression was confirmed in this focused review. It is not a penetration test or public-deployment review.

## Verification and remaining limits

Fresh combined targeted run: **31 passed, 0 failed, 0 skipped, 0 cancelled**, approximately 107 seconds. Suites: group-laptop-setup, group-laptop-start, group-demo-config, group-demo-workspaces, admin-visibility, ui-audit.browser, routing.browser and interaction-feedback.browser. Includes the 182 role/route/viewport layout combinations and restored phone navigation. Syntax: **157 JS/MJS files, zero failures**. git diff --check passed and no unresolved index entries remain.

This was a targeted integration run, not a rerun of the earlier full 155-test suite. No working profile setup, replacement Demo database, live mailbox retrieval, outgoing notification, firewall change or device trust installation was run during this merge. The user's existing-Demo preference remains: the automatic launcher was not executed against the working directory, since the incoming implementation can initialize missing synthetic Demo data. Restore the original Demo data before launch when exact existing records are required. Actual phone/network trust and live services remain separate acceptance checks.
