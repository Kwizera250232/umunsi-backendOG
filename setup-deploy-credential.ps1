# Creates or updates a DPAPI-protected credential file for auto-deploy.
# This file can only be decrypted by the same Windows user profile.

$ErrorActionPreference = 'Stop'

$defaultUser = 'deploy998892'
$credentialFile = ''
if ($env:UMUNSI_DEPLOY_CREDENTIAL_FILE) {
  $credentialFile = $env:UMUNSI_DEPLOY_CREDENTIAL_FILE
} else {
  $credentialFile = Join-Path $env:APPDATA 'Umunsi\deploy-credential.xml'
}

$credentialDir = Split-Path -Parent $credentialFile
if (-not (Test-Path $credentialDir)) {
  New-Item -ItemType Directory -Path $credentialDir -Force | Out-Null
}

Write-Host 'Configure deployment credential for umunsi.com publish.' -ForegroundColor Cyan
$userName = Read-Host "SSH username [$defaultUser]"
if (-not $userName) {
  $userName = $defaultUser
}

$securePassword = Read-Host 'SSH password' -AsSecureString
$credential = New-Object System.Management.Automation.PSCredential ($userName, $securePassword)
$credential | Export-Clixml -Path $credentialFile

Write-Host "Saved secure deployment credential to: $credentialFile" -ForegroundColor Green
Write-Host 'Plaintext password has not been written to repo files.' -ForegroundColor Green
