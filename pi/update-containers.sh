#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIR=${1:-$SCRIPT_DIR}

cd "$PROJECT_DIR"

docker load -i backend-image.tar
docker load -i frontend-image.tar
docker compose up -d --no-build --force-recreate
