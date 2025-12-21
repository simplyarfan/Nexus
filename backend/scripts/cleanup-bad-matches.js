/**
 * Cleanup script: Remove job applications with <20% skills match
 * These are irrelevant candidates that shouldn't have been matched
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupBadMatches() {
  try {
    console.log('🧹 Cleaning up irrelevant job matches (skills < 20%)...\n');

    // Find and delete applications with skills_match_score < 20
    const badMatches = await prisma.job_applications.findMany({
      where: {
        skills_match_score: {
          lt: 20
        }
      },
      include: {
        candidate_profiles: {
          select: { name: true }
        },
        job_positions: {
          select: { title: true }
        }
      }
    });

    console.log(`Found ${badMatches.length} irrelevant matches to remove:\n`);

    for (const match of badMatches) {
      console.log(`  ❌ ${match.candidate_profiles?.name || 'Unknown'} -> ${match.job_positions?.title || 'Unknown'} (Skills: ${match.skills_match_score}%)`);
    }

    // Delete them
    const deleted = await prisma.job_applications.deleteMany({
      where: {
        skills_match_score: {
          lt: 20
        }
      }
    });

    console.log(`\n✅ Deleted ${deleted.count} irrelevant matches`);

  } catch (error) {
    console.error('Error cleaning up:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupBadMatches();
