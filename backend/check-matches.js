const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMatches() {
  const jobPositionId = '3fe076c4-d972-4494-a017-432a2c75833c';

  console.log(`\n🔍 Checking matches for job position: ${jobPositionId}\n`);

  const matches = await prisma.job_applications.findMany({
    where: {
      job_position_id: jobPositionId,
    },
    include: {
      candidate_profiles: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      position_match_score: 'desc',
    },
  });

  console.log(`Total matches found: ${matches.length}\n`);

  matches.forEach((match, index) => {
    console.log(`${index + 1}. ${match.candidate_profiles.name} (${match.candidate_profiles.email})`);
    console.log(`   Match Score: ${match.position_match_score}% | Category: ${match.match_category} | Status: ${match.status}`);
    console.log(`   Skills: ${match.skills_match_score}% | Experience: ${match.experience_match_score}%`);
    console.log(`   Auto-matched: ${match.auto_matched}\n`);
  });

  // Check matches >= 60%
  const highMatches = matches.filter(m => m.position_match_score >= 60);
  console.log(`\nMatches >= 60%: ${highMatches.length}`);

  await prisma.$disconnect();
}

checkMatches().catch(console.error);
