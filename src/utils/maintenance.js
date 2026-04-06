const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const STATE_FILE = path.join(DATA_DIR, 'maintenance.json');
const DEFAULT_MESSAGE = 'Website iri gutunganywa iragaruka mu kanya';

function ensureStateFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(STATE_FILE)) {
    const initialState = {
      enabled: false,
      message: DEFAULT_MESSAGE,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(initialState, null, 2), 'utf8');
  }
}

function getMaintenanceState() {
  ensureStateFile();

  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw);

    return {
      enabled: !!parsed.enabled,
      message: parsed.message || DEFAULT_MESSAGE,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch (error) {
    return {
      enabled: false,
      message: DEFAULT_MESSAGE,
      updatedAt: new Date().toISOString(),
    };
  }
}

function setMaintenanceState(nextState) {
  ensureStateFile();

  const current = getMaintenanceState();
  const merged = {
    ...current,
    ...nextState,
    message: (nextState.message || current.message || DEFAULT_MESSAGE).trim(),
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(STATE_FILE, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}

module.exports = {
  DEFAULT_MESSAGE,
  getMaintenanceState,
  setMaintenanceState,
};
