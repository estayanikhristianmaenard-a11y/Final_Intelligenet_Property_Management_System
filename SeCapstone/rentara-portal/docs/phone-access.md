# Open the current Rentara profile on a phone

## Dedicated Demo profile

After the 5 November staging update, the Group Demo launcher detects the laptop's current IPv4 and prepares or reuses HTTPS automatically. From `SeCapstone/rentara-portal`:

```powershell
npm.cmd run demo:group
```

PC: `https://localhost:8444/`. On a phone connected to the same network, use the address printed by the launcher. If detection is ambiguous, run `npm.cmd run demo:group -- --ip YOUR_LAPTOP_IPV4`. Restart after changing networks.

The new launcher creates missing synthetic Demo data from the shared member template; it preserves existing prepared Demo records/passwords. To use another PC's exact existing bills and accounts, restore that PC's `data/group-demo` folder and required source files before the first launch. Git does not synchronize live databases. This PC's user selected an existing Demo; the merge therefore did not execute the launcher or create a replacement database. The 4 November missing-database error describes the older launcher, not the new automatic setup behavior.

The public phone certificate is `data/local-tls/rentara-local-ca.cer`; install it on the test phone using the local HTTPS guide. Share only that public certificate, never the private keys. The firewall helper supports the Demo port via `tools/enable-phone-firewall.ps1 -Port 8444` in Administrator PowerShell. Mail retrieval and live delivery are separate explicit options; ordinary `demo:group` keeps them off.

## Existing default/Showcase profile

From `SeCapstone/rentara-portal`, stop the old server with Ctrl+C, then run:

```powershell
npm.cmd run start:phone
```

This uses the same `.env`, database and installed code as `npm.cmd start`. It prints the laptop's current LAN address, binds the server to the network, and adds that address to allowed origins for this process. It does not modify shared `.env`, create/reset data or enable external delivery. If several network addresses are available, select the Wi-Fi/Ethernet address explicitly with `npm.cmd run start:phone -- --ip YOUR_LAPTOP_IP`.

Connect the phone to Wi-Fi on the same router/network as the laptop (the laptop can use Ethernet). Open the printed address in the phone browser and use the same accounts/passwords as on the laptop. Keep the terminal open and the laptop awake. The phone must use the laptop's address rather than `localhost`.

The phone-access setup on 4 November uses `http://192.168.100.207:8080/`. If Windows blocks incoming connections, run `tools/enable-phone-firewall.ps1` in an Administrator PowerShell window. It adds one rule limited to the Node executable, inbound TCP 8080, Private networks and LocalSubnet. This rule matches the current 8080 startup; if you deliberately change the server port, adjust the rule to match. The printed address may change after reconnecting. Guest Wi-Fi/client isolation or a VPN can prevent devices reaching each other. Browser Push requires trusted HTTPS; follow the existing local HTTPS guide for that separate setup. When TLS is already configured, the helper retains it; the certificate must cover the current laptop address.

Stop this server with Ctrl+C before running another profile on the same port. Group 3/Operational/Acceptance still use their own documented startup commands and separate records; this helper follows the normal `.env` profile, currently Showcase on this laptop.
