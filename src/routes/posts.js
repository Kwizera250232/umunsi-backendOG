const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth, requireEditor, requireAdmin } = require('../middleware/auth');
const {
  getPosts,
  getPost,
  getPremiumDashboard,
  createPost,
  updatePost,
  deletePost,
  deletePosts,
  getPostStats
} = require('../controllers/postsController');

// Public routes (no authentication required)
// GET /api/posts - Get all posts with pagination and filtering
router.get('/', optionalAuth, getPosts);

// GET /api/posts/stats - Get post statistics (public for displaying counts)
router.get('/stats', optionalAuth, getPostStats);

// GET /api/posts/premium-dashboard - Premium posts with per-user access flags
router.get('/premium-dashboard', authenticateToken, getPremiumDashboard);

// GET /api/posts/:id - Get single post
router.get('/:id', optionalAuth, getPost);

// Protected routes (require authentication)
// POST /api/posts - Create new post (requires EDITOR role or higher)
router.post('/', authenticateToken, requireEditor, createPost);

// PUT /api/posts/:id - Update post (requires EDITOR role or higher)
router.put('/:id', authenticateToken, requireEditor, updatePost);

// DELETE /api/posts/bulk-delete - Delete multiple posts (requires EDITOR role or higher)
router.delete('/bulk-delete', authenticateToken, requireEditor, deletePosts);

// DELETE /api/posts/:id - Delete single post (requires EDITOR role or higher)
router.delete('/:id', authenticateToken, requireEditor, deletePost);

module.exports = router;
