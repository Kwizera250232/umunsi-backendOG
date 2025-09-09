const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper function to generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

class CategoryController {
  // Get all categories
  async getAllCategories(req, res) {
    try {
      const { page = 1, limit = 10, search, sortBy = 'name', sortOrder = 'asc' } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // Build where clause
      const where = {
        isActive: true,
        OR: search ? [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ] : undefined
      };

      // Remove undefined values
      Object.keys(where).forEach(key => {
        if (where[key] === undefined) {
          delete where[key];
        }
      });

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

      const totalPages = Math.ceil(total / take);

      res.json({
        success: true,
        categories,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: take
        }
      });

    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      res.status(500).json({
        error: 'Failed to fetch categories',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
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
      res.status(500).json({
        error: 'Failed to fetch category',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
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
      res.status(500).json({
        error: 'Failed to create category',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
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
      res.status(500).json({
        error: 'Failed to update category',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
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
      res.status(500).json({
        error: 'Failed to delete category',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
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
      res.status(500).json({
        error: 'Failed to fetch category statistics',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new CategoryController();
