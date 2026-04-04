const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin, requireEditor } = require('../middleware/auth');
const userController = require('../controllers/userController');

const router = express.Router();

// Validation middleware
const validateUser = [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Must be a valid email address'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().isLength({ min: 1, max: 100 }).withMessage('First name must be between 1 and 100 characters'),
  body('lastName').trim().isLength({ min: 1, max: 100 }).withMessage('Last name must be between 1 and 100 characters'),
  body('role').optional().isIn(['ADMIN', 'EDITOR', 'AUTHOR']).withMessage('Role must be ADMIN, EDITOR, or AUTHOR'),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

const validatePasswordUpdate = [
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

// Public routes (if any)
// Note: User registration and login are handled in auth routes

// Protected routes
router.get('/', 
  authenticateToken, 
  requireEditor, 
  userController.getAllUsers
);

router.get('/stats', 
  authenticateToken, 
  requireEditor, 
  userController.getUserStats
);

router.get('/:id', 
  authenticateToken, 
  userController.getUserById
);

router.post('/', 
  authenticateToken, 
  requireAdmin, 
  validateUser, 
  handleValidationErrors,
  userController.createUser
);

router.put('/:id', 
  authenticateToken, 
  validateUser, 
  handleValidationErrors,
  userController.updateUser
);

router.delete('/:id', 
  authenticateToken, 
  requireAdmin, 
  userController.deleteUser
);

router.patch('/:id/password', 
  authenticateToken, 
  validatePasswordUpdate, 
  handleValidationErrors,
  userController.updatePassword
);

module.exports = router;
