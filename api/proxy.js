import http from 'node:http';

const BACKEND_IP = '93.127.186.217';
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

function proxyRequest({ method, path, headers, body }) {
  return new Promise((resolve, reject) => {
    const upstream = http.request(
      {
        hostname: BACKEND_IP,
        port: 80,
        method,
        path,
        headers,
      },
      (response) => {
        const chunks = [];

        response.on('data', (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        response.on('end', () => {
          resolve({
            statusCode: response.statusCode || 502,
            headers: response.headers,
            body: chunks.length ? Buffer.concat(chunks) : Buffer.alloc(0),
          });
        });
      }
    );

    upstream.on('error', reject);

    if (body && body.length) {
      upstream.write(body);
    }

    upstream.end();
  });
}

export default async function handler(req, res) {
  const rawPath = req.query.path;
  const path = Array.isArray(rawPath)
    ? rawPath.join('/')
    : typeof rawPath === 'string'
      ? rawPath.replace(/^\/+/, '')
      : '';

  const originalUrl = new URL(req.url || '/', 'https://www.umunsi.com');
  originalUrl.searchParams.delete('path');
  const search = originalUrl.searchParams.toString();
  const targetPath = `/api${path ? `/${path}` : ''}${search ? `?${search}` : ''}`;

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
      if (['host', 'connection', 'content-length', 'accept-encoding'].includes(lowerKey)) continue;

      headers[key] = Array.isArray(value) ? value.join(', ') : value;
    }

    headers.Host = BACKEND_HOST;
    headers['User-Agent'] = headers['User-Agent'] || headers['user-agent'] || DEFAULT_USER_AGENT;
    headers.Accept = headers.Accept || headers.accept || 'application/json, text/plain, */*';
    headers['Accept-Encoding'] = 'identity';
    headers['X-Forwarded-Proto'] = 'https';
    headers['X-Forwarded-Host'] = req.headers.host || 'www.umunsi.com';
    headers['X-Real-IP'] = clientIp;
    headers['X-Forwarded-For'] = Array.isArray(forwardedFor)
      ? forwardedFor.join(', ')
      : (forwardedFor || clientIp);
    headers.Connection = 'close';

    const method = (req.method || 'GET').toUpperCase();
    let body = null;

    if (!['GET', 'HEAD'].includes(method)) {
      if (Buffer.isBuffer(req.body)) {
        body = req.body;
      } else if (typeof req.body === 'string') {
        body = Buffer.from(req.body);
      } else if (req.body && typeof req.body === 'object') {
        body = Buffer.from(JSON.stringify(req.body));
        headers['Content-Type'] = headers['Content-Type'] || headers['content-type'] || 'application/json';
      } else {
        body = await readRawBody(req);
      }

      if (body) {
        headers['Content-Length'] = body.length;
      }
    }

    const upstreamResponse = await proxyRequest({
      method,
      path: targetPath,
      headers,
      body,
    });

    res.status(upstreamResponse.statusCode);

    for (const [key, value] of Object.entries(upstreamResponse.headers || {})) {
      if (!value) continue;

      const lowerKey = key.toLowerCase();
      if (['connection', 'transfer-encoding', 'keep-alive'].includes(lowerKey)) {
        continue;
      }

      res.setHeader(key, value);
    }

    res.send(upstreamResponse.body);
  } catch (error) {
    res.status(502).json({
      success: false,
      message: 'Backend proxy unavailable',
      error: error instanceof Error ? error.message : String(error || 'Unknown proxy error'),
      targetPath,
    });
  }
}
