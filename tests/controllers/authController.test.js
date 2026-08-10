const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockUser = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => ({ user: mockUser })),
    __mockUser: mockUser,
  };
});

// Suppress console.log/error noise from controller
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  })),
}));

const { __mockUser } = require('@prisma/client');

const JWT_SECRET = 'test-secret-key';

beforeAll(() => {
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.JWT_EXPIRES_IN = '7d';
});

// The module exports a singleton instance
const controller = require('../../src/controllers/authController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('AuthController', () => {
  beforeEach(() => {
    Object.values(__mockUser).forEach((fn) => fn.mockReset());
  });

  describe('login', () => {
    it('returns 400 for missing email', async () => {
      const req = { body: { password: 'pass' } };
      const res = mockRes();

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Missing credentials' })
      );
    });

    it('returns 400 for missing password', async () => {
      const req = { body: { email: 'user@test.com' } };
      const res = mockRes();

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 401 when user not found', async () => {
      __mockUser.findUnique.mockResolvedValue(null);
      const req = { body: { email: 'user@test.com', password: 'pass' } };
      const res = mockRes();

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid credentials' })
      );
    });

    it('returns 401 when user is inactive', async () => {
      __mockUser.findUnique.mockResolvedValue({
        id: '1',
        email: 'user@test.com',
        password: await bcrypt.hash('pass', 10),
        isActive: false,
        role: 'USER',
      });
      const req = { body: { email: 'user@test.com', password: 'pass' } };
      const res = mockRes();

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Account disabled' })
      );
    });

    it('returns 401 for wrong password', async () => {
      __mockUser.findUnique.mockResolvedValue({
        id: '1',
        email: 'user@test.com',
        password: await bcrypt.hash('correct-pass', 10),
        isActive: true,
        role: 'USER',
      });
      const req = { body: { email: 'user@test.com', password: 'wrong-pass' } };
      const res = mockRes();

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid credentials' })
      );
    });

    it('returns token and user data on successful login', async () => {
      const hashedPassword = await bcrypt.hash('correct-pass', 10);
      __mockUser.findUnique.mockResolvedValue({
        id: '1',
        email: 'user@test.com',
        username: 'testuser',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        isActive: true,
        isPremium: false,
        premiumSince: null,
        premiumUntil: null,
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      __mockUser.update.mockResolvedValue({});

      const req = { body: { email: 'user@test.com', password: 'correct-pass' } };
      const res = mockRes();

      await controller.login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: expect.any(String),
          user: expect.objectContaining({
            id: '1',
            email: 'user@test.com',
          }),
        })
      );
    });

    it('normalizes email to lowercase', async () => {
      __mockUser.findUnique.mockResolvedValue(null);
      const req = { body: { email: '  USER@Test.Com  ', password: 'pass' } };
      const res = mockRes();

      await controller.login(req, res);

      expect(__mockUser.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'user@test.com' },
        })
      );
    });
  });

  describe('register', () => {
    it('returns 400 for missing required fields', async () => {
      const req = { body: { email: 'test@test.com' } };
      const res = mockRes();

      await controller.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when email already exists', async () => {
      // buildUniqueUsername calls findUnique for username check first, then for email check
      __mockUser.findUnique
        .mockResolvedValueOnce(null) // username check passes
        .mockResolvedValueOnce({ id: '1', email: 'test@test.com' }); // email already exists

      const req = {
        body: {
          email: 'test@test.com',
          username: 'testuser',
          password: 'Password123',
          firstName: 'Test',
          lastName: 'User',
        },
      };
      const res = mockRes();

      await controller.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Email already exists' })
      );
    });

    it('creates user successfully', async () => {
      // buildUniqueUsername findUnique (username) -> null, then email check -> null
      __mockUser.findUnique
        .mockResolvedValueOnce(null) // username available
        .mockResolvedValueOnce(null); // email not taken
      __mockUser.create.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        isActive: true,
        isPremium: false,
        premiumSince: null,
        premiumUntil: null,
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = {
        body: {
          email: 'test@test.com',
          username: 'testuser',
          password: 'Password123',
          firstName: 'Test',
          lastName: 'User',
        },
      };
      const res = mockRes();

      await controller.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: expect.any(String),
        })
      );
    });
  });

  describe('getProfile', () => {
    it('returns 500 when user not authenticated (no req.user)', async () => {
      const req = {};
      const res = mockRes();

      await controller.getProfile(req, res);

      // Controller doesn't guard against missing req.user - it throws and returns 500
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('returns user profile', async () => {
      __mockUser.findUnique.mockResolvedValue({
        id: '1',
        email: 'user@test.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        isActive: true,
        isPremium: false,
        premiumSince: null,
        premiumUntil: null,
        avatar: null,
        bio: 'Hello',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { news: 5 },
      });

      const req = { user: { id: '1' } };
      const res = mockRes();

      await controller.getProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          user: expect.objectContaining({ id: '1' }),
        })
      );
    });
  });
});
