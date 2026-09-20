#!/usr/bin/env bash
# ==============================================================================
# Recovra - Rebuild & Redeploy Multi-Container Stack (CRM + Voice Agent)
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
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BOLD}${WHITE}================================================================${NC}"
echo -e "${BOLD}${CYAN}  RECOVRA — Rebuilding & Redeploying Containerized Stack         ${NC}"
echo -e "${BOLD}${WHITE}================================================================${NC}"

# Check .env existence
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    echo -e "${YELLOW}==>${NC} .env file not found. Initializing from .env.example..."
    cp .env.example .env
  else
    echo -e "${RED}==>${NC} ERROR: .env file missing and .env.example not found."
    exit 1
  fi
fi

echo -e "${CYAN}==>${NC} Step 1/3: Rebuilding production Docker images..."
docker compose build "$@"

echo -e "${CYAN}==>${NC} Step 2/3: Recreating containers with updated images..."
docker compose up -d --force-recreate "$@"

echo -e "${CYAN}==>${NC} Step 3/3: Waiting for health check verification..."

MAX_RETRIES=20
COUNT=0
HEALTHY=false

while [ $COUNT -lt $MAX_RETRIES ]; do
  if curl -s -f http://localhost:3000/api/health > /dev/null 2>&1; then
    HEALTHY=true
    break
  fi
  COUNT=$((COUNT + 1))
  sleep 2
done

echo ""
if [ "$HEALTHY" = true ]; then
  echo -e "${GREEN}==> SUCCESS: Redeployment completed! All services healthy.${NC}"
else
  echo -e "${YELLOW}==> Redeployment finished. Verifying container status...${NC}"
fi

echo ""
echo -e "${BOLD}Current Service Status:${NC}"
docker compose ps

echo ""
echo -e "${BOLD}Service Endpoints:${NC}"
echo -e "  • ${BOLD}SaaS CRM Dashboard:${NC}  ${CYAN}http://localhost:3000${NC}"
echo -e "  • ${BOLD}CRM Health Check:${NC}    ${CYAN}http://localhost:3000/api/health${NC}"
echo ""
echo -e "To follow live logs: ${BOLD}./logs.sh${NC}"
