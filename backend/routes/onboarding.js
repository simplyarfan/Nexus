/**
 * Onboarding Routes
 * HR Onboarding Assistant API endpoints
 * Access: Human Resources department only (or admin/superadmin)
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireHumanResources, departmentCheck } = require('../middleware/roleCheck');
const onboardingService = require('../services/onboarding.service');
const googleSheetsService = require('../services/googleSheets.service');
const { prisma } = require('../lib/prisma');

/**
 * POST /api/onboarding/employees
 * Create employee from selected candidate (Recruitment or HR can trigger)
 */
router.post(
  '/employees',
  authenticateToken,
  departmentCheck('Recruitment', 'Human Resources'),
  async (req, res) => {
    try {
      const {
        candidateProfileId,
        candidateEmail, // Fallback for looking up candidate by email
        interviewId,
        jobTitle,
        department,
        startDate,
        offeredSalary,
        employmentType,
      } = req.body;

      // Validation - need either candidateProfileId or candidateEmail to find the candidate
      if ((!candidateProfileId && !candidateEmail) || !jobTitle || !department) {
        return res.status(400).json({
          success: false,
          error: 'candidateProfileId (or candidateEmail), jobTitle, and department are required',
        });
      }

      const result = await onboardingService.createEmployeeFromCandidate({
        candidateProfileId,
        candidateEmail,
        interviewId,
        jobTitle,
        department,
        startDate,
        offeredSalary,
        employmentType,
        createdBy: req.user.id,
      });

      res.status(201).json({
        success: true,
        message: 'Employee created successfully and added to onboarding pipeline',
        data: result,
      });
    } catch (error) {
      console.error('Error creating employee:', error);
      res.status(error.message.includes('already') ? 409 : 500).json({
        success: false,
        error: error.message || 'Failed to create employee',
      });
    }
  },
);

/**
 * GET /api/onboarding/employees
 * Get all employees with onboarding status
 */
router.get('/employees', authenticateToken, requireHumanResources, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, department, search } = req.query;

    const result = await onboardingService.getEmployees({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      department,
      search,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch employees',
    });
  }
});

/**
 * GET /api/onboarding/employees/:id
 * Get single employee with full onboarding details
 */
router.get('/employees/:id', authenticateToken, requireHumanResources, async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id);

    if (isNaN(employeeId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid employee ID',
      });
    }

    const employee = await onboardingService.getEmployeeById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    // Calculate progress
    if (employee.onboarding) {
      employee.onboarding.progress = onboardingService.calculateProgress(
        employee.onboarding.checklist,
      );
    }

    res.json({
      success: true,
      data: { employee },
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch employee',
    });
  }
});

/**
 * PATCH /api/onboarding/employees/:id
 * Update employee information
 */
router.patch('/employees/:id', authenticateToken, requireHumanResources, async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id);

    if (isNaN(employeeId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid employee ID',
      });
    }

    const employee = await onboardingService.updateEmployee(employeeId, req.body);

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: { employee },
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update employee',
    });
  }
});

/**
 * PATCH /api/onboarding/employees/:id/status
 * Update employee status
 */
router.patch(
  '/employees/:id/status',
  authenticateToken,
  requireHumanResources,
  async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const { status } = req.body;

      if (isNaN(employeeId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid employee ID',
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Status is required',
        });
      }

      const employee = await onboardingService.updateEmployeeStatus(employeeId, status);

      res.json({
        success: true,
        message: 'Employee status updated',
        data: { employee },
      });
    } catch (error) {
      console.error('Error updating employee status:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update employee status',
      });
    }
  },
);

/**
 * GET /api/onboarding/:employeeId
 * Get onboarding record for an employee
 */
router.get('/:employeeId', authenticateToken, requireHumanResources, async (req, res) => {
  try {
    const employeeId = parseInt(req.params.employeeId);

    if (isNaN(employeeId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid employee ID',
      });
    }

    const onboarding = await onboardingService.getOnboardingByEmployeeId(employeeId);

    if (!onboarding) {
      return res.status(404).json({
        success: false,
        error: 'Onboarding record not found',
      });
    }

    res.json({
      success: true,
      data: { onboarding },
    });
  } catch (error) {
    console.error('Error fetching onboarding:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch onboarding record',
    });
  }
});

/**
 * PATCH /api/onboarding/:onboardingId/checklist
 * Update a checklist item
 */
router.patch(
  '/:onboardingId/checklist',
  authenticateToken,
  requireHumanResources,
  async (req, res) => {
    try {
      const onboardingId = parseInt(req.params.onboardingId);
      const { category, itemId, completed } = req.body;

      if (isNaN(onboardingId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid onboarding ID',
        });
      }

      if (!category || !itemId || completed === undefined) {
        return res.status(400).json({
          success: false,
          error: 'category, itemId, and completed are required',
        });
      }

      const result = await onboardingService.updateChecklistItem({
        onboardingId,
        category,
        itemId,
        completed,
        userId: req.user.id,
      });

      res.json({
        success: true,
        message: 'Checklist item updated',
        data: result,
      });
    } catch (error) {
      console.error('Error updating checklist:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update checklist item',
      });
    }
  },
);

/**
 * PATCH /api/onboarding/:onboardingId/assign
 * Assign HR staff or buddy to onboarding
 */
router.patch(
  '/:onboardingId/assign',
  authenticateToken,
  requireHumanResources,
  async (req, res) => {
    try {
      const onboardingId = parseInt(req.params.onboardingId);
      const { assignedTo, buddyId } = req.body;

      if (isNaN(onboardingId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid onboarding ID',
        });
      }

      const onboarding = await onboardingService.assignOnboarding({
        onboardingId,
        assignedTo,
        buddyId,
      });

      res.json({
        success: true,
        message: 'Assignment updated',
        data: { onboarding },
      });
    } catch (error) {
      console.error('Error assigning onboarding:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update assignment',
      });
    }
  },
);

/**
 * PATCH /api/onboarding/:onboardingId/notes
 * Add notes to onboarding record
 */
router.patch('/:onboardingId/notes', authenticateToken, requireHumanResources, async (req, res) => {
  try {
    const onboardingId = parseInt(req.params.onboardingId);
    const { notes } = req.body;

    if (isNaN(onboardingId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid onboarding ID',
      });
    }

    const onboarding = await onboardingService.addOnboardingNotes(onboardingId, notes);

    res.json({
      success: true,
      message: 'Notes updated',
      data: { onboarding },
    });
  } catch (error) {
    console.error('Error updating notes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notes',
    });
  }
});

/**
 * POST /api/onboarding/:employeeId/emails/welcome
 * Send welcome email to new employee
 */
router.post(
  '/:employeeId/emails/welcome',
  authenticateToken,
  requireHumanResources,
  async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);

      if (isNaN(employeeId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid employee ID',
        });
      }

      const result = await onboardingService.sendWelcomeEmail(employeeId);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send welcome email',
      });
    }
  },
);

/**
 * POST /api/onboarding/:employeeId/emails/documents
 * Send document request email
 */
router.post(
  '/:employeeId/emails/documents',
  authenticateToken,
  requireHumanResources,
  async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);

      if (isNaN(employeeId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid employee ID',
        });
      }

      const result = await onboardingService.sendDocumentRequestEmail(employeeId);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error('Error sending document request email:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send document request email',
      });
    }
  },
);

/**
 * POST /api/onboarding/:employeeId/emails/first-day
 * Send first day information email
 */
router.post(
  '/:employeeId/emails/first-day',
  authenticateToken,
  requireHumanResources,
  async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);

      if (isNaN(employeeId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid employee ID',
        });
      }

      const result = await onboardingService.sendFirstDayInfoEmail(employeeId);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error('Error sending first day info email:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send first day info email',
      });
    }
  },
);

/**
 * GET /api/onboarding/stats
 * Get onboarding statistics
 */
router.get('/stats/overview', authenticateToken, requireHumanResources, async (req, res) => {
  try {
    const stats = await onboardingService.getOnboardingStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching onboarding stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch onboarding statistics',
    });
  }
});

/**
 * GET /api/onboarding/google-sheets/test
 * Test Google Sheets connection (admin only for debugging)
 */
router.get('/google-sheets/test', authenticateToken, requireHumanResources, async (req, res) => {
  try {
    const result = await googleSheetsService.testConnection();

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    console.error('Error testing Google Sheets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test Google Sheets connection',
    });
  }
});

/**
 * GET /api/onboarding/google-sheets/data
 * Get data from Google Sheets (for debugging column mapping)
 */
router.get('/google-sheets/data', authenticateToken, requireHumanResources, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const result = await googleSheetsService.getAllData(parseInt(limit));

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Google Sheets data',
    });
  }
});

/**
 * GET /api/onboarding/hr-users
 * Get list of HR department users (for assignment dropdown)
 */
router.get('/hr-users/list', authenticateToken, requireHumanResources, async (req, res) => {
  try {
    const hrUsers = await prisma.users.findMany({
      where: {
        department: 'Human Resources',
        is_active: true,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        job_title: true,
      },
      orderBy: {
        first_name: 'asc',
      },
    });

    res.json({
      success: true,
      data: { users: hrUsers },
    });
  } catch (error) {
    console.error('Error fetching HR users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch HR users',
    });
  }
});

/**
 * DELETE /api/onboarding/employees/:id
 * Delete an employee and their onboarding record
 * This also resets the candidate's is_hired status so they can be re-hired or deleted
 */
router.delete('/employees/:id', authenticateToken, requireHumanResources, async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id);

    if (isNaN(employeeId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid employee ID',
      });
    }

    // Find the employee
    const employee = await prisma.employees.findUnique({
      where: { id: employeeId },
      include: { onboarding: true },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    // Use transaction to delete employee and reset candidate
    await prisma.$transaction(async (tx) => {
      // Delete onboarding record first (due to foreign key)
      if (employee.onboarding) {
        await tx.onboarding.delete({
          where: { id: employee.onboarding.id },
        });
      }

      // Delete employee
      await tx.employees.delete({
        where: { id: employeeId },
      });

      // Reset candidate's hired status
      await tx.candidate_profiles.update({
        where: { id: employee.candidate_profile_id },
        data: {
          is_hired: false,
          hired_at: null,
        },
      });
    });

    res.json({
      success: true,
      message: 'Employee deleted successfully. Candidate profile is now available again.',
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete employee',
    });
  }
});

module.exports = router;
