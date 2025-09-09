const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Track page view
router.post('/pageview', [
  body('page').notEmpty(),
  body('userId').optional().isString(),
  body('sessionId').optional().isString(),
  body('referrer').optional().isString(),
  body('userAgent').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { page, userId, sessionId, referrer, userAgent } = req.body;

    // Create analytics entry
    await prisma.userAnalytics.create({
      data: {
        pageViews: 1,
        uniqueVisitors: userId ? 1 : 0,
        userId: userId || null,
        date: new Date()
      }
    });

    res.json({
      message: 'Page view tracked successfully'
    });
  } catch (error) {
    console.error('Track pageview error:', error);
    res.status(500).json({
      error: 'Failed to track page view',
      message: 'Could not track page view'
    });
  }
});

// Track article view
router.post('/article/:articleId/view', [
  body('timeOnPage').optional().isInt({ min: 0 }),
  body('userId').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { articleId } = req.params;
    const { timeOnPage, userId } = req.body;

    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true }
    });

    if (!article) {
      return res.status(404).json({
        error: 'Article not found',
        message: 'Article does not exist'
      });
    }

    // Create or update article analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAnalytics = await prisma.articleAnalytics.findFirst({
      where: {
        articleId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (existingAnalytics) {
      await prisma.articleAnalytics.update({
        where: { id: existingAnalytics.id },
        data: {
          views: { increment: 1 },
          uniqueViews: userId ? { increment: 1 } : undefined,
          timeOnPage: timeOnPage ? Math.round((existingAnalytics.timeOnPage + timeOnPage) / 2) : existingAnalytics.timeOnPage
        }
      });
    } else {
      await prisma.articleAnalytics.create({
        data: {
          articleId,
          views: 1,
          uniqueViews: userId ? 1 : 0,
          timeOnPage: timeOnPage || 0,
          date: today
        }
      });
    }

    res.json({
      message: 'Article view tracked successfully'
    });
  } catch (error) {
    console.error('Track article view error:', error);
    res.status(500).json({
      error: 'Failed to track article view',
      message: 'Could not track article view'
    });
  }
});

// Get analytics summary (authenticated users)
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const [
      totalViews,
      totalArticles,
      totalUsers,
      recentActivity
    ] = await Promise.all([
      // Total views (last 30 days)
      prisma.articleAnalytics.aggregate({
        where: {
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        _sum: {
          views: true
        }
      }),
      
      // Total articles
      prisma.article.count({
        where: { status: 'PUBLISHED' }
      }),
      
      // Total users
      prisma.user.count(),
      
      // Recent activity (last 7 days)
      prisma.article.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          id: true,
          title: true,
          viewCount: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    res.json({
      summary: {
        totalViews: totalViews._sum.views || 0,
        totalArticles,
        totalUsers
      },
      recentActivity
    });
  } catch (error) {
    console.error('Get analytics summary error:', error);
    res.status(500).json({
      error: 'Failed to get analytics summary',
      message: 'Could not retrieve analytics summary'
    });
  }
});

module.exports = router;
