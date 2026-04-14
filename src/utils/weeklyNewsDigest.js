const fs = require('fs');
const path = require('path');
const https = require('https');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const prisma = require('../database/prisma');

['.env', '.env.local', '.env.production'].forEach((fileName) => {
  dotenv.config({ path: path.join(__dirname, '../../', fileName), override: false });
});

const DIGEST_STATE_PATH = path.join(__dirname, '../../data/weekly-news-digest.json');
const CHECK_INTERVAL_MS = Number(process.env.WEEKLY_NEWS_CHECK_INTERVAL_MS || 60 * 60 * 1000);
const SUPPORT_PHONE = '0791859465';
const SUPPORT_WHATSAPP = '250791859465';
const DEFAULT_IMAGE = 'https://umunsi.com/images/logo.png';

let schedulerStarted = false;
let intervalHandle = null;

const readState = () => {
  try {
    if (!fs.existsSync(DIGEST_STATE_PATH)) {
      return { lastSentFridayKey: null, history: [] };
    }

    return JSON.parse(fs.readFileSync(DIGEST_STATE_PATH, 'utf8'));
  } catch {
    return { lastSentFridayKey: null, history: [] };
  }
};

const writeState = (nextState) => {
  try {
    fs.mkdirSync(path.dirname(DIGEST_STATE_PATH), { recursive: true });
    fs.writeFileSync(DIGEST_STATE_PATH, JSON.stringify(nextState, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to persist weekly digest state:', error?.message || error);
  }
};

const getFrontendBaseUrl = () => {
  const configured = process.env.FRONTEND_URL || process.env.CLIENT_URL || process.env.APP_URL;
  const normalized = (configured || 'https://umunsi.com').replace(/\/$/, '');
  return normalized.includes('vercel.app') ? 'https://umunsi.com' : normalized;
};

const resolveAssetUrl = (url = '') => {
  const raw = String(url || '').trim();
  if (!raw) return DEFAULT_IMAGE;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  return `${getFrontendBaseUrl()}${raw.startsWith('/') ? raw : `/${raw.replace(/^\.?\//, '')}`}`;
};

const extractFirstImageFromContent = (content = '') => {
  const match = String(content).match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
  return match?.[1] ? match[1].trim() : '';
};

const stripHtml = (content = '') =>
  String(content || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getDateKey = (date = new Date()) => {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return target.toISOString().slice(0, 10);
};

const getFridayKey = (date = new Date()) => {
  const target = new Date(date);
  const day = target.getDay();
  const diff = 5 - day;
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + diff);
  return getDateKey(target);
};

const getMailtrapApiHost = () => process.env.MAILTRAP_API_HOST || 'send.api.mailtrap.io';

const sendViaMailtrapApi = async ({ token, from, to, subject, text, html }) => {
  const payload = JSON.stringify({
    from,
    to: to.map((email) => ({ email })),
    subject,
    text,
    html,
    category: "Amakuru y'icyumweru ya Umunsi"
  });

  const trySend = (headers) =>
    new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: getMailtrapApiHost(),
          path: '/api/send',
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => resolve({ statusCode: res.statusCode, body }));
        }
      );

      req.on('error', reject);
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

const getMailSender = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || user;
  const mailtrapToken = process.env.MAILTRAP_API_TOKEN;
  const senderEmail = process.env.MAILTRAP_SENDER_EMAIL || smtpFrom;
  const senderName = process.env.MAILTRAP_SENDER_NAME || 'Ubutumwa bwa Umunsi';

  const smtpSender = host && user && pass && smtpFrom
    ? {
        provider: 'smtp',
        send: async ({ to, subject, text, html }) => {
          const transport = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass }
          });

          for (const recipient of to) {
            await transport.sendMail({
              from: `${senderName} <${smtpFrom}>`,
              to: recipient,
              subject,
              text,
              html
            });
          }

          return true;
        }
      }
    : null;

  const mailtrapSender = mailtrapToken && senderEmail
    ? {
        provider: 'mailtrap-api',
        send: async ({ to, subject, text, html }) => {
          for (const recipient of to) {
            await sendViaMailtrapApi({
              token: mailtrapToken,
              from: { email: senderEmail, name: senderName },
              to: [recipient],
              subject,
              text,
              html
            });
          }

          return true;
        }
      }
    : null;

  if (smtpSender) return smtpSender;
  if (mailtrapSender) return mailtrapSender;
  return null;
};

const buildArticleUrl = (post) => `${getFrontendBaseUrl()}/post/${post.slug}`;

const formatDigestPosts = (posts = []) => posts.map((post, index) => ({
  ...post,
  rank: index + 1,
  summary: (post.excerpt || stripHtml(post.content || '') || '').slice(0, 160),
  thumbnail: resolveAssetUrl(post.featuredImage || extractFirstImageFromContent(post.content) || DEFAULT_IMAGE),
  articleUrl: buildArticleUrl(post)
}));

const getTopWeeklyPosts = async (limit = 5) => {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  try {
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { publishedAt: { gte: since } },
          { createdAt: { gte: since } }
        ]
      },
      orderBy: [
        { viewCount: 'desc' },
        { publishedAt: 'desc' }
      ],
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        featuredImage: true,
        viewCount: true,
        publishedAt: true,
        createdAt: true
      }
    });

    if (posts.length > 0) {
      return formatDigestPosts(posts);
    }
  } catch (error) {
    console.warn('Weekly digest Prisma fallback activated:', error?.message || error);
  }

  const candidateBases = Array.from(new Set([getFrontendBaseUrl(), 'https://umunsi.com']));
  let posts = [];

  for (const baseUrl of candidateBases) {
    try {
      const response = await fetch(`${baseUrl}/api/posts?limit=50&status=PUBLISHED`);
      if (!response.ok) continue;
      const payload = await response.json();
      const apiPosts = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.posts)
          ? payload.posts
          : [];

      if (apiPosts.length > 0) {
        posts = apiPosts;
        break;
      }
    } catch {
      // Try next candidate URL.
    }
  }

  if (posts.length === 0) {
    throw new Error('Failed to fetch public posts for weekly digest');
  }
  const filtered = posts
    .filter((post) => {
      const referenceDate = new Date(post.publishedAt || post.createdAt || 0);
      return referenceDate.getTime() >= since.getTime();
    })
    .sort((a, b) => Number(b.viewCount || 0) - Number(a.viewCount || 0))
    .slice(0, limit);

  return formatDigestPosts(filtered);
};

const buildDigestText = (posts) => {
  const intro = [
    "AMAKURU Y'ICYUMWERU YA UMUNSI",
    '',
    'Soma inkuru zakunzwe cyane mu cyumweru dusoje.',
    'Ushaka kudutera inkunga, twandikire kuri WhatsApp cyangwa uduhamagare kuri 0791859465.',
    'Inkunga yawe yadufasha gukomeza gushaka amakuru meza.',
    ''
  ];

  const list = posts.flatMap((post) => [
    `${post.rank}. ${post.title}`,
    `Soma hano: ${post.articleUrl}`,
    ''
  ]);

  return [...intro, ...list, 'Murakoze gukomeza kutuba hafi.', 'Itsinda rya Umunsi'].join('\n');
};

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const buildDigestHtml = (posts) => {
  const logoUrl = resolveAssetUrl('/images/logo.png');
  const items = posts.map((post) => `
    <a href="${post.articleUrl}" style="display:block;text-decoration:none;color:#111827;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;margin-bottom:14px;background:#ffffff;">
      <div style="display:flex;gap:14px;align-items:flex-start;padding:14px;">
        <img src="${escapeHtml(post.thumbnail)}" alt="${escapeHtml(post.title)}" style="width:110px;height:78px;object-fit:cover;border-radius:10px;flex-shrink:0;background:#f3f4f6;" />
        <div style="min-width:0;">
          <div style="font-size:12px;color:#2563eb;font-weight:700;margin-bottom:6px;">Inkuru ya ${post.rank} mu zakunzwe cyane</div>
          <div style="font-size:16px;color:#111827;font-weight:700;line-height:1.4;margin-bottom:6px;">${escapeHtml(post.title)}</div>
          <div style="font-size:13px;color:#4b5563;line-height:1.5;">${escapeHtml(post.summary || 'Kanda usome inkuru yuzuye kuri Umunsi.')}</div>
        </div>
      </div>
    </a>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="rw">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="Content-Language" content="rw" />
        <meta name="google" content="notranslate" />
        <title>Amakuru y'icyumweru ya Umunsi</title>
      </head>
      <body style="margin:0;padding:0;">
        <div style="font-family:Arial,sans-serif;background:#f5f7fb;padding:24px 12px;color:#111827;">
          <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
            <div style="background:linear-gradient(135deg,#0f172a,#1d4ed8);padding:28px 22px;color:#ffffff;">
              <div style="margin-bottom:14px;">
                <img src="${escapeHtml(logoUrl)}" alt="Umunsi logo" style="display:block;height:58px;width:auto;max-width:160px;border-radius:12px;background:#ffffff;padding:8px;" />
              </div>
              <div style="font-size:12px;letter-spacing:0.25em;text-transform:uppercase;opacity:0.9;margin-bottom:8px;">Ubutumwa bwa Umunsi</div>
              <h1 style="margin:0;font-size:28px;font-weight:800;">AMAKURU Y'ICYUMWERU YA UMUNSI</h1>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.6;">Soma inkuru 5 zakunzwe cyane mu cyumweru dusoje.</p>
              <p style="margin:10px 0 0;font-size:14px;line-height:1.6;">Ushaka kudutera inkunga, twandikire kuri WhatsApp cyangwa uduhamagare kuri ${SUPPORT_PHONE}. Inkunga yawe yadufasha gukomeza gushaka amakuru meza.</p>
            </div>
            <div style="padding:20px;">
              ${items}
              <div style="margin-top:20px;padding:16px;border-radius:12px;background:#f9fafb;border:1px solid #e5e7eb;">
                <div style="font-size:14px;color:#111827;font-weight:700;margin-bottom:6px;">Dushyigikire</div>
                <div style="font-size:13px;color:#4b5563;line-height:1.6;">Twandikire kuri WhatsApp: <a href="https://wa.me/${SUPPORT_WHATSAPP}" style="color:#1d4ed8;text-decoration:none;">${SUPPORT_PHONE}</a><br />Cyangwa uduhamagare kuri: <a href="tel:${SUPPORT_PHONE}" style="color:#1d4ed8;text-decoration:none;">${SUPPORT_PHONE}</a></div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

const sendWeeklyNewsDigest = async ({ force = false, dryRun = false, onlyEmails = [], skipStateUpdate = false } = {}) => {
  const enabledFlag = String(process.env.ENABLE_WEEKLY_NEWS_DIGEST || 'true').toLowerCase();
  if (!force && ['0', 'false', 'no', 'off'].includes(enabledFlag)) {
    return { success: false, skipped: true, reason: 'Weekly digest disabled' };
  }

  const now = new Date();
  const today = now.getDay();
  const state = readState();
  const fridayKey = getFridayKey(now);
  const sendDateKey = getDateKey(now);

  if (!force && today !== 5) {
    return { success: true, skipped: true, reason: 'Today is not Friday', fridayKey };
  }

  if (!force && state.lastSentFridayKey === fridayKey && state.lastSentOn === sendDateKey) {
    return { success: true, skipped: true, reason: 'Weekly digest already sent for this Friday', fridayKey };
  }

  const posts = await getTopWeeklyPosts(5);
  if (posts.length === 0) {
    return { success: false, skipped: true, reason: 'No published posts found for this week' };
  }

  const recipients = Array.from(new Set(
    onlyEmails.length > 0
      ? onlyEmails.map((email) => String(email).trim().toLowerCase()).filter(Boolean)
      : (await prisma.user.findMany({
          where: {
            isActive: true
          },
          select: { email: true }
        }))
          .map((user) => String(user.email || '').trim().toLowerCase())
          .filter(Boolean)
  ));

  if (recipients.length === 0) {
    return { success: false, skipped: true, reason: 'No active users with email found' };
  }

  const subject = "Amakuru y'icyumweru ya Umunsi - soma inkuru zakunzwe cyane";
  const text = buildDigestText(posts);
  const html = buildDigestHtml(posts);

  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      recipients: recipients.length,
      fridayKey,
      topPosts: posts.map((post) => ({ title: post.title, url: post.articleUrl }))
    };
  }

  const mailSender = getMailSender();
  if (!mailSender) {
    throw new Error('Email service ntabwo irashyirwaho kuri server (SMTP cyangwa Mailtrap API).');
  }

  const batchSize = 50;
  let sentCount = 0;

  for (let index = 0; index < recipients.length; index += batchSize) {
    const batch = recipients.slice(index, index + batchSize);
    await mailSender.send({ to: batch, subject, text, html });
    sentCount += batch.length;
  }

  if (!skipStateUpdate) {
    const nextState = {
      lastSentFridayKey: fridayKey,
      lastSentOn: sendDateKey,
      history: [
        {
          sentAt: now.toISOString(),
          fridayKey,
          recipients: sentCount,
          posts: posts.map((post) => ({ id: post.id, title: post.title, views: post.viewCount }))
        },
        ...(state.history || [])
      ].slice(0, 20)
    };

    writeState(nextState);
  }

  return {
    success: true,
    fridayKey,
    recipients: sentCount,
    provider: mailSender.provider,
    persistentSchedule: !skipStateUpdate,
    topPosts: posts.map((post) => ({ title: post.title }))
  };
};

const startWeeklyNewsScheduler = () => {
  if (schedulerStarted) return intervalHandle;
  schedulerStarted = true;

  setTimeout(() => {
    sendWeeklyNewsDigest().then((result) => {
      if (!result?.skipped) {
        console.log('UMUNSI WEEKLY NEWS result:', result);
      }
    }).catch((error) => {
      console.error('UMUNSI WEEKLY NEWS scheduler failed:', error?.message || error);
    });
  }, 15000);

  intervalHandle = setInterval(() => {
    sendWeeklyNewsDigest().then((result) => {
      if (!result?.skipped) {
        console.log('UMUNSI WEEKLY NEWS result:', result);
      }
    }).catch((error) => {
      console.error('UMUNSI WEEKLY NEWS scheduler failed:', error?.message || error);
    });
  }, CHECK_INTERVAL_MS);

  return intervalHandle;
};

module.exports = {
  sendWeeklyNewsDigest,
  startWeeklyNewsScheduler
};
