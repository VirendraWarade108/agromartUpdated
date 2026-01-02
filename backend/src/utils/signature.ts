import crypto from 'crypto';
import { env } from '../config/env';

/**
 * Verify Stripe-style webhook signature
 * @param payload - Raw request body (string)
 * @param signature - Signature from header
 * @param secret - Webhook secret
 * @returns boolean - true if signature is valid
 */
export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  try {
    // Parse signature header (format: t=timestamp,v1=signature)
    const elements = signature.split(',');
    const signatureMap: Record<string, string> = {};
    
    elements.forEach((element) => {
      const [key, value] = element.split('=');
      signatureMap[key] = value;
    });

    const timestamp = signatureMap['t'];
    const expectedSignature = signatureMap['v1'];

    if (!timestamp || !expectedSignature) {
      return false;
    }

    // Check timestamp freshness (5 minutes tolerance)
    const currentTime = Math.floor(Date.now() / 1000);
    const tolerance = 300; // 5 minutes
    
    if (Math.abs(currentTime - parseInt(timestamp)) > tolerance) {
      return false;
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    // Compare signatures (constant-time comparison)
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(computedSignature)
    );
  } catch (error) {
    return false;
  }
};

/**
 * Generate idempotency key from event
 */
export const generateIdempotencyKey = (eventId: string): string => {
  return `webhook:${eventId}`;
};