param(
  [string]$TwilioAccountSid,
  [string]$TwilioAuthToken,
  [string]$TwilioFromNumber,
  [string]$AfricasTalkingUsername,
  [string]$AfricasTalkingApiKey,
  [string]$AfricasTalkingSenderId
)

$ErrorActionPreference = 'Stop'

$serverHost = '93.127.186.217'
$serverHostKey = 'ssh-ed25519 255 SHA256:pluXiqOiYsEH1N2eaOqo+v1qGAN5ysG06geZCbqX9oc'
$credentialFile = Join-Path $env:APPDATA 'Umunsi\deploy-credential.xml'

if (-not (Test-Path $credentialFile)) {
  throw "Credential file not found: $credentialFile"
}

$savedCredential = Import-Clixml -Path $credentialFile
$remoteUser = $savedCredential.UserName
$remotePassword = [System.Net.NetworkCredential]::new('', $savedCredential.Password).Password

if (-not $remoteUser -or -not $remotePassword) {
  throw 'Failed to load deploy credentials.'
}

$pairs = @{
  'TWILIO_ACCOUNT_SID' = $TwilioAccountSid
  'TWILIO_AUTH_TOKEN' = $TwilioAuthToken
  'TWILIO_FROM_NUMBER' = $TwilioFromNumber
  'AFRICASTALKING_USERNAME' = $AfricasTalkingUsername
  'AFRICASTALKING_API_KEY' = $AfricasTalkingApiKey
  'AFRICASTALKING_SENDER_ID' = $AfricasTalkingSenderId
}

# Only write keys that were provided.
$setLines = @()
foreach ($key in $pairs.Keys) {
  $value = $pairs[$key]
  if ($null -ne $value -and $value -ne '') {
    $escaped = $value.Replace('"', '\"')
    $setLines += "upsert_key \"$key\" \"$escaped\""
  }
}

if ($setLines.Count -eq 0) {
  Write-Host 'No SMS values provided. Nothing to update.' -ForegroundColor Yellow
  exit 0
}

$remoteCmd = @"
set -e
cd /home/umunsi/backend-api
[ -f .env ] || touch .env

upsert_key() {
  key=\"\$1\"
  value=\"\$2\"
  if grep -q \"^\${key}=\" .env; then
    sed -i \"s|^\${key}=.*|\${key}=\${value}|\" .env
  else
    echo \"\${key}=\${value}\" >> .env
  fi
}

$($setLines -join "`n")

PM2_HOME=/home/umunsi/.pm2 pm2 restart umunsi-backend
PM2_HOME=/home/umunsi/.pm2 pm2 save

echo SMS_SECRETS_UPDATED
"@

$remoteScriptPath = Join-Path $env:TEMP 'umunsi_set_sms_secrets.sh'
Set-Content -Path $remoteScriptPath -Value $remoteCmd -Encoding ASCII

& 'C:\Program Files\PuTTY\plink.exe' -ssh "$remoteUser@$serverHost" -hostkey $serverHostKey -pw $remotePassword -batch -m $remoteScriptPath
if ($LASTEXITCODE -ne 0) {
  throw 'Failed to update SMS secrets on server.'
}

Write-Host 'Done. SMS secrets updated and backend restarted.' -ForegroundColor Green
