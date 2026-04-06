# Hostinger backend deployment script
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\deploy-to-hostinger.ps1

$ErrorActionPreference = 'Stop'

$server = 'admin@93.127.186.217'
$remoteCommands = @'
set -e
cd /home/umunsi/htdocs/umunsi.com
rm -rf * .git* .gitignore 2>/dev/null || true
git clone https://github.com/Kwizera250232/umunsi-backendOG.git . --branch main --depth 1
npm install --production --omit=dev
if [ ! -f .env ]; then
  cp .env.production .env
fi
npx prisma generate
npx prisma db push --skip-generate
npm install -g pm2
mkdir -p logs
pm2 delete umunsi-backend 2>/dev/null || true
pm2 start ecosystem.config.js --name umunsi-backend --env production
pm2 save
echo DEPLOYMENT_SUCCESS
'@

Write-Host 'Starting backend deployment to Hostinger...' -ForegroundColor Cyan
Write-Host 'You may be prompted for SSH password.' -ForegroundColor Yellow

ssh -o StrictHostKeyChecking=no $server $remoteCommands

if ($LASTEXITCODE -eq 0) {
  Write-Host 'Deployment finished successfully.' -ForegroundColor Green
  Write-Host 'Backend URL: https://umunsi.com' -ForegroundColor Green
} else {
  Write-Host 'Deployment failed. Check output above.' -ForegroundColor Red
  exit 1
}
