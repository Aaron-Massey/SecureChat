#!/bin/sh
set -e

# Generate temporary self-signed SSL certificates if certs are missing
if [ ! -f /etc/nginx/certs/server.crt ] || [ ! -f /etc/nginx/certs/server.key ]; then
  echo "[Nginx Entrypoint] SSL certificates missing in /etc/nginx/certs/. Generating self-signed certificates..."
  mkdir -p /etc/nginx/certs
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/certs/server.key \
    -out /etc/nginx/certs/server.crt \
    -subj "/CN=localhost" 2>/dev/null || echo "[Nginx Entrypoint] Warning: could not generate self-signed certs."
fi

exec "$@"
