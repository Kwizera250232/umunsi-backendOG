#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { Parser } = require('xml2js');
const slugify = require('slugify');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
};

const getArg = (name, fallback = '') => {
  const flag = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(flag));
  return found ? found.slice(flag.length) : fallback;
};

const hasFlag = (name) => process.argv.includes(`--${name}`);

const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const normalizeHtml = (value) => {
  const raw = String(value || '').replace(/\r\n/g, '\n').trim();
  if (!raw) return '';
  return raw;
};

const getFirstImageFromHtml = (html) => {
  if (!html) return null;
  const match = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
  if (!match || !match[1]) return null;
  return normalizeText(match[1]);
};

const extractFeaturedImage = (item, contentHtml) => {
  const attachmentUrl = normalizeText(item['wp:attachment_url']);
  if (attachmentUrl) return attachmentUrl;

  const postMeta = asArray(item['wp:postmeta']);
  for (const meta of postMeta) {
    if (!meta) continue;
    const key = normalizeText(meta['wp:meta_key']);
    const value = normalizeText(meta['wp:meta_value']);
    if (!value) continue;

    if (['_thumbnail_url', 'thumbnail', 'featured_image', '_yoast_wpseo_opengraph-image'].includes(key)) {
      return value;
    }
  }

  return getFirstImageFromHtml(contentHtml);
};

const toDateOrNull = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const splitDisplayName = (displayName = '') => {
  const clean = normalizeText(displayName);
  if (!clean) return { firstName: 'WordPress', lastName: 'Author' };
  const parts = clean.split(' ');
  return {
    firstName: parts[0] || 'WordPress',
    lastName: parts.slice(1).join(' ') || 'Author'
  };
};

const generateUniqueSlug = async (title, preferredSlug = '', currentId = null) => {
  const base = normalizeText(preferredSlug) || slugify(normalizeText(title) || 'post', { lower: true, strict: true });
  let slug = base || `post-${Date.now()}`;
  let counter = 1;

  while (true) {
    const existing = await prisma.post.findFirst({
      where: {
        slug,
        ...(currentId ? { id: { not: currentId } } : {})
      },
      select: { id: true }
    });

    if (!existing) return slug;

    slug = `${base}-${counter}`;
    counter += 1;
  }
};

const ensureCategory = async (categoryName) => {
  const name = normalizeText(categoryName);
  if (!name) return null;

  const slug = slugify(name, { lower: true, strict: true }) || `category-${Date.now()}`;

  const existing = await prisma.category.findFirst({
    where: {
      OR: [{ name }, { slug }]
    }
  });

  if (existing) return existing.id;

  const created = await prisma.category.create({
    data: {
      name,
      slug,
      description: `Imported from WordPress: ${name}`,
      isActive: true
    }
  });

  return created.id;
};

const buildWordPressAuthors = (channel) => {
  const wpAuthors = asArray(channel['wp:author']);
  const byLogin = new Map();
  const byId = new Map();

  for (const rawAuthor of wpAuthors) {
    if (!rawAuthor) continue;
    const normalized = {
      id: normalizeText(rawAuthor['wp:author_id']),
      login: normalizeText(rawAuthor['wp:author_login']),
      email: normalizeText(rawAuthor['wp:author_email']).toLowerCase(),
      displayName: normalizeText(rawAuthor['wp:author_display_name']) || normalizeText(rawAuthor['wp:author_login']),
      firstName: normalizeText(rawAuthor['wp:author_first_name']),
      lastName: normalizeText(rawAuthor['wp:author_last_name'])
    };

    if (normalized.login) byLogin.set(normalized.login.toLowerCase(), normalized);
    if (normalized.id) byId.set(normalized.id, normalized);
  }

  return { byLogin, byId };
};

const ensureAuthorUser = async (wpAuthor, fallbackAuthor) => {
  if (!wpAuthor) return fallbackAuthor;

  const baseUsername = slugify(wpAuthor.login || wpAuthor.displayName || 'wp-author', { lower: true, strict: true }) || `wp-author-${Date.now()}`;
  const safeEmail = wpAuthor.email || `${baseUsername}@imported.umunsi.local`;

  let user = await prisma.user.findUnique({ where: { email: safeEmail } });
  if (user) return user;

  user = await prisma.user.findFirst({ where: { username: baseUsername } });
  if (user) return user;

  let username = baseUsername.slice(0, 30) || `wp${Date.now()}`;
  let suffix = 1;
  while (await prisma.user.findUnique({ where: { username } })) {
    const s = `_${suffix}`;
    username = `${baseUsername.slice(0, Math.max(1, 30 - s.length))}${s}`;
    suffix += 1;
  }

  const randomPassword = await bcrypt.hash(`WpImport!${Date.now()}${Math.random()}`, 10);
  const nameParts = splitDisplayName(wpAuthor.displayName);

  return prisma.user.create({
    data: {
      email: safeEmail,
      username,
      password: randomPassword,
      firstName: wpAuthor.firstName || nameParts.firstName,
      lastName: wpAuthor.lastName || nameParts.lastName,
      role: 'AUTHOR',
      isActive: true
    }
  });
};

const extractTaxonomy = (item, domain) => {
  const categories = asArray(item.category);
  return categories
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === 'string') return null;
      if (entry.$ && entry.$.domain === domain) return normalizeText(entry._ || '');
      return null;
    })
    .filter(Boolean);
};

const main = async () => {
  const fileArg = getArg('file');
  const authorEmail = getArg('authorEmail');
  const forceStatus = (getArg('status') || '').toUpperCase();
  const dryRun = hasFlag('dryRun');

  if (!fileArg) {
    console.error('Usage: npm run import:wordpress -- --file="C:/path/export.xml" [--authorEmail="admin@umunsi.com"] [--status=PUBLISHED|DRAFT] [--dryRun]');
    process.exit(1);
  }

  const filePath = path.resolve(fileArg);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`Reading WordPress export: ${filePath}`);

  const xmlRaw = fs.readFileSync(filePath, 'utf8');
  const parser = new Parser({ explicitArray: false, mergeAttrs: false, trim: true });
  const parsed = await parser.parseStringPromise(xmlRaw);

  const channel = parsed?.rss?.channel;
  if (!channel) {
    throw new Error('Invalid WordPress XML file: missing rss.channel');
  }

  const items = asArray(channel.item);
  const wpAuthors = buildWordPressAuthors(channel);
  const postItems = items.filter((item) => {
    const postType = normalizeText(item['wp:post_type']);
    const status = normalizeText(item['wp:status']);
    return postType === 'post' && !['auto-draft', 'trash', 'inherit'].includes(status);
  });

  if (postItems.length === 0) {
    console.log('No WordPress posts found to import.');
    return;
  }

  let author = null;
  if (authorEmail) {
    author = await prisma.user.findUnique({ where: { email: authorEmail.toLowerCase() } });
  }
  if (!author) {
    author = await prisma.user.findFirst({ where: { role: 'ADMIN', isActive: true }, orderBy: { createdAt: 'asc' } });
  }
  if (!author) {
    author = await prisma.user.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
  }
  if (!author) {
    throw new Error('No active user found to assign imported posts. Create an admin/user first.');
  }

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  console.log(`Found ${postItems.length} posts. Assigning author: ${author.email} (${author.role})`);
  if (dryRun) {
    console.log('Dry run enabled: no database write will happen.');
  }

  for (const item of postItems) {
    const title = normalizeText(item.title);
    const content = normalizeHtml(item['content:encoded'] || '');
    const excerpt = normalizeText(item['excerpt:encoded'] || '');
    const wpStatus = normalizeText(item['wp:status']).toUpperCase();
    const wpSlug = normalizeText(item['wp:post_name']);
    const wpDate = toDateOrNull(item['wp:post_date_gmt'] || item['wp:post_date'] || item.pubDate);
    const wpAuthorLogin = normalizeText(item['dc:creator']).toLowerCase();
    const wpAuthorId = normalizeText(item['wp:post_author']);
    const matchedWpAuthor = wpAuthors.byLogin.get(wpAuthorLogin) || wpAuthors.byId.get(wpAuthorId) || null;

    const resolvedAuthor = dryRun ? (matchedWpAuthor || author) : await ensureAuthorUser(matchedWpAuthor, author);

    if (!title || !content) {
      skipped += 1;
      continue;
    }

    const status = forceStatus || (wpStatus === 'PUBLISH' ? 'PUBLISHED' : 'DRAFT');
    const publishedAt = status === 'PUBLISHED' ? (wpDate || new Date()) : null;
    const createdAt = wpDate || new Date();
    const categoryNames = extractTaxonomy(item, 'category');
    const tagNames = extractTaxonomy(item, 'post_tag');
    const primaryCategory = categoryNames[0] || '';
    const featuredImage = extractFeaturedImage(item, content);

    let categoryId = null;
    if (primaryCategory) {
      categoryId = await ensureCategory(primaryCategory);
    }

    const safeSlug = await generateUniqueSlug(title, wpSlug || slugify(title, { lower: true, strict: true }));

    const existingBySourceSlug = wpSlug
      ? await prisma.post.findFirst({ where: { slug: wpSlug }, select: { id: true, slug: true } })
      : null;

    const payload = {
      title,
      slug: existingBySourceSlug ? existingBySourceSlug.slug : safeSlug,
      content,
      excerpt: excerpt || null,
      featuredImage: featuredImage || null,
      status,
      publishedAt,
      isPremium: false,
      isFeatured: false,
      isPinned: false,
      allowComments: true,
      tags: tagNames.join(','),
      metaTitle: title,
      metaDescription: excerpt || null,
      authorId: resolvedAuthor.id,
      categoryId,
      createdAt
    };

    if (dryRun) {
      console.log(`[DRY RUN] ${title} -> ${payload.slug}`);
      continue;
    }

    if (existingBySourceSlug) {
      await prisma.post.update({ where: { id: existingBySourceSlug.id }, data: payload });
      updated += 1;
    } else {
      await prisma.post.create({ data: payload });
      imported += 1;
    }
  }

  console.log('Import finished.');
  console.log(`Imported: ${imported}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
};

main()
  .catch((error) => {
    console.error('WordPress import failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
