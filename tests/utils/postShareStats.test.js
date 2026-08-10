const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../../data/post-share-stats.json');

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

describe('postShareStats utility', () => {
  let shareStats;

  beforeEach(() => {
    shareStats = require('../../src/utils/postShareStats');
  });

  describe('normalizePlatform', () => {
    it('normalizes known platforms', () => {
      expect(shareStats.normalizePlatform('Facebook')).toBe('facebook');
      expect(shareStats.normalizePlatform('WHATSAPP')).toBe('whatsapp');
      expect(shareStats.normalizePlatform('Twitter')).toBe('twitter');
      expect(shareStats.normalizePlatform('linkedin')).toBe('linkedin');
      expect(shareStats.normalizePlatform('copy')).toBe('copy');
      expect(shareStats.normalizePlatform('native')).toBe('native');
    });

    it('normalizes "x" to "twitter"', () => {
      expect(shareStats.normalizePlatform('x')).toBe('twitter');
      expect(shareStats.normalizePlatform('X')).toBe('twitter');
    });

    it('returns "other" for unknown platforms', () => {
      expect(shareStats.normalizePlatform('telegram')).toBe('other');
      expect(shareStats.normalizePlatform('email')).toBe('other');
    });

    it('returns "other" for empty/falsy input', () => {
      expect(shareStats.normalizePlatform('')).toBe('other');
      expect(shareStats.normalizePlatform(undefined)).toBe('other');
      expect(shareStats.normalizePlatform(null)).toBe('other');
    });
  });

  describe('getPostShareStats', () => {
    it('returns zeros for unknown post', () => {
      const stats = shareStats.getPostShareStats('post-1');
      expect(stats.total).toBe(0);
      expect(stats.byPlatform).toEqual({});
    });

    it('returns zeros for falsy postId', () => {
      const stats = shareStats.getPostShareStats(null);
      expect(stats.total).toBe(0);
    });
  });

  describe('incrementPostShareStats', () => {
    it('increments share count for a post', () => {
      const result = shareStats.incrementPostShareStats('post-1', 'facebook');
      expect(result.total).toBe(1);
      expect(result.byPlatform.facebook).toBe(1);
    });

    it('accumulates shares across platforms', () => {
      shareStats.incrementPostShareStats('post-1', 'facebook');
      shareStats.incrementPostShareStats('post-1', 'twitter');
      const result = shareStats.incrementPostShareStats('post-1', 'facebook');
      expect(result.total).toBe(3);
      expect(result.byPlatform.facebook).toBe(2);
      expect(result.byPlatform.twitter).toBe(1);
    });

    it('returns zeros for falsy postId', () => {
      const result = shareStats.incrementPostShareStats(null, 'facebook');
      expect(result.total).toBe(0);
    });

    it('defaults platform to "other"', () => {
      const result = shareStats.incrementPostShareStats('post-1');
      expect(result.byPlatform.other).toBe(1);
    });
  });

  describe('getAllPostShareStats', () => {
    it('returns aggregate stats across all posts', () => {
      shareStats.incrementPostShareStats('post-1', 'facebook');
      shareStats.incrementPostShareStats('post-1', 'twitter');
      shareStats.incrementPostShareStats('post-2', 'facebook');

      const all = shareStats.getAllPostShareStats();
      expect(all.total).toBe(3);
      expect(all.byPlatform.facebook).toBe(2);
      expect(all.byPlatform.twitter).toBe(1);
    });

    it('returns zeros when no data', () => {
      const all = shareStats.getAllPostShareStats();
      expect(all.total).toBe(0);
      expect(all.byPlatform).toEqual({});
    });
  });
});
