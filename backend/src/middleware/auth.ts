import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '@/config/database'
import { redis } from '@/config/redis'
import { logger } from '@/utils/logger'
import { AuthenticationError, AuthorizationError } from './error-handler'
import { UserRole } from '@prisma/client'

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: UserRole
        organizationId?: string
      }
    }
  }
}

interface JwtPayload {
  userId: string
  email: string
  role: UserRole
  organizationId?: string
  iat: number
  exp: number
}

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

// Generate JWT token
export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

// Generate refresh token
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  })
}

// Verify JWT token
export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token expired')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token')
    }
    throw new AuthenticationError('Token verification failed')
  }
}

// Extract token from request
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Also check for token in cookies
  if (req.cookies && req.cookies.token) {
    return req.cookies.token
  }

  return null
}

// Check if token is blacklisted
const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    const blacklisted = await redis.get(`blacklist:${token}`)
    return blacklisted === 'true'
  } catch (error) {
    logger.error('Error checking token blacklist:', error)
    return false
  }
}

// Blacklist token
export const blacklistToken = async (token: string): Promise<void> => {
  try {
    const decoded = verifyToken(token)
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000)
    
    if (expiresIn > 0) {
      await redis.set(`blacklist:${token}`, 'true', expiresIn)
    }
  } catch (error) {
    logger.error('Error blacklisting token:', error)
  }
}

// Main authentication middleware
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req)

    if (!token) {
      throw new AuthenticationError('Access token is required')
    }

    // Check if token is blacklisted
    if (await isTokenBlacklisted(token)) {
      throw new AuthenticationError('Token is invalid')
    }

    // Verify token
    const decoded = verifyToken(token)

    // Get user from database with minimal data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        organization: {
          select: {
            organizationId: true,
          },
        },
      },
    })

    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or inactive')
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization?.organizationId,
    }

    // Log authentication
    logger.api(req.path, user.id, 'authenticated')

    next()
  } catch (error) {
    next(error)
  }
}

// Optional authentication middleware (doesn't throw if no token)
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req)

    if (token) {
      if (!(await isTokenBlacklisted(token))) {
        const decoded = verifyToken(token)
        
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            organization: {
              select: {
                organizationId: true,
              },
            },
          },
        })

        if (user && user.isActive) {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organization?.organizationId,
          }
        }
      }
    }

    next()
  } catch (error) {
    // For optional auth, we continue even if token is invalid
    next()
  }
}

// Role-based authorization middleware
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required')
    }

    if (!roles.includes(req.user.role)) {
      throw new AuthorizationError('Insufficient permissions')
    }

    next()
  }
}

// Resource ownership middleware
export const requireOwnership = (resourceParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required')
      }

      const resourceId = req.params[resourceParam]
      if (!resourceId) {
        throw new Error('Resource ID not provided')
      }

      // This is a generic ownership check - you might need to customize this
      // based on the specific resource type
      const isOwner = await checkResourceOwnership(req.user.id, resourceId, req.route.path)

      if (!isOwner && req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
        throw new AuthorizationError('You do not have permission to access this resource')
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

// Helper function to check resource ownership
const checkResourceOwnership = async (
  userId: string,
  resourceId: string,
  routePath: string
): Promise<boolean> => {
  try {
    // Determine resource type based on route path
    if (routePath.includes('/courses')) {
      const course = await prisma.course.findUnique({
        where: { id: resourceId },
        select: { authorId: true },
      })
      return course?.authorId === userId
    }

    if (routePath.includes('/documents')) {
      const document = await prisma.document.findUnique({
        where: { id: resourceId },
        select: { ownerId: true },
      })
      return document?.ownerId === userId
    }

    // Add more resource type checks as needed
    return false
  } catch (error) {
    logger.error('Error checking resource ownership:', error)
    return false
  }
}

// Admin-only middleware
export const requireAdmin = requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN)

// Super admin-only middleware
export const requireSuperAdmin = requireRole(UserRole.SUPER_ADMIN)

// Organization middleware - ensures user belongs to the same organization
export const requireSameOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required')
    }

    // Skip check for admins
    if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.SUPER_ADMIN) {
      return next()
    }

    const targetUserId = req.params.userId || req.body.userId
    if (!targetUserId) {
      return next()
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        organization: {
          select: {
            organizationId: true,
          },
        },
      },
    })

    if (targetUser?.organization?.organizationId !== req.user.organizationId) {
      throw new AuthorizationError('Access denied: Different organization')
    }

    next()
  } catch (error) {
    next(error)
  }
}

// Rate limiting by user
export const rateLimitByUser = (maxRequests: number, windowMs: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next()
      }

      const key = `rate_limit:${req.user.id}:${req.route.path}`
      const current = await redis.get(key)
      
      if (current && parseInt(current) >= maxRequests) {
        throw new Error('Rate limit exceeded')
      }

      if (current) {
        await redis.set(key, (parseInt(current) + 1).toString(), Math.ceil(windowMs / 1000))
      } else {
        await redis.set(key, '1', Math.ceil(windowMs / 1000))
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

// Subscription-based access control
export const requireSubscription = (requiredPlan: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required')
      }

      const subscription = await prisma.subscription.findUnique({
        where: { userId: req.user.id },
      })

      if (!subscription || subscription.status !== 'ACTIVE') {
        throw new AuthorizationError('Active subscription required')
      }

      // Check if user's plan meets the requirement
      const planHierarchy = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE']
      const userPlanIndex = planHierarchy.indexOf(subscription.plan)
      const requiredPlanIndex = planHierarchy.indexOf(requiredPlan)

      if (userPlanIndex < requiredPlanIndex) {
        throw new AuthorizationError(`${requiredPlan} subscription required`)
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

export default authMiddleware