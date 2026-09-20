#!/usr/bin/env bash
set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${BLUE}==>${NC} Stopping Recovra Docker stack..."
docker compose down
echo -e "${GREEN}==>${NC} All containers stopped successfully."
