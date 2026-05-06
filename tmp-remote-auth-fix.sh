#!/bin/sh
set -e
cd /home/umunsi/backend-api
npm install --omit=dev
npx prisma generate
npx prisma db push --skip-generate
PM2_HOME=/home/umunsi/.pm2 pm2 restart umunsi-backend --update-env
PM2_HOME=/home/umunsi/.pm2 pm2 save
echo BACKEND_DEPLOY_OK
