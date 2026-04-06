# Umunsi Frontend Deployment to Vercel
# This script automates the entire deployment process

Write-Host "🚀 Starting Umunsi Frontend Deployment to Vercel..." -ForegroundColor Cyan

# Step 1: Build the project
Write-Host "`n📦 Building the project..." -ForegroundColor Yellow
cd "c:\Users\POSITIVO\UMUNSI WEBSITE\Umunsi"
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully" -ForegroundColor Green

# Step 2: Install Vercel CLI globally
Write-Host "`n🔧 Installing Vercel CLI..." -ForegroundColor Yellow
npm install -g vercel --force

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Vercel CLI installation encountered issues, but continuing..." -ForegroundColor Yellow
}

# Step 3: Deploy to Vercel
Write-Host "`n🌍 Deploying to Vercel..." -ForegroundColor Yellow
Write-Host "You will be prompted to:" -ForegroundColor Cyan
Write-Host "1. Authenticate with your Vercel account (if not logged in)"
Write-Host "2. Confirm the project settings"
Write-Host "`nRun this command:" -ForegroundColor Green
Write-Host "cd 'c:\Users\POSITIVO\UMUNSI WEBSITE\Umunsi'; vercel --prod" -ForegroundColor White

# Automatically run vercel command
vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deployment successful! Your app is now live on Vercel." -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Deployment command completed. Check the output above for details." -ForegroundColor Yellow
}
