/**
 * Re-match candidates for Scrum Master job with updated skill synonyms
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const intelligentMatching = require('../services/intelligentMatching.service');

async function rematchScrumMasterJob() {
  try {
    console.log('🔄 Re-matching candidates for Scrum Master job...\n');

    // Find the Scrum Master job
    const scrumJob = await prisma.job_positions.findFirst({
      where: {
        title: { contains: 'Scrum', mode: 'insensitive' }
      }
    });

    if (!scrumJob) {
      console.log('❌ No Scrum Master job found');
      return;
    }

    console.log(`📋 Found job: ${scrumJob.title} (ID: ${scrumJob.id})`);
    console.log(`   Required Skills: ${scrumJob.required_skills?.join(', ')}`);
    console.log('\n' + '='.repeat(80) + '\n');

    // Delete existing applications for this job
    const deleted = await prisma.job_applications.deleteMany({
      where: { job_position_id: scrumJob.id }
    });
    console.log(`🗑️  Deleted ${deleted.count} existing matches\n`);

    // Re-run matching using autoMatchCandidatesToJob
    console.log('🤖 Running AI matching...\n');
    const result = await intelligentMatching.autoMatchCandidatesToJob(scrumJob.id);

    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ Matching complete! ${result.matchCount} candidates matched`);

    // Show final results
    const applications = await prisma.job_applications.findMany({
      where: { job_position_id: scrumJob.id },
      include: {
        candidate_profiles: {
          select: { name: true, current_title: true }
        }
      },
      orderBy: { position_match_score: 'desc' }
    });

    console.log('\n📊 Final Results:\n');
    for (const app of applications) {
      console.log(`  ${app.candidate_profiles?.name || 'Unknown'}`);
      console.log(`    Title: ${app.candidate_profiles?.current_title || 'N/A'}`);
      console.log(`    Overall: ${app.position_match_score}% | Skills: ${app.skills_match_score}% | Context: ${app.context_match_score}%`);
      console.log(`    Suitable: ${app.match_category ? '✅' : '❌'}\n`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

rematchScrumMasterJob();
