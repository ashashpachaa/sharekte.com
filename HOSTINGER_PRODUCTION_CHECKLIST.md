# Hostinger Production Integration Checklist

This checklist ensures your website works perfectly with Hostinger's PM2 + Nginx + HTTPS setup.

---

## ✅ Critical Environment Variables (MUST SET)

SSH into Hostinger and set these environment variables:

```bash
# 1. Airtable API tokens (for database sync)
export AIRTABLE_API_TOKEN="patLkehZ2xg1wRuKr.59e309fed3a49ecc3bee1f2ade0c8603e30f48887c257fb29998547f7e8e3ded"
export VITE_AIRTABLE_API_TOKEN="patLkehZ2xg1wRuKr.59e309fed3a49ecc3bee1f2ade0c8603e30f48887c257fb29998547f7e8e3ded"

# 2. Production environment
export NODE_ENV="production"

# 3. Server port (Nginx proxies to this)
export PORT="8080"

# 4. Optional: Email configuration (for notifications)
# export EMAIL_HOST="smtp.gmail.com"
# export EMAIL_PORT="587"
# export EMAIL_USER="your-email@gmail.com"
# export EMAIL_PASSWORD="your-app-password"
# export SUPPORT_EMAIL="support@sharekte.com"
```

**Persist these** by adding to `/etc/environment` or `~/.bashrc`:

```bash
echo 'AIRTABLE_API_TOKEN="patLkehZ2xg1wRuKr.59e309fed3a49ecc3bee1f2ade0c8603e30f48887c257fb29998547f7e8e3ded"' | sudo tee -a /etc/environment
echo 'VITE_AIRTABLE_API_TOKEN="patLkehZ2xg1wRuKr.59e309fed3a49ecc3bee1f2ade0c8603e30f48887c257fb29998547f7e8e3ded"' | sudo tee -a /etc/environment
echo 'NODE_ENV="production"' | sudo tee -a /etc/environment
echo 'PORT="8080"' | sudo tee -a /etc/environment
```

Then reload:
```bash
source /etc/environment
```

---

## ✅ PM2 Configuration (for auto-restart)

Create or update `/var/www/sharekte.com/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'sharekte',
      script: './dist/server/node-build.mjs',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
      },
      error_file: '/var/log/sharekte-error.log',
      out_file: '/var/log/sharekte-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M',
      watch: false,
    },
  ],
};
```

**Start with PM2:**
```bash
cd /var/www/sharekte.com
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## ✅ Nginx Configuration (Already Set)

Verify your Nginx config at `/etc/nginx/sites-available/sharekte.com`:

```nginx
server {
    listen 80;
    server_name sharekte.com www.sharekte.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sharekte.com www.sharekte.com;

    ssl_certificate /etc/letsencrypt/live/sharekte.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sharekte.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Test and reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ Critical App Features (MUST VERIFY)

### 1. Health Check Endpoint
- **URL**: `https://sharekte.com/health`
- **Expected Response**: `{ status: "ok", ... }`
- **Purpose**: PM2 and monitoring tools use this
- **Code Location**: `server/index.ts` (line ~95)

Test:
```bash
curl https://sharekte.com/health
```

### 2. API Routes (All Must Work)
These endpoints power your business logic:

| Route | Purpose | Critical |
|-------|---------|----------|
| `GET /api/companies` | List all companies | ✅ YES |
| `POST /api/orders` | Create orders | ✅ YES |
| `GET /api/orders` | List orders | ✅ YES |
| `GET /api/transfer-forms` | List transfer forms | ✅ YES |
| `POST /api/transfer-forms` | Submit transfer forms | ✅ YES |
| `GET /api/invoices` | List invoices | ✅ YES |

Test a critical route:
```bash
curl https://sharekte.com/api/companies
```

### 3. Airtable Sync (Data Persistence)
Your business data syncs to Airtable. If this fails, orders won't be saved!

**Verify:**
1. `AIRTABLE_API_TOKEN` is set correctly
2. Airtable tables exist:
   - `tbl01DTvrGtsAaPfZ` (Orders)
   - `tbljtdHPdHnTberDy` (Companies)
   - `tblK7lUO1cfNFYO14` (Transfer Forms)
3. Test order creation: Place an order, check Airtable

**Code Location**: `server/utils/airtable-sync.ts`

### 4. SPA Routing (React Router)
All React routes should load properly:
- `/` - Homepage
- `/companies` - Companies list
- `/dashboard` - User dashboard
- `/checkout` - Payment page
- `/admin/login` - Admin login
- `/admin/orders` - Admin orders

**Test**: Navigate to each route, should load without 404 errors

### 5. Static Assets (CSS, JS, Images)
- **Built files**: `dist/spa/index.html` + assets
- **Served by**: Nginx (static files)
- **Built by**: `npm run build`

Check if assets loaded:
```bash
ls -la /var/www/sharekte.com/dist/spa/
```

---

## ✅ Production Monitoring

### Check PM2 Status
```bash
pm2 list
pm2 logs sharekte
pm2 monit
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t
```

### View Application Logs
```bash
tail -f /var/log/sharekte-out.log
tail -f /var/log/sharekte-error.log
```

### Check Disk Space
```bash
df -h
du -sh /var/www/sharekte.com
```

---

## ✅ Deployment Process (Every Time You Push)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **GitHub Actions runs** (auto-deploy enabled):
   - Pulls latest code
   - Runs `npm run build`
   - Restarts PM2

3. **Verify deployment**:
   ```bash
   pm2 logs
   curl https://sharekte.com/health
   ```

---

## ✅ Troubleshooting

### Problem: App won't start
```bash
# Check logs
pm2 logs sharekte

# Check port 8080 is free
lsof -i :8080

# Manually test
cd /var/www/sharekte.com
npm start
```

### Problem: 502 Bad Gateway (Nginx error)
```bash
# Check if Node app is running
pm2 list

# Check Nginx config
sudo nginx -t

# Check logs
tail -f /var/log/sharekte-error.log
```

### Problem: Airtable sync failing
```bash
# Check if token is set
echo $AIRTABLE_API_TOKEN

# Check Airtable tables exist
# Go to: https://airtable.com/app0PK34gyJDizR3Q
```

### Problem: CSS/JS not loading
```bash
# Rebuild
cd /var/www/sharekte.com
npm run build

# Check assets exist
ls -la dist/spa/
```

---

## ✅ Database (Airtable)

Your data lives in Airtable. Hostinger only runs the app code.

**Airtable Base**: `app0PK34gyJDizR3Q`

**Tables**:
- **Orders**: `tbl01DTvrGtsAaPfZ`
  - Fields: Order ID, Customer Name, Company Name, Status, Amount, etc.
  
- **Companies**: `tbljtdHPdHnTberDy`
  - Fields: Company name, Company number, Country, Price, Status, etc.
  
- **Transfer Forms**: `tblK7lUO1cfNFYO14`
  - Fields: Order Number, Company Name, Status, Shareholder info, etc.

**Important**: 
- DO NOT delete tables or change field names
- Field names are case-sensitive
- Status field is named "Statues " (with trailing space) in Companies table

---

## ✅ SSL Certificate (Already Active)

Your HTTPS is auto-renewed by Let's Encrypt.

**Check certificate**:
```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

Certificate location:
- `/etc/letsencrypt/live/sharekte.com/fullchain.pem`
- `/etc/letsencrypt/live/sharekte.com/privkey.pem`

---

## ✅ Backup & Recovery

**Backup your code** (already on GitHub):
```bash
git remote -v
# Should show: github.com:ashashpachaa/sharekte.com.git
```

**Restore from GitHub**:
```bash
cd /var/www/sharekte.com
git fetch origin main
git reset --hard origin/main
npm run build
pm2 restart sharekte
```

---

## ✅ Performance Tips

1. **Enable Gzip compression** in Nginx:
   ```nginx
   gzip on;
   gzip_types text/plain text/css application/json application/javascript;
   ```

2. **Cache static assets** (browser cache):
   ```nginx
   location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
       expires 30d;
   }
   ```

3. **Monitor memory**:
   ```bash
   pm2 monit
   free -h
   ```

4. **Scale if needed** (future):
   ```javascript
   instances: 'max', // Use all CPU cores
   exec_mode: 'cluster',
   ```

---

## 📞 Support Resources

- **Hostinger Support**: Ask them for any VPS issues
- **PM2 Docs**: https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/
- **Nginx Docs**: https://nginx.org/en/docs/
- **Airtable API**: https://airtable.com/api

---

**Last Updated**: November 2024
**Status**: ✅ Production Ready
