import { Request, Response } from 'express'
import { prisma } from '@/config/database'
import { redis } from '@/config/redis'
import { logger } from '@/utils/logger'
import { NotFoundError, ValidationError } from '@/middleware/error-handler'
import { UserRole } from '@prisma/client'

export class UserController {
  /**
   * Get current user profile
   */
  async getProfile(req: Request, res: Response) {
    const userId = req.user!.id

    // Try to get user from cache first
    let user = await redis.cache.get(`user:${userId}`)

    if (!user) {
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
          _count: {
            select: {
              courses: true,
              documents: true,
              aiExecutions: true,
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
      message: 'Profile retrieved successfully',
      data: userResponse,
    })
  }

  /**
   * Update user profile
   */
  async updateProfile(req: Request, res: Response) {
    const userId = req.user!.id
    const {
      firstName,
      lastName,
      bio,
      expertise,
      languages,
      timezone,
      preferences,
    } = req.body

    // Update user basic info
    const updateData: any = {}
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName

    // Update user profile
    const profileUpdateData: any = {}
    if (bio !== undefined) profileUpdateData.bio = bio
    if (expertise !== undefined) profileUpdateData.expertise = expertise
    if (languages !== undefined) profileUpdateData.languages = languages
    if (timezone !== undefined) profileUpdateData.timezone = timezone
    if (preferences !== undefined) profileUpdateData.preferences = preferences

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        profile: {
          update: profileUpdateData,
        },
      },
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

    // Update cache
    await redis.cache.set(`user:${userId}`, user, 60 * 60) // 1 hour

    // Log profile update
    logger.business('profile_updated', {
      userId,
      updatedFields: Object.keys({ ...updateData, ...profileUpdateData }),
    })

    // Remove password from response
    const { password: _, ...userResponse } = user

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: userResponse,
    })
  }

  /**
   * Get user by ID (Admin only)
   */
  async getUserById(req: Request, res: Response) {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        subscription: true,
        organization: {
          include: {
            organization: true,
          },
        },
        _count: {
          select: {
            courses: true,
            documents: true,
            aiExecutions: true,
          },
        },
      },
    })

    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Remove password from response
    const { password: _, ...userResponse } = user

    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: userResponse,
    })
  }

  /**
   * Get all users with pagination and filtering (Admin only)
   */
  async getUsers(req: Request, res: Response) {
    const {
      page = '1',
      limit = '20',
      role,
      search,
      organizationId,
    } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = Math.min(parseInt(limit as string), 100) // Max 100 items per page
    const skip = (pageNum - 1) * limitNum

    // Build where clause
    const where: any = {}
    
    if (role) {
      where.role = role as UserRole
    }

    if (organizationId) {
      where.organization = {
        organizationId: organizationId as string,
      }
    }

    if (search) {
      where.OR = [
        {
          firstName: {
            contains: search as string,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: search as string,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search as string,
            mode: 'insensitive',
          },
        },
      ]
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          profile: {
            select: {
              bio: true,
              avatar: true,
            },
          },
          subscription: {
            select: {
              plan: true,
              status: true,
            },
          },
          organization: {
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              courses: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count({ where }),
    ])

    // Remove passwords from response
    const usersResponse = users.map(({ password: _, ...user }) => user)

    const totalPages = Math.ceil(total / limitNum)

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: usersResponse,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    })
  }

  /**
   * Activate user (Admin only)
   */
  async activateUser(req: Request, res: Response) {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, isActive: true, email: true },
    })

    if (!user) {
      throw new NotFoundError('User not found')
    }

    if (user.isActive) {
      throw new ValidationError('User is already active')
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: true },
    })

    // Clear user cache
    await redis.del(`user:${id}`)

    // Log user activation
    logger.business('user_activated', {
      userId: id,
      adminId: req.user!.id,
      userEmail: user.email,
    })

    res.json({
      success: true,
      message: 'User activated successfully',
    })
  }

  /**
   * Deactivate user (Admin only)
   */
  async deactivateUser(req: Request, res: Response) {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, isActive: true, email: true, role: true },
    })

    if (!user) {
      throw new NotFoundError('User not found')
    }

    if (!user.isActive) {
      throw new ValidationError('User is already inactive')
    }

    // Prevent deactivating super admins
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ValidationError('Cannot deactivate super admin users')
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    })

    // Clear user cache
    await redis.del(`user:${id}`)

    // Invalidate all user sessions
    await prisma.userSession.deleteMany({
      where: { userId: id },
    })

    // Log user deactivation
    logger.business('user_deactivated', {
      userId: id,
      adminId: req.user!.id,
      userEmail: user.email,
    })

    res.json({
      success: true,
      message: 'User deactivated successfully',
    })
  }

  /**
   * Delete user (Super Admin only)
   */
  async deleteUser(req: Request, res: Response) {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    })

    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Prevent deleting super admins
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ValidationError('Cannot delete super admin users')
    }

    // Prevent self-deletion
    if (id === req.user!.id) {
      throw new ValidationError('Cannot delete your own account')
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id },
    })

    // Clear user cache
    await redis.del(`user:${id}`)

    // Log user deletion
    logger.business('user_deleted', {
      deletedUserId: id,
      adminId: req.user!.id,
      userEmail: user.email,
    })

    res.json({
      success: true,
      message: 'User deleted successfully',
    })
  }

  /**
   * Get user statistics (Admin only)
   */
  async getUserStats(req: Request, res: Response) {
    const stats = await prisma.$transaction([
      // Total users
      prisma.user.count(),
      
      // Active users
      prisma.user.count({
        where: { isActive: true },
      }),
      
      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      
      // New users this month
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      
      // Users with courses
      prisma.user.count({
        where: {
          courses: {
            some: {},
          },
        },
      }),
    ])

    const [
      totalUsers,
      activeUsers,
      usersByRole,
      newUsersThisMonth,
      usersWithCourses,
    ] = stats

    res.json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        usersByRole: usersByRole.reduce((acc, curr) => {
          acc[curr.role] = curr._count
          return acc
        }, {} as Record<string, number>),
        newUsersThisMonth,
        usersWithCourses,
        usersWithoutCourses: totalUsers - usersWithCourses,
      },
    })
  }
}

export default UserController