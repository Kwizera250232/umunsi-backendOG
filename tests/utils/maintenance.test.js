const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '../../data/maintenance.json');

// Clean state before each test
beforeEach(() => {
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
  }
  // Re-require to reset module state
  jest.resetModules();
});

afterAll(() => {
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
  }
});

describe('maintenance utility', () => {
  let maintenance;

  beforeEach(() => {
    maintenance = require('../../src/utils/maintenance');
  });

  describe('getMaintenanceState', () => {
    it('returns default state when no file exists', () => {
      const state = maintenance.getMaintenanceState();
      expect(state.enabled).toBe(false);
      expect(state.message).toBe(maintenance.DEFAULT_MESSAGE);
      expect(state.updatedAt).toBeDefined();
    });

    it('reads existing state from file', () => {
      const dataDir = path.dirname(STATE_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(STATE_FILE, JSON.stringify({
        enabled: true,
        message: 'Custom message',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }), 'utf8');

      const state = maintenance.getMaintenanceState();
      expect(state.enabled).toBe(true);
      expect(state.message).toBe('Custom message');
      expect(state.updatedAt).toBe('2024-01-01T00:00:00.000Z');
    });

    it('handles corrupted file gracefully', () => {
      const dataDir = path.dirname(STATE_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(STATE_FILE, 'not json', 'utf8');

      const state = maintenance.getMaintenanceState();
      expect(state.enabled).toBe(false);
      expect(state.message).toBe(maintenance.DEFAULT_MESSAGE);
    });
  });

  describe('setMaintenanceState', () => {
    it('enables maintenance mode', () => {
      const result = maintenance.setMaintenanceState({ enabled: true });
      expect(result.enabled).toBe(true);
      expect(result.message).toBe(maintenance.DEFAULT_MESSAGE);

      const persisted = maintenance.getMaintenanceState();
      expect(persisted.enabled).toBe(true);
    });

    it('updates message', () => {
      const result = maintenance.setMaintenanceState({
        enabled: true,
        message: 'Under maintenance',
      });
      expect(result.message).toBe('Under maintenance');
    });

    it('preserves existing fields when partially updating', () => {
      maintenance.setMaintenanceState({ enabled: true, message: 'First' });
      const result = maintenance.setMaintenanceState({ enabled: false });
      expect(result.enabled).toBe(false);
      expect(result.message).toBe('First');
    });

    it('trims whitespace from message', () => {
      const result = maintenance.setMaintenanceState({
        message: '  spaced out  ',
      });
      expect(result.message).toBe('spaced out');
    });

    it('sets updatedAt timestamp', () => {
      const before = new Date().toISOString();
      const result = maintenance.setMaintenanceState({ enabled: true });
      expect(result.updatedAt >= before).toBe(true);
    });
  });
});
