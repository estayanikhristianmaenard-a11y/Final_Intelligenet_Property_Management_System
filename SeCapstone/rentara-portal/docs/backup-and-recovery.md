# Backup and recovery

Updated 22 October 2026. This is supporting system maintenance, not a new billing feature. The Admin creates backups; Managers and Tenants cannot invoke this route. Restore is an offline operator command, deliberately separate from the web interface.

## Create a complete backup

In Admin > Dashboard, choose **Back up database**. The operation now creates a recovery folder under the currently selected database's `backups/` directory:

```text
DATA_DIR/backups/backup-TIMESTAMP-IDENTIFIER/
  manifest.json
  propertypro.sqlite
  sources/...
  documents/...
  workspaces/WORKSPACE_ID/sources/...
  workspaces/WORKSPACE_ID/documents/...
```

The source/document folders appear only when referenced files exist. The SQLite snapshot defines which files belong in the backup. Repeated intake records sharing a source file do not produce duplicate file copies inside one workspace. Other workspaces retain their own paths. Receipts are generated from their stored snapshots; the database retains them without requiring a separate saved PDF per receipt.

Copy the **whole completed folder**, not just `propertypro.sqlite`, to a private backup location. The API returns its folder and relative database filename. The manifest records file sizes/checksums and is written last. A failed operation can leave an incomplete folder without a manifest; do not treat it as a valid backup or delete earlier good backups. Review incomplete folders before removing them.

This is a maintenance copy of sensitive property records, not a public download. It does not include `.env`, credentials, TLS/CA private keys, dependencies, temp files, unrelated orphan files or earlier backups. Keep integration configuration available separately through the group's agreed private/team procedure. A backup on the same laptop alone does not protect against losing the laptop.

## Restore into a new directory

From `SeCapstone/rentara-portal`:

```powershell
npm.cmd run backup:restore -- "data/showcase/backups/backup-REPLACE_WITH_ACTUAL_FOLDER" "data/recovery-check-2026-10-22"
```

Use the actual complete folder from the relevant showcase/acceptance/operational database. The destination must not already exist and must be outside the backup folder. Never point this command at a running data directory. It refuses an existing destination rather than deleting or overwriting records.

Before copying, restore checks the manifest, allowed relative paths, regular files, checksums, SQLite integrity, foreign keys and coverage of the database's source/document references. It rejects symbolic links and path traversal. Copied files are checked again. Old login sessions are deleted in the restored database; users sign in again with their retained accounts. Account passwords, bills, payment/receipt snapshots, utility marks and workspace membership remain in the database.

Restore does not start a server, read a mailbox, send messages, install certificates or switch the active database. If an error occurs after destination creation, do not start the incomplete destination; retain the original complete backup and use a new destination for another attempt.

## Acceptance before using restored records

Keep external integrations disabled while checking the restored copy. Do not start a second live scheduler against the same mailbox/recipients just to verify recovery. Have the operator select the new `DATA_DIR` deliberately and verify the matching application version before any switchover.

| Check | Expected result |
| --- | --- |
| Account/workspace login | Manager and Tenant enter only their permitted workspace/records |
| Old session | Rejected; fresh sign-in works |
| Bill/receipt history | Amounts, dates, statuses and original receipt/payment references agree with the snapshot |
| Source/document viewing | The restored original file opens with identical content |
| Utility tracking | Personal marks/history remain separate from confirmed rent |
| Existing portfolio | Original active data remains untouched |

Automated recovery tests exercise these storage/security boundaries with synthetic records, including two workspace paths and shared-source deduplication. A private copied package on the group's actual recovery device still needs a manual acceptance check. These tests are not a guarantee against every filesystem failure or a legal/security certification.

See [current QA evidence](qa-report.md) and [user stories](user-stories.md).
