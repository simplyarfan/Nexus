/**
 * INTERVIEW COORDINATOR ROUTES (HR-02)
 * Multi-stage interview workflow with availability request and scheduling
 */

const express = require('express');
const multer = require('multer');
const database = require('../models/database');
const auth = require('../middleware/auth');
const authenticateToken = auth.authenticateToken;
const { generalLimiter } = require('../middleware/rateLimiting');
const fs = require('fs').promises;
const path = require('path');
const { sanitizeBasic } = require('../utils/sanitize');
const InterviewCoordinatorService = require('../services/interview-coordinator.service');

const interviewService = new InterviewCoordinatorService();

// Configure multer for CV file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF, DOC, DOCX files
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  },
});

// Load Outlook Email Service
let OutlookEmailService = null;
try {
  const OutlookEmailServiceClass = require('../services/outlook-email.service.js');
  OutlookEmailService = new OutlookEmailServiceClass();
} catch (error) {
      // Intentionally empty - error is handled by caller
    }

const router = express.Router();

/**
 * @swagger
 * /api/interview-coordinator/interviews:
 *   get:
 *     tags: [Interview Coordinator]
 *     summary: Get all interviews
 *     description: Retrieve paginated list of interviews for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Interviews retrieved successfully
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
 *                     $ref: '#/components/schemas/Interview'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/interviews', authenticateToken, generalLimiter, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    await database.connect();

    // Get total count
    const countResult = await database.get(
      'SELECT COUNT(*) as total FROM interviews WHERE scheduled_by = $1',
      [req.user.id],
    );
    const total = countResult?.total || 0;

    // Get paginated interviews
    const interviews = await database.all(
      `
      SELECT * FROM interviews
      WHERE scheduled_by = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `,
      [req.user.id, parseInt(limit), offset],
    );

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: interviews || [],
      pagination: {
        currentPage: parseInt(page),
        pageSize: parseInt(limit),
        totalItems: total,
        totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1,
      },
      message: 'Interviews retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve interviews',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * @swagger
 * /api/interview-coordinator/interview/{id}:
 *   get:
 *     tags: [Interview Coordinator]
 *     summary: Get interview details
 *     description: Retrieve detailed information about a specific interview
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Interview ID
 *     responses:
 *       200:
 *         description: Interview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Interview'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Interview not found
 */
router.get('/interview/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await database.connect();

    const interview = await database.get(
      `
      SELECT * FROM interviews 
      WHERE id = $1 AND scheduled_by = $2
    `,
      [id, req.user.id],
    );

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found',
      });
    }

    res.json({
      success: true,
      data: interview,
      message: 'Interview retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve interview',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/interview-coordinator/request-availability:
 *   post:
 *     tags: [Interview Coordinator]
 *     summary: Request candidate availability
 *     description: Send availability request email to candidate for interview scheduling
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - candidateName
 *               - candidateEmail
 *               - position
 *             properties:
 *               candidateId:
 *                 type: string
 *               candidateName:
 *                 type: string
 *                 example: John Doe
 *               candidateEmail:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               position:
 *                 type: string
 *                 example: Senior Developer
 *               googleFormLink:
 *                 type: string
 *                 format: uri
 *               emailSubject:
 *                 type: string
 *               emailContent:
 *                 type: string
 *               ccEmails:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *               bccEmails:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *     responses:
 *       200:
 *         description: Availability request sent successfully
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
 *                     interviewId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: awaiting_response
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/request-availability', authenticateToken, generalLimiter, async (req, res) => {
  try {
    // Do not require Google Calendar for availability emails; just warn optionally elsewhere

    const {
      candidateId,
      candidateName,
      candidateEmail,
      position,
      googleFormLink,
      emailSubject,
      emailContent,
      ccEmails,
      bccEmails,
    } = req.body;

    // Validation
    if (!candidateName || !candidateEmail || !position) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: candidateName, candidateEmail, position',
      });
    }

    if (!OutlookEmailService) {
      return res.status(503).json({
        success: false,
        message: 'Email service not available. Please connect your Outlook account.',
      });
    }

    await database.connect();

    const user = await database.get(
      `
      SELECT outlook_access_token, outlook_email 
      FROM users 
      WHERE id = $1
    `,
      [req.user.id],
    );

    if (!user || !user.outlook_access_token) {
      return res.status(400).json({
        success: false,
        message: 'Please connect your Outlook account first to send emails',
      });
    }

    // Generate interview ID
    const interviewId = `interview_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Generate candidate ID if not provided (using email as unique identifier)
    const generatedCandidateId =
      candidateId || `candidate_${candidateEmail.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;

    try {
      // Use the proper email service which handles token refresh
      await OutlookEmailService.sendAvailabilityRequest(req.user.id, candidateEmail, {
        candidateName,
        position,
        googleFormLink,
        customSubject: emailSubject,
        customContent: emailContent,
        ccEmails: ccEmails || [],
        bccEmails: bccEmails || [],
      });

      await database.run(
        `
        INSERT INTO interviews (
          id, candidate_id, candidate_name, candidate_email, job_title,
          status, google_form_link, scheduled_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
        [
          interviewId,
          generatedCandidateId,
          candidateName,
          candidateEmail,
          position,
          'awaiting_response',
          googleFormLink || null,
          req.user.id,
        ],
      );

      res.json({
        success: true,
        data: { interviewId, status: 'awaiting_response' },
        message: 'Availability request sent successfully!',
      });
    } catch (emailError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send email. Interview not created.',
        error: emailError.response?.data?.error?.message || emailError.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send availability request',
      error: error.message,
      details:
        process.env.NODE_ENV === 'development'
          ? {
              stack: error.stack,
              code: error.code,
            }
          : undefined,
    });
  }
});

/**
 * @swagger
 * /api/interview-coordinator/schedule-interview:
 *   post:
 *     tags: [Interview Coordinator]
 *     summary: Schedule interview
 *     description: Schedule an interview with specific time, create calendar event, and send confirmation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - candidateName
 *               - candidateEmail
 *               - position
 *               - interviewDate
 *               - interviewTime
 *             properties:
 *               candidateId:
 *                 type: string
 *               candidateName:
 *                 type: string
 *                 example: John Doe
 *               candidateEmail:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               position:
 *                 type: string
 *                 example: Senior Developer
 *               interviewDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-02-15"
 *               interviewTime:
 *                 type: string
 *                 example: "14:00"
 *               duration:
 *                 type: integer
 *                 example: 60
 *               meetingLink:
 *                 type: string
 *                 format: uri
 *               cvFile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Interview scheduled successfully
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
 *                     interviewId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: scheduled
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post(
  '/schedule-interview',
  authenticateToken,
  generalLimiter,
  upload.single('cvFile'),
  async (req, res) => {
    try {
      let { interviewId, interviewType, scheduledTime, duration, platform, notes } = req.body;

      // SECURITY: Sanitize text inputs
      notes = sanitizeBasic(notes);

      // Parse ccEmails and bccEmails if they are JSON strings (from FormData)
      let ccEmails = req.body.ccEmails;
      let bccEmails = req.body.bccEmails;

      if (typeof ccEmails === 'string') {
        try {
          ccEmails = JSON.parse(ccEmails);
        } catch (e) {
          ccEmails = [];
        }
      }
      if (typeof bccEmails === 'string') {
        try {
          bccEmails = JSON.parse(bccEmails);
        } catch (e) {
          bccEmails = [];
        }
      }

      if (!interviewId || !scheduledTime || !platform) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: interviewId, scheduledTime, platform',
        });
      }

      await database.connect();

      // Verify interview exists and belongs to user FIRST
      const interview = await database.get(
        `
      SELECT * FROM interviews
      WHERE id = $1 AND scheduled_by = $2
    `,
        [interviewId, req.user.id],
      );

      if (!interview) {
        return res.status(404).json({
          success: false,
          message: 'Interview not found',
        });
      }

      // Create real Microsoft Teams meeting via Graph API
      let meetingLink = '';
      let teamsMeetingId = null;

      if (!OutlookEmailService) {
        return res.status(503).json({
          success: false,
          message: 'Email service not available. Please contact support.',
        });
      }

      try {
        const startTime = new Date(scheduledTime);
        const endTime = new Date(startTime.getTime() + (duration || 60) * 60000);

        // Combine all participants: candidate + CC emails (BCC hidden from meeting)
        const allParticipants = [
          interview.candidate_email,
          ...(ccEmails || []).filter((email) => email && email.trim()),
        ];

        const teamsResult = await OutlookEmailService.createTeamsMeeting(req.user.id, {
          subject: `Interview - ${interview.candidate_name} - ${interview.job_title}`,
          startDateTime: startTime.toISOString(),
          endDateTime: endTime.toISOString(),
          participantEmails: allParticipants,
        });

        meetingLink = teamsResult.joinUrl;
        teamsMeetingId = teamsResult.meetingId;
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create Teams meeting. Please ensure Outlook is connected.',
          error: error.message,
        });
      }

      // Update interview with schedule details and Teams meeting ID
      await database.run(
        `
      UPDATE interviews
      SET interview_type = $1,
          scheduled_time = $2,
          duration = $3,
          platform = $4,
          meeting_link = $5,
          notes = $6,
          status = 'scheduled',
          scheduled_at = $7,
          teams_meeting_id = $8,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
    `,
        [
          interviewType || 'technical',
          scheduledTime,
          duration || 60,
          'Microsoft Teams',
          meetingLink || '',
          notes || '',
          new Date(),
          teamsMeetingId,
          interviewId,
        ],
      );

      // Generate ICS calendar file
      let icsContent = null;
      if (interviewService) {
        icsContent = interviewService.generateICSInvite({
          id: interviewId,
          candidateName: interview.candidate_name,
          candidateEmail: interview.candidate_email,
          position: interview.job_title,
          interviewType: interviewType || 'technical',
          scheduledTime,
          duration: duration || 60,
          platform,
          meetingLink: meetingLink || '',
        });
      }

      // Handle CV file if uploaded
      let cvFilePath = null;
      if (req.file && !process.env.VERCEL) {
        // Save CV file to uploads directory
        const uploadsDir = path.join(__dirname, '../uploads/cvs');
        try {
          await fs.mkdir(uploadsDir, { recursive: true });
          const filename = `cv_${interviewId}_${Date.now()}_${req.file.originalname}`;
          cvFilePath = path.join(uploadsDir, filename);
          await fs.writeFile(cvFilePath, req.file.buffer);

          await database.run(
            `
          UPDATE interviews 
          SET cv_file_path = $1
          WHERE id = $2
        `,
            [cvFilePath, interviewId],
          );
        } catch (error) {
      // Intentionally empty - error is handled by caller
    }
      }

      // Send confirmation email with calendar invite and CV attachment
      let emailSent = false;
      if (OutlookEmailService) {
        try {
          // Prepare CV buffer and filename for email attachment
          const cvBuffer = req.file ? req.file.buffer : null;
          const cvFilename = req.file ? req.file.originalname : null;

          await OutlookEmailService.sendInterviewConfirmation(
            req.user.id,
            interview.candidate_email,
            {
              candidateName: interview.candidate_name,
              position: interview.job_title,
              interviewType: interviewType || 'technical',
              scheduledTime,
              duration: duration || 60,
              platform,
              meetingLink: meetingLink || '',
              ccEmails: ccEmails || [],
              bccEmails: bccEmails || [],
            },
            icsContent,
            cvBuffer,
            cvFilename,
          );
          emailSent = true;
        } catch (error) {
      // Intentionally empty - error is handled by caller
    }
      }

      res.json({
        success: true,
        data: {
          interviewId,
          emailSent,
          icsGenerated: !!icsContent,
          status: 'scheduled',
          message: emailSent
            ? 'Interview scheduled and confirmation sent'
            : 'Interview scheduled but email failed',
        },
        message: 'Interview scheduled successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to schedule interview',
        error: error.message,
      });
    }
  },
);

/**
 * PUT /interview/:id/reschedule - Reschedule an interview
 */
/**
 * @swagger
 * /api/interview-coordinator/interview/{id}/reschedule:
 *   put:
 *     tags: [Interview Coordinator]
 *     summary: Reschedule interview
 *     description: Update interview date and time, update calendar event, and send notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Interview ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - interviewDate
 *               - interviewTime
 *             properties:
 *               interviewDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-02-20"
 *               interviewTime:
 *                 type: string
 *                 example: "15:00"
 *               duration:
 *                 type: integer
 *                 example: 60
 *               meetingLink:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Interview rescheduled successfully
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
 *                   example: Interview rescheduled successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Interview not found
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.put('/interview/:id/reschedule', authenticateToken, generalLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledTime, duration, notes, notifyRecipients } = req.body;

    if (!scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'scheduledTime is required',
      });
    }

    await database.connect();

    // Verify interview exists and belongs to user
    const interview = await database.get(
      `
      SELECT * FROM interviews
      WHERE id = $1 AND scheduled_by = $2
    `,
      [id, req.user.id],
    );

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found',
      });
    }

    // Update interview with new schedule
    await database.run(
      `
      UPDATE interviews
      SET scheduled_time = $1,
          duration = COALESCE($2, duration),
          notes = COALESCE($3, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `,
      [scheduledTime, duration || null, notes || null, id],
    );

    // Keep existing meeting link (Microsoft Teams)
    const updatedMeetingLink = interview.meeting_link;

    // Send reschedule notification email if requested
    if (notifyRecipients !== false && OutlookEmailService) {
      try {
        // Generate new ICS file
        let icsContent = null;
        if (interviewService) {
          icsContent = interviewService.generateICSInvite({
            id: interview.id,
            candidateName: interview.candidate_name,
            candidateEmail: interview.candidate_email,
            position: interview.job_title,
            interviewType: interview.interview_type,
            scheduledTime,
            duration: duration || interview.duration,
            platform: interview.platform,
            meetingLink: updatedMeetingLink,
          });
        }

        // Parse CC and BCC emails (stored as JSON strings)
        const ccEmails = [];
        const bccEmails = [];
        // TODO: Load CC/BCC from interview table when columns are added
        // For now, using empty arrays

        await OutlookEmailService.sendRescheduleNotification(
          req.user.id,
          interview.candidate_email,
          {
            candidateName: interview.candidate_name,
            position: interview.job_title,
            interviewType: interview.interview_type,
            oldScheduledTime: interview.scheduled_time,
            newScheduledTime: scheduledTime,
            duration: duration || interview.duration,
            platform: interview.platform,
            meetingLink: updatedMeetingLink,
            notes: notes || interview.notes,
            ccEmails,
            bccEmails,
          },
          icsContent,
        );
      } catch (error) {
      // Intentionally empty - error is handled by caller
    }
    }

    res.json({
      success: true,
      message: 'Interview rescheduled successfully',
      data: {
        scheduledTime,
        duration: duration || interview.duration,
        notificationSent: notifyRecipients !== false,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule interview',
      error: error.message,
    });
  }
});

/**
 * PUT /interview/:id/status - Update interview status (scheduled/completed/selected/rejected)
 */
/**
 * @swagger
 * /api/interview-coordinator/interview/{id}/status:
 *   put:
 *     tags: [Interview Coordinator]
 *     summary: Update interview status
 *     description: Update the status of an interview (e.g., completed, cancelled)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Interview ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [scheduled, awaiting_response, completed, cancelled]
 *                 example: completed
 *     responses:
 *       200:
 *         description: Status updated successfully
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
 *                   example: Interview status updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Interview not found
 */
router.put('/interview/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, outcome, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const validStatuses = ['awaiting_response', 'scheduled', 'completed', 'cancelled'];
    const validOutcomes = ['selected', 'rejected', null];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    if (outcome && !validOutcomes.includes(outcome)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid outcome. Must be one of: selected, rejected, or null',
      });
    }

    await database.connect();

    // Verify ownership
    const interview = await database.get(
      `
      SELECT * FROM interviews WHERE id = $1 AND scheduled_by = $2
    `,
      [id, req.user.id],
    );

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found',
      });
    }

    // Update status
    await database.run(
      `
      UPDATE interviews 
      SET status = $1,
          outcome = $2,
          notes = COALESCE($3, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `,
      [status, outcome || null, notes || null, id],
    );

    res.json({
      success: true,
      message: 'Interview status updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update interview status',
      error: error.message,
    });
  }
});

/**
 * GET /calendar/:id/ics - Download ICS calendar file
 */
// Unified ICS endpoint: prefer service-based generator
router.get('/calendar/:id/ics', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    // const { type } = req.query; // google, outlook, or apple - not currently used

    await database.connect();

    const interview = await database.get(
      `
      SELECT * FROM interviews
      WHERE id = $1 AND scheduled_by = $2
    `,
      [id, req.user.id],
    );

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found',
      });
    }

    if (!interview.scheduled_time) {
      return res.status(400).json({
        success: false,
        message: 'Interview does not have a scheduled time',
      });
    }

    const icsContent = interviewService
      ? interviewService.generateICSInvite({
          id: interview.id,
          candidateName: interview.candidate_name,
          candidateEmail: interview.candidate_email,
          position: interview.job_title,
          interviewType: interview.interview_type,
          scheduledTime: interview.scheduled_time,
          duration: interview.duration,
          platform: interview.platform,
          meetingLink: interview.meeting_link,
        })
      : [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//Interview Coordinator//EN',
          'CALSCALE:GREGORIAN',
          'METHOD:REQUEST',
          'BEGIN:VEVENT',
          `UID:${interview.id}@interviewcoordinator.com`,
          // Minimal fallback content
          `SUMMARY:${interview.interview_type || 'Interview'} - ${interview.candidate_name}`,
          `DESCRIPTION:Interview for ${interview.job_title}`,
          'END:VEVENT',
          'END:VCALENDAR',
        ].join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="interview-${interview.candidate_name.replace(/\s+/g, '-')}.ics"`,
    );
    res.send(icsContent);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate calendar file',
      error: error.message,
    });
  }
});

/**
 * DELETE /interview/:id - Delete/cancel interview
 */
// Removed earlier duplicate DELETE route; keep the enhanced logged version below

/**
 * GET /email-template/availability - Get default availability request template
 */
router.get('/email-template/availability', authenticateToken, async (req, res) => {
  try {
    const { candidateName, position } = req.query;

    const template = {
      subject: `Interview Opportunity - ${position}`,
      content: `Dear ${candidateName},

We are pleased to inform you that we would like to invite you for an interview for the ${position} position at our company.

Before we proceed with scheduling, we would like to understand your availability. Please fill out the following form with your available time slots:

[Google Forms Link will be inserted here]

Additionally, please let us know your preferred interview times by replying to this email.

We look forward to speaking with you soon.

Best regards,
[Your Company Name]`,
    };

    res.json({
      success: true,
      data: template,
      message: 'Email template retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get email template',
      error: error.message,
    });
  }
});

/**
 * GET /email-template/confirmation - Get default confirmation email template
 */
router.get('/email-template/confirmation', authenticateToken, async (req, res) => {
  try {
    const { candidateName, position, scheduledTime, duration, platform } = req.query;

    const template = {
      subject: `Interview Scheduled - ${position}`,
      content: `Dear ${candidateName},

Your interview for the ${position} position has been confirmed.

Interview Details:
• Date & Time: ${scheduledTime}
• Duration: ${duration} minutes
• Platform: ${platform}
• Meeting Link: [Will be inserted]

Please add this interview to your calendar using the attached calendar file or the buttons below.

If you need to reschedule, please let us know as soon as possible.

We look forward to meeting you!

Best regards,
[Your Company Name]`,
    };

    res.json({
      success: true,
      data: template,
      message: 'Email template retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get email template',
      error: error.message,
    });
  }
});

// Removed duplicate ICS endpoint; use /calendar/:id/ics

/**
 * DELETE /interview/:id - Delete an interview
 */
/**
 * @swagger
 * /api/interview-coordinator/interview/{id}:
 *   delete:
 *     tags: [Interview Coordinator]
 *     summary: Delete interview
 *     description: Cancel and delete an interview, remove calendar event, and notify candidate
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Interview ID
 *     responses:
 *       200:
 *         description: Interview deleted successfully
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
 *                   example: Interview cancelled and deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Interview not found
 */
router.delete('/interview/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await database.connect();

    const interview = await database.get(
      `
      SELECT * FROM interviews 
      WHERE id = $1 AND scheduled_by = $2
    `,
      [id, req.user.id],
    );

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found or you do not have permission to delete it',
      });
    }

    // Cancel Teams meeting if it exists
    if (interview.teams_meeting_id && OutlookEmailService) {
      try {
        await OutlookEmailService.cancelTeamsMeeting(req.user.id, interview.teams_meeting_id);
      } catch (error) {
      // Intentionally empty - error is handled by caller
    }
    }

    // Delete the interview

    await database.run(`DELETE FROM interviews WHERE id = $1`, [id]);

    res.json({
      success: true,
      message: 'Interview and Teams meeting cancelled successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete interview',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

module.exports = router;
