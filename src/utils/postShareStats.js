const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../../data/post-share-stats.json');

const ensureDataFile = () => {
  const dataDir = path.dirname(dataFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFilePath)) {
    const initial = {
      posts: {},
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(dataFilePath, JSON.stringify(initial, null, 2), 'utf8');
  }
};

const loadData = () => {
  ensureDataFile();

  try {
    const raw = fs.readFileSync(dataFilePath, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    return {
      posts: parsed.posts || {},
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return {
      posts: {},
      updatedAt: new Date().toISOString(),
    };
  }
};

const saveData = (data) => {
  ensureDataFile();
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
};

const normalizePlatform = (platform = '') => {
  const normalized = String(platform).trim().toLowerCase();
  if (!normalized) return 'other';
  if (['facebook', 'whatsapp', 'twitter', 'x', 'linkedin', 'copy', 'native'].includes(normalized)) {
    return normalized === 'x' ? 'twitter' : normalized;
  }
  return 'other';
};

const getPostShareStats = (postId) => {
  if (!postId) {
    return { total: 0, byPlatform: {} };
  }

  const data = loadData();
  const entry = data.posts?.[postId];

  return {
    total: Number(entry?.total || 0),
    byPlatform: entry?.byPlatform || {},
    updatedAt: entry?.updatedAt || null,
  };
};

const incrementPostShareStats = (postId, platform = 'other') => {
  if (!postId) {
    return { total: 0, byPlatform: {} };
  }

  const data = loadData();
  const normalizedPlatform = normalizePlatform(platform);
  const current = data.posts?.[postId] || { total: 0, byPlatform: {}, updatedAt: null };
  const nextTotal = Number(current.total || 0) + 1;
  const nextPlatformCount = Number(current.byPlatform?.[normalizedPlatform] || 0) + 1;

  data.posts[postId] = {
    total: nextTotal,
    byPlatform: {
      ...(current.byPlatform || {}),
      [normalizedPlatform]: nextPlatformCount,
    },
    updatedAt: new Date().toISOString(),
  };
  data.updatedAt = new Date().toISOString();

  saveData(data);

  return {
    total: nextTotal,
    byPlatform: data.posts[postId].byPlatform,
    updatedAt: data.posts[postId].updatedAt,
  };
};

const getAllPostShareStats = () => {
  const data = loadData();
  const posts = data.posts || {};
  const byPlatform = {};
  let total = 0;

  Object.values(posts).forEach((entry = {}) => {
    total += Number(entry.total || 0);

    Object.entries(entry.byPlatform || {}).forEach(([platform, count]) => {
      byPlatform[platform] = Number(byPlatform[platform] || 0) + Number(count || 0);
    });
  });

  return {
    total,
    byPlatform,
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
};

module.exports = {
  getPostShareStats,
  getAllPostShareStats,
  incrementPostShareStats,
  normalizePlatform,
};
