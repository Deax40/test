#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash scripts/db/migrate.sh "postgresql://user:pass@localhost:5432/db" "postgresql://user:pass@host:5432/db?sslmode=require"

LOCAL_URL=${1:-}
REMOTE_URL=${2:-}

if [[ -z "$LOCAL_URL" || -z "$REMOTE_URL" ]]; then
  echo "Usage: $0 <LOCAL_URL> <REMOTE_URL>" >&2
  exit 1
fi

command -v pg_dump >/dev/null 2>&1 || { echo "pg_dump not found" >&2; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "psql not found" >&2; exit 1; }
command -v npx >/dev/null 2>&1 || { echo "npx not found" >&2; exit 1; }

DUMP_FILE="$(dirname "$0")/data.sql"

echo "[1/3] Export local data -> $DUMP_FILE"
pg_dump --data-only --inserts --column-inserts --no-owner --no-privileges -d "$LOCAL_URL" > "$DUMP_FILE"

echo "[2/3] Apply Prisma migrations on remote"
DATABASE_URL="$REMOTE_URL" npx prisma migrate deploy

echo "[3/3] Import data into remote"
psql "$REMOTE_URL" -f "$DUMP_FILE"

echo "Done. Verify your app and data on the remote."

