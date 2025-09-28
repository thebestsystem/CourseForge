import express from 'express'
import { asyncHandler } from '@/middleware/error-handler'

const router = express.Router()

/**
 * @swagger
 * /api/content:
 *   get:
 *     summary: Get content
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Content retrieved successfully
 */
router.get('/', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Content management routes - Coming soon',
    data: [],
  })
}))

export default router