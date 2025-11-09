/**
 * Prisma Client Singleton for Ticketing System
 *
 * This provides a single Prisma Client instance that:
 * - Uses POSTGRES_URL_NON_POOLING for read-after-write consistency
 * - Prevents hot-reload issues in development
 * - Properly manages connection lifecycle
 *
 * IMPORTANT: This coexists with the existing database.js connection system.
 * Do NOT remove database.js - it's used by CV Intelligence, Interview Coordinator, etc.
 */

const { PrismaClient } = require('@prisma/client');

const globalForPrisma = global;

/**
 * Create Prisma Client with production-ready configuration
 */
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.POSTGRES_URL_NON_POOLING
    }
  }
});

/**
 * In development, store in global to prevent multiple instances
 * during hot-reload
 */
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown handler
 */
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = { prisma };
