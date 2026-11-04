import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setupGroupLaptop, loadGroupMembers, ensureMkcert } from '../tools/setup-group-laptop.mjs';
import { Store, DEFAULT_WORKSPACE } from '../server/store.js';
import { setupGroupDemo } from '../server/group-demo-setup.js';

const sourceRoot = fileURLToPath(new URL('../', import.meta.url));
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'rentara-laptop-setup-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'tools'));
  copyFileSync(join(sourceRoot, 'tools/group-demo-members.example.json'), join(root, 'tools/group-demo-members.example.json'));
  copyFileSync(join(sourceRoot, '.env.example'), join(root, '.env.example'));
  return root;
}

test('fresh laptop setup creates both workspaces and four roles; rerun preserves account edits and records', async t => {
  const root = fixture(t), invocations = [];
  const options = { root, ensureTool: async () => {}, run: async args => { invocations.push(args); } };
  const first = await setupGroupLaptop('192.168.100.200', options);
  assert.equal(first.groupReused, false);
  assert.equal(first.workspacesReused, false);
  assert.equal(first.url, 'https://192.168.100.200:8444/');
  assert.deepEqual(invocations[0], ['tools/setup-local-https.mjs', '--ip', '192.168.100.200']);
  assert.ok(existsSync(join(root, '.env')));
  const db = join(root, 'data/group-demo/propertypro.sqlite');
  const store = new Store(db);
  const users = store.allGlobal('users');
  assert.deepEqual([...new Set(users.map(u => u.role))].sort(), ['admin', 'manager', 'staff', 'tenant']);
  assert.equal(store.allGlobal('workspaces').length, 2);
  const admin = users.find(u => u.role === 'admin');
  store.withGlobal(() => store.save('users', { ...admin, name: 'Edited name stays', passwordHash: 'sentinel-existing-password-hash' }));
  const counts = { users: users.length, bills: store.allGlobal('bills').length };
  store.close();
  const second = await setupGroupLaptop('192.168.100.201', options);
  assert.equal(second.groupReused, true);
  assert.equal(second.workspacesReused, true);
  const after = new Store(db);
  try {
    assert.equal(after.allGlobal('users').length, counts.users);
    assert.equal(after.allGlobal('bills').length, counts.bills);
    assert.equal(after.getGlobal('users', admin.id).name, 'Edited name stays');
    assert.equal(after.getGlobal('users', admin.id).passwordHash, 'sentinel-existing-password-hash');
  } finally { after.close(); }
});

test('missing member input is restored from existing demo identities, not replaced by template identities', t => {
  const root = fixture(t);
  const custom = [
    {name:'First Custom Member',email:'first@example.test',unit:'A'},
    {name:'Second Custom Member',email:'second@example.test',unit:'A'},
    {name:'Third Custom Member',email:'third@example.test',unit:'B'},
  ];
  setupGroupDemo(join(root, 'data/group-demo'), custom);
  assert.deepEqual(loadGroupMembers(root), custom);
  assert.deepEqual(JSON.parse(readFileSync(join(root, 'data/group-demo-members.json'), 'utf8')), custom);
  const store = new Store(join(root, 'data/group-demo/propertypro.sqlite'));
  try { assert.equal(store.getGlobal('workspaces', DEFAULT_WORKSPACE).name, 'Group 3 Demonstration'); }
  finally { store.close(); }
});

test('existing member input is never overwritten', t => {
  const root = fixture(t);
  mkdirSync(join(root, 'data'));
  const file = join(root, 'data/group-demo-members.json');
  const content = '[{"name":"Preserve local input"}]\n';
  writeFileSync(file, content);
  assert.equal(loadGroupMembers(root)[0].name, 'Preserve local input');
  assert.equal(readFileSync(file, 'utf8'), content);
});

test('invalid IP and unavailable HTTPS tool stop before creating demo records', async t => {
  const root = fixture(t);
  let calls = 0;
  await assert.rejects(setupGroupLaptop('YOUR_IP', {root, ensureTool:async () => { calls++; }}), /--ip/);
  assert.equal(calls, 0);
  await assert.rejects(setupGroupLaptop('192.168.100.200', {root, ensureTool:async () => { throw new Error('Offline tool unavailable'); }}), /Offline/);
  assert.equal(existsSync(join(root, 'data')), false);
});

test('failed HTTPS setup does not seed a database', async t => {
  const root = fixture(t);
  await assert.rejects(setupGroupLaptop('192.168.100.200', {root, ensureTool:async () => {}, run:async () => { throw new Error('Certificate generation failed'); }}), /Certificate/);
  assert.equal(existsSync(join(root, 'data/group-demo/propertypro.sqlite')), false);
});

test('existing mkcert is reused without a download; invalid downloads are not installed', async t => {
  const root = fixture(t), executable = join(root, 'local-tool.exe');
  writeFileSync(executable, 'existing installation');
  assert.equal(await ensureMkcert(root, {customPath:executable,fetch:()=>{throw new Error('unexpected download');}}), executable);
  await assert.rejects(ensureMkcert(root, {customPath:'',platform:'win32',arch:'x64',fetch:async () => ({ok:true,arrayBuffer:async () => Buffer.from('bad download')})}), /checksum/);
  assert.equal(existsSync(join(root, 'data/tools/mkcert.exe')), false);
  await assert.rejects(ensureMkcert(root, {customPath:'',platform:'win32',arch:'x64',fetch:async () => ({ok:false,status:503})}), /503/);
});
