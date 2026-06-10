const prisma = require('../database/prisma');
const {
  parsePagination,
  buildPaginationResponse,
  cleanWhere,
  sendError,
  generateSlug,
} = require('../utils/controllerHelpers');

class CategoryController {
  // Get all categories
  async getAllCategories(req, res) {
    try {
      const { page = 1, limit = 10, search, sortBy = 'name', sortOrder = 'asc', includeInactive = 'false' } = req.query;

      const { skip, take } = parsePagination(req.query);

      // Build where clause - only filter by isActive if includeInactive is false
      const where = {
        ...(includeInactive !== 'true' && { isActive: true }),
        OR: search ? [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ] : undefined
      };

      cleanWhere(where);

      const [categories, total] = await Promise.all([
        prisma.category.findMany({
          where,
          include: {
            _count: {
              select: { news: true }
            }
          },
          orderBy: {
            [sortBy]: sortOrder
          },
          skip,
          take
        }),
        prisma.category.count({ where })
      ]);

      res.json({
        success: true,
        categories,
        pagination: buildPaginationResponse(parsePagination(req.query).page, take, total)
      });

    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      sendError(res, 500, 'Failed to fetch categories', error.message);
    }
  }

  // Get single category by ID or slug
  async getCategoryById(req, res) {
    try {
      const { id } = req.params;

      const category = await prisma.category.findFirst({
        where: {
          OR: [
            { id },
            { slug: id }
          ],
          isActive: true
        },
        include: {
          _count: {
            select: { news: true }
          },
          news: {
            where: { status: 'PUBLISHED' },
            take: 5,
            orderBy: { publishedAt: 'desc' },
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      if (!category) {
        return res.status(404).json({
          error: 'Category not found',
          details: 'The requested category could not be found'
        });
      }

      res.json({
        success: true,
        category
      });

    } catch (error) {
      console.error('❌ Error fetching category:', error);
      sendError(res, 500, 'Failed to fetch category', error.message);
    }
  }

  // Create new category
  async createCategory(req, res) {
    try {
      const { name, description, color, icon } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({
          error: 'Missing required fields',
          details: 'Category name is required'
        });
      }

      // Generate slug from name
      const slug = generateSlug(name);

      // Check if slug already exists
      const existingCategory = await prisma.category.findUnique({
        where: { slug }
      });

      if (existingCategory) {
        return res.status(400).json({
          error: 'Category already exists',
          details: 'A category with this name already exists'
        });
      }

      // Create category
      const category = await prisma.category.create({
        data: {
          name: name.trim(),
          slug,
          description: description ? description.trim() : null,
          color: color || '#3B82F6',
          icon: icon || '📁',
          isActive: true
        }
      });

      console.log('✅ Category created successfully:', category.id);

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        category
      });

    } catch (error) {
      console.error('❌ Error creating category:', error);
      sendError(res, 500, 'Failed to create category', error.message);
    }
  }

  // Update category
  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, description, color, icon, isActive } = req.body;

      // Find the category
      const existingCategory = await prisma.category.findFirst({
        where: {
          OR: [
            { id },
            { slug: id }
          ]
        }
      });

      if (!existingCategory) {
        return res.status(404).json({
          error: 'Category not found',
          details: 'The category you are trying to update does not exist'
        });
      }

      // Generate new slug if name changed
      let slug = existingCategory.slug;
      if (name && name !== existingCategory.name) {
        slug = generateSlug(name);
        
        // Check if new slug already exists
        const slugExists = await prisma.category.findFirst({
          where: {
            slug,
            id: { not: existingCategory.id }
          }
        });

        if (slugExists) {
          return res.status(400).json({
            error: 'Name conflict',
            details: 'A category with this name already exists'
          });
        }
      }

      // Update category
      const updatedCategory = await prisma.category.update({
        where: { id: existingCategory.id },
        data: {
          name: name || existingCategory.name,
          slug,
          description: description !== undefined ? description : existingCategory.description,
          color: color || existingCategory.color,
          icon: icon || existingCategory.icon,
          isActive: isActive !== undefined ? isActive : existingCategory.isActive,
          updatedAt: new Date()
        }
      });

      console.log('✅ Category updated successfully:', updatedCategory.id);

      res.json({
        success: true,
        message: 'Category updated successfully',
        category: updatedCategory
      });

    } catch (error) {
      console.error('❌ Error updating category:', error);
      sendError(res, 500, 'Failed to update category', error.message);
    }
  }

  // Delete category
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      // Find the category
      const existingCategory = await prisma.category.findFirst({
        where: {
          OR: [
            { id },
            { slug: id }
          ]
        },
        include: {
          _count: {
            select: { news: true }
          }
        }
      });

      if (!existingCategory) {
        return res.status(404).json({
          error: 'Category not found',
          details: 'The category you are trying to delete does not exist'
        });
      }

      // Check if category has articles
      if (existingCategory._count.news > 0) {
        return res.status(400).json({
          error: 'Cannot delete category',
          details: `This category has ${existingCategory._count.news} articles. Please reassign or delete the articles first.`
        });
      }

      // Delete the category
      await prisma.category.delete({
        where: { id: existingCategory.id }
      });

      console.log('✅ Category deleted successfully:', existingCategory.id);

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });

    } catch (error) {
      console.error('❌ Error deleting category:', error);
      sendError(res, 500, 'Failed to delete category', error.message);
    }
  }

  // Get category statistics
  async getCategoryStats(req, res) {
    try {
      const stats = await prisma.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
          icon: true,
          _count: {
            select: { news: true }
          }
        },
        orderBy: {
          _count: {
            news: 'desc'
          }
        }
      });

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('❌ Error fetching category stats:', error);
      sendError(res, 500, 'Failed to fetch category statistics', error.message);
    }
  }
}

module.exports = new CategoryController();
