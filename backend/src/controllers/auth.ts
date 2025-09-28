import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { prisma } from '@/config/database'
import { redis } from '@/config/redis'
import { logger } from '@/utils/logger'
import { generateToken, generateRefreshToken, verifyToken, blacklistToken } from '@/middleware/auth'
import { 
  AuthenticationError, 
  ValidationError, 
  ConflictError, 
  NotFoundError 
} from '@/middleware/error-handler'
import { EmailService } from '@/services/email'
import { UserRole } from '@prisma/client'

const emailService = new EmailService()
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12')

export class AuthController {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response) {
    const { email, password, firstName, lastName, role } = req.body

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new ConflictError('User with this email already exists')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role.toUpperCase() as UserRole,
        profile: {
          create: {
            preferences: {
              theme: 'system',
              language: 'en',
              notifications: {
                email: true,
                push: true,
                courseUpdates: true,
                aiAgentAlerts: true,
                billingAlerts: true,
              },
              aiSettings: {
                preferredModel: 'gpt-4',
                temperature: 0.7,
                maxTokens: 2000,
                enabledAgents: ['ARCHITECT', 'WRITING', 'RESEARCH'],
              },
            },
          },
        },
        subscription: {
          create: {
            plan: 'FREE',
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        },
      },
      include: {
        profile: true,
        subscription: true,
      },
    })

    // Generate tokens
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const refreshToken = generateRefreshToken(user.id)

    // Store refresh token in database
    await prisma.userSession.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })

    // Send verification email (async, don't wait)
    const verificationToken = crypto.randomBytes(32).toString('hex')
    await redis.set(`email_verification:${verificationToken}`, user.id, 24 * 60 * 60) // 24 hours

    emailService.sendVerificationEmail(user.email, verificationToken, `${user.firstName} ${user.lastName}`)
      .catch(error => logger.error('Failed to send verification email:', error))

    // Log registration
    logger.business('user_registered', {
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Remove password from response
    const { password: _, ...userResponse } = user

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token,
        refreshToken,
      },
    })
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response) {
    const { email, password } = req.body

    // Find user with profile and subscription
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        subscription: true,
        organization: {
          include: {
            organization: true,
          },
        },
      },
    })

    if (!user) {
      throw new AuthenticationError('Invalid email or password')
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated')
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password')
    }

    // Generate tokens
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization?.organizationId,
    })

    const refreshToken = generateRefreshToken(user.id)

    // Store refresh token in database
    await prisma.userSession.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })

    // Update user cache
    await redis.cache.set(`user:${user.id}`, user, 60 * 60) // 1 hour

    // Log login
    logger.business('user_login', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    })

    // Remove password from response
    const { password: _, ...userResponse } = user

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token,
        refreshToken,
      },
    })
  }

  /**
   * Logout user
   */
  async logout(req: Request, res: Response) {
    const token = req.headers.authorization?.substring(7) // Remove 'Bearer '
    const userId = req.user!.id

    if (token) {
      // Blacklist the current token
      await blacklistToken(token)
    }

    // Remove all user sessions (optional - for logout from all devices)
    // await prisma.userSession.deleteMany({
    //   where: { userId },
    // })

    // Clear user cache
    await redis.del(`user:${userId}`)

    // Log logout
    logger.business('user_logout', {
      userId,
      ip: req.ip,
    })

    res.json({
      success: true,
      message: 'Logout successful',
    })
  }

  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body

    if (!refreshToken) {
      throw new AuthenticationError('Refresh token is required')
    }

    try {
      // Verify refresh token
      const decoded = verifyToken(refreshToken) as any
      
      if (decoded.type !== 'refresh') {
        throw new AuthenticationError('Invalid token type')
      }

      // Check if refresh token exists in database
      const session = await prisma.userSession.findFirst({
        where: {
          token: refreshToken,
          userId: decoded.userId,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: {
            include: {
              profile: true,
              subscription: true,
              organization: {
                include: {
                  organization: true,
                },
              },
            },
          },
        },
      })

      if (!session) {
        throw new AuthenticationError('Invalid or expired refresh token')
      }

      const user = session.user

      if (!user.isActive) {
        throw new AuthenticationError('Account is deactivated')
      }

      // Generate new tokens
      const newToken = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organization?.organizationId,
      })

      const newRefreshToken = generateRefreshToken(user.id)

      // Update session with new refresh token
      await prisma.userSession.update({
        where: { id: session.id },
        data: {
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      })

      // Update user cache
      await redis.cache.set(`user:${user.id}`, user, 60 * 60) // 1 hour

      // Remove password from response
      const { password: _, ...userResponse } = user

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user: userResponse,
          token: newToken,
          refreshToken: newRefreshToken,
        },
      })
    } catch (error) {
      throw new AuthenticationError('Invalid or expired refresh token')
    }
  }

  /**
   * Get current user profile
   */
  async getMe(req: Request, res: Response) {
    const userId = req.user!.id

    // Try to get user from cache first
    let user = await redis.cache.get(`user:${userId}`)

    if (!user) {
      // Get from database
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          subscription: true,
          organization: {
            include: {
              organization: true,
            },
          },
        },
      })

      if (!user) {
        throw new NotFoundError('User not found')
      }

      // Cache for future requests
      await redis.cache.set(`user:${userId}`, user, 60 * 60) // 1 hour
    }

    // Remove password from response
    const { password: _, ...userResponse } = user

    res.json({
      success: true,
      message: 'User profile retrieved successfully',
      data: userResponse,
    })
  }

  /**
   * Forgot password - send reset email
   */
  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    })

    // Always return success to prevent email enumeration
    if (!user || !user.isActive) {
      res.json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent',
      })
      return
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    
    // Store reset token in Redis with 1 hour expiry
    await redis.set(`password_reset:${resetToken}`, user.id, 60 * 60) // 1 hour

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        `${user.firstName} ${user.lastName}`
      )

      // Log password reset request
      logger.security('password_reset_requested', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
      })
    } catch (error) {
      logger.error('Failed to send password reset email:', error)
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent',
    })
  }

  /**
   * Reset password with token
   */
  async resetPassword(req: Request, res: Response) {
    const { token, password } = req.body

    // Get user ID from Redis
    const userId = await redis.get(`password_reset:${token}`)
    
    if (!userId) {
      throw new ValidationError('Invalid or expired reset token')
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    // Delete reset token
    await redis.del(`password_reset:${token}`)

    // Invalidate all user sessions
    await prisma.userSession.deleteMany({
      where: { userId },
    })

    // Clear user cache
    await redis.del(`user:${userId}`)

    // Log password reset
    logger.security('password_reset_completed', {
      userId,
      ip: req.ip,
    })

    res.json({
      success: true,
      message: 'Password reset successfully',
    })
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(req: Request, res: Response) {
    const { currentPassword, newPassword } = req.body
    const userId = req.user!.id

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    })

    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      throw new ValidationError('Current password is incorrect')
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    // Log password change
    logger.security('password_changed', {
      userId,
      ip: req.ip,
    })

    res.json({
      success: true,
      message: 'Password changed successfully',
    })
  }

  /**
   * Verify email address
   */
  async verifyEmail(req: Request, res: Response) {
    const { token } = req.body

    const userId = await redis.get(`email_verification:${token}`)
    
    if (!userId) {
      throw new ValidationError('Invalid or expired verification token')
    }

    // Update user as verified (you might want to add an emailVerified field)
    await prisma.user.update({
      where: { id: userId },
      data: {
        // emailVerified: true, // Add this field to your schema if needed
      },
    })

    // Delete verification token
    await redis.del(`email_verification:${token}`)

    // Log email verification
    logger.business('email_verified', {
      userId,
    })

    res.json({
      success: true,
      message: 'Email verified successfully',
    })
  }

  /**
   * Resend email verification
   */
  async resendVerification(req: Request, res: Response) {
    const userId = req.user!.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    })

    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    await redis.set(`email_verification:${verificationToken}`, user.id, 24 * 60 * 60) // 24 hours

    // Send verification email
    try {
      await emailService.sendVerificationEmail(
        user.email,
        verificationToken,
        `${user.firstName} ${user.lastName}`
      )
    } catch (error) {
      logger.error('Failed to send verification email:', error)
      throw new Error('Failed to send verification email')
    }

    res.json({
      success: true,
      message: 'Verification email sent successfully',
    })
  }
}

export default AuthController