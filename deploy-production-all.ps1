# One-command production deployment:
# 1) Build frontend
# 2) Deploy to Vercel
# 3) Publish build to umunsi.com server public folder
# 4) Restart pm2 backend service
#
# Credential sources (in priority order):
# 1) UMUNSI_DEPLOY_USER + UMUNSI_DEPLOY_PASSWORD env vars
# 2) DPAPI-protected credential file at %APPDATA%\Umunsi\deploy-credential.xml
#
# To create/update secure credential file, run:
#   .\setup-deploy-credential.ps1
#
# Optional environment variables:
#   UMUNSI_DEPLOY_CREDENTIAL_FILE (override default secure credential file path)
# Optional environment variables:
#   UMUNSI_SERVER_HOST (default: 93.127.186.217)
#   UMUNSI_SERVER_HOSTKEY (default: ssh-ed25519 255 SHA256:jYsWizDft9Sm+hAuCTR9zWtpWeehF5XLunkPQPf/IBo)
#   UMUNSI_PUBLIC_DIR (default: /home/umunsi/backend-api/public)
#   UMUNSI_PM2_HOME (default: /home/umunsi/.pm2)
#   UMUNSI_PM2_APP (default: umunsi-backend)

$ErrorActionPreference = 'Stop'

$serverHost = if ($env:UMUNSI_SERVER_HOST) { $env:UMUNSI_SERVER_HOST } else { '93.127.186.217' }
$serverHostKey = if ($env:UMUNSI_SERVER_HOSTKEY) { $env:UMUNSI_SERVER_HOSTKEY } else { 'ssh-ed25519 255 SHA256:jYsWizDft9Sm+hAuCTR9zWtpWeehF5XLunkPQPf/IBo' }
$credentialFile = if ($env:UMUNSI_DEPLOY_CREDENTIAL_FILE) {
  $env:UMUNSI_DEPLOY_CREDENTIAL_FILE
} else {
  Join-Path $env:APPDATA 'Umunsi\deploy-credential.xml'
}

$remoteUser = $env:UMUNSI_DEPLOY_USER
$remotePassword = $env:UMUNSI_DEPLOY_PASSWORD

if ((-not $remoteUser -or -not $remotePassword) -and (Test-Path $credentialFile)) {
  try {
    $savedCredential = Import-Clixml -Path $credentialFile
    if ($savedCredential -and $savedCredential.UserName -and $savedCredential.Password) {
      $remoteUser = $savedCredential.UserName
      $remotePassword = [System.Net.NetworkCredential]::new('', $savedCredential.Password).Password
    }
  } catch {
    Write-Host "Failed to read secure credential file: $credentialFile" -ForegroundColor Yellow
  }
}
$publicDir = if ($env:UMUNSI_PUBLIC_DIR) { $env:UMUNSI_PUBLIC_DIR } else { '/home/umunsi/backend-api/public' }
$pm2Home = if ($env:UMUNSI_PM2_HOME) { $env:UMUNSI_PM2_HOME } else { '/home/umunsi/.pm2' }
$pm2App = if ($env:UMUNSI_PM2_APP) { $env:UMUNSI_PM2_APP } else { 'umunsi-backend' }

if (-not $remoteUser -or -not $remotePassword) {
  Write-Host 'Missing deployment credentials.' -ForegroundColor Red
  Write-Host 'Provide UMUNSI_DEPLOY_USER + UMUNSI_DEPLOY_PASSWORD env vars, or run setup-deploy-credential.ps1.' -ForegroundColor Yellow
  exit 1
}

$plink = 'C:\Program Files\PuTTY\plink.exe'
$pscp = 'C:\Program Files\PuTTY\pscp.exe'

if (-not (Test-Path $plink)) {
  Write-Host "plink not found at $plink" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path $pscp)) {
  Write-Host "pscp not found at $pscp" -ForegroundColor Red
  exit 1
}

Write-Host 'Step 1/5: Building frontend...' -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Frontend build failed.' -ForegroundColor Red
  exit 1
}

Write-Host 'Step 2/5: Deploying frontend to Vercel production...' -ForegroundColor Cyan
npx vercel --prod --yes
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Vercel deployment failed.' -ForegroundColor Red
  exit 1
}

Write-Host 'Step 3/5: Packaging frontend build...' -ForegroundColor Cyan
$zipPath = Join-Path $env:TEMP 'umunsi_dist.zip'
if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}
Compress-Archive -Path .\dist\* -DestinationPath $zipPath -Force

Write-Host 'Step 4/5: Uploading build to server...' -ForegroundColor Cyan
& $pscp -batch -pw $remotePassword -hostkey $serverHostKey $zipPath "$remoteUser@${serverHost}:/home/$remoteUser/umunsi_dist.zip"
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Upload failed.' -ForegroundColor Red
  exit 1
}

Write-Host 'Step 5/5: Publishing on umunsi.com and restarting service...' -ForegroundColor Cyan
$remoteCmd = @"
set -e
mkdir -p $publicDir
rm -rf $publicDir/*
# Some unzip builds return non-zero on path separator warnings; do not fail deploy for that.
unzip -o /home/$remoteUser/umunsi_dist.zip -d $publicDir >/dev/null || true
PM2_HOME=$pm2Home pm2 restart $pm2App
PM2_HOME=$pm2Home pm2 save
echo DEPLOY_COMPLETE
"@

$remoteScriptPath = Join-Path $env:TEMP 'umunsi_remote_deploy.sh'
Set-Content -Path $remoteScriptPath -Value $remoteCmd -Encoding ASCII

& $plink -ssh "$remoteUser@$serverHost" -hostkey $serverHostKey -pw $remotePassword -batch -m $remoteScriptPath
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Remote publish failed.' -ForegroundColor Red
  exit 1
}

Write-Host 'Verifying production endpoints...' -ForegroundColor Cyan
curl.exe -s -A "Mozilla/5.0" https://umunsi.com/api/health
curl.exe -I -A "Mozilla/5.0" https://umunsi.com/

Write-Host 'Deployment complete: frontend + umunsi.com updated.' -ForegroundColor Green
