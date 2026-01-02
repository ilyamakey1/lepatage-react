#!/bin/bash

# L'Épatage Production Deployment Script
set -e

echo "🚀 Starting L'Épatage deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=${DOMAIN:-"yourdomain.com"}
EMAIL=${EMAIL:-"admin@yourdomain.com"}
APP_DIR="/var/www/lepatage"
BACKUP_DIR="/var/backups/lepatage"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   log_error "This script should not be run as root for security reasons"
   exit 1
fi

# Create necessary directories
log_info "Creating directories..."
sudo mkdir -p $APP_DIR $BACKUP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Update system packages
log_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
log_info "Installing required packages..."
sudo apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx git curl

# Enable and start Docker
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# Clone or update repository
if [ -d "$APP_DIR/.git" ]; then
    log_info "Updating existing repository..."
    cd $APP_DIR
    git pull origin main
else
    log_info "Cloning repository..."
    git clone https://github.com/yourusername/lepatage.git $APP_DIR
    cd $APP_DIR
fi

# Copy environment file
if [ ! -f ".env" ]; then
    log_warn "Creating .env file from template..."
    cp env.example .env
    log_warn "Please edit .env file with your configuration!"
    echo "Press any key to continue after editing .env file..."
    read -n 1
fi

# Update domain in configuration files
log_info "Updating domain configuration..."
sed -i "s/yourdomain.com/$DOMAIN/g" nginx.conf
sed -i "s/yourdomain.com/$DOMAIN/g" docker-compose.yml
sed -i "s/your-email@domain.com/$EMAIL/g" docker-compose.yml

# Build and start services
log_info "Building application..."
docker-compose build

# Create database and run migrations
log_info "Setting up database..."
docker-compose run --rm app npm run db:migrate

# Start services
log_info "Starting services..."
docker-compose up -d

# Wait for services to be ready
log_info "Waiting for services to start..."
sleep 30

# Get SSL certificates
log_info "Obtaining SSL certificates..."
docker-compose run --rm certbot

# Reload nginx with SSL
log_info "Reloading nginx with SSL..."
docker-compose restart nginx

# Setup automatic SSL renewal
log_info "Setting up SSL certificate auto-renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * cd $APP_DIR && docker-compose run --rm certbot renew --quiet && docker-compose restart nginx") | crontab -

# Setup log rotation
log_info "Setting up log rotation..."
sudo tee /etc/logrotate.d/lepatage > /dev/null <<EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        docker-compose -f $APP_DIR/docker-compose.yml restart app
    endscript
}
EOF

# Setup backup script
log_info "Setting up backup script..."
sudo tee /usr/local/bin/lepatage-backup.sh > /dev/null <<EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/lepatage_backup_\$DATE.tar.gz"

cd $APP_DIR
tar -czf \$BACKUP_FILE database/ uploads/ .env
find $BACKUP_DIR -name "lepatage_backup_*.tar.gz" -mtime +7 -delete

echo "Backup created: \$BACKUP_FILE"
EOF

sudo chmod +x /usr/local/bin/lepatage-backup.sh

# Setup daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/lepatage-backup.sh") | crontab -

# Setup monitoring script
log_info "Setting up monitoring..."
sudo tee /usr/local/bin/lepatage-monitor.sh > /dev/null <<EOF
#!/bin/bash
cd $APP_DIR

# Check if services are running
if ! docker-compose ps | grep -q "Up"; then
    echo "Services are down, restarting..."
    docker-compose up -d
fi

# Check disk space
DISK_USAGE=\$(df / | awk 'NR==2 {print \$5}' | sed 's/%//')
if [ \$DISK_USAGE -gt 80 ]; then
    echo "Warning: Disk usage is \${DISK_USAGE}%"
fi
EOF

sudo chmod +x /usr/local/bin/lepatage-monitor.sh

# Setup monitoring cron job (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/lepatage-monitor.sh >> /var/log/lepatage-monitor.log 2>&1") | crontab -

# Final checks
log_info "Running final checks..."
if curl -f https://$DOMAIN/health > /dev/null 2>&1; then
    log_info "✅ Deployment successful! Site is accessible at https://$DOMAIN"
else
    log_warn "⚠️  Deployment completed but site may not be fully accessible yet"
    log_warn "Please check the logs: docker-compose logs"
fi

log_info "🎉 L'Épatage deployment completed!"
log_info "📊 Monitor your application:"
log_info "   - Logs: docker-compose logs -f"
log_info "   - Status: docker-compose ps"
log_info "   - Admin panel: https://$DOMAIN/admin"

echo
echo "Next steps:"
echo "1. Update DNS records to point to this server"
echo "2. Configure your .env file with production settings"
echo "3. Add products and content through the admin panel"
echo "4. Test all functionality"

log_info "Deployment script completed successfully!"

