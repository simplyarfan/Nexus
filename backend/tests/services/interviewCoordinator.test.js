const InterviewCoordinatorService = require('../../services/interview-coordinator.service');

// Mock axios
jest.mock('../../utils/axios', () => ({
  axios: {
    post: jest.fn(),
  },
}));

describe('Interview Coordinator Service (HR-02)', () => {
  let service;
  let mockAxios;

  beforeEach(() => {
    service = new InterviewCoordinatorService();
    mockAxios = require('../../utils/axios').axios;
    jest.clearAllMocks();

    // Set test environment variables
    process.env.OPENAI_API_KEY = 'test-openai-key';
  });

  describe('Interview Question Generation', () => {
    it('should generate interview questions using OpenAI', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  opening_questions: ['Tell me about yourself'],
                  technical_questions: ['Explain your experience with React'],
                  behavioral_questions: ['Describe a challenging project'],
                  role_specific_questions: ['How would you handle this scenario?'],
                  closing_questions: ['Any questions for us?'],
                  evaluation_criteria: ['Technical skills', 'Communication'],
                }),
              },
            },
          ],
        },
      };

      mockAxios.post.mockResolvedValueOnce(mockResponse);

      const jobDescription = 'Senior React Developer needed';
      const candidateData = {
        name: 'John Doe',
        experience_years: 5,
        skills: ['React', 'JavaScript', 'Node.js'],
        education: 'BS Computer Science',
        current_role: 'Software Engineer',
      };

      const result = await service.generateInterviewQuestions(
        jobDescription,
        candidateData,
        'technical',
      );

      expect(result).toHaveProperty('opening_questions');
      expect(result).toHaveProperty('technical_questions');
      expect(result).toHaveProperty('behavioral_questions');
      expect(result).toHaveProperty('evaluation_criteria');
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          model: 'gpt-3.5-turbo',
          messages: expect.any(Array),
        }),
        expect.any(Object),
      );
    });

    it('should return fallback questions when API fails', async () => {
      mockAxios.post.mockRejectedValueOnce(new Error('API Error'));

      const result = await service.generateInterviewQuestions('JD', {});

      expect(result).toHaveProperty('opening_questions');
      expect(result).toHaveProperty('technical_questions');
      expect(result.opening_questions).toContain('Tell me about yourself and your background');
    });

    it('should handle different interview types', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify(service.getFallbackQuestions()),
              },
            },
          ],
        },
      });

      const result = await service.generateInterviewQuestions('JD', {}, 'behavioral');

      expect(mockAxios.post).toHaveBeenCalled();
      const callArgs = mockAxios.post.mock.calls[0][1];
      expect(callArgs.messages[0].content).toContain('INTERVIEW TYPE: behavioral');
    });
  });

  describe('Interview Schedule Creation', () => {
    it('should create interview schedule with all details', async () => {
      const candidateData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567890',
      };

      const interviewDetails = {
        position: 'Senior Developer',
        type: 'technical',
        duration: 60,
        scheduled_time: '2024-12-01T10:00:00Z',
        location: 'Video Call',
        meeting_link: 'https://meet.example.com/interview',
        panel: [{ name: 'John Interviewer', email: 'john@company.com', role: 'Tech Lead' }],
      };

      const result = await service.createInterviewSchedule(candidateData, interviewDetails);

      expect(result).toHaveProperty('id');
      expect(result.candidate.name).toBe('Jane Smith');
      expect(result.candidate.email).toBe('jane@example.com');
      expect(result.interview.type).toBe('technical');
      expect(result.interview.duration).toBe(60);
      expect(result.panel).toHaveLength(1);
      expect(result.status).toBe('scheduled');
      expect(result).toHaveProperty('created_at');
    });

    it('should use default values when optional fields are missing', async () => {
      const candidateData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      };

      const interviewDetails = {
        position: 'Developer',
        scheduled_time: '2024-12-01T10:00:00Z',
      };

      const result = await service.createInterviewSchedule(candidateData, interviewDetails);

      expect(result.interview.type).toBe('technical'); // Default
      expect(result.interview.duration).toBe(60); // Default
      expect(result.interview.timezone).toBe('UTC'); // Default
      expect(result.interview.location).toBe('Video Call'); // Default
      expect(result.panel).toEqual([]); // Default
    });
  });

  describe('ICS Calendar Invite Generation', () => {
    it('should generate RFC 5545 compliant ICS file', () => {
      const interviewData = {
        id: 'test-interview-123',
        candidateName: 'John Doe',
        candidateEmail: 'john@example.com',
        position: 'Senior Developer',
        interviewType: 'technical',
        scheduledTime: '2024-12-01T10:00:00Z',
        duration: 60,
        platform: 'Microsoft Teams',
        meetingLink: 'https://teams.microsoft.com/l/meetup/...',
        notes: 'Please review the coding challenge beforehand',
      };

      const ics = service.generateICSInvite(interviewData, 'hr@company.com', 'HR Team');

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('END:VCALENDAR');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('END:VEVENT');
      expect(ics).toContain('UID:test-interview-123@nexusai.com');
      expect(ics).toContain('SUMMARY:Interview - John Doe - Senior Developer');
      expect(ics).toContain('ATTENDEE');
      expect(ics).toContain('john@example.com');
      expect(ics).toContain('ORGANIZER');
      expect(ics).toContain('hr@company.com');
      expect(ics).toContain('METHOD:REQUEST');
      expect(ics).toContain('STATUS:CONFIRMED');
      expect(ics).toContain('BEGIN:VALARM'); // Reminders
    });

    it('should properly escape special characters in ICS', () => {
      const interviewData = {
        id: 'test-123',
        candidateName: 'John; Doe, Jr.',
        candidateEmail: 'john@example.com',
        position: 'Developer\\Senior',
        scheduledTime: '2024-12-01T10:00:00Z',
        duration: 30,
        notes: 'Line 1\nLine 2',
      };

      const ics = service.generateICSInvite(interviewData);

      expect(ics).toContain('\\;'); // Escaped semicolon
      expect(ics).toContain('\\,'); // Escaped comma
      expect(ics).toContain('\\\\'); // Escaped backslash
      expect(ics).toContain('\\n'); // Escaped newline
    });

    it('should calculate correct end time based on duration', () => {
      const interviewData = {
        id: 'test-123',
        candidateName: 'Test Candidate',
        candidateEmail: 'test@example.com',
        position: 'Position',
        scheduledTime: '2024-12-01T10:00:00Z',
        duration: 90,
      };

      const ics = service.generateICSInvite(interviewData);

      // Should contain both start and end times
      expect(ics).toContain('DTSTART:20241201T100000Z');
      expect(ics).toContain('DTEND:20241201T113000Z'); // 10:00 + 90 min = 11:30
    });
  });

  describe('Email Invitation', () => {
    it('should prepare email invitation with ICS attachment', async () => {
      const schedule = {
        id: 'interview-123',
        candidate: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        },
        interview: {
          title: 'Interview - John Doe - Developer',
          type: 'technical',
          duration: 60,
          scheduled_time: '2024-12-01T10:00:00Z',
          location: 'Video Call',
          meeting_link: 'https://meet.example.com/123',
        },
        panel: [{ name: 'Jane Interviewer', role: 'Tech Lead' }],
      };

      const questions = service.getFallbackQuestions();
      const result = await service.sendInterviewInvitation(schedule, questions);

      expect(result).toHaveProperty('to', 'john@example.com');
      expect(result).toHaveProperty('subject');
      expect(result.subject).toContain('Interview Invitation');
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('attachments');
      expect(result.attachments).toHaveLength(1);
      expect(result.attachments[0].filename).toBe('interview.ics');
      expect(result.attachments[0].contentType).toBe('text/calendar');
    });

    it('should generate HTML email with all interview details', () => {
      const schedule = {
        candidate: {
          name: 'Jane Smith',
        },
        interview: {
          scheduled_time: '2024-12-01T10:00:00Z',
          duration: 60,
          type: 'technical',
          location: 'Video Call',
          meeting_link: 'https://meet.example.com/123',
        },
        panel: [
          { name: 'John Tech', role: 'Tech Lead' },
          { name: 'Sarah HR', role: 'HR Manager' },
        ],
      };

      const html = service.generateInvitationHTML(schedule, {});

      expect(html).toContain('Jane Smith');
      expect(html).toContain('60 minutes');
      expect(html).toContain('technical');
      expect(html).toContain('https://meet.example.com/123');
      expect(html).toContain('John Tech');
      expect(html).toContain('Tech Lead');
      expect(html).toContain('Sarah HR');
    });
  });

  describe('Reminder Scheduling', () => {
    it('should schedule reminders at correct intervals', async () => {
      const schedule = {
        interview: {
          scheduled_time: '2024-12-01T10:00:00Z',
        },
      };

      const reminders = await service.scheduleReminders(schedule);

      expect(reminders).toHaveLength(3);
      expect(reminders[0].type).toBe('24h_before');
      expect(reminders[1].type).toBe('2h_before');
      expect(reminders[2].type).toBe('15m_before');

      // Verify timing
      const interviewTime = new Date('2024-12-01T10:00:00Z').getTime();
      const reminder24h = new Date(reminders[0].send_at).getTime();
      const reminder2h = new Date(reminders[1].send_at).getTime();
      const reminder15m = new Date(reminders[2].send_at).getTime();

      expect(interviewTime - reminder24h).toBe(24 * 60 * 60 * 1000); // 24 hours
      expect(interviewTime - reminder2h).toBe(2 * 60 * 60 * 1000); // 2 hours
      expect(interviewTime - reminder15m).toBe(15 * 60 * 1000); // 15 minutes
    });
  });

  describe('Conflict Checking', () => {
    it('should return no conflicts when none exist', async () => {
      const result = await service.checkConflicts(
        '2024-12-01T10:00:00Z',
        ['panel1@example.com', 'panel2@example.com'],
        60,
      );

      expect(result).toHaveProperty('has_conflicts', false);
      expect(result).toHaveProperty('conflicts');
      expect(result).toHaveProperty('alternative_slots');
      expect(result.conflicts).toEqual([]);
    });

    it('should generate alternative time slots', async () => {
      const result = await service.checkConflicts('2024-12-01T10:00:00Z', [], 60);

      expect(result.alternative_slots).toHaveLength(3);
      expect(result.alternative_slots[0]).toHaveProperty('start_time');
      expect(result.alternative_slots[0]).toHaveProperty('end_time');
    });
  });

  describe('Alternative Slot Generation', () => {
    it('should generate 3 alternative slots with 1-hour increments', () => {
      const originalTime = '2024-12-01T10:00:00Z';
      const duration = 60;

      const slots = service.generateAlternativeSlots(originalTime, duration);

      expect(slots).toHaveLength(3);

      // Check first slot (1 hour after original)
      const slot1Start = new Date(slots[0].start_time);
      const originalDate = new Date(originalTime);
      expect(slot1Start.getTime() - originalDate.getTime()).toBe(60 * 60 * 1000);

      // Check duration of each slot
      slots.forEach((slot) => {
        const start = new Date(slot.start_time);
        const end = new Date(slot.end_time);
        expect(end.getTime() - start.getTime()).toBe(duration * 60 * 1000);
      });
    });
  });

  describe('Fallback Questions', () => {
    it('should return structured fallback questions', () => {
      const questions = service.getFallbackQuestions();

      expect(questions).toHaveProperty('opening_questions');
      expect(questions).toHaveProperty('technical_questions');
      expect(questions).toHaveProperty('behavioral_questions');
      expect(questions).toHaveProperty('role_specific_questions');
      expect(questions).toHaveProperty('closing_questions');
      expect(questions).toHaveProperty('evaluation_criteria');

      expect(Array.isArray(questions.opening_questions)).toBe(true);
      expect(questions.opening_questions.length).toBeGreaterThan(0);
      expect(questions.evaluation_criteria).toContain('Technical competency');
    });
  });

  describe('Interview Coordination Orchestration', () => {
    it('should orchestrate complete interview coordination successfully', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify(service.getFallbackQuestions()),
              },
            },
          ],
        },
      });

      const candidateData = {
        name: 'Test Candidate',
        email: 'candidate@example.com',
        phone: '+1234567890',
      };

      const jobDescription = 'Senior Developer position';

      const interviewDetails = {
        position: 'Senior Developer',
        type: 'technical',
        duration: 60,
        scheduled_time: '2024-12-01T10:00:00Z',
        panel: [{ name: 'Panel Member', email: 'panel@company.com', role: 'Tech Lead' }],
      };

      const result = await service.coordinateInterview(
        candidateData,
        jobDescription,
        interviewDetails,
      );

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('schedule');
      expect(result).toHaveProperty('questions');
      expect(result).toHaveProperty('conflict_check');
      expect(result).toHaveProperty('ics_invite');
      expect(result).toHaveProperty('email_invitation');
      expect(result).toHaveProperty('reminders');
      expect(result.message).toBe('Interview coordination completed successfully');
    });

    it('should handle errors gracefully in coordination', async () => {
      mockAxios.post.mockRejectedValueOnce(new Error('API Error'));

      // Create service with invalid data to force error
      const result = await service.coordinateInterview({}, '', { scheduled_time: 'invalid-date' });

      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
      expect(result.message).toBe('Interview coordination failed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing candidate data gracefully', async () => {
      const result = await service.createInterviewSchedule(
        { name: '', email: '', phone: '' },
        { position: 'Developer', scheduled_time: '2024-12-01T10:00:00Z' },
      );

      expect(result.candidate.name).toBe('');
      expect(result).toHaveProperty('id');
    });

    it('should handle very long text in ICS generation', () => {
      const longText = 'A'.repeat(1000);
      const interviewData = {
        id: 'test',
        candidateName: longText,
        candidateEmail: 'test@example.com',
        position: 'Position',
        scheduledTime: '2024-12-01T10:00:00Z',
        duration: 60,
        notes: longText,
      };

      const ics = service.generateICSInvite(interviewData);

      // Should still generate valid ICS
      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('END:VCALENDAR');
    });

    it('should handle null/undefined values in interview data', () => {
      const interviewData = {
        id: 'test',
        candidateName: null,
        candidateEmail: 'test@example.com',
        position: undefined,
        scheduledTime: '2024-12-01T10:00:00Z',
        duration: 60,
      };

      const ics = service.generateICSInvite(interviewData);

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).not.toContain('null');
      expect(ics).not.toContain('undefined');
    });
  });
});
