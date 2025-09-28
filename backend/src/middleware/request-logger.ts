import { Request, Response, NextFunction } from 'express'
import { logger } from '@/utils/logger'

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now()

  // Log the incoming request
  logger.http(`${req.method} ${req.originalUrl} - ${req.ip}`)

  // Override res.end to capture response data
  const originalEnd = res.end
  
  res.end = function(chunk?: any, encoding?: BufferEncoding | (() => void), cb?: () => void) {
    const responseTime = Date.now() - startTime
    
    // Log the response
    logger.request(req.method, req.originalUrl, res.statusCode, responseTime)
    
    // Log additional details for errors
    if (res.statusCode >= 400) {
      logger.warn(`Error Response: ${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTime}ms`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: (req as any).user?.id,
        body: req.method !== 'GET' ? req.body : undefined,
        query: req.query,
      })
    }

    // Call the original end method
    return originalEnd.call(this, chunk, encoding as BufferEncoding, cb as () => void)
  }

  next()
}