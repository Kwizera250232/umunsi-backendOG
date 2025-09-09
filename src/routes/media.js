const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  upload,
  getMediaFiles,
  getMediaFile,
  uploadMediaFiles,
  updateMediaFile,
  deleteMediaFile,
  deleteMediaFiles,
  getMediaStats
} = require('../controllers/mediaController');

// All routes require authentication
router.use(authenticateToken);

// GET /api/media - Get all media files with pagination and filtering
router.get('/', getMediaFiles);

// GET /api/media/stats - Get media statistics
router.get('/stats', getMediaStats);

// POST /api/media/upload - Upload multiple media files
router.post('/upload', upload.array('files', 10), uploadMediaFiles);

// DELETE /api/media/bulk-delete - Delete multiple media files (must come before /:id routes)
router.delete('/bulk-delete', deleteMediaFiles);

// GET /api/media/:id - Get single media file
router.get('/:id', getMediaFile);

// PUT /api/media/:id - Update media file metadata
router.put('/:id', updateMediaFile);

// DELETE /api/media/:id - Delete single media file
router.delete('/:id', deleteMediaFile);

module.exports = router;
