import express from 'express'
import { asyncHandler } from '@/middleware/error-handler'
import { AIAgentsController } from '@/controllers/ai-agents'

const router = express.Router()

// Authentication is already applied at the app level

/**
 * @swagger
 * /api/ai-agents:
 *   get:
 *     summary: Get all available AI agents
 *     tags: [AI Agents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI agents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AIAgent'
 */
router.get('/', asyncHandler(AIAgentsController.getAgents))

/**
 * @swagger
 * /api/ai-agents/{type}:
 *   get:
 *     summary: Get specific AI agent by type
 *     tags: [AI Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ARCHITECT, RESEARCH, WRITING, EDITING, DESIGN, QUALITY, MARKETING]
 *     responses:
 *       200:
 *         description: AI agent retrieved successfully
 *       404:
 *         description: Agent not found
 */
router.get('/:type', asyncHandler(AIAgentsController.getAgent))

/**
 * @swagger
 * /api/ai-agents/{type}:
 *   put:
 *     summary: Update AI agent configuration (Admin only)
 *     tags: [AI Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ARCHITECT, RESEARCH, WRITING, EDITING, DESIGN, QUALITY, MARKETING]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               systemPrompt:
 *                 type: string
 *                 maxLength: 10000
 *               model:
 *                 type: string
 *               temperature:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 2
 *               maxTokens:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 4000
 *               isEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: AI agent updated successfully
 *       403:
 *         description: Admin access required
 */
router.put('/:type', asyncHandler(AIAgentsController.updateAgent))

/**
 * @swagger
 * /api/ai-agents/execute:
 *   post:
 *     summary: Execute AI agent with prompt and context
 *     tags: [AI Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agentType
 *               - prompt
 *             properties:
 *               agentType:
 *                 type: string
 *                 enum: [ARCHITECT, RESEARCH, WRITING, EDITING, DESIGN, QUALITY, MARKETING]
 *               prompt:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *               context:
 *                 type: object
 *               courseId:
 *                 type: string
 *                 format: uuid
 *               modelConfig:
 *                 type: object
 *                 properties:
 *                   model:
 *                     type: string
 *                   temperature:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 2
 *                   maxTokens:
 *                     type: number
 *                     minimum: 1
 *                     maximum: 4000
 *     responses:
 *       200:
 *         description: AI agent executed successfully
 *       400:
 *         description: Validation error
 *       429:
 *         description: Usage limit exceeded
 */
router.post('/execute', asyncHandler(AIAgentsController.executeAgent))

/**
 * @swagger
 * /api/ai-agents/execute/stream:
 *   post:
 *     summary: Stream AI agent execution for real-time updates
 *     tags: [AI Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agentType
 *               - prompt
 *             properties:
 *               agentType:
 *                 type: string
 *                 enum: [ARCHITECT, RESEARCH, WRITING, EDITING, DESIGN, QUALITY, MARKETING]
 *               prompt:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *               context:
 *                 type: object
 *               courseId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Server-Sent Events stream
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 */
router.post('/execute/stream', asyncHandler(AIAgentsController.streamExecution))

/**
 * @swagger
 * /api/ai-agents/executions:
 *   get:
 *     summary: Get execution history for authenticated user
 *     tags: [AI Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: agentType
 *         schema:
 *           type: string
 *           enum: [ARCHITECT, RESEARCH, WRITING, EDITING, DESIGN, QUALITY, MARKETING]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: Execution history retrieved successfully
 */
router.get('/executions', asyncHandler(AIAgentsController.getExecutionHistory))

/**
 * @swagger
 * /api/ai-agents/executions/{id}:
 *   get:
 *     summary: Get specific execution details
 *     tags: [AI Agents]
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
 *         description: Execution retrieved successfully
 *       404:
 *         description: Execution not found
 */
router.get('/executions/:id', asyncHandler(AIAgentsController.getExecution))

/**
 * @swagger
 * /api/ai-agents/executions/{id}/cancel:
 *   post:
 *     summary: Cancel running execution
 *     tags: [AI Agents]
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
 *         description: Execution cancelled successfully
 *       404:
 *         description: Running execution not found
 */
router.post('/executions/:id/cancel', asyncHandler(AIAgentsController.cancelExecution))

/**
 * @swagger
 * /api/ai-agents/usage:
 *   get:
 *     summary: Get usage statistics for authenticated user
 *     tags: [AI Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: month
 *     responses:
 *       200:
 *         description: Usage statistics retrieved successfully
 */
router.get('/usage', asyncHandler(AIAgentsController.getUsageStats))

export default router