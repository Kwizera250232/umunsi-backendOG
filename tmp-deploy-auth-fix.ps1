$ErrorActionPreference = 'Stop'

$credPath = Join-Path $env:APPDATA 'Umunsi\deploy-credential.xml'
if (-not (Test-Path $credPath)) {
  throw 'Missing secure deployment credential file.'
}

$cred = Import-Clixml -Path $credPath
$remoteUser = $cred.UserName
$remotePassword = [System.Net.NetworkCredential]::new('', $cred.Password).Password
$serverHost = '93.127.186.217'
$serverHostKey = 'SHA256:tnPT2xihIPFYUybKEC0I4XKXhlcTAEJsQJ9cFC3rXE4'
$pscp = 'C:\Program Files\PuTTY\pscp.exe'
$plink = 'C:\Program Files\PuTTY\plink.exe'
$appDir = '/home/umunsi/backend-api'

& $pscp -batch -pw $remotePassword -hostkey $serverHostKey 'src/controllers/authController.js' "$remoteUser@${serverHost}:$appDir/src/controllers/authController.js"
if ($LASTEXITCODE -ne 0) { throw 'Failed to upload auth controller.' }

& $plink -ssh "$remoteUser@$serverHost" -pw $remotePassword -hostkey $serverHostKey -batch "mkdir -p $appDir/prisma/migrations/20260415133500_add_profile_url_and_safe_user_columns"
if ($LASTEXITCODE -ne 0) { throw 'Failed to create remote migration directory.' }

& $pscp -batch -pw $remotePassword -hostkey $serverHostKey 'prisma/migrations/20260415133500_add_profile_url_and_safe_user_columns/migration.sql' "$remoteUser@${serverHost}:$appDir/prisma/migrations/20260415133500_add_profile_url_and_safe_user_columns/migration.sql"
if ($LASTEXITCODE -ne 0) { throw 'Failed to upload migration.' }

$remoteCmd = @"
set -e
cd $appDir
npm install --omit=dev
npx prisma generate
npx prisma db push --skip-generate
PM2_HOME=/home/umunsi/.pm2 pm2 restart umunsi-backend --update-env
PM2_HOME=/home/umunsi/.pm2 pm2 save
printf 'BACKEND_DEPLOY_OK\n'
"@

& $plink -ssh "$remoteUser@$serverHost" -pw $remotePassword -hostkey $serverHostKey -batch $remoteCmd
if ($LASTEXITCODE -ne 0) { throw 'Remote update/restart failed.' }
