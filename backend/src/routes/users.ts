import express from 'express'
import { body, param } from 'express-validator'
import { UserController } from '@/controllers/users'
import { validateRequest } from '@/middleware/validation'
import { requireRole, requireOwnership } from '@/middleware/auth'
import { asyncHandler } from '@/middleware/error-handler'
import { UserRole } from '@prisma/client'

const router = express.Router()
const userController = new UserController()

// Validation rules
const updateProfileValidation = [
  body('firstName').optional().trim().isLength({ min: 1 }).withMessage('First name cannot be empty'),
  body('lastName').optional().trim().isLength({ min: 1 }).withMessage('Last name cannot be empty'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('expertise').optional().isArray().withMessage('Expertise must be an array'),
  body('languages').optional().isArray().withMessage('Languages must be an array'),
  body('timezone').optional().isString().withMessage('Timezone must be a string'),
]

const userIdValidation = [
  param('id').isUUID().withMessage('Invalid user ID format'),
]

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/profile', asyncHandler(userController.getProfile))

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *               expertise:
 *                 type: array
 *                 items:
 *                   type: string
 *               languages:
 *                 type: array
 *                 items:
 *                   type: string
 *               timezone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 */
router.put('/profile', updateProfileValidation, validateRequest, asyncHandler(userController.updateProfile))

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
router.get('/:id', userIdValidation, validateRequest, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), asyncHandler(userController.getUserById))

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [STUDENT, EDUCATOR, ADMIN, SUPER_ADMIN]
 *         description: Filter by user role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       403:
 *         description: Insufficient permissions
 */
router.get('/', requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), asyncHandler(userController.getUsers))

/**
 * @swagger
 * /api/users/{id}/activate:
 *   patch:
 *     summary: Activate user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User activated successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
router.patch('/:id/activate', userIdValidation, validateRequest, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), asyncHandler(userController.activateUser))

/**
 * @swagger
 * /api/users/{id}/deactivate:
 *   patch:
 *     summary: Deactivate user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
router.patch('/:id/deactivate', userIdValidation, validateRequest, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), asyncHandler(userController.deactivateUser))

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (Super Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
router.delete('/:id', userIdValidation, validateRequest, requireRole(UserRole.SUPER_ADMIN), asyncHandler(userController.deleteUser))

export default router