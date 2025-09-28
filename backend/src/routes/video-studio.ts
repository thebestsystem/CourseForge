import express from 'express'
import { asyncHandler } from '@/middleware/error-handler'

const router = express.Router()

/**
 * @swagger
 * /api/video-studio:
 *   get:
 *     summary: Get video projects
 *     tags: [Video Studio]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Video projects retrieved successfully
 */
router.get('/', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Video Studio routes - Coming soon',
    data: [],
  })
}))

export default router