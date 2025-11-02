#!/bin/bash
set -e

echo "🚀 Starting Hostinger setup..."

# Navigate to app
cd /var/www/shareket.com

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Step 2: Build the app
echo "🔨 Building app..."
npm run build

# Step 3: Verify build
if [ ! -f "dist/spa/index.html" ]; then
  echo "❌ Build failed! dist/spa/index.html not found"
  exit 1
fi
echo "✅ Build successful"

# Step 4: Update Nginx config
echo "📝 Updating Nginx configuration..."
sudo tee /etc/nginx/sites-available/shareket.com > /dev/null <<'EOF'
server {
    listen 80;
    server_name shareket.com www.shareket.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name shareket.com www.shareket.com;

    ssl_certificate /etc/letsencrypt/live/shareket.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/shareket.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Step 5: Test Nginx
echo "🏥 Testing Nginx configuration..."
sudo nginx -t

# Step 6: Reload Nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

# Step 7: Restart PM2
echo "🔄 Restarting Node.js app..."
pm2 restart shareket || pm2 start ecosystem.config.js

# Step 8: Wait and verify
sleep 3

# Step 9: Test health check
echo "✅ Testing health check..."
if curl -f https://shareket.com/health > /dev/null 2>&1; then
  echo "✅ SUCCESS! Website is now live at https://shareket.com"
  echo ""
  echo "📊 Deployment Summary:"
  echo "  ✅ Dependencies installed"
  echo "  ✅ Build completed (dist/spa/index.html exists)"
  echo "  ✅ Nginx configured and reloaded"
  echo "  ✅ Node.js app running on port 8080"
  echo "  ✅ Server responding to health check"
  echo ""
  echo "🌐 Your website: https://shareket.com"
else
  echo "⚠️ Health check failed. Check logs:"
  echo "pm2 logs shareket"
  exit 1
fi
