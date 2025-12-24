const { prisma } = require('../lib/prisma');
const aiService = require('./ai.service');

/**
 * INTELLIGENT MATCHING SERVICE v2.0
 * AI-powered candidate-job matching with semantic understanding
 * Uses HuggingFace AI (unlimited context)
 *
 * KEY CHANGES from v1:
 * - Removed hardcoded skill synonyms (AI handles semantic matching)
 * - Smart batch pre-filter: ONE AI call filters all candidates
 * - Cleaner, more maintainable code
 */

// Rate limiting helper
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const RATE_LIMIT_DELAY_MS = 2000;

class IntelligentMatchingService {
  /**
   * BATCH AI PRE-FILTER
   * Uses ONE AI call to identify potentially relevant candidates
   * AI understands that "WMB" = "IBM WebSphere Message Broker" without hardcoding
   */
  async batchPreFilterCandidates(candidates, jobPosition) {
    try {
      if (candidates.length === 0) return [];

      // SAFEGUARD: Extract keywords from job title for title-based matching
      const jobTitleWords = (jobPosition.title || '')
        .toLowerCase()
        .split(/[\s,./\\-]+/)
        .filter((w) => w.length > 2 && !['the', 'and', 'for', 'with'].includes(w));

      // Extract keywords from required skills as well
      const skillKeywords = (jobPosition.required_skills || [])
        .join(' ')
        .toLowerCase()
        .split(/[\s,./\\-]+/)
        .filter((w) => w.length > 2);

      // ALWAYS include candidates whose title matches job title keywords
      // This prevents the AI from incorrectly filtering out obvious matches
      const titleMatchedCandidates = candidates.filter((c) => {
        const candidateTitle = (c.current_title || '').toLowerCase();
        // Check if candidate title contains ANY job title keywords
        return jobTitleWords.some((word) => candidateTitle.includes(word));
      });

      console.log(
        `  📋 Title-matched candidates (always included): ${titleMatchedCandidates.length}`,
      );
      titleMatchedCandidates.forEach((c) => console.log(`     - ${c.name}: "${c.current_title}"`));

      // Prepare candidate summary for AI (compact format to fit context)
      const candidateSummaries = candidates.map((c) => ({
        id: c.id,
        name: c.name,
        title: c.current_title || 'Not specified',
        skills: (c.primary_skills || []).slice(0, 15).join(', '), // Limit skills for context
        experience: c.years_of_experience || 0,
      }));

      const prompt = `You are an expert HR recruiter. Identify which candidates are POTENTIALLY relevant for this job.
Be INCLUSIVE - include candidates who might be a fit. We'll do detailed analysis later.

JOB POSITION:
- Title: ${jobPosition.title}
- Department: ${jobPosition.department || 'Not specified'}
- Required Skills: ${(jobPosition.required_skills || []).join(', ') || 'None specified'}
- Preferred Skills: ${(jobPosition.preferred_skills || []).join(', ') || 'None specified'}
- Experience Level: ${jobPosition.experience_level || 'Not specified'}

CANDIDATES:
${candidateSummaries
  .map(
    (c, i) => `${i + 1}. [${c.id}] ${c.name} - ${c.title} (${c.experience}y exp)
   Skills: ${c.skills || 'None listed'}`,
  )
  .join('\n')}

IMPORTANT MATCHING RULES:
- Match skill VARIATIONS: "WMB" = "WebSphere Message Broker" = "IBM Message Broker"
- Match skill ABBREVIATIONS: "IIB" = "Integration Bus", "MQ" = "WebSphere MQ", "ACE" = "App Connect Enterprise"
- Match RELATED technologies: IBM integration tools are related to each other
- Consider TRANSFERABLE skills: Similar domains/technologies count
- Be INCLUSIVE: When in doubt, include the candidate

Return ONLY a JSON array of candidate IDs that are potentially relevant:
["id1", "id2", "id3"]

If NO candidates are relevant, return: []`;

      const response = await aiService.chatCompletion(prompt, {
        systemPrompt:
          'You are an expert recruiter. Return only valid JSON arrays. Be inclusive when filtering candidates.',
        temperature: 0.2,
        maxTokens: 2000,
      });

      // Clean up response and extract just the JSON array
      let cleaned = response
        .replace(/```json\n/g, '')
        .replace(/```\n/g, '')
        .replace(/```/g, '')
        .trim();

      // Extract JSON array from response (AI sometimes adds explanatory text)
      // Find the first '[' and last ']' to extract the array
      const firstBracket = cleaned.indexOf('[');
      const lastBracket = cleaned.lastIndexOf(']');
      const arrayMatch =
        firstBracket !== -1 && lastBracket !== -1
          ? [cleaned.substring(firstBracket, lastBracket + 1)]
          : null;
      if (arrayMatch) {
        cleaned = arrayMatch[0];
      }

      let relevantIds = [];
      try {
        relevantIds = JSON.parse(cleaned);
        // Ensure it's an array
        if (!Array.isArray(relevantIds)) {
          console.log('  AI returned non-array, using all candidates');
          return candidates;
        }
      } catch (e) {
        console.error('Failed to parse AI response:', e.message);
        console.error('Raw response:', response.substring(0, 200));
        return candidates; // Fallback: include all candidates
      }

      // Filter candidates by the IDs returned by AI
      const aiFilteredCandidates = candidates.filter((c) => relevantIds.includes(c.id));

      console.log(
        `  🤖 AI pre-filter: ${aiFilteredCandidates.length}/${candidates.length} candidates from AI`,
      );

      // MERGE: Combine title-matched candidates with AI-filtered candidates (no duplicates)
      const titleMatchedIds = new Set(titleMatchedCandidates.map((c) => c.id));
      const aiOnlyFilteredCandidates = aiFilteredCandidates.filter(
        (c) => !titleMatchedIds.has(c.id),
      );

      const finalCandidates = [...titleMatchedCandidates, ...aiOnlyFilteredCandidates];

      console.log(
        `  ✅ Final pre-filter result: ${finalCandidates.length} candidates (${titleMatchedCandidates.length} title-matched + ${aiOnlyFilteredCandidates.length} AI-only)`,
      );

      return finalCandidates;
    } catch (error) {
      console.error('Error in batch pre-filter:', error);
      // On error, return all candidates (don't lose potential matches)
      return candidates;
    }
  }

  /**
   * Calculate experience match score
   * Overqualified candidates should score HIGHER, not lower
   */
  calculateExperienceMatch(candidateYears, jobLevel) {
    const levelMap = {
      entry: { min: 0, max: 2 },
      mid: { min: 2, max: 5 },
      senior: { min: 5, max: 10 },
      lead: { min: 8, max: 15 },
      executive: { min: 10, max: 30 },
    };

    const jobLevelReq = levelMap[jobLevel] || { min: 0, max: 100 };

    if (candidateYears >= jobLevelReq.min && candidateYears <= jobLevelReq.max) {
      return 100; // Perfect match for the level
    } else if (candidateYears > jobLevelReq.max) {
      return 95; // Overqualified is GOOD - more experience is valuable
    } else if (candidateYears >= jobLevelReq.min - 1) {
      return 75; // Slightly under but close enough
    } else {
      return 50; // Underqualified
    }
  }

  /**
   * Calculate location match score
   */
  calculateLocationMatch(candidateLocation, jobLocation, jobRemotePolicy) {
    if (jobRemotePolicy === 'remote') return 100;
    if (jobRemotePolicy === 'hybrid') return 80;

    if (!candidateLocation || !jobLocation) return 60;

    const candLoc = candidateLocation.toLowerCase();
    const jobLoc = jobLocation.toLowerCase();

    // Check for common location words
    const candWords = candLoc.split(/[\s,./\\-]+/).filter((w) => w.length > 2);
    const jobWords = jobLoc.split(/[\s,./\\-]+/).filter((w) => w.length > 2);
    const commonWords = candWords.filter((w) =>
      jobWords.some((jw) => jw.includes(w) || w.includes(jw)),
    );

    if (commonWords.length > 0) return 100;
    return 30;
  }

  /**
   * Calculate salary match score
   * If salary info is missing, use neutral score (don't penalize)
   */
  calculateSalaryMatch(candidateMin, candidateMax, jobMin, jobMax) {
    // If either party hasn't specified salary, use neutral score (no penalty)
    if (!candidateMin && !candidateMax) return 80; // Candidate hasn't specified - neutral
    if (!jobMin && !jobMax) return 80; // Job hasn't specified - neutral

    // Both have salary info - calculate actual match
    if (candidateMax >= jobMin && candidateMin <= jobMax) return 100; // Overlap - great match
    if (candidateMin > jobMax) return 40; // Candidate wants more than job offers
    if (candidateMax < jobMin) return 70; // Candidate is cheaper - still acceptable
    return 60;
  }

  /**
   * AI-Powered Detailed Match Analysis
   * Does comprehensive analysis of candidate-job fit
   */
  async calculateDetailedMatch(candidate, jobPosition) {
    try {
      const experienceText =
        (candidate.experience_timeline || [])
          .map((exp) => `  - ${exp.role} at ${exp.company} (${exp.period})`)
          .join('\n') || 'Not specified';

      const requirementsText =
        (jobPosition.requirements || []).map((req) => `  - ${req}`).join('\n') || 'Not specified';

      const prompt = `You are an expert HR recruiter. Analyze this candidate's fit for the job position CRITICALLY and ACCURATELY.

CANDIDATE:
- Name: ${candidate.name}
- Current Title: ${candidate.current_title || 'Not specified'}
- Years of Experience: ${candidate.years_of_experience || 0}
- Skills: ${(candidate.primary_skills || []).join(', ') || 'None listed'}
- Expected Salary: ${candidate.expected_salary_min || 'Not specified'} - ${candidate.expected_salary_max || 'Not specified'}
- Experience History:
${experienceText}

JOB POSITION:
- Title: ${jobPosition.title}
- Department: ${jobPosition.department || 'Not specified'}
- Required Skills: ${(jobPosition.required_skills || []).join(', ') || 'None specified'}
- Preferred Skills: ${(jobPosition.preferred_skills || []).join(', ') || 'None specified'}
- Experience Level Required: ${jobPosition.experience_level || 'Not specified'}
- Salary Range: ${jobPosition.salary_range_min || 'Not specified'} - ${jobPosition.salary_range_max || 'Not specified'} ${jobPosition.currency || ''}
- Requirements:
${requirementsText}

SCORING GUIDELINES - BE STRICT AND ACCURATE:
- 90-100: EXCEPTIONAL - Nearly perfect match, all required skills, ideal experience
- 75-89: STRONG - Most required skills, good experience fit
- 60-74: MODERATE - Some required skills missing, experience gap
- 40-59: WEAK - Significant skill gaps, may need training
- 0-39: POOR - Major mismatches, not suitable

RETURN THIS EXACT JSON STRUCTURE:
{
  "overall_score": <0-100 based on total fit>,
  "skills_score": <0-100 how well skills match required/preferred>,
  "experience_score": <0-100 how well experience level matches>,
  "salary_score": <0-100 how well salary expectations align, 80 if unknown>,
  "is_suitable": <true if overall_score >= 50, false otherwise>,
  "reasoning": "<2-3 sentence explanation of the score>",
  "matched_required_skills": ["<exact skills from required list that candidate has>"],
  "unmatched_required_skills": ["<required skills candidate is MISSING>"],
  "matched_preferred_skills": ["<preferred skills candidate has>"],
  "strengths": ["<2-3 key strengths>"],
  "concerns": ["<any concerns or gaps>"]
}

CRITICAL RULES FOR SKILL MATCHING:
- INTELLIGENTLY match skill variations - don't be overly literal!
- "IBM App Connect v12.0" or "IBM App Connect v13.0" = "IBM App Connect Enterprise" (SAME PRODUCT - different versions)
- "IBM App Connect" = "IBM App Connect Enterprise" = "ACE" = "App Connect Enterprise"
- "IBM Integration Bus" = "IIB" = "WebSphere Message Broker" = "WMB"
- "IBM Cloud Pak for Integration" = "CP4I" = "Cloud Pak Integration"
- Version numbers (v12, v13, etc.) indicate the candidate knows that product
- When a job requires "X" and candidate has "X v12.0" or "X Enterprise" - that's a MATCH
- Match technologies even if named slightly differently (React.js = React = ReactJS)
- If candidate is missing 2+ REQUIRED skills, overall_score should be < 70
- If candidate has < 3 years experience for senior role, experience_score < 60
- Be CRITICAL on genuine gaps - but don't penalize naming variations
- Only return JSON, no other text`;

      const response = await aiService.chatCompletion(prompt, {
        systemPrompt:
          'You are an expert recruiter. Analyze candidate-job fit accurately. Return valid JSON only.',
        temperature: 0.3,
        maxTokens: 2000,
      });

      try {
        return aiService.extractJson(response);
      } catch (e) {
        console.error('Failed to parse detailed match response:', e.message);
        return {
          overall_score: 50,
          skills_score: 50,
          is_suitable: false,
          reasoning: 'Unable to analyze - needs manual review',
          matched_required_skills: [],
          unmatched_required_skills: jobPosition.required_skills || [],
          matched_preferred_skills: [],
          strengths: [],
          concerns: ['AI analysis failed - needs manual review'],
        };
      }
    } catch (error) {
      console.error('Error in detailed match:', error);
      return {
        overall_score: 50,
        skills_score: 50,
        is_suitable: false,
        reasoning: 'Analysis error - needs manual review',
        matched_required_skills: [],
        unmatched_required_skills: [],
        matched_preferred_skills: [],
        strengths: [],
        concerns: ['AI analysis unavailable'],
      };
    }
  }

  /**
   * Comprehensive Match Calculation
   * 100% AI-DRIVEN SCORING - ALL scores come from AI
   */
  async calculateComprehensiveMatch(candidate, jobPosition) {
    try {
      console.log(`  🤖 Analyzing: ${candidate.name} → ${jobPosition.title}`);

      // AI Detailed Analysis - ALL SCORES COME FROM HERE
      const aiAnalysis = await this.calculateDetailedMatch(candidate, jobPosition);

      // ALL SCORES ARE FROM AI (only 3 scores: overall, skills, experience)
      const overallScore = aiAnalysis.overall_score || 50;
      const skillsScore = aiAnalysis.skills_score || 50;
      const experienceScore = aiAnalysis.experience_score || 70;

      // Determine match category based on AI score
      let category = 'moderate';
      if (overallScore >= 85) category = 'excellent';
      else if (overallScore >= 70) category = 'strong';

      console.log(
        `    ✓ AI Scores: Overall=${overallScore}%, Skills=${skillsScore}%, Exp=${experienceScore}%`,
      );

      return {
        position_match_score: overallScore,
        skills_match_score: skillsScore,
        experience_match_score: experienceScore,
        context_match_score: overallScore,
        match_reasoning: aiAnalysis.reasoning || '',
        match_strengths: aiAnalysis.strengths || [],
        match_concerns: aiAnalysis.concerns || [],
        match_category: category,
        matched_required_skills: aiAnalysis.matched_required_skills || [],
        unmatched_required_skills: aiAnalysis.unmatched_required_skills || [],
        matched_preferred_skills: aiAnalysis.matched_preferred_skills || [],
        unmatched_preferred_skills: [],
        candidate_skills_used: candidate.primary_skills || [],
        is_suitable: aiAnalysis.is_suitable !== false && overallScore >= 40,
      };
    } catch (error) {
      console.error('Error in comprehensive match:', error);
      throw error;
    }
  }

  /**
   * MAIN: Match candidates for a job position
   *
   * Flow:
   * 1. Get all available candidates from DB
   * 2. Batch AI pre-filter (ONE API call) to identify relevant candidates
   * 3. Detailed AI analysis on filtered candidates only
   */
  async matchCandidatesForJob(jobPositionId, options = {}) {
    const { minScore = 50, limit = 50 } = options;

    try {
      console.log(`\n📊 SMART MATCHING v2: Finding candidates for job ${jobPositionId}`);

      // Step 1: Get job position
      const jobPosition = await prisma.job_positions.findUnique({
        where: { id: jobPositionId },
      });

      if (!jobPosition) {
        throw new Error('Job position not found');
      }

      console.log(`  📋 Job: ${jobPosition.title}`);
      console.log(`  📋 Required: ${(jobPosition.required_skills || []).join(', ')}`);

      // Step 2: Get ALL available candidates
      const allCandidates = await prisma.candidate_profiles.findMany({
        where: {
          availability_status: { not: 'unavailable' },
        },
      });

      console.log(`  📥 Total candidates in pool: ${allCandidates.length}`);

      if (allCandidates.length === 0) {
        return { success: true, matches: [], total: 0, jobPosition };
      }

      // Step 3: BATCH AI PRE-FILTER (one API call for all candidates)
      const preFilteredCandidates = await this.batchPreFilterCandidates(allCandidates, jobPosition);

      if (preFilteredCandidates.length === 0) {
        console.log(`  ⚠️ No relevant candidates found by AI pre-filter`);
        return { success: true, matches: [], total: 0, jobPosition };
      }

      // Step 4: Detailed AI analysis on pre-filtered candidates only
      console.log(
        `  🔍 Running detailed analysis on ${preFilteredCandidates.length} candidates...`,
      );

      const matches = [];
      for (let i = 0; i < preFilteredCandidates.length; i++) {
        const candidate = preFilteredCandidates[i];

        // Rate limit delay between AI calls
        if (i > 0) {
          await delay(RATE_LIMIT_DELAY_MS);
        }

        const matchResult = await this.calculateComprehensiveMatch(candidate, jobPosition);

        if (matchResult.is_suitable && matchResult.position_match_score >= minScore) {
          matches.push({
            candidate_id: candidate.id,
            candidate,
            ...matchResult,
          });
        } else {
          console.log(
            `    ❌ Filtered: ${candidate.name} (score: ${matchResult.position_match_score}%)`,
          );
        }
      }

      // Sort by score and limit
      matches.sort((a, b) => b.position_match_score - a.position_match_score);
      const topMatches = matches.slice(0, limit);

      console.log(`  ✅ Final matches: ${topMatches.length}`);

      return {
        success: true,
        matches: topMatches,
        total: topMatches.length,
        jobPosition,
        preFilteredCount: preFilteredCandidates.length,
        totalPoolSize: allCandidates.length,
      };
    } catch (error) {
      console.error('Error matching candidates for job:', error);
      return { success: false, message: error.message, matches: [] };
    }
  }

  /**
   * Match job positions for a specific candidate
   */
  async matchJobsForCandidate(candidateId, options = {}) {
    const { minScore = 60, limit = 20 } = options;

    try {
      console.log(`\n📊 Finding jobs for candidate: ${candidateId}`);

      const candidate = await prisma.candidate_profiles.findUnique({
        where: { id: candidateId },
      });

      if (!candidate) {
        throw new Error('Candidate not found');
      }

      const jobPositions = await prisma.job_positions.findMany({
        where: { status: 'open' },
        orderBy: { created_at: 'desc' },
      });

      console.log(`  Found ${jobPositions.length} open positions`);

      const matches = [];
      for (let i = 0; i < jobPositions.length; i++) {
        const jobPosition = jobPositions[i];

        if (i > 0) {
          await delay(RATE_LIMIT_DELAY_MS);
        }

        const matchResult = await this.calculateComprehensiveMatch(candidate, jobPosition);

        if (matchResult.is_suitable && matchResult.position_match_score >= minScore) {
          matches.push({
            job_position_id: jobPosition.id,
            jobPosition,
            ...matchResult,
          });
        }
      }

      matches.sort((a, b) => b.position_match_score - a.position_match_score);
      const topMatches = matches.slice(0, limit);

      console.log(`  ✓ Found ${topMatches.length} matching jobs`);

      return { success: true, matches: topMatches, total: topMatches.length, candidate };
    } catch (error) {
      console.error('Error matching jobs for candidate:', error);
      return { success: false, message: error.message, matches: [] };
    }
  }

  /**
   * Auto-match candidates to a new job
   */
  async autoMatchCandidatesToJob(jobPositionId) {
    try {
      console.log(`\n🎯 Auto-matching candidates to job ${jobPositionId}...`);

      const matchResult = await this.matchCandidatesForJob(jobPositionId, {
        minScore: 50,
        limit: 100,
      });

      if (!matchResult.success || matchResult.matches.length === 0) {
        console.log(`  No suitable candidates found`);
        return { success: true, matchCount: 0 };
      }

      // Store matches in job_applications table
      const applications = [];
      for (const match of matchResult.matches) {
        try {
          const existing = await prisma.job_applications.findUnique({
            where: {
              candidate_id_job_position_id: {
                candidate_id: match.candidate_id,
                job_position_id: jobPositionId,
              },
            },
          });

          if (!existing) {
            const application = await prisma.job_applications.create({
              data: {
                candidate_id: match.candidate_id,
                job_position_id: jobPositionId,
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
                matched_required_skills: match.matched_required_skills || [],
                unmatched_required_skills: match.unmatched_required_skills || [],
                matched_preferred_skills: match.matched_preferred_skills || [],
                unmatched_preferred_skills: match.unmatched_preferred_skills || [],
                candidate_skills_used: match.candidate_skills_used || [],
                auto_matched: true,
              },
            });
            applications.push(application);
          }
        } catch (err) {
          console.error(`  Error storing match for ${match.candidate_id}:`, err.message);
        }
      }

      console.log(`  ✓ Stored ${applications.length} matches`);
      return { success: true, matchCount: applications.length };
    } catch (error) {
      console.error('Error in autoMatchCandidatesToJob:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new IntelligentMatchingService();
