import { createClient } from 'redis';
import { env } from './env';

const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected');
});

/**
 * Connect to Redis
 */
export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

/**
 * Check if key exists in Redis
 */
export const checkIdempotency = async (key: string): Promise<boolean> => {
  const exists = await redisClient.exists(key);
  return exists === 1;
};

/**
 * Set idempotency key with expiration (24 hours)
 */
export const setIdempotency = async (key: string, value: string): Promise<void> => {
  await redisClient.setEx(key, 86400, value); // 24 hours
};

/**
 * Get value from Redis
 */
export const getRedisValue = async (key: string): Promise<string | null> => {
  return await redisClient.get(key);
};

/**
 * Delete key from Redis
 */
export const deleteRedisKey = async (key: string): Promise<void> => {
  await redisClient.del(key);
};

export default redisClient;