# Hostinger VPS Complete Setup Guide

## Overview

This guide sets up **sharekte.com** on Hostinger VPS with:
- ✅ Node.js + Express API
- ✅ React SPA (Vite)
- ✅ Nginx reverse proxy (port 8080)
- ✅ PM2 process manager (auto-restart)
- ✅ HTTPS/SSL (Let's Encrypt)
- ✅ GitHub auto-deploy (push → auto-build)
- ✅ Airtable data sync

---

## Phase 1: Initial SSH Connection

```bash
ssh root@srv1092855.hstgr.cloud
```

---

## Phase 2: Install System Dependencies

```bash
# Update system packages
apt update && apt upgrade -y

# Install Node.js 22 (latest LTS)
apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Install Nginx
apt install -y nginx

# Install Git
apt install -y git

# Install PM2 globally
npm install -g pnpm pm2

# Verify installations
node --version    # v22.x.x
npm --version     # 10.x.x
pnpm --version    # 10.x.x
pm2 --version     # 5.x.x
nginx -v          # nginx/1.x.x
git --version     # git version 2.x.x
```

---

## Phase 3: Clone and Setup Application

```bash
# Create app directory
mkdir -p /var/www/sharekte.com
cd /var/www/sharekte.com

# Clone repository
git clone -b main https://github.com/ashashpachaa/sharekte.com.git .

# Install dependencies
pnpm install --frozen-lockfile

# Build the application
npm run build

# Verify build output
ls -la dist/spa/index.html      # Should exist
ls -la dist/server/node-build.mjs  # Should exist
```

---

## Phase 4: Set Environment Variables

```bash
# Create .env file with production variables
cat > /var/www/sharekte.com/.env << 'EOF'
# Application Configuration
NODE_ENV=production
PORT=8080
APP_URL=https://sharekte.com

# Airtable Configuration (REQUIRED)
AIRTABLE_API_TOKEN=patLkehZ2xg1wRuKr.59e309fed3a49ecc3bee1f2ade0c8603e30f48887c257fb29998547f7e8e3ded
VITE_AIRTABLE_API_TOKEN=patLkehZ2xg1wRuKr.59e309fed3a49ecc3bee1f2ade0c8603e30f48887c257fb29998547f7e8e3ded
AIRTABLE_BASE_ID=app0PK34gyJDizR3Q
AIRTABLE_TABLE_TRANSFER_FORMS=tblK7lUO1cfNFYO14
AIRTABLE_TABLE_ORDERS=tbl01DTvrGtsAaPfZ
AIRTABLE_TABLE_COMPANIES=tbljtdHPdHnTberDy

# Email Configuration (Optional - for notifications)
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASSWORD=your-app-password
# SUPPORT_EMAIL=support@sharekte.com
EOF

# Verify .env file
cat /var/www/sharekte.com/.env
```

---

## Phase 5: Setup Nginx

```bash
# Copy Nginx configuration
sudo cp /var/www/sharekte.com/nginx-sharekte.conf /etc/nginx/sites-available/sharekte.com

# Enable the site
sudo ln -s /etc/nginx/sites-available/sharekte.com /etc/nginx/sites-enabled/sharekte.com

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default 2>/dev/null || true

# Test Nginx configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check Nginx status
sudo systemctl status nginx
```

---

## Phase 6: Setup SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot certonly --standalone -d sharekte.com -d www.sharekte.com --email your-email@gmail.com --agree-tos --non-interactive

# Verify certificate
sudo certbot certificates

# Test renewal (dry run)
sudo certbot renew --dry-run

# Enable auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## Phase 7: Setup PM2 Process Manager

```bash
# Start application with PM2
cd /var/www/sharekte.com
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u root --hp /root
# Run the command it outputs

# Verify PM2 is running
pm2 list
pm2 status
pm2 logs sharekte
```

---

## Phase 8: Verify Deployment

```bash
# Check if server is running
curl http://localhost:8080/health

# Check API endpoint
curl http://localhost:8080/api/ping

# Check HTTPS (from your local machine)
curl https://sharekte.com/health

# Monitor logs
pm2 logs sharekte

# Monitor system resources
pm2 monit
```

---

## Phase 9: Setup GitHub Auto-Deployment

### On GitHub:

1. Go to: `https://github.com/ashashpachaa/sharekte.com/settings/secrets/actions`

2. Add these secrets:
   - `HOSTINGER_HOST`: `srv1092855.hstgr.cloud`
   - `HOSTINGER_USER`: `root`
   - `HOSTINGER_PORT`: `22`
   - `HOSTINGER_SSH_KEY`: (paste your SSH private key)

### To get SSH private key:

On your Hostinger VPS:
```bash
cat ~/.ssh/id_rsa
# Copy the entire output (includes -----BEGIN RSA PRIVATE KEY-----)
```

Or generate new key:
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
cat ~/.ssh/id_rsa
```

### Now deployment works:

```bash
# On your local machine
git add .
git commit -m "Deploy to Hostinger"
git push origin main

# GitHub Actions will automatically:
# 1. SSH into Hostinger
# 2. Pull latest code
# 3. Install dependencies
# 4. Build application
# 5. Restart PM2
# 6. Verify health check
```

---

## Monitoring and Maintenance

### Check Application Status

```bash
# PM2 status
pm2 list
pm2 status sharekte

# Logs (last 100 lines)
pm2 logs sharekte --lines 100

# Real-time monitoring
pm2 monit

# Restart application
pm2 restart sharekte

# Stop application
pm2 stop sharekte

# Start application
pm2 start ecosystem.config.js
```

### Check System Health

```bash
# Disk space
df -h

# Memory usage
free -h

# CPU usage
top

# Port 8080 is listening
lsof -i :8080

# Port 80/443 (Nginx)
lsof -i :80
lsof -i :443
```

### View Logs

```bash
# Application logs
tail -f /var/log/sharekte-out.log
tail -f /var/log/sharekte-error.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System journal
journalctl -u nginx -f
journalctl -u pm2-root -f
```

---

## Troubleshooting

### Problem: "SPA index.html not found"

```bash
# Check if build exists
ls -la /var/www/sharekte.com/dist/spa/index.html

# If missing, rebuild
cd /var/www/sharekte.com
npm run build

# Restart PM2
pm2 restart sharekte
```

### Problem: Port 8080 already in use

```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or restart PM2
pm2 restart sharekte
```

### Problem: Nginx not proxying correctly

```bash
# Test Nginx config
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# Reload Nginx
sudo systemctl reload nginx
```

### Problem: SSL Certificate not renewing

```bash
# Check certificate status
sudo certbot certificates

# Manually renew
sudo certbot renew

# Check renewal logs
tail -f /var/log/letsencrypt/letsencrypt.log
```

### Problem: Environment variables not loaded

```bash
# Check .env file
cat /var/www/sharekte.com/.env

# Restart PM2 to reload .env
pm2 restart sharekte

# Verify variables are loaded
pm2 env sharekte
```

### Problem: Airtable sync not working

```bash
# Check AIRTABLE_API_TOKEN
echo $AIRTABLE_API_TOKEN

# Verify Airtable tables exist
# https://airtable.com/app0PK34gyJDizR3Q/

# Check API logs
pm2 logs sharekte | grep -i airtable
```

---

## Backup and Recovery

### Backup Application

```bash
# Backup entire app directory
tar -czf /var/backups/sharekte-backup-$(date +%Y%m%d).tar.gz /var/www/sharekte.com

# List backups
ls -la /var/backups/sharekte-backup-*.tar.gz
```

### Recovery from GitHub

```bash
# Stop the app
pm2 stop sharekte

# Remove old code
rm -rf /var/www/sharekte.com/*

# Clone fresh from GitHub
cd /var/www/sharekte.com
git clone -b main https://github.com/ashashpachaa/sharekte.com.git .

# Install and build
pnpm install --frozen-lockfile
npm run build

# Start
pm2 start ecosystem.config.js
```

---

## Production Checklist

- [ ] Node.js 22 installed
- [ ] Nginx installed and configured
- [ ] Let's Encrypt SSL certificate installed
- [ ] Git repository cloned
- [ ] Dependencies installed (`pnpm install`)
- [ ] Application built (`npm run build`)
- [ ] Environment variables set in `/var/www/sharekte.com/.env`
- [ ] PM2 started with `pm2 start ecosystem.config.js`
- [ ] PM2 saved with `pm2 save`
- [ ] PM2 startup configured with `pm2 startup`
- [ ] Health check passes: `curl https://sharekte.com/health`
- [ ] API endpoint works: `curl https://sharekte.com/api/ping`
- [ ] Nginx status is running: `sudo systemctl status nginx`
- [ ] SSL certificate is valid: `sudo certbot certificates`
- [ ] GitHub secrets configured (HOSTINGER_HOST, HOSTINGER_USER, HOSTINGER_SSH_KEY)
- [ ] Auto-deploy workflow enabled in `.github/workflows/deploy-hostinger.yml`

---

## Important Endpoints

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `https://sharekte.com/health` | Health check | `{ "status": "ok" }` |
| `https://sharekte.com/api/ping` | API test | `{ "message": "ping" }` |
| `https://sharekte.com/api/companies` | List companies | Array of company objects |
| `https://sharekte.com/api/orders` | List orders | Array of order objects |
| `https://sharekte.com/api/transfer-forms` | List transfer forms | Array of form objects |

---

## Performance Tips

1. **Monitor resource usage**:
   ```bash
   pm2 monit
   ```

2. **Scale to multiple instances** (if needed):
   ```javascript
   // In ecosystem.config.js
   instances: 'max',  // Use all CPU cores
   exec_mode: 'cluster',
   ```

3. **Enable browser caching** in Nginx (already in config):
   ```nginx
   expires 30d;  # Cache for 30 days
   ```

4. **Enable Gzip compression** (already in config):
   ```bash
   gzip on;
   gzip_types text/plain text/css application/json application/javascript;
   ```

---

## Additional Resources

- **PM2 Documentation**: https://pm2.keymetrics.io/
- **Nginx Documentation**: https://nginx.org/en/docs/
- **Node.js Documentation**: https://nodejs.org/en/docs/
- **Let's Encrypt**: https://letsencrypt.org/
- **Airtable API**: https://airtable.com/api

---

## Support

For issues:

1. Check logs: `pm2 logs sharekte`
2. Check status: `pm2 status`
3. Restart: `pm2 restart sharekte`
4. Redeploy: Push to GitHub (auto-deploy via GitHub Actions)

**Last Updated**: November 2024
**Status**: ✅ Production Ready
