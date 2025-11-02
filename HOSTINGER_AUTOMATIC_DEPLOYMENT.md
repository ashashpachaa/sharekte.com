# Hostinger Automatic Deployment Setup

**Automatic deployment from GitHub to your Hostinger VPS in 5 minutes!**

## 🎯 What You Get

Every time you `git push` to main branch:
1. ✅ GitHub automatically builds your code
2. ✅ Uploads to Hostinger VPS
3. ✅ Restarts PM2 automatically
4. ✅ Site is live within 1-2 minutes

No manual SSH commands needed anymore!

---

## 📋 One-Time Setup (5 minutes)

### Step 1: Generate SSH Key (Run on Your Computer)

```bash
# Generate SSH key for GitHub Actions
ssh-keygen -t rsa -b 4096 -f hostinger_deploy -N ""

# This creates two files:
# - hostinger_deploy (PRIVATE KEY - keep secret!)
# - hostinger_deploy.pub (PUBLIC KEY - add to Hostinger)
```

### Step 2: Add Public Key to Hostinger

```bash
# SSH into your Hostinger VPS
ssh root@72.61.112.139

# Add the public key to authorized_keys
cat >> ~/.ssh/authorized_keys << 'EOF'
[PASTE CONTENT OF hostinger_deploy.pub HERE]
EOF

# Fix permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# Test it works (from your computer)
ssh -i hostinger_deploy root@72.61.112.139 "echo 'SSH works!'"

# Exit Hostinger SSH
exit
```

### Step 3: Add GitHub Secrets

Go to your GitHub repo:
```
https://github.com/ashashpachaa/sharekte.com/settings/secrets/actions
```

Click **"New repository secret"** and add these 5 secrets:

**Secret 1:**
- Name: `HOSTINGER_HOST`
- Value: `72.61.112.139`

**Secret 2:**
- Name: `HOSTINGER_USER`
- Value: `root`

**Secret 3:**
- Name: `HOSTINGER_SSH_KEY`
- Value: (Paste the ENTIRE content of `hostinger_deploy` file - the private key)

**Secret 4:**
- Name: `VITE_AIRTABLE_API_TOKEN`
- Value: (Your Airtable token from .env)

**Secret 5:**
- Name: `AIRTABLE_API_TOKEN`
- Value: (Same as above)

### Step 4: Test It

```bash
# Make a small change and push
echo "# Deployment test" >> README.md
git add README.md
git commit -m "Test automatic deployment"
git push origin main
```

**Watch it deploy:**
1. Go to: https://github.com/ashashpachaa/sharekte.com/actions
2. Click the latest workflow run
3. Watch the "Deploy to Hostinger" step
4. When it says "✅ Deployment complete", visit https://shareket.com
5. You should see your changes live!

---

## 🚀 That's It!

Now every time you push to main, your Hostinger site updates automatically! 

## ✅ Verify It Worked

```bash
# SSH into Hostinger
ssh root@72.61.112.139

# Check PM2 status
pm2 status

# Should show "sharekte" is running and online
# Check logs
pm2 logs sharekte | tail -20

# Exit
exit
```

---

## 📊 How Automatic Deployment Works

```
You push to GitHub main
         ↓
GitHub Actions workflow starts
         ↓
Builds your code (npm run build)
         ↓
Creates dist/ folder
         ↓
Connects to Hostinger via SSH (using private key)
         ↓
Uploads dist/ folder to /var/www/shareket.com
         ↓
Installs dependencies (pnpm install)
         ↓
Restarts PM2 (pm2 restart sharekte)
         ↓
Site is LIVE! 🚀
```

---

## 🔍 Troubleshooting

### "SSH key permission denied"
```bash
# Fix permissions on Hostinger
ssh root@72.61.112.139
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### "Deployment failed - Connection refused"
```bash
# Check if Hostinger firewall allows SSH
ssh -i hostinger_deploy root@72.61.112.139
# If this works, the secret is wrong - check GitHub Secret values
```

### "PM2 not found"
```bash
# SSH to Hostinger and check PM2
ssh root@72.61.112.139
which pm2
pm2 status
```

### "Deployment succeeded but site not updated"
```bash
# SSH to Hostinger and check PM2 logs
ssh root@72.61.112.139
pm2 logs sharekte
# Look for errors
```

### Workflow Failed - Check Logs
1. Go to: https://github.com/ashashpachaa/sharekte.com/actions
2. Click the failed run
3. Click "Deploy to Hostinger" step
4. Read the error message
5. Common issues: Wrong IP, wrong username, SSH key not added to Hostinger

---

## 🎯 Quick Commands

### Deploy manually (if needed)
```bash
# SSH to Hostinger and deploy manually
ssh root@72.61.112.139

cd /var/www/shareket.com
git pull origin main
pnpm install --frozen-lockfile
npm run build
pm2 restart sharekte
pm2 save
```

### Check deployment status
```bash
# View GitHub Actions
https://github.com/ashashpachaa/sharekte.com/actions

# Check Hostinger
ssh root@72.61.112.139
pm2 status
pm2 logs sharekte
```

### Rollback to previous version
```bash
ssh root@72.61.112.139
cd /var/www/shareket.com
git revert HEAD  # or git checkout [commit-hash]
npm run build
pm2 restart sharekte
```

---

## 📝 Workflow File Explanation

The GitHub Actions workflow (`.github/workflows/deploy-hostinger.yml`) does:

1. **Checkout code** - Gets your latest code from GitHub
2. **Setup Node** - Installs Node.js v18
3. **Install pnpm** - Package manager
4. **Install dependencies** - `pnpm install`
5. **Build** - `npm run build` (creates dist/ folder)
6. **Upload files** - Sends dist/ to Hostinger via SCP
7. **Install & restart** - `pnpm install` and `pm2 restart`

All triggered automatically on `git push`!

---

## 🔐 Security Notes

- SSH key is stored securely in GitHub Secrets (encrypted)
- Only admins can see the secrets
- Key is never displayed in logs
- Only used for deployment, nothing else
- Can be rotated anytime (just generate new key, update secret)

---

## ✨ Benefits

✅ **No manual deployments** - Automatic on every push
✅ **Fast** - Deploys in 1-2 minutes
✅ **Reliable** - Uses PM2 to manage restarts
✅ **Secure** - SSH keys encrypted in GitHub
✅ **Traceable** - See every deployment in GitHub Actions
✅ **Rollbackable** - Can revert any deployment

---

## 🎉 You're Done!

**Every `git push` = automatic deployment to shareket.com**

Next time you make changes:
```bash
git add .
git commit -m "Your changes here"
git push origin main
```

Then just wait 1-2 minutes and visit https://shareket.com to see your changes live!

---

## 📞 Need Help?

1. Check GitHub Actions logs: https://github.com/ashashpachaa/shareket.com/actions
2. SSH to Hostinger and check PM2: `pm2 logs sharekte`
3. Make sure all 5 GitHub Secrets are set correctly
4. Make sure SSH key is added to Hostinger ~/.ssh/authorized_keys

---

**Enjoy automatic deployments!** 🚀
