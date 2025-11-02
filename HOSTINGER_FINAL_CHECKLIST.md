# Hostinger Deployment - Final Verification Checklist

## ✅ Code Configuration Complete

All the following files have been created/updated and are ready for Hostinger:

### Files Created/Updated

- ✅ `ecosystem.config.js` - PM2 configuration (auto-restart, logging, memory limits)
- ✅ `.env.example` - Updated with Hostinger variables
- ✅ `nginx-sharekte.conf` - Enhanced with rate limiting, security headers, gzip
- ✅ `.github/workflows/deploy-hostinger.yml` - Auto-deploy on push
- ✅ `HOSTINGER_SETUP_GUIDE.md` - Complete 9-phase setup instructions
- ✅ `HOSTINGER_CONFIGURATION_SUMMARY.md` - Full configuration documentation
- ✅ `server/node-build.ts` - Server entry point (ready)
- ✅ `vite.config.ts` - Client build config (ready)
- ✅ `vite.config.server.ts` - Server build config (ready)
- ✅ `Dockerfile` - Production-ready multi-stage build (ready)
- ✅ `package.json` - Build scripts configured correctly (ready)

---

## 🚀 Pre-Deployment Verification (Local)

Run these commands locally to verify everything builds correctly:

```bash
# 1. Install dependencies
pnpm install --frozen-lockfile

# 2. Build the application
npm run build

# 3. Verify build artifacts exist
ls -la dist/spa/index.html      # Should exist and be readable
ls -la dist/server/node-build.mjs  # Should exist
```

**Expected Output**:
```
dist/spa/index.html (size: 5-50KB)
dist/server/node-build.mjs (size: 100KB+)
```

If any of these files are missing, **DO NOT deploy yet**. Fix build errors first.

---

## 📋 Hostinger Setup Checklist

### Phase 1-3: SSH & Install Dependencies
- [ ] SSH to Hostinger: `ssh root@srv1092855.hstgr.cloud`
- [ ] Update system: `apt update && apt upgrade -y`
- [ ] Install Node.js 22
- [ ] Install Nginx
- [ ] Install Git
- [ ] Install PM2 globally
- [ ] Verify all installations

### Phase 4: Clone & Build
- [ ] Create `/var/www/sharekte.com` directory
- [ ] Clone repository from GitHub
- [ ] Run `pnpm install --frozen-lockfile`
- [ ] Run `npm run build`
- [ ] Verify `dist/spa/index.html` exists
- [ ] Verify `dist/server/node-build.mjs` exists

### Phase 5: Environment Variables
- [ ] Create `.env` file in `/var/www/sharekte.com/`
- [ ] Add `AIRTABLE_API_TOKEN`
- [ ] Add `VITE_AIRTABLE_API_TOKEN`
- [ ] Add all Airtable table IDs
- [ ] Set `NODE_ENV=production`
- [ ] Set `PORT=8080`
- [ ] Verify `.env` file with: `cat /var/www/sharekte.com/.env`

### Phase 6: Nginx Setup
- [ ] Copy `nginx-sharekte.conf` to `/etc/nginx/sites-available/`
- [ ] Enable site with symbolic link
- [ ] Test Nginx config: `sudo nginx -t` (should show "successful")
- [ ] Start Nginx: `sudo systemctl start nginx`
- [ ] Enable Nginx on boot: `sudo systemctl enable nginx`

### Phase 7: SSL Certificate (Let's Encrypt)
- [ ] Install Certbot
- [ ] Obtain certificate: `sudo certbot certonly --standalone -d sharekte.com`
- [ ] Verify certificate: `sudo certbot certificates`
- [ ] Verify certificate exists: `ls /etc/letsencrypt/live/sharekte.com/`
- [ ] Test renewal: `sudo certbot renew --dry-run`
- [ ] Enable auto-renewal

### Phase 8: PM2 Setup
- [ ] Start with PM2: `pm2 start ecosystem.config.js`
- [ ] Save PM2 config: `pm2 save`
- [ ] Setup boot startup: `pm2 startup`
- [ ] Run the command PM2 outputs
- [ ] Verify running: `pm2 list` (should show "sharekte" with ✓ status)

### Phase 9: Verify Deployment
- [ ] Health check: `curl http://localhost:8080/health`
- [ ] Health check HTTPS: `curl https://sharekte.com/health` (from local machine)
- [ ] API test: `curl https://sharekte.com/api/ping`
- [ ] Nginx status: `sudo systemctl status nginx` (should show "active")
- [ ] PM2 status: `pm2 status` (should show running)

---

## 🔐 GitHub Auto-Deployment Setup

### Configure GitHub Secrets

Go to: `https://github.com/ashashpachaa/sharekte.com/settings/secrets/actions`

Add these secrets:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `HOSTINGER_HOST` | Your Hostinger server | `srv1092855.hstgr.cloud` |
| `HOSTINGER_USER` | SSH user | `root` |
| `HOSTINGER_PORT` | SSH port | `22` |
| `HOSTINGER_SSH_KEY` | Private SSH key | (multi-line) |

### Get SSH Private Key

```bash
# On Hostinger VPS
cat ~/.ssh/id_rsa
# Copy entire output (including -----BEGIN PRIVATE KEY-----)
```

### Test Auto-Deployment

1. Make a small code change
2. Commit: `git commit -am "Test deployment"`
3. Push: `git push origin main`
4. Watch GitHub Actions: Go to https://github.com/ashashpachaa/sharekte.com/actions
5. Should see workflow running and completing successfully
6. Verify on Hostinger: `pm2 logs sharekte`

---

## 🔍 Verification Tests

### Test 1: Health Check
```bash
curl https://sharekte.com/health
# Expected: { "status": "ok", ... }
```

### Test 2: API Endpoint
```bash
curl https://sharekte.com/api/ping
# Expected: { "message": "ping" }
```

### Test 3: Homepage
```bash
curl https://sharekte.com/
# Expected: HTML response with React app (contains <div id="root">)
```

### Test 4: Companies List
```bash
curl https://sharekte.com/api/companies
# Expected: Array of company objects
```

### Test 5: Logs
```bash
pm2 logs sharekte
# Expected: No error messages, shows requests being processed
```

### Test 6: Browser
Open `https://sharekte.com/` in browser:
- [ ] Homepage loads without 404 errors
- [ ] Companies page loads
- [ ] Can navigate between pages (React Router works)
- [ ] No console errors (press F12)
- [ ] SSL certificate is valid (green lock icon)

---

## 🚨 Common Issues & Fixes

### Issue: "SPA index.html not found"
**Cause**: Build didn't complete or files not in correct location

**Fix**:
```bash
cd /var/www/sharekte.com
npm run build
ls -la dist/spa/index.html  # Must exist
pm2 restart sharekte
```

### Issue: Port 8080 already in use
**Cause**: Old process still running

**Fix**:
```bash
lsof -i :8080
kill -9 <PID>
pm2 start ecosystem.config.js
```

### Issue: Nginx 502 Bad Gateway
**Cause**: Node.js app not running or Nginx can't reach it

**Fix**:
```bash
pm2 status  # Check if sharekte is running
curl http://localhost:8080/health  # Test direct
sudo systemctl restart nginx
```

### Issue: SSL certificate not working
**Cause**: Certificate not installed or path wrong

**Fix**:
```bash
sudo certbot certificates  # Check status
sudo certbot renew  # Manually renew
sudo systemctl reload nginx
```

### Issue: Airtable sync not working
**Cause**: API token not set or invalid

**Fix**:
```bash
echo $AIRTABLE_API_TOKEN  # Verify it's set
cat /var/www/sharekte.com/.env | grep AIRTABLE
pm2 restart sharekte  # Reload environment
pm2 logs sharekte | grep -i airtable  # Check logs
```

---

## 📊 Monitor After Deployment

### Daily Health Check
```bash
# SSH to Hostinger
ssh root@srv1092855.hstgr.cloud

# Check status
pm2 status

# Check disk space
df -h

# Check logs for errors
pm2 logs sharekte | grep -i error
```

### Weekly Maintenance
```bash
# Update OS
apt update && apt upgrade -y

# Check certificate renewal
sudo certbot certificates

# Check disk usage
du -sh /var/www/sharekte.com
```

### Monthly Review
```bash
# Backup application
tar -czf /var/backups/sharekte-$(date +%Y%m%d).tar.gz /var/www/sharekte.com

# Review logs for patterns
pm2 logs sharekte --lines 1000 > /tmp/logs.txt

# Monitor memory usage
pm2 monit
```

---

## 📞 Emergency Recovery

### If app crashes completely:

```bash
# 1. SSH to Hostinger
ssh root@srv1092855.hstgr.cloud

# 2. Check what happened
pm2 logs sharekte

# 3. Restart
pm2 restart sharekte

# 4. If still broken, redeploy from GitHub
cd /var/www/sharekte.com
git fetch origin main
git reset --hard origin/main
pnpm install --frozen-lockfile
npm run build
pm2 restart sharekte
```

### If want to revert to previous version:

```bash
# 1. Check git history
cd /var/www/sharekte.com
git log --oneline -10

# 2. Revert to previous commit
git reset --hard <COMMIT_HASH>
npm run build
pm2 restart sharekte
```

---

## ✨ Success Indicators

After deployment, you should see:

1. ✅ Health check returns 200 OK
2. ✅ API endpoints respond correctly
3. ✅ Homepage loads in browser
4. ✅ HTTPS works (green lock icon)
5. ✅ React Router navigation works
6. ✅ No console errors in browser
7. ✅ PM2 shows app as "online"
8. ✅ No error messages in logs

---

## 📝 Checklist Summary

### Before Deployment
- [ ] All files created (ecosystem.config.js, etc.)
- [ ] Local build succeeds
- [ ] dist/spa/ and dist/server/ exist locally

### During Setup
- [ ] All 9 phases of HOSTINGER_SETUP_GUIDE.md completed
- [ ] All verification tests pass
- [ ] Health check works
- [ ] SSL certificate valid

### After Deployment
- [ ] Auto-deploy workflow configured
- [ ] GitHub secrets added
- [ ] Test auto-deploy with push
- [ ] Monitor logs daily

---

## 🎯 You're Ready!

If all checkboxes are ✅, your application is **production-ready** on Hostinger VPS.

**Next Step**: Follow `HOSTINGER_SETUP_GUIDE.md` to execute the setup.

---

**Last Updated**: November 2024
**Status**: ✅ Ready for Production
