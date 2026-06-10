// Suppress console noise
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockCategory = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => ({ category: mockCategory })),
    __mockCategory: mockCategory,
  };
});

const { __mockCategory } = require('@prisma/client');
const controller = require('../../src/controllers/categoryController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('CategoryController', () => {
  beforeEach(() => {
    Object.values(__mockCategory).forEach((fn) => fn.mockReset());
  });

  describe('getAllCategories', () => {
    it('returns paginated categories', async () => {
      const categories = [
        { id: '1', name: 'Tech', slug: 'tech', _count: { news: 3 } },
        { id: '2', name: 'Sports', slug: 'sports', _count: { news: 5 } },
      ];
      __mockCategory.findMany.mockResolvedValue(categories);
      __mockCategory.count.mockResolvedValue(2);

      const req = { query: { page: '1', limit: '10' } };
      const res = mockRes();

      await controller.getAllCategories(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          categories,
          pagination: expect.objectContaining({
            currentPage: 1,
            totalItems: 2,
          }),
        })
      );
    });

    it('applies search filter', async () => {
      __mockCategory.findMany.mockResolvedValue([]);
      __mockCategory.count.mockResolvedValue(0);

      const req = { query: { page: '1', limit: '10', search: 'tech' } };
      const res = mockRes();

      await controller.getAllCategories(req, res);

      expect(__mockCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'tech', mode: 'insensitive' } }),
            ]),
          }),
        })
      );
    });

    it('handles database errors', async () => {
      __mockCategory.findMany.mockRejectedValue(new Error('DB error'));

      const req = { query: {} };
      const res = mockRes();

      await controller.getAllCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getCategoryById', () => {
    it('returns 404 when category not found', async () => {
      __mockCategory.findFirst.mockResolvedValue(null);

      const req = { params: { id: 'nonexistent' } };
      const res = mockRes();

      await controller.getCategoryById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns category when found', async () => {
      const category = {
        id: '1',
        name: 'Tech',
        slug: 'tech',
        _count: { news: 3 },
        news: [],
      };
      __mockCategory.findFirst.mockResolvedValue(category);

      const req = { params: { id: 'tech' } };
      const res = mockRes();

      await controller.getCategoryById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, category })
      );
    });
  });

  describe('createCategory', () => {
    it('returns 400 when name is missing', async () => {
      const req = { body: {} };
      const res = mockRes();

      await controller.createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Missing required fields' })
      );
    });

    it('returns 400 when category slug already exists', async () => {
      __mockCategory.findUnique.mockResolvedValue({ id: '1', slug: 'tech' });

      const req = { body: { name: 'Tech' } };
      const res = mockRes();

      await controller.createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Category already exists' })
      );
    });

    it('creates category successfully', async () => {
      __mockCategory.findUnique.mockResolvedValue(null);
      __mockCategory.create.mockResolvedValue({
        id: '1',
        name: 'Technology',
        slug: 'technology',
        isActive: true,
      });

      const req = { body: { name: 'Technology', description: 'Tech news' } };
      const res = mockRes();

      await controller.createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('generates correct slug from name', async () => {
      __mockCategory.findUnique.mockResolvedValue(null);
      __mockCategory.create.mockResolvedValue({
        id: '1',
        name: 'Breaking News',
        slug: 'breaking-news',
        isActive: true,
      });

      const req = { body: { name: 'Breaking News' } };
      const res = mockRes();

      await controller.createCategory(req, res);

      expect(__mockCategory.findUnique).toHaveBeenCalledWith({
        where: { slug: 'breaking-news' },
      });
    });

    it('generates slug that strips special characters', async () => {
      __mockCategory.findUnique.mockResolvedValue(null);
      __mockCategory.create.mockResolvedValue({
        id: '1',
        name: 'Sci & Tech!',
        slug: 'sci--tech',
        isActive: true,
      });

      const req = { body: { name: 'Sci & Tech!' } };
      const res = mockRes();

      await controller.createCategory(req, res);

      // The slug should have special chars removed
      expect(__mockCategory.findUnique).toHaveBeenCalledWith({
        where: { slug: expect.stringMatching(/^[a-z0-9-]+$/) },
      });
    });
  });
});
