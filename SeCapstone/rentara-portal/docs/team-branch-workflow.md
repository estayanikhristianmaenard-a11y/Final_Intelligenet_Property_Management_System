# Rentara: salitang workflow sa main

Updated 23 October 2026. Current approach natin: **salitan ang trabaho, shared main, malinaw na handoff**. This replaces the earlier three-branch proposal. Separate Backend, Frontend, QA branches and staging are not required for everyday work.

Documentation lang ito. Walang branch, commit, pull, push, merge o Staff implementation na ginawa sa update na ito. Users handle Git pushes manually. The implemented Staff permissions and API details are in [the implementation handoff](staff-implementation-plan.md).

## 1. Simple cycle

```text
Claim turn -> pull latest main -> one task -> check/test
           -> commit -> sync -> retest if changed -> push
           -> handoff -> next member checks and pulls
```

One active code-changing turn at a time. Others can prepare test cases, read code and plan the next task. Kung sabay ang actual implementation, coordinate or use temporary branches instead.

## 2. Bago mag-code

Message sa group:

> Ako muna sa login cleanup. Files: login page and related styles. Pull muna ako ng latest main. Update ko kayo kapag pushed at ready for checking.

Agree on the task, expected behavior and files. For connected frontend/backend work, agree on API fields and responses first. Hindi kailangan na laging hiwalay ang frontend at backend author: one member can finish a small complete feature if kaya niya and clear ang ownership.

From the repository, starting with a clean working tree:

```powershell
git status
git switch main
git pull --ff-only origin main
```

Stop if may error or existing uncommitted work. Preserve/commit that work deliberately before switching; huwag mag-reset o mag-delete para lang maging clean ang status. `--ff-only` stops if histories diverged instead of silently merging.

## 3. Bago mag-push

1. Review `git diff` and `git status`.
2. Check the affected functions. UI: actual screen/actions and relevant mobile widths. Backend/billing: appropriate automated tests and forbidden-action checks. Run the full regression when the size/risk of the integrated changes justifies it, not after every text edit.
3. Stage only intended files and make a clear commit:

   ```powershell
   git add path/to/changed-file
   git commit -m "Improve login form spacing"
   ```

   Replace the example path and message. Hindi runnable as-is ang placeholder path.

4. With committed work and a clean tree, sync your own new unpublished commits:

   ```powershell
   git pull --rebase origin main
   ```

   This brings in remote updates and reapplies local commits; their IDs can change. Do not use this to rewrite already-shared history. If someone else pushed during your turn, inspect and retest the affected combined behavior. Kung may conflict, stop and coordinate; do not blindly skip commits or discard files.

5. After successful sync and checks:

   ```powershell
   git push origin main
   git rev-parse --short HEAD
   ```

If rejected ang push, sync and resolve the cause together. **Never force-push main.** Small working changes belong on main; unfinished work that breaks the demo should stay on a temporary branch.

## 4. Handoff after each push

```text
Done/pushed: <task>
Commit: <actual short ID>
Changed: <main files/functions>
Checked: <actual tests/device checks>
Setup: <migration, dependencies or restart needed; or none>
Pending: <known limitation; or none>
Next: <next member/task>
```

Developer checks before pushing; another member independently checks after the push, before unrelated code changes begin. Important failures get fixed first. Use **Passed, Failed, Blocked/Not ready, Not tested**. An unfinished API dependency is not an end-to-end pass.

## 5. Paano ang QA without a separate branch?

QA is a responsibility, not a required branch. Puwedeng mag-rotate ang reviewer para everyone contributes and can explain their work.

- While someone codes, QA prepares scenarios and expected results.
- Once pushed, QA tests the same commit running on the main demo laptop using a browser or connected phone and the agreed test accounts.
- Repo access lets groupmates read pushed code, but does not automatically grant app permissions. Uncommitted code on another laptop is not visible here.
- QA records the tested commit, steps, expected/actual behavior and device/browser. Test/report files can be committed during QA's next agreed turn on main.
- Backend authors still write appropriate tests; independent QA checks the results rather than taking over the implementation.

Example after Staff is implemented: Staff proposes a bill correction; live amount stays unchanged; Manager authorizes; validation passes; assigned Tenant sees the correct bill. Separate isolated API tests must reject unauthorized Staff writes and cross-workspace access. A hidden button alone is not proof of backend protection.

Bug report:

```text
Commit tested: <ID>
Device/browser and role: <details>
Steps: <reproduction>
Expected: <agreed behavior>
Actual: <observed behavior>
Result: Failed
Assigned to: <member>
Retest: Pending
```

Record actual phone delivery separately from portal-alert creation or transport acceptance. Do not claim tests passed if they were not run.

## 6. Main laptop and database

- Your laptop runs the combined main version and shared demo database. Phones use different permitted accounts against the same server.
- Pause tests and stop the server before pulling/changing code on that laptop. Restart afterward so old backend code is not mixed with newly changed frontend files.
- Pull shares code, not local databases, sessions, uploads or TLS setup. Another laptop has separate data unless deliberately set up/restored.
- One member coordinates schema/migrations. Back up demo data before relevant changes; never wipe or overwrite the database just to fix a setup error.
- Only the designated shared server retrieves the agreed Gmail label during group tests. Use isolated fixtures/transports elsewhere unless a live action is agreed.
- Run `npm.cmd ci` for fresh installs or changed dependencies/lockfile, not every small CSS edit.

Existing Group 3 startup, from `SeCapstone/rentara-portal` with local setup/data already prepared:

```powershell
npm.cmd run demo:group -- --receive
```

Laptop: `https://localhost:8444/`. Phones: `https://CURRENT_LAPTOP_IP:8444/`, with reachable networking and local certificate trust. Keep the laptop awake and terminal running. See [Group 3 setup](../../reports/demo-files/group-3/README.md) and [manual tests](manual-test-guide.md).

Temporary branches are optional for large unfinished permissions/database work, parallel coding, or changes that would break the current demo. Hindi required ang permanent three-branch process.

## 7. Starting prompt for each member's AI

> Read `AGENTS.md`, `SeCapstone/rentara-portal/docs/capstone-scope.md`, and `SeCapstone/rentara-portal/docs/team-branch-workflow.md`. Salitan kami on main. My task is <task>, agreed files are <files>. Follow our agreed permission/API plan once available. Preserve existing features and run appropriate checks. Report changes, tests and pending setup. Do not create branches, commit, merge or push unless explicitly instructed; users handle pushes manually.

Other AI sessions do not automatically know this chat. Share the agreed files and task scope; do not independently redesign the whole system in each session.

## 8. Copy-paste message sa group

Guys, same workflow pa rin: salitan sa main. Aayusin lang natin yung coordination. Bago mag-code, claim muna ng turn sa GC, sabihin yung task, then pull latest main.

Small working task muna. Pag tapos, check/test, commit, sync latest, retest kung may bagong changes, then push. Send short handoff: ano binago, commit ID, ano na-test, at may setup/pending ba.

Next member checks the handoff, pulls latest and independently verifies bago next changes. Main laptop natin yung shared demo server; phones natin can use different role accounts. Hindi automatic na shared yung local databases ng laptops.

Hindi required ang three branches. Temporary branch lang sa malaking unfinished change o sabay na coding. Walang force push sa main, silent database reset, o update habang may active demo. Everyone should understand and explain their own contribution.
