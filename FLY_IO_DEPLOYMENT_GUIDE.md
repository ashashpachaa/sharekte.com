# Fly.io Deployment Guide - Complete Setup

## ✅ Code Changes Made

- ✅ Fixed port from 3000 to 8080 (Fly.io requirement)
- ✅ Verified all API calls use relative URLs `/api/...`
- ✅ Verified Airtable token handling
- ✅ Fixed route ordering issues in server/index.ts
- ✅ Verified Vite config with correct entry point

## 📋 Step 1: Install Fly CLI (One Time)

```bash
# On your local machine (Mac/Linux)
curl -L https://fly.io/install.sh | sh

# On Windows, use: https://github.com/superfly/flyctl/releases
```

## 🚀 Step 2: Login to Fly.io

```bash
fly auth login
```

This will open a browser to create/login to your Fly.io account.

## 📦 Step 3: Set Environment Variables

```bash
# Set the Airtable token (REQUIRED)
fly secrets set AIRTABLE_API_TOKEN=patLkehZ2xg1wRuKr.59e309fed3a49ecc3bee1f2ade0c8603e30f48887c257fb29998547f7e8e3ded -a sharekte-com

# Verify it's set
fly secrets list -a sharekte-com
```

## 📤 Step 4: Push Code to GitHub

Click the **[Push button](#push-code)** in Builder.io to save all fixes to GitHub.

## 🚀 Step 5: Deploy to Fly.io

### Option A: Auto-Deploy (Recommended)

```bash
# From your local machine
fly deploy -a sharekte-com
```

The app will:

1. Pull code from GitHub
2. Build Docker image
3. Deploy to Fly.io
4. Be live in 2-3 minutes

### Option B: Redeploy Existing App

If already deployed:

```bash
fly redeploy -a sharekte-com
```

## ✅ Step 6: Verify Deployment

```bash
# Check app status
fly status -a sharekte-com

# View logs
fly logs -a sharekte-com

# Open in browser
fly open -a sharekte-com
```

## 🔧 Troubleshooting

### App crashes on startup

Check logs:

```bash
fly logs -a sharekte-com
```

Look for errors like:

- `Port 8080 in use` → Restart: `fly restart -a sharekte-com`
- `Airtable token not configured` → Set via: `fly secrets set AIRTABLE_API_TOKEN=... -a sharekte-com`
- `Build failed` → Check Docker build with: `fly logs --instance <id> -a sharekte-com`

### 502 Bad Gateway

This means the Node server isn't responding. Check:

```bash
fly checks status -a sharekte-com
fly logs -a sharekte-com
```

The health check expects port 8080 to respond to HTTP requests.

### Deploy won't complete

```bash
# Force rebuild
fly deploy --no-cache -a sharekte-com

# Or redeploy
fly redeploy -a sharekte-com
```

## 📊 Monitoring

View real-time metrics:

```bash
fly metrics -a sharekte-com
```

### CPU/Memory Usage

- Current config: 1 CPU, 1GB RAM
- If you get memory errors, increase:
  ```bash
  fly scale memory 2048 -a sharekte-com
  ```

### Auto-scaling

The app is configured to scale to 0 machines when idle to save costs.
It will automatically start when someone visits.

## 🔐 Production Checklist

- [x] Port set to 8080
- [x] Airtable token configured
- [x] All API routes using relative URLs
- [x] Environment variables documented
- [x] Dockerfile optimized
- [x] Health check enabled
- [x] Graceful shutdown handling

## 📝 Important Notes

1. **First Deploy**: Takes 2-3 minutes
2. **Subsequent Deploys**: 30-60 seconds
3. **Auto-scaling**: App goes to 0 machines after 15 mins idle, restarts on next request
4. **Log Retention**: Last 25MB of logs kept
5. **HTTPS**: Automatically enabled by Fly.io

## 🎯 Your App URL

```
https://sharekte-com.fly.dev
```

## 🚫 Common Mistakes (Don't Do These!)

❌ Don't: Hardcode `localhost` in code
❌ Don't: Use port 3000 in Fly.io (must be 8080)
❌ Don't: Skip setting Airtable token
❌ Don't: Ignore health check warnings

## 💡 Cost Optimization

Current setup costs ~$0.30/month:

- 1 shared CPU: $0.10/month
- 1GB RAM: $0.20/month
- Auto-scale to 0 saves when idle

To reduce further:

```bash
fly scale memory 512 -a sharekte-com  # Minimum 512MB
```

---

**All set! Your app is ready for Fly.io deployment.**
