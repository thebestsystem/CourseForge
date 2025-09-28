import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { logger } from '@/utils/logger'

// Custom error classes
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  public errors: any[]

  constructor(message: string, errors: any[] = []) {
    super(message, 400)
    this.errors = errors
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429)
  }
}

// Error response interface
interface ErrorResponse {
  success: false
  error: string
  message: string
  statusCode: number
  timestamp: string
  path: string
  errors?: any[]
  stack?: string
}

// Handle Prisma errors
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2000':
      return new ValidationError('The provided value is too long for the field')
    case 'P2001':
      return new NotFoundError('The record searched for does not exist')
    case 'P2002':
      const target = (error.meta?.target as string[]) || []
      return new ConflictError(`Unique constraint failed on field(s): ${target.join(', ')}`)
    case 'P2003':
      return new ValidationError('Foreign key constraint failed')
    case 'P2004':
      return new ValidationError('A constraint failed on the database')
    case 'P2025':
      return new NotFoundError('Record not found')
    default:
      return new AppError('Database operation failed', 500)
  }
}

// Handle Zod validation errors
const handleZodError = (error: ZodError): ValidationError => {
  const errors = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }))

  return new ValidationError('Validation failed', errors)
}

// Handle JWT errors
const handleJWTError = (error: Error): AuthenticationError => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token')
  }
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired')
  }
  return new AuthenticationError('Authentication failed')
}

// Main error handler middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = err

  // Log the error
  logger.errorWithContext('Error occurred', err, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
  })

  // Convert known errors to AppError
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    error = handlePrismaError(error)
  } else if (error instanceof ZodError) {
    error = handleZodError(error)
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    error = handleJWTError(error)
  } else if (error.name === 'MulterError') {
    if (error.message.includes('File too large')) {
      error = new ValidationError('File size too large')
    } else {
      error = new ValidationError('File upload error')
    }
  } else if (error.name === 'CastError') {
    error = new ValidationError('Invalid ID format')
  } else if (error.name === 'ValidationError') {
    error = new ValidationError('Validation failed')
  }

  // Ensure we have an AppError
  if (!(error instanceof AppError)) {
    error = new AppError('Something went wrong', 500)
  }

  const appError = error as AppError
  
  // Create error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: appError.constructor.name,
    message: appError.message,
    statusCode: appError.statusCode,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  }

  // Add validation errors if present
  if (appError instanceof ValidationError && appError.errors.length > 0) {
    errorResponse.errors = appError.errors
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = appError.stack
  }

  // Send error response
  res.status(appError.statusCode).json(errorResponse)
}

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// Not found middleware
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`)
  next(error)
}

// Development error handler
export const developmentErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.errorWithContext('Development Error', err, {
    method: req.method,
    url: req.url,
    body: req.body,
    params: req.params,
    query: req.query,
    headers: req.headers,
  })

  res.status(500).json({
    success: false,
    error: err.name,
    message: err.message,
    stack: err.stack,
    request: {
      method: req.method,
      url: req.url,
      body: req.body,
      params: req.params,
      query: req.query,
    },
  })
}

// Production error handler
export const productionErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Don't leak error details in production
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: 'Operational Error',
      message: err.message,
      timestamp: new Date().toISOString(),
    })
  } else {
    // Log the error but don't expose details
    logger.error('Non-operational error occurred', err)
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Something went wrong on our end',
      timestamp: new Date().toISOString(),
    })
  }
}

// Error handler factory based on environment
export const createErrorHandler = () => {
  return process.env.NODE_ENV === 'production'
    ? productionErrorHandler
    : developmentErrorHandler
}

// Graceful error handlers for uncaught exceptions
export const handleUncaughtException = (error: Error) => {
  logger.error('Uncaught Exception:', error)
  process.exit(1)
}

export const handleUnhandledRejection = (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
}

// Error monitoring integration helpers
export const reportError = (error: Error, context?: any) => {
  // Here you can integrate with error monitoring services like Sentry
  logger.errorWithContext('Reported Error', error, context)
}

export default errorHandler