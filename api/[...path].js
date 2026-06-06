const BACKEND_BASE_URL = 'http://93.127.186.217';
const BACKEND_HOST = 'api.umunsi.com';
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36';

async function readRawBody(req) {
  return await new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    req.on('end', () => {
      resolve(chunks.length ? Buffer.concat(chunks) : null);
    });

    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  const path = Array.isArray(req.query.path) ? req.query.path.join('/') : (req.query.path || '');
  const queryIndex = (req.url || '').indexOf('?');
  const search = queryIndex >= 0 ? req.url.slice(queryIndex) : '';
  const targetUrl = `${BACKEND_BASE_URL}/api/${path}${search}`;

  try {
    const forwardedFor = req.headers['x-forwarded-for'];
    const clientIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : req.socket?.remoteAddress || '';

    const headers = {};

    for (const [key, value] of Object.entries(req.headers)) {
      if (!value) continue;

      const lowerKey = key.toLowerCase();
      if (['host', 'connection', 'content-length'].includes(lowerKey)) continue;

      headers[key] = Array.isArray(value) ? value.join(', ') : value;
    }

    headers.Host = BACKEND_HOST;
    headers['User-Agent'] = headers['User-Agent'] || headers['user-agent'] || DEFAULT_USER_AGENT;
    headers.Accept = headers.Accept || headers.accept || 'application/json, text/plain, */*';
    headers['X-Forwarded-Proto'] = 'https';
    headers['X-Forwarded-Host'] = req.headers.host || 'www.umunsi.com';
    headers['X-Real-IP'] = clientIp;
    headers['X-Forwarded-For'] = Array.isArray(forwardedFor)
      ? forwardedFor.join(', ')
      : (forwardedFor || clientIp);

    const method = (req.method || 'GET').toUpperCase();
    const requestInit = {
      method,
      headers,
      redirect: 'manual',
    };

    if (!['GET', 'HEAD'].includes(method)) {
      let body = null;

      if (Buffer.isBuffer(req.body)) {
        body = req.body;
      } else if (typeof req.body === 'string') {
        body = req.body;
      } else if (req.body && typeof req.body === 'object') {
        body = JSON.stringify(req.body);
        headers['Content-Type'] = headers['Content-Type'] || headers['content-type'] || 'application/json';
      } else {
        body = await readRawBody(req);
      }

      if (body) {
        requestInit.body = body;
      }
    }

    const upstreamResponse = await fetch(targetUrl, requestInit);
    const responseBuffer = Buffer.from(await upstreamResponse.arrayBuffer());

    res.status(upstreamResponse.status);

    upstreamResponse.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (['connection', 'content-encoding', 'transfer-encoding', 'keep-alive'].includes(lowerKey)) {
        return;
      }

      if (lowerKey === 'set-cookie') {
        const existing = res.getHeader('set-cookie');
        if (!existing) {
          res.setHeader('set-cookie', value);
        }
        return;
      }

      res.setHeader(key, value);
    });

    res.send(responseBuffer);
  } catch (error) {
    res.status(502).json({
      success: false,
      message: 'Backend proxy unavailable',
      error: error instanceof Error ? error.message : String(error || 'Unknown proxy error'),
      targetUrl,
    });
  }
}
