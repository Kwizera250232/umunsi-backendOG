const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../../data/post-view-milestones.json');

beforeEach(() => {
  if (fs.existsSync(dataFilePath)) {
    fs.unlinkSync(dataFilePath);
  }
  delete process.env.POST_VIEW_MILESTONES;
  jest.resetModules();
});

afterAll(() => {
  if (fs.existsSync(dataFilePath)) {
    fs.unlinkSync(dataFilePath);
  }
});

describe('postViewMilestones utility', () => {
  let milestones;

  beforeEach(() => {
    milestones = require('../../src/utils/postViewMilestones');
  });

  describe('parseMilestones', () => {
    it('returns default milestones when env var is not set', () => {
      const result = milestones.parseMilestones();
      expect(result).toEqual([100, 200, 500, 1000, 2000, 5000, 10000, 25000, 50000, 100000]);
    });

    it('parses custom milestones from env var', () => {
      process.env.POST_VIEW_MILESTONES = '50,100,500';
      jest.resetModules();
      const m = require('../../src/utils/postViewMilestones');
      expect(m.parseMilestones()).toEqual([50, 100, 500]);
    });

    it('deduplicates and sorts milestones', () => {
      process.env.POST_VIEW_MILESTONES = '500,100,500,200';
      jest.resetModules();
      const m = require('../../src/utils/postViewMilestones');
      expect(m.parseMilestones()).toEqual([100, 200, 500]);
    });

    it('ignores invalid values', () => {
      process.env.POST_VIEW_MILESTONES = 'abc,100,-5,200,0';
      jest.resetModules();
      const m = require('../../src/utils/postViewMilestones');
      expect(m.parseMilestones()).toEqual([100, 200]);
    });

    it('returns defaults when all values are invalid', () => {
      process.env.POST_VIEW_MILESTONES = 'abc,xyz';
      jest.resetModules();
      const m = require('../../src/utils/postViewMilestones');
      expect(m.parseMilestones()).toEqual([100, 200, 500, 1000, 2000, 5000, 10000, 25000, 50000, 100000]);
    });
  });

  describe('getHighestReachedMilestone', () => {
    it('returns null when views is 0', () => {
      expect(milestones.getHighestReachedMilestone(0)).toBeNull();
    });

    it('returns null when views are below first milestone', () => {
      expect(milestones.getHighestReachedMilestone(50)).toBeNull();
    });

    it('returns the highest milestone that views exceed', () => {
      expect(milestones.getHighestReachedMilestone(100)).toBe(100);
      expect(milestones.getHighestReachedMilestone(999)).toBe(500);
      expect(milestones.getHighestReachedMilestone(1000)).toBe(1000);
      expect(milestones.getHighestReachedMilestone(99999)).toBe(50000);
      expect(milestones.getHighestReachedMilestone(100000)).toBe(100000);
    });
  });

  describe('getLastNotifiedMilestone', () => {
    it('returns 0 when no data exists for the post', () => {
      expect(milestones.getLastNotifiedMilestone('post-1')).toBe(0);
    });

    it('returns last notified milestone after marking', () => {
      milestones.markMilestoneAsSent('post-1', 500);
      expect(milestones.getLastNotifiedMilestone('post-1')).toBe(500);
    });
  });

  describe('markMilestoneAsSent', () => {
    it('records milestone for a post', () => {
      milestones.markMilestoneAsSent('post-1', 100);
      expect(milestones.getLastNotifiedMilestone('post-1')).toBe(100);
    });

    it('keeps the higher milestone when a lower one is sent later', () => {
      milestones.markMilestoneAsSent('post-1', 500);
      milestones.markMilestoneAsSent('post-1', 100);
      expect(milestones.getLastNotifiedMilestone('post-1')).toBe(500);
    });

    it('updates to higher milestone', () => {
      milestones.markMilestoneAsSent('post-1', 100);
      milestones.markMilestoneAsSent('post-1', 1000);
      expect(milestones.getLastNotifiedMilestone('post-1')).toBe(1000);
    });

    it('handles multiple posts independently', () => {
      milestones.markMilestoneAsSent('post-1', 100);
      milestones.markMilestoneAsSent('post-2', 500);
      expect(milestones.getLastNotifiedMilestone('post-1')).toBe(100);
      expect(milestones.getLastNotifiedMilestone('post-2')).toBe(500);
    });
  });
});
