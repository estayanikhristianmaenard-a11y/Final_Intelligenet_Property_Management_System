# Phone and local-network demonstration

The interface adapts to phone, tablet and desktop widths. Tenants use their browser; no desktop or installed mobile app is required.

1. Connect the host computer and test phones to the same trusted Wi-Fi.
2. Run `ipconfig` in PowerShell and find the Wi-Fi adapter IPv4 address, for example `192.168.1.20`.
3. Initialize accounts/database once using the root README instructions.
4. From the repository root, start the server:

```powershell
.\SeCapstone\tools\start-local.ps1 -LanAddress 192.168.1.20
```

Replace the example address with the computer's actual address. Phones open **http://192.168.1.20:8080/** and sign in using their Tenant account. `localhost` on a phone means the phone, not the host computer. Keep the host/server running. Guest Wi-Fi device isolation may prevent access; use a network that permits devices to communicate. If Windows Firewall blocks the connection, allow the Node app on the trusted Private network when prompted. This script does not change firewall settings or publish the app online.

The helper sets the server binding and exact allowed origin for the chosen address/port. Stop and restart it if the computer's address changes. Without `-LanAddress`, it binds only to the host computer.

Plain HTTP on a Wi-Fi IP supports local portal checks, but Web Push/service workers generally require a secure HTTPS origin. The special localhost exception does not make a remote phone's HTTP IP connection secure. Real phone Push acceptance needs a trusted HTTPS setup; it remains separate from this local portal demonstration.

Check narrow phones, landscape, tablets and desktop: navigation drawer, readable bills, scrollable tables, forms, modal controls, account isolation and portal access without Push. Browser viewport tests supplement actual-device acceptance; they do not prove every phone/browser works.
