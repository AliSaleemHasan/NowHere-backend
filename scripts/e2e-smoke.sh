#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export GATEWAY_URL="${GATEWAY_URL:-http://localhost:3005}"

exec node "$ROOT/scripts/e2e-smoke.cjs"
