const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Groq = require('groq-sdk');

/**
 * INTELLIGENT MATCHING SERVICE
 * Advanced AI-powered candidate-job matching with semantic understanding
 * Prevents bad matches (e.g., AI Engineer → Scrum Master)
 */

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

class IntelligentMatchingService {
  /**
   * Skill Synonym Database for Semantic Matching
   * Helps match "JavaScript" with "JS", "React" with "ReactJS", etc.
   */
  skillSynonyms = {
    // Programming Languages
    javascript: ['js', 'ecmascript', 'es6', 'es2015', 'node.js', 'nodejs'],
    python: ['py', 'python3'],
    typescript: ['ts'],
    'c++': ['cpp', 'cplusplus'],
    'c#': ['csharp', 'dotnet', '.net'],

    // Frontend Frameworks
    react: ['reactjs', 'react.js', 'react native'],
    vue: ['vuejs', 'vue.js'],
    angular: ['angularjs', 'angular.js'],

    // Backend Frameworks
    express: ['expressjs', 'express.js'],
    django: ['django rest framework', 'drf'],
    flask: [],
    'spring boot': ['spring', 'spring framework'],

    // Databases
    postgresql: ['postgres', 'psql'],
    mongodb: ['mongo'],
    mysql: [],
    redis: [],

    // Cloud & DevOps
    aws: ['amazon web services', 'ec2', 's3', 'lambda'],
    azure: ['microsoft azure'],
    gcp: ['google cloud', 'google cloud platform'],
    docker: ['containerization'],
    kubernetes: ['k8s', 'container orchestration'],

    // Agile & Methodologies
    agile: ['agile methodology', 'agile frameworks', 'agile development'],
    scrum: ['scrum master', 'scrum framework'],
    kanban: [],
    'ci/cd': ['continuous integration', 'continuous deployment', 'devops'],

    // Soft Skills
    leadership: ['team leadership', 'people management', 'team management'],
    communication: ['verbal communication', 'written communication'],
    'problem solving': ['analytical thinking', 'critical thinking'],
    collaboration: ['teamwork', 'team collaboration'],
  };

  /**
   * Check if two skills match semantically
   */
  skillsMatch(skill1, skill2) {
    const s1 = skill1.toLowerCase().trim();
    const s2 = skill2.toLowerCase().trim();

    // Exact match
    if (s1 === s2) return true;

    // Check synonyms
    for (const [key, synonyms] of Object.entries(this.skillSynonyms)) {
      const allVariants = [key, ...synonyms];
      if (allVariants.includes(s1) && allVariants.includes(s2)) {
        return true;
      }
    }

    // Partial match (contains)
    if (s1.includes(s2) || s2.includes(s1)) {
      return true;
    }

    return false;
  }

  /**
   * Calculate skill match percentage between candidate and job
   */
  calculateSkillMatch(candidateSkills, requiredSkills, preferredSkills) {
    if (!candidateSkills || candidateSkills.length === 0) {
      return { score: 0, matchedRequired: [], matchedPreferred: [] };
    }

    const matchedRequired = [];
    const matchedPreferred = [];

    // Match required skills
    requiredSkills.forEach((reqSkill) => {
      const found = candidateSkills.find((candSkill) => this.skillsMatch(candSkill, reqSkill));
      if (found) {
        matchedRequired.push(reqSkill);
      }
    });

    // Match preferred skills
    preferredSkills.forEach((prefSkill) => {
      const found = candidateSkills.find((candSkill) => this.skillsMatch(candSkill, prefSkill));
      if (found) {
        matchedPreferred.push(prefSkill);
      }
    });

    // Calculate score
    const requiredMatch = requiredSkills.length > 0
      ? (matchedRequired.length / requiredSkills.length) * 100
      : 100;

    const preferredMatch = preferredSkills.length > 0
      ? (matchedPreferred.length / preferredSkills.length) * 100
      : 100;

    // Weighted: 70% required, 30% preferred
    const score = Math.round((requiredMatch * 0.7) + (preferredMatch * 0.3));

    return {
      score,
      matchedRequired,
      matchedPreferred,
      requiredMatch: Math.round(requiredMatch),
      preferredMatch: Math.round(preferredMatch),
    };
  }

  /**
   * Calculate experience match
   */
  calculateExperienceMatch(candidateYears, candidateLevel, jobLevel) {
    let score = 50; // Base score

    // Experience level mapping
    const levelMap = {
      entry: { min: 0, max: 2, score: 60 },
      mid: { min: 2, max: 5, score: 70 },
      senior: { min: 5, max: 10, score: 85 },
      lead: { min: 8, max: 15, score: 90 },
      executive: { min: 10, max: 30, score: 95 },
    };

    const jobLevelReq = levelMap[jobLevel] || { min: 0, max: 100, score: 70 };

    // Check if candidate's years match the job level
    if (candidateYears >= jobLevelReq.min && candidateYears <= jobLevelReq.max) {
      score = jobLevelReq.score;
    } else if (candidateYears > jobLevelReq.max) {
      // Overqualified (still good)
      score = 80;
    } else {
      // Underqualified
      score = 40;
    }

    // Check if candidate's level matches job level
    if (candidateLevel && candidateLevel === jobLevel) {
      score = Math.min(100, score + 10);
    }

    return Math.round(score);
  }

  /**
   * Calculate location/remote match
   */
  calculateLocationMatch(candidateLocation, candidateWillingToRelocate, jobLocation, jobRemotePolicy) {
    // Fully remote jobs = 100% match
    if (jobRemotePolicy === 'remote') {
      return 100;
    }

    // Hybrid jobs = 80% match
    if (jobRemotePolicy === 'hybrid') {
      return 80;
    }

    // Onsite: Check location match
    if (candidateLocation && jobLocation) {
      const candLoc = candidateLocation.toLowerCase();
      const jobLoc = jobLocation.toLowerCase();

      if (candLoc.includes(jobLoc) || jobLoc.includes(candLoc)) {
        return 100; // Same location
      }

      if (candidateWillingToRelocate) {
        return 70; // Willing to relocate
      }

      return 30; // Different location, not willing to relocate
    }

    return 60; // Unknown
  }

  /**
   * Calculate salary match
   * Returns 0 if candidate has no salary data (not neutral - cannot match unknown)
   */
  calculateSalaryMatch(candidateMin, candidateMax, jobMin, jobMax) {
    // If candidate has no salary expectations, return 0 (no match data available)
    if (!candidateMin && !candidateMax) {
      return 0;
    }

    // If job has no salary range, but candidate has expectations, return 0 (cannot match)
    if (!jobMin && !jobMax) {
      return 0;
    }

    // Perfect match: overlap exists
    if (candidateMax >= jobMin && candidateMin <= jobMax) {
      return 100;
    }

    // Candidate expects too much
    if (candidateMin > jobMax) {
      return 30;
    }

    // Candidate expects too little (potential fit)
    if (candidateMax < jobMin) {
      return 60;
    }

    return 50;
  }

  /**
   * AI-Powered Context Match Analysis
   * Prevents bad matches like AI Engineer → Scrum Master
   */
  async calculateContextMatch(candidate, jobPosition) {
    try {
      // Format requirements as bullet points (they may contain full sentences)
      const requirementsText = jobPosition.requirements && jobPosition.requirements.length > 0
        ? jobPosition.requirements.map(req => `  • ${req}`).join('\n')
        : 'Not specified';

      // Format responsibilities as bullet points
      const responsibilitiesText = jobPosition.responsibilities && jobPosition.responsibilities.length > 0
        ? jobPosition.responsibilities.map(resp => `  • ${resp}`).join('\n')
        : 'Not specified';

      const prompt = `You are an expert HR recruiter. Analyze if this candidate's background is suitable for this job role, considering role domain and context.

CANDIDATE PROFILE:
- Name: ${candidate.name}
- Current Title: ${candidate.current_title || 'Not specified'}
- Current Company: ${candidate.current_company || 'Not specified'}
- Years of Experience: ${candidate.years_of_experience || 0}
- Primary Skills: ${candidate.primary_skills?.join(', ') || 'None'}
- Strengths: ${candidate.strengths?.join(', ') || 'None'}

JOB POSITION:
- Title: ${jobPosition.title}
- Department: ${jobPosition.department}
- Experience Level: ${jobPosition.experience_level}
- Description: ${jobPosition.description || 'Not specified'}

Requirements:
${requirementsText}

Responsibilities:
${responsibilitiesText}

Required Skills (Keywords):
${jobPosition.required_skills?.join(', ') || 'None'}

Preferred Skills (Keywords):
${jobPosition.preferred_skills?.join(', ') || 'None'}

ANALYZE:
1. Is the candidate's background relevant to this role's domain?
2. Do they meet the detailed requirements listed above (including both keyword skills AND full sentence requirements)?
3. Would their experience translate well to the responsibilities of this position?
4. Are there any red flags (e.g., purely technical background for leadership role)?

Return ONLY valid JSON:
{
  "score": 0-100,
  "is_suitable": true/false,
  "reasoning": "Brief explanation",
  "domain_match": "excellent | good | fair | poor",
  "concerns": ["concern 1", "concern 2"] or []
}`;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert recruiter analyzing candidate-job fit. Respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content || '{}';
      const cleaned = response.replace(/```json\n/g, '').replace(/```\n/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(cleaned);

      return {
        score: result.score || 50,
        isSuitable: result.is_suitable !== false,
        reasoning: result.reasoning || '',
        domainMatch: result.domain_match || 'fair',
        concerns: result.concerns || [],
      };
    } catch (error) {
      console.error('Error in context match analysis:', error);
      return {
        score: 60,
        isSuitable: true,
        reasoning: 'Unable to perform AI analysis',
        domainMatch: 'fair',
        concerns: [],
      };
    }
  }

  /**
   * Comprehensive AI-Powered Match Calculation
   * Main matching function
   */
  async calculateComprehensiveMatch(candidate, jobPosition) {
    try {
      console.log(`\n🤖 Matching: ${candidate.name} → ${jobPosition.title}`);

      // 1. Skills Match (40% weight)
      const skillMatch = this.calculateSkillMatch(
        candidate.primary_skills || [],
        jobPosition.required_skills || [],
        jobPosition.preferred_skills || [],
      );

      // 2. Experience Match (25% weight)
      const experienceMatch = this.calculateExperienceMatch(
        candidate.years_of_experience || 0,
        null, // We don't have candidate level in schema
        jobPosition.experience_level,
      );

      // 3. Location Match (10% weight)
      const locationMatch = this.calculateLocationMatch(
        candidate.location,
        candidate.willing_to_relocate,
        jobPosition.location,
        jobPosition.remote_policy,
      );

      // 4. Salary Match (5% weight)
      const salaryMatch = this.calculateSalaryMatch(
        candidate.expected_salary_min,
        candidate.expected_salary_max,
        jobPosition.salary_range_min,
        jobPosition.salary_range_max,
      );

      // 5. AI Context Match (20% weight) - CRITICAL for preventing bad matches
      const contextMatch = await this.calculateContextMatch(candidate, jobPosition);

      // Calculate weighted overall score
      const overallScore = Math.round(
        skillMatch.score * 0.4 +
        experienceMatch * 0.25 +
        contextMatch.score * 0.2 +
        locationMatch * 0.1 +
        salaryMatch * 0.05,
      );

      // Determine match category
      let category = 'moderate';
      if (overallScore >= 85) category = 'excellent';
      else if (overallScore >= 70) category = 'strong';

      // Build strengths and concerns
      const strengths = [];
      const concerns = [];

      if (skillMatch.requiredMatch >= 70) {
        strengths.push(`Strong skill match (${skillMatch.matchedRequired.length}/${jobPosition.required_skills?.length || 0} required skills)`);
      } else if (skillMatch.requiredMatch < 50) {
        concerns.push(`Missing ${Math.round(100 - skillMatch.requiredMatch)}% of required skills`);
      }

      if (experienceMatch >= 80) {
        strengths.push(`Experience level is a great fit`);
      } else if (experienceMatch < 50) {
        concerns.push(`Experience level may not align`);
      }

      if (contextMatch.domainMatch === 'excellent' || contextMatch.domainMatch === 'good') {
        strengths.push(`Background aligns well with role domain`);
      }

      if (contextMatch.concerns && contextMatch.concerns.length > 0) {
        concerns.push(...contextMatch.concerns);
      }

      if (locationMatch === 100) {
        strengths.push(`Perfect location match`);
      } else if (locationMatch < 40) {
        concerns.push(`Location mismatch`);
      }

      console.log(`  ✓ Overall Score: ${overallScore}% (${category})`);
      console.log(`    - Skills: ${skillMatch.score}%`);
      console.log(`    - Experience: ${experienceMatch}%`);
      console.log(`    - Context: ${contextMatch.score}%`);

      return {
        position_match_score: overallScore,
        skills_match_score: skillMatch.score,
        experience_match_score: experienceMatch,
        location_match_score: locationMatch,
        salary_match_score: salaryMatch,
        context_match_score: contextMatch.score,
        match_reasoning: contextMatch.reasoning,
        match_strengths: strengths,
        match_concerns: concerns,
        match_category: category,
        is_suitable: contextMatch.isSuitable && overallScore >= 60,
      };
    } catch (error) {
      console.error('Error in comprehensive match calculation:', error);
      throw error;
    }
  }

  /**
   * Match candidates for a specific job position
   * Returns candidates with score >= minScore (default: 60%)
   */
  async matchCandidatesForJob(jobPositionId, options = {}) {
    const {
      minScore = 60,
      limit = 50,
      includeUnavailable = false,
    } = options;

    try {
      console.log(`\n📊 Finding candidates for job position: ${jobPositionId}`);

      // Get job position
      const jobPosition = await prisma.job_positions.findUnique({
        where: { id: jobPositionId },
      });

      if (!jobPosition) {
        throw new Error('Job position not found');
      }

      // Get available candidates (top 100 by overall score)
      const availabilityFilter = includeUnavailable
        ? {}
        : {
            availability_status: {
              in: ['available', 'open_to_opportunities', 'actively_looking'],
            },
          };

      const candidates = await prisma.candidate_profiles.findMany({
        where: availabilityFilter,
        orderBy: {
          overall_match_score: 'desc',
        },
        take: 100, // Optimize by limiting to top candidates
      });

      console.log(`  Found ${candidates.length} candidates to analyze`);

      // Calculate match scores for all candidates
      const matches = [];
      for (const candidate of candidates) {
        const matchResult = await this.calculateComprehensiveMatch(candidate, jobPosition);

        if (matchResult.is_suitable && matchResult.position_match_score >= minScore) {
          matches.push({
            candidate_id: candidate.id,
            candidate,
            ...matchResult,
          });
        }
      }

      // Sort by score and limit
      matches.sort((a, b) => b.position_match_score - a.position_match_score);
      const topMatches = matches.slice(0, limit);

      console.log(`  ✓ Found ${topMatches.length} matches (>= ${minScore}%)`);

      return {
        success: true,
        matches: topMatches,
        total: topMatches.length,
        jobPosition,
      };
    } catch (error) {
      console.error('Error matching candidates for job:', error);
      return {
        success: false,
        message: error.message,
        matches: [],
      };
    }
  }

  /**
   * Match job positions for a specific candidate
   * Used when new candidate is uploaded
   */
  async matchJobsForCandidate(candidateId, options = {}) {
    const {
      minScore = 60,
      limit = 20,
    } = options;

    try {
      console.log(`\n📊 Finding job positions for candidate: ${candidateId}`);

      // Get candidate
      const candidate = await prisma.candidate_profiles.findUnique({
        where: { id: candidateId },
      });

      if (!candidate) {
        throw new Error('Candidate not found');
      }

      // Get all open job positions
      const jobPositions = await prisma.job_positions.findMany({
        where: {
          status: 'open',
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      console.log(`  Found ${jobPositions.length} open positions to analyze`);

      // Calculate match scores for all positions
      const matches = [];
      for (const jobPosition of jobPositions) {
        const matchResult = await this.calculateComprehensiveMatch(candidate, jobPosition);

        if (matchResult.is_suitable && matchResult.position_match_score >= minScore) {
          matches.push({
            job_position_id: jobPosition.id,
            jobPosition,
            ...matchResult,
          });
        }
      }

      // Sort by score and limit
      matches.sort((a, b) => b.position_match_score - a.position_match_score);
      const topMatches = matches.slice(0, limit);

      console.log(`  ✓ Found ${topMatches.length} matches (>= ${minScore}%)`);

      return {
        success: true,
        matches: topMatches,
        total: topMatches.length,
        candidate,
      };
    } catch (error) {
      console.error('Error matching jobs for candidate:', error);
      return {
        success: false,
        message: error.message,
        matches: [],
      };
    }
  }
}

module.exports = new IntelligentMatchingService();
