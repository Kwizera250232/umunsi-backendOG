const express = require('express');
const { body, validationResult, query } = require('express-validator');
const prisma = require('../database/prisma');
const { authenticateToken, requireAdmin, requireEditor } = require('../middleware/auth');
const { DEFAULT_MESSAGE, getMaintenanceState, setMaintenanceState } = require('../utils/maintenance');
const { getAdsBannersState, setAdsBannersState } = require('../utils/adsBanners');
const { getTodayViews, getDailyViews } = require('../utils/viewStats');

const router = express.Router();

const normalizeFullName = (firstName = '', lastName = '') =>
  `${firstName} ${lastName}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

// ==================== ADS BANNERS ====================

router.get('/ads-banners', authenticateToken, requireEditor, async (req, res) => {
  try {
    const state = getAdsBannersState();
    return res.json({ success: true, ...state });
  } catch (error) {
    console.error('Ads banners status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch ads banners settings'
    });
  }
});

router.put('/ads-banners', authenticateToken, requireEditor, [
  body('slots').isObject().withMessage('slots must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const state = setAdsBannersState({
      slots: req.body.slots || {}
    });

    return res.json({
      success: true,
      message: 'Ads banners settings updated successfully',
      ...state
    });
  } catch (error) {
    console.error('Ads banners update error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update ads banners settings'
    });
  }
});

// ==================== MAINTENANCE MODE ====================

router.get('/maintenance', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const state = getMaintenanceState();
    return res.json({ success: true, ...state });
  } catch (error) {
    console.error('Maintenance status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch maintenance status'
    });
  }
});

router.put('/maintenance', authenticateToken, requireAdmin, [
  body('enabled').isBoolean().withMessage('enabled must be boolean'),
  body('message').optional().isString().isLength({ min: 3, max: 300 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const state = setMaintenanceState({
      enabled: req.body.enabled,
      message: req.body.message || DEFAULT_MESSAGE,
    });

    return res.json({
      success: true,
      message: `Maintenance mode ${state.enabled ? 'enabled' : 'disabled'} successfully`,
      ...state
    });
  } catch (error) {
    console.error('Maintenance update error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update maintenance status'
    });
  }
});

// ==================== DASHBOARD OVERVIEW ====================

// Get dashboard overview statistics
router.get('/dashboard', authenticateToken, requireEditor, async (req, res) => {
  try {
    // Get real data from database - using Post model (not News)
    const [
      totalUsers,
      totalCategories,
      totalMedia,
      totalPosts,
      viewsAndLikes,
      recentPosts,
      recentUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.mediaFile.count(),
      prisma.post.count(),
      // Get total views and likes from posts
      prisma.post.aggregate({
        _sum: {
          viewCount: true,
          likeCount: true
        }
      }),
      // Get recent posts with author info
      prisma.post.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true
            }
          }
        }
      }),
      // Get recent users
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true
        }
      })
    ]);

    // Comments count - set to 0 as Comment model may not exist yet
    const totalComments = 0;

    // Calculate totals
    const totalViews = viewsAndLikes._sum.viewCount || 0;
    const totalLikes = viewsAndLikes._sum.likeCount || 0;
    const todayViews = getTodayViews();
    const dailyViews = getDailyViews(7);

    res.json({
      // Flat structure for easy access
      totalUsers,
      totalArticles: totalPosts, // Use posts count as articles count
      totalCategories,
      totalComments,
      totalMedia,
      totalPosts,
      totalViews,
      todayViews,
      dailyViews,
      totalLikes,
      userGrowthPercentage: 12.5,
      articleGrowthPercentage: 8.3,
      // Also include nested data for backwards compatibility
      overview: {
        totalUsers,
        totalArticles: totalPosts,
        totalCategories,
        totalComments,
        totalMedia,
        totalPosts,
        totalViews,
        totalLikes
      },
      recentArticles: recentPosts.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        status: post.status,
        viewCount: post.viewCount || 0,
        likeCount: post.likeCount || 0,
        commentCount: post._count?.comments || 0,
        createdAt: post.createdAt,
        publishedAt: post.publishedAt,
        author: post.author,
        category: post.category
      })),
      recentUsers: recentUsers.map(user => ({
        id: user.id,
        username: user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      error: 'Failed to load dashboard',
      message: error.message || 'Could not retrieve dashboard data'
    });
  }
});

// ==================== USER MANAGEMENT ====================

// Get all users with pagination and filters
router.get('/users', authenticateToken, requireEditor, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('role').optional().isIn(['ADMIN', 'EDITOR', 'AUTHOR', 'USER']),
  query('status').optional().isIn(['active', 'inactive'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { search, role, status } = req.query;

    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (role) {
      where.role = role;
    }
    
    if (status) {
      where.isActive = status === 'active';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          isVerified: true,
          avatar: true,
          profileUrl: true,
          isActive: true,
          isPremium: true,
          premiumUntil: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              articles: true,
              comments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to get users',
      message: 'Could not retrieve users'
    });
  }
});

// Update user role, status, and profile
router.put('/users/:id', authenticateToken, requireAdmin, [
  body('role').optional().isIn(['ADMIN', 'EDITOR', 'AUTHOR', 'USER']),
  body('isActive').optional().isBoolean(),
  body('isVerified').optional().isBoolean(),
  body('isPremium').optional().isBoolean(),
  body('premiumUntil').optional({ nullable: true }).isISO8601(),
  body('profileUrl').optional({ nullable: true }).isURL({ require_protocol: true }),
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('username').optional().trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { role, isActive, isVerified, isPremium, premiumUntil, firstName, lastName, username, profileUrl } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true,
        profileUrl: true
      }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Failed to update user',
        message: 'User not found'
      });
    }

    // Prevent admin from deactivating themselves
    if (id === req.user.id && isActive === false) {
      return res.status(400).json({
        error: 'Cannot deactivate own account',
        message: 'You cannot deactivate your own account'
      });
    }

    const effectiveRole = role || existingUser.role;
    const effectiveFirstName = firstName || existingUser.firstName || '';
    const effectiveLastName = lastName || existingUser.lastName || '';
    const effectiveProfileUrl = profileUrl !== undefined ? profileUrl : existingUser.profileUrl;
    const isSpecialAdmin =
      effectiveRole === 'ADMIN' &&
      normalizeFullName(effectiveFirstName, effectiveLastName) === 'kwizera jean de dieu';
    const mustClearVerification = !isSpecialAdmin && effectiveRole !== 'AUTHOR';

    if (effectiveRole === 'AUTHOR' && !effectiveProfileUrl) {
      return res.status(400).json({
        success: false,
        error: 'Failed to update user',
        message: 'Author account requires profileUrl'
      });
    }

    if (typeof isVerified === 'boolean' && !isSpecialAdmin && effectiveRole !== 'AUTHOR') {
      return res.status(400).json({
        success: false,
        error: 'Failed to update user',
        message: 'Blue tick can only be assigned to Authors'
      });
    }

    if (isSpecialAdmin && isVerified === false) {
      return res.status(400).json({
        success: false,
        error: 'Failed to update user',
        message: 'Verification cannot be removed from Kwizera Jean de Dieu'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(role && { role }),
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(mustClearVerification && { isVerified: false }),
        ...(typeof isVerified === 'boolean' && { isVerified }),
        ...(isSpecialAdmin && { isVerified: true }),
        ...(typeof isPremium === 'boolean' && { isPremium }),
        ...(premiumUntil !== undefined && { premiumUntil: premiumUntil ? new Date(premiumUntil) : null }),
        ...(profileUrl !== undefined && { profileUrl: profileUrl ? profileUrl.trim() : null }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(username && { username })
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isVerified: true,
        avatar: true,
        profileUrl: true,
        isActive: true,
        isPremium: true,
        premiumUntil: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      message: 'Could not update user'
    });
  }
});

// Grant a single premium post to a specific user
router.post('/users/:id/premium-posts', authenticateToken, requireAdmin, [
  body('postId').isString().trim().notEmpty(),
  body('expiresAt').optional({ nullable: true }).isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id: userId } = req.params;
    const { postId, expiresAt } = req.body;

    const [user, post] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } }),
      prisma.post.findUnique({ where: { id: postId }, select: { id: true, title: true, isPremium: true } })
    ]);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!post || !post.isPremium) {
      return res.status(400).json({ success: false, error: 'Post not found or not premium' });
    }

    const access = await prisma.premiumPostAccess.upsert({
      where: {
        userId_postId: {
          userId,
          postId
        }
      },
      update: {
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        grantedBy: req.user.id
      },
      create: {
        userId,
        postId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        grantedBy: req.user.id
      }
    });

    return res.json({
      success: true,
      message: 'Premium post access granted successfully',
      data: access
    });
  } catch (error) {
    console.error('Grant premium post access error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to grant premium post access'
    });
  }
});

// List specific premium post access for one user
router.get('/users/:id/premium-posts', authenticateToken, requireEditor, async (req, res) => {
  try {
    const { id: userId } = req.params;

    const access = await prisma.premiumPostAccess.findMany({
      where: { userId },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
            isPremium: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      data: access
    });
  } catch (error) {
    console.error('List premium post access error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch premium post access list'
    });
  }
});

// Revoke a specific premium post access for a user
router.delete('/users/:id/premium-posts/:postId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id: userId, postId } = req.params;

    await prisma.premiumPostAccess.delete({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    });

    return res.json({
      success: true,
      message: 'Premium post access revoked successfully'
    });
  } catch (error) {
    console.error('Revoke premium post access error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to revoke premium post access'
    });
  }
});

// Delete user
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({
        error: 'Cannot delete own account',
        message: 'You cannot delete your own account'
      });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: 'Could not delete user'
    });
  }
});

// ==================== ANALYTICS ====================

// Get site analytics
router.get('/analytics', authenticateToken, requireEditor, [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { period = '30d', startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
      dateFilter = {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      };
    }

    const [
      userAnalytics,
      articleAnalytics,
      topArticles,
      topCategories,
      userGrowth,
      articleGrowth
    ] = await Promise.all([
      // User analytics
      prisma.userAnalytics.findMany({
        where: {
          date: dateFilter
        },
        orderBy: { date: 'asc' }
      }),
      
      // Article analytics
      prisma.articleAnalytics.findMany({
        where: {
          date: dateFilter
        },
        include: {
          article: {
            select: { title: true, slug: true }
          }
        },
        orderBy: { date: 'asc' }
      }),
      
      // Top articles by views
      prisma.article.findMany({
        where: {
          createdAt: dateFilter
        },
        select: {
          id: true,
          title: true,
          slug: true,
          viewCount: true,
          likeCount: true,
          commentCount: true,
          author: {
            select: { username: true }
          },
          category: {
            select: { name: true }
          }
        },
        orderBy: { viewCount: 'desc' },
        take: 10
      }),
      
      // Top categories by article count
      prisma.category.findMany({
        where: {
          articles: {
            some: {
              createdAt: dateFilter
            }
          }
        },
        select: {
          id: true,
          name: true,
          color: true,
          _count: {
            select: { articles: true }
          }
        },
        orderBy: {
          articles: {
            _count: 'desc'
          }
        },
        take: 10
      }),
      
      // User growth
      prisma.user.groupBy({
        by: ['createdAt'],
        _count: {
          id: true
        },
        where: {
          createdAt: dateFilter
        },
        orderBy: { createdAt: 'asc' }
      }),
      
      // Article growth
      prisma.article.groupBy({
        by: ['createdAt'],
        _count: {
          id: true
        },
        where: {
          createdAt: dateFilter
        },
        orderBy: { createdAt: 'asc' }
      })
    ]);

    res.json({
      userAnalytics,
      articleAnalytics,
      topArticles,
      topCategories,
      userGrowth,
      articleGrowth
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      error: 'Failed to load analytics',
      message: 'Could not retrieve analytics data'
    });
  }
});

// ==================== SYSTEM MANAGEMENT ====================

// Get system logs
router.get('/logs', authenticateToken, requireAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('level').optional().isIn(['ERROR', 'WARN', 'INFO', 'DEBUG']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const { level, startDate, endDate } = req.query;

    const where = {};
    
    if (level) {
      where.level = level;
    }
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.systemLog.count({ where })
    ]);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      error: 'Failed to get logs',
      message: 'Could not retrieve system logs'
    });
  }
});

// Create system log
router.post('/logs', authenticateToken, requireAdmin, [
  body('level').isIn(['ERROR', 'WARN', 'INFO', 'DEBUG']),
  body('message').notEmpty(),
  body('details').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { level, message, details } = req.body;

    const log = await prisma.systemLog.create({
      data: {
        level,
        message,
        details
      }
    });

    res.status(201).json({
      message: 'Log created successfully',
      log
    });
  } catch (error) {
    console.error('Create log error:', error);
    res.status(500).json({
      error: 'Failed to create log',
      message: 'Could not create system log'
    });
  }
});

// Get system health
router.get('/health', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      dbStatus,
      userCount,
      articleCount,
      activeUsers
    ] = await Promise.all([
      // Test database connection
      prisma.$queryRaw`SELECT 1 as test`,
      
      // Get counts
      prisma.user.count(),
      prisma.article.count(),
      
      // Get active users (logged in last 7 days)
      prisma.user.count({
        where: {
          lastLogin: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'connected' : 'disconnected',
      metrics: {
        totalUsers: userCount,
        totalArticles: articleCount,
        activeUsers
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;
