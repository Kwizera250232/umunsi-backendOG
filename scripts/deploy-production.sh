#!/usr/bin/env bash
# Full production deploy: backend pull, frontend build, publish static assets, restart PM2.
# Run on Hostinger as root: bash /home/umunsi/backend-api/scripts/deploy-production.sh

set -euo pipefail

BACKEND_DIR="${UMUNSI_BACKEND_DIR:-/home/umunsi/backend-api}"
PUBLIC_DIR="${UMUNSI_PUBLIC_DIR:-$BACKEND_DIR/public}"
PM2_APP="${UMUNSI_PM2_APP:-umunsi-backend}"
PM2_HOME="${UMUNSI_PM2_HOME:-/home/umunsi/.pm2}"
APP_USER="${UMUNSI_APP_USER:-umunsi}"

echo "==> Deploying Umunsi from $BACKEND_DIR"

cd "$BACKEND_DIR"

echo "==> Pulling latest main..."
git fetch origin main
git reset --hard origin/main

echo "==> Installing dependencies..."
npm install --production=false

echo "==> Prisma generate..."
npx prisma generate

echo "==> Building frontend..."
npm run build

echo "==> Publishing frontend to $PUBLIC_DIR..."
mkdir -p "$PUBLIC_DIR" "$BACKEND_DIR/logs"
rm -rf "$PUBLIC_DIR"/*
cp -a dist/. "$PUBLIC_DIR/"

echo "==> Fixing ownership for $APP_USER..."
chown -R "$APP_USER:$APP_USER" "$BACKEND_DIR"

echo "==> Restarting PM2 ($PM2_APP) as $APP_USER..."
sudo -u "$APP_USER" env PM2_HOME="$PM2_HOME" bash -lc "
  cd '$BACKEND_DIR'
  pm2 delete '$PM2_APP' 2>/dev/null || true
  pm2 start ecosystem.config.js --env production
  pm2 save
"

echo "==> Health check..."
sleep 3
curl -fsS -A "Umunsi-Deploy/1.0" http://127.0.0.1:3000/api/health | head -c 200 || {
  echo "Health check failed — recent PM2 logs:"
  sudo -u "$APP_USER" env PM2_HOME="$PM2_HOME" pm2 logs "$PM2_APP" --lines 20 --nostream || true
  exit 1
}
echo
echo "==> Deploy complete. Verify: https://umunsi.com/api/health"
