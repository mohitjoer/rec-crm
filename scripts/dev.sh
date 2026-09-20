#!/usr/bin/env bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==>${NC} Starting Recovra SaaS CRM in development mode..."

if command -v bun &> /dev/null; then
  echo -e "${GREEN}==>${NC} Using Bun runtime"
  npm --prefix crm run dev
elif command -v npm &> /dev/null; then
  echo -e "${GREEN}==>${NC} Using Node/NPM runtime"
  npm --prefix crm run dev
else
  echo "Error: Neither bun nor npm is installed."
  exit 1
fi
