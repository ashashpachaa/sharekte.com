# Hostinger VPS Deployment Guide

This guide explains how to set up automatic deployment from GitHub to your Hostinger VPS.

## Setup Overview

Your app will:

1. **Push code to GitHub** → GitHub Actions triggers automatically
2. **GitHub connects to Hostinger VPS via SSH** → Pulls latest code
3. **Installs dependencies & builds** → Restarts the server
4. **Deployment complete** → App is live

---

## Prerequisites

✅ **Hostinger VPS Details** (already have):

- IP: `72.61.112.139`
- Hostname: `srv1092855.hstgr.cloud`
- SSH User: `root`
- SSH Port: `22`
- Web Dir: `/var/www/sharekte.com`

✅ **GitHub Repository**:

- Repo: `ashashpachaa/sharekte.com`
- Branch: `main`

✅ **SSH Key**:

- Already generated with: `SHA256:aZ2Mr+DrFqioGmbgmL0tGY/pAShyWuK6DvqmSG2Jdoo`

---

## Step 1: Clone Repository on Hostinger VPS

SSH into your Hostinger VPS:

```bash
ssh root@srv1092855.hstgr.cloud
```

Then run:

```bash
# Navigate to web directory
mkdir -p /var/www
cd /var/www

# Clone your repository
git clone https://github.com/ashashpachaa/sharekte.com.git sharekte.com
cd sharekte.com

# Install Node.js packages
npm install -g pnpm
pnpm install --frozen-lockfile

# Build the application
npm run build

# Start the server
npm start
```

The server should start on port 8080. Once it's running, you can exit with `Ctrl+C` (we'll use the script for auto-restart).

---

## Step 2: Get Your SSH Private Key

You need to add your SSH private key to GitHub so GitHub Actions can deploy.

**On your local machine**, if you have the private key:

```bash
# Show the private key content (copy this)
cat ~/.ssh/id_rsa
# or
cat ~/.ssh/id_ed25519
```

**If you don't have the private key yet**, ask Hostinger to:

- Generate a new SSH key pair
- Provide you the private key
- Or use password authentication instead

---

## Step 3: Add SSH Key to GitHub Secrets

1. Go to your GitHub repository: `https://github.com/ashashpachaa/sharekte.com`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add these 3 secrets:

| Secret Name         | Value                          |
| ------------------- | ------------------------------ |
| `HOSTINGER_HOST`    | `srv1092855.hstgr.cloud`       |
| `HOSTINGER_USER`    | `root`                         |
| `HOSTINGER_PORT`    | `22`                           |
| `HOSTINGER_SSH_KEY` | _Your private SSH key content_ |

**Important**: The `HOSTINGER_SSH_KEY` value should be your private key (the one that starts with `-----BEGIN RSA PRIVATE KEY-----` or similar).

---

## Step 4: Push Code to GitHub

The deployment workflow file has already been created at `.github/workflows/deploy-hostinger.yml`.

Just push your code to GitHub:

```bash
git add .
git commit -m "Add Hostinger VPS deployment"
git push origin main
```

GitHub Actions will automatically trigger and deploy to your Hostinger VPS!

---

## Step 5: Check Deployment Status

1. Go to your GitHub repository
2. Click **Actions** tab
3. You'll see the deployment workflow running
4. Click on it to see real-time logs

If successful, you'll see:

```
✅ Deploy successful! Server is running.
```

---

## Manual Deployment (Optional)

If you want to deploy manually without pushing to GitHub, SSH into Hostinger and run:

```bash
bash /var/www/sharekte.com/scripts/deploy-hostinger.sh
```

---

## Environment Variables

Make sure these are set on your Hostinger VPS:

```bash
export AIRTABLE_API_TOKEN="your-token-here"
export VITE_AIRTABLE_API_TOKEN="your-token-here"
export NODE_ENV="production"
export PORT="8080"
```

Add these to `/etc/environment` or `.env` in `/var/www/shareket.com`.

---

## Troubleshooting

### 1. **Deployment fails with permission error**

Check SSH key permissions on Hostinger:

```bash
chmod 600 ~/.ssh/id_rsa
chmod 700 ~/.ssh
```

### 2. **Port 8080 already in use**

Kill the old process:

```bash
pkill -f "node dist/server/node-build.mjs"
```

### 3. **Health check fails**

Check logs:

```bash
tail -f /var/log/shareket-deploy.log
```

### 4. **GitHub Actions can't connect to VPS**

Verify SSH credentials:

```bash
# Test SSH connection locally
ssh -i your-private-key root@srv1092855.hstgr.cloud
```

---

## Accessing Your App

- **Homepage**: http://72.61.112.139:8080
- **Health Check**: http://72.61.112.139:8080/health
- **API**: http://72.61.112.139:8080/api

---

## Next Steps

1. ✅ Push code to GitHub (triggers auto-deploy)
2. ✅ Monitor deployment in GitHub Actions
3. ✅ Test your app on Hostinger
4. ✅ Set up domain/DNS if needed
5. ✅ Configure HTTPS with Let's Encrypt

---

## Support

If you encounter issues:

- Check GitHub Actions logs for error messages
- SSH into Hostinger and check `/var/log/shareket-deploy.log`
- Verify environment variables are set correctly
- Ensure Node.js 22+ is installed on Hostinger

---

**Last Updated**: November 2024
