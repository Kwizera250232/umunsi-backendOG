const express = require('express');
const router = express.Router();
const { authenticateToken, requireEditor, requireAdmin } = require('../middleware/auth');
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  deletePosts,
  getPostStats
} = require('../controllers/postsController');

// All routes require authentication
router.use(authenticateToken);

// GET /api/posts - Get all posts with pagination and filtering
router.get('/', getPosts);

// GET /api/posts/stats - Get post statistics
router.get('/stats', getPostStats);

// GET /api/posts/:id - Get single post
router.get('/:id', getPost);

// POST /api/posts - Create new post (requires EDITOR role or higher)
router.post('/', requireEditor, createPost);

// PUT /api/posts/:id - Update post (requires EDITOR role or higher)
router.put('/:id', requireEditor, updatePost);

// DELETE /api/posts/bulk-delete - Delete multiple posts (requires EDITOR role or higher)
router.delete('/bulk-delete', requireEditor, deletePosts);

// DELETE /api/posts/:id - Delete single post (requires EDITOR role or higher)
router.delete('/:id', requireEditor, deletePost);

module.exports = router;
