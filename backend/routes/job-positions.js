const express = require('express');
const router = express.Router();
const { authenticateToken, requireHRAccess } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');
const jobPositionService = require('../services/jobPositionService');
const candidateMatchingService = require('../services/candidateMatching.service');
const intelligentMatching = require('../services/intelligentMatching.service');
const jdParsingService = require('../services/jdParsing.service');
const { prisma } = require('../lib/prisma');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Use memory storage for Vercel compatibility (no persistent disk)
// The jdParsingService now supports both buffer and file path
const jdUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'text/plain', // .txt
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, DOC, and TXT files are allowed'));
    }
  },
});

/**
 * Job Positions Routes
 * Handles CRUD operations and AI-powered job description generation
 */

/**
 * Get all job positions with filters
 * Query params: status, department, hiring_manager_id, employment_type, experience_level, search
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      department: req.query.department,
      hiring_manager_id: req.query.hiring_manager_id,
      employment_type: req.query.employment_type,
      experience_level: req.query.experience_level,
      search: req.query.search,
    };

    const result = await jobPositionService.getJobPositions(filters);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.message,
      });
    }

    res.json({
      success: true,
      data: {
        positions: result.jobPositions,
        total: result.total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job positions',
      message: error.message,
    });
  }
});

/**
 * Get job position statistics
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const result = await jobPositionService.getJobPositionStats();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.message,
      });
    }

    res.json({
      success: true,
      data: result.stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message,
    });
  }
});

/**
 * Get single job position by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await jobPositionService.getJobPositionById(id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.message,
      });
    }

    res.json({
      success: true,
      data: { position: result.jobPosition },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job position',
      message: error.message,
    });
  }
});

/**
 * Get matched candidates for a job position (HR Access)
 * Returns pre-calculated matches from job_applications table
 * Query params: minScore (default: 0), category (excellent/strong/moderate), limit (default: 50), refresh (true/false)
 * If refresh=true, re-runs matching algorithm to find new candidates before returning results
 */
router.get('/:id/candidates', authenticateToken, requireHRAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { minScore, category, limit, refresh } = req.query;

    const minMatchScore = minScore ? parseInt(minScore) : 0;
    const maxResults = limit ? parseInt(limit) : 50;

    // If refresh=true, re-run matching using SMART pre-filtering approach
    if (refresh === 'true') {
      console.log(`\n🔄 SMART Refresh: Re-matching candidates for job position: ${id}`);

      const intelligentMatching = require('../services/intelligentMatching.service');

      // Use the smart matchCandidatesForJob which does keyword pre-filtering
      // This only sends candidates with matching skills to AI, not ALL candidates
      // Uses default minScore=50 and minRequiredSkillsMatch=1 from service
      const matchResult = await intelligentMatching.matchCandidatesForJob(id, {
        limit: 100,
      });

      if (matchResult.success) {
        console.log(
          `  Found ${matchResult.matches.length} candidates via smart matching (pre-filtered from ${matchResult.preFilteredCount || 'N/A'})`,
        );

        // Get existing matched candidate IDs
        const existingMatches = await prisma.job_applications.findMany({
          where: { job_position_id: id },
          select: { candidate_id: true },
        });
        const existingCandidateIds = new Set(existingMatches.map((m) => m.candidate_id));
        const newMatchCandidateIds = new Set(matchResult.matches.map((m) => m.candidate_id));

        // DELETE candidates that are no longer in the matches (poor matches filtered out)
        const candidatesToRemove = [...existingCandidateIds].filter(
          (id) => !newMatchCandidateIds.has(id),
        );
        if (candidatesToRemove.length > 0) {
          await prisma.job_applications.deleteMany({
            where: {
              job_position_id: id,
              candidate_id: { in: candidatesToRemove },
              status: 'matched', // Only delete auto-matched, not manually added
            },
          });
          console.log(
            `  🗑️ Removed ${candidatesToRemove.length} poor matches that no longer qualify`,
          );
        }

        // Add new matches or update existing ones
        for (const match of matchResult.matches) {
          try {
            if (existingCandidateIds.has(match.candidate_id)) {
              // Update existing match
              await prisma.job_applications.update({
                where: {
                  candidate_id_job_position_id: {
                    candidate_id: match.candidate_id,
                    job_position_id: id,
                  },
                },
                data: {
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
                },
              });
              console.log(`  ↻ Updated: ${match.candidate.name} (${match.position_match_score}%)`);
            } else {
              // Create new match
              await prisma.job_applications.create({
                data: {
                  candidate_id: match.candidate_id,
                  job_position_id: id,
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
              console.log(`  ✓ Added: ${match.candidate.name} (${match.position_match_score}%)`);
            }
          } catch (saveError) {
            console.error(`  ✗ Error saving match:`, saveError.message);
          }
        }
        console.log(
          `  ✓ Smart refresh complete: ${matchResult.matches.length} qualified candidates`,
        );
      } else {
        console.log(`  ❌ Smart matching failed or returned no results`);
      }
    }

    // Build where clause for filtering
    const whereClause = {
      job_position_id: id,
      position_match_score: {
        gte: minMatchScore,
      },
    };

    // Filter by match category if specified
    if (category && ['excellent', 'strong', 'moderate'].includes(category)) {
      whereClause.match_category = category;
    }

    // Fetch pre-calculated matches from job_applications table
    const matches = await prisma.job_applications.findMany({
      where: whereClause,
      include: {
        candidate_profiles: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            location: true,
            linkedin_url: true,
            current_company: true,
            current_title: true,
            years_of_experience: true,
            education: true,
            experience_timeline: true,
            primary_skills: true,
            certifications: true,
            availability_status: true,
            expected_salary_min: true,
            expected_salary_max: true,
            notice_period_days: true,
          },
        },
      },
      orderBy: {
        position_match_score: 'desc',
      },
      take: maxResults,
    });

    // Format response
    const formattedMatches = matches.map((match) => ({
      candidate: match.candidate_profiles,
      match_analysis: {
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
        auto_matched: match.auto_matched,
        // Detailed skill breakdown for transparency
        matched_required_skills: match.matched_required_skills || [],
        unmatched_required_skills: match.unmatched_required_skills || [],
        matched_preferred_skills: match.matched_preferred_skills || [],
        unmatched_preferred_skills: match.unmatched_preferred_skills || [],
        candidate_skills_used: match.candidate_skills_used || [],
      },
      application_status: match.status,
      application_id: match.id,
    }));

    res.json({
      success: true,
      data: {
        jobPositionId: id,
        totalMatches: formattedMatches.length,
        minScore: minMatchScore,
        candidates: formattedMatches,
      },
    });
  } catch (error) {
    console.error('Error fetching matched candidates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch matched candidates',
      message: error.message,
    });
  }
});

/**
 * Create new job position (HR Department users)
 * Body: title, department, location, employment_type, experience_level, salary_range_min, salary_range_max,
 *       currency, description, requirements, responsibilities, required_skills, preferred_skills,
 *       benefits, status, hiring_manager_id, openings_count, remote_policy, useAI (optional)
 */
router.post('/', authenticateToken, requireHRAccess, async (req, res) => {
  try {
    const {
      title,
      department,
      location,
      employment_type,
      experience_level,
      salary_range_min,
      salary_range_max,
      currency,
      description,
      requirements,
      responsibilities,
      required_skills,
      preferred_skills,
      benefits,
      status,
      hiring_manager_id,
      openings_count,
      remote_policy,
      useAI, // Flag to enable AI-powered job description generation
    } = req.body;

    // Validation
    if (!title || !department) {
      return res.status(400).json({
        success: false,
        error: 'Title and department are required',
      });
    }

    // Log skills data for debugging
    console.log(`\n📝 Creating job position: ${title}`);
    console.log(
      `  Required Skills (${Array.isArray(required_skills) ? required_skills.length : 'not array'}):`,
      required_skills,
    );
    console.log(
      `  Preferred Skills (${Array.isArray(preferred_skills) ? preferred_skills.length : 'not array'}):`,
      preferred_skills,
    );

    const data = {
      title,
      department,
      location,
      employment_type,
      experience_level,
      salary_range_min: salary_range_min ? parseInt(salary_range_min) : null,
      salary_range_max: salary_range_max ? parseInt(salary_range_max) : null,
      currency,
      description,
      requirements,
      responsibilities,
      required_skills,
      preferred_skills,
      benefits,
      status,
      hiring_manager_id: hiring_manager_id ? parseInt(hiring_manager_id) : null,
      openings_count: openings_count ? parseInt(openings_count) : 1,
      remote_policy,
    };

    const result = await jobPositionService.createJobPosition(
      data,
      req.user.id,
      useAI === true || useAI === 'true',
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.message,
      });
    }

    // Auto-match candidates to new job (runs in background)
    if (result.jobPosition && result.jobPosition.status === 'open') {
      intelligentMatching.autoMatchCandidatesToJob(result.jobPosition.id).catch((err) => {
        console.error('Error in background auto-matching for new job:', err);
      });
    }

    res.status(201).json({
      success: true,
      message: result.message,
      data: { position: result.jobPosition },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create job position',
      message: error.message,
    });
  }
});

/**
 * AI-powered job description generator (HR Department users)
 * Body: title, department, experienceLevel (optional), employmentType (optional)
 */
router.post('/generate-description', authenticateToken, requireHRAccess, async (req, res) => {
  try {
    const { title, department, experienceLevel, employmentType } = req.body;

    // Validation
    if (!title || !department) {
      return res.status(400).json({
        success: false,
        error: 'Title and department are required',
      });
    }

    const aiData = await jobPositionService.generateJobDescription({
      title,
      department,
      experienceLevel,
      employmentType,
    });

    res.json({
      success: true,
      data: aiData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate job description',
      message: error.message,
    });
  }
});

/**
 * POST /job-positions/extract-skills
 * Intelligently extract skills from job description text using AI
 * Body: { jobDescriptionText: "string" }
 * Access: HR Department users
 */
router.post('/extract-skills', authenticateToken, requireHRAccess, async (req, res) => {
  try {
    const { jobDescriptionText } = req.body;

    // Validation
    if (!jobDescriptionText || jobDescriptionText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Job description text is required (minimum 50 characters)',
      });
    }

    console.log(
      `\n🤖 Extracting skills from job description (${jobDescriptionText.length} chars)...`,
    );

    const result = await jobPositionService.extractSkillsFromJD(jobDescriptionText);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.message || 'Failed to extract skills',
      });
    }

    console.log(
      `  ✓ Extracted ${result.required_skills.length} required skills and ${result.preferred_skills.length} preferred skills`,
    );

    res.json({
      success: true,
      data: {
        required_skills: result.required_skills,
        preferred_skills: result.preferred_skills,
      },
    });
  } catch (error) {
    console.error('Error extracting skills:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract skills from job description',
      message: error.message,
    });
  }
});

/**
 * Update job position (HR Department users)
 */
router.put('/:id', authenticateToken, requireHRAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      department,
      location,
      employment_type,
      experience_level,
      salary_range_min,
      salary_range_max,
      currency,
      description,
      requirements,
      responsibilities,
      required_skills,
      preferred_skills,
      benefits,
      status,
      hiring_manager_id,
      openings_count,
      remote_policy,
    } = req.body;

    const data = {
      title,
      department,
      location,
      employment_type,
      experience_level,
      salary_range_min: salary_range_min ? parseInt(salary_range_min) : null,
      salary_range_max: salary_range_max ? parseInt(salary_range_max) : null,
      currency,
      description,
      requirements,
      responsibilities,
      required_skills,
      preferred_skills,
      benefits,
      status,
      hiring_manager_id: hiring_manager_id ? parseInt(hiring_manager_id) : null,
      openings_count: openings_count ? parseInt(openings_count) : null,
      remote_policy,
    };

    const result = await jobPositionService.updateJobPosition(id, data);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.message,
      });
    }

    res.json({
      success: true,
      message: result.message,
      data: { position: result.jobPosition },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update job position',
      message: error.message,
    });
  }
});

/**
 * Delete job position (HR Access)
 */
router.delete('/:id', authenticateToken, requireHRAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await jobPositionService.deleteJobPosition(id);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.message,
      });
    }

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete job position',
      message: error.message,
    });
  }
});

/**
 * POST /job-positions/parse-jd
 * Upload and parse Job Description (PDF/DOCX) using AI
 * Access: HR Department users
 * Uses memory storage for Vercel compatibility
 */
router.post(
  '/parse-jd',
  authenticateToken,
  requireHRAccess,
  jdUpload.single('jd'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No JD file uploaded',
        });
      }

      console.log(`\n📤 Processing JD upload: ${req.file.originalname}`);
      console.log(`   File size: ${req.file.size} bytes`);
      console.log(`   File type: ${req.file.mimetype}`);
      console.log(`   Storage: memory (buffer-based)`);

      // Parse JD file with AI - service handles both buffer and path
      const result = await jdParsingService.parseJDFile(req.file);

      // No need to clean up - using memory storage (buffers are garbage collected)

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error || 'Failed to parse JD',
        });
      }

      res.json({
        success: true,
        jobDetails: result.jobDetails,
        message: 'JD parsed successfully',
      });
    } catch (error) {
      console.error('Error parsing JD:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to parse JD',
        error: error.message,
      });
    }
  },
);

/**
 * POST /job-positions/:id/candidates/chat
 * AI chat for asking questions about candidate matching
 * Only answers questions - does not perform any actions
 */
router.post('/:id/candidates/chat', authenticateToken, requireHRAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a question',
      });
    }

    // Get job position
    const jobPosition = await prisma.job_positions.findUnique({
      where: { id },
    });

    if (!jobPosition) {
      return res.status(404).json({
        success: false,
        error: 'Job position not found',
      });
    }

    // Get matched candidates for this position
    const matchedApplications = await prisma.job_applications.findMany({
      where: { job_position_id: id },
      include: {
        candidate_profiles: true,
      },
      orderBy: {
        position_match_score: 'desc',
      },
    });

    // Get all candidates to provide context about unmatched ones too
    const allCandidates = await prisma.candidate_profiles.findMany({
      select: {
        id: true,
        name: true,
        current_title: true,
        years_of_experience: true,
        primary_skills: true,
        availability_status: true,
      },
    });

    // Build context for the AI
    const matchedCandidatesContext = matchedApplications.map((app) => ({
      name: app.candidate_profiles.name,
      current_title: app.candidate_profiles.current_title,
      years_of_experience: app.candidate_profiles.years_of_experience,
      skills: app.candidate_profiles.primary_skills, // Send ALL skills
      overall_match_score: app.position_match_score,
      skills_match: app.skills_match_score,
      experience_match: app.experience_match_score,
      context_match: app.context_match_score,
      reasoning: app.match_reasoning,
      strengths: app.match_strengths,
      concerns: app.match_concerns,
      is_matched: true,
    }));

    const unmatchedCandidates = allCandidates
      .filter((c) => !matchedApplications.some((app) => app.candidate_id === c.id))
      .map((c) => ({
        name: c.name,
        current_title: c.current_title,
        years_of_experience: c.years_of_experience,
        skills: c.primary_skills, // Send ALL skills
        is_matched: false,
      }));

    const aiService = require('../services/ai.service');

    const systemPrompt = `You are an AI assistant helping HR recruiters understand candidate matching for job positions.

IMPORTANT RULES:
1. You can ONLY answer questions about candidates, matching scores, and job requirements
2. You CANNOT perform any actions like scheduling interviews, sending emails, or modifying data
3. If asked to do something other than answer questions, politely explain you can only provide information
4. Keep responses concise and focused
5. Use the provided data to give accurate, specific answers
6. If you don't have enough information, say so

JOB POSITION:
- Title: ${jobPosition.title}
- Department: ${jobPosition.department}
- Experience Level: ${jobPosition.experience_level}
- Required Skills: ${jobPosition.required_skills?.join(', ') || 'Not specified'}
- Preferred Skills: ${jobPosition.preferred_skills?.join(', ') || 'Not specified'}
- Description: ${jobPosition.description || 'Not specified'}

MATCHED CANDIDATES (${matchedCandidatesContext.length}):
${
  matchedCandidatesContext.length > 0
    ? matchedCandidatesContext
        .map(
          (c, i) => `
${i + 1}. ${c.name}
   - Title: ${c.current_title || 'Not specified'}
   - Experience: ${c.years_of_experience || 0} years
   - Skills: ${c.skills?.join(', ') || 'None'}
   - Overall Match: ${c.overall_match_score}%
   - Skills Match: ${c.skills_match}%
   - Experience Match: ${c.experience_match}%
   - Context Match: ${c.context_match}%
   - Why Matched: ${c.reasoning || 'AI determined suitable for the role'}
   - Strengths: ${c.strengths?.join(', ') || 'None listed'}
   - Concerns: ${c.concerns?.join(', ') || 'None listed'}
`,
        )
        .join('\n')
    : 'No candidates currently matched for this position.'
}

UNMATCHED CANDIDATES (${unmatchedCandidates.length}):
${unmatchedCandidates.map((c) => `- ${c.name} (${c.current_title || 'No title'}, ${c.years_of_experience || 0} yrs exp)`).join('\n')}

Note: Unmatched candidates were analyzed but did not pass the suitability filter based on experience level, skill relevance, or domain fit.`;

    const answer =
      (await aiService.chatCompletion(question, {
        systemPrompt,
        temperature: 0.5,
        maxTokens: 500,
      })) || 'Sorry, I could not generate a response.';

    res.json({
      success: true,
      data: {
        question: question.trim(),
        answer,
        context: {
          job_title: jobPosition.title,
          matched_count: matchedCandidatesContext.length,
          total_candidates: allCandidates.length,
        },
      },
    });
  } catch (error) {
    console.error('Error in candidates chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process your question',
    });
  }
});

module.exports = router;
