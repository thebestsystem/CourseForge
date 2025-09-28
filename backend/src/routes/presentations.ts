import express from 'express'
import { asyncHandler } from '@/middleware/error-handler'

const router = express.Router()

/**
 * @swagger
 * /api/presentations:
 *   get:
 *     summary: Get presentations
 *     tags: [Presentations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Presentations retrieved successfully
 */
router.get('/', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Presentation management routes - Coming soon',
    data: [],
  })
}))

export default router