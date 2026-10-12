# Local Node tools

From the repository root:

```powershell
# First-time empty portfolio: prompts for Admin/Manager password
.\SeCapstone\tools\start-local.ps1 -Setup
# Or explicitly initialize an isolated demo portfolio
.\SeCapstone\tools\start-local.ps1 -Demo
# Subsequent normal startup
.\SeCapstone\tools\start-local.ps1
```

Requires Node.js 24+. The helper installs locked dependencies if absent and refuses to continue when initialization fails. It does not change execution policy. If PowerShell blocks it, use the direct npm commands in the [project README](../../README.md). Use `-Port 8081` when 8080 is occupied.

For later demo startup, set `$env:DATA_DIR = 'data/demo'` before starting without `-Demo`. Setup intentionally refuses to overwrite accounts. The helper does not configure mailbox credentials, Push keys, hosting, or a Windows service.
