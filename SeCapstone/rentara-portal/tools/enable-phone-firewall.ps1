#Requires -RunAsAdministrator
param([ValidateSet(8080,8444)][int]$Port = 8080)
$ErrorActionPreference = 'Stop'
$phoneRuleName = 'Rentara-Phone-LAN-' + $Port
$phoneNodePath = (Get-Command node -ErrorAction Stop).Source
$phoneResultDirectory = Join-Path $PSScriptRoot '../data'
$phoneResultFile = Join-Path $phoneResultDirectory 'phone-firewall-result.json'
try {
    $phoneExistingRule = Get-NetFirewallRule -Name $phoneRuleName -ErrorAction SilentlyContinue
    if ($phoneExistingRule) {
        # Touch only this helper's named rule; preserve unrelated firewall rules.
        Set-NetFirewallRule -Name $phoneRuleName -Enabled True -Direction Inbound -Action Allow -Profile Private -Program $phoneNodePath -Protocol TCP -LocalPort $Port -RemoteAddress LocalSubnet | Out-Null
    } else {
        New-NetFirewallRule -Name $phoneRuleName -DisplayName ('Rentara phone access (Private LAN TCP ' + $Port + ')') -Enabled True -Direction Inbound -Action Allow -Profile Private -Program $phoneNodePath -Protocol TCP -LocalPort $Port -RemoteAddress LocalSubnet | Out-Null
    }
    New-Item -ItemType Directory -Path $phoneResultDirectory -Force | Out-Null
    @{ status = 'ready'; rule = $phoneRuleName; port = $Port; profile = 'Private'; remoteAddress = 'LocalSubnet' } | ConvertTo-Json | Set-Content -LiteralPath $phoneResultFile
} catch {
    New-Item -ItemType Directory -Path $phoneResultDirectory -Force | Out-Null
    @{ status = 'failed'; message = $_.Exception.Message } | ConvertTo-Json | Set-Content -LiteralPath $phoneResultFile
    throw
}
