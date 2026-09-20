#!/usr/bin/env bash
# ==============================================================================
# Recovra - Follow Multi-Container Stack Logs
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

BOLD='\033[1m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}==>${NC} Following Recovra container logs (Ctrl+C to exit)..."
docker compose logs -f --tail=100 "$@"
