const jobPositionService = require('../services/jobPositionService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Regenerate Matches Script
 * Deletes all existing matches and regenerates them from scratch
 */

async function regenerateMatches() {
  try {
    const jobPositionId = '3fe076c4-d972-4494-a017-432a2c75833c'; // Scrum Master position

    console.log('\n🔄 Regenerating matches for job position:', jobPositionId);
    console.log('⏳ This may take a minute...\n');

    // Step 1: Delete all existing matches for this job position
    const deleteResult = await prisma.job_applications.deleteMany({
      where: {
        job_position_id: jobPositionId,
      },
    });

    console.log(`🗑️  Deleted ${deleteResult.count} existing matches\n`);

    // Step 2: Regenerate matches using the auto-match function
    const result = await jobPositionService.autoMatchJobToCandidates(jobPositionId);

    if (result.success) {
      console.log('\n✅ Matching complete!');
      console.log(`📊 Created ${result.matchCount} new matches\n`);

      // Fetch and display the new matches
      const matches = await prisma.job_applications.findMany({
        where: { job_position_id: jobPositionId },
        include: {
          candidate_profiles: {
            select: { name: true },
          },
        },
        orderBy: { position_match_score: 'desc' },
      });

      console.log('📋 All Matches:');
      matches.forEach((match, index) => {
        console.log(
          `   ${index + 1}. ${match.candidate_profiles.name} - Score: ${match.position_match_score}% (${match.match_category})`,
        );
      });
    } else {
      console.error('\n❌ Matching failed:', result.error);
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error regenerating matches:', error.message);
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

regenerateMatches();
