#!/usr/bin/env bash
# Creates a clean source zip for hand-off (no node_modules, build output or secrets).
# Usage: bash scripts/handoff.sh   -> produces ../kalpa-living-source.zip
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-../kalpa-living-source.zip}"
rm -f "$OUT"
zip -rq "$OUT" . \
  -x "node_modules/*" ".next/*" ".env" "*.log" ".git/*" "tsconfig.tsbuildinfo" "next-env.d.ts"
echo "Wrote $OUT ($(du -h "$OUT" | cut -f1))"
echo "Includes: source, docs/schema.sql, drizzle/ migrations, SETUP.md, .env.example"
