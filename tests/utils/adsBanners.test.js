const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '../../data/ads-banners.json');

beforeEach(() => {
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
  }
  jest.resetModules();
});

afterAll(() => {
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
  }
});

describe('adsBanners utility', () => {
  let adsBanners;

  beforeEach(() => {
    adsBanners = require('../../src/utils/adsBanners');
  });

  describe('getAdsBannersState', () => {
    it('returns default state when no file exists', () => {
      const state = adsBanners.getAdsBannersState();
      expect(state).toHaveProperty('slots');
      expect(state).toHaveProperty('updatedAt');
      expect(state.slots).toHaveProperty('leaderboardTop970x120');
      expect(state.slots).toHaveProperty('sidebar300x250');
    });

    it('all default slots are disabled', () => {
      const state = adsBanners.getAdsBannersState();
      Object.values(state.slots).forEach((slot) => {
        expect(slot.enabled).toBe(false);
        expect(slot.adCode).toBe('');
        expect(slot.imageUrl).toBe('');
        expect(slot.targetUrl).toBe('');
      });
    });

    it('each slot has required properties', () => {
      const state = adsBanners.getAdsBannersState();
      Object.values(state.slots).forEach((slot) => {
        expect(slot).toHaveProperty('enabled');
        expect(slot).toHaveProperty('adCode');
        expect(slot).toHaveProperty('imageUrl');
        expect(slot).toHaveProperty('targetUrl');
        expect(slot).toHaveProperty('altText');
        expect(slot).toHaveProperty('size');
        expect(slot).toHaveProperty('label');
      });
    });

    it('handles corrupted file gracefully', () => {
      const dataDir = path.dirname(STATE_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(STATE_FILE, 'not json', 'utf8');

      const state = adsBanners.getAdsBannersState();
      expect(state).toHaveProperty('slots');
    });
  });

  describe('setAdsBannersState', () => {
    it('enables a specific slot', () => {
      const result = adsBanners.setAdsBannersState({
        slots: {
          sidebar300x250: {
            enabled: true,
            imageUrl: 'https://example.com/ad.png',
            targetUrl: 'https://example.com',
          },
        },
      });

      expect(result.slots.sidebar300x250.enabled).toBe(true);
      expect(result.slots.sidebar300x250.imageUrl).toBe('https://example.com/ad.png');
      expect(result.slots.sidebar300x250.targetUrl).toBe('https://example.com');
    });

    it('persists state to file', () => {
      adsBanners.setAdsBannersState({
        slots: {
          sidebar300x250: { enabled: true },
        },
      });

      // Re-require to confirm persistence
      jest.resetModules();
      const fresh = require('../../src/utils/adsBanners');
      const state = fresh.getAdsBannersState();
      expect(state.slots.sidebar300x250.enabled).toBe(true);
    });

    it('preserves other slots when updating one', () => {
      adsBanners.setAdsBannersState({
        slots: {
          sidebar300x250: { enabled: true },
        },
      });

      const state = adsBanners.getAdsBannersState();
      expect(state.slots.leaderboardTop970x120.enabled).toBe(false);
    });

    it('trims whitespace from string fields', () => {
      const result = adsBanners.setAdsBannersState({
        slots: {
          sidebar300x250: {
            adCode: '  <div>ad</div>  ',
            imageUrl: '  https://example.com/ad.png  ',
          },
        },
      });

      expect(result.slots.sidebar300x250.adCode).toBe('<div>ad</div>');
      expect(result.slots.sidebar300x250.imageUrl).toBe('https://example.com/ad.png');
    });

    it('updates the updatedAt timestamp', () => {
      const before = new Date().toISOString();
      const result = adsBanners.setAdsBannersState({
        slots: { sidebar300x250: { enabled: true } },
      });
      expect(result.updatedAt >= before).toBe(true);
    });
  });
});
