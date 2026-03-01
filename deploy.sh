#!/bin/bash
# Songer deploy script
# Builds the frontend locally, pushes to GitHub, then pulls and restarts on the VPS.
#
# CONFIGURE THESE for your VPS:
VPS_HOST="h.eino.us"
APP_DIR="/var/www/songer"   # path on VPS where the repo lives

set -e

echo "==> Building frontend..."
npm run build

echo "==> Pushing to GitHub..."
git push origin master

echo "==> Deploying to VPS..."
ssh "$VPS_HOST" "cd $APP_DIR && git pull && npm install --omit=dev && pm2 restart songer"

echo "==> Deploy complete."
echo "    Verify at: https://h.eino.us/theyellow/songer/"
