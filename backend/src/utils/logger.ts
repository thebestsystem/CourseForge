import winston from 'winston'
import path from 'path'

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
}

// Tell winston that you want to link the colors
winston.addColors(colors)

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
)

// Define log file format (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: fileFormat,
  defaultMeta: {
    service: 'courseforge-api',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
})

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: format,
    })
  )
}

// Create logs directory if it doesn't exist
const fs = require('fs')
const logsDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Enhanced logger with additional methods
const enhancedLogger = {
  ...logger,
  
  // Request logging
  request: (method: string, url: string, statusCode: number, responseTime: number) => {
    logger.http(`${method} ${url} ${statusCode} - ${responseTime}ms`)
  },

  // Database logging
  database: (operation: string, table: string, duration?: number) => {
    const message = duration 
      ? `DB ${operation} on ${table} - ${duration}ms`
      : `DB ${operation} on ${table}`
    logger.debug(message)
  },

  // API logging
  api: (endpoint: string, userId?: string, action?: string) => {
    const userInfo = userId ? ` [User: ${userId}]` : ''
    const actionInfo = action ? ` [Action: ${action}]` : ''
    logger.info(`API ${endpoint}${userInfo}${actionInfo}`)
  },

  // AI Agent logging
  aiAgent: (agentType: string, action: string, executionId?: string) => {
    const execInfo = executionId ? ` [Execution: ${executionId}]` : ''
    logger.info(`AI Agent ${agentType} - ${action}${execInfo}`)
  },

  // Security logging
  security: (event: string, details?: any) => {
    logger.warn(`Security Event: ${event}`, details ? JSON.stringify(details) : '')
  },

  // Performance logging
  performance: (operation: string, duration: number, threshold: number = 1000) => {
    const level = duration > threshold ? 'warn' : 'debug'
    logger.log(level, `Performance: ${operation} took ${duration}ms`)
  },

  // Business logic logging
  business: (event: string, details?: any) => {
    logger.info(`Business Event: ${event}`, details ? JSON.stringify(details) : '')
  },

  // Error with context
  errorWithContext: (message: string, error: Error, context?: any) => {
    logger.error(message, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context: context || {},
    })
  },

  // Structured logging
  structured: (level: 'error' | 'warn' | 'info' | 'debug', event: string, data: any) => {
    logger.log(level, event, {
      timestamp: new Date().toISOString(),
      ...data,
    })
  },

  // Performance timing
  time: (label: string) => {
    console.time(label)
  },

  timeEnd: (label: string) => {
    console.timeEnd(label)
  },

  // Child logger with additional context
  child: (context: any) => {
    return logger.child(context)
  },
}

// Export the logger
export { enhancedLogger as logger }

// Health check for logger
export const loggerHealth = {
  check: (): boolean => {
    try {
      logger.info('Logger health check')
      return true
    } catch (error) {
      console.error('Logger health check failed:', error)
      return false
    }
  },

  getStats: () => {
    return {
      level: logger.level,
      transports: logger.transports.length,
      // Add more stats as needed
    }
  },
}

// Graceful shutdown for logger
export const closeLogger = () => {
  logger.end()
}

export default enhancedLogger