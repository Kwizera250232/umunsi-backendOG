const express = require('express');
const { body, query, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const prisma = require('../database/prisma');
const { authenticateToken, optionalAuth, requireEditor } = require('../middleware/auth');

const router = express.Router();

const CATEGORIES = ['cyamunara', 'akazi', 'guhinduza', 'ibindi'];
const STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

const normalizePhone = (value = '') => String(value).replace(/\s+/g, '').replace(/^0/, '250');

const getMailTransport = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
};

const getTwilioConfig = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) return null;
  return { accountSid, authToken, fromNumber };
};

const getAfricasTalkingConfig = () => {
  const username = process.env.AFRICASTALKING_USERNAME;
  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const senderId = process.env.AFRICASTALKING_SENDER_ID;

  if (!username || !apiKey) return null;
  return { username, apiKey, senderId };
};

const sendSmsWithTwilio = async (toRaw, message) => {
  const config = getTwilioConfig();
  if (!config) {
    return { ok: false, error: 'Twilio config missing' };
  }

  const to = `+${normalizePhone(toRaw)}`;
  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
  const form = new URLSearchParams({
    To: to,
    From: config.fromNumber,
    Body: message
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form.toString()
  });

  if (!response.ok) {
    const data = await response.text();
    return { ok: false, error: data.slice(0, 300) };
  }

  return { ok: true };
};

const sendSmsWithAfricasTalking = async (toRaw, message) => {
  const config = getAfricasTalkingConfig();
  if (!config) {
    return { ok: false, error: 'Africa\'s Talking config missing' };
  }

  const to = `+${normalizePhone(toRaw)}`;
  const endpoint = 'https://api.africastalking.com/version1/messaging';
  const form = new URLSearchParams({
    username: config.username,
    to,
    message,
    ...(config.senderId ? { from: config.senderId } : {})
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apiKey: config.apiKey,
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form.toString()
  });

  if (!response.ok) {
    const data = await response.text();
    return { ok: false, error: data.slice(0, 300) };
  }

  return { ok: true };
};

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

// Admin/editor: get classifieds for one user
router.get('/user/:userId', authenticateToken, requireEditor, async (req, res) => {
  try {
    const { userId } = req.params;
    const ads = await prisma.classifiedAd.findMany({
      where: { userId },
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
    console.error('List user classifieds error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch user classifieds' });
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

// Owner or admin/editor can edit ad details
router.put('/:id', authenticateToken, [
  body('category').optional().isIn(CATEGORIES),
  body('title').optional().trim().isLength({ min: 3, max: 180 }),
  body('description').optional().trim().isLength({ min: 6, max: 3000 }),
  body('phone').optional().trim().isLength({ min: 6, max: 40 }),
  body('email').optional().isEmail(),
  body('durationDays').optional().isInt({ min: 1, max: 365 }),
  body('priceRwf').optional().isInt({ min: 0 }),
  body('attachmentName').optional({ nullable: true }).isString().isLength({ max: 200 }),
  body('attachmentUrl').optional({ nullable: true }).isString().isLength({ max: 500 }),
  body('status').optional().isIn(STATUSES),
  body('reviewNote').optional({ nullable: true }).isString().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    }

    const { id } = req.params;
    const existing = await prisma.classifiedAd.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Classified ad not found' });
    }

    const isEditor = ['ADMIN', 'EDITOR'].includes(req.user.role);
    const isOwner = existing.userId === req.user.id;
    if (!isEditor && !isOwner) {
      return res.status(403).json({ success: false, error: 'Not allowed to edit this classified ad' });
    }

    const updateData = {
      ...(req.body.category !== undefined ? { category: req.body.category } : {}),
      ...(req.body.title !== undefined ? { title: req.body.title } : {}),
      ...(req.body.description !== undefined ? { description: req.body.description } : {}),
      ...(req.body.phone !== undefined ? { phone: req.body.phone } : {}),
      ...(req.body.email !== undefined ? { email: req.body.email } : {}),
      ...(req.body.durationDays !== undefined ? { durationDays: Number(req.body.durationDays) } : {}),
      ...(req.body.priceRwf !== undefined ? { priceRwf: Number(req.body.priceRwf) } : {}),
      ...(req.body.attachmentName !== undefined ? { attachmentName: req.body.attachmentName || null } : {}),
      ...(req.body.attachmentUrl !== undefined ? { attachmentUrl: req.body.attachmentUrl || null } : {})
    };

    if (isEditor) {
      if (req.body.status !== undefined) {
        updateData.status = req.body.status;
      }
      if (req.body.reviewNote !== undefined) {
        updateData.reviewNote = req.body.reviewNote || null;
      }
      if (req.body.status !== undefined || req.body.reviewNote !== undefined) {
        updateData.reviewedById = req.user.id;
      }
    }

    const updated = await prisma.classifiedAd.update({
      where: { id },
      data: updateData,
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

    return res.json({ success: true, message: 'Itangazo ryavuguruwe.', data: toResponse(updated) });
  } catch (error) {
    console.error('Edit classified error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update classified ad' });
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

// Targeted dispatch: email + phone links for selected users
router.post('/broadcasts/dispatch', authenticateToken, requireEditor, [
  body('message').trim().isLength({ min: 3, max: 500 }),
  body('userIds').optional().isArray(),
  body('sendEmail').optional().isBoolean(),
  body('sendPhone').optional().isBoolean(),
  body('sendSms').optional().isBoolean(),
  body('subject').optional().isString().isLength({ min: 3, max: 150 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    }

    const { message, userIds = [], sendEmail = true, sendPhone = true, sendSms = true, subject } = req.body;

    const where = {
      isActive: true,
      ...(Array.isArray(userIds) && userIds.length > 0 ? { id: { in: userIds } } : {})
    };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        phone: true
      }
    });

    const created = await prisma.classifiedBroadcast.create({
      data: {
        message,
        createdById: req.user.id
      }
    });

    let emailsSent = 0;
    let emailError = null;

    if (sendEmail) {
      const transporter = getMailTransport();
      if (transporter) {
        const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
        const mailSubject = subject || 'Ubutumwa buvuye kuri Umunsi';
        const emailTargets = users.filter((u) => Boolean(u.email));
        await Promise.allSettled(
          emailTargets.map((target) => transporter.sendMail({
            from: fromAddress,
            to: target.email,
            subject: mailSubject,
            text: message
          }))
        );
        emailsSent = emailTargets.length;
      } else {
        emailError = 'SMTP ntabwo irashyirwaho kuri server.';
      }
    }

    const phoneTargets = sendPhone
      ? users
          .filter((u) => Boolean(u.phone))
          .map((u) => ({
            userId: u.id,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
            phone: u.phone,
            whatsappUrl: `https://wa.me/${normalizePhone(u.phone || '')}?text=${encodeURIComponent(message)}`
          }))
      : [];

    let smsSent = 0;
    let smsError = null;

    if (sendSms) {
      const hasTwilio = Boolean(getTwilioConfig());
      const hasAfricasTalking = Boolean(getAfricasTalkingConfig());

      if (!hasTwilio && !hasAfricasTalking) {
        smsError = 'SMS provider ntabwo irashyirwaho kuri server (Twilio cyangwa Africa\'s Talking).';
      } else {
        const smsTargets = users.filter((u) => Boolean(u.phone));
        const smsResults = await Promise.allSettled(
          smsTargets.map((u) => (hasTwilio ? sendSmsWithTwilio(u.phone, message) : sendSmsWithAfricasTalking(u.phone, message)))
        );
        smsSent = smsResults.filter((r) => r.status === 'fulfilled' && r.value?.ok).length;

        const failed = smsResults.find((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.ok));
        if (failed && !smsError) {
          smsError = hasTwilio
            ? 'Hari SMS zitoherejwe zose. Reba Twilio config cyangwa numero.'
            : 'Hari SMS zitoherejwe zose. Reba Africa\'s Talking config cyangwa numero.';
        }
      }
    }

    return res.json({
      success: true,
      message: 'Broadcast yoherejwe.',
      data: {
        broadcastId: created.id,
        totalTargets: users.length,
        emailsSent,
        emailError,
        smsSent,
        smsError,
        phoneTargets,
        sentAt: created.createdAt
      }
    });
  } catch (error) {
    console.error('Dispatch classifieds broadcast error:', error);
    return res.status(500).json({ success: false, error: 'Failed to dispatch broadcast' });
  }
});

module.exports = router;
