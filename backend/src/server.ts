import app from './app';
import { env } from './config/env';

const PORT = env.PORT;

/**
 * Start server
 */
const server = app.listen(PORT, () => {
  console.log('=================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
  console.log(`📡 API URL: http://localhost:${PORT}/api`);
  console.log(`🔗 Frontend URL: ${env.FRONTEND_URL}`);
  console.log('=================================');
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (err: Error) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (err: Error) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

export default server;