#!/usr/bin/env bash
# Sync server code with GitHub main (handles untracked public/ build files).
set -euo pipefail

BACKEND_DIR="${UMUNSI_BACKEND_DIR:-/home/umunsi/backend-api}"

cd "$BACKEND_DIR"

echo "==> Fetching latest main..."
git fetch origin main

echo "==> Removing untracked build artifacts that block updates..."
git clean -fd public/ 2>/dev/null || true

echo "==> Resetting to origin/main..."
git reset --hard origin/main

echo "==> Installing dependencies..."
npm install --production --omit=dev

echo "==> Prisma generate..."
npx prisma generate

echo "==> Running PM2 restart..."
bash "$BACKEND_DIR/scripts/server-restart.sh"
