#!/usr/bin/env bash
# ==============================================================================
# Recovra - Platform Execution & Control Script
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Color definitions
BOLD='\033[1m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_banner() {
  echo -e "${WHITE}"
  echo "  ╔════════════════════════════════════════════════════════════════╗"
  echo "  ║                      RECOVRA PLATFORM                          ║"
  echo "  ║     Autonomous Voice Agents & Financial Recovery SaaS CRM      ║"
  echo "  ╚════════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

print_help() {
  print_banner
  echo -e "${BOLD}USAGE:${NC} ./start.sh [COMMAND]"
  echo ""
  echo -e "${BOLD}PRIMARY SCRIPTS:${NC}"
  echo -e "  ${CYAN}./start.sh${NC}        Start all services in Docker (default)"
  echo -e "  ${CYAN}./stop.sh${NC}         Stop and remove all running containers"
  echo -e "  ${CYAN}./redeploy.sh${NC}     Rebuild and restart all containers cleanly"
  echo -e "  ${CYAN}./status.sh${NC}       Check container and health endpoint status"
  echo -e "  ${CYAN}./logs.sh${NC}         Follow container logs in real time"
  echo ""
  echo -e "${BOLD}DEV COMMANDS:${NC}"
  echo -e "  ${CYAN}dev${NC}               Run Next.js CRM in local development mode"
  echo -e "  ${CYAN}agent${NC}             Run LiveKit Python voice agent worker in local dev mode"
  echo -e "  ${CYAN}build${NC}             Validate Next.js production build"
  echo -e "  ${CYAN}help${NC}              Show this help manual"
  echo ""
}

# If no arguments provided, launch the containerized stack
if [ $# -eq 0 ]; then
  exec "$SCRIPT_DIR/scripts/start.sh"
fi

COMMAND=$1
shift

case "$COMMAND" in
  up|start|docker:up)
    exec "$SCRIPT_DIR/scripts/start.sh" "$@"
    ;;

  down|stop|docker:down)
    exec "$SCRIPT_DIR/scripts/stop.sh" "$@"
    ;;

  redeploy|reload|restart)
    exec "$SCRIPT_DIR/scripts/redeploy.sh" "$@"
    ;;

  logs|docker:logs)
    exec "$SCRIPT_DIR/scripts/logs.sh" "$@"
    ;;

  status|ps)
    exec "$SCRIPT_DIR/scripts/status.sh" "$@"
    ;;

  dev)
    print_banner
    echo -e "${GREEN}==>${NC} Starting Next.js CRM Dev Server..."
    npm --prefix crm run dev
    ;;

  agent)
    print_banner
    UV_BIN=$(command -v uv 2>/dev/null || echo "$HOME/.local/bin/uv")
    if [ -x "$UV_BIN" ]; then
      echo -e "${GREEN}==>${NC} Starting LiveKit Python Voice Agent Worker with uv..."
      (cd voice_agent && "$UV_BIN" run python agent.py dev)
    else
      echo -e "${GREEN}==>${NC} Starting LiveKit Python Voice Agent Worker with python..."
      if [ -d "voice_agent/.venv" ]; then
        source voice_agent/.venv/bin/activate
      fi
      (cd voice_agent && python3 agent.py dev)
    fi
    ;;

  docker:build|build:docker)
    print_banner
    echo -e "${CYAN}==>${NC} Building production Docker images..."
    docker compose build "$@"
    echo -e "${GREEN}==>${NC} Images built successfully!"
    ;;

  build)
    print_banner
    echo -e "${CYAN}==>${NC} Validating Next.js production build..."
    npm --prefix crm run build
    ;;

  help|--help|-h)
    print_help
    ;;

  *)
    echo -e "${RED}Unknown command:${NC} $COMMAND"
    print_help
    exit 1
    ;;
esac
