/**
 * Re-match all existing job applications to populate skill breakdown data
 * This adds matched_required_skills, unmatched_required_skills, etc.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const intelligentMatching = require('../services/intelligentMatching.service');

async function rematchWithSkillsBreakdown() {
  try {
    console.log('🔄 Re-matching candidates to populate skill breakdown data...\n');

    // Get all job positions
    const jobs = await prisma.job_positions.findMany({
      where: { status: 'open' },
    });

    console.log(`📋 Found ${jobs.length} open job positions\n`);

    for (const job of jobs) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📌 Job: ${job.title} (ID: ${job.id})`);
      console.log(`   Required Skills: ${job.required_skills?.join(', ') || 'None'}`);
      console.log(`   Preferred Skills: ${job.preferred_skills?.join(', ') || 'None'}`);

      // Get existing applications for this job
      const applications = await prisma.job_applications.findMany({
        where: { job_position_id: job.id },
        include: {
          candidate_profiles: true,
        },
      });

      console.log(`   📊 ${applications.length} existing matches to update\n`);

      for (const app of applications) {
        const candidate = app.candidate_profiles;
        if (!candidate) continue;

        try {
          // Calculate match with detailed skill breakdown
          const matchResult = await intelligentMatching.calculateComprehensiveMatch(candidate, job);

          // Update with skill breakdown data
          await prisma.job_applications.update({
            where: { id: app.id },
            data: {
              position_match_score: matchResult.position_match_score,
              skills_match_score: matchResult.skills_match_score,
              experience_match_score: matchResult.experience_match_score,
              location_match_score: matchResult.location_match_score,
              salary_match_score: matchResult.salary_match_score,
              context_match_score: matchResult.context_match_score,
              match_reasoning: matchResult.match_reasoning,
              match_strengths: matchResult.match_strengths,
              match_concerns: matchResult.match_concerns,
              match_category: matchResult.match_category,
              // NEW: Detailed skill breakdown
              matched_required_skills: matchResult.matched_required_skills || [],
              unmatched_required_skills: matchResult.unmatched_required_skills || [],
              matched_preferred_skills: matchResult.matched_preferred_skills || [],
              unmatched_preferred_skills: matchResult.unmatched_preferred_skills || [],
              candidate_skills_used: matchResult.candidate_skills_used || [],
            },
          });

          console.log(`   ✅ ${candidate.name}: ${matchResult.skills_match_score}% skills`);
          console.log(
            `      Matched Required: ${matchResult.matched_required_skills?.join(', ') || 'None'}`,
          );
          console.log(
            `      Unmatched Required: ${matchResult.unmatched_required_skills?.join(', ') || 'None'}`,
          );

          // Add delay to avoid Groq rate limits (10 seconds between AI calls)
          await new Promise((resolve) => setTimeout(resolve, 10000));
        } catch (err) {
          console.error(`   ❌ Error updating ${candidate.name}:`, err.message);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Skill breakdown data population complete!');
    console.log('   You can now see detailed skill analysis in the candidates view.\n');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

rematchWithSkillsBreakdown();
