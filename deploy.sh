#!/bin/bash

# Umunsi Backend Deployment Script for Cloudpanel VPS
# Run this script on your VPS to deploy the backend

set -e

echo "🚀 Starting Umunsi Backend Deployment..."

# Variables
APP_DIR="/home/umunsi/htdocs/umunsi.com"
REPO_URL="https://github.com/Kwizera250232/umunsi-backendOG.git"
BRANCH="main"

# Step 1: Clone/Pull Repository
echo "📦 Setting up repository..."
if [ -d "$APP_DIR/.git" ]; then
    echo "Repository exists, pulling latest changes..."
    cd "$APP_DIR"
    git pull origin $BRANCH
else
    echo "Cloning repository..."
    git clone -b $BRANCH $REPO_URL "$APP_DIR"
    cd "$APP_DIR"
fi

# Step 2: Install Dependencies
echo "📚 Installing dependencies..."
npm install --production

# Step 3: Setup Environment
echo "⚙️ Setting up environment..."
if [ ! -f "$APP_DIR/.env" ]; then
    echo "Creating .env file from .env.production..."
    cp .env.production .env
    echo "⚠️  Update .env with your actual database credentials!"
else
    echo ".env file already exists"
fi

# Step 4: Setup Database
echo "🗄️ Setting up database..."
npx prisma generate
npx prisma db push --skip-generate

# Step 5: Create logs directory
echo "📋 Creating logs directory..."
mkdir -p "$APP_DIR/logs"
chmod 755 "$APP_DIR/logs"

# Step 6: Install/Update PM2
echo "🔄 Setting up PM2..."
npm install -g pm2
pm2 install pm2-logrotate

# Step 7: Start Application
echo "▶️  Starting application..."
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

echo "✅ Deployment complete!"
echo ""
echo "📍 Backend is running at: https://umunsi.com"
echo "🔍 To monitor: pm2 monit"
echo "📊 To view logs: pm2 logs"
echo "🔧 To restart: pm2 restart umunsi-backend"
