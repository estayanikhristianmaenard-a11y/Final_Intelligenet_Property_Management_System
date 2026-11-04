import { networkInterfaces } from 'node:os';
import { isIP } from 'node:net';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { setupGroupLaptop } from './setup-group-laptop.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const virtualAdapter = /loopback|virtual|vmware|vbox|hyper-v|vethernet|wsl|docker|tailscale|zerotier|wireguard|vpn|tunnel|\btap\b|\btun\d*\b/i;

export function demoArguments(args) {
  let address;
  const delivery = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--ip') {
      if (address || isIP(args[i + 1] ?? '') !== 4) throw new Error('Use --ip followed by one laptop Wi-Fi IPv4 address.');
      address = args[++i];
    } else if (['--receive', '--live-delivery'].includes(args[i])) delivery.push(args[i]);
    else throw new Error('Unknown demo option. Use --receive, --live-delivery or --ip YOUR_LAPTOP_IPV4.');
  }
  return { address, delivery };
}

export function selectLanAddress(interfaces, preferred) {
  const candidates = [];
  for (const [name, entries] of Object.entries(interfaces)) {
    if (virtualAdapter.test(name)) continue;
    for (const entry of entries ?? []) {
      if (!['IPv4', 4].includes(entry.family) || entry.internal || isIP(entry.address) !== 4) continue;
      const [first, second] = entry.address.split('.').map(Number);
      if (first === 0 || first === 127 || first >= 224 || (first === 169 && second === 254)) continue;
      if (!candidates.some(c => c.address === entry.address)) candidates.push({ name, address: entry.address });
    }
  }
  const routed = candidates.find(c => c.address === preferred);
  if (routed) return routed.address;
  if (candidates.length === 1) return candidates[0].address;
  const wifi = candidates.filter(c => /wi-?fi|wireless|wlan/i.test(c.name));
  if (wifi.length === 1) return wifi[0].address;
  if (!candidates.length) throw new Error('No usable local IPv4 found. Connect to Wi-Fi, then restart. You can also use -- --ip YOUR_LAPTOP_IPV4.');
  throw new Error('More than one local network found. Choose the phone-accessible laptop address with npm.cmd run demo:group -- --ip YOUR_LAPTOP_IPV4.');
}

export function windowsRouteAddress() {
  if (process.platform !== 'win32') return undefined;
  // Read the active default routes only; no internet probe or network changes.
  const command = "$routes = Get-NetRoute -AddressFamily IPv4 -DestinationPrefix '0.0.0.0/0' -ErrorAction Stop | Where-Object { $_.State -eq 'Alive' }; $choices = foreach ($r in $routes) { $i = Get-NetIPInterface -AddressFamily IPv4 -InterfaceIndex $r.InterfaceIndex -ErrorAction SilentlyContinue; Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $r.InterfaceIndex -ErrorAction SilentlyContinue | Where-Object { $_.AddressState -eq 'Preferred' } | ForEach-Object { [pscustomobject]@{ Address=$_.IPAddress; Metric=($r.RouteMetric + $i.InterfaceMetric) } } }; $choices | Sort-Object Metric | Select-Object -First 1 -ExpandProperty Address";
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command],
    { encoding: 'utf8', timeout: 8000, windowsHide: true });
  const address = result.stdout?.trim();
  return result.status === 0 && isIP(address ?? '') === 4 ? address : undefined;
}

export async function startGroupLaptop(args, options = {}) {
  const parsed = demoArguments(args);
  const address = parsed.address ?? selectLanAddress(
    (options.interfaces ?? networkInterfaces)(), (options.routeAddress ?? windowsRouteAddress)());
  const location = options.root ?? root;
  const prepared = await (options.setup ?? setupGroupLaptop)(address, { root: location, reuseHttps: true });
  const log = options.log ?? console.log;
  log(`Local IP: ${address}${parsed.address ? ' (manual)' : ' (detected)'}`);
  log(prepared.httpsReused ? 'Existing HTTPS configuration reused.' : 'HTTPS configuration prepared for this IP.');
  log('Phone (same Wi-Fi): ' + prepared.url);
  if (!prepared.httpsReused) log('Device certificate trust is still required; see docs/local-acceptance-setup.md.');
  const profile = parseEnv(readFileSync(join(location, '.env.acceptance'), 'utf8'));
  const run = options.run ?? ((argv, env) => spawnSync(process.execPath, argv,
    { cwd: location, stdio: 'inherit', windowsHide: true, env }));
  const result = await run(['--env-file-if-exists=.env', '--env-file=.env.acceptance', 'tools/start-group-demo.mjs', ...parsed.delivery],
    { ...process.env, ...profile });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startGroupLaptop(process.argv.slice(2)).then(status => { process.exitCode = status; })
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
