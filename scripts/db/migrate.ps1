# Usage:
#   ./scripts/db/migrate.ps1 -LocalUrl "postgresql://user:pass@localhost:5432/db" -RemoteUrl "postgresql://user:pass@host:5432/db?sslmode=require"

param(
  [Parameter(Mandatory = $true)] [string]$LocalUrl,
  [Parameter(Mandatory = $true)] [string]$RemoteUrl
)

$ErrorActionPreference = 'Stop'

function Require-Cli($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "CLI '$name' is required but not found in PATH. Install PostgreSQL client tools."
  }
}

Require-Cli pg_dump
Require-Cli psql

$dump = Join-Path $PSScriptRoot 'data.sql'
Write-Host "[1/3] Export local data -> $dump"
& pg_dump --data-only --inserts --column-inserts --no-owner --no-privileges -d $LocalUrl | Out-File -FilePath $dump -Encoding utf8

Write-Host "[2/3] Apply Prisma migrations on remote"
$env:DATABASE_URL = $RemoteUrl
if (Get-Command npx -ErrorAction SilentlyContinue) {
  & npx prisma migrate deploy
} else {
  throw "npx is required to run Prisma CLI. Please install Node.js."
}

Write-Host "[3/3] Import data into remote"
& psql $RemoteUrl -f $dump

Write-Host "Done. Verify your app and data on the remote."

