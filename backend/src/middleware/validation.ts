import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

interface ValidationSchema {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

/**
 * Express middleware for validating requests using Zod schemas
 * 
 * @param schema - Object containing Zod schemas for body, params, and/or query
 * @returns Express middleware function
 * 
 * @example
 * router.post('/register', validate(registerSchema), authController.register);
 */
export const validate = (schema: ValidationSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate body if schema provided
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }

      // Validate params if schema provided
      if (schema.params) {
        const validatedParams = await schema.params.parseAsync(req.params);
        req.params = validatedParams as any;
      }

      // Validate query if schema provided
      if (schema.query) {
        const validatedQuery = await schema.query.parseAsync(req.query);
        req.query = validatedQuery as any;
      }

      // All validations passed
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into a clear, user-friendly structure
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        // Return 400 Bad Request with detailed validation errors
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: formattedErrors,
          },
        });
        return;
      }

      // Handle unexpected errors during validation
      console.error('Unexpected validation error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred during validation',
        },
      });
      return;
    }
  };
};

/**
 * Create a validation middleware that sanitizes input
 * Useful for preventing XSS and injection attacks
 * 
 * @param schema - Validation schema
 * @param options - Sanitization options
 * @returns Express middleware function
 */
export const validateAndSanitize = (
  schema: ValidationSchema,
  options?: {
    stripUnknown?: boolean;
    trimStrings?: boolean;
  }
) => {
  const { stripUnknown = true, trimStrings = true } = options || {};

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate and sanitize body
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
        
        if (trimStrings) {
          req.body = trimObjectStrings(req.body);
        }
      }

      // Validate and sanitize params
      if (schema.params) {
        const validatedParams = await schema.params.parseAsync(req.params);
        req.params = (trimStrings ? trimObjectStrings(validatedParams) : validatedParams) as any;
      }

      // Validate and sanitize query
      if (schema.query) {
        const validatedQuery = await schema.query.parseAsync(req.query);
        req.query = (trimStrings ? trimObjectStrings(validatedQuery) : validatedQuery) as any;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: formattedErrors,
          },
        });
        return;
      }

      console.error('Unexpected validation error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred during validation',
        },
      });
      return;
    }
  };
};

/**
 * Helper: Trim all string values in an object recursively
 */
function trimObjectStrings(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return obj.trim();
  }

  if (Array.isArray(obj)) {
    return obj.map(trimObjectStrings);
  }

  if (typeof obj === 'object') {
    const trimmed: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        trimmed[key] = trimObjectStrings(obj[key]);
      }
    }
    return trimmed;
  }

  return obj;
}

/**
 * Validation error handler
 * Can be used as a catch-all for validation errors
 */
export const handleValidationError = (
  error: ZodError,
  req: Request,
  res: Response
): void => {
  const formattedErrors = error.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: formattedErrors,
    },
  });
};

/**
 * Export validation utilities
 */
export default {
  validate,
  validateAndSanitize,
  handleValidationError,
};