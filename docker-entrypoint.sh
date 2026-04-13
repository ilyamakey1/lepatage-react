#!/bin/sh
set -e
cd /app

# Каталог для SQLite при file:/data/... (том Fly.io)
if [ -n "$DATABASE_URL" ] && echo "$DATABASE_URL" | grep -q '^file:'; then
  dbpath=$(echo "$DATABASE_URL" | sed 's|^file:||')
  dir=$(dirname "$dbpath")
  mkdir -p "$dir" 2>/dev/null || true
fi

echo "Running database migrations..."
tsx database/migrate.ts

echo "Starting application..."
exec pm2-runtime start ecosystem.config.js
