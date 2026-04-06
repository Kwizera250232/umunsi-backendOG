#!/bin/bash
# Hostinger Cloudpanel Deployment Script
# Run this on your VPS: bash /tmp/deploy-umunsi.sh

set -e
echo "🚀 Starting Umunsi Backend Deployment to Hostinger..."

SITE_DIR="/home/umunsi/htdocs/umunsi.com"
REPO_URL="https://github.com/Kwizera250232/umunsi-backendOG.git"

# Step 1: Prepare Directory
echo "📁 Preparing site directory..."
cd $SITE_DIR
rm -rf * .git* .gitignore 2>/dev/null || true

# Step 2: Clone Repository
echo "📦 Cloning backend repository..."
git clone $REPO_URL . --branch main --depth 1

# Step 3: Install Dependencies
echo "📚 Installing Node.js dependencies..."
npm install --production --omit=dev

# Step 4: Setup Environment
echo "⚙️ Setting up environment variables..."
if [ ! -f "$SITE_DIR/.env" ]; then
    cp .env.production .env
    echo "⚠️  IMPORTANT: Update .env with your actual database credentials!"
    echo "    Edit: nano .env"
else
    echo "✅ .env file already exists"
fi

# Step 5: Setup Prisma
echo "🗄️ Generating Prisma client..."
npx prisma generate

echo "📊 Pushing database schema..."
npx prisma db push --skip-generate

# Step 6: Create Logs Directory
echo "📋 Creating logs directory..."
mkdir -p $SITE_DIR/logs
chmod 755 $SITE_DIR/logs

# Step 7: Install PM2 Globally
echo "🔄 Installing PM2 process manager..."
npm install -g pm2

# Step 8: Start Application
echo "▶️  Starting application with PM2..."
pm2 delete umunsi-backend 2>/dev/null || true
pm2 start ecosystem.config.js --name umunsi-backend --env production

# Step 9: Save PM2 Configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Step 10: Setup PM2 Startup
echo "🔧 Configuring PM2 startup..."
pm2 startup -u umunsi --hp /home/umunsi
pm2 save

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "📍 Your Backend URL: https://umunsi.com"
echo "📊 Monitor with: pm2 monit"
echo "📋 View logs: pm2 logs umunsi-backend"
echo "🔄 Restart app: pm2 restart umunsi-backend"
echo ""
echo "🎉 Backend is now running on Hostinger!"
