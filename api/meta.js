const SITE_NAME = 'Umunsi';
const DEFAULT_DESCRIPTION = 'Tukugezaho amakuru yizewe kandi vuba. Kora konte udutere inkunga.';
const DEFAULT_IMAGE = 'https://www.umunsi.com/uploads/media/thumbnails/thumb_files-1775474034682-900314784.jpg';
const DEFAULT_USER_AGENT = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const stripHtml = (value = '') => String(value)
  .replace(/<[^>]*>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const toAbsoluteUrl = (origin, rawPath = '') => {
  if (!rawPath) return DEFAULT_IMAGE;
  if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) return rawPath;
  const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  return `${origin}${normalizedPath}`;
};

const injectMetaTags = (html, metaTags, title = SITE_NAME) => {
  if (!html) return `<!doctype html><html><head><title>${escapeHtml(title)}</title>${metaTags}</head><body><div id="root"></div></body></html>`;

  const patternsToRemove = [
    /<meta\s+property="og:[^"]*"[^>]*>\s*/gi,
    /<meta\s+name="twitter:[^"]*"[^>]*>\s*/gi,
    /<meta\s+name="description"[^>]*>\s*/gi,
    /<link\s+rel="canonical"[^>]*>\s*/gi
  ];

  let cleanedHtml = html;
  patternsToRemove.forEach((pattern) => {
    cleanedHtml = cleanedHtml.replace(pattern, '');
  });

  cleanedHtml = cleanedHtml.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

  if (cleanedHtml.includes('</head>')) {
    return cleanedHtml.replace('</head>', `  ${metaTags}\n</head>`);
  }

  return `${metaTags}${cleanedHtml}`;
};

const buildMetaTags = ({ title, description, imageUrl, canonicalUrl }) => {
  const safeTitle = escapeHtml(title || SITE_NAME);
  const safeDescription = escapeHtml((description || DEFAULT_DESCRIPTION).slice(0, 280));
  const safeImage = escapeHtml(imageUrl || DEFAULT_IMAGE);
  const safeCanonical = escapeHtml(canonicalUrl);

  return `
<meta name="description" content="${safeDescription}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="${SITE_NAME}" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDescription}" />
<meta property="og:image" content="${safeImage}" />
<meta property="og:image:secure_url" content="${safeImage}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${safeCanonical}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDescription}" />
<meta name="twitter:image" content="${safeImage}" />
<link rel="canonical" href="${safeCanonical}" />`;
};

const getRequestOrigin = (req) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'www.umunsi.com';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
};

async function fetchHtmlShell(origin) {
  const response = await fetch(`${origin}/`, {
    headers: {
      'User-Agent': DEFAULT_USER_AGENT,
      Accept: 'text/html,application/xhtml+xml'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to load HTML shell: ${response.status}`);
  }

  return await response.text();
}

async function fetchArticle(origin, identifier) {
  if (!identifier) return null;

  const response = await fetch(`${origin}/api/posts/${encodeURIComponent(identifier)}`, {
    headers: {
      'User-Agent': DEFAULT_USER_AGENT,
      Accept: 'application/json'
    }
  });

  if (!response.ok) return null;

  const payload = await response.json();
  return payload?.data || payload?.post || null;
}

export default async function handler(req, res) {
  const origin = getRequestOrigin(req);
  const slug = typeof req.query.slug === 'string' ? req.query.slug : '';
  const id = typeof req.query.id === 'string' ? req.query.id : '';
  const identifier = slug || id;
  const pathPart = slug ? `/post/${slug}` : id ? `/article/${id}` : '/';
  const canonicalUrl = `${origin}${pathPart}`;

  try {
    const [htmlShell, article] = await Promise.all([
      fetchHtmlShell(origin),
      fetchArticle(origin, identifier)
    ]);

    const description = article?.metaDescription || article?.excerpt || stripHtml(article?.content || '') || DEFAULT_DESCRIPTION;
    const title = article?.metaTitle || article?.title || SITE_NAME;
    const imageUrl = toAbsoluteUrl(origin, article?.featuredImage || DEFAULT_IMAGE);

    const htmlWithMeta = injectMetaTags(
      htmlShell,
      buildMetaTags({ title, description, imageUrl, canonicalUrl }),
      title
    );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(article ? 200 : 404).send(htmlWithMeta);
  } catch (error) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!doctype html><html><head><title>${SITE_NAME}</title></head><body><div id="root"></div></body></html>`);
  }
}
