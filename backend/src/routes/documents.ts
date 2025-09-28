import express from 'express'
import { asyncHandler } from '@/middleware/error-handler'

const router = express.Router()

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Get documents
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 */
router.get('/', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Document management routes - Coming soon',
    data: [],
  })
}))

export default router