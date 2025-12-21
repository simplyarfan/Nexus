/**
 * Onboarding Service
 * Handles employee creation from candidates and onboarding process management
 */

const { prisma } = require('../lib/prisma');
const googleSheetsService = require('./googleSheets.service');
const emailService = require('./email.service');

class OnboardingService {
  constructor() {
    // Default comprehensive checklist template
    this.defaultChecklist = {
      preboarding: [
        {
          id: 'pre_1',
          task: 'Send offer letter',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
        {
          id: 'pre_2',
          task: 'Collect signed offer letter',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
        {
          id: 'pre_3',
          task: 'Request required documents',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
        {
          id: 'pre_4',
          task: 'Verify all documents received',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
        {
          id: 'pre_5',
          task: 'Run background check',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
        {
          id: 'pre_6',
          task: 'Create employee record in payroll',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
      ],
      it_setup: [
        {
          id: 'it_1',
          task: 'Create company email account',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
        {
          id: 'it_2',
          task: 'Set up workstation/laptop',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
        {
          id: 'it_3',
          task: 'Create system access credentials',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
        {
          id: 'it_4',
          task: 'Configure VPN access',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
        {
          id: 'it_5',
          task: 'Add to relevant software tools',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
        {
          id: 'it_6',
          task: 'Assign phone extension (if applicable)',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
      ],
      training: [
        {
          id: 'tr_1',
          task: 'Schedule orientation session',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
        {
          id: 'tr_2',
          task: 'Assign onboarding buddy',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
        {
          id: 'tr_3',
          task: 'Schedule department training',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
        {
          id: 'tr_4',
          task: 'Provide access to training materials',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
        {
          id: 'tr_5',
          task: 'Schedule meet-and-greet with team',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
      ],
      compliance: [
        {
          id: 'co_1',
          task: 'Complete tax forms',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
        { id: 'co_2', task: 'Sign NDA', completed: false, completedAt: null, completedBy: null },
        {
          id: 'co_3',
          task: 'Sign employee handbook acknowledgment',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
        {
          id: 'co_4',
          task: 'Complete safety training',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
        {
          id: 'co_5',
          task: 'Set up benefits enrollment',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
      ],
      first_day: [
        {
          id: 'fd_1',
          task: 'Prepare welcome kit',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
        {
          id: 'fd_2',
          task: 'Send first day information email',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
        {
          id: 'fd_3',
          task: 'Set up desk/workspace',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
        {
          id: 'fd_4',
          task: 'Prepare building access card',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
        {
          id: 'fd_5',
          task: 'Schedule first day agenda',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
        {
          id: 'fd_6',
          task: 'Notify team of new hire arrival',
          completed: false,
          completedAt: null,
          completedBy: null,
        },
      ],
    };
  }

  /**
   * Generate a unique employee ID
   * Format: EMP-YYYY-XXXX (e.g., EMP-2024-0001)
   */
  async generateEmployeeId() {
    const year = new Date().getFullYear();
    const prefix = `EMP-${year}-`;

    // Find the highest employee ID for this year
    const lastEmployee = await prisma.employees.findFirst({
      where: {
        employee_id: {
          startsWith: prefix,
        },
      },
      orderBy: {
        employee_id: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastEmployee) {
      const lastNumber = parseInt(lastEmployee.employee_id.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Create an employee from a selected candidate
   * @param {object} params - Creation parameters
   * @param {string} params.candidateProfileId - ID of the candidate profile
   * @param {string} params.candidateEmail - Email of the candidate (fallback lookup)
   * @param {string} params.interviewId - ID of the interview
   * @param {string} params.jobTitle - Job title being offered
   * @param {string} params.department - Department
   * @param {Date} params.startDate - Expected start date
   * @param {number} params.offeredSalary - Offered salary (optional)
   * @param {string} params.employmentType - full-time, part-time, contract
   * @param {number} params.createdBy - ID of the user creating the employee
   */
  async createEmployeeFromCandidate({
    candidateProfileId,
    candidateEmail,
    interviewId,
    jobTitle,
    department,
    startDate,
    offeredSalary,
    employmentType = 'full-time',
    createdBy,
  }) {
    // 1. Get candidate profile - try by ID first, then fallback to email
    let candidateProfile = null;

    if (candidateProfileId) {
      candidateProfile = await prisma.candidate_profiles.findUnique({
        where: { id: candidateProfileId },
      });
    }

    // Fallback: if ID lookup failed and we have email, try looking up by email
    if (!candidateProfile && candidateEmail) {
      console.log(`Candidate not found by ID, trying email lookup: ${candidateEmail}`);
      candidateProfile = await prisma.candidate_profiles.findFirst({
        where: { email: candidateEmail },
      });
    }

    if (!candidateProfile) {
      throw new Error(
        'Candidate profile not found. Please ensure the candidate exists in the system.',
      );
    }

    if (candidateProfile.is_hired) {
      throw new Error('This candidate has already been hired');
    }

    // 2. Check if interview exists and is 'selected'
    if (interviewId) {
      const interview = await prisma.interviews.findUnique({
        where: { id: interviewId },
      });

      if (!interview) {
        throw new Error('Interview not found');
      }

      if (interview.outcome !== 'selected') {
        throw new Error('Can only create employee from a selected candidate');
      }
    }

    // 3. Try to get additional info from Google Sheets
    let googleSheetsData = null;
    try {
      googleSheetsData = await googleSheetsService.getPersonalInfoByEmail(candidateProfile.email);
    } catch (error) {
      console.warn('Could not fetch Google Sheets data:', error.message);
    }

    // 4. Generate employee ID
    const employeeId = await this.generateEmployeeId();

    // 5. Create employee record using transaction
    const result = await prisma.$transaction(async (tx) => {
      // Parse boolean values from Google Sheets (they come as Yes/No strings)
      const parseBoolean = (value) => {
        if (!value) return false;
        const v = value.toString().toLowerCase().trim();
        return v === 'yes' || v === 'true' || v === '1';
      };

      // Parse date strings from Google Sheets
      const parseDate = (value) => {
        if (!value) return null;
        try {
          const date = new Date(value);
          return isNaN(date.getTime()) ? null : date;
        } catch {
          return null;
        }
      };

      // Create employee - use candidateProfile.id (the actual found record's ID)
      const employee = await tx.employees.create({
        data: {
          employee_id: employeeId,
          candidate_profile_id: candidateProfile.id,
          interview_id: interviewId,
          email: candidateProfile.email,
          first_name:
            googleSheetsData?.name?.split(' ')[0] ||
            candidateProfile.name?.split(' ')[0] ||
            candidateProfile.email.split('@')[0],
          last_name:
            googleSheetsData?.name?.split(' ').slice(1).join(' ') ||
            candidateProfile.name?.split(' ').slice(1).join(' ') ||
            '',
          phone: candidateProfile.phone || googleSheetsData?.phone,
          nationality: googleSheetsData?.nationality,
          city: googleSheetsData?.city,

          // Extended Info from Google Sheets Form
          whatsapp_number: googleSheetsData?.whatsappNumber,
          current_residency: googleSheetsData?.currentResidency,
          marital_status: googleSheetsData?.maritalStatus,
          number_of_dependents: googleSheetsData?.numberOfDependents
            ? parseInt(googleSheetsData.numberOfDependents, 10) || null
            : null,
          total_experience: googleSheetsData?.totalExperience,
          education: googleSheetsData?.education,
          certifications: googleSheetsData?.certifications,
          current_salary: googleSheetsData?.currentSalary,
          expected_salary: googleSheetsData?.expectedSalary,
          notice_period: googleSheetsData?.noticePeriod,
          date_of_joining: parseDate(googleSheetsData?.dateOfJoining),

          // Work Preferences
          open_to_banking_insurance: parseBoolean(googleSheetsData?.openToBankingInsurance),
          open_to_multiple_technologies: parseBoolean(googleSheetsData?.openToMultipleTechnologies),

          // Saudi-specific (Iqama)
          iqama_expiry: parseDate(googleSheetsData?.iqamaExpiry),
          iqama_profession: googleSheetsData?.iqamaProfession,

          // Employment Info
          job_title: jobTitle,
          department: department,
          employment_type: employmentType,
          start_date: startDate ? new Date(startDate) : null,
          offered_salary: offeredSalary,
          status: 'pending',
          created_by: createdBy,
        },
      });

      // Create onboarding record with default checklist
      const onboarding = await tx.onboarding.create({
        data: {
          employee_id: employee.id,
          status: 'not_started',
          checklist: this.defaultChecklist,
        },
      });

      // Mark candidate as hired - use candidateProfile.id (the actual found record's ID)
      await tx.candidate_profiles.update({
        where: { id: candidateProfile.id },
        data: {
          is_hired: true,
          hired_at: new Date(),
        },
      });

      return { employee, onboarding };
    });

    return result;
  }

  /**
   * Get employee by ID with onboarding data
   */
  async getEmployeeById(employeeId) {
    return prisma.employees.findUnique({
      where: { id: employeeId },
      include: {
        onboarding: {
          include: {
            assignee: {
              select: { id: true, first_name: true, last_name: true, email: true },
            },
            buddy: {
              select: { id: true, first_name: true, last_name: true, email: true },
            },
          },
        },
        candidate_profile: true,
        creator: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
      },
    });
  }

  /**
   * Get all employees with pagination and filters
   */
  async getEmployees({ page = 1, limit = 20, status, department, search }) {
    const where = {};

    if (status) {
      where.status = status;
    }

    if (department) {
      where.department = department;
    }

    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employee_id: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [employees, total] = await prisma.$transaction([
      prisma.employees.findMany({
        where,
        include: {
          onboarding: {
            select: { id: true, status: true },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.employees.count({ where }),
    ]);

    return {
      employees,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update onboarding checklist item
   */
  async updateChecklistItem({ onboardingId, category, itemId, completed, userId }) {
    const onboarding = await prisma.onboarding.findUnique({
      where: { id: onboardingId },
    });

    if (!onboarding) {
      throw new Error('Onboarding record not found');
    }

    const checklist = onboarding.checklist || this.defaultChecklist;

    if (!checklist[category]) {
      throw new Error(`Invalid checklist category: ${category}`);
    }

    const itemIndex = checklist[category].findIndex((item) => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error(`Checklist item not found: ${itemId}`);
    }

    // Update the item
    checklist[category][itemIndex] = {
      ...checklist[category][itemIndex],
      completed,
      completedAt: completed ? new Date().toISOString() : null,
      completedBy: completed ? userId : null,
    };

    // Calculate overall progress
    const allItems = Object.values(checklist).flat();
    const completedItems = allItems.filter((item) => item.completed).length;
    const progress = Math.round((completedItems / allItems.length) * 100);

    // Determine new status
    let status = onboarding.status;
    if (progress === 0) {
      status = 'not_started';
    } else if (progress === 100) {
      status = 'completed';
    } else {
      status = 'in_progress';
    }

    // Update onboarding record
    const updated = await prisma.onboarding.update({
      where: { id: onboardingId },
      data: {
        checklist,
        status,
        started_at:
          status !== 'not_started' && !onboarding.started_at ? new Date() : onboarding.started_at,
        completed_at: status === 'completed' ? new Date() : null,
        updated_at: new Date(),
      },
      include: {
        employee: true,
      },
    });

    return { onboarding: updated, progress };
  }

  /**
   * Assign HR staff to onboarding
   */
  async assignOnboarding({ onboardingId, assignedTo, buddyId }) {
    const updateData = {
      updated_at: new Date(),
    };

    if (assignedTo !== undefined) {
      updateData.assigned_to = assignedTo;
    }

    if (buddyId !== undefined) {
      updateData.buddy_id = buddyId;
    }

    return prisma.onboarding.update({
      where: { id: onboardingId },
      data: updateData,
      include: {
        employee: true,
        assignee: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        buddy: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
      },
    });
  }

  /**
   * Update employee status
   */
  async updateEmployeeStatus(employeeId, status) {
    const validStatuses = ['pending', 'onboarding', 'active', 'inactive'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    return prisma.employees.update({
      where: { id: employeeId },
      data: {
        status,
        updated_at: new Date(),
      },
    });
  }

  /**
   * Get onboarding statistics
   */
  async getOnboardingStats() {
    const [
      totalEmployees,
      pendingOnboarding,
      inProgressOnboarding,
      completedOnboarding,
      recentHires,
    ] = await prisma.$transaction([
      prisma.employees.count(),
      prisma.onboarding.count({ where: { status: 'not_started' } }),
      prisma.onboarding.count({ where: { status: 'in_progress' } }),
      prisma.onboarding.count({ where: { status: 'completed' } }),
      prisma.employees.findMany({
        where: {
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        orderBy: { created_at: 'desc' },
        take: 5,
        select: {
          id: true,
          employee_id: true,
          first_name: true,
          last_name: true,
          job_title: true,
          department: true,
          created_at: true,
          onboarding: {
            select: { status: true },
          },
        },
      }),
    ]);

    return {
      totalEmployees,
      onboardingStatus: {
        notStarted: pendingOnboarding,
        inProgress: inProgressOnboarding,
        completed: completedOnboarding,
      },
      recentHires,
    };
  }

  /**
   * Send welcome email to new employee
   */
  async sendWelcomeEmail(employeeId) {
    const employee = await this.getEmployeeById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Send email using email service
    await emailService.sendOnboardingWelcomeEmail({
      to: employee.email,
      firstName: employee.first_name,
      lastName: employee.last_name,
      jobTitle: employee.job_title,
      department: employee.department,
      startDate: employee.start_date,
    });

    // Update onboarding record
    await prisma.onboarding.update({
      where: { employee_id: employeeId },
      data: {
        welcome_email_sent: true,
        welcome_email_sent_at: new Date(),
        updated_at: new Date(),
      },
    });

    return { success: true, message: 'Welcome email sent successfully' };
  }

  /**
   * Send document request email
   */
  async sendDocumentRequestEmail(employeeId) {
    const employee = await this.getEmployeeById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    await emailService.sendDocumentRequestEmail({
      to: employee.email,
      firstName: employee.first_name,
    });

    await prisma.onboarding.update({
      where: { employee_id: employeeId },
      data: {
        document_request_sent: true,
        document_request_sent_at: new Date(),
        updated_at: new Date(),
      },
    });

    return { success: true, message: 'Document request email sent successfully' };
  }

  /**
   * Send first day information email
   */
  async sendFirstDayInfoEmail(employeeId) {
    const employee = await this.getEmployeeById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    await emailService.sendFirstDayInfoEmail({
      to: employee.email,
      firstName: employee.first_name,
      startDate: employee.start_date,
      department: employee.department,
    });

    await prisma.onboarding.update({
      where: { employee_id: employeeId },
      data: {
        first_day_info_sent: true,
        first_day_info_sent_at: new Date(),
        updated_at: new Date(),
      },
    });

    return { success: true, message: 'First day info email sent successfully' };
  }

  /**
   * Calculate onboarding progress percentage
   */
  calculateProgress(checklist) {
    if (!checklist) return 0;

    const allItems = Object.values(checklist).flat();
    const completedItems = allItems.filter((item) => item.completed).length;

    return Math.round((completedItems / allItems.length) * 100);
  }

  /**
   * Get onboarding by employee ID
   */
  async getOnboardingByEmployeeId(employeeId) {
    const onboarding = await prisma.onboarding.findUnique({
      where: { employee_id: employeeId },
      include: {
        employee: true,
        assignee: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        buddy: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
      },
    });

    if (onboarding) {
      onboarding.progress = this.calculateProgress(onboarding.checklist);
    }

    return onboarding;
  }

  /**
   * Add notes to onboarding record
   */
  async addOnboardingNotes(onboardingId, notes) {
    return prisma.onboarding.update({
      where: { id: onboardingId },
      data: {
        notes,
        updated_at: new Date(),
      },
    });
  }

  /**
   * Update employee information
   */
  async updateEmployee(employeeId, updateData) {
    const allowedFields = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'nationality',
      'city',
      'job_title',
      'department',
      'employment_type',
      'start_date',
      'offered_salary',
      'salary_currency',
      'documents',
      // Google Sheets fields
      'whatsapp_number',
      'current_residency',
      'marital_status',
      'number_of_dependents',
      'total_experience',
      'education',
      'certifications',
      'current_salary',
      'expected_salary',
      'notice_period',
      'date_of_joining',
      'open_to_banking_insurance',
      'open_to_multiple_technologies',
      'iqama_expiry',
      'iqama_profession',
    ];

    const sanitizedData = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        sanitizedData[field] = updateData[field];
      }
    }

    // Convert date fields to proper Date objects for Prisma
    const dateFields = ['start_date', 'date_of_joining', 'iqama_expiry'];
    for (const field of dateFields) {
      if (sanitizedData[field] && typeof sanitizedData[field] === 'string') {
        sanitizedData[field] = new Date(sanitizedData[field]);
      }
    }

    sanitizedData.updated_at = new Date();

    return prisma.employees.update({
      where: { id: employeeId },
      data: sanitizedData,
    });
  }
}

// Export singleton instance
const onboardingService = new OnboardingService();
module.exports = onboardingService;
