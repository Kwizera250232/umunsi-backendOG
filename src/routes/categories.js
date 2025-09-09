const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');

const router = express.Router();

// Validation middleware
const validateCategory = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Color must be a valid hex color'),
  body('icon').optional().trim().isLength({ max: 10 }).withMessage('Icon must be less than 10 characters'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
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
router.get('/', categoryController.getAllCategories);
router.get('/stats', categoryController.getCategoryStats);
router.get('/:id', categoryController.getCategoryById);

// Protected routes (admin/editor only)
router.post('/', 
  authenticateToken, 
  requireAdmin, 
  validateCategory, 
  handleValidationErrors,
  categoryController.createCategory
);

router.put('/:id', 
  authenticateToken, 
  requireAdmin, 
  validateCategory, 
  handleValidationErrors,
  categoryController.updateCategory
);

router.delete('/:id', 
  authenticateToken, 
  requireAdmin, 
  categoryController.deleteCategory
);

module.exports = router;
