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
  console.log('✅ CV Intelligence HR-01 service loaded successfully');
} catch (error) {
  console.error('❌ Failed to load CV Intelligence HR-01 service:', error.message);
  console.error('Stack:', error.stack);
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

/**
 * @swagger
 * /api/cv-intelligence/test:
 *   get:
 *     tags: [CV Intelligence]
 *     summary: Test CV Intelligence service
 *     description: Verify that the CV Intelligence service is running and available
 *     responses:
 *       200:
 *         description: Service is operational
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: CV Intelligence routes are working!
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 service:
 *                   type: string
 *                   example: HR-01 Service Available
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'CV Intelligence routes are working!',
    timestamp: new Date().toISOString(),
    service: CVIntelligenceHR01 ? 'HR-01 Service Available' : 'HR-01 Service Not Available',
  });
});

/**
 * @swagger
 * /api/cv-intelligence:
 *   post:
 *     tags: [CV Intelligence]
 *     summary: Create new CV batch
 *     description: Create a new batch for processing CVs with job description
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Senior Developer Batch - Q1 2025
 *     responses:
 *       200:
 *         description: Batch created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     batchId:
 *                       type: string
 *                     name:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: created
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
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

/**
 * @swagger
 * /api/cv-intelligence/batch/{id}/process:
 *   post:
 *     tags: [CV Intelligence]
 *     summary: Upload and process CVs for batch
 *     description: Upload CVs and job description for intelligent analysis and ranking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Batch ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               cvFiles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 10
 *               jdFile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: CVs processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     batchId:
 *                       type: string
 *                     processed:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     candidates:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Candidate'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
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
          console.log('📄 Processing JD file:', jdFile.originalname);
          const jdResult = await CVIntelligenceHR01.processJobDescription(
            jdFile.buffer,
            jdFile.originalname,
          );

          if (jdResult.success && jdResult.requirements) {
            parsedRequirements = jdResult.requirements;
            console.log('✅ JD parsed successfully:', Object.keys(parsedRequirements));
          } else {
            console.warn('⚠️ JD parsing returned unsuccessful result');
          }
        } catch (error) {
          console.error('❌ JD processing failed:', error.message);
          console.error('Stack:', error.stack);
          // Continue with default requirements
        }
      }

      // Update batch status, file count, and JD requirements (if database available)
      // IMPORTANT: Use transaction to ensure batch update and candidate deletion are atomic
      if (databaseAvailable) {
        try {
          const jdRequirementsJSON = JSON.stringify(parsedRequirements);

          await database.transaction(async (client) => {
            // FORCE UPDATE - Clear any cached/corrupted JD requirements
            await client.query(
              `
              UPDATE cv_batches
              SET status = 'processing', total_resumes = $1, jd_requirements = $2, updated_at = CURRENT_TIMESTAMP
              WHERE id = $3 AND user_id = $4
            `,
              [cvFiles.length, jdRequirementsJSON, batchId, req.user.id],
            );

            // Also clear any existing candidates to force re-processing
            await client.query('DELETE FROM candidates WHERE batch_id = $1', [batchId]);
          });
        } catch (dbError) {
          console.error('⚠️ Transaction failed:', dbError.message);
          databaseAvailable = false;
        }
      }

      // Process each CV file with holistic assessment
      const candidates = [];
      const cvTexts = []; // Store raw CV texts for ranking
      const processingErrors = []; // Track errors per CV

      console.log(`\n🔄 Starting to process ${cvFiles.length} CVs...`);

      for (let i = 0; i < cvFiles.length; i++) {
        const file = cvFiles[i];
        console.log(`\n📄 Processing CV ${i + 1}/${cvFiles.length}: ${file.originalname}`);

        try {
          // Process with HR-01 service
          const result = await CVIntelligenceHR01.processResume(
            file.buffer,
            file.originalname,
            parsedRequirements,
          );

          if (result.success) {
            console.log(`✅ CV processed successfully: ${file.originalname}`);

            const candidateId = CVIntelligenceHR01.generateId();

            // STEP 1: Assess candidate for role (CV vs JD comparison)
            console.log(`   🔍 Assessing candidate fit against JD...`);
            const roleAssessment = await CVIntelligenceHR01.assessCandidateForRole(
              result.structuredData,
              parsedRequirements,
            );
            console.log(`   ✅ Assessment complete. Score: ${roleAssessment.score}/100`);

            // Get raw CV text for interview questions
            const parseData = await CVIntelligenceHR01.parseDocument(
              file.buffer,
              file.originalname.split('.').pop().toLowerCase(),
            );
            const cvText = parseData.rawText || '';

            // STEP 2: Generate interview questions based on assessment
            console.log(`   📝 Generating interview questions...`);
            const interviewQuestions = await CVIntelligenceHR01.generateInterviewQuestions(
              cvText,
              result.structuredData,
              {
                ...roleAssessment,
                overallFit: roleAssessment.score, // Map score to overallFit for compatibility
                weaknesses: roleAssessment.gaps,
              },
              parsedRequirements,
            );

            // STEP 3: Use ChatGPT for intelligent skill matching (not manual matching)
            console.log(`   🤖 Using ChatGPT to match skills against JD requirements...`);
            const skillMatching = await CVIntelligenceHR01.matchSkillsWithChatGPT(
              result.structuredData,
              parsedRequirements,
            );
            console.log(
              `   ✅ Skill matching complete. Matched: ${skillMatching.matchedSkills.length}, Missing: ${skillMatching.missingSkills.length}`,
            );

            const matchedSkills = skillMatching.matchedSkills;
            const missingSkills = skillMatching.missingSkills;
            const additionalSkills = skillMatching.additionalSkills;

            // Store candidate with NEW assessment structure
            const candidateData = {
              id: candidateId,
              name: normalizeName(result.structuredData.personal?.name || 'Name not found'),
              email: result.structuredData.personal?.email || 'Email not found',
              phone: result.structuredData.personal?.phone || 'Phone not found',
              location: result.structuredData.personal?.location || 'Location not specified',
              structuredData: result.structuredData,
              // NEW: Store role assessment (CV vs JD comparison)
              roleAssessment: roleAssessment,
              // Store assessment score for ranking
              assessmentScore: roleAssessment.score,
              interviewQuestions: interviewQuestions,
              matchedSkills: matchedSkills,
              missingSkills: missingSkills,
              additionalSkills: additionalSkills,
            };

            candidates.push(candidateData);

            // Store in database (if available) - use NEW assessment score
            if (databaseAvailable) {
              try {
                // Use the NEW assessment as professional_assessment
                const professionalAssessment = roleAssessment.assessment;
                const experience = JSON.stringify(result.structuredData.experience || []);
                const education = JSON.stringify(result.structuredData.education || []);

                // Store skills as JSON arrays (will be TEXT in PostgreSQL)
                const matchedSkillsJSON = JSON.stringify(matchedSkills);
                const missingSkillsJSON = JSON.stringify(missingSkills);
                const additionalSkillsJSON = JSON.stringify(additionalSkills);

                await database.run(
                  `
                INSERT INTO candidates (
                  id, batch_id, name, email, phone, location,
                  professional_assessment, experience, education,
                  matched_skills, missing_skills, additional_skills,
                  profile_json, overall_score
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
              `,
                  [
                    candidateId,
                    batchId,
                    candidateData.name,
                    candidateData.email,
                    candidateData.phone,
                    candidateData.location,
                    professionalAssessment, // NEW: Store OpenAI assessment
                    experience,
                    education,
                    matchedSkillsJSON, // Store as JSON array
                    missingSkillsJSON, // Store as JSON array
                    additionalSkillsJSON, // Store as JSON array
                    JSON.stringify({
                      ...result.structuredData,
                      roleAssessment: roleAssessment, // Store full assessment
                      interviewQuestions: interviewQuestions,
                      matchedSkills: matchedSkills,
                      missingSkills: missingSkills,
                      additionalSkills: additionalSkills,
                    }),
                    roleAssessment.score, // NEW: Store assessment score for ranking
                  ],
                );
              } catch (dbError) {
                console.error('   ⚠️ Database insert failed:', dbError.message);
              }
            }
          } else {
            console.warn(`⚠️ CV processing returned unsuccessful: ${file.originalname}`);
            processingErrors.push({
              file: file.originalname,
              error: 'Processing returned unsuccessful result',
            });
          }
        } catch (error) {
          console.error(`❌ Error processing CV ${file.originalname}:`, error.message);
          console.error('Stack:', error.stack);
          processingErrors.push({ file: file.originalname, error: error.message });
        }
      }

      console.log(`\n📊 Processing Summary:`);
      console.log(`   Total CVs: ${cvFiles.length}`);
      console.log(`   Successfully processed: ${candidates.length}`);
      console.log(`   Failed: ${processingErrors.length}`);

      // LET CHATGPT RANK ALL CANDIDATES INTELLIGENTLY
      console.log(`\n🏆 Letting ChatGPT rank candidates based on real-world fit...`);
      const rankings = await CVIntelligenceHR01.rankCandidatesIntelligently(
        candidates,
        parsedRequirements,
      );

      // Apply ChatGPT rankings to candidates
      const rankedCandidates = rankings.map((ranking) => {
        const candidate = candidates[ranking.originalIndex];
        return {
          ...candidate,
          rank: ranking.rank,
          rankingReason: ranking.rankingReason,
          recommendationLevel: ranking.recommendationLevel,
        };
      });

      console.log(`   Ranking complete:`);
      rankedCandidates.forEach((c) => {
        console.log(`     Rank ${c.rank}: ${c.name} - ${c.recommendationLevel}`);
      });

      // Update database with ChatGPT rankings
      // IMPORTANT: Use transaction to ensure all ranking updates are atomic
      if (databaseAvailable) {
        try {
          await database.transaction(async (client) => {
            for (const rankedCandidate of rankedCandidates) {
              // Also update the skill arrays during ranking
              const matchedSkillsJSON = JSON.stringify(rankedCandidate.matchedSkills || []);
              const missingSkillsJSON = JSON.stringify(rankedCandidate.missingSkills || []);
              const additionalSkillsJSON = JSON.stringify(rankedCandidate.additionalSkills || []);

              await client.query(
                `
                UPDATE candidates
                SET profile_json = $1, overall_score = $2,
                    matched_skills = $3, missing_skills = $4, additional_skills = $5
                WHERE id = $6
              `,
                [
                  JSON.stringify({
                    ...rankedCandidate.structuredData,
                    roleAssessment: rankedCandidate.roleAssessment,
                    interviewQuestions: rankedCandidate.interviewQuestions,
                    matchedSkills: rankedCandidate.matchedSkills,
                    missingSkills: rankedCandidate.missingSkills,
                    additionalSkills: rankedCandidate.additionalSkills,
                    rank: rankedCandidate.rank,
                    rankingReason: rankedCandidate.rankingReason,
                    recommendationLevel: rankedCandidate.recommendationLevel,
                  }),
                  rankedCandidate.rank, // Use rank for sorting (1 = best)
                  matchedSkillsJSON,
                  missingSkillsJSON,
                  additionalSkillsJSON,
                  rankedCandidate.id,
                ],
              );
            }
          });
        } catch (dbError) {
          console.error('   ⚠️ Ranking update transaction failed:', dbError.message);
        }
      }

      // Check if any candidates were successfully processed
      if (candidates.length === 0) {
        console.error('🚨 CRITICAL: No candidates were successfully processed!');

        // Mark batch as failed
        if (databaseAvailable) {
          try {
            await database.run(
              `UPDATE cv_batches SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
              [batchId],
            );
          } catch (dbError) {
            console.error('Failed to update batch status:', dbError);
          }
        }

        return res.status(500).json({
          success: false,
          message: 'CV processing failed - No candidates could be processed',
          data: {
            batchId: batchId,
            processed: 0,
            total: cvFiles.length,
            errors: processingErrors,
          },
        });
      }

      // Update batch status to completed (if database available)
      if (databaseAvailable) {
        try {
          const status = processingErrors.length > 0 ? 'completed_with_warnings' : 'completed';
          await database.run(
            `
          UPDATE cv_batches
          SET status = $1, processed_resumes = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `,
            [status, candidates.length, batchId],
          );
        } catch (dbError) {
          console.error('Failed to update batch:', dbError);
        }
      }

      const responseMessage =
        processingErrors.length > 0
          ? `Batch processed with warnings. ${candidates.length}/${cvFiles.length} CVs processed successfully. ${processingErrors.length} failed.`
          : `Batch processed successfully. ${candidates.length}/${cvFiles.length} CVs processed.`;

      res.json({
        success: true,
        data: {
          batchId: batchId,
          processed: candidates.length,
          total: cvFiles.length,
          candidates: candidates,
          errors: processingErrors,
          databaseStatus: databaseAvailable ? 'connected' : 'offline',
        },
        message:
          responseMessage + (databaseAvailable ? '' : ' (Database offline - results not saved)'),
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

/**
 * @swagger
 * /api/cv-intelligence/batches:
 *   get:
 *     tags: [CV Intelligence]
 *     summary: Get all CV batches
 *     description: Retrieve all CV processing batches for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Batches retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [created, processing, completed, failed]
 *                       total_resumes:
 *                         type: integer
 *                       processed_resumes:
 *                         type: integer
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
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

    // Get candidates for each batch (sorted by rank ASC - rank 1 is best)
    for (const batch of batches) {
      const candidates = await database.all(
        `
        SELECT id, name, email, phone, overall_score
        FROM candidates
        WHERE batch_id = $1
        ORDER BY overall_score ASC, id ASC
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

/**
 * @swagger
 * /api/cv-intelligence/batch/{id}:
 *   get:
 *     tags: [CV Intelligence]
 *     summary: Get batch details
 *     description: Retrieve detailed information about a specific CV batch including all candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Batch ID
 *     responses:
 *       200:
 *         description: Batch details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     batch:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         status:
 *                           type: string
 *                         jd_requirements:
 *                           type: object
 *                     candidates:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Candidate'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Batch not found
 */
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

    // Sort candidates by rank ASC (rank 1 = best, rank 2 = second best, etc.)
    const candidates = await database.all(
      `
      SELECT * FROM candidates
      WHERE batch_id = $1
      ORDER BY overall_score ASC, id ASC
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

    // Parse candidates with ChatGPT ranking and assessment
    const rankedCandidates = candidates.map((candidate) => {
      const profileData = candidate.profile_json ? JSON.parse(candidate.profile_json) : {};

      // Extract ChatGPT rank and reasoning
      const rank = profileData.rank || candidate.overall_score || 999;
      const rankingReason = profileData.rankingReason || 'Ranking pending';
      const recommendationLevel = profileData.recommendationLevel || 'Maybe';

      // Extract role assessment
      const roleAssessment = profileData.roleAssessment || {};

      // Parse skill arrays from JSON strings
      let matchedSkills = [];
      let missingSkills = [];
      let additionalSkills = [];

      try {
        matchedSkills = candidate.matched_skills ? JSON.parse(candidate.matched_skills) : [];
      } catch (e) {
        matchedSkills = [];
      }

      try {
        missingSkills = candidate.missing_skills ? JSON.parse(candidate.missing_skills) : [];
      } catch (e) {
        missingSkills = [];
      }

      try {
        additionalSkills = candidate.additional_skills
          ? JSON.parse(candidate.additional_skills)
          : [];
      } catch (e) {
        additionalSkills = [];
      }

      return {
        ...candidate,
        rank: rank, // ChatGPT-assigned rank (1 = best)
        rankingReason: rankingReason, // Why they got this rank
        recommendationLevel: recommendationLevel, // Strong Hire / Hire / Maybe / Pass
        // Assessment details (hide score, show qualitative data)
        professionalAssessment:
          candidate.professional_assessment ||
          roleAssessment.assessment ||
          'Assessment unavailable',
        strengths: roleAssessment.strengths || [],
        gaps: roleAssessment.gaps || [],
        matchedRequirements: roleAssessment.matchedRequirements || [],
        missingRequirements: roleAssessment.missingRequirements || [],
        recommendation: roleAssessment.recommendation || 'Maybe',
        // Skill arrays properly parsed
        matchedSkills: matchedSkills,
        missingSkills: missingSkills,
        additionalSkills: additionalSkills,
        // Keep profile data for backward compatibility
        name: candidate.name ? normalizeName(candidate.name) : 'Name not found',
        profile_json: profileData,
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

/**
 * @swagger
 * /api/cv-intelligence/batch/{id}:
 *   delete:
 *     tags: [CV Intelligence]
 *     summary: Delete CV batch
 *     description: Delete a CV batch and all associated candidate data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Batch ID
 *     responses:
 *       200:
 *         description: Batch deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Batch and all associated candidates deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Batch not found
 */
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
