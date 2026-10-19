param([Parameter(Mandatory = $true)][string]$LanAddress)
$ErrorActionPreference = 'Stop'
$portalRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../rentara-portal'))
Push-Location -LiteralPath $portalRoot
try {
    & node tools/setup-local-https.mjs --ip $LanAddress
    if ($LASTEXITCODE -ne 0) { throw 'Local HTTPS setup failed.' }
    & node server/acceptance-setup.js
    if ($LASTEXITCODE -ne 0) { throw 'Acceptance database setup failed.' }
    # Process environment takes priority over Node env files. Pin this profile
    # explicitly so inherited showcase/network settings cannot enable delivery.
    $overrides = @{
        DATA_DIR='data/acceptance'; HOST='0.0.0.0'; PORT='8443'
        PORTAL_URL="https://${LanAddress}:8443/"
        ALLOWED_ORIGINS="https://localhost:8443,https://127.0.0.1:8443,https://${LanAddress}:8443"
        TLS_CERT_FILE='data/local-tls/portal-cert.pem'; TLS_KEY_FILE='data/local-tls/portal-key.pem'
        RENT_EMAIL_ENABLED='false'; IMAP_HOST=''; IMAP_USER=''; IMAP_ACCESS_TOKEN=''
    }
    $previous = @{}
    foreach ($name in $overrides.Keys) {
        $previous[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
        [Environment]::SetEnvironmentVariable($name, $overrides[$name], 'Process')
    }
    try { & node --env-file-if-exists=.env --env-file=.env.acceptance tools/start-acceptance.mjs }
    finally {
        foreach ($name in $previous.Keys) {
            [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process')
        }
    }
} finally { Pop-Location }
