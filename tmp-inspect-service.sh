export PATH=/home/umunsi/.nvm/versions/node/v22.22.2/bin:$PATH
cd /home/umunsi/backend-api
PM2_BIN=/home/umunsi/.nvm/versions/node/v22.22.2/bin/pm2
{
  echo ENV_FLAG
  grep '^ENABLE_POST_VIEW_MILESTONE_EMAILS=' .env || true
  echo PM2_LIST
  PM2_HOME=/home/umunsi/.pm2 $PM2_BIN list || true
  echo PORT_3000
  lsof -i :3000 || true
  echo PORT_3001
  lsof -i :3001 || true
} > /tmp/notify-inspect.txt 2>&1
cat /tmp/notify-inspect.txt
