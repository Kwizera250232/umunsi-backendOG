const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

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
