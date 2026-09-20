#!/usr/bin/env bash
# ==============================================================================
# Recovra - Status of Multi-Container Stack
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

BOLD='\033[1m'
WHITE='\033[1;37m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BOLD}${WHITE}================================================================${NC}"
echo -e "${BOLD}${CYAN}  RECOVRA — Multi-Container Stack Status                         ${NC}"
echo -e "${BOLD}${WHITE}================================================================${NC}"

docker compose ps

echo ""
echo -e "${BOLD}Health Probe (http://localhost:3000/api/health):${NC}"
HEALTH_JSON=$(curl -s -m 5 http://localhost:3000/api/health 2>/dev/null || echo "")
if [ -n "$HEALTH_JSON" ]; then
  echo -e "  ${GREEN}ONLINE${NC} — $HEALTH_JSON"
else
  echo -e "  ${RED}OFFLINE${NC} — Unable to connect to CRM health endpoint on port 3000"
fi
echo ""
