import express from 'express'
import { asyncHandler } from '@/middleware/error-handler'

const router = express.Router()

/**
 * @swagger
 * /api/ai-agents:
 *   get:
 *     summary: Get AI agents
 *     tags: [AI Agents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI agents retrieved successfully
 */
router.get('/', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'AI Agents management routes - Coming soon',
    data: [],
  })
}))

export default router