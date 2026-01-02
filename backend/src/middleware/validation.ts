import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

interface ValidationSchema {
  body?: AnyZodObject;
  params?: AnyZodObject;
  query?: AnyZodObject;
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
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate body if schema provided
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }

      // Validate params if schema provided
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }

      // Validate query if schema provided
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into a more readable structure
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
            details: formattedErrors,
          },
        });
      }

      // Handle unexpected errors
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred during validation',
        },
      });
    }
  };
};