import { AppError } from '../middleware/errorHandler';

/**
 * ============================================
 * STANDARDIZED ERROR CREATORS
 * ============================================
 * Pre-configured error creators for common scenarios
 * Ensures consistent error messages and codes across the application
 */

/**
 * Authentication Errors (401)
 */
export const AuthErrors = {
  noToken: () => 
    new AppError('No authentication token provided', 401, 'NO_TOKEN'),
  
  invalidToken: () => 
    new AppError('Invalid authentication token', 401, 'INVALID_TOKEN'),
  
  tokenExpired: () => 
    new AppError('Authentication token has expired', 401, 'TOKEN_EXPIRED'),
  
  invalidCredentials: () => 
    new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'),
  
  accountDisabled: () => 
    new AppError('Your account has been disabled', 401, 'ACCOUNT_DISABLED'),
  
  emailNotVerified: () => 
    new AppError('Please verify your email address to continue', 401, 'EMAIL_NOT_VERIFIED'),
};

/**
 * Authorization Errors (403)
 */
export const AuthorizationErrors = {
  forbidden: () => 
    new AppError('You do not have permission to perform this action', 403, 'FORBIDDEN'),
  
  adminOnly: () => 
    new AppError('Admin access required', 403, 'ADMIN_ONLY'),
  
  notOwner: () => 
    new AppError('You can only access your own resources', 403, 'NOT_OWNER'),
  
  insufficientPermissions: (requiredRole: string) => 
    new AppError(
      `Insufficient permissions. Required role: ${requiredRole}`,
      403,
      'INSUFFICIENT_PERMISSIONS',
      { requiredRole }
    ),
};

/**
 * Not Found Errors (404)
 */
export const NotFoundErrors = {
  resource: (resourceName: string, id?: string) => 
    new AppError(
      id 
        ? `${resourceName} with ID '${id}' not found`
        : `${resourceName} not found`,
      404,
      'RESOURCE_NOT_FOUND',
      { resource: resourceName, id }
    ),
  
  user: (userId: string) => 
    new AppError(`User not found`, 404, 'USER_NOT_FOUND', { userId }),
  
  product: (productId: string) => 
    new AppError(`Product not found`, 404, 'PRODUCT_NOT_FOUND', { productId }),
  
  order: (orderId: string) => 
    new AppError(`Order not found`, 404, 'ORDER_NOT_FOUND', { orderId }),
  
  category: (categoryId: string) => 
    new AppError(`Category not found`, 404, 'CATEGORY_NOT_FOUND', { categoryId }),
  
  address: (addressId: string) => 
    new AppError(`Address not found`, 404, 'ADDRESS_NOT_FOUND', { addressId }),
  
  coupon: (code: string) => 
    new AppError(`Coupon '${code}' not found`, 404, 'COUPON_NOT_FOUND', { code }),
};

/**
 * Validation Errors (400)
 */
export const ValidationErrors = {
  invalidInput: (message: string, details?: any) => 
    new AppError(message, 400, 'INVALID_INPUT', details),
  
  missingField: (fieldName: string) => 
    new AppError(`${fieldName} is required`, 400, 'MISSING_FIELD', { field: fieldName }),
  
  invalidFormat: (fieldName: string, expectedFormat: string) => 
    new AppError(
      `Invalid ${fieldName} format. Expected: ${expectedFormat}`,
      400,
      'INVALID_FORMAT',
      { field: fieldName, expectedFormat }
    ),
  
  invalidId: (idType: string = 'ID') => 
    new AppError(`Invalid ${idType} format`, 400, 'INVALID_ID'),
  
  invalidEmail: () => 
    new AppError('Invalid email address', 400, 'INVALID_EMAIL'),
  
  weakPassword: () => 
    new AppError(
      'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number',
      400,
      'WEAK_PASSWORD'
    ),
  
  passwordMismatch: () => 
    new AppError('Passwords do not match', 400, 'PASSWORD_MISMATCH'),
};

/**
 * Conflict Errors (409)
 */
export const ConflictErrors = {
  duplicate: (resourceName: string, field: string) => 
    new AppError(
      `${resourceName} with this ${field} already exists`,
      409,
      'DUPLICATE_ENTRY',
      { resource: resourceName, field }
    ),
  
  emailExists: (email: string) => 
    new AppError(
      'An account with this email already exists',
      409,
      'EMAIL_EXISTS',
      { email }
    ),
  
  phoneExists: (phone: string) => 
    new AppError(
      'An account with this phone number already exists',
      409,
      'PHONE_EXISTS',
      { phone }
    ),
  
  alreadyExists: (resourceName: string) => 
    new AppError(
      `${resourceName} already exists`,
      409,
      'ALREADY_EXISTS',
      { resource: resourceName }
    ),
};

/**
 * Business Logic Errors (400)
 */
export const BusinessErrors = {
  outOfStock: (productName: string, available: number = 0) => 
    new AppError(
      `${productName} is out of stock`,
      400,
      'OUT_OF_STOCK',
      { product: productName, available }
    ),
  
  insufficientStock: (productName: string, requested: number, available: number) => 
    new AppError(
      `Insufficient stock for ${productName}. Requested: ${requested}, Available: ${available}`,
      400,
      'INSUFFICIENT_STOCK',
      { product: productName, requested, available }
    ),
  
  invalidCoupon: (reason: string) => 
    new AppError(
      `Coupon is invalid: ${reason}`,
      400,
      'INVALID_COUPON',
      { reason }
    ),
  
  couponExpired: () => 
    new AppError('Coupon has expired', 400, 'COUPON_EXPIRED'),
  
  couponUsageLimitReached: () => 
    new AppError('Coupon usage limit has been reached', 400, 'COUPON_LIMIT_REACHED'),
  
  minimumOrderNotMet: (minAmount: number, currentAmount: number) => 
    new AppError(
      `Minimum order amount of ₹${minAmount} not met. Current: ₹${currentAmount}`,
      400,
      'MINIMUM_ORDER_NOT_MET',
      { minAmount, currentAmount }
    ),
  
  cannotCancelOrder: (reason: string) => 
    new AppError(
      `Cannot cancel order: ${reason}`,
      400,
      'CANNOT_CANCEL_ORDER',
      { reason }
    ),
  
  cannotRefundOrder: (reason: string) => 
    new AppError(
      `Cannot refund order: ${reason}`,
      400,
      'CANNOT_REFUND_ORDER',
      { reason }
    ),
  
  paymentFailed: (reason?: string) => 
    new AppError(
      reason ? `Payment failed: ${reason}` : 'Payment failed',
      400,
      'PAYMENT_FAILED',
      { reason }
    ),
  
  emptyCart: () => 
    new AppError('Your cart is empty', 400, 'EMPTY_CART'),
  
  reviewNotAllowed: (reason: string) => 
    new AppError(
      `Cannot submit review: ${reason}`,
      400,
      'REVIEW_NOT_ALLOWED',
      { reason }
    ),
};

/**
 * Rate Limit Errors (429)
 */
export const RateLimitErrors = {
  tooManyRequests: (retryAfter?: number) => 
    new AppError(
      retryAfter
        ? `Too many requests. Please try again in ${retryAfter} seconds`
        : 'Too many requests. Please try again later',
      429,
      'RATE_LIMIT_EXCEEDED',
      { retryAfter }
    ),
  
  tooManyLoginAttempts: (retryAfter?: number) => 
    new AppError(
      retryAfter
        ? `Too many login attempts. Please try again in ${retryAfter} seconds`
        : 'Too many login attempts. Please try again later',
      429,
      'TOO_MANY_LOGIN_ATTEMPTS',
      { retryAfter }
    ),
};

/**
 * Server Errors (500)
 */
export const ServerErrors = {
  internal: (message: string = 'An unexpected error occurred') => 
    new AppError(message, 500, 'INTERNAL_SERVER_ERROR'),
  
  databaseError: () => 
    new AppError('Database error occurred', 500, 'DATABASE_ERROR'),
  
  serviceUnavailable: (serviceName: string) => 
    new AppError(
      `${serviceName} is temporarily unavailable`,
      503,
      'SERVICE_UNAVAILABLE',
      { service: serviceName }
    ),
  
  fileUploadFailed: (reason?: string) => 
    new AppError(
      reason ? `File upload failed: ${reason}` : 'File upload failed',
      500,
      'FILE_UPLOAD_FAILED',
      { reason }
    ),
};

/**
 * ============================================
 * ERROR HELPER FUNCTIONS
 * ============================================
 */

/**
 * Assert condition is true, otherwise throw error
 */
export function assert(
  condition: boolean,
  error: AppError | string,
  statusCode: number = 400
): asserts condition {
  if (!condition) {
    if (typeof error === 'string') {
      throw new AppError(error, statusCode);
    }
    throw error;
  }
}

/**
 * Assert value is not null/undefined, otherwise throw error
 */
export function assertExists<T>(
  value: T | null | undefined,
  error: AppError | string,
  statusCode: number = 404
): asserts value is T {
  if (value === null || value === undefined) {
    if (typeof error === 'string') {
      throw new AppError(error, statusCode);
    }
    throw error;
  }
}

/**
 * Check if error is an AppError instance
 */
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

/**
 * Check if error is operational (expected) vs programmer error
 */
export function isOperationalError(error: any): boolean {
  return isAppError(error) && error.isOperational;
}

/**
 * Wrap error with additional context
 */
export function wrapError(
  originalError: Error,
  message: string,
  statusCode: number = 500
): AppError {
  const wrappedError = new AppError(message, statusCode);
  wrappedError.stack = originalError.stack;
  return wrappedError;
}