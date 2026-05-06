set -e
export PATH=/home/umunsi/.nvm/versions/node/v22.22.2/bin:$PATH
cd /home/umunsi/backend-api
PM2_BIN=/home/umunsi/.nvm/versions/node/v22.22.2/bin/pm2
OUT=/tmp/fix-live-port-result.txt
{
  echo BEFORE_3000
  lsof -i :3000 || true
  echo BEFORE_3001
  lsof -i :3001 || true
  PM2_PID=$(PM2_HOME=/home/umunsi/.pm2 $PM2_BIN pid umunsi-backend || true)
  echo PM2_PID=$PM2_PID
  OLD_PID=$(lsof -ti :3000 || true)
  echo OLD_PID=$OLD_PID
  if [ -n "$OLD_PID" ] && [ "$OLD_PID" != "$PM2_PID" ]; then
    kill $OLD_PID || true
    echo KILLED_OLD_PID=$OLD_PID
  fi
  PM2_HOME=/home/umunsi/.pm2 $PM2_BIN restart umunsi-backend --update-env >/dev/null
  echo AFTER_3000
  lsof -i :3000 || true
  echo AFTER_3001
  lsof -i :3001 || true
  echo HEALTH
  curl -s http://127.0.0.1:3000/api/health || true
} > "$OUT" 2>&1
cat "$OUT"
