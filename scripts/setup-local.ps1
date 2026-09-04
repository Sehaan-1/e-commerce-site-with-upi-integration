#!/usr/bin/env pwsh
# setup-local.ps1 — Automated local dev environment setup for Kalpa Living (Windows)
# Usage: ./scripts/setup-local.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Root = Join-Path $PSScriptRoot ".."

function Write-Step($msg) { Write-Host "`n[STEP] $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  ! $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "  ✗ $msg" -ForegroundColor Red; exit 1 }

# ── 1. Node.js version check ───────────────────────────────────────────────
Write-Step "Checking Node.js version..."
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) { Write-Fail "Node.js is not installed. Install v20+ from https://nodejs.org" }
$major = [int]($nodeVersion -replace 'v(\d+).*', '$1')
if ($major -lt 20) { Write-Fail "Node.js v20+ required, found $nodeVersion" }
Write-Ok "Node.js $nodeVersion"

# ── 2. Install dependencies ────────────────────────────────────────────────
Write-Step "Installing dependencies..."
Push-Location $Root
npm ci
if ($LASTEXITCODE -ne 0) { Write-Fail "npm ci failed" }
Write-Ok "Dependencies installed"

# ── 3. Set up .env from example ───────────────────────────────────────────
Write-Step "Setting up .env file..."
$envFile    = Join-Path $Root ".env"
$envExample = Join-Path $Root ".env.example"

if (Test-Path $envFile) {
    Write-Warn ".env already exists — skipping (to reset, delete .env and re-run)"
} else {
    Copy-Item $envExample $envFile
    Write-Ok ".env created from .env.example"
    Write-Warn "IMPORTANT: Edit .env and set ADMIN_PASSWORD, ADMIN_SESSION_SECRET, etc."
}

# ── 4. Push database schema ────────────────────────────────────────────────
Write-Step "Pushing database schema (requires DATABASE_URL in .env)..."
$dbUrl = (Get-Content $envFile | Where-Object { $_ -match "^DATABASE_URL=" }) -replace "DATABASE_URL=", ""
if (-not $dbUrl) {
    Write-Warn "DATABASE_URL not set in .env — skipping schema push"
    Write-Warn "Set DATABASE_URL in .env and run: npm run db:push"
} else {
    npm run db:push
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Schema push failed — ensure PostgreSQL is running and DATABASE_URL is correct"
    } else {
        Write-Ok "Database schema pushed"
    }
}

Pop-Location

# ── 5. Done ────────────────────────────────────────────────────────────────
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  Setup complete! Start the dev server with:" -ForegroundColor Green
Write-Host ""
Write-Host "    npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "  Then open: http://localhost:3000" -ForegroundColor White
Write-Host "  Admin panel: http://localhost:3000/admin/login" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
