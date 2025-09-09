const express = require('express');
const { body, validationResult, query } = require('express-validator');
const prisma = require('../database/prisma');
const { authenticateToken, requireAdmin, requireEditor } = require('../middleware/auth');

const router = express.Router();

// ==================== DASHBOARD OVERVIEW ====================

// Get dashboard overview statistics
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get real data from database
    const [
      totalUsers,
      totalArticles,
      totalCategories,
      totalComments,
      totalMedia,
      totalPosts
    ] = await Promise.all([
      prisma.user.count(),
      prisma.news.count(),
      prisma.category.count(),
      0, // Comments not implemented yet
      prisma.mediaFile.count(),
      prisma.post.count()
    ]);

    res.json({
      overview: {
        totalUsers,
        totalArticles,
        totalCategories,
        totalComments,
        totalMedia,
        totalPosts,
        userGrowthPercentage: 12.5,
        articleGrowthPercentage: 8.3
      },
      recentArticles: [
        {
          id: '1',
          title: 'Umunsi wa Kinyarwanda 2024',
          viewCount: 1250,
          likeCount: 89,
          author: { username: 'admin', firstName: 'Admin', lastName: 'User' },
          category: { name: 'Siporo', color: '#EF4444' }
        }
      ],
      recentUsers: [
        {
          id: '1',
          username: 'admin',
          email: 'admin@umunsi.com',
          role: 'ADMIN',
          createdAt: '2024-01-15T10:30:00Z'
        }
      ],
      topArticles: [
        {
          id: '1',
          title: 'Umunsi wa Kinyarwanda 2024',
          viewCount: 1250,
          likeCount: 89,
          author: { username: 'admin' }
        }
      ]
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
router.get('/users', authenticateToken, requireAdmin, [
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
          avatar: true,
          isActive: true,
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

// Update user role and status
router.put('/users/:id', authenticateToken, requireAdmin, [
  body('role').optional().isIn(['ADMIN', 'EDITOR', 'AUTHOR', 'USER']),
  body('isActive').optional().isBoolean()
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
    const { role, isActive } = req.body;

    // Prevent admin from deactivating themselves
    if (id === req.user.id && isActive === false) {
      return res.status(400).json({
        error: 'Cannot deactivate own account',
        message: 'You cannot deactivate your own account'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(role && { role }),
        ...(typeof isActive === 'boolean' && { isActive })
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: 'Could not update user'
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
router.get('/analytics', authenticateToken, requireAdmin, [
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
