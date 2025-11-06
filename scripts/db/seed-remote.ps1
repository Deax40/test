# Usage:
#   ./scripts/db/seed-remote.ps1 -RemoteUrl "postgres://user:password@host:5432/db?sslmode=require"

param(
  [Parameter(Mandatory = $true)] [string]$RemoteUrl
)

$ErrorActionPreference = 'Stop'

function Require-Cli($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "CLI '$name' is required but not found in PATH."
  }
}

Require-Cli node
Require-Cli npx

Write-Host "[1/2] Apply Prisma migrations on remote"
$env:DATABASE_URL = $RemoteUrl
& npx prisma migrate deploy

Write-Host "[2/2] Seed remote database"
& node scripts/seed.mjs

Write-Host "Seed completed on remote."

