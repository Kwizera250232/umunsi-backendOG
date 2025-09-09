const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Helper function to generate slug
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

class NewsController {
  // Create new news article
  async createNews(req, res) {
    try {
      console.log('📝 Creating news article...');
      console.log('Request body:', req.body);
      console.log('Request file:', req.file);

      const {
        title,
        slug,
        content,
        excerpt,
        categoryId,
        status = 'DRAFT',
        isFeatured = false,
        isBreaking = false,
        isTrending = false
      } = req.body;

      // Validate required fields
      if (!title || !content || !categoryId) {
        return res.status(400).json({
          error: 'Missing required fields',
          details: {
            title: !title ? 'Title is required' : null,
            content: !content ? 'Content is required' : null,
            categoryId: !categoryId ? 'Category is required' : null
          }
        });
      }

      // Handle uploaded image file
      let featuredImage = null;
      if (req.file) {
        featuredImage = `/uploads/articles/${req.file.filename}`;
        console.log('📸 Image uploaded:', featuredImage);
      }

      // Generate slug from title if not provided
      const finalSlug = slug || generateSlug(title);
      console.log('🔗 Generated slug:', finalSlug);

      // Check if slug already exists
      const existingNews = await prisma.news.findUnique({
        where: { slug: finalSlug }
      });

      if (existingNews) {
        return res.status(400).json({ 
          error: 'A news article with this title already exists',
          details: 'Please choose a different title or modify the existing article'
        });
      }

      // Validate category exists
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });

      if (!category) {
        return res.status(400).json({
          error: 'Invalid category',
          details: 'The selected category does not exist'
        });
      }

      // Parse boolean values
      const parsedIsFeatured = isFeatured === 'true' || isFeatured === true;
      const parsedIsBreaking = isBreaking === 'true' || isBreaking === true;
      const parsedIsTrending = isTrending === 'true' || isTrending === true;

      // Create news article
      const news = await prisma.news.create({
        data: {
          title: title.trim(),
          slug: finalSlug,
          content: content.trim(),
          excerpt: excerpt ? excerpt.trim() : null,
          featuredImage,
          status: status.toUpperCase(),
          isFeatured: parsedIsFeatured,
          isBreaking: parsedIsBreaking,
          isTrending: parsedIsTrending,
          publishedAt: status.toUpperCase() === 'PUBLISHED' ? new Date() : null,
          authorId: req.user.id,
          categoryId: categoryId
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
              icon: true
            }
          }
        }
      });

      console.log('✅ News article created successfully:', news.id);

      res.status(201).json({
        success: true,
        message: 'Article created successfully',
        news
      });

    } catch (error) {
      console.error('❌ Error creating news article:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Request body:', req.body);
      console.error('❌ Request file:', req.file);
      console.error('❌ Request user:', req.user);
      
      res.status(500).json({
        error: 'Failed to create news article',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get all news articles with pagination and filters
  async getAllNews(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        status = 'ALL',
        featured,
        breaking,
        trending,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // Build where clause
      const where = {
        status: status === 'ALL' ? undefined : status.toUpperCase(),
        isFeatured: featured === 'true' ? true : featured === 'false' ? false : undefined,
        isBreaking: breaking === 'true' ? true : breaking === 'false' ? false : undefined,
        isTrending: trending === 'true' ? true : trending === 'false' ? false : undefined,
        category: category ? { slug: category } : undefined,
        OR: search ? [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { excerpt: { contains: search, mode: 'insensitive' } }
        ] : undefined
      };

      // Remove undefined values
      Object.keys(where).forEach(key => {
        if (where[key] === undefined) {
          delete where[key];
        }
      });

      const [news, total] = await Promise.all([
        prisma.news.findMany({
          where,
          include: {
            author: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
                icon: true
              }
            }
          },
          orderBy: {
            [sortBy]: sortOrder
          },
          skip,
          take
        }),
        prisma.news.count({ where })
      ]);

      const totalPages = Math.ceil(total / take);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.json({
        success: true,
        news,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: take,
          hasNextPage,
          hasPrevPage
        }
      });

    } catch (error) {
      console.error('❌ Error fetching news:', error);
      res.status(500).json({
        error: 'Failed to fetch news articles',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get single news article by ID or slug
  async getNewsById(req, res) {
    try {
      const { id } = req.params;

      const news = await prisma.news.findFirst({
        where: {
          OR: [
            { id },
            { slug: id }
          ]
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
              icon: true
            }
          }
        }
      });

      if (!news) {
        return res.status(404).json({
          error: 'News article not found',
          details: 'The requested article could not be found'
        });
      }

      // Increment view count
      await prisma.news.update({
        where: { id: news.id },
        data: { viewCount: { increment: 1 } }
      });

      res.json({
        success: true,
        news
      });

    } catch (error) {
      console.error('❌ Error fetching news article:', error);
      res.status(500).json({
        error: 'Failed to fetch news article',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update news article
  async updateNews(req, res) {
    try {
      const { id } = req.params;
      const {
        title,
        content,
        excerpt,
        categoryId,
        status,
        isFeatured,
        isBreaking,
        isTrending
      } = req.body;

      // Find the news article
      const existingNews = await prisma.news.findFirst({
        where: {
          OR: [
            { id },
            { slug: id }
          ]
        },
        include: {
          author: true,
          category: true
        }
      });

      if (!existingNews) {
        return res.status(404).json({
          error: 'News article not found',
          details: 'The article you are trying to update does not exist'
        });
      }

      // Check permissions
      if (req.user.role !== 'ADMIN' && req.user.role !== 'EDITOR' && 
          (req.user.role === 'AUTHOR' && existingNews.authorId !== req.user.id)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          details: 'You do not have permission to update this article'
        });
      }

      // Handle image update if new file uploaded
      let featuredImage = existingNews.featuredImage;
      if (req.file) {
        // Delete old image if exists
        if (existingNews.featuredImage) {
          const oldImagePath = path.join(__dirname, '..', '..', existingNews.featuredImage);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
            console.log('🗑️ Old image deleted:', oldImagePath);
          }
        }
        featuredImage = `/uploads/articles/${req.file.filename}`;
        console.log('📸 New image uploaded:', featuredImage);
      }

      // Generate new slug if title changed
      let slug = existingNews.slug;
      if (title && title !== existingNews.title) {
        slug = generateSlug(title);
        
        // Check if new slug already exists
        const slugExists = await prisma.news.findFirst({
          where: {
            slug,
            id: { not: existingNews.id }
          }
        });

        if (slugExists) {
          return res.status(400).json({
            error: 'Title conflict',
            details: 'A news article with this title already exists'
          });
        }
      }

      // Validate category if changed
      if (categoryId && categoryId !== existingNews.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: categoryId }
        });

        if (!category) {
          return res.status(400).json({
            error: 'Invalid category',
            details: 'The selected category does not exist'
          });
        }
      }

      // Parse boolean values
      const parsedIsFeatured = isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : existingNews.isFeatured;
      const parsedIsBreaking = isBreaking !== undefined ? (isBreaking === 'true' || isBreaking === true) : existingNews.isBreaking;
      const parsedIsTrending = isTrending !== undefined ? (isTrending === 'true' || isTrending === true) : existingNews.isTrending;

      // Update news article
      const updatedNews = await prisma.news.update({
        where: { id: existingNews.id },
        data: {
          title: title || existingNews.title,
          slug,
          content: content || existingNews.content,
          excerpt: excerpt !== undefined ? excerpt : existingNews.excerpt,
          featuredImage,
          status: status || existingNews.status,
          isFeatured: parsedIsFeatured,
          isBreaking: parsedIsBreaking,
          isTrending: parsedIsTrending,
          publishedAt: status === 'PUBLISHED' && existingNews.status !== 'PUBLISHED' ? new Date() : existingNews.publishedAt,
          categoryId: categoryId || existingNews.categoryId,
          updatedAt: new Date()
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
              icon: true
            }
          }
        }
      });

      console.log('✅ News article updated successfully:', updatedNews.id);

      res.json({
        success: true,
        message: 'Article updated successfully',
        news: updatedNews
      });

    } catch (error) {
      console.error('❌ Error updating news article:', error);
      res.status(500).json({
        error: 'Failed to update news article',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Delete news article
  async deleteNews(req, res) {
    try {
      const { id } = req.params;

      // Find the news article
      const existingNews = await prisma.news.findFirst({
        where: {
          OR: [
            { id },
            { slug: id }
          ]
        },
        include: {
          author: true
        }
      });

      if (!existingNews) {
        return res.status(404).json({
          error: 'News article not found',
          details: 'The article you are trying to delete does not exist'
        });
      }

      // Check permissions
      if (req.user.role !== 'ADMIN' && req.user.role !== 'EDITOR' && 
          (req.user.role === 'AUTHOR' && existingNews.authorId !== req.user.id)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          details: 'You do not have permission to delete this article'
        });
      }

      // Delete associated image file
      if (existingNews.featuredImage) {
        const imagePath = path.join(__dirname, '..', '..', existingNews.featuredImage);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log('🗑️ Image file deleted:', imagePath);
        }
      }

      // Delete the news article
      await prisma.news.delete({
        where: { id: existingNews.id }
      });

      console.log('✅ News article deleted successfully:', existingNews.id);

      res.json({ 
        success: true,
        message: 'Article deleted successfully'
      });

    } catch (error) {
      console.error('❌ Error deleting news article:', error);
      res.status(500).json({
        error: 'Failed to delete news article',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get featured news
  async getFeaturedNews(req, res) {
    try {
      const news = await prisma.news.findMany({
        where: {
          isFeatured: true,
          status: 'PUBLISHED'
        },
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
        },
        orderBy: {
          publishedAt: 'desc'
        },
        take: 10
      });

      res.json({
        success: true,
        news
      });

    } catch (error) {
      console.error('❌ Error fetching featured news:', error);
      res.status(500).json({
        error: 'Failed to fetch featured news',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get breaking news
  async getBreakingNews(req, res) {
    try {
      const news = await prisma.news.findMany({
        where: {
          isBreaking: true,
          status: 'PUBLISHED'
        },
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
        },
        orderBy: {
          publishedAt: 'desc'
        },
        take: 5
      });

      res.json({
        success: true,
        news
      });

    } catch (error) {
      console.error('❌ Error fetching breaking news:', error);
      res.status(500).json({
        error: 'Failed to fetch breaking news',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get trending news
  async getTrendingNews(req, res) {
    try {
      const news = await prisma.news.findMany({
        where: {
          isTrending: true,
          status: 'PUBLISHED'
        },
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
        },
        orderBy: [
          { viewCount: 'desc' },
          { publishedAt: 'desc' }
        ],
        take: 10
      });

      res.json({
        success: true,
        news
      });

    } catch (error) {
      console.error('❌ Error fetching trending news:', error);
      res.status(500).json({
        error: 'Failed to fetch trending news',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get news by author
  async getNewsByAuthor(req, res) {
    try {
      const { authorId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const [news, total] = await Promise.all([
        prisma.news.findMany({
          where: {
            authorId,
            status: 'PUBLISHED'
          },
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
          },
          orderBy: {
            publishedAt: 'desc'
          },
          skip,
          take
        }),
        prisma.news.count({
          where: {
            authorId,
            status: 'PUBLISHED'
          }
        })
      ]);

      const totalPages = Math.ceil(total / take);

      res.json({
        success: true,
        news,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: take
        }
      });

    } catch (error) {
      console.error('❌ Error fetching news by author:', error);
      res.status(500).json({
        error: 'Failed to fetch news by author',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Like/unlike news article
  async likeNews(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const news = await prisma.news.findUnique({
        where: { id }
      });

      if (!news) {
        return res.status(404).json({
          error: 'News article not found'
        });
      }

      // Check if user already liked the article
      const existingLike = await prisma.newsLike.findUnique({
        where: {
          userId_newsId: {
            userId,
            newsId: id
          }
        }
      });

      if (existingLike) {
        // Unlike
        await prisma.newsLike.delete({
          where: {
            userId_newsId: {
              userId,
              newsId: id
            }
          }
        });

        await prisma.news.update({
          where: { id },
          data: { likeCount: { decrement: 1 } }
        });

        res.json({
          success: true,
          message: 'Article unliked',
          liked: false
        });
      } else {
        // Like
        await prisma.newsLike.create({
          data: {
            userId,
            newsId: id
          }
        });

        await prisma.news.update({
          where: { id },
          data: { likeCount: { increment: 1 } }
        });

        res.json({
          success: true,
          message: 'Article liked',
          liked: true
        });
      }

    } catch (error) {
      console.error('❌ Error liking/unliking news:', error);
      res.status(500).json({
        error: 'Failed to like/unlike article',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }


}

const newsController = new NewsController();
module.exports = newsController;
