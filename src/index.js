const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const newsRoutes = require('./routes/news');
const categoryRoutes = require('./routes/categories');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');
const mediaRoutes = require('./routes/media');
const postsRoutes = require('./routes/posts');
const paymentsRoutes = require('./routes/payments');
const classifiedsRoutes = require('./routes/classifieds');
const { DEFAULT_MESSAGE, getMaintenanceState } = require('./utils/maintenance');
const { getAdsBannersState } = require('./utils/adsBanners');

const app = express();
const prisma = new PrismaClient();
const PORT = parseInt(process.env.PORT || '3000', 10);
const frontendBuildPath = path.join(__dirname, '../public');
const uploadsPath = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../uploads'));

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const stripHtml = (value = '') => String(value)
  .replace(/<[^>]*>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const buildAbsoluteUrl = (req, rawPath = '') => {
  if (!rawPath) return '';
  if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) return rawPath;
  const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  return `${req.protocol}://${req.get('host')}${normalizedPath}`;
};

const buildMetaTags = (req, post) => {
  const safeTitle = escapeHtml(post.metaTitle || post.title || 'Umunsi Website');
  const descriptionSource = post.metaDescription || post.excerpt || stripHtml(post.content || '');
  const safeDescription = escapeHtml((descriptionSource || '').slice(0, 280));
  const imageUrl = buildAbsoluteUrl(req, post.featuredImage || '/images/logo.png');
  const safeImageUrl = escapeHtml(imageUrl);
  const safeImageType = escapeHtml(post.featuredImage && post.featuredImage.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
  const canonicalUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const safeCanonicalUrl = escapeHtml(canonicalUrl);

  return `
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Umunsi" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:image" content="${safeImageUrl}" />
    <meta property="og:image:secure_url" content="${safeImageUrl}" />
    <meta property="og:image:type" content="${safeImageType}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${safeCanonicalUrl}" />
    <meta property="og:locale" content="rw_RW" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${safeImageUrl}" />
    <link rel="canonical" href="${safeCanonicalUrl}" />
  `;
};

const injectArticleMeta = (html, metaTags) => {
  if (!html || !metaTags) return html;

  const patternsToRemove = [
    /<meta\s+property="og:[^"]*"[^>]*>\s*/gi,
    /<meta\s+name="twitter:[^"]*"[^>]*>\s*/gi,
    /<link\s+rel="canonical"[^>]*>\s*/gi
  ];

  let cleanedHtml = html;
  patternsToRemove.forEach((pattern) => {
    cleanedHtml = cleanedHtml.replace(pattern, '');
  });

  if (cleanedHtml.includes('</head>')) {
    return cleanedHtml.replace('</head>', `${metaTags}\n  </head>`);
  }

  return `${metaTags}${cleanedHtml}`;
};

const trustedBotSignatures = [
  'googlebot',
  'adsbot-google',
  'googleother',
  'google-inspectiontool',
  'apis-google',
  'bingbot',
  'duckduckbot',
  'slurp',
  'baiduspider',
  'yandexbot'
];

const blockedBotSignatures = [
  'sqlmap',
  'nikto',
  'acunetix',
  'nmap',
  'masscan',
  'gobuster',
  'dirbuster',
  'python-requests',
  'httpclient',
  'curl/',
  'wget/',
  'scrapy',
  'zgrab'
];

const isTrustedBot = (userAgent = '') => {
  const normalized = userAgent.toLowerCase();
  return trustedBotSignatures.some((signature) => normalized.includes(signature));
};

// Required when running behind Nginx/Cloudpanel reverse proxy
app.set('trust proxy', 1);

const configuredOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const productionOrigins = Array.from(new Set([
  ...configuredOrigins,
  'https://umunsi.com',
  'https://www.umunsi.com'
]));

const devOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
];

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false, // Disable CSP in development to avoid blocking resources
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? productionOrigins
    : devOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || (process.env.NODE_ENV === 'development' ? 1 * 60 * 1000 : 15 * 60 * 1000), // 1 min in dev, 15 min in prod
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'development' ? 1000 : 100), // 1000 requests per minute in dev, 100 per 15 min in prod
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and static files
    return req.path === '/api/health' || req.path.startsWith('/uploads/');
  }
});
app.use('/api/', limiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS) || 20,
  message: {
    error: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isTrustedBot(req.headers['user-agent'] || ''),
});
app.use('/api/auth/login', loginLimiter);

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.REGISTER_RATE_LIMIT_MAX_REQUESTS) || 40,
  message: {
    error: 'Too many signup attempts. Please wait a few minutes and try again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isTrustedBot(req.headers['user-agent'] || ''),
});
app.use('/api/auth/register', registerLimiter);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsing middleware - Handle JSON and URL-encoded data (skip for multipart)
app.use((req, res, next) => {
  const userAgent = (req.headers['user-agent'] || '').toString();
  const requestPath = (req.path || '').toLowerCase();

  // Block common attack scanners and script clients while allowing known good bots.
  if (!isTrustedBot(userAgent)) {
    const normalizedUA = userAgent.toLowerCase();
    const isBlockedSignature = blockedBotSignatures.some((signature) => normalizedUA.includes(signature));
    const isSuspiciousPath = [
      '/wp-admin',
      '/wp-login',
      '/xmlrpc.php',
      '/phpmyadmin',
      '/.env',
      '/.git'
    ].some((pathPart) => requestPath.includes(pathPart));

    if (isBlockedSignature || isSuspiciousPath) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Automated access denied'
      });
    }

    // Require a real user-agent for sensitive API endpoints.
    if (!userAgent.trim() && (requestPath.startsWith('/api/auth') || requestPath.startsWith('/api/admin'))) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'User-Agent required'
      });
    }
  }

  // Skip body parsing for multipart requests
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    return next();
  }
  // Parse JSON and URL-encoded data for non-multipart requests
  express.json({ limit: '10mb' })(req, res, next);
});

app.use((req, res, next) => {
  // Skip body parsing for multipart requests
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    return next();
  }
  // Parse URL-encoded data for non-multipart requests
  express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
});

const uploadsStaticMiddleware = [
  (req, res, next) => {
    const requestOrigin = req.headers.origin;
    const preferredFrontendOrigin = process.env.FRONTEND_URL || configuredOrigins[0] || 'https://umunsi-chi.vercel.app';
    const staticOrigin = process.env.NODE_ENV === 'production'
      ? ((requestOrigin && productionOrigins.includes(requestOrigin)) ? requestOrigin : preferredFrontendOrigin)
      : 'http://localhost:5173';

    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Origin', staticOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
  },
  express.static(uploadsPath, {
    fallthrough: false,
    index: false,
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0
  })
];

// Serve uploads both directly and through /api/uploads so production proxies can reach the files.
app.use('/uploads', ...uploadsStaticMiddleware);
app.use('/api/uploads', ...uploadsStaticMiddleware);

// Maintenance mode middleware with admin bypass
app.use(async (req, res, next) => {
  const state = getMaintenanceState();
  if (!state.enabled) return next();

  const requestPath = req.path || '/';
  const isApiRoute = requestPath.startsWith('/api');

  // Always allow minimal operational endpoints
  const publicApiAllowList = ['/api/health', '/api/auth/login', '/api/payments/kpay/webhook'];
  if (publicApiAllowList.some((prefix) => requestPath.startsWith(prefix))) {
    return next();
  }

  // Allow admin area and login page access so admin can still enter the app shell
  const publicPageAllowList = ['/admin', '/login', '/assets', '/favicon', '/uploads'];
  if (!isApiRoute && publicPageAllowList.some((prefix) => requestPath.startsWith(prefix))) {
    return next();
  }

  // Admin bypass for authenticated API requests
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { role: true, isActive: true },
      });

      if (user && user.isActive && user.role === 'ADMIN') {
        return next();
      }
    } catch (error) {
      // Invalid token falls through to maintenance response
    }
  }

  if (isApiRoute) {
    return res.status(503).json({
      success: false,
      error: 'Maintenance Mode',
      message: state.message || DEFAULT_MESSAGE,
    });
  }

  const maintenanceHtml = `<!doctype html>
<html lang="rw">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Maintenance</title>
    <style>
      body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0e11;color:#f5f5f5;font-family:Arial,sans-serif}
      .box{max-width:680px;padding:36px;border:1px solid #2b2f36;border-radius:14px;background:#181a20;text-align:center}
      h1{margin:0 0 12px;font-size:28px;color:#fcd535}
      p{margin:0;font-size:20px;line-height:1.5;color:#e5e7eb}
    </style>
  </head>
  <body>
    <div class="box">
      <h1>Umunsi</h1>
      <p>${(state.message || DEFAULT_MESSAGE).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
    </div>
  </body>
</html>`;

  return res.status(503).send(maintenanceHtml);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: 'connected'
  });
});

// Base API endpoint for quick connectivity checks
app.get(['/api', '/api/'], (req, res) => {
  res.json({
    success: true,
    message: 'Umunsi API is running',
    health: '/api/health'
  });
});

// Public ads banner settings for frontend rendering
app.get('/api/ads-banners', (req, res) => {
  try {
    const state = getAdsBannersState();
    res.json({ success: true, ...state });
  } catch (error) {
    console.error('Error fetching public ads banners:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ads banners'
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/classifieds', classifiedsRoutes);

// Dynamic metadata for article sharing previews
app.get(['/post/:slug', '/article/:id'], async (req, res, next) => {
  try {
    const identifier = req.params.slug || req.params.id;
    if (!identifier) {
      return next();
    }

    let post = await prisma.post.findUnique({
      where: { slug: identifier },
      select: {
        title: true,
        content: true,
        excerpt: true,
        featuredImage: true,
        metaTitle: true,
        metaDescription: true
      }
    });

    if (!post) {
      post = await prisma.post.findUnique({
        where: { id: identifier },
        select: {
          title: true,
          content: true,
          excerpt: true,
          featuredImage: true,
          metaTitle: true,
          metaDescription: true
        }
      });
    }

    const indexHtmlPath = path.join(frontendBuildPath, 'index.html');

    if (!post) {
      const notFoundHtml = await fs.promises.readFile(indexHtmlPath, 'utf8');
      return res.status(404).send(notFoundHtml);
    }

    const indexHtml = await fs.promises.readFile(indexHtmlPath, 'utf8');
    const metaTags = buildMetaTags(req, post);
    const htmlWithMeta = injectArticleMeta(indexHtml, metaTags);

    return res.status(200).send(htmlWithMeta);
  } catch (error) {
    console.error('❌ Error generating article meta preview:', error.message);
    return next();
  }
});

// Serve frontend static files from Hostinger for non-API routes
app.use(express.static(frontendBuildPath));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Global error handler:', err.message);
  console.error('❌ Error stack:', err.stack);
  
  // Handle JSON parsing errors (FormData sent to JSON parser)
  if (err instanceof SyntaxError && err.message.includes('Unexpected token')) {
    return res.status(400).json({
      error: 'Invalid Request Format',
      details: 'The request format is not supported. Please use the correct content type.',
      message: 'For file uploads, use multipart/form-data. For JSON data, use application/json.'
    });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token or no token provided'
    });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler (API only). Non-API routes fallback to frontend app.
app.use('*', (req, res) => {
  if (!req.originalUrl.startsWith('/api')) {
    return res.sendFile(path.join(frontendBuildPath, 'index.html'));
  }

  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// Database connection and server startup
async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Function to try different ports
    const tryPort = (port) => {
      return new Promise((resolve, reject) => {
        const server = app.listen(port, () => {
          console.log(`🚀 Server running on port ${port}`);
          console.log(`📊 Environment: ${process.env.NODE_ENV}`);
          console.log(`🔗 Health check: http://localhost:${port}/api/health`);
          resolve(server);
        });
        
        server.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            console.log(`⚠️  Port ${port} is busy, trying port ${port + 1}...`);
            server.close();
            reject(error);
          } else {
            reject(error);
          }
        });
      });
    };
    
    // Try ports starting from the configured port
    let currentPort = PORT;
    let server;
    
    while (!server && currentPort < PORT + 10) {
      try {
        server = await tryPort(currentPort);
      } catch (error) {
        if (error.code === 'EADDRINUSE') {
          currentPort++;
        } else {
          throw error;
        }
      }
    }
    
    if (!server) {
      throw new Error(`Could not find an available port between ${PORT} and ${PORT + 9}`);
    }
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
