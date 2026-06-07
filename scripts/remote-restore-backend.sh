#!/usr/bin/env bash
set -euo pipefail
export PATH=/home/umunsi/.nvm/versions/node/v22.22.2/bin:$PATH
export PM2_HOME=/home/umunsi/.pm2
BACKEND_DIR=/home/umunsi/backend-api

cd "$BACKEND_DIR"

echo "==> Current HEAD before reset"
git log --oneline -1

echo "==> Fetching origin/main"
git fetch origin main

echo "==> Cleaning stale build artifacts"
git clean -fd public/ dist/ 2>/dev/null || true

echo "==> Reset to origin/main"
git reset --hard origin/main

echo "==> New HEAD"
git log --oneline -3

echo "==> npm install"
npm install --production=false

echo "==> prisma generate"
npx prisma generate

echo "==> Build frontend"
npm run build

echo "==> Publish to public/"
mkdir -p public logs
rm -rf public/assets public/index.html 2>/dev/null || true
cp -a dist/. public/

echo "==> Fix ownership"
chown -R umunsi:umunsi "$BACKEND_DIR"

echo "==> Restart PM2"
pm2 restart umunsi-backend --update-env
pm2 save

sleep 4
echo "==> Health check"
curl -s -A "Mozilla/5.0" http://127.0.0.1:3000/api/health
echo
curl -s -A "Mozilla/5.0" "http://127.0.0.1:3000/api/posts?status=PUBLISHED&limit=1" | head -c 150
echo
grep -i '<title>' public/index.html | head -1
ls -la public/images/logo.png
echo "==> DEPLOY DONE"
