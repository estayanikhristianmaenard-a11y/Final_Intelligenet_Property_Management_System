import { restoreRecoveryBackup } from "../server/recovery.js";

const [bundle, destination] = process.argv.slice(2);
if (!bundle || !destination) throw new Error("Usage: npm run backup:restore -- PATH_TO_BACKUP_FOLDER NEW_DATA_DIRECTORY");
const result = await restoreRecoveryBackup(bundle, destination);
console.log(`Restored database and ${result.files} source/document files to ${result.directory}.`);
console.log("Old sessions were revoked. Reconfigure credentials separately and test this directory with external integrations disabled before any switchover.");
