#!/bin/sh
set -e

# Ensure active certs directory exists inside container's writable filesystem
mkdir -p /etc/nginx/active-certs

# Check if valid SSL certificates are mounted in /etc/nginx/certs/
if [ -f /etc/nginx/certs/server.crt ] && [ -f /etc/nginx/certs/server.key ]; then
  echo "[Nginx Entrypoint] Using mounted SSL certificates from /etc/nginx/certs/."
  cp -f /etc/nginx/certs/server.crt /etc/nginx/active-certs/server.crt 2>/dev/null || ln -sf /etc/nginx/certs/server.crt /etc/nginx/active-certs/server.crt
  cp -f /etc/nginx/certs/server.key /etc/nginx/active-certs/server.key 2>/dev/null || ln -sf /etc/nginx/certs/server.key /etc/nginx/active-certs/server.key
else
  echo "[Nginx Entrypoint] No mounted SSL certs found in /etc/nginx/certs/. Generating self-signed certificates..."
  mkdir -p /etc/nginx/selfsigned
  if [ ! -f /etc/nginx/selfsigned/server.crt ] || [ ! -f /etc/nginx/selfsigned/server.key ]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/nginx/selfsigned/server.key \
      -out /etc/nginx/selfsigned/server.crt \
      -subj "/CN=localhost" 2>/dev/null || echo "[Nginx Entrypoint] Warning: could not generate self-signed certs."
  fi
  cp -f /etc/nginx/selfsigned/server.crt /etc/nginx/active-certs/server.crt 2>/dev/null || true
  cp -f /etc/nginx/selfsigned/server.key /etc/nginx/active-certs/server.key 2>/dev/null || true
fi

exec "$@"
