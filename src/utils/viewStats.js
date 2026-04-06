const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../../data/view-stats.json');

const toDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ensureDataFile = () => {
  const dataDir = path.dirname(dataFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFilePath)) {
    const initial = {
      byDate: {},
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(dataFilePath, JSON.stringify(initial, null, 2), 'utf8');
  }
};

const loadStats = () => {
  ensureDataFile();

  try {
    const raw = fs.readFileSync(dataFilePath, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    return {
      byDate: parsed.byDate || {},
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch (error) {
    return {
      byDate: {},
      updatedAt: new Date().toISOString(),
    };
  }
};

const saveStats = (stats) => {
  ensureDataFile();
  fs.writeFileSync(dataFilePath, JSON.stringify(stats, null, 2), 'utf8');
};

const incrementDailyViews = (date = new Date(), amount = 1) => {
  const stats = loadStats();
  const dateKey = toDateKey(date);

  stats.byDate[dateKey] = (stats.byDate[dateKey] || 0) + amount;
  stats.updatedAt = new Date().toISOString();

  // Keep only the last 365 days to prevent unbounded growth.
  const keys = Object.keys(stats.byDate).sort();
  if (keys.length > 365) {
    const keysToDelete = keys.slice(0, keys.length - 365);
    for (const key of keysToDelete) {
      delete stats.byDate[key];
    }
  }

  saveStats(stats);
};

const getTodayViews = () => {
  const stats = loadStats();
  const todayKey = toDateKey(new Date());
  return stats.byDate[todayKey] || 0;
};

const getDailyViews = (days = 7) => {
  const stats = loadStats();
  const result = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const key = toDateKey(day);
    result.push({
      date: key,
      views: stats.byDate[key] || 0,
    });
  }

  return result;
};

module.exports = {
  incrementDailyViews,
  getTodayViews,
  getDailyViews,
};
