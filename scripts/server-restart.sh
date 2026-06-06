#!/usr/bin/env bash
# Quick PM2 restart after git pull — run as root on Hostinger.
set -euo pipefail

BACKEND_DIR="${UMUNSI_BACKEND_DIR:-/home/umunsi/backend-api}"
PM2_APP="${UMUNSI_PM2_APP:-umunsi-backend}"
PM2_HOME="${UMUNSI_PM2_HOME:-/home/umunsi/.pm2}"
APP_USER="${UMUNSI_APP_USER:-umunsi}"

cd "$BACKEND_DIR"
mkdir -p logs
chown -R "$APP_USER:$APP_USER" "$BACKEND_DIR"

sudo -u "$APP_USER" env PM2_HOME="$PM2_HOME" bash -lc "
  cd '$BACKEND_DIR'
  pm2 delete '$PM2_APP' 2>/dev/null || true
  pm2 start ecosystem.config.js --env production
  pm2 save
  pm2 status
"

curl -fsS -A "Mozilla/5.0" http://127.0.0.1:3000/api/health && echo
