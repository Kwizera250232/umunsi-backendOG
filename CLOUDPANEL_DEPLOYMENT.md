# Umunsi Backend - Cloudpanel VPS Deployment Guide

## VPS Information
- **Domain**: umunsi.com
- **Root Directory**: /home/umunsi/htdocs/umunsi.com
- **Site User**: umunsi
- **Node.js Version**: Node 22 LTS
- **App Port**: 3000
- **GitHub Repository**: https://github.com/Kwizera250232/umunsi-backendOG

---

## Step 1: Connect to Your VPS via SSH

```bash
ssh umunsi@umunsi.com
# or use your VPS IP address
ssh umunsi@YOUR_VPS_IP
```

---

## Step 2: Navigate to Root Directory

```bash
cd /home/umunsi/htdocs/umunsi.com
```

---

## Step 3: Clone the Backend Repository

```bash
git clone https://github.com/Kwizera250232/umunsi-backendOG.git
cd umunsi-backendOG
```

---

## Step 4: Install Dependencies

```bash
npm install
```

---

## Step 5: Set Up PostgreSQL Database

First, check if PostgreSQL is installed:
```bash
psql --version
```

If not installed, use Cloudpanel to install PostgreSQL via the UI or run:
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

### Create Database and User:

```bash
sudo -u postgres psql
```

Inside PostgreSQL CLI:
```sql
CREATE DATABASE umunsi_db;
CREATE USER umunsi_com_user WITH PASSWORD 'strong_password_here';
ALTER ROLE umunsi_com_user SET client_encoding TO 'utf8';
ALTER ROLE umunsi_com_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE umunsi_com_user SET default_transaction_deferrable TO on;
ALTER ROLE umunsi_com_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE umunsi_db TO umunsi_com_user;
\q
```

---

## Step 6: Configure Environment Variables

Create a `.env` file in your backend directory:

```bash
nano /home/umunsi/htdocs/umunsi.com/umunsi-backendOG/.env
```

Add the following (update with your actual values):

```env
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL="postgresql://umunsi_com_user:strong_password_here@localhost:5432/umunsi_db?schema=umunsi"

# JWT Secret (change this to a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345

# Frontend URL (for CORS)
FRONTEND_URL=https://umunsi-chi.vercel.app

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# File Uploads
UPLOAD_DIR=/home/umunsi/htdocs/umunsi.com/umunsi-backendOG/uploads
MAX_FILE_SIZE=50000000
```

Save with: `CTRL+X`, then `Y`, then `Enter`

---

## Step 7: Run Prisma Migrations

```bash
cd /home/umunsi/htdocs/umunsi.com/umunsi-backendOG
npx prisma migrate deploy
npx prisma db seed
```

---

## Step 8: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

---

## Step 9: Start App with PM2

```bash
pm2 start src/index.js --name "umunsi-backend" --env production
pm2 save
pm2 startup
```

Verify it's running:
```bash
pm2 list
pm2 logs umunsi-backend
```

---

## Step 10: Configure Nginx Reverse Proxy

Cloudpanel should automatically handle Nginx configuration. Verify the config exists:

```bash
sudo nano /etc/nginx/sites-available/umunsi.com
```

Make sure it includes a proxy to port 3000:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name umunsi.com www.umunsi.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Test and reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 11: Enable SSL/HTTPS

Cloudpanel includes LetsEncrypt integration. In Cloudpanel UI:
1. Go to your site: umunsi.com
2. Enable "AutoSSL"
3. Or use: `certbot renew`

---

## Step 12: Update Frontend API URL

Your frontend needs to point to your new backend. Go to your frontend project and update:

**File**: `src/services/api.ts`

Change:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

To:
```typescript
const API_BASE_URL = 'https://umunsi.com/api';
```

Or update `.env` in your frontend:
```
VITE_API_URL=https://umunsi.com/api
```

Then rebuild and redeploy to Vercel:
```bash
npm run build
npx vercel --prod
```

---

## Step 13: Verify Deployment

Test your API:
```bash
curl https://umunsi.com/api/health
```

You should get a response from your backend.

---

## Troubleshooting

### Check logs:
```bash
pm2 logs umunsi-backend
tail -f /var/log/nginx/error.log
```

### Restart app:
```bash
pm2 restart umunsi-backend
```

### Check port is listening:
```bash
lsof -i :3000
```

### Check database connection:
```bash
psql -U umunsi_com_user -d umunsi_db -c "SELECT 1;"
```

---

## Additional Commands

### View PM2 logs:
```bash
pm2 logs umunsi-backend --tail 100
```

### Reload PM2 app:
```bash
pm2 reload umunsi-backend
```

### Stop app:
```bash
pm2 stop umunsi-backend
```

### Delete app from PM2:
```bash
pm2 delete umunsi-backend
```

---

## Maintenance

### Update backend from GitHub:
```bash
cd /home/umunsi/htdocs/umunsi.com/umunsi-backendOG
git pull origin main
npm install
pm2 restart umunsi-backend
```

### Backup database:
```bash
pg_dump -U umunsi_com_user umunsi_db > umunsi_db_backup.sql
```

### Restore database:
```bash
psql -U umunsi_com_user umunsi_db < umunsi_db_backup.sql
```

---

## Full Deployment URLs

- **Frontend**: https://umunsi-chi.vercel.app
- **Backend API**: https://umunsi.com/api
- **Domain**: https://umunsi.com

---

That's it! Your backend should now be running on your Cloudpanel VPS!
