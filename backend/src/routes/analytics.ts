import express from 'express'
import { asyncHandler } from '@/middleware/error-handler'

const router = express.Router()

/**
 * @swagger
 * /api/analytics:
 *   get:
 *     summary: Get analytics data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 */
router.get('/', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Analytics routes - Coming soon',
    data: [],
  })
}))

export default router