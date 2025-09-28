import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { prisma } from '@/config/database-simple'
import { AIAgentsController } from '@/controllers/ai-agents'
import { asyncHandler } from '@/middleware/error-handler'

const app = express()
const PORT = process.env.PORT || 3001

// Basic middleware
app.use(cors())
app.use(express.json())

// Simple authentication middleware for development
app.use((req, res, next) => {
  // For development, use the real test user
  req.user = {
    id: 'cmg3xt3pe0000obf7tgelmjnq', // Real test user ID from database
    email: 'test@example.com',
    role: 'EDUCATOR' as any,
  }
  next()
})

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'CourseForge AI Agents Backend is running!',
    database: 'connected'
  })
})

// AI Agents routes
app.get('/api/ai-agents', asyncHandler(AIAgentsController.getAgents))
app.get('/api/ai-agents/:type', asyncHandler(AIAgentsController.getAgent))
app.post('/api/ai-agents/execute', asyncHandler(AIAgentsController.executeAgent))
app.get('/api/ai-agents/executions', asyncHandler(AIAgentsController.getExecutionHistory))
app.get('/api/ai-agents/usage', asyncHandler(AIAgentsController.getUsageStats))

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const agentCount = await prisma.aIAgent.count()
    const executionCount = await prisma.aIAgentExecution.count()
    
    res.json({
      success: true,
      message: 'Database connection successful',
      data: {
        aiAgents: agentCount,
        executions: executionCount
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    })
  }
})

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    app.listen(PORT, () => {
      console.log(`🚀 CourseForge API Server running on port ${PORT}`)
      console.log(`📚 Health check: http://localhost:${PORT}/health`)
      console.log(`🤖 AI Agents: http://localhost:${PORT}/api/ai-agents`)
      console.log(`🔍 Database test: http://localhost:${PORT}/api/test-db`)
    })

  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully')
  await prisma.$disconnect()
  process.exit(0)
})

startServer()