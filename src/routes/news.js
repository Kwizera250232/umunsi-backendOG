const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const { authenticateToken, requireAuthor } = require('../middleware/auth');
const newsController = require('../controllers/newsController');

// Custom middleware to handle multipart requests
const handleMultipartRequest = (req, res, next) => {
  // Check if this is a multipart request
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    // For FormData requests, use multer directly
    upload.single('image')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: 'File too large',
            details: 'Image file size must be less than 5MB'
          });
        }
        return res.status(400).json({
          error: 'File upload error',
          details: err.message
        });
      } else if (err) {
        return res.status(400).json({
          error: 'File validation error',
          details: err.message
        });
      }
      next();
    });
  } else {
    // For JSON requests, skip multer and go directly to validation
    next();
  }
};

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Default to regular articles directory
    let baseDir = 'uploads/articles/regular/';
    
    // Try to determine destination based on article type if available
    try {
      if (req.body && req.body.isFeatured === 'true') {
        baseDir = 'uploads/articles/featured/';
      } else if (req.body && req.body.isBreaking === 'true') {
        baseDir = 'uploads/articles/breaking/';
      } else if (req.body && req.body.isTrending === 'true') {
        baseDir = 'uploads/articles/trending/';
      }
    } catch (error) {
      // If there's any error, default to regular directory
      baseDir = 'uploads/articles/regular/';
    }
    
    cb(null, baseDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Validation middleware
const validateNews = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
  body('slug').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Slug must be between 1 and 200 characters'),
  body('content').trim().isLength({ min: 1 }).withMessage('Content is required'),
  body('excerpt').optional().trim().isLength({ max: 500 }).withMessage('Excerpt must be less than 500 characters'),
  body('categoryId').optional().isLength({ min: 1 }).withMessage('Category ID is required'),
  body('status').optional().isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'DELETED']).withMessage('Invalid status'),
  body('isFeatured').optional().custom((value) => {
    if (value === 'true' || value === 'false' || typeof value === 'boolean') {
      return true;
    }
    throw new Error('isFeatured must be a boolean');
  }).withMessage('isFeatured must be a boolean'),
  body('isBreaking').optional().custom((value) => {
    if (value === 'true' || value === 'false' || typeof value === 'boolean') {
      return true;
    }
    throw new Error('isBreaking must be a boolean');
  }).withMessage('isBreaking must be a boolean'),
  body('isTrending').optional().custom((value) => {
    if (value === 'true' || value === 'false' || typeof value === 'boolean') {
      return true;
    }
    throw new Error('isTrending must be a boolean');
  }).withMessage('isTrending must be a boolean')
];

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Public routes
router.get('/', newsController.getAllNews);
router.get('/featured', newsController.getFeaturedNews);
router.get('/breaking', newsController.getBreakingNews);
router.get('/trending', newsController.getTrendingNews);
router.get('/author/:authorId', newsController.getNewsByAuthor);
router.get('/:id', newsController.getNewsById);

// Protected routes (requires authentication)
router.post('/', 
  authenticateToken, 
  requireAuthor, 
  handleMultipartRequest,
  validateNews, 
  handleValidationErrors,
  newsController.createNews
);

router.put('/:id', 
  authenticateToken, 
  requireAuthor, 
  handleMultipartRequest,
  validateNews, 
  handleValidationErrors,
  newsController.updateNews
);

router.delete('/:id', 
  authenticateToken, 
  requireAuthor, 
  newsController.deleteNews
);

router.patch('/:id/like', 
  authenticateToken, 
  newsController.likeNews
);

module.exports = router;
