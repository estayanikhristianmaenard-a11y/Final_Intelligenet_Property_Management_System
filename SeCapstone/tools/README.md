# Local Node tools

For the separate acceptance portfolio with Android HTTPS, use `./SeCapstone/tools/start-acceptance.ps1 -LanAddress YOUR_LAPTOP_IP` from the repository root. See the [acceptance guide](../rentara-portal/docs/local-acceptance-setup.md) for accounts and the manual certificate installation on each Android phone. Normal HTTP startup below remains available.

The acceptance helper preserves an explicitly enabled dedicated Gmail-label intake setting. Outgoing rent email remains off. Configure that separate intake once with `npm.cmd run setup:utility-intake` from the application directory; see the guide for provider-label routing and pause/restart instructions.

From the repository root:

```powershell
# First-time empty portfolio: prompts for Admin/Manager password
.\SeCapstone\tools\start-local.ps1 -Setup
# Or explicitly initialize an isolated demo portfolio
.\SeCapstone\tools\start-local.ps1 -Demo
# Subsequent normal startup
.\SeCapstone\tools\start-local.ps1
# Same-Wi-Fi phone access: replace with your computer's IPv4 address
.\SeCapstone\tools\start-local.ps1 -LanAddress 192.168.1.20
```

Requires Node.js 24+. The helper installs locked dependencies if absent and refuses to continue when initialization fails. It does not change execution policy. If PowerShell blocks it, use the direct npm commands in the [project README](../../README.md). Use `-Port 8081` when 8080 is occupied.

For later demo startup, set `$env:DATA_DIR = 'data/demo'` before starting without `-Demo`. Setup intentionally refuses to overwrite accounts. The helper does not configure mailbox credentials, Push keys, hosting, or a Windows service.
