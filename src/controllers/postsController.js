const { PrismaClient } = require('@prisma/client');
const slugify = require('slugify');
const { incrementDailyViews } = require('../utils/viewStats');

const prisma = new PrismaClient();

const isAdminRequest = (req) => req.user && req.user.role === 'ADMIN';

const sanitizePostForRole = (post, isAdmin) => {
  if (isAdmin) return post;
  const { viewCount, ...rest } = post;
  return rest;
};

const hasPremiumAccess = async (req, postId = null) => {
  if (!req.user) return false;
  if (['ADMIN', 'EDITOR', 'AUTHOR'].includes(req.user.role)) return true;
  if (req.user.isPremium) {
    if (!req.user.premiumUntil) return true;
    if (new Date(req.user.premiumUntil) > new Date()) return true;
  }

  if (!postId) return false;

  const grant = await prisma.premiumPostAccess.findFirst({
    where: {
      userId: req.user.id,
      postId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    }
  });

  return Boolean(grant);
};

const getPremiumDashboard = async (req, res) => {
  try {
    const premiumPosts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        isPremium: true
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true
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
      orderBy: { publishedAt: 'desc' }
    });

    const results = await Promise.all(
      premiumPosts.map(async (post) => {
        const canAccess = await hasPremiumAccess(req, post.id);
        return {
          id: post.id,
          title: post.title,
          slug: post.slug,
          featuredImage: post.featuredImage,
          publishedAt: post.publishedAt,
          createdAt: post.createdAt,
          category: post.category,
          author: post.author,
          hasAccess: canAccess
        };
      })
    );

    return res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error fetching premium dashboard:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch premium dashboard'
    });
  }
};

// Helper function to generate slug
const generateSlug = (title, existingId = null) => {
  let baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  return new Promise(async (resolve) => {
    while (true) {
      const existing = await prisma.post.findFirst({
        where: {
          slug: slug,
          ...(existingId && { id: { not: existingId } })
        }
      });

      if (!existing) {
        resolve(slug);
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  });
};

// Get all posts with pagination and filtering
const getPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      author,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (category) {
      where.categoryId = category;
    }
    
    if (author) {
      where.authorId = author;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatar: true
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
      prisma.post.count({ where })
    ]);

    // Convert tags from string to array for each post
    const postsWithTagsArray = posts.map(post => {
      const mappedPost = {
        ...post,
        tags: post.tags ? post.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
      };

      return sanitizePostForRole(mappedPost, isAdminRequest(req));
    });

    res.json({
      success: true,
      data: postsWithTagsArray,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts'
    });
  }
};

// Get single post by ID or slug
const getPost = async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by ID first, then by slug
    let post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true
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
    });

    // If not found by ID, try to find by slug
    if (!post) {
      post = await prisma.post.findUnique({
        where: { slug: id },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatar: true
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
      });
    }

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Increment view count
    await prisma.post.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } }
    });

    // Track daily reads for admin analytics.
    incrementDailyViews(new Date(), 1);

    // Convert tags from string to array
    const postWithTagsArray = {
      ...post,
      tags: post.tags ? post.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
    };

    const safePost = sanitizePostForRole(postWithTagsArray, isAdminRequest(req));

    const canAccessPremium = await hasPremiumAccess(req, post.id);
    const isLocked = Boolean(post.isPremium) && !canAccessPremium;
    const responsePost = isLocked
      ? {
          ...safePost,
          content: '',
          excerpt: '',
          featuredImage: null,
          isLocked: true
        }
      : {
          ...safePost,
          isLocked: false
        };

    res.json({
      success: true,
      data: responsePost
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch post'
    });
  }
};

// Create new post
const createPost = async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      featuredImage,
      status = 'DRAFT',
      categoryId,
      isPremium = false,
      isFeatured = false,
      isPinned = false,
      allowComments = true,
      tags = [],
      metaTitle,
      metaDescription
    } = req.body;

    const authorId = req.user.id;

    // Generate slug
    const slug = await generateSlug(title);

    // Set publishedAt if status is PUBLISHED
    const publishedAt = status === 'PUBLISHED' ? new Date() : null;

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        featuredImage,
        status,
        isPremium,
        publishedAt,
        categoryId: categoryId || null,
        isFeatured,
        isPinned,
        allowComments,
        tags: Array.isArray(tags) ? tags.join(',') : tags,
        metaTitle,
        metaDescription,
        authorId
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true
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
    });

    // Convert tags from string to array
    const postWithTagsArray = {
      ...post,
      tags: post.tags ? post.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
    };

    res.status(201).json({
      success: true,
      data: postWithTagsArray
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create post'
    });
  }
};

// Update post
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      excerpt,
      featuredImage,
      status,
      categoryId,
      isPremium,
      isFeatured,
      isPinned,
      allowComments,
      tags,
      metaTitle,
      metaDescription
    } = req.body;

    // Check if post exists
    const existingPost = await prisma.post.findUnique({
      where: { id }
    });

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Generate new slug if title changed
    let slug = existingPost.slug;
    if (title && title !== existingPost.title) {
      slug = await generateSlug(title, id);
    }

    // Handle status change to PUBLISHED
    let publishedAt = existingPost.publishedAt;
    if (status === 'PUBLISHED' && existingPost.status !== 'PUBLISHED') {
      publishedAt = new Date();
    } else if (status !== 'PUBLISHED') {
      publishedAt = null;
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(content && { content }),
        ...(excerpt !== undefined && { excerpt }),
        ...(featuredImage !== undefined && { featuredImage }),
        ...(status && { status }),
        ...(isPremium !== undefined && { isPremium }),
        ...(publishedAt !== undefined && { publishedAt }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(isPinned !== undefined && { isPinned }),
        ...(allowComments !== undefined && { allowComments }),
        ...(tags && { tags: Array.isArray(tags) ? tags.join(',') : tags }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription })
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true
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
    });

    // Convert tags from string to array
    const postWithTagsArray = {
      ...post,
      tags: post.tags ? post.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
    };

    res.json({
      success: true,
      data: postWithTagsArray
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update post'
    });
  }
};

// Delete post
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    await prisma.post.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete post'
    });
  }
};

// Bulk delete posts
const deletePosts = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No post IDs provided'
      });
    }

    const result = await prisma.post.deleteMany({
      where: {
        id: { in: ids }
      }
    });

    res.json({
      success: true,
      message: `${result.count} posts deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete posts'
    });
  }
};

// Get post statistics
const getPostStats = async (req, res) => {
  try {
    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      featuredPosts,
      totalViews,
      totalLikes
    ] = await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: 'PUBLISHED' } }),
      prisma.post.count({ where: { status: 'DRAFT' } }),
      prisma.post.count({ where: { isFeatured: true } }),
      prisma.post.aggregate({
        _sum: { viewCount: true }
      }),
      prisma.post.aggregate({
        _sum: { likeCount: true }
      })
    ]);

    const canSeeViews = isAdminRequest(req);

    res.json({
      success: true,
      data: {
        totalPosts,
        publishedPosts,
        draftPosts,
        featuredPosts,
        totalViews: canSeeViews ? (totalViews._sum.viewCount || 0) : undefined,
        totalLikes: totalLikes._sum.likeCount || 0
      }
    });
  } catch (error) {
    console.error('Error fetching post stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch post statistics'
    });
  }
};

module.exports = {
  getPosts,
  getPost,
  getPremiumDashboard,
  createPost,
  updatePost,
  deletePost,
  deletePosts,
  getPostStats
};
