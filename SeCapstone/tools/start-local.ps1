param([switch]$Setup, [switch]$Demo, [int]$Port = 8080)
$ErrorActionPreference = 'Stop'
$portal = Join-Path (Split-Path $PSScriptRoot -Parent) 'propertypro-portal'
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand -and (Test-Path -LiteralPath 'D:\Program Files\nodejs\node.exe')) {
    $env:Path = 'D:\Program Files\nodejs;' + $env:Path
    $nodeCommand = Get-Command node
}
if (-not $nodeCommand) { throw 'Install Node.js 24+ and reopen PowerShell.' }
$major = [int]((& node --version).TrimStart('v').Split('.')[0])
if ($major -lt 24) { throw 'Node.js 24+ is required.' }
if ($Port -lt 1 -or $Port -gt 65535) { throw 'Use a port between 1 and 65535.' }
Push-Location $portal
try {
    if (-not (Test-Path -LiteralPath 'node_modules')) {
        & npm.cmd ci
        if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
    }
    if ($Demo) {
        $env:DATA_DIR = 'data/demo'
        & npm.cmd run setup -- --demo
        if ($LASTEXITCODE -ne 0) { throw 'Demo setup failed. Existing accounts are never overwritten.' }
    } elseif ($Setup) {
        & npm.cmd run setup
        if ($LASTEXITCODE -ne 0) { throw 'Setup failed. Check whether this database is already initialized.' }
    }
    $env:PORT = [string]$Port
    & npm.cmd start
    if ($LASTEXITCODE -ne 0) { throw 'Server startup failed.' }
} finally { Pop-Location }
