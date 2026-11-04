import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isIP } from 'node:net';
import { createHash, createPrivateKey, X509Certificate } from 'node:crypto';
import { parseEnv } from 'node:util';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { setupGroupDemo } from '../server/group-demo-setup.js';
import { DEFAULT_WORKSPACE } from '../server/store.js';
import { prepareWorkspaceDemo } from './prepare-workspace-demo.mjs';

const portalRoot = fileURLToPath(new URL('../', import.meta.url));
export const mkcertDownload = Object.freeze({
  url: 'https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-windows-amd64.exe',
  sha256: 'd2660b50a9ed59eada480750561c96abc2ed4c9a38c6a24d93e30e0977631398',
});

export function loadGroupMembers(root = portalRoot) {
  const file = join(root, 'data/group-demo-members.json');
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  const database = join(root, 'data/group-demo/propertypro.sqlite');
  let members;
  if (existsSync(database)) {
    // Recover the input from its existing seed marker; never replace identities.
    const db = new DatabaseSync(database, { readOnly: true });
    try {
      const row = db.prepare("SELECT data FROM settings WHERE workspaceId=? AND id='group-demo'").get(DEFAULT_WORKSPACE);
      const saved = row && JSON.parse(row.data);
      if (!saved?.ready) throw new Error('Existing database is not a prepared Group 3 demo. Records preserved.');
      members = saved.members.map(({ name, email, unit }) => ({ name, email, unit }));
    } finally { db.close(); }
  } else {
    members = JSON.parse(readFileSync(join(root, 'tools/group-demo-members.example.json'), 'utf8'));
  }
  mkdirSync(join(root, 'data'), { recursive: true });
  writeFileSync(file, JSON.stringify(members, null, 2) + '\n', { flag: 'wx' });
  return members;
}

export async function ensureMkcert(root = portalRoot, options = {}) {
  const custom = options.customPath ?? process.env.MKCERT_PATH;
  const file = custom || join(root, 'data/tools', process.platform === 'win32' ? 'mkcert.exe' : 'mkcert');
  if (existsSync(file)) return file;
  if (custom) throw new Error('MKCERT_PATH does not exist. Correct it before rerunning setup.');
  if ((options.platform ?? process.platform) !== 'win32' || (options.arch ?? process.arch) !== 'x64')
    throw new Error('Install mkcert for this operating system and set MKCERT_PATH; see docs/local-acceptance-setup.md.');
  const response = await (options.fetch ?? fetch)(mkcertDownload.url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`mkcert download failed (${response.status}). Install it manually using docs/local-acceptance-setup.md.`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (createHash('sha256').update(bytes).digest('hex') !== mkcertDownload.sha256)
    throw new Error('mkcert download checksum did not match. Nothing was installed; use the official release.');
  mkdirSync(join(root, 'data/tools'), { recursive: true });
  writeFileSync(file, bytes, { flag: 'wx', mode: 0o700 });
  return file;
}

export async function setupGroupLaptop(address, options = {}) {
  if (isIP(address) !== 4)
    throw new Error('Use your laptop Wi-Fi IPv4 address: npm.cmd run setup:group -- --ip 192.168.100.200');
  const root = options.root ?? portalRoot;
  const httpsReused = Boolean(options.reuseHttps && localHttpsReady(root, address));
  // Check external prerequisites before creating or changing the demonstration data.
  if (!httpsReused) await (options.ensureTool ?? ensureMkcert)(root);
  const env = join(root, '.env');
  if (!existsSync(env)) writeFileSync(env, readFileSync(join(root, '.env.example')), { flag: 'wx', mode: 0o600 });
  const run = options.run ?? ((args) => {
    const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit', windowsHide: true });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error('HTTPS setup failed. Correct the error above and rerun setup:group.');
  });
  if (!httpsReused) await run(['tools/setup-local-https.mjs', '--ip', address]);
  const members = loadGroupMembers(root);
  const dataDir = join(root, 'data/group-demo');
  const group = setupGroupDemo(dataDir, members);
  const workspaces = await prepareWorkspaceDemo(dataDir);
  return { groupReused: group.reused, workspacesReused: workspaces.reused, httpsReused, url: `https://${address}:8444/` };
}

export function localHttpsReady(root, address, now = Date.now()) {
  try {
    const profile = parseEnv(readFileSync(join(root, '.env.acceptance'), 'utf8'));
    const shared = parseEnv(readFileSync(join(root, '.env'), 'utf8'));
    if (profile.PORTAL_URL !== `https://${address}:8443/` ||
        profile.TLS_CERT_FILE !== 'data/local-tls/portal-cert.pem' ||
        profile.TLS_KEY_FILE !== 'data/local-tls/portal-key.pem' ||
        !profile.ALLOWED_ORIGINS?.split(',').includes(`https://${address}:8443`) ||
        !shared.VAPID_PUBLIC_KEY || !shared.VAPID_PRIVATE_KEY || !shared.VAPID_SUBJECT) return false;
    const cert = new X509Certificate(readFileSync(join(root, profile.TLS_CERT_FILE)));
    const ca = new X509Certificate(readFileSync(join(root, 'data/local-tls/ca/rootCA.pem')));
    return cert.checkIP(address) === address && cert.checkHost('localhost') === 'localhost' &&
      Date.parse(cert.validFrom) <= now && Date.parse(cert.validTo) > now + 86400000 &&
      existsSync(join(root, 'data/local-tls/rentara-local-ca.cer')) &&
      cert.verify(ca.publicKey) && cert.checkPrivateKey(createPrivateKey(readFileSync(join(root, profile.TLS_KEY_FILE))));
  } catch { return false; }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const index = process.argv.indexOf('--ip');
  setupGroupLaptop(index < 0 ? '' : process.argv[index + 1]).then(result => {
    console.log(result.groupReused ? 'Existing Group 3 records and passwords preserved.' : 'Group 3 demonstration database created.');
    console.log(result.workspacesReused ? 'Existing second workspace preserved.' : 'Second test workspace and Staff accounts prepared.');
    console.log('Next: npm.cmd run demo:group');
    console.log('Phone (same Wi-Fi): ' + result.url);
    console.log('Laptop: https://localhost:8444/');
    console.log('No mailbox accessed or external notification sent. Trust this laptop CA on each test device using the local acceptance guide.');
  }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
