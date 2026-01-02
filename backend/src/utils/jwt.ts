const jwt = require('jsonwebtoken');
import { env } from '../config/env';

/**
 * Payload stored inside JWT token
 */
export interface JwtPayload {
  userId: string;
  email: string;
  isAdmin?: boolean;
}

/**
 * Token pair returned after login
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate access token (short-lived)
 * Used for API requests
 * 
 * @param payload - User data to store in token
 * @returns JWT access token
 */
export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

/**
 * Generate refresh token (long-lived)
 * Used to get new access token when it expires
 * 
 * @param payload - User data to store in token
 * @returns JWT refresh token
 */
export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
};

/**
 * Generate both access and refresh tokens
 * 
 * @param payload - User data
 * @returns Object with both tokens
 */
export const generateTokenPair = (payload: JwtPayload): TokenPair => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/**
 * Verify access token
 * 
 * @param token - JWT token from request header
 * @returns Decoded payload if valid
 * @throws Error if token invalid or expired
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
};

/**
 * Verify refresh token
 * 
 * @param token - JWT refresh token
 * @returns Decoded payload if valid
 * @throws Error if token invalid or expired
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    throw new Error('Invalid refresh token');
  }
};