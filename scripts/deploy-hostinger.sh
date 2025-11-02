#!/bin/bash

# Deploy script for Hostinger VPS
# Run this script manually or via webhook to deploy the application

set -e

APP_DIR="/var/www/sharekte.com"
LOG_FILE="/var/log/sharekte-deploy.log"
GITHUB_REPO="https://github.com/ashashpachaa/sharekte.com.git"
BRANCH="main"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting deployment to Hostinger VPS${NC}"
echo "Repository: $GITHUB_REPO"
echo "Branch: $BRANCH"
echo "Directory: $APP_DIR"
echo "Time: $(date)" | tee -a "$LOG_FILE"

# Step 1: Navigate to app directory
echo -e "${YELLOW}📁 Navigating to app directory...${NC}"
if [ ! -d "$APP_DIR" ]; then
  echo -e "${YELLOW}📥 Directory not found, cloning repository...${NC}"
  mkdir -p "$(dirname "$APP_DIR")"
  git clone -b "$BRANCH" "$GITHUB_REPO" "$APP_DIR"
else
  cd "$APP_DIR"
  echo -e "${GREEN}✅ Directory exists${NC}"
fi

# Step 2: Pull latest code
cd "$APP_DIR"
echo -e "${YELLOW}📥 Pulling latest code from GitHub...${NC}"
git fetch origin "$BRANCH" 2>&1 | tee -a "$LOG_FILE"
git reset --hard "origin/$BRANCH" 2>&1 | tee -a "$LOG_FILE"
echo -e "${GREEN}✅ Code pulled successfully${NC}"

# Step 3: Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install -g pnpm 2>&1 | tee -a "$LOG_FILE"
pnpm install --frozen-lockfile 2>&1 | tee -a "$LOG_FILE"
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 4: Build application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build 2>&1 | tee -a "$LOG_FILE"
echo -e "${GREEN}✅ Build completed${NC}"

# Step 5: Stop old server
echo -e "${YELLOW}🛑 Stopping old server...${NC}"
pkill -f "node dist/server/node-build.mjs" || true
sleep 2
echo -e "${GREEN}✅ Old server stopped${NC}"

# Step 6: Start new server
echo -e "${YELLOW}🚀 Starting new server...${NC}"
nohup npm start > "$LOG_FILE" 2>&1 &
SERVER_PID=$!
sleep 3

# Step 7: Health check
echo -e "${YELLOW}🏥 Performing health check...${NC}"
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Server is running and healthy!${NC}"
  echo -e "${GREEN}✅ Deployment successful!${NC}"
  echo ""
  echo -e "${GREEN}📊 Deployment Summary:${NC}"
  echo "  Repository: $GITHUB_REPO"
  echo "  Branch: $BRANCH"
  echo "  Directory: $APP_DIR"
  echo "  Server PID: $SERVER_PID"
  echo "  URL: http://localhost:8080"
  echo "  Health: http://localhost:8080/health"
  echo "  Logs: $LOG_FILE"
else
  echo -e "${RED}❌ Health check failed!${NC}"
  echo -e "${RED}❌ Deployment failed!${NC}"
  cat "$LOG_FILE"
  exit 1
fi
