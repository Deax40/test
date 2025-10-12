DB Migration Helpers

What it does
- Exports local Postgres data (data-only) using pg_dump.
- Applies Prisma migrations on the remote (keeps schema consistent).
- Imports data into the remote using psql.
- Seed remote database with default data (Care + Commun) if needed.

Requirements
- PostgreSQL client tools: pg_dump, psql in PATH.
- Node.js (npx) for Prisma CLI.

Commands
- PowerShell (Windows):
  ./scripts/db/migrate.ps1 -LocalUrl "postgresql://user:pass@localhost:5432/db" -RemoteUrl "postgresql://user:pass@host:5432/db?sslmode=require"

- Bash (macOS/Linux/WSL):
  bash scripts/db/migrate.sh "postgresql://user:pass@localhost:5432/db" "postgresql://user:pass@host:5432/db?sslmode=require"

Seed only (no local dump):
- PowerShell: ./scripts/db/seed-remote.ps1 -RemoteUrl "postgres://user:pass@host:5432/db?sslmode=require"
- Bash:      bash scripts/db/seed-remote.sh "postgres://user:pass@host:5432/db?sslmode=require"

Notes
- The app uses Prisma with DATABASE_URL. Ensure your Vercel project has a correct DATABASE_URL set (with ?sslmode=require). STORAGE_* variables are not used by Prisma unless your code reads them explicitly.
- If your remote URL came without an '@' between password and host, fix it: postgres://user:password@host:5432/db?sslmode=require
 - To restore default Care tools on an empty database, run the seed-only command above against your remote DATABASE_URL.

