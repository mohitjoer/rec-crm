#!/usr/bin/env bash
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}==>${NC} Launching Recovra Docker Compose stack..."

# Check if .env exists
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    echo -e "${YELLOW}==>${NC} .env not found, creating from .env.example..."
    cp .env.example .env
  fi
fi

# Ensure build exists or start directly
docker compose up -d "$@"

echo -e "${GREEN}==>${NC} Stack is up and running!"
echo -e "${GREEN}==>${NC} SaaS CRM: http://localhost:3000"
echo -e "${GREEN}==>${NC} Health:   http://localhost:3000/api/health"
echo -e "${GREEN}==>${NC} Run './start.sh logs' to monitor container output in real time."
