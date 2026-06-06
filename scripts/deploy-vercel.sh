#!/usr/bin/env bash
# Deploy frontend to existing Vercel project (no DNS changes).
# Usage: VERCEL_TOKEN=xxx bash scripts/deploy-vercel.sh
set -euo pipefail

FRONTEND_DIR="${UMUNSI_FRONTEND_DIR:-/home/umunsi/frontend-app}"
SCOPE="${VERCEL_SCOPE:-kwizera-jean-de-dieus-projects}"
PROJECT="${VERCEL_PROJECT:-umunsi}"

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "Set VERCEL_TOKEN from https://vercel.com/account/tokens"
  exit 1
fi

cd "$FRONTEND_DIR"
export VITE_API_URL="${VITE_API_URL:-https://umunsi.com/api}"
npm run build

npx vercel@latest deploy --prod --yes \
  --token "$VERCEL_TOKEN" \
  --scope "$SCOPE" \
  --name "$PROJECT"

echo "Done. Check https://www.umunsi.com"
