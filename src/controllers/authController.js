const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

class AuthController {
  // User login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials',
          details: 'Email or password is incorrect'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          error: 'Account disabled',
          details: 'Your account has been disabled. Please contact an administrator.'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid credentials',
          details: 'Email or password is incorrect'
        });
      }

              // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        });

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          role: user.role,
          username: user.username
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Return user data (excluding password)
      const userData = {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        isActive: user.isActive,
        lastLogin: user.lastLogin
      };

      console.log('✅ User logged in successfully:', user.username);

      res.json({
        success: true,
        message: 'Login successful',
        user: userData,
        token
      });

    } catch (error) {
      console.error('❌ Error during login:', error);
      res.status(500).json({
        error: 'Login failed',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // User registration
  async register(req, res) {
    try {
      const {
        username,
        email,
        password,
        firstName,
        lastName,
        bio,
        avatar
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
        where: { email: email.toLowerCase() }
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

      // Create user (default role is AUTHOR)
      const user = await prisma.user.create({
        data: {
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role: 'AUTHOR',
          bio: bio ? bio.trim() : null,
          avatar,
          isActive: true
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

      console.log('✅ User registered successfully:', user.username);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        user
      });

    } catch (error) {
      console.error('❌ Error during registration:', error);
      res.status(500).json({
        error: 'Registration failed',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { news: true }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          details: 'The user profile could not be found'
        });
      }

      res.json({
        success: true,
        user
      });

    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      res.status(500).json({
        error: 'Failed to fetch profile',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update current user profile
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { firstName, lastName, avatar } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName: firstName !== undefined ? firstName.trim() : undefined,
          lastName: lastName !== undefined ? lastName.trim() : undefined,
          avatar: avatar !== undefined ? avatar : undefined,
          updatedAt: new Date()
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          isActive: true,
          updatedAt: true
        }
      });

      console.log('✅ User profile updated successfully:', updatedUser.username);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser
      });

    } catch (error) {
      console.error('❌ Error updating profile:', error);
      res.status(500).json({
        error: 'Failed to update profile',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Change current user password
  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      // Validate required fields
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: 'Missing required fields',
          details: 'Both current and new passwords are required'
        });
      }

      // Get current user with password
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          details: 'The user could not be found'
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({
          error: 'Invalid password',
          details: 'Current password is incorrect'
        });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      });

      console.log('✅ User password changed successfully:', user.username);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('❌ Error changing password:', error);
      res.status(500).json({
        error: 'Failed to change password',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Refresh token
  async refreshToken(req, res) {
    try {
      // Generate a new token with extended expiration
      const newToken = jwt.sign(
        { 
          userId: req.user.id, 
          role: req.user.role,
          username: req.user.username
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token: newToken,
        message: 'Token refreshed successfully'
      });

    } catch (error) {
      console.error('❌ Token refresh error:', error);
      res.status(500).json({
        error: 'Failed to refresh token',
        details: 'Could not refresh authentication token'
      });
    }
  }

  // Logout
  async logout(req, res) {
    try {
      // In a stateless JWT system, logout is handled client-side
      // But we can log the logout event for audit purposes
      console.log('✅ User logged out:', req.user.username);

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('❌ Error during logout:', error);
      res.status(500).json({
        error: 'Logout failed',
        details: 'Could not process logout request'
      });
    }
  }
}

module.exports = new AuthController();
