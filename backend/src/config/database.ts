import { PrismaClient } from '@prisma/client';
import { env } from './env';

/**
 * Prisma Client Instance
 * 
 * This is the main database connection used throughout the app.
 * We create a single instance and reuse it to avoid too many connections.
 */
const prisma = new PrismaClient({
  log: env.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
});

/**
 * Connect to database
 * Call this when server starts
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1); // Exit if database connection fails
  }
};

/**
 * Disconnect from database
 * Call this when server shuts down
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting database:', error);
  }
};

/**
 * Handle graceful shutdown
 */
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});

export default prisma;