#!/usr/bin/env bash
# setup-local.sh — Automated local dev environment setup for Kalpa Living (Unix/macOS/Linux)
# Usage: bash scripts/setup-local.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

step() { echo -e "\n${CYAN}[STEP] $1${NC}"; }
ok()   { echo -e "  ${GREEN}✓ $1${NC}"; }
warn() { echo -e "  ${YELLOW}! $1${NC}"; }
fail() { echo -e "  ${RED}✗ $1${NC}"; exit 1; }

# ── 1. Node.js version check ───────────────────────────────────────────────
step "Checking Node.js version..."
if ! command -v node &>/dev/null; then
    fail "Node.js is not installed. Install v20+ from https://nodejs.org"
fi
NODE_MAJOR=$(node --version | sed 's/v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt 20 ]; then
    fail "Node.js v20+ required, found $(node --version)"
fi
ok "Node.js $(node --version)"

# ── 2. Install dependencies ────────────────────────────────────────────────
step "Installing dependencies..."
cd "$ROOT"
npm ci
ok "Dependencies installed"

# ── 3. Set up .env from example ───────────────────────────────────────────
step "Setting up .env file..."
ENV_FILE="$ROOT/.env"
ENV_EXAMPLE="$ROOT/.env.example"

if [ -f "$ENV_FILE" ]; then
    warn ".env already exists — skipping (to reset, delete .env and re-run)"
else
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    ok ".env created from .env.example"
    warn "IMPORTANT: Edit .env and set ADMIN_PASSWORD, ADMIN_SESSION_SECRET, etc."
fi

# ── 4. Push database schema ────────────────────────────────────────────────
step "Pushing database schema (requires DATABASE_URL in .env)..."
DB_URL=$(grep "^DATABASE_URL=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' || true)
if [ -z "$DB_URL" ]; then
    warn "DATABASE_URL not set in .env — skipping schema push"
    warn "Set DATABASE_URL in .env and run: npm run db:push"
else
    if npm run db:push; then
        ok "Database schema pushed"
    else
        warn "Schema push failed — ensure PostgreSQL is running and DATABASE_URL is correct"
    fi
fi

# ── 5. Done ────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Setup complete! Start the dev server with:${NC}"
echo ""
echo "    npm run dev"
echo ""
echo "  Then open: http://localhost:3000"
echo "  Admin panel: http://localhost:3000/admin/login"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
