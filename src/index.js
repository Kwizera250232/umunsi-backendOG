const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
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

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5003;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false, // Disable CSP in development to avoid blocking resources
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'],
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

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsing middleware - Handle JSON and URL-encoded data (skip for multipart)
app.use((req, res, next) => {
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

// Static files with CORS headers
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for static files
  res.header('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' 
    ? 'https://yourdomain.com' 
    : 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
}, express.static('uploads'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: 'connected'
  });
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

// 404 handler
app.use('*', (req, res) => {
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
