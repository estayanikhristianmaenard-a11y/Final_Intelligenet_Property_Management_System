import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { selectLanAddress, demoArguments, startGroupLaptop } from '../tools/start-group-laptop.mjs';
import { localHttpsReady } from '../tools/setup-group-laptop.mjs';

const ipv4 = address => ({address, family:'IPv4', internal:false});

test('automatic IP selection ignores VM/VPN, loopback, IPv6 and disconnected self-assigned addresses', () => {
  const interfaces = {
    Loopback:[{...ipv4('127.0.0.1'),internal:true}],
    'VirtualBox Host-Only Network':[ipv4('192.168.56.1')],
    'vEthernet (WSL)':[ipv4('172.16.0.1')],
    Tailscale:[ipv4('100.100.100.1')],
    Ethernet:[ipv4('169.254.1.1')],
    'Wi-Fi':[{address:'fe80::1',family:'IPv6',internal:false},ipv4('192.168.100.200')],
  };
  assert.equal(selectLanAddress(interfaces, '192.168.56.1'), '192.168.100.200');
});

test('active physical default-route address takes priority; Wi-Fi is fallback when route lookup is unavailable', () => {
  const interfaces = {Ethernet:[ipv4('10.0.0.3')],'Wi-Fi':[ipv4('192.168.100.200')]};
  assert.equal(selectLanAddress(interfaces,'10.0.0.3'),'10.0.0.3');
  assert.equal(selectLanAddress(interfaces),'192.168.100.200');
  assert.equal(selectLanAddress({en0:[{...ipv4('10.0.0.3'),family:4}]}),'10.0.0.3');
});

test('absent or ambiguous physical networks require a clear manual IP rather than silently reusing an old IP', () => {
  assert.throws(()=>selectLanAddress({}),/Connect to Wi-Fi/);
  assert.throws(()=>selectLanAddress({Ethernet:[ipv4('10.0.0.3')],Ethernet2:[ipv4('10.0.1.3')]}),/More than one/);
});

test('manual IP and explicit delivery switches parse separately; invalid or unknown arguments fail', () => {
  assert.deepEqual(demoArguments(['--receive','--ip','192.168.100.200','--live-delivery']),
    {address:'192.168.100.200',delivery:['--receive','--live-delivery']});
  for(const args of [['--ip'],['--ip','localhost'],['--ip','10.0.0.1','--ip','10.0.0.2'],['--unknown'],['192.168.100.200']])
    assert.throws(()=>demoArguments(args));
});

test('one-command launch prepares missing profile before starting child and keeps delivery opt-in', async t => {
  const root=mkdtempSync(join(tmpdir(),'rentara-auto-start-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  let prepared=false,childCalled=false;
  const status=await startGroupLaptop([],{
    root, interfaces:()=>({'Wi-Fi':[ipv4('192.168.100.200')]}),routeAddress:()=>undefined,log:()=>{},
    setup:async(address,options)=>{
      assert.equal(address,'192.168.100.200');assert.equal(options.reuseHttps,true);
      writeFileSync(join(root,'.env.acceptance'),'PORTAL_URL=https://192.168.100.200:8443/\nTLS_CERT_FILE=data/local-tls/portal-cert.pem\n');
      prepared=true;return {httpsReused:false,url:'https://192.168.100.200:8444/'};
    },
    run:async(argv,env)=>{
      assert.equal(prepared,true);childCalled=true;
      assert.deepEqual(argv,['--env-file-if-exists=.env','--env-file=.env.acceptance','tools/start-group-demo.mjs']);
      assert.equal(env.PORTAL_URL,'https://192.168.100.200:8443/');
      return {status:0};
    },
  });
  assert.equal(status,0);assert.equal(childCalled,true);
});

test('manual IP bypasses network detection and forwards only explicitly requested receive/delivery options', async t => {
  const root=mkdtempSync(join(tmpdir(),'rentara-manual-start-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  writeFileSync(join(root,'.env.acceptance'),'PORTAL_URL=https://10.0.0.9:8443/\n');
  const noProbe=()=>{throw new Error('Should not inspect networks for an explicit IP');};
  const status=await startGroupLaptop(['--ip','10.0.0.9','--receive','--live-delivery'],{
    root,interfaces:noProbe,routeAddress:noProbe,log:()=>{},
    setup:async address=>{assert.equal(address,'10.0.0.9');return {httpsReused:true,url:'https://10.0.0.9:8444/'};},
    run:async argv=>{assert.deepEqual(argv.slice(3),['--receive','--live-delivery']);return {status:7};},
  });
  assert.equal(status,7);
});

test('setup failure and malformed flags never start a backend; missing or broken HTTPS needs refresh', async t => {
  const root=mkdtempSync(join(tmpdir(),'rentara-failed-start-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const run=()=>{throw new Error('Backend must not run');};
  await assert.rejects(startGroupLaptop(['--ip','10.0.0.9'],{root,run,setup:async()=>{throw new Error('Setup failed');}}),/Setup failed/);
  await assert.rejects(startGroupLaptop(['--bad-option'],{root,run}),/Unknown/);
  assert.equal(localHttpsReady(root,'10.0.0.9'),false);
  writeFileSync(join(root,'.env.acceptance'),'PORTAL_URL=not-a-url\n');
  assert.equal(localHttpsReady(root,'10.0.0.9'),false);
});
