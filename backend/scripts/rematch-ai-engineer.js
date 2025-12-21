const intelligentMatching = require('../services/intelligentMatching.service.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🎯 Running matching for AI Engineer position...');
    const result = await intelligentMatching.matchCandidatesForJob('ebff0708-3961-417d-829b-cebb456ea1f8', {
      minScore: 0,
      limit: 50
    });

    if (!result.success || result.matches.length === 0) {
      console.log('❌ No matches found!');
      process.exit(1);
    }

    console.log(`\n✅ Found ${result.matches.length} matches. Storing in database...\n`);

    for (const match of result.matches) {
      const existing = await prisma.job_applications.findUnique({
        where: {
          candidate_id_job_position_id: {
            candidate_id: match.candidate_id,
            job_position_id: 'ebff0708-3961-417d-829b-cebb456ea1f8'
          }
        }
      });

      if (!existing) {
        await prisma.job_applications.create({
          data: {
            candidate_id: match.candidate_id,
            job_position_id: 'ebff0708-3961-417d-829b-cebb456ea1f8',
            status: 'matched',
            position_match_score: match.position_match_score,
            skills_match_score: match.skills_match_score,
            experience_match_score: match.experience_match_score,
            location_match_score: match.location_match_score,
            salary_match_score: match.salary_match_score,
            context_match_score: match.context_match_score,
            match_reasoning: match.match_reasoning,
            match_strengths: match.match_strengths,
            match_concerns: match.match_concerns,
            match_category: match.match_category,
            auto_matched: true
          }
        });
        console.log(`  ✓ Stored match: ${match.candidate.name} (${match.position_match_score}%)`);
      } else {
        console.log(`  • Already exists: ${match.candidate.name}`);
      }
    }

    console.log(`\n✅ Successfully stored ${result.matches.length} matches!`);
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
