#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash scripts/db/seed-remote.sh "postgres://user:password@host:5432/db?sslmode=require"

REMOTE_URL=${1:-}
if [[ -z "$REMOTE_URL" ]]; then
  echo "Usage: $0 <REMOTE_URL>" >&2
  exit 1
fi

command -v npx >/dev/null 2>&1 || { echo "npx not found" >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "node not found" >&2; exit 1; }

echo "[1/2] Apply Prisma migrations on remote"
DATABASE_URL="$REMOTE_URL" npx prisma migrate deploy

echo "[2/2] Seed remote database"
DATABASE_URL="$REMOTE_URL" node scripts/seed.mjs

echo "Seed completed on remote."

