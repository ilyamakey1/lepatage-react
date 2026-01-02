#!/bin/bash

# Quick update script for L'Épatage
set -e

echo "🔄 Updating L'Épatage..."

# Pull latest changes
git pull origin main

# Backup database before update
echo "📦 Creating backup..."
DATE=$(date +%Y%m%d_%H%M%S)
cp database/lepatage.db database/lepatage_backup_$DATE.db

# Rebuild and restart services
echo "🔨 Rebuilding application..."
docker-compose build --no-cache

echo "🔄 Restarting services..."
docker-compose down
docker-compose up -d

# Run any new migrations
echo "📊 Running database migrations..."
docker-compose exec app npm run db:migrate

echo "✅ Update completed!"
echo "🌐 Site: https://$(grep DOMAIN .env | cut -d '=' -f2)"

# Clean old backups (keep last 5)
find database/ -name "lepatage_backup_*.db" -type f | sort -r | tail -n +6 | xargs rm -f

