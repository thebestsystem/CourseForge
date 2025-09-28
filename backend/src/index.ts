import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { PrismaClient } from '@prisma/client'
import { createServer } from 'http'

import { logger } from '@/utils/logger'
import { errorHandler } from '@/middleware/error-handler'
import { requestLogger } from '@/middleware/request-logger'
import { authMiddleware } from '@/middleware/auth'
import { swaggerSetup } from '@/config/swagger'
import { redisClient } from '@/config/redis'

// Route imports
import authRoutes from '@/routes/auth'
import userRoutes from '@/routes/users'
import courseRoutes from '@/routes/courses'
import documentRoutes from '@/routes/documents'
import aiAgentRoutes from '@/routes/ai-agents'
import contentRoutes from '@/routes/content'
import presentationRoutes from '@/routes/presentations'
import videoStudioRoutes from '@/routes/video-studio'
import analyticsRoutes from '@/routes/analytics'
import billingRoutes from '@/routes/billing'

// Initialize Prisma client
export const prisma = new PrismaClient()

// Create Express app
const app = express()
const server = createServer(app)

// Environment variables
const PORT = process.env.PORT || 3001
const NODE_ENV = process.env.NODE_ENV || 'development'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
}))

// CORS configuration
app.use(cors({
  origin: [
    FRONTEND_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
}))

// Body parsing middleware
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Compression middleware
app.use(compression())

// Apply rate limiting to all requests
if (NODE_ENV === 'production') {
  app.use(limiter)
}

// Request logging
app.use(requestLogger)

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', authMiddleware, userRoutes)
app.use('/api/courses', authMiddleware, courseRoutes)
app.use('/api/documents', authMiddleware, documentRoutes)
app.use('/api/ai-agents', authMiddleware, aiAgentRoutes)
app.use('/api/content', authMiddleware, contentRoutes)
app.use('/api/presentations', authMiddleware, presentationRoutes)
app.use('/api/video-studio', authMiddleware, videoStudioRoutes)
app.use('/api/analytics', authMiddleware, analyticsRoutes)
app.use('/api/billing', authMiddleware, billingRoutes)

// Swagger documentation (development only)
if (NODE_ENV === 'development') {
  swaggerSetup(app)
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} was not found on this server.`,
  })
})

// Global error handler (must be last)
app.use(errorHandler)

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`)
  
  server.close(() => {
    logger.info('HTTP server closed.')
  })

  try {
    await prisma.$disconnect()
    logger.info('Database connection closed.')
    
    redisClient.disconnect()
    logger.info('Redis connection closed.')
    
    process.exit(0)
  } catch (error) {
    logger.error('Error during graceful shutdown:', error)
    process.exit(1)
  }
}

// Handle process termination
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect()
    logger.info('Database connected successfully')

    // Test Redis connection
    await redisClient.ping()
    logger.info('Redis connected successfully')

    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`🚀 CourseForge API Server is running on port ${PORT}`)
      logger.info(`📚 Environment: ${NODE_ENV}`)
      logger.info(`🔗 Frontend URL: ${FRONTEND_URL}`)
      
      if (NODE_ENV === 'development') {
        logger.info(`📖 API Documentation: http://localhost:${PORT}/api-docs`)
      }
    })

  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Initialize server
startServer()

export default app