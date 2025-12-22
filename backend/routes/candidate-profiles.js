const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { authenticateToken, requireHRAccess, requireHRAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const candidateExtractionService = require('../services/candidateExtraction.service');

// Allowed MIME types for CV uploads
const ALLOWED_CV_MIMETYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'text/plain', // .txt
];

// Use memory storage for Vercel compatibility (no persistent disk)
// The candidateExtractionService now supports both buffer and file path
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_CV_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, DOC, and TXT files are allowed'));
    }
  },
});

/**
 * CANDIDATE PROFILES API ROUTES
 * Provides CRUD operations for candidate profiles
 * Created automatically by CV Intelligence or manually
 */

/**
 * GET /api/candidates
 * Get all candidates with filters and pagination
 * Access: HR department users (view) and HR admins (full access)
 */
router.get('/', authenticateToken, requireHRAccess, async (req, res) => {
  try {
    const {
      search,
      status,
      minScore,
      maxScore,
      skills,
      location,
      experienceLevel,
      page = 1,
      limit = 20,
    } = req.query;

    const where = {};

    // Search filter (name or email)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { current_company: { contains: search, mode: 'insensitive' } },
        { current_title: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Availability status filter
    if (status) {
      where.availability_status = status;
    }

    // Score range filter (removed - overall_match_score column dropped)

    // Skills filter (contains any of the specified skills)
    if (skills) {
      const skillsArray = skills.split(',').map((s) => s.trim());
      where.skills = {
        hasSome: skillsArray,
      };
    }

    // Location filter
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    // Experience level filter (based on years of experience)
    if (experienceLevel) {
      const expMap = {
        entry: [0, 2],
        mid: [3, 5],
        senior: [6, 10],
        lead: [11, 100],
      };

      if (expMap[experienceLevel]) {
        where.years_of_experience = {
          gte: expMap[experienceLevel][0],
          lte: expMap[experienceLevel][1],
        };
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [candidates, total] = await Promise.all([
      prisma.candidate_profiles.findMany({
        where,
        include: {
          job_applications: {
            include: {
              job_positions: {
                select: {
                  id: true,
                  title: true,
                  department: true,
                },
              },
            },
          },
          creator: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          _count: {
            select: {
              job_applications: true,
            },
          },
        },
        orderBy: [{ created_at: 'desc' }],
        skip,
        take: parseInt(limit),
      }),
      prisma.candidate_profiles.count({ where }),
    ]);

    // Add formatted created_by_user field
    const candidatesWithCreator = candidates.map((candidate) => ({
      ...candidate,
      created_by_user: candidate.creator
        ? {
            id: candidate.creator.id,
            name: `${candidate.creator.first_name} ${candidate.creator.last_name}`,
            email: candidate.creator.email,
          }
        : null,
    }));

    res.json({
      success: true,
      candidates: candidatesWithCreator,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch candidates',
      error: error.message,
    });
  }
});

/**
 * GET /api/candidates/stats
 * Get candidate statistics
 * Access: HR department users and HR admins
 */
router.get('/stats', authenticateToken, requireHRAccess, async (req, res) => {
  try {
    const totalCandidates = await prisma.candidate_profiles.count();
    const activeApplications = await prisma.job_applications.count({
      where: { status: 'active' },
    });

    const statusBreakdown = await prisma.candidate_profiles.groupBy({
      by: ['availability_status'],
      _count: true,
    });

    res.json({
      success: true,
      stats: {
        total: totalCandidates,
        activeApplications,
        byStatus: statusBreakdown.map((s) => ({
          status: s.availability_status,
          count: s._count,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching candidate stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
});

/**
 * GET /api/candidates/:id
 * Get candidate by ID with full details
 * Access: HR department users and HR admins
 */
router.get('/:id', authenticateToken, requireHRAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const candidate = await prisma.candidate_profiles.findUnique({
      where: { id: id },
      include: {
        job_applications: {
          where: {
            job_positions: {
              status: 'open', // Only show jobs that are still open
            },
          },
          include: {
            job_positions: {
              select: {
                id: true,
                title: true,
                department: true,
                location: true,
                employment_type: true,
                status: true,
              },
            },
          },
          orderBy: { position_match_score: 'desc' }, // Order by match score
        },
        candidate_notes: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }

    res.json({
      success: true,
      candidate,
    });
  } catch (error) {
    console.error('Error fetching candidate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch candidate',
      error: error.message,
    });
  }
});

/**
 * PUT /api/candidates/:id
 * Update candidate profile (manual edits)
 * Access: HR department users and HR admins can update
 */
router.put('/:id', authenticateToken, requireHRAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      location,
      linkedin_url,
      skills,
      primary_skills,
      years_of_experience,
      education,
      certifications,
      experience_timeline,
      current_company,
      current_title,
      availability_status,
      preferred_locations,
      expected_salary_min,
      expected_salary_max,
      notice_period_days,
    } = req.body;

    // Check if candidate exists
    const existingCandidate = await prisma.candidate_profiles.findUnique({
      where: { id: id },
    });

    if (!existingCandidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }

    // Update candidate
    const updatedCandidate = await prisma.candidate_profiles.update({
      where: { id: id },
      data: {
        name: name || existingCandidate.name,
        email: email || existingCandidate.email,
        phone,
        location,
        linkedin_url,
        primary_skills: skills || primary_skills,
        years_of_experience,
        education,
        certifications,
        experience_timeline,
        current_company,
        current_title,
        availability_status,
        expected_salary_min,
        expected_salary_max,
        notice_period_days,
        updated_at: new Date(),
      },
    });

    res.json({
      success: true,
      candidate: updatedCandidate,
      message: 'Candidate updated successfully',
    });
  } catch (error) {
    console.error('Error updating candidate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update candidate',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/candidates/:id
 * Delete candidate profile
 * Access: HR department users (Recruitment) and HR admins
 */
router.delete('/:id', authenticateToken, requireHRAccess, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if candidate exists
    const existingCandidate = await prisma.candidate_profiles.findUnique({
      where: { id: id },
    });

    if (!existingCandidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }

    // Check if candidate has been hired (has an employee record)
    const employeeRecord = await prisma.employees.findFirst({
      where: { candidate_profile_id: id },
    });

    if (employeeRecord) {
      return res.status(409).json({
        success: false,
        message:
          'Cannot delete this candidate - they have been hired as an employee. Please delete the employee record first from HR Onboarding.',
      });
    }

    // Delete candidate (will cascade delete applications and notes)
    await prisma.candidate_profiles.delete({
      where: { id: id },
    });

    res.json({
      success: true,
      message: 'Candidate deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete candidate',
      error: error.message,
    });
  }
});

/**
 * POST /api/candidates/:id/notes
 * Add note to candidate
 * Access: HR department users and HR admins
 */
router.post('/:id/notes', authenticateToken, requireHRAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, note_type } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required',
      });
    }

    const note = await prisma.candidate_notes.create({
      data: {
        candidate_id: id, // UUID string from URL params
        author_id: req.user.id,
        content,
        note_type: note_type || 'general',
      },
      include: {
        author: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      note,
      message: 'Note added successfully',
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note',
      error: error.message,
    });
  }
});

/**
 * PUT /api/candidates/:id/notes/:noteId
 * Update a note
 * Access: Any HR user with access
 */
router.put('/:id/notes/:noteId', authenticateToken, requireHRAccess, async (req, res) => {
  try {
    const { noteId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required',
      });
    }

    // Check if note exists
    const existingNote = await prisma.candidate_notes.findUnique({
      where: { id: parseInt(noteId) },
    });

    if (!existingNote) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    const note = await prisma.candidate_notes.update({
      where: { id: parseInt(noteId) },
      data: {
        content,
        updated_at: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      note,
      message: 'Note updated successfully',
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update note',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/candidates/:id/notes/:noteId
 * Delete a note
 * Access: Any HR user with access
 */
router.delete('/:id/notes/:noteId', authenticateToken, requireHRAccess, async (req, res) => {
  try {
    const { noteId } = req.params;

    // Check if note exists
    const existingNote = await prisma.candidate_notes.findUnique({
      where: { id: parseInt(noteId) },
    });

    if (!existingNote) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    await prisma.candidate_notes.delete({
      where: { id: parseInt(noteId) },
    });

    res.json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete note',
      error: error.message,
    });
  }
});

// REMOVED: PUT /api/candidates/:id/scores endpoint - score fields no longer exist

/**
 * POST /api/candidates/upload
 * Upload CV(s) and auto-create candidate profiles
 * Access: HR department users and HR admins
 * Supports single or multiple file upload
 * Uses memory storage for Vercel compatibility
 */
router.post(
  '/upload',
  authenticateToken,
  requireHRAccess,
  upload.array('cvs', 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No CV files uploaded',
        });
      }

      console.log(`\n📤 Processing ${req.files.length} CV upload(s)...`);
      console.log(`  📦 Storage: memory (buffer-based)`);

      // Process CVs - service now handles both buffer and path
      // Pass userId to track who created the candidates
      const result = await candidateExtractionService.processBulkCvs(req.files, req.user.id);

      // No need to clean up files - using memory storage (buffers are garbage collected)

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Error uploading CVs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process CV uploads',
        error: error.message,
      });
    }
  },
);

module.exports = router;
