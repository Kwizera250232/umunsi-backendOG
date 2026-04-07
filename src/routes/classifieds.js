const express = require('express');
const { body, query, validationResult } = require('express-validator');
const prisma = require('../database/prisma');
const { authenticateToken, optionalAuth, requireEditor } = require('../middleware/auth');

const router = express.Router();

const CATEGORIES = ['cyamunara', 'akazi', 'guhinduza', 'ibindi'];
const STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

const toResponse = (ad) => ({
  id: ad.id,
  userId: ad.userId,
  userName: `${ad.user?.firstName || ''} ${ad.user?.lastName || ''}`.trim() || ad.user?.username || 'User',
  userEmail: ad.user?.email || ad.email,
  category: ad.category,
  title: ad.title,
  description: ad.description,
  phone: ad.phone,
  email: ad.email,
  attachmentName: ad.attachmentName,
  attachmentUrl: ad.attachmentUrl,
  durationDays: ad.durationDays,
  priceRwf: ad.priceRwf,
  status: ad.status,
  reviewNote: ad.reviewNote,
  createdAt: ad.createdAt,
  updatedAt: ad.updatedAt
});

// Public list (defaults to approved only)
router.get('/', optionalAuth, [
  query('category').optional().isIn(CATEGORIES),
  query('status').optional().isIn(STATUSES)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    }

    const { category, status } = req.query;
    const canSeeAllStatuses = req.user && ['ADMIN', 'EDITOR'].includes(req.user.role);

    const where = {
      ...(category ? { category } : {}),
      ...(status ? { status } : canSeeAllStatuses ? {} : { status: 'APPROVED' })
    };

    const ads = await prisma.classifiedAd.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 100
    });

    return res.json({
      success: true,
      data: ads.map(toResponse)
    });
  } catch (error) {
    console.error('List classifieds error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch classifieds' });
  }
});

// User submissions
router.get('/mine', authenticateToken, async (req, res) => {
  try {
    const ads = await prisma.classifiedAd.findMany({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: ads.map(toResponse) });
  } catch (error) {
    console.error('List my classifieds error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch your classifieds' });
  }
});

// Admin/editor all submissions
router.get('/all', authenticateToken, requireEditor, async (req, res) => {
  try {
    const ads = await prisma.classifiedAd.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 300
    });

    return res.json({ success: true, data: ads.map(toResponse) });
  } catch (error) {
    console.error('List all classifieds error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch classifieds' });
  }
});

// Submit a new ad
router.post('/', authenticateToken, [
  body('category').isIn(CATEGORIES),
  body('title').trim().isLength({ min: 3, max: 180 }),
  body('description').trim().isLength({ min: 6, max: 3000 }),
  body('phone').trim().isLength({ min: 6, max: 40 }),
  body('email').isEmail(),
  body('durationDays').isInt({ min: 1, max: 365 }),
  body('priceRwf').isInt({ min: 0 }),
  body('attachmentName').optional({ nullable: true }).isString().isLength({ max: 200 }),
  body('attachmentUrl').optional({ nullable: true }).isString().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    }

    const input = req.body;
    const ad = await prisma.classifiedAd.create({
      data: {
        userId: req.user.id,
        category: input.category,
        title: input.title,
        description: input.description,
        phone: input.phone,
        email: input.email,
        attachmentName: input.attachmentName || null,
        attachmentUrl: input.attachmentUrl || null,
        durationDays: Number(input.durationDays),
        priceRwf: Number(input.priceRwf),
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Itangazo ryoherejwe. Riri pending review.',
      data: toResponse(ad)
    });
  } catch (error) {
    console.error('Submit classified error:', error);
    return res.status(500).json({ success: false, error: 'Failed to submit classified ad' });
  }
});

// Admin/editor moderation
router.patch('/:id/status', authenticateToken, requireEditor, [
  body('status').isIn(['APPROVED', 'REJECTED']),
  body('reviewNote').optional({ nullable: true }).isString().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    }

    const { id } = req.params;
    const { status, reviewNote } = req.body;

    const updated = await prisma.classifiedAd.update({
      where: { id },
      data: {
        status,
        reviewNote: reviewNote || null,
        reviewedById: req.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return res.json({
      success: true,
      message: status === 'APPROVED' ? 'Itangazo ryemejwe.' : 'Itangazo ryanze.',
      data: toResponse(updated)
    });
  } catch (error) {
    console.error('Moderate classified error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update classified status' });
  }
});

// Broadcasts
router.get('/broadcasts/list', optionalAuth, async (req, res) => {
  try {
    const broadcasts = await prisma.classifiedBroadcast.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        createdBy: {
          select: {
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return res.json({
      success: true,
      data: broadcasts.map((b) => ({
        id: b.id,
        message: b.message,
        createdAt: b.createdAt,
        createdBy: `${b.createdBy?.firstName || ''} ${b.createdBy?.lastName || ''}`.trim() || b.createdBy?.username || 'Admin'
      }))
    });
  } catch (error) {
    console.error('List classifieds broadcasts error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch broadcasts' });
  }
});

router.post('/broadcasts', authenticateToken, requireEditor, [
  body('message').trim().isLength({ min: 3, max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    }

    const created = await prisma.classifiedBroadcast.create({
      data: {
        message: req.body.message,
        createdById: req.user.id
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Ubutumwa bwoherejwe ku bakoresha bose.',
      data: {
        id: created.id,
        message: created.message,
        createdAt: created.createdAt,
        createdBy: req.user.username
      }
    });
  } catch (error) {
    console.error('Create classifieds broadcast error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create broadcast' });
  }
});

module.exports = router;
