const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../../data/view-stats.json');

beforeEach(() => {
  if (fs.existsSync(dataFilePath)) {
    fs.unlinkSync(dataFilePath);
  }
  jest.resetModules();
});

afterAll(() => {
  if (fs.existsSync(dataFilePath)) {
    fs.unlinkSync(dataFilePath);
  }
});

describe('viewStats utility', () => {
  let viewStats;

  beforeEach(() => {
    viewStats = require('../../src/utils/viewStats');
  });

  describe('getTodayViews', () => {
    it('returns 0 when no data exists', () => {
      expect(viewStats.getTodayViews()).toBe(0);
    });

    it('returns current day view count after incrementing', () => {
      viewStats.incrementDailyViews(new Date(), 5);
      expect(viewStats.getTodayViews()).toBe(5);
    });
  });

  describe('incrementDailyViews', () => {
    it('increments by 1 by default', () => {
      viewStats.incrementDailyViews();
      expect(viewStats.getTodayViews()).toBe(1);
    });

    it('increments by specified amount', () => {
      viewStats.incrementDailyViews(new Date(), 10);
      expect(viewStats.getTodayViews()).toBe(10);
    });

    it('accumulates multiple increments', () => {
      viewStats.incrementDailyViews(new Date(), 3);
      viewStats.incrementDailyViews(new Date(), 7);
      expect(viewStats.getTodayViews()).toBe(10);
    });

    it('stores different dates separately', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      viewStats.incrementDailyViews(today, 5);
      viewStats.incrementDailyViews(yesterday, 3);

      expect(viewStats.getTodayViews()).toBe(5);
    });

    it('limits storage to 365 days', () => {
      const today = new Date();
      // Add entries for 370 days
      for (let i = 0; i < 370; i++) {
        const day = new Date(today);
        day.setDate(today.getDate() - i);
        viewStats.incrementDailyViews(day, 1);
      }

      const raw = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
      expect(Object.keys(raw.byDate).length).toBeLessThanOrEqual(365);
    });
  });

  describe('getDailyViews', () => {
    it('returns array of daily views for specified days', () => {
      const result = viewStats.getDailyViews(7);
      expect(result).toHaveLength(7);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('views');
    });

    it('includes today as the last element', () => {
      viewStats.incrementDailyViews(new Date(), 42);
      const result = viewStats.getDailyViews(7);
      expect(result[result.length - 1].views).toBe(42);
    });

    it('returns 0 for days with no views', () => {
      const result = viewStats.getDailyViews(3);
      result.forEach((day) => {
        expect(day.views).toBe(0);
      });
    });
  });
});
