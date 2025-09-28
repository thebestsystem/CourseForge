import express from 'express'
import { asyncHandler } from '@/middleware/error-handler'

const router = express.Router()

/**
 * @swagger
 * /api/billing:
 *   get:
 *     summary: Get billing information
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Billing information retrieved successfully
 */
router.get('/', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Billing routes - Coming soon',
    data: [],
  })
}))

export default router