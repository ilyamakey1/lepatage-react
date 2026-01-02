# L'Épatage - Production Deployment Guide

## 🚀 Professional Deployment on Your Own Server

This guide will help you deploy L'Épatage as a professional e-commerce website on your own server with your domain.

## 📋 Prerequisites

- **Server**: Ubuntu 20.04+ or CentOS 8+ (2GB RAM minimum, 4GB recommended)
- **Domain**: Your purchased domain name
- **Access**: SSH access to your server with sudo privileges
- **Email**: Valid email address for SSL certificates

## 🛠 Quick Deployment

### 1. Server Preparation

```bash
# Update your server
sudo apt update && sudo apt upgrade -y

# Create deployment user (optional but recommended)
sudo adduser deploy
sudo usermod -aG sudo deploy
su - deploy
```

### 2. Clone and Deploy

```bash
# Clone the repository
git clone <your-repo-url> /var/www/lepatage
cd /var/www/lepatage

# Copy environment configuration
cp env.example .env

# Edit configuration
nano .env
```

### 3. Configure Environment

Edit `.env` file with your settings:

```bash
# Domain
DOMAIN=yourdomain.com

# Database (SQLite - ready to use)
DATABASE_URL="file:./database/lepatage.db"

# Security
JWT_SECRET=your-super-secret-jwt-key-here

# Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Server
NODE_ENV=production
PORT=3001
```

### 4. Run Deployment Script

```bash
# Make sure you have your domain pointed to your server IP
# Run the automated deployment
./deploy.sh
```

The script will automatically:
- Install Docker and dependencies
- Build the application
- Set up SSL certificates
- Configure Nginx reverse proxy
- Start all services
- Set up monitoring and backups

## 🌐 DNS Configuration

Point your domain to your server:

```
A Record: yourdomain.com → YOUR_SERVER_IP
A Record: www.yourdomain.com → YOUR_SERVER_IP
```

## 🔧 Manual Configuration (Alternative)

If you prefer manual setup:

### 1. Install Dependencies

```bash
# Install Docker
sudo apt install docker.io docker-compose

# Install Node.js (for local development)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs
```

### 2. Build and Start

```bash
# Build application
npm install
npm run build

# Start with Docker
docker-compose up -d

# Or start manually with PM2
npm install -g pm2
pm2 start ecosystem.config.js --env production
```

### 3. Set up Nginx

```bash
# Install Nginx
sudo apt install nginx

# Copy configuration
sudo cp nginx.conf /etc/nginx/sites-available/lepatage
sudo ln -s /etc/nginx/sites-available/lepatage /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL Certificates

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 📊 Management Commands

### View Logs
```bash
# Application logs
docker-compose logs -f app

# Nginx logs
docker-compose logs -f nginx

# All services
docker-compose logs -f
```

### Update Application
```bash
# Quick update
./update.sh

# Or manually
git pull origin main
docker-compose build --no-cache
docker-compose up -d
```

### Database Management
```bash
# Backup database
cp database/lepatage.db database/backup_$(date +%Y%m%d).db

# Run migrations
docker-compose exec app npm run db:migrate

# Access database
sqlite3 database/lepatage.db
```

### Service Management
```bash
# Check status
docker-compose ps

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Start services
docker-compose up -d
```

## 🛡 Security Features

- **SSL/TLS encryption** with automatic renewal
- **Rate limiting** on API endpoints
- **Security headers** (HSTS, XSS protection, etc.)
- **Input validation** and sanitization
- **JWT authentication** for admin access
- **File upload restrictions**
- **CORS configuration**

## 📈 Performance Optimizations

- **Nginx reverse proxy** with gzip compression
- **Static file caching** with long expiration
- **Image optimization** and compression
- **Database query optimization**
- **CDN-ready** static assets
- **Process management** with PM2

## 🔄 Monitoring & Maintenance

### Automated Tasks
- **SSL certificate renewal** (monthly)
- **Database backups** (daily)
- **Log rotation** (weekly)
- **Service health checks** (every 5 minutes)

### Manual Monitoring
```bash
# Check disk space
df -h

# Check memory usage
free -m

# Check service status
docker-compose ps

# Check logs for errors
docker-compose logs app | grep -i error
```

## 🆘 Troubleshooting

### Common Issues

1. **Site not accessible**
   ```bash
   # Check if services are running
   docker-compose ps
   
   # Check nginx configuration
   sudo nginx -t
   
   # Check DNS
   nslookup yourdomain.com
   ```

2. **SSL certificate issues**
   ```bash
   # Renew certificates manually
   docker-compose run --rm certbot renew
   docker-compose restart nginx
   ```

3. **Database issues**
   ```bash
   # Check database file permissions
   ls -la database/
   
   # Restore from backup
   cp database/backup_YYYYMMDD.db database/lepatage.db
   ```

4. **High memory usage**
   ```bash
   # Restart services
   docker-compose restart
   
   # Check logs for memory leaks
   docker-compose logs app | grep -i memory
   ```

## 📞 Support

- Check application logs: `docker-compose logs -f`
- Review Nginx logs: `tail -f /var/log/nginx/error.log`
- Monitor system resources: `htop` or `docker stats`

## 🎯 Production Checklist

- [ ] Domain DNS configured
- [ ] SSL certificates installed
- [ ] Environment variables set
- [ ] Database initialized
- [ ] Email notifications working
- [ ] Admin account created
- [ ] Products uploaded
- [ ] Backup system active
- [ ] Monitoring configured
- [ ] Performance tested

## 🔐 Admin Access

After deployment, access your admin panel at:
`https://yourdomain.com/admin`

Default admin credentials will be created during first setup.

---

Your L'Épatage e-commerce site is now ready for production! 🎉

