const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

const getMailTransport = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
};

const canReturnResetLinkInResponse = () => {
  const flag = String(process.env.ALLOW_PASSWORD_RESET_LINK_RESPONSE || '').toLowerCase();
  return flag === '1' || flag === 'true' || flag === 'yes';
};

const getAppBaseUrl = () => {
  const configuredUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || process.env.APP_URL;
  return (configuredUrl || 'https://umunsi.com').replace(/\/$/, '');
};

const buildPasswordResetToken = (user) => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const passwordFingerprint = user.password.slice(-12);

  return jwt.sign(
    {
      userId: user.id,
      type: 'password-reset',
      fp: passwordFingerprint
    },
    secret,
    { expiresIn: process.env.PASSWORD_RESET_EXPIRES_IN || '30m' }
  );
};

const verifyPasswordResetToken = (token) => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.verify(token, secret);
};

const generateVerificationCode = () => String(Math.floor(100000 + Math.random() * 900000));

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
        isPremium: user.isPremium,
        premiumSince: user.premiumSince,
        premiumUntil: user.premiumUntil,
        avatar: user.avatar,
        profileUrl: user.profileUrl,
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
        role,
        authorInviteKey,
        profileUrl,
        bio,
        avatar
      } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          error: 'Missing required fields',
          details: {
            email: !email ? 'Email is required' : null,
            password: !password ? 'Password is required' : null,
            firstName: !firstName ? 'First name is required' : null,
            lastName: !lastName ? 'Last name is required' : null
          }
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const normalizeUsername = (value) => String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '');
      const emailBaseUsername = normalizeUsername(normalizedEmail.split('@')[0]) || 'user';
      const requestedUsername = normalizeUsername(username);

      const buildUniqueUsername = async (baseUsername) => {
        let candidate = (baseUsername || 'user').slice(0, 30);
        if (!candidate) candidate = 'user';

        let index = 0;
        while (true) {
          const existing = await prisma.user.findUnique({
            where: { username: candidate }
          });

          if (!existing) {
            return candidate;
          }

          index += 1;
          const suffix = index === 1
            ? `_${Math.floor(1000 + Math.random() * 9000)}`
            : `_${index}`;
          const allowedLength = Math.max(1, 30 - suffix.length);
          candidate = `${(baseUsername || 'user').slice(0, allowedLength)}${suffix}`;
        }
      };

      const finalUsername = await buildUniqueUsername(requestedUsername || emailBaseUsername);

      // Check if email already exists
      const existingEmail = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });

      if (existingEmail) {
        return res.status(400).json({
          error: 'Email already exists',
          details: 'This email is already registered'
        });
      }

      const requestedRole = typeof role === 'string' ? role.toUpperCase() : 'USER';
      const isAuthorSignup = requestedRole === 'AUTHOR';
      const configuredAuthorInviteKey = process.env.AUTHOR_SIGNUP_KEY || '';

      if (isAuthorSignup) {
        const shouldValidateInviteKey = Boolean(configuredAuthorInviteKey);
        if (shouldValidateInviteKey && authorInviteKey !== configuredAuthorInviteKey) {
          return res.status(403).json({
            error: 'Author signup denied',
            details: 'Invalid author invite key'
          });
        }

        if (!profileUrl || !String(profileUrl).trim()) {
          return res.status(400).json({
            error: 'Missing required fields',
            details: {
              profileUrl: 'Author profile URL is required'
            }
          });
        }
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user account (default role USER, invite-only AUTHOR supported)
      const user = await prisma.user.create({
        data: {
          username: finalUsername,
          email: normalizedEmail,
          password: hashedPassword,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role: isAuthorSignup ? 'AUTHOR' : 'USER',
          bio: bio ? bio.trim() : null,
          profileUrl: profileUrl ? profileUrl.trim() : null,
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
          isPremium: true,
          premiumSince: true,
          premiumUntil: true,
          isActive: true,
          avatar: true,
          profileUrl: true,
          bio: true,
          createdAt: true
        }
      });

      console.log('✅ User registered successfully:', user.username);

      const token = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          username: user.username
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        user,
        token
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
          isPremium: true,
          premiumSince: true,
          premiumUntil: true,
          avatar: true,
          profileUrl: true,
          bio: true,
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
      const { firstName, lastName, avatar, bio, profileUrl } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName: firstName !== undefined ? firstName.trim() : undefined,
          lastName: lastName !== undefined ? lastName.trim() : undefined,
          avatar: avatar !== undefined ? avatar : undefined,
          profileUrl: profileUrl !== undefined ? (profileUrl ? profileUrl.trim() : null) : undefined,
          bio: bio !== undefined ? bio.trim() : undefined,
          updatedAt: new Date()
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          isPremium: true,
          premiumSince: true,
          premiumUntil: true,
          avatar: true,
          profileUrl: true,
          bio: true,
          isActive: true,
          createdAt: true,
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

  // Change password using email + old password (public recovery fallback)
  async changePasswordWithEmail(req, res) {
    try {
      const { email, oldPassword, newPassword } = req.body || {};

      if (!email || !oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          details: 'Email, old password, and new password are required'
        });
      }

      if (String(newPassword).length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: 'New password must be at least 6 characters'
        });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });

      if (!user || !user.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Invalid credentials',
          details: 'Email cyangwa old password si byo'
        });
      }

      const isValidOldPassword = await bcrypt.compare(String(oldPassword), user.password);
      if (!isValidOldPassword) {
        return res.status(400).json({
          success: false,
          error: 'Invalid credentials',
          details: 'Email cyangwa old password si byo'
        });
      }

      const hashedPassword = await bcrypt.hash(String(newPassword), 12);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Ijambo ry\'ibanga ryahinduwe neza.'
      });
    } catch (error) {
      console.error('Change password with email error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to change password',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Start forgot-password flow (returns generic success even when email does not exist)
  async forgotPassword(req, res) {
    try {
      const rawEmail = req.body?.email || '';
      const email = String(rawEmail).trim().toLowerCase();

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          details: 'Email is required'
        });
      }

      const genericSuccessResponse = {
        success: true,
        message: 'Niba email yawe ibarizwa muri sisitemu, twakohereje kode yo guhindura ijambo ry\'ibanga.'
      };

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user || !user.isActive) {
        return res.json(genericSuccessResponse);
      }

      const verificationCode = generateVerificationCode();
      const resetToken = jwt.sign(
        {
          userId: user.id,
          email,
          code: verificationCode,
          type: 'password-reset-code',
          fp: user.password.slice(-12)
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.PASSWORD_RESET_EXPIRES_IN || '30m' }
      );
      const baseUrl = getAppBaseUrl();
      const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
      const transport = getMailTransport();

      const responseWithOptionalLink = {
        ...genericSuccessResponse,
        resetToken,
        ...(canReturnResetLinkInResponse() ? { resetLink } : {})
      };

      if (!transport) {
        console.warn('SMTP is not configured. Password reset link was generated but not emailed.');
        console.warn(`Reset link for ${email}: ${resetLink}`);
        return res.json(responseWithOptionalLink);
      }

      const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

      try {
        await transport.sendMail({
          from: fromAddress,
          to: email,
          subject: 'Umunsi - Hindura ijambo ry\'ibanga',
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
              <h2 style="margin: 0 0 16px;">Guhindura ijambo ry'ibanga</h2>
              <p>Mwiriwe ${user.firstName || user.username || 'User'},</p>
              <p>
                Twabonye ubusabe bwo guhindura ijambo ry'ibanga rya konti yawe kuri Umunsi.
                Koresha iyi kode iri hasi, hanyuma winjize email yawe na password nshya.
              </p>
              <p style="margin: 16px 0; font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #0b0e11; background:#fcd535; display:inline-block; padding:8px 14px; border-radius:8px;">
                ${verificationCode}
              </p>
              <p style="margin: 24px 0;">
                <a href="${resetLink}" style="background:#fcd535;color:#0b0e11;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;">
                  Fungura urupapuro rwo guhindura password
                </a>
              </p>
              <p style="font-size: 14px; color: #4b5563;">
                Iyi link izarangira vuba (default: iminota 30). Niba utari wabisabye, wirengagize iyi email.
              </p>
              <p style="font-size: 13px; color: #6b7280; word-break: break-all;">
                Niba buto itakora, kopiya iri URL muri browser yawe:<br />
                ${resetLink}
              </p>
            </div>
          `
        });
      } catch (mailError) {
        console.error('Failed to send reset email:', mailError);
        return res.json({
          ...responseWithOptionalLink,
          ...(canReturnResetLinkInResponse() ? { debugCode: verificationCode } : {})
        });
      }

      res.json(responseWithOptionalLink);
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process forgot password request',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Complete reset-password flow
  async resetPassword(req, res) {
    try {
      const { token, email, code, password } = req.body || {};

      if (!token || !email || !code || !password) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          details: 'Token, email, code and new password are required'
        });
      }

      if (String(password).length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: 'Password must be at least 6 characters'
        });
      }

      let payload;
      try {
        payload = verifyPasswordResetToken(String(token));
      } catch (verifyError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired token',
          details: 'Please request a new reset link'
        });
      }

      if (!payload || payload.type !== 'password-reset-code' || !payload.userId) {
        return res.status(400).json({
          success: false,
          error: 'Invalid token',
          details: 'Please request a new reset code'
        });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      if (payload.email !== normalizedEmail) {
        return res.status(400).json({
          success: false,
          error: 'Email mismatch',
          details: 'Email ntabwo ihuye na konti yasabiwe reset code'
        });
      }

      if (String(payload.code) !== String(code).trim()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid verification code',
          details: 'Kode wanditse siyo'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId }
      });

      if (!user || !user.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Invalid reset request',
          details: 'Account not found or inactive'
        });
      }

      const currentFingerprint = user.password.slice(-12);
      if (payload.fp !== currentFingerprint) {
        return res.status(400).json({
          success: false,
          error: 'Reset link already used',
          details: 'Please request a new reset link'
        });
      }

      const hashedPassword = await bcrypt.hash(String(password), 12);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Ijambo ry\'ibanga ryahinduwe neza. Ubu ushobora kongera kwinjira.'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset password',
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
