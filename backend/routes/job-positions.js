const express = require('express');
const router = express.Router();
const { authenticateToken, requireHRAccess } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');
const jobPositionService = require('../services/jobPositionService');
const candidateMatchingService = require('../services/candidateMatching.service');
const jdParsingService = require('../services/jdParsing.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for JD uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/jds');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const jdUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
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
 * Query params: minScore (default: 60), category (excellent/strong/moderate), limit (default: 50)
 */
router.get('/:id/candidates', authenticateToken, requireHRAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { minScore, category, limit } = req.query;

    const minMatchScore = minScore ? parseInt(minScore) : 60;
    const maxResults = limit ? parseInt(limit) : 50;

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
            current_company: true,
            current_title: true,
            years_of_experience: true,
            education_level: true,
            primary_skills: true,
            certifications: true,
            languages: true,
            availability_status: true,
            overall_match_score: true,
            performance_score: true,
            potential_score: true,
            latest_cv_url: true,
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
    console.log(`  Required Skills (${Array.isArray(required_skills) ? required_skills.length : 'not array'}):`, required_skills);
    console.log(`  Preferred Skills (${Array.isArray(preferred_skills) ? preferred_skills.length : 'not array'}):`, preferred_skills);

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

    console.log(`\n🤖 Extracting skills from job description (${jobDescriptionText.length} chars)...`);

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
 * Delete job position (Admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
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
 */
router.post('/parse-jd', authenticateToken, requireHRAccess, jdUpload.single('jd'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No JD file uploaded',
      });
    }

    console.log(`\n📤 Processing JD upload: ${req.file.originalname}`);

    // Parse JD file with AI
    const result = await jdParsingService.parseJDFile(req.file);

    // Clean up uploaded file
    try {
      await fs.unlink(req.file.path);
    } catch (error) {
      console.error(`Failed to delete temp file: ${req.file.path}`);
    }

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

    // Clean up file on error
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error(`Failed to delete temp file: ${req.file.path}`);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to parse JD',
      error: error.message,
    });
  }
});

module.exports = router;
