import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import { ValidationError } from './error-handler'

/**
 * Middleware to handle express-validator validation results
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined,
    }))
    
    throw new ValidationError('Validation failed', validationErrors)
  }
  
  next()
}