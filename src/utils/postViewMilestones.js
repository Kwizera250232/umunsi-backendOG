const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../../data/post-view-milestones.json');

const DEFAULT_MILESTONES = [100, 200, 500, 1000, 2000, 5000, 10000, 25000, 50000, 100000];

const parseMilestones = () => {
  const raw = String(process.env.POST_VIEW_MILESTONES || '').trim();
  if (!raw) return DEFAULT_MILESTONES;

  const parsed = raw
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);

  if (parsed.length === 0) return DEFAULT_MILESTONES;

  return Array.from(new Set(parsed)).sort((a, b) => a - b);
};

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

const getHighestReachedMilestone = (views) => {
  const milestones = parseMilestones();
  let highest = null;

  for (const milestone of milestones) {
    if (views >= milestone) highest = milestone;
    if (views < milestone) break;
  }

  return highest;
};

const getLastNotifiedMilestone = (postId) => {
  const data = loadData();
  return Number(data.posts?.[postId]?.lastMilestone || 0);
};

const markMilestoneAsSent = (postId, milestone) => {
  const data = loadData();
  const previous = Number(data.posts?.[postId]?.lastMilestone || 0);
  const next = Math.max(previous, Number(milestone) || 0);

  data.posts[postId] = {
    lastMilestone: next,
    updatedAt: new Date().toISOString(),
  };
  data.updatedAt = new Date().toISOString();

  // Keep storage bounded to the most recent 10,000 post entries.
  const keys = Object.keys(data.posts);
  if (keys.length > 10000) {
    const sorted = keys.sort((a, b) => {
      const aDate = new Date(data.posts[a]?.updatedAt || 0).getTime();
      const bDate = new Date(data.posts[b]?.updatedAt || 0).getTime();
      return aDate - bDate;
    });
    for (const key of sorted.slice(0, keys.length - 10000)) {
      delete data.posts[key];
    }
  }

  saveData(data);
};

module.exports = {
  getHighestReachedMilestone,
  getLastNotifiedMilestone,
  markMilestoneAsSent,
  parseMilestones,
};
