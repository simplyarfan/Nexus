const Groq = require('groq-sdk');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * CANDIDATE MATCHING SERVICE
 * Automatically matches candidates to job positions using AI
 * Calculates position-specific match scores
 */

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

class CandidateMatchingService {
  /**
   * Calculate match score between a candidate and a job position
   */
  async calculateMatchScore(candidate, jobPosition) {
    const prompt = `You are an expert HR recruiter. Analyze how well this candidate matches the job position.

CANDIDATE PROFILE:
- Name: ${candidate.name}
- Current Role: ${candidate.current_title} at ${candidate.current_company}
- Years of Experience: ${candidate.years_of_experience}
- Education: ${candidate.education_level}
- Skills: ${candidate.primary_skills?.join(', ') || 'N/A'}
- Certifications: ${candidate.certifications?.join(', ') || 'N/A'}
- Languages: ${candidate.languages?.join(', ') || 'N/A'}
- Location: ${candidate.location}
- Preferred Locations: ${candidate.preferred_locations?.join(', ') || 'N/A'}
- Expected Salary: $${candidate.expected_salary_min || 0} - $${candidate.expected_salary_max || 0}

JOB POSITION:
- Title: ${jobPosition.title}
- Department: ${jobPosition.department}
- Location: ${jobPosition.location}
- Employment Type: ${jobPosition.employment_type}
- Experience Level: ${jobPosition.experience_level}
- Required Skills: ${jobPosition.required_skills?.join(', ') || 'N/A'}
- Nice to Have Skills: ${jobPosition.nice_to_have_skills?.join(', ') || 'N/A'}
- Salary Range: $${jobPosition.salary_range_min || 0} - $${jobPosition.salary_range_max || 0}
- Description: ${jobPosition.description?.substring(0, 500) || 'N/A'}

Calculate a match score from 0-100 and provide reasoning. Return ONLY a JSON object (no markdown, no code blocks):
{
  "position_match_score": number (0-100),
  "skills_match": number (0-100),
  "experience_match": number (0-100),
  "location_match": number (0-100),
  "salary_match": number (0-100),
  "strengths": ["strength1", "strength2", "strength3"],
  "concerns": ["concern1", "concern2"],
  "recommendation": "strong_fit | good_fit | moderate_fit | weak_fit | no_fit",
  "reasoning": "Brief explanation of the match in 2-3 sentences"
}

Scoring guidelines:
- position_match_score: Overall weighted score (40% skills, 30% experience, 20% location, 10% salary)
- skills_match: Technical/professional skills alignment
- experience_match: Years and level of experience match
- location_match: Geographic compatibility (100 if remote or matching locations)
- salary_match: Expectation vs offer alignment (100 if within 10%)
- strengths: Top 3 reasons this candidate is a good fit
- concerns: Up to 2 potential concerns or gaps
- recommendation: Overall hiring recommendation level`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content || '{}';

      // Clean response (remove markdown code blocks if present)
      let cleanedResponse = response
        .replace(/```json\n/g, '')
        .replace(/```\n/g, '')
        .replace(/```/g, '')
        .trim();

      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error calculating match score with AI:', error);
      // Return fallback scores
      return {
        position_match_score: 50,
        skills_match: 50,
        experience_match: 50,
        location_match: 50,
        salary_match: 50,
        strengths: ['Unable to analyze'],
        concerns: ['AI analysis failed'],
        recommendation: 'moderate_fit',
        reasoning: 'Automated scoring unavailable, manual review recommended.',
      };
    }
  }

  /**
   * Find and rank all candidates for a specific job position
   */
  async findMatchingCandidates(jobPositionId, options = {}) {
    const { minScore = 0, limit = 50, includeUnavailable = false } = options;

    try {
      console.log(`\n🎯 Finding candidates for job position ${jobPositionId}...`);

      // Get job position details
      const jobPosition = await prisma.jobPosition.findUnique({
        where: { id: parseInt(jobPositionId) },
      });

      if (!jobPosition) {
        throw new Error('Job position not found');
      }

      // Get all available candidates (or all if includeUnavailable is true)
      const whereClause = includeUnavailable
        ? {}
        : {
            availability_status: {
              in: ['available', 'open_to_opportunities', 'actively_looking'],
            },
          };

      const candidates = await prisma.candidateProfile.findMany({
        where: whereClause,
        orderBy: { overall_match_score: 'desc' },
        take: 100, // Pre-filter to top 100 overall candidates
      });

      console.log(`  Found ${candidates.length} candidates to evaluate`);

      // Calculate match scores for each candidate
      const matchedCandidates = [];
      for (const candidate of candidates) {
        console.log(`  Evaluating: ${candidate.name}...`);

        const matchScore = await this.calculateMatchScore(candidate, jobPosition);

        if (matchScore.position_match_score >= minScore) {
          matchedCandidates.push({
            ...candidate,
            match_analysis: matchScore,
          });
        }
      }

      // Sort by match score
      matchedCandidates.sort((a, b) => b.match_analysis.position_match_score - a.match_analysis.position_match_score);

      // Apply limit
      const limitedCandidates = limit ? matchedCandidates.slice(0, limit) : matchedCandidates;

      console.log(`✅ Found ${limitedCandidates.length} matching candidates`);

      return {
        success: true,
        jobPosition,
        totalCandidates: candidates.length,
        matchedCandidates: limitedCandidates.length,
        candidates: limitedCandidates,
      };
    } catch (error) {
      console.error('Error finding matching candidates:', error);
      throw error;
    }
  }

  /**
   * Get match score for a specific candidate-job pair
   */
  async getSingleMatch(candidateId, jobPositionId) {
    try {
      const candidate = await prisma.candidateProfile.findUnique({
        where: { id: parseInt(candidateId) },
      });

      const jobPosition = await prisma.jobPosition.findUnique({
        where: { id: parseInt(jobPositionId) },
      });

      if (!candidate || !jobPosition) {
        throw new Error('Candidate or job position not found');
      }

      const matchScore = await this.calculateMatchScore(candidate, jobPosition);

      return {
        success: true,
        candidate,
        jobPosition,
        match: matchScore,
      };
    } catch (error) {
      console.error('Error getting single match:', error);
      throw error;
    }
  }

  /**
   * Batch process matches for multiple job positions
   */
  async batchMatchCandidates(jobPositionIds) {
    const results = [];

    for (const jobId of jobPositionIds) {
      try {
        const result = await this.findMatchingCandidates(jobId, { limit: 10 });
        results.push({
          jobPositionId: jobId,
          success: true,
          ...result,
        });
      } catch (error) {
        results.push({
          jobPositionId: jobId,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      processedJobs: results.length,
      results,
    };
  }
}

module.exports = new CandidateMatchingService();
