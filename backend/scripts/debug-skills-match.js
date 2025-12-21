/**
 * Debug script: Check why Scrum Master candidates are getting low skills scores
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const intelligentMatching = require('../services/intelligentMatching.service');

async function debugSkillsMatch() {
  try {
    console.log('🔍 Debugging Skills Matching...\n');

    // Find the Scrum Master job
    const scrumJob = await prisma.job_positions.findFirst({
      where: {
        title: { contains: 'Scrum', mode: 'insensitive' },
      },
    });

    if (!scrumJob) {
      console.log('❌ No Scrum Master job found');
      return;
    }

    console.log('📋 JOB: ' + scrumJob.title);
    console.log('   Required Skills:', scrumJob.required_skills);
    console.log('   Preferred Skills:', scrumJob.preferred_skills);
    console.log('\n' + '='.repeat(80) + '\n');

    // Find Anum and Usman
    const candidates = await prisma.candidate_profiles.findMany({
      where: {
        OR: [
          { name: { contains: 'Anum', mode: 'insensitive' } },
          { name: { contains: 'Usman', mode: 'insensitive' } },
        ],
      },
    });

    for (const candidate of candidates) {
      console.log(`\n👤 CANDIDATE: ${candidate.name}`);
      console.log(`   Current Title: ${candidate.current_title}`);
      console.log(`   Primary Skills:`, candidate.primary_skills);
      console.log('\n   --- Skill Matching Analysis ---');

      // Test each required skill
      for (const reqSkill of scrumJob.required_skills || []) {
        let matched = false;
        let matchedBy = null;

        for (const candSkill of candidate.primary_skills || []) {
          const s1 = candSkill.toLowerCase().trim();
          const s2 = reqSkill.toLowerCase().trim();

          // Exact match
          if (s1 === s2) {
            matched = true;
            matchedBy = `exact: "${candSkill}"`;
            break;
          }

          // Partial match
          if (s1.includes(s2) || s2.includes(s1)) {
            matched = true;
            matchedBy = `partial: "${candSkill}" contains/in "${reqSkill}"`;
            break;
          }
        }

        console.log(
          `   ${matched ? '✅' : '❌'} Required: "${reqSkill}" ${matched ? `→ ${matchedBy}` : '→ NO MATCH'}`,
        );
      }

      // Calculate actual score
      const skillMatch = intelligentMatching.calculateSkillMatch(
        candidate.primary_skills || [],
        scrumJob.required_skills || [],
        scrumJob.preferred_skills || [],
      );

      console.log(`\n   📊 CALCULATED SCORE: ${skillMatch.score}%`);
      console.log(
        `      Required: ${skillMatch.requiredMatch}% (${skillMatch.matchedRequired.length}/${scrumJob.required_skills?.length || 0})`,
      );
      console.log(
        `      Preferred: ${skillMatch.preferredMatch}% (${skillMatch.matchedPreferred.length}/${scrumJob.preferred_skills?.length || 0})`,
      );
      console.log(`      Matched Required:`, skillMatch.matchedRequired);
      console.log(`      Matched Preferred:`, skillMatch.matchedPreferred);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSkillsMatch();
