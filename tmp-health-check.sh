export PATH=/home/umunsi/.nvm/versions/node/v22.22.2/bin:$PATH
cd /home/umunsi/backend-api
PM2_BIN=/home/umunsi/.nvm/versions/node/v22.22.2/bin/pm2
echo PORT_3000
lsof -i :3000 || true
echo PORT_3001
lsof -i :3001 || true
echo PM2
PM2_HOME=/home/umunsi/.pm2 $PM2_BIN list || true
