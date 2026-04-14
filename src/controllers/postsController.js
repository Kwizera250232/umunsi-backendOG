const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const slugify = require('slugify');
const https = require('https');
const nodemailer = require('nodemailer');
const { incrementDailyViews } = require('../utils/viewStats');
const {
  getHighestReachedMilestone,
  getLastNotifiedMilestone,
  markMilestoneAsSent,
} = require('../utils/postViewMilestones');

const prisma = new PrismaClient();
const MILESTONE_EMAIL_TIMEOUT_MS = Number(process.env.MILESTONE_EMAIL_TIMEOUT_MS || 10000);

const isMilestoneEmailEnabled = () => {
  const flag = String(process.env.ENABLE_POST_VIEW_MILESTONE_EMAILS || 'false').toLowerCase();
  return !['0', 'false', 'no', 'off'].includes(flag);
};

const getMailtrapApiHost = () => {
  return process.env.MAILTRAP_API_HOST || 'send.api.mailtrap.io';
};

const sendViaMailtrapApi = async ({ token, from, to, subject, text, html, category = 'Post View Milestone' }) => {
  const payload = JSON.stringify({
    from,
    to: to.map((email) => ({ email })),
    subject,
    text,
    html,
    category,
  });

  const trySend = (headers) =>
    new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: getMailtrapApiHost(),
          path: '/api/send',
          method: 'POST',
          timeout: MILESTONE_EMAIL_TIMEOUT_MS,
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            resolve({ statusCode: res.statusCode, body });
          });
        }
      );

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy(new Error(`Mailtrap API timeout after ${MILESTONE_EMAIL_TIMEOUT_MS}ms`));
      });
      req.write(payload);
      req.end();
    });

  const bearerResult = await trySend({ Authorization: `Bearer ${token}` });
  if (bearerResult.statusCode >= 200 && bearerResult.statusCode < 300) return true;

  if (bearerResult.statusCode === 401) {
    const apiTokenResult = await trySend({ 'Api-Token': token });
    if (apiTokenResult.statusCode >= 200 && apiTokenResult.statusCode < 300) return true;
    throw new Error(`Mailtrap API error (${apiTokenResult.statusCode}): ${apiTokenResult.body}`);
  }

  throw new Error(`Mailtrap API error (${bearerResult.statusCode}): ${bearerResult.body}`);
};

const getMailTransport = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: MILESTONE_EMAIL_TIMEOUT_MS,
    greetingTimeout: MILESTONE_EMAIL_TIMEOUT_MS,
    socketTimeout: MILESTONE_EMAIL_TIMEOUT_MS,
  });
};

const isEnabledFlag = (value, defaultValue = true) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  return !['0', 'false', 'no', 'off'].includes(normalized);
};

const parseEmailList = (value) => {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0 && item.includes('@'));
};

const buildMailtrapSender = () => {
  const mailtrapToken = process.env.MAILTRAP_API_TOKEN;
  const senderEmail = process.env.MAILTRAP_SENDER_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER;
  const senderName = process.env.MAILTRAP_SENDER_NAME || 'Umunsi Notifications';
  if (!mailtrapToken || !senderEmail) return null;

  return {
    provider: 'mailtrap',
    send: ({ to, subject, text, html }) =>
      sendViaMailtrapApi({
        token: mailtrapToken,
        from: { email: senderEmail, name: senderName },
        to,
        subject,
        text,
        html,
      }),
  };
};

const buildSmtpSender = () => {
  const transport = getMailTransport();
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!transport || !fromAddress) return null;

  return {
    provider: 'smtp',
    send: ({ to, subject, text, html }) =>
      transport.sendMail({
        from: fromAddress,
        to: to.join(','),
        subject,
        text,
        html,
      }),
  };
};

const getMailSender = () => {
  const preference = String(process.env.MILESTONE_MAIL_PROVIDER || 'auto').trim().toLowerCase();

  const withFallback = (primary, secondary) => {
    if (!primary) return secondary || null;
    if (!secondary) return primary;

    return {
      provider: `${primary.provider}->${secondary.provider}`,
      send: async (payload) => {
        try {
          return await primary.send(payload);
        } catch (primaryError) {
          console.warn(
            `Milestone email primary provider failed (${primary.provider}), retrying with ${secondary.provider}:`,
            primaryError?.message || primaryError
          );
          return secondary.send(payload);
        }
      },
    };
  };

  if (preference === 'smtp') {
    return withFallback(buildSmtpSender(), buildMailtrapSender());
  }

  if (preference === 'mailtrap' || preference === 'api') {
    return withFallback(buildMailtrapSender(), buildSmtpSender());
  }

  return withFallback(buildMailtrapSender(), buildSmtpSender());
};

const getMilestoneRecipientMode = () => {
  const mode = String(process.env.MILESTONE_RECIPIENT_MODE || 'author_admin').trim().toLowerCase();
  if (['all', 'all_users', 'users'].includes(mode)) return 'all_users';
  if (['selected', 'custom', 'specific'].includes(mode)) return 'selected';
  return 'author_admin';
};

const getFrontendBaseUrl = () => {
  const configured = process.env.FRONTEND_URL || process.env.CLIENT_URL || process.env.APP_URL;
  return (configured || 'https://umunsi.com').replace(/\/$/, '');
};

const formatMilestoneDate = (date = new Date()) => {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const notifyPostMilestoneIfNeeded = async (post, views) => {
  try {
    if (!post?.id || !post?.authorId || !Number.isFinite(views)) return;
    if (!isMilestoneEmailEnabled()) return;

    const reachedMilestone = getHighestReachedMilestone(views);
    if (!reachedMilestone) return;

    const lastNotified = getLastNotifiedMilestone(post.id);
    if (reachedMilestone <= lastNotified) return;

    const mailSender = getMailSender();
    if (!mailSender) return;

    const recipientMode = getMilestoneRecipientMode();
    const includeAuthorAndAdmins =
      recipientMode === 'author_admin' || isEnabledFlag(process.env.MILESTONE_INCLUDE_AUTHOR_AND_ADMINS, true);

    const [author, admins, allUsers] = await Promise.all([
      prisma.user.findUnique({
        where: { id: post.authorId },
        select: {
          email: true,
          firstName: true,
          lastName: true,
          username: true,
          isActive: true,
        },
      }),
      includeAuthorAndAdmins
        ? prisma.user.findMany({
            where: {
              role: 'ADMIN',
              isActive: true,
            },
            select: {
              email: true,
            },
          })
        : Promise.resolve([]),
      recipientMode === 'all_users'
        ? prisma.user.findMany({
            where: {
              isActive: true,
              email: {
                not: null,
              },
            },
            select: {
              email: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const recipients = new Set();

    if (recipientMode === 'selected') {
      const selectedRecipients = parseEmailList(process.env.MILESTONE_SELECTED_RECIPIENTS);
      for (const email of selectedRecipients) recipients.add(email);
    }

    if (recipientMode === 'all_users') {
      for (const user of allUsers) {
        if (user?.email) recipients.add(String(user.email).trim().toLowerCase());
      }
    }

    if (includeAuthorAndAdmins) {
      if (author?.isActive && author.email) recipients.add(String(author.email).trim().toLowerCase());
      for (const admin of admins) {
        if (admin.email) recipients.add(String(admin.email).trim().toLowerCase());
      }
    }

    if (recipients.size === 0) return;

    const articlePath = post.slug ? `/post/${post.slug}` : `/article/${post.id}`;
    const articleUrl = `${getFrontendBaseUrl()}${articlePath}`;
    const authorName = [author?.firstName, author?.lastName].filter(Boolean).join(' ') || author?.username || 'Author';
    const milestoneDate = formatMilestoneDate(new Date());
    const supportEmail = process.env.MILESTONE_SUPPORT_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER || 'info@umunsi.com';
    const platformName = process.env.MILESTONE_PLATFORM_NAME || 'Umunsi Platform';
    const subject = `article - ${post.title} achieved ${views.toLocaleString()} views on ${milestoneDate}!`;
    const text = [
      platformName,
      '',
      `Congratulations, you have achieved ${views.toLocaleString()} views on the article ${post.title}.`,
      `Milestone reached: ${reachedMilestone.toLocaleString()} views.`,
      `Click to check it out: ${articleUrl}`,
      '',
      `For more information, contact ${supportEmail}`,
      'Umunsi Ltd',
    ].join('\n');
    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #f9fafb; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 0;">
        <div style="background-color: #ffffff; padding: 40px 20px; text-align: center;">
          <p style="margin: 0 0 20px; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">${platformName}</p>
          <h1 style="margin: 0 0 30px; font-size: 28px; font-weight: 700; color: #1f2937;">Congratulations</h1>
          <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #4b5563;">you have achieved <strong style="color: #f59e0b;">${views.toLocaleString()} views</strong> increase to the article <strong style="color: #1f2937;">${post.title}</strong>. Click to check it out</p>
          <a href="${articleUrl}" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; font-weight: 700; padding: 12px 28px; border-radius: 4px; font-size: 15px; margin: 30px 0;">Check out</a>
        </div>
        <div style="background-color: #1e40af; color: #ffffff; padding: 30px 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">For more information, contact <a href="mailto:${supportEmail}" style="color: #ffffff; text-decoration: underline;">${supportEmail}</a></p>
          <p style="margin: 8px 0 0; font-size: 14px; font-weight: 600;">Umunsi Ltd</p>
        </div>
      </div>
    `;

    await mailSender.send({
      to: Array.from(recipients),
      subject,
      text,
      html,
    });

    markMilestoneAsSent(post.id, reachedMilestone);
  } catch (error) {
    console.error('Post milestone email notification failed:', error?.message || error);
  }
};

const isAdminRequest = (req) => req.user && req.user.role === 'ADMIN';

const extractFirstImageFromContent = (content = '') => {
  const match = String(content).match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
  if (!match || !match[1]) return null;
  return match[1].trim();
};

const uploadsRoot = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'));

const resolveLocalUploadFile = (rawPath = '') => {
  if (!rawPath) return null;

  try {
    const candidate = String(rawPath).trim();
    if (!candidate) return null;

    const pathname = candidate.startsWith('http://') || candidate.startsWith('https://')
      ? new URL(candidate).pathname
      : candidate;

    if (!pathname.startsWith('/uploads/')) return null;
    return path.join(uploadsRoot, pathname.replace(/^\/uploads\/?/, ''));
  } catch {
    return null;
  }
};

const isLocalUploadAvailable = (rawPath = '') => {
  const localFile = resolveLocalUploadFile(rawPath);
  if (!localFile) return true;
  return fs.existsSync(localFile);
};

const withFeaturedImageFallback = (post) => {
  if (!post) return post;

  const firstContentImage = extractFirstImageFromContent(post.content) || null;

  if (!post.featuredImage) {
    return {
      ...post,
      featuredImage: isLocalUploadAvailable(firstContentImage) ? firstContentImage : null
    };
  }

  if (!isLocalUploadAvailable(post.featuredImage)) {
    return {
      ...post,
      featuredImage: isLocalUploadAvailable(firstContentImage) ? firstContentImage : null
    };
  }

  return post;
};

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
            avatar: true,
            profileUrl: true,
            role: true,
            isVerified: true,
            createdAt: true
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
      authorId,
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
    
    if (author || authorId) {
      where.authorId = author || authorId;
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
              avatar: true,
              profileUrl: true,
              role: true,
              isVerified: true,
              createdAt: true
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
        ...withFeaturedImageFallback(post),
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
            avatar: true,
            profileUrl: true,
            role: true,
            isVerified: true,
            createdAt: true
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
              avatar: true,
              profileUrl: true,
              role: true,
              isVerified: true,
              createdAt: true
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
    const updatedView = await prisma.post.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });

    // Track daily reads for admin analytics.
    incrementDailyViews(new Date(), 1);

    Promise.resolve()
      .then(() => notifyPostMilestoneIfNeeded(post, updatedView.viewCount))
      .catch((notificationError) => {
        console.error('Non-blocking post milestone notification failed:', notificationError?.message || notificationError);
      });

    // Convert tags from string to array
    const postWithTagsArray = {
      ...withFeaturedImageFallback(post),
      viewCount: updatedView.viewCount,
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
    const isAuthorOnly = req.user.role === 'AUTHOR';
    const safeStatus = isAuthorOnly ? 'DRAFT' : status;

    // Generate slug
    const slug = await generateSlug(title);

    // Set publishedAt if status is PUBLISHED
    const publishedAt = safeStatus === 'PUBLISHED' ? new Date() : null;

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        featuredImage,
        status: safeStatus,
        isPremium: isAuthorOnly ? false : isPremium,
        publishedAt,
        categoryId: categoryId || null,
        isFeatured: isAuthorOnly ? false : isFeatured,
        isPinned: isAuthorOnly ? false : isPinned,
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
            avatar: true,
            profileUrl: true,
            role: true,
            isVerified: true,
            createdAt: true
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

    const isAuthorOnly = req.user.role === 'AUTHOR';
    if (isAuthorOnly && existingPost.authorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only update your own posts'
      });
    }

    const nextStatus = isAuthorOnly ? 'DRAFT' : status;

    // Generate new slug if title changed
    let slug = existingPost.slug;
    if (title && title !== existingPost.title) {
      slug = await generateSlug(title, id);
    }

    // Handle status change to PUBLISHED
    let publishedAt = existingPost.publishedAt;
    if (nextStatus === 'PUBLISHED' && existingPost.status !== 'PUBLISHED') {
      publishedAt = new Date();
    } else if (nextStatus && nextStatus !== 'PUBLISHED') {
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
        ...((nextStatus !== undefined && nextStatus !== null) && { status: nextStatus }),
        ...(isPremium !== undefined && { isPremium: isAuthorOnly ? false : isPremium }),
        ...(publishedAt !== undefined && { publishedAt }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(isFeatured !== undefined && { isFeatured: isAuthorOnly ? false : isFeatured }),
        ...(isPinned !== undefined && { isPinned: isAuthorOnly ? false : isPinned }),
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
            avatar: true,
            profileUrl: true,
            role: true,
            isVerified: true,
            createdAt: true
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

    if (req.user.role === 'AUTHOR' && post.authorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only delete your own posts'
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

    if (req.user.role === 'AUTHOR') {
      const ownCount = await prisma.post.count({
        where: {
          id: { in: ids },
          authorId: req.user.id
        }
      });

      if (ownCount !== ids.length) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You can only delete your own posts'
        });
      }
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
