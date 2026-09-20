#!/usr/bin/env bash
# ==============================================================================
# Recovra - Stop Multi-Container Stack (CRM + Voice Agent)
# ==============================================================================
set -e

# Resolve project root regardless of invocation directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Terminal Colors
BOLD='\033[1m'
WHITE='\033[1;37m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${BOLD}${WHITE}================================================================${NC}"
echo -e "${BOLD}${CYAN}  RECOVRA — Stopping Containerized Multi-Service Stack           ${NC}"
echo -e "${BOLD}${WHITE}================================================================${NC}"

echo -e "${CYAN}==>${NC} Gracefully shutting down containers..."
docker compose down "$@"

echo ""
echo -e "${GREEN}==> SUCCESS: All Recovra containers and networks stopped.${NC}"
echo -e "To restart services: ${BOLD}./start.sh${NC}"
