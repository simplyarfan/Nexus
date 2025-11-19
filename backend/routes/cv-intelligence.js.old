/**
 * CV INTELLIGENCE CLEAN ROUTES - HR-01 BLUEPRINT
 * Single service, proper flow, no overlaps
 */

const express = require('express');
const database = require('../models/database');
const auth = require('../middleware/auth');
const authenticateToken = auth.authenticateToken;
const { uploadLimiter, cvBatchLimiter } = require('../middleware/rateLimiting');

// Load ONLY the clean HR-01 service
let CVIntelligenceHR01 = null;
try {
  const CVIntelligenceHR01Service = require('../services/cvIntelligenceHR01');
  CVIntelligenceHR01 = new CVIntelligenceHR01Service();
} catch (error) {
  // Intentionally empty - error is handled by caller
}

// Optional multer with fallback
let multer, upload;
try {
  multer = require('multer');
  upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF and DOCX files allowed'));
      }
    },
  });
} catch (e) {
  upload = {
    array: () => (req, res, _next) => {
      res.status(500).json({ success: false, message: 'File upload not available' });
    },
  };
}

const router = express.Router();

// Helper function to normalize names
function normalizeName(name) {
  if (!name || name === 'Name not found') {
    return name;
  }

  return name
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Test route to verify CV Intelligence is working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'CV Intelligence routes are working!',
    timestamp: new Date().toISOString(),
    service: CVIntelligenceHR01 ? 'HR-01 Service Available' : 'HR-01 Service Not Available',
  });
});

// POST /api/cv-intelligence/ - Create batch (frontend compatibility)
router.post('/', authenticateToken, cvBatchLimiter, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Batch name is required and must be a non-empty string',
      });
    }

    await database.connect();

    // Create batch record
    const batchId = CVIntelligenceHR01 ? CVIntelligenceHR01.generateId() : `batch_${Date.now()}`;

    await database.run(`
      CREATE TABLE IF NOT EXISTS cv_batches (
        id VARCHAR(255) PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'created',
        total_resumes INTEGER DEFAULT 0,
        processed_resumes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await database.run(
      `
      INSERT INTO cv_batches (id, user_id, name, status, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    `,
      [batchId, req.user.id, name.trim(), 'created'],
    );

    res.json({
      success: true,
      data: {
        batchId: batchId,
        name: name.trim(),
        status: 'created',
      },
      message: 'Batch created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create batch',
      error: error.message,
    });
  }
});

// POST /api/cv-intelligence/batch/:id/process - Process CVs for existing batch
router.post(
  '/batch/:id/process',
  authenticateToken,
  uploadLimiter,
  upload.fields([
    { name: 'cvFiles', maxCount: 10 },
    { name: 'jdFile', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { id: batchId } = req.params;
      const files = req.files;

      // Extract CV files from the multer fields structure
      const cvFiles = files?.cvFiles || [];
      const jdFile = files?.jdFile?.[0] || null;

      if (!cvFiles || cvFiles.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No CV files provided',
        });
      }

      if (!CVIntelligenceHR01) {
        return res.status(500).json({
          success: false,
          message: 'CV Intelligence service not available',
        });
      }

      let databaseAvailable = true;
      try {
        await database.connect();
      } catch (dbError) {
        databaseAvailable = false;
        // Continue without database for now - just process files
      }

      // Process JD file to extract requirements FIRST
      let parsedRequirements = { skills: [], experience: [], education: [], mustHave: [] };

      if (jdFile && CVIntelligenceHR01) {
        try {
          const jdResult = await CVIntelligenceHR01.processJobDescription(
            jdFile.buffer,
            jdFile.originalname,
          );

          if (jdResult.success && jdResult.requirements) {
            parsedRequirements = jdResult.requirements;
          } else {
            // JD parsing failed - will use default requirements
          }
        } catch (error) {
          // Intentionally empty - error is handled by caller
        }
      }

      // Update batch status, file count, and JD requirements (if database available)
      if (databaseAvailable) {
        try {
          const jdRequirementsJSON = JSON.stringify(parsedRequirements);

          // FORCE UPDATE - Clear any cached/corrupted JD requirements
          await database.run(
            `
          UPDATE cv_batches 
          SET status = 'processing', total_resumes = $1, jd_requirements = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3 AND user_id = $4
        `,
            [cvFiles.length, jdRequirementsJSON, batchId, req.user.id],
          );

          // Also clear any existing candidates to force re-processing
          await database.run('DELETE FROM candidates WHERE batch_id = $1', [batchId]);
        } catch (dbError) {
          databaseAvailable = false;
        }
      }

      // Process each CV file with holistic assessment
      const candidates = [];
      const cvTexts = []; // Store raw CV texts for ranking

      for (let i = 0; i < cvFiles.length; i++) {
        const file = cvFiles[i];

        try {
          // Process with HR-01 service
          const result = await CVIntelligenceHR01.processResume(
            file.buffer,
            file.originalname,
            parsedRequirements,
          );

          if (result.success) {
            const candidateId = CVIntelligenceHR01.generateId();

            // Get raw CV text for holistic assessment
            const parseData = await CVIntelligenceHR01.parseDocument(
              file.buffer,
              file.originalname.split('.').pop().toLowerCase(),
            );
            const cvText = parseData.rawText || '';
            cvTexts.push(cvText);

            // Perform holistic assessment
            const assessment = await CVIntelligenceHR01.assessCVHolistically(
              cvText,
              parsedRequirements,
            );

            // Generate interview questions
            const interviewQuestions = await CVIntelligenceHR01.generateInterviewQuestions(
              cvText,
              result.structuredData,
              assessment,
              parsedRequirements,
            );

            // Perform smart skill matching
            const candidateSkills = result.structuredData.skills || [];
            const requiredSkills = parsedRequirements.skills || [];

            const matchedSkills = [];
            const missingSkills = [];

            // Check each required skill with smart matching
            for (const reqSkill of requiredSkills) {
              if (CVIntelligenceHR01.smartSkillMatch(reqSkill, candidateSkills)) {
                matchedSkills.push(reqSkill);
              } else {
                missingSkills.push(reqSkill);
              }
            }

            // Store candidate with assessment, interview questions, and smart skill matching
            const candidateData = {
              id: candidateId,
              name: normalizeName(result.structuredData.personal?.name || 'Name not found'),
              email: result.structuredData.personal?.email || 'Email not found',
              phone: result.structuredData.personal?.phone || 'Phone not found',
              location: result.structuredData.personal?.location || 'Location not specified',
              structuredData: result.structuredData,
              assessment: assessment,
              interviewQuestions: interviewQuestions,
              matchedSkills: matchedSkills,
              missingSkills: missingSkills,
              cvText: cvText,
            };

            candidates.push(candidateData);

            // Store in database (if available) - use assessment score instead of old scoring
            if (databaseAvailable) {
              try {
                await database.run(
                  `
                INSERT INTO candidates (
                  id, batch_id, name, email, phone, location, profile_json, overall_score
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              `,
                  [
                    candidateId,
                    batchId,
                    candidateData.name,
                    candidateData.email,
                    candidateData.phone,
                    candidateData.location,
                    JSON.stringify({
                      ...result.structuredData,
                      assessment: assessment,
                      interviewQuestions: interviewQuestions,
                      matchedSkills: matchedSkills,
                      missingSkills: missingSkills,
                    }),
                    Math.round(assessment.overallFit || 0),
                  ],
                );
              } catch (dbError) {
                // Intentionally empty - error is handled by caller
              }
            }
          } else {
            // CV parsing failed
          }
        } catch (error) {
          // Intentionally empty - error is handled by caller
        }
      }

      // Let ChatGPT rank all candidates intelligently
      const rankings = await CVIntelligenceHR01.rankCandidatesIntelligently(
        candidates,
        parsedRequirements,
      );

      // Apply rankings to candidates
      const rankedCandidates = rankings.map((ranking) => {
        const candidate = candidates[ranking.originalIndex];
        return {
          ...candidate,
          rank: ranking.rank,
          rankingReason: ranking.rankingReason,
          recommendationLevel: ranking.recommendationLevel,
        };
      });

      // Update database with rankings
      if (databaseAvailable) {
        for (const rankedCandidate of rankedCandidates) {
          try {
            await database.run(
              `
            UPDATE candidates 
            SET profile_json = $1, overall_score = $2
            WHERE id = $3
          `,
              [
                JSON.stringify({
                  ...rankedCandidate.structuredData,
                  assessment: rankedCandidate.assessment,
                  interviewQuestions: rankedCandidate.interviewQuestions,
                  matchedSkills: rankedCandidate.matchedSkills,
                  missingSkills: rankedCandidate.missingSkills,
                  rank: rankedCandidate.rank,
                  rankingReason: rankedCandidate.rankingReason,
                  recommendationLevel: rankedCandidate.recommendationLevel,
                }),
                rankedCandidate.rank, // Use rank as score for sorting
                rankedCandidate.id,
              ],
            );
          } catch (dbError) {
            // Intentionally empty - error is handled by caller
          }
        }
      }

      // Update batch status to completed (if database available)
      if (databaseAvailable) {
        try {
          await database.run(
            `
          UPDATE cv_batches 
          SET status = 'completed', processed_resumes = $1, updated_at = CURRENT_TIMESTAMP 
          WHERE id = $2
        `,
            [candidates.length, batchId],
          );
        } catch (dbError) {
          // Intentionally empty - error is handled by caller
        }
      }

      res.json({
        success: true,
        data: {
          batchId: batchId,
          processed: candidates.length,
          total: cvFiles.length,
          candidates: candidates,
          databaseStatus: databaseAvailable ? 'connected' : 'offline',
        },
        message: `Batch processed successfully. ${candidates.length}/${cvFiles.length} CVs processed.${databaseAvailable ? '' : ' (Database offline - results not saved)'}`,
      });
    } catch (error) {
      try {
        await database.run(
          `
        UPDATE cv_batches 
        SET status = 'failed', updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1
      `,
          [req.params.id],
        );
      } catch (updateError) {
        // Intentionally empty - error is handled by caller
      }

      res.status(500).json({
        success: false,
        message: 'Failed to process batch',
        error: error.message,
      });
    }
  },
);

// GET /api/cv-intelligence/batches - Get all batches
router.get('/batches', authenticateToken, async (req, res) => {
  try {
    await database.connect();

    // Simplified query without complex joins
    const batches = await database.all(
      `
      SELECT 
        b.*,
        (SELECT COUNT(*) FROM candidates c WHERE c.batch_id = b.id) as candidate_count
      FROM cv_batches b
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `,
      [req.user.id],
    );

    // Get candidates for each batch
    for (const batch of batches) {
      const candidates = await database.all(
        `
        SELECT id, name, email, phone, overall_score
        FROM candidates 
        WHERE batch_id = $1 
        ORDER BY overall_score DESC
      `,
        [batch.id],
      );

      batch.candidates = candidates;
    }

    res.json({
      success: true,
      data: batches || [],
      message: 'CV batches retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve batches',
    });
  }
});

// GET /api/cv-intelligence/batch/:id - Get batch details
router.get('/batch/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await database.connect();

    const batch = await database.get(
      `
      SELECT * FROM cv_batches 
      WHERE id = $1 AND user_id = $2
    `,
      [id, req.user.id],
    );

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found',
      });
    }

    const candidates = await database.all(
      `
      SELECT * FROM candidates
      WHERE batch_id = $1
      ORDER BY overall_score ASC
    `,
      [id],
    );

    // Add cv_count field and parse JD requirements for frontend compatibility
    const jdRequirements = batch.jd_requirements
      ? JSON.parse(batch.jd_requirements)
      : { skills: [], experience: [], education: [], mustHave: [] };

    const batchWithCount = {
      ...batch,
      cv_count: batch.total_resumes || candidates.length,
      jd_requirements: jdRequirements,
    };

    // Parse candidates with ChatGPT rankings and assessments
    const rankedCandidates = candidates.map((candidate) => {
      const profileData = candidate.profile_json ? JSON.parse(candidate.profile_json) : {};

      // Extract ChatGPT ranking and assessment from profile
      const rank = profileData.rank || candidate.overall_score || 999;
      const rankingReason = profileData.rankingReason || 'Ranking analysis pending';
      const assessment = profileData.assessment || {};
      const recommendationLevel =
        profileData.recommendationLevel || assessment.recommendation || 'Maybe';

      return {
        ...candidate,
        rank: rank,
        rankingReason: rankingReason,
        recommendationLevel: recommendationLevel,
        assessment: assessment,
        name: candidate.name ? normalizeName(candidate.name) : 'Name not found',
        profile_json: profileData,
        // Remove score field completely - ChatGPT does the ranking
        score: undefined,
        overall_score: undefined,
      };
    });

    res.json({
      success: true,
      data: {
        batch: batchWithCount,
        candidates: rankedCandidates,
      },
      message: 'Batch details retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve batch details',
      error: error.message,
    });
  }
});

// GET /api/cv-intelligence/candidate/:id/evidence - Get candidate details (simplified)
router.get('/candidate/:id/evidence', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await database.connect();

    const candidate = await database.get(
      `
      SELECT * FROM candidates WHERE id = $1
    `,
      [id],
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }

    res.json({
      success: true,
      data: {
        candidate: {
          ...candidate,
          profile_json: candidate.profile_json ? JSON.parse(candidate.profile_json) : {},
        },
      },
      message: 'Candidate details retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve candidate details',
    });
  }
});

// POST /api/cv-intelligence/batch/:id/reset - Reset batch JD requirements (debug route)
router.post('/batch/:id/reset', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await database.connect();

    // Clear JD requirements and candidates for this batch
    await database.run(
      `
      UPDATE cv_batches 
      SET jd_requirements = NULL, status = 'created', total_resumes = 0, processed_resumes = 0
      WHERE id = $1 AND user_id = $2
    `,
      [id, req.user.id],
    );

    await database.run('DELETE FROM candidates WHERE batch_id = $1', [id]);

    res.json({
      success: true,
      message: 'Batch reset successfully - ready for fresh JD upload',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset batch',
      error: error.message,
    });
  }
});

// Interview scheduling disabled - route removed for cleanup

// DELETE /api/cv-intelligence/batch/:id - Delete batch and all associated candidates
router.delete('/batch/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await database.connect();

    // First, verify the batch belongs to the user
    const batch = await database.get(
      `
      SELECT * FROM cv_batches 
      WHERE id = $1 AND user_id = $2
    `,
      [id, req.user.id],
    );

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found or you do not have permission to delete it',
      });
    }

    // Delete all candidates associated with this batch
    const candidatesDeleted = await database.run(
      `
      DELETE FROM candidates 
      WHERE batch_id = $1
    `,
      [id],
    );

    // Delete the batch itself
    await database.run(
      `
      DELETE FROM cv_batches
      WHERE id = $1 AND user_id = $2
    `,
      [id, req.user.id],
    );

    res.json({
      success: true,
      message: 'Batch and all associated candidates deleted successfully',
      data: {
        batchId: id,
        batchName: batch.name,
        candidatesDeleted: candidatesDeleted.changes || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete batch',
      error: error.message,
    });
  }
});

module.exports = router;
