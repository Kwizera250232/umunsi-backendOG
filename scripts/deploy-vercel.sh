#!/usr/bin/env bash
# Deploy frontend to existing Vercel project (no DNS changes).
# Usage: VERCEL_TOKEN=xxx bash scripts/deploy-vercel.sh
set -euo pipefail

FRONTEND_DIR="${UMUNSI_FRONTEND_DIR:-/home/umunsi/frontend-app}"
PROJECT="${VERCEL_PROJECT:-umunsi}"

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "Set VERCEL_TOKEN from https://vercel.com/account/tokens"
  exit 1
fi

cd "$FRONTEND_DIR"
export VITE_API_URL="${VITE_API_URL:-https://umunsi.com/api}"

echo "==> Building..."
npm run build

echo "==> Listing accessible Vercel teams (optional scope)..."
npx vercel@latest teams ls --token "$VERCEL_TOKEN" 2>/dev/null || true

DEPLOY_ARGS=(deploy --prod --yes --token "$VERCEL_TOKEN")

# Only pass --scope if explicitly set (wrong scope causes 'account not accessible')
if [[ -n "${VERCEL_SCOPE:-}" ]]; then
  DEPLOY_ARGS+=(--scope "$VERCEL_SCOPE")
fi

# Link to existing project by name when possible
if [[ -n "$PROJECT" ]]; then
  DEPLOY_ARGS+=(--project "$PROJECT")
fi

echo "==> Deploying to Vercel..."
npx vercel@latest "${DEPLOY_ARGS[@]}"

echo "Done. Check https://www.umunsi.com"
