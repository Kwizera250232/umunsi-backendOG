#!/usr/bin/env bash
# Deploy the real umunsi-frontend build to Hostinger backend public/
set -euo pipefail
export PATH=/home/umunsi/.nvm/versions/node/v22.22.2/bin:$PATH
export PM2_HOME=/home/umunsi/.pm2

FRONTEND_DIR=/home/umunsi/frontend-app
BACKEND_DIR=/home/umunsi/backend-api

echo "==> Using yesterday frontend from $FRONTEND_DIR/dist"
if [ ! -f "$FRONTEND_DIR/dist/index.html" ]; then
  echo "Building frontend-app..."
  cd "$FRONTEND_DIR"
  git pull origin main || true
  npm install
  npm run build
fi

echo "==> Publishing frontend-app dist to backend public/"
mkdir -p "$BACKEND_DIR/public"
rm -rf "$BACKEND_DIR/public/assets" "$BACKEND_DIR/public/index.html" 2>/dev/null || true
cp -a "$FRONTEND_DIR/dist/." "$BACKEND_DIR/public/"
cp -a "$FRONTEND_DIR/dist/images/." "$BACKEND_DIR/public/images/" 2>/dev/null || true

chown -R umunsi:umunsi "$BACKEND_DIR/public"

echo "==> Restart backend"
pm2 restart umunsi-backend --update-env
pm2 save

sleep 3
echo "==> Verify"
grep -i '<title>' "$BACKEND_DIR/public/index.html" | head -1
ls "$BACKEND_DIR/public/assets/" | head -3
curl -s -A 'Mozilla/5.0' http://127.0.0.1:3000/ | grep -o 'index-[A-Za-z0-9_-]*\.\(js\|css\)' | head -3
curl -s -A 'Mozilla/5.0' http://127.0.0.1:3000/api/health
echo
echo "==> DONE"
