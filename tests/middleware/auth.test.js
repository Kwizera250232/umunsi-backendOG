const jwt = require('jsonwebtoken');

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockFindUnique = jest.fn();
  return {
    PrismaClient: jest.fn(() => ({
      user: { findUnique: mockFindUnique },
    })),
    __mockFindUnique: mockFindUnique,
  };
});

const { __mockFindUnique } = require('@prisma/client');

const {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireEditor,
  requireAuthor,
  optionalAuth,
} = require('../../src/middleware/auth');

const JWT_SECRET = 'test-secret';

beforeAll(() => {
  process.env.JWT_SECRET = JWT_SECRET;
});

const mockReq = (overrides = {}) => ({
  headers: {},
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => jest.fn();

describe('auth middleware', () => {
  beforeEach(() => {
    __mockFindUnique.mockReset();
  });

  describe('authenticateToken', () => {
    it('returns 401 when no token is provided', async () => {
      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Access denied' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 for invalid token', async () => {
      const req = mockReq({
        headers: { authorization: 'Bearer invalid-token' },
      });
      const res = mockRes();
      const next = mockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid token' })
      );
    });

    it('returns 401 for expired token', async () => {
      const token = jwt.sign({ userId: '1' }, JWT_SECRET, { expiresIn: '-1s' });
      const req = mockReq({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = mockRes();
      const next = mockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Token expired' })
      );
    });

    it('returns 401 when user not found', async () => {
      __mockFindUnique.mockResolvedValue(null);
      const token = jwt.sign({ userId: '1' }, JWT_SECRET, { expiresIn: '1h' });
      const req = mockReq({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = mockRes();
      const next = mockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 when user is inactive', async () => {
      __mockFindUnique.mockResolvedValue({ id: '1', isActive: false });
      const token = jwt.sign({ userId: '1' }, JWT_SECRET, { expiresIn: '1h' });
      const req = mockReq({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = mockRes();
      const next = mockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('calls next and sets req.user for valid token and active user', async () => {
      const user = {
        id: '1',
        email: 'user@test.com',
        username: 'testuser',
        role: 'ADMIN',
        isActive: true,
        isPremium: false,
        premiumUntil: null,
        avatar: null,
      };
      __mockFindUnique.mockResolvedValue(user);
      const token = jwt.sign({ userId: '1' }, JWT_SECRET, { expiresIn: '1h' });
      const req = mockReq({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = mockRes();
      const next = mockNext();

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual(user);
    });
  });

  describe('requireRole', () => {
    it('returns 401 when no user on request', () => {
      const middleware = requireRole(['ADMIN']);
      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when user role is not in allowed roles', () => {
      const middleware = requireRole(['ADMIN']);
      const req = mockReq({ user: { role: 'USER' } });
      const res = mockRes();
      const next = mockNext();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next when user role is allowed', () => {
      const middleware = requireRole(['ADMIN', 'EDITOR']);
      const req = mockReq({ user: { role: 'EDITOR' } });
      const res = mockRes();
      const next = mockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('allows ADMIN role', () => {
      const req = mockReq({ user: { role: 'ADMIN' } });
      const res = mockRes();
      const next = mockNext();

      requireAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('rejects non-ADMIN role', () => {
      const req = mockReq({ user: { role: 'USER' } });
      const res = mockRes();
      const next = mockNext();

      requireAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireEditor', () => {
    it('allows ADMIN role', () => {
      const req = mockReq({ user: { role: 'ADMIN' } });
      const res = mockRes();
      const next = mockNext();
      requireEditor(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('allows EDITOR role', () => {
      const req = mockReq({ user: { role: 'EDITOR' } });
      const res = mockRes();
      const next = mockNext();
      requireEditor(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('rejects USER role', () => {
      const req = mockReq({ user: { role: 'USER' } });
      const res = mockRes();
      const next = mockNext();
      requireEditor(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireAuthor', () => {
    it('allows AUTHOR role', () => {
      const req = mockReq({ user: { role: 'AUTHOR' } });
      const res = mockRes();
      const next = mockNext();
      requireAuthor(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('rejects USER role', () => {
      const req = mockReq({ user: { role: 'USER' } });
      const res = mockRes();
      const next = mockNext();
      requireAuthor(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('optionalAuth', () => {
    it('continues without setting user when no token', async () => {
      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('sets user when valid token and active user', async () => {
      const user = {
        id: '1',
        email: 'user@test.com',
        username: 'testuser',
        role: 'USER',
        isActive: true,
        isPremium: false,
        premiumUntil: null,
      };
      __mockFindUnique.mockResolvedValue(user);
      const token = jwt.sign({ userId: '1' }, JWT_SECRET, { expiresIn: '1h' });
      const req = mockReq({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = mockRes();
      const next = mockNext();

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual(user);
    });

    it('continues without user when token is invalid', async () => {
      const req = mockReq({
        headers: { authorization: 'Bearer bad-token' },
      });
      const res = mockRes();
      const next = mockNext();

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('continues without user when user is inactive', async () => {
      __mockFindUnique.mockResolvedValue({ id: '1', isActive: false });
      const token = jwt.sign({ userId: '1' }, JWT_SECRET, { expiresIn: '1h' });
      const req = mockReq({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = mockRes();
      const next = mockNext();

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });
  });
});
