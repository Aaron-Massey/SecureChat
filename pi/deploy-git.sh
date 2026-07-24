#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIR=${1:-$(dirname "$SCRIPT_DIR")}

cd "$PROJECT_DIR"

echo "========================================="
echo "Updating SecureChat via Git on Pi"
echo "========================================="

echo "Step 1: Pulling latest changes from git..."
git pull

echo "Step 2: Syncing environment configuration..."
if [ ! -f .env ]; then
  if [ -f config.json ]; then
    echo "Creating .env from config.json..."
    FRONTEND_PORT=$(grep -o '"FRONTEND_PORT":[ ]*[0-9]*' config.json | grep -o '[0-9]*')
    BACKEND_PORT=$(grep -o '"BACKEND_PORT":[ ]*[0-9]*' config.json | grep -o '[0-9]*')
    echo "FRONTEND_PORT=${FRONTEND_PORT:-5173}" > .env
    echo "BACKEND_PORT=${BACKEND_PORT:-3000}" >> .env
  else
    echo "FRONTEND_PORT=5173" > .env
    echo "BACKEND_PORT=3000" >> .env
  fi
fi

if [ ! -d certs ]; then
  echo "WARNING: 'certs' directory not found."
  echo "Ensure server.crt and server.key exist in 'certs/' directory."
fi

echo "Step 3: Building and recreating Docker containers..."
docker compose up --build -d

echo "Step 4: Cleaning up build cache and old images..."
docker image prune -f

echo "Step 5: Verifying running containers..."
docker compose ps

echo "========================================="
echo "SecureChat successfully updated on Pi!"
echo "========================================="
