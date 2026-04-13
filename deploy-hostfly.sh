#!/bin/bash
set -e

# ============================================
# L'Épatage — Deploy to HostFly VPS
# ============================================
# Usage: ./deploy-hostfly.sh
#
# Before running this script on your HostFly VPS:
# 1. Buy a VPS on hostfly.by (Ubuntu 22.04, min 2GB RAM)
# 2. Connect via SSH: ssh root@YOUR_SERVER_IP
# 3. Upload this project to the server
# 4. Run this script
# ============================================

echo "=========================================="
echo "  L'Épatage — HostFly VPS Deployment"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_DIR="/var/www/lepatage"
APP_USER="lepatage"
NODE_VERSION="18"

print_step() {
    echo -e "\n${BLUE}[Step $1]${NC} $2"
}

print_ok() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root: sudo ./deploy-hostfly.sh"
    exit 1
fi

# ==========================================
# Step 1: System Update
# ==========================================
print_step "1/8" "Updating system packages..."
apt update && apt upgrade -y
apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx ufw sqlite3
print_ok "System updated"

# ==========================================
# Step 2: Install Node.js
# ==========================================
print_step "2/8" "Installing Node.js ${NODE_VERSION}..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt install -y nodejs
    print_ok "Node.js $(node -v) installed"
else
    print_ok "Node.js $(node -v) already installed"
fi

# Install PM2 and tsx globally
npm install -g pm2 tsx
print_ok "PM2 and tsx installed"

# ==========================================
# Step 3: Create app user
# ==========================================
print_step "3/8" "Setting up app user..."
if ! id "$APP_USER" &>/dev/null; then
    useradd -m -s /bin/bash "$APP_USER"
    print_ok "User '$APP_USER' created"
else
    print_ok "User '$APP_USER' already exists"
fi

# ==========================================
# Step 4: Set up application directory
# ==========================================
print_step "4/8" "Setting up application..."

# Create app directory
mkdir -p "$APP_DIR"

# Copy files if not already in the right place
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ "$SCRIPT_DIR" != "$APP_DIR" ]; then
    echo "Copying project files to $APP_DIR..."
    cp -r "$SCRIPT_DIR"/* "$APP_DIR/"
    cp -r "$SCRIPT_DIR"/.gitignore "$APP_DIR/" 2>/dev/null || true
fi

cd "$APP_DIR"

# Create necessary directories
mkdir -p logs public/assets database

# Install dependencies
print_ok "Installing npm dependencies..."
npm ci

# Build the frontend
print_ok "Building frontend..."
npm run build

# Initialize database
if [ ! -f database/lepatage.db ]; then
    print_ok "Initializing database..."
    npm run db:migrate 2>/dev/null || true
    npm run db:seed 2>/dev/null || true
fi

# Set permissions
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
print_ok "Application set up at $APP_DIR"

# ==========================================
# Step 5: Create .env file
# ==========================================
print_step "5/8" "Configuring environment..."
if [ ! -f "$APP_DIR/.env" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    cat > "$APP_DIR/.env" << ENVEOF
# Database
DATABASE_URL="file:./database/lepatage.db"

# Server
PORT=3001
NODE_ENV=production
JWT_SECRET=${JWT_SECRET}

# Frontend
VITE_API_URL=/api
ENVEOF
    chown "$APP_USER":"$APP_USER" "$APP_DIR/.env"
    print_ok ".env file created with secure JWT secret"
else
    print_warn ".env file already exists, skipping"
fi

# ==========================================
# Step 6: Configure Nginx
# ==========================================
print_step "6/8" "Configuring Nginx..."

# Ask for domain
echo ""
read -p "Enter your domain (e.g., lepatage.com) or press Enter for IP-only: " DOMAIN

if [ -z "$DOMAIN" ]; then
    SERVER_NAME="_"
    DOMAIN_DISPLAY="server IP"
else
    SERVER_NAME="$DOMAIN www.$DOMAIN"
    DOMAIN_DISPLAY="$DOMAIN"
fi

cat > /etc/nginx/sites-available/lepatage << NGINXEOF
server {
    listen 80;
    server_name ${SERVER_NAME};

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/javascript application/json application/xml+rss
               image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Max upload size
    client_max_body_size 50M;

    # Static files from the built frontend
    root ${APP_DIR}/dist;
    index index.html;

    # API proxy to Node.js backend
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Upload endpoint
    location /api/upload {
        proxy_pass http://127.0.0.1:3001/api/upload;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 50M;
    }

    # Uploaded assets
    location /assets/ {
        alias ${APP_DIR}/public/assets/;
        expires 30d;
        add_header Cache-Control "public";
    }

    # Static files with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:3001/health;
    }

    # SPA fallback — all other routes serve index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
NGINXEOF

# Enable site
ln -sf /etc/nginx/sites-available/lepatage /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t
systemctl restart nginx
systemctl enable nginx
print_ok "Nginx configured for ${DOMAIN_DISPLAY}"

# ==========================================
# Step 7: Start application with PM2
# ==========================================
print_step "7/8" "Starting application with PM2..."

cd "$APP_DIR"

# Stop existing PM2 processes if any
su - "$APP_USER" -c "cd $APP_DIR && pm2 delete all 2>/dev/null || true"

# Start with PM2 as app user
su - "$APP_USER" -c "cd $APP_DIR && pm2 start ecosystem.config.js --env production"

# Save PM2 process list
su - "$APP_USER" -c "pm2 save"

# Set up PM2 startup on boot
env PATH=$PATH:/usr/bin pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER"
print_ok "Application started with PM2"

# ==========================================
# Step 8: Firewall & SSL
# ==========================================
print_step "8/8" "Configuring firewall and SSL..."

# Configure firewall
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable
print_ok "Firewall configured (SSH + HTTP/HTTPS)"

# SSL setup
if [ "$DOMAIN" != "" ] && [ "$SERVER_NAME" != "_" ]; then
    echo ""
    read -p "Set up free SSL certificate with Let's Encrypt? (y/n): " SETUP_SSL
    if [ "$SETUP_SSL" = "y" ] || [ "$SETUP_SSL" = "Y" ]; then
        certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN" || {
            print_warn "SSL setup failed. You can run it manually later:"
            echo "  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
        }
        # Auto-renewal
        systemctl enable certbot.timer
        print_ok "SSL certificate installed"
    fi
fi

# ==========================================
# Done!
# ==========================================
echo ""
echo "=========================================="
echo -e "${GREEN}  Deployment Complete!${NC}"
echo "=========================================="
echo ""
if [ "$DOMAIN" != "" ] && [ "$SERVER_NAME" != "_" ]; then
    echo -e "  Site:    ${GREEN}http://${DOMAIN}${NC}"
    echo -e "  Admin:   ${GREEN}http://${DOMAIN}/admin${NC}"
else
    SERVER_IP=$(hostname -I | awk '{print $1}')
    echo -e "  Site:    ${GREEN}http://${SERVER_IP}${NC}"
    echo -e "  Admin:   ${GREEN}http://${SERVER_IP}/admin${NC}"
fi
echo -e "  Health:  ${GREEN}http://localhost:3001/health${NC}"
echo ""
echo "  Useful commands:"
echo "    pm2 status          — check app status"
echo "    pm2 logs            — view app logs"
echo "    pm2 restart all     — restart app"
echo "    systemctl status nginx  — check nginx"
echo ""
echo "  To update the site later:"
echo "    cd $APP_DIR"
echo "    git pull"
echo "    npm install && npm run build"
echo "    pm2 restart all"
echo ""
echo "=========================================="
