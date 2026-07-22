#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIR=${1:-$SCRIPT_DIR}

cd "$PROJECT_DIR"

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
  echo "WARNING: 'certs' directory not found in $PROJECT_DIR."
  echo "Please ensure server.crt and server.key exist in a 'certs/' folder."
fi

echo "Loading backend docker image..."
docker load -i backend-image.tar

echo "Loading frontend docker image..."
docker load -i frontend-image.tar

echo "Recreating containers with Docker Compose..."
docker compose up -d --no-build --force-recreate

echo "SecureChat containers updated successfully over HTTPS!"
