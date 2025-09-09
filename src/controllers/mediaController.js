const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/media');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit (for videos, documents can be up to 10MB)
  },
  fileFilter: (req, file, cb) => {
    // Check file size based on type
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    const isDocument = file.mimetype === 'application/pdf' || 
                      file.mimetype.startsWith('text/') || 
                      file.mimetype === 'application/json' || 
                      file.mimetype === 'application/xml' ||
                      file.mimetype.includes('document');
    
    if (isImage && file.size > 3 * 1024 * 1024) { // 3MB for images
      return cb(new Error('Image file size cannot exceed 3MB'), false);
    }
    
    if (isVideo && file.size > 20 * 1024 * 1024) { // 20MB for videos
      return cb(new Error('Video file size cannot exceed 20MB'), false);
    }
    
    if (isDocument && file.size > 10 * 1024 * 1024) { // 10MB for documents
      return cb(new Error('Document file size cannot exceed 10MB'), false);
    }
    
    cb(null, true);
  }
});

// Helper function to get file category based on MIME type
const getFileCategory = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'images';
  if (mimeType.startsWith('video/')) return 'videos';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'documents';
  return 'other';
};

// Helper function to generate thumbnail for images
const generateThumbnail = async (filePath, filename) => {
  try {
    const thumbnailDir = path.join(path.dirname(filePath), 'thumbnails');
    await fs.mkdir(thumbnailDir, { recursive: true });
    
    const thumbnailPath = path.join(thumbnailDir, `thumb_${filename}`);
    
    await sharp(filePath)
      .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    
    return thumbnailPath;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
};

// Get all media files
const getMediaFiles = async (req, res) => {
  try {
    const { page = 1, limit = 50, category, search, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (type) {
      where.mimeType = { startsWith: type };
    }
    
    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    const [mediaFiles, total] = await Promise.all([
      prisma.mediaFile.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      prisma.mediaFile.count({ where })
    ]);

    res.json({
      success: true,
      media: mediaFiles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching media files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch media files'
    });
  }
};

// Get single media file
const getMediaFile = async (req, res) => {
  try {
    const { id } = req.params;

    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!mediaFile) {
      return res.status(404).json({
        success: false,
        error: 'Media file not found'
      });
    }

    res.json({
      success: true,
      ...mediaFile
    });
  } catch (error) {
    console.error('Error fetching media file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch media file'
    });
  }
};

// Upload media files
const uploadMediaFiles = async (req, res) => {
  try {
    console.log('📁 Upload request received');
    console.log('📁 Content-Type:', req.headers['content-type']);
    console.log('📁 Files:', req.files ? req.files.length : 'No files');
    console.log('📁 Body keys:', Object.keys(req.body || {}));
    
    if (!req.files || req.files.length === 0) {
      console.log('❌ No files in request');
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const uploadedFiles = [];
    const userId = req.user.id;

    for (const file of req.files) {
      const category = getFileCategory(file.mimetype);
      let thumbnailUrl = null;

      // Generate thumbnail for images
      if (file.mimetype.startsWith('image/')) {
        const thumbnailPath = await generateThumbnail(file.path, file.filename);
        if (thumbnailPath) {
          thumbnailUrl = `/uploads/media/thumbnails/thumb_${file.filename}`;
        }
      }

      const mediaFile = await prisma.mediaFile.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: `/uploads/media/${file.filename}`,
          thumbnailUrl,
          category,
          tags: [],
          description: '',
          uploadedById: userId,
          isPublic: true,
          isFeatured: false
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      uploadedFiles.push(mediaFile);
    }

    res.json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      media: uploadedFiles
    });
  } catch (error) {
    console.error('Error uploading media files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload media files'
    });
  }
};

// Update media file
const updateMediaFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, tags, isPublic, isFeatured, category } = req.body;

    const mediaFile = await prisma.mediaFile.update({
      where: { id },
      data: {
        description,
        tags: Array.isArray(tags) ? tags : [],
        isPublic: isPublic === 'true' || isPublic === true,
        isFeatured: isFeatured === 'true' || isFeatured === true,
        category
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Media file updated successfully',
      ...mediaFile
    });
  } catch (error) {
    console.error('Error updating media file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update media file'
    });
  }
};

// Delete single media file
const deleteMediaFile = async (req, res) => {
  try {
    const { id } = req.params;

    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id }
    });

    if (!mediaFile) {
      return res.status(404).json({
        success: false,
        error: 'Media file not found'
      });
    }

    // Delete physical files
    try {
      const filePath = path.join(__dirname, '../../uploads/media', mediaFile.filename);
      await fs.unlink(filePath);

      if (mediaFile.thumbnailUrl) {
        const thumbnailPath = path.join(__dirname, '../../uploads/media/thumbnails', `thumb_${mediaFile.filename}`);
        await fs.unlink(thumbnailPath);
      }
    } catch (fileError) {
      console.error('Error deleting physical files:', fileError);
    }

    // Delete from database
    await prisma.mediaFile.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Media file deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting media file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete media file'
    });
  }
};

// Bulk delete media files
const deleteMediaFiles = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No file IDs provided'
      });
    }

    const mediaFiles = await prisma.mediaFile.findMany({
      where: { id: { in: ids } }
    });

    // Delete physical files
    for (const mediaFile of mediaFiles) {
      try {
        const filePath = path.join(__dirname, '../../uploads/media', mediaFile.filename);
        await fs.unlink(filePath);

        if (mediaFile.thumbnailUrl) {
          const thumbnailPath = path.join(__dirname, '../../uploads/media/thumbnails', `thumb_${mediaFile.filename}`);
          await fs.unlink(thumbnailPath);
        }
      } catch (fileError) {
        console.error('Error deleting physical files:', fileError);
      }
    }

    // Delete from database
    await prisma.mediaFile.deleteMany({
      where: { id: { in: ids } }
    });

    res.json({
      success: true,
      message: `${ids.length} file(s) deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting media files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete media files'
    });
  }
};

// Get media statistics
const getMediaStats = async (req, res) => {
  try {
    const [totalFiles, imagesCount, videosCount, documentsCount, audioCount] = await Promise.all([
      prisma.mediaFile.count(),
      prisma.mediaFile.count({ where: { category: 'images' } }),
      prisma.mediaFile.count({ where: { category: 'videos' } }),
      prisma.mediaFile.count({ where: { category: 'documents' } }),
      prisma.mediaFile.count({ where: { category: 'audio' } })
    ]);

    const totalSize = await prisma.mediaFile.aggregate({
      _sum: { size: true }
    });

    res.json({
      success: true,
      stats: {
        totalFiles,
        imagesCount,
        videosCount,
        documentsCount,
        audioCount,
        totalSize: totalSize._sum.size || 0
      }
    });
  } catch (error) {
    console.error('Error fetching media stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch media statistics'
    });
  }
};

module.exports = {
  upload,
  getMediaFiles,
  getMediaFile,
  uploadMediaFiles,
  updateMediaFile,
  deleteMediaFile,
  deleteMediaFiles,
  getMediaStats
};
