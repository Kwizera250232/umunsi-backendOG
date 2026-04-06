const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

class UserController {
  // Get all users with pagination and filters
  async getAllUsers(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        role,
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // Build where clause
      const where = {
        role: role || undefined,
        isActive: status === 'active' ? true : status === 'inactive' ? false : undefined,
        OR: search ? [
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } }
        ] : undefined
      };

      // Remove undefined values
      Object.keys(where).forEach(key => {
        if (where[key] === undefined) {
          delete where[key];
        }
      });

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            isVerified: true,
            isPremium: true,
            premiumUntil: true,
            avatar: true,
            bio: true,
            phone: true,
            createdAt: true,
            updatedAt: true,
            lastLogin: true,
            _count: {
              select: { news: true, posts: true }
            }
          },
          orderBy: {
            [sortBy]: sortOrder
          },
          skip,
          take
        }),
        prisma.user.count({ where })
      ]);

      const totalPages = Math.ceil(total / take);

      res.json({
        success: true,
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: take
        }
      });

    } catch (error) {
      console.error('❌ Error fetching users:', error);
      res.status(500).json({
        error: 'Failed to fetch users',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get single user by ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          isVerified: true,
          isPremium: true,
          premiumUntil: true,
          avatar: true,
          bio: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
          _count: {
            select: { news: true, posts: true }
          },
          news: {
            where: { status: 'PUBLISHED' },
            take: 10,
            orderBy: { publishedAt: 'desc' },
            select: {
              id: true,
              title: true,
              slug: true,
              excerpt: true,
              featuredImage: true,
              publishedAt: true,
              viewCount: true,
              likeCount: true,
              isFeatured: true,
              isBreaking: true,
              isTrending: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          details: 'The requested user could not be found'
        });
      }

      res.json({
        success: true,
        user
      });

    } catch (error) {
      console.error('❌ Error fetching user:', error);
      res.status(500).json({
        error: 'Failed to fetch user',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Create new user
  async createUser(req, res) {
    try {
      const {
        username,
        email,
        password,
        firstName,
        lastName,
        role = 'AUTHOR',
        bio,
        avatar,
        phone,
        isVerified = false
      } = req.body;

      // Validate required fields
      if (!username || !email || !password || !firstName || !lastName) {
        return res.status(400).json({
          error: 'Missing required fields',
          details: {
            username: !username ? 'Username is required' : null,
            email: !email ? 'Email is required' : null,
            password: !password ? 'Password is required' : null,
            firstName: !firstName ? 'First name is required' : null,
            lastName: !lastName ? 'Last name is required' : null
          }
        });
      }

      // Check if username already exists
      const existingUsername = await prisma.user.findUnique({
        where: { username }
      });

      if (existingUsername) {
        return res.status(400).json({
          error: 'Username already exists',
          details: 'Please choose a different username'
        });
      }

      // Check if email already exists
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      });

      if (existingEmail) {
        return res.status(400).json({
          error: 'Email already exists',
          details: 'This email is already registered'
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role: role.toUpperCase(),
          bio: bio ? bio.trim() : null,
          avatar,
          phone: phone ? phone.trim() : null,
          isActive: true,
          isVerified
        },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          avatar: true,
          bio: true,
          createdAt: true
        }
      });

      console.log('✅ User created successfully:', user.id);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user
      });

    } catch (error) {
      console.error('❌ Error creating user:', error);
      res.status(500).json({
        error: 'Failed to create user',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update user
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const {
        username,
        email,
        firstName,
        lastName,
        role,
        bio,
        avatar,
        phone,
        isActive,
        isVerified,
        isPremium,
        premiumUntil
      } = req.body;

      // Find the user
      const existingUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        return res.status(404).json({
          error: 'User not found',
          details: 'The user you are trying to update does not exist'
        });
      }

      // Check permissions (only admin can change roles, users can update their own profile)
      if (req.user.role !== 'ADMIN' && req.user.id !== id) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          details: 'You can only update your own profile'
        });
      }

      // Only admin can change roles
      if (role && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          error: 'Insufficient permissions',
          details: 'Only administrators can change user roles'
        });
      }

      // Check if username already exists (if changed)
      if (username && username !== existingUser.username) {
        const existingUsername = await prisma.user.findUnique({
          where: { username }
        });

        if (existingUsername) {
          return res.status(400).json({
            error: 'Username already exists',
            details: 'Please choose a different username'
          });
        }
      }

      // Check if email already exists (if changed)
      if (email && email !== existingUser.email) {
        const existingEmail = await prisma.user.findUnique({
          where: { email }
        });

        if (existingEmail) {
          return res.status(400).json({
            error: 'Email already exists',
            details: 'This email is already registered'
          });
        }
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          username: username || existingUser.username,
          email: email ? email.trim().toLowerCase() : existingUser.email,
          firstName: firstName || existingUser.firstName,
          lastName: lastName || existingUser.lastName,
          role: role ? role.toUpperCase() : existingUser.role,
          bio: bio !== undefined ? bio : existingUser.bio,
          avatar: avatar !== undefined ? avatar : existingUser.avatar,
          phone: phone !== undefined ? phone : existingUser.phone,
          isActive: isActive !== undefined ? isActive : existingUser.isActive,
          isVerified: isVerified !== undefined ? isVerified : existingUser.isVerified,
          isPremium: isPremium !== undefined ? isPremium : existingUser.isPremium,
          premiumUntil: premiumUntil !== undefined ? (premiumUntil ? new Date(premiumUntil) : null) : existingUser.premiumUntil,
          updatedAt: new Date()
        },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          isPremium: true,
          premiumUntil: true,
          avatar: true,
          bio: true,
          updatedAt: true
        }
      });

      console.log('✅ User updated successfully:', updatedUser.id);

      res.json({
        success: true,
        message: 'User updated successfully',
        user: updatedUser
      });

    } catch (error) {
      console.error('❌ Error updating user:', error);
      res.status(500).json({
        error: 'Failed to update user',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Delete user
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Find the user
      const existingUser = await prisma.user.findUnique({
        where: { id },
        include: {
          _count: {
            select: { news: true }
          }
        }
      });

      if (!existingUser) {
        return res.status(404).json({
          error: 'User not found',
          details: 'The user you are trying to delete does not exist'
        });
      }

      // Check permissions (only admin can delete users)
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
          error: 'Insufficient permissions',
          details: 'Only administrators can delete users'
        });
      }

      // Prevent self-deletion
      if (req.user.id === id) {
        return res.status(400).json({
          error: 'Cannot delete yourself',
          details: 'You cannot delete your own account'
        });
      }

      // Check if user has articles
      if (existingUser._count.news > 0) {
        return res.status(400).json({
          error: 'Cannot delete user',
          details: `This user has ${existingUser._count.news} articles. Please reassign or delete the articles first.`
        });
      }

      // Delete the user
      await prisma.user.delete({
        where: { id }
      });

      console.log('✅ User deleted successfully:', existingUser.id);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      console.error('❌ Error deleting user:', error);
      res.status(500).json({
        error: 'Failed to delete user',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get user statistics
  async getUserStats(req, res) {
    try {
      const stats = await prisma.user.groupBy({
        by: ['role'],
        where: { isActive: true },
          _count: {
          id: true
        }
      });

      const totalUsers = await prisma.user.count({
        where: { isActive: true }
      });

      const recentUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      res.json({
        success: true,
        stats: {
          total: totalUsers,
          byRole: stats,
          recent: recentUsers
        }
      });

    } catch (error) {
      console.error('❌ Error fetching user stats:', error);
      res.status(500).json({
        error: 'Failed to fetch user statistics',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update user password
  async updatePassword(req, res) {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      // Validate required fields
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: 'Missing required fields',
          details: 'Both current and new passwords are required'
        });
      }

      // Find the user
      const existingUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        return res.status(404).json({
          error: 'User not found',
          details: 'The user could not be found'
        });
      }

      // Check permissions (users can only change their own password)
      if (req.user.id !== id) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          details: 'You can only change your own password'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, existingUser.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          error: 'Invalid current password',
          details: 'The current password is incorrect'
        });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await prisma.user.update({
        where: { id },
        data: {
          password: hashedNewPassword,
          updatedAt: new Date()
        }
      });

      console.log('✅ User password updated successfully:', existingUser.id);

      res.json({
        success: true,
        message: 'Password updated successfully'
      });

    } catch (error) {
      console.error('❌ Error updating password:', error);
      res.status(500).json({
        error: 'Failed to update password',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new UserController();
