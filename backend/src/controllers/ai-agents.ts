import { Request, Response } from 'express'
import { prisma } from '@/config/database-simple'
import { aiEngine } from '@/services/ai-engine'

// Simple console logger for development
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  debug: (...args: any[]) => console.log('[DEBUG]', ...args),
}
// Using string types since we're using simplified schema without enums
type AIAgentType = 'ARCHITECT' | 'RESEARCH' | 'WRITING' | 'EDITING' | 'DESIGN' | 'QUALITY' | 'MARKETING'
type AIExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELED'
import { z } from 'zod'

// Validation schemas
const executeAgentSchema = z.object({
  agentType: z.enum(['ARCHITECT', 'RESEARCH', 'WRITING', 'EDITING', 'DESIGN', 'QUALITY', 'MARKETING']),
  prompt: z.string().min(1, 'Prompt is required').max(5000, 'Prompt too long'),
  context: z.record(z.any()).optional(),
  courseId: z.string().uuid().optional(),
  modelConfig: z.object({
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(4000).optional(),
  }).optional(),
})

const getExecutionHistorySchema = z.object({
  courseId: z.string().uuid().optional(),
  agentType: z.enum(['ARCHITECT', 'RESEARCH', 'WRITING', 'EDITING', 'DESIGN', 'QUALITY', 'MARKETING']).optional(),
  limit: z.string().transform(val => parseInt(val) || 50).optional(),
  page: z.string().transform(val => parseInt(val) || 1).optional(),
})

const getUsageStatsSchema = z.object({
  period: z.enum(['day', 'week', 'month']).optional().default('month'),
})

const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  systemPrompt: z.string().min(1).max(10000).optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4000).optional(),
  isEnabled: z.boolean().optional(),
})

export class AIAgentsController {
  /**
   * Get all available AI agents
   */
  static async getAgents(req: Request, res: Response) {
    try {
      const agents = await prisma.aIAgent.findMany({
        select: {
          id: true,
          type: true,
          name: true,
          description: true,
          capabilities: true,
          model: true,
          temperature: true,
          maxTokens: true,
          isEnabled: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          type: 'asc',
        },
      })

      res.json({
        success: true,
        message: 'AI agents retrieved successfully',
        data: agents,
      })
    } catch (error) {
      logger.error('Error retrieving AI agents:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve AI agents',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  /**
   * Get specific AI agent by type
   */
  static async getAgent(req: Request, res: Response) {
    try {
      const { type } = req.params
      
      const validTypes = ['ARCHITECT', 'RESEARCH', 'WRITING', 'EDITING', 'DESIGN', 'QUALITY', 'MARKETING']
      if (!validTypes.includes(type as AIAgentType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid agent type',
        })
      }

      const agent = await prisma.aIAgent.findUnique({
        where: { type: type as AIAgentType },
        include: {
          _count: {
            select: {
              executions: {
                where: {
                  status: 'COMPLETED',
                },
              },
            },
          },
        },
      })

      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found',
        })
      }

      res.json({
        success: true,
        message: 'AI agent retrieved successfully',
        data: agent,
      })
    } catch (error) {
      logger.error('Error retrieving AI agent:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve AI agent',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  /**
   * Execute AI agent with given prompt and context
   */
  static async executeAgent(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
      }

      // Validate request body
      const validatedData = executeAgentSchema.parse(req.body)

      // Check usage limits
      const usageLimits = await aiEngine.checkUsageLimits(userId)
      if (!usageLimits.canExecute) {
        return res.status(429).json({
          success: false,
          message: 'Usage limit exceeded',
          data: {
            limit: usageLimits.limit,
            used: usageLimits.used,
            resetDate: usageLimits.resetDate,
          },
        })
      }

      // Execute the AI agent
      const result = await aiEngine.executeAgent({
        ...validatedData,
        userId,
      })

      logger.aiAgent(validatedData.agentType, 'executed', result.executionId)

      res.json({
        success: true,
        message: 'AI agent executed successfully',
        data: result,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        })
      }

      logger.error('Error executing AI agent:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to execute AI agent',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  /**
   * Get execution history for the authenticated user
   */
  static async getExecutionHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
      }

      const { courseId, agentType, limit = 50, page = 1 } = getExecutionHistorySchema.parse(req.query)
      const skip = (page - 1) * limit

      const where: any = { userId }
      if (courseId) where.courseId = courseId
      if (agentType) where.agentType = agentType

      const [executions, total] = await Promise.all([
        prisma.aIAgentExecution.findMany({
          where,
          include: {
            agent: {
              select: {
                name: true,
                description: true,
              },
            },
            course: {
              select: {
                title: true,
              },
            },
          },
          orderBy: {
            startedAt: 'desc',
          },
          skip,
          take: limit,
        }),
        prisma.aIAgentExecution.count({ where }),
      ])

      res.json({
        success: true,
        message: 'Execution history retrieved successfully',
        data: {
          executions,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        })
      }

      logger.error('Error retrieving execution history:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve execution history',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  /**
   * Get specific execution details
   */
  static async getExecution(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
      }

      const { id } = req.params

      const execution = await prisma.aIAgentExecution.findUnique({
        where: { 
          id,
          userId, // Ensure user can only access their own executions
        },
        include: {
          agent: {
            select: {
              name: true,
              description: true,
              type: true,
            },
          },
          course: {
            select: {
              title: true,
            },
          },
        },
      })

      if (!execution) {
        return res.status(404).json({
          success: false,
          message: 'Execution not found',
        })
      }

      res.json({
        success: true,
        message: 'Execution retrieved successfully',
        data: execution,
      })
    } catch (error) {
      logger.error('Error retrieving execution:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve execution',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  /**
   * Get usage statistics for the authenticated user
   */
  static async getUsageStats(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
      }

      const { period } = getUsageStatsSchema.parse(req.query)

      const [stats, usageLimits] = await Promise.all([
        aiEngine.getUsageStats(userId, period),
        aiEngine.checkUsageLimits(userId),
      ])

      res.json({
        success: true,
        message: 'Usage statistics retrieved successfully',
        data: {
          ...stats,
          limits: usageLimits,
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        })
      }

      logger.error('Error retrieving usage stats:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve usage statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  /**
   * Update AI agent configuration (Admin only)
   */
  static async updateAgent(req: Request, res: Response) {
    try {
      const userRole = req.user?.role
      if (userRole !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required',
        })
      }

      const { type } = req.params
      
      const validTypes = ['ARCHITECT', 'RESEARCH', 'WRITING', 'EDITING', 'DESIGN', 'QUALITY', 'MARKETING']
      if (!validTypes.includes(type as AIAgentType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid agent type',
        })
      }

      const validatedData = updateAgentSchema.parse(req.body)

      const updatedAgent = await prisma.aIAgent.update({
        where: { type: type as AIAgentType },
        data: validatedData,
      })

      logger.info(`AI agent ${type} updated by admin ${req.user?.id}`)

      res.json({
        success: true,
        message: 'AI agent updated successfully',
        data: updatedAgent,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        })
      }

      logger.error('Error updating AI agent:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to update AI agent',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  /**
   * Cancel running execution
   */
  static async cancelExecution(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
      }

      const { id } = req.params

      const execution = await prisma.aIAgentExecution.findUnique({
        where: { 
          id,
          userId,
          status: 'RUNNING',
        },
      })

      if (!execution) {
        return res.status(404).json({
          success: false,
          message: 'Running execution not found',
        })
      }

      // Update execution status to cancelled
      await prisma.aIAgentExecution.update({
        where: { id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          duration: Date.now() - execution.startedAt.getTime(),
        },
      })

      logger.info(`Execution ${id} cancelled by user ${userId}`)

      res.json({
        success: true,
        message: 'Execution cancelled successfully',
      })
    } catch (error) {
      logger.error('Error cancelling execution:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to cancel execution',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  /**
   * Stream AI agent execution (for real-time updates)
   */
  static async streamExecution(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
      }

      const validatedData = executeAgentSchema.parse(req.body)

      // Check usage limits
      const usageLimits = await aiEngine.checkUsageLimits(userId)
      if (!usageLimits.canExecute) {
        return res.status(429).json({
          success: false,
          message: 'Usage limit exceeded',
          data: {
            limit: usageLimits.limit,
            used: usageLimits.used,
            resetDate: usageLimits.resetDate,
          },
        })
      }

      // Set up Server-Sent Events
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('Access-Control-Allow-Origin', '*')

      try {
        const stream = await aiEngine.streamExecution({
          ...validatedData,
          userId,
        })

        for await (const chunk of stream) {
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`)
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
        res.end()
      } catch (streamError) {
        res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`)
        res.end()
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        })
      }

      logger.error('Error streaming AI execution:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to stream AI execution',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }
}