const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const authController = require('../controllers/authController');
const prisma = require('../database/prisma');

const router = express.Router();

// Configure multer for avatar uploads
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Validation middleware
const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Must be a valid email address'),
  body('password').isLength({ min: 1 }).withMessage('Password is required')
];

const validateRegister = [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Must be a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().isLength({ min: 1, max: 100 }).withMessage('First name must be between 1 and 100 characters'),
  body('lastName').trim().isLength({ min: 1, max: 100 }).withMessage('Last name must be between 1 and 100 characters'),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters')
];

const validateProfileUpdate = [
  body('firstName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('First name must be between 1 and 100 characters'),
  body('lastName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Last name must be between 1 and 100 characters'),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters')
];

const validatePasswordChange = [
  body('currentPassword').isLength({ min: 1 }).withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
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
router.post('/login', 
  validateLogin, 
  handleValidationErrors,
  authController.login
);

router.post('/register', 
  validateRegister, 
  handleValidationErrors,
  authController.register
);

// Protected routes
router.get('/me', 
  authenticateToken, 
  authController.getProfile
);

router.put('/profile', 
  authenticateToken, 
  validateProfileUpdate, 
  handleValidationErrors,
  authController.updateProfile
);

// Upload avatar
router.post('/avatar', authenticateToken, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Update user's avatar in database
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        isActive: true
      }
    });

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar: avatarUrl,
      user: updatedUser
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload avatar'
    });
  }
});

router.put('/change-password', 
  authenticateToken, 
  validatePasswordChange, 
  handleValidationErrors,
  authController.changePassword
);

router.post('/refresh', 
  authenticateToken, 
  authController.refreshToken
);

router.post('/logout', 
  authenticateToken, 
  authController.logout
);

module.exports = router;
