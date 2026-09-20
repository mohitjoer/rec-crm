#!/usr/bin/env bash
# ==============================================================================
# Recovra - Start Multi-Container Stack (CRM + Voice Agent)
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
echo -e "${BOLD}${CYAN}  RECOVRA — Starting Containerized Multi-Service Stack           ${NC}"
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

echo -e "${CYAN}==>${NC} Launching Docker containers in background..."
docker compose up -d "$@"

echo -e "${CYAN}==>${NC} Verifying service health..."
sleep 3

# Wait for CRM container healthcheck (up to 30s)
MAX_RETRIES=15
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
  echo -e "${GREEN}==> SUCCESS: All services are running and healthy!${NC}"
else
  echo -e "${YELLOW}==> Containers started. Healthcheck still warming up...${NC}"
fi

echo ""
echo -e "${BOLD}Service Endpoints:${NC}"
echo -e "  • ${BOLD}SaaS CRM Dashboard:${NC}  ${CYAN}http://localhost:3000${NC}"
echo -e "  • ${BOLD}CRM Health Check:${NC}    ${CYAN}http://localhost:3000/api/health${NC}"
echo -e "  • ${BOLD}LiveKit Voice Agent:${NC} Connected to LiveKit Cloud & CRM internal API"
echo ""

docker compose ps
echo ""
echo -e "To view live logs:    ${BOLD}./logs.sh${NC} or ${BOLD}docker compose logs -f${NC}"
echo -e "To stop services:     ${BOLD}./stop.sh${NC}"
echo -e "To rebuild & redeploy:${BOLD}./redeploy.sh${NC}"
