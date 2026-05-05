#!/usr/bin/env node
/**
 * GitHub Webhook Deploy Server
 * Listens for GitHub push events and runs git pull + pm2 restart
 * Runs on port 9000 — add a GitHub webhook pointing to:
 *   http://93.127.186.217:9000/deploy
 *   Secret: umunsi-deploy-2026
 */

const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');

const PORT = 9000;
const SECRET = process.env.WEBHOOK_SECRET || 'umunsi-deploy-2026';
const APP_DIR = '/home/umunsi/htdocs/umunsi.com';

function verify(secret, payload, signature) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/deploy') {
    res.writeHead(404);
    return res.end('Not found');
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    const sig = req.headers['x-hub-signature-256'] || '';
    if (!verify(SECRET, body, sig)) {
      console.log('[webhook] Invalid signature — rejected');
      res.writeHead(401);
      return res.end('Unauthorized');
    }

    let event;
    try { event = JSON.parse(body); } catch { event = {}; }
    if (event.ref && event.ref !== 'refs/heads/main') {
      res.writeHead(200);
      return res.end('Ignored non-main branch');
    }

    console.log('[webhook] Valid push to main — deploying...');
    res.writeHead(200);
    res.end('Deploying...');

    const cmd = `cd ${APP_DIR} && git pull origin main && npm install --production --omit=dev 2>/dev/null || true && pm2 restart umunsi-backend 2>/dev/null || pm2 start ecosystem.config.js --env production && pm2 save`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error('[webhook] Deploy error:', stderr || err.message);
      } else {
        console.log('[webhook] Deploy success:', stdout.slice(-200));
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`[webhook] Listening on port ${PORT} — POST /deploy`);
});
