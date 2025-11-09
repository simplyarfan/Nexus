/**
 * Prisma Client Singleton for Next.js API Routes
 *
 * This provides a single Prisma Client instance for Next.js API routes.
 * Uses the backend's Prisma schema via relative path resolution.
 *
 * IMPORTANT: Only use this in Next.js API routes (/pages/api/*).
 * Do NOT import this in client-side components.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

/**
 * Create Prisma Client with production-ready configuration
 * Points to the backend's Prisma schema and POSTGRES_URL_NON_POOLING
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
 * during hot-reload
 */
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown handler
 */
if (typeof window === 'undefined') {
  // Only run in Node.js environment (server-side)
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export { prisma };
