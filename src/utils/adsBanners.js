const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const STATE_FILE = path.join(DATA_DIR, 'ads-banners.json');

const defaultSlot = (size, label) => ({
  enabled: false,
  imageUrl: '',
  targetUrl: '',
  altText: label,
  size,
  label
});

const DEFAULT_STATE = {
  updatedAt: new Date().toISOString(),
  slots: {
    leaderboardTop970x120: defaultSlot('970x120', 'Leaderboard Banner (Top)'),
    business728x250: defaultSlot('728x250', "Ahantu h'Ubucuruzi"),
    sidebar300x250: defaultSlot('300x250', 'GIF / Banner Ad'),
    square300x300: defaultSlot('300x300', 'Square Ad'),
    skyscraper300x600: defaultSlot('300x600', 'Skyscraper Ad'),
    leaderboardBottom970x120: defaultSlot('970x120', 'Leaderboard Banner (Bottom)')
  }
};

function ensureStateFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(DEFAULT_STATE, null, 2), 'utf8');
  }
}

function normalizeState(input = {}) {
  const slots = input.slots || {};
  const normalizedSlots = {};

  Object.keys(DEFAULT_STATE.slots).forEach((key) => {
    const defaults = DEFAULT_STATE.slots[key];
    const next = slots[key] || {};

    normalizedSlots[key] = {
      ...defaults,
      enabled: !!next.enabled,
      imageUrl: (next.imageUrl || '').trim(),
      targetUrl: (next.targetUrl || '').trim(),
      altText: (next.altText || defaults.altText).trim(),
      size: defaults.size,
      label: defaults.label
    };
  });

  return {
    updatedAt: input.updatedAt || new Date().toISOString(),
    slots: normalizedSlots
  };
}

function getAdsBannersState() {
  ensureStateFile();

  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch (error) {
    return normalizeState(DEFAULT_STATE);
  }
}

function setAdsBannersState(nextState) {
  ensureStateFile();

  const merged = normalizeState({
    ...getAdsBannersState(),
    ...nextState,
    updatedAt: new Date().toISOString()
  });

  fs.writeFileSync(STATE_FILE, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}

module.exports = {
  getAdsBannersState,
  setAdsBannersState
};
