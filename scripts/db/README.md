DB Migration Helpers

What it does
- Exports local Postgres data (data-only) using pg_dump.
- Applies Prisma migrations on the remote (keeps schema consistent).
- Imports data into the remote using psql.

Requirements
- PostgreSQL client tools: pg_dump, psql in PATH.
- Node.js (npx) for Prisma CLI.

Commands
- PowerShell (Windows):
  ./scripts/db/migrate.ps1 -LocalUrl "postgresql://user:pass@localhost:5432/db" -RemoteUrl "postgresql://user:pass@host:5432/db?sslmode=require"

- Bash (macOS/Linux/WSL):
  bash scripts/db/migrate.sh "postgresql://user:pass@localhost:5432/db" "postgresql://user:pass@host:5432/db?sslmode=require"

Notes
- The app uses Prisma with DATABASE_URL. Ensure your Vercel project has a correct DATABASE_URL set (with ?sslmode=require). STORAGE_* variables are not used by Prisma unless your code reads them explicitly.
- If your remote URL came without an '@' between password and host, fix it: postgres://user:password@host:5432/db?sslmode=require

