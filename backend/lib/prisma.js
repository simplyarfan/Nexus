/**
 * Prisma Client Singleton for Backend Express API
 *
 * This provides a single Prisma Client instance for the backend.
 * Uses POSTGRES_URL_NON_POOLING for read-after-write consistency.
 */

const { PrismaClient } = require('@prisma/client');

const globalForPrisma = global;

/**
 * Create Prisma Client with production-ready configuration
 */
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.POSTGRES_URL_NON_POOLING,
      },
    },
  });

/**
 * In development, store in global to prevent multiple instances
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
