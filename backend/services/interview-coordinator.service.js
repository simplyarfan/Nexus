/**
 * INTERVIEW COORDINATOR SERVICE (HR-02)
 * Automate scheduling, reminders, and question generation for interviews
 */

const { axios } = require('../utils/axios');
const { v4: uuidv4 } = require('uuid');
// const googleCalendarService = require('./googleCalendarService'); // Temporarily disabled - file doesn't exist

class InterviewCoordinatorService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    this.model = 'gpt-3.5-turbo';
  }

  /**
   * Generate interview questions based on JD and candidate resume
   */
  async generateInterviewQuestions(jobDescription, candidateData, interviewType = 'technical') {
    const prompt = `You are an expert HR interviewer. Generate tailored interview questions based on the job requirements and candidate background.

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

CANDIDATE BACKGROUND:
- Name: ${candidateData.name || 'Candidate'}
- Experience: ${candidateData.experience_years || 'Unknown'} years
- Skills: ${candidateData.skills?.join(', ') || 'Not specified'}
- Education: ${candidateData.education || 'Not specified'}
- Current Role: ${candidateData.current_role || 'Not specified'}

INTERVIEW TYPE: ${interviewType}

Generate a JSON response with:
{
  "opening_questions": [
    "Tell me about yourself and your background",
    "What interests you about this role?"
  ],
  "technical_questions": [
    "Specific technical questions based on JD requirements",
    "Problem-solving scenarios"
  ],
  "behavioral_questions": [
    "STAR method questions about past experiences",
    "Team collaboration scenarios"
  ],
  "role_specific_questions": [
    "Questions specific to the job requirements",
    "Industry-specific scenarios"
  ],
  "closing_questions": [
    "Do you have any questions about the role or company?",
    "What are your salary expectations?"
  ],
  "evaluation_criteria": [
    "Technical competency",
    "Communication skills",
    "Cultural fit"
  ]
}

Make questions specific to the candidate's background and job requirements.`;

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1200,
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const questions = JSON.parse(response.data.choices[0].message.content);
      return questions;
    } catch (error) {
      return this.getFallbackQuestions();
    }
  }

  /**
   * Create interview schedule with panel coordination
   * @param {Object} candidateData - Candidate information
   * @param {Object} interviewDetails - Interview details including userId for calendar integration
   */
  async createInterviewSchedule(candidateData, interviewDetails) {
    const interviewId = uuidv4();
    const schedule = {
      id: interviewId,
      candidate: {
        name: candidateData.name,
        email: candidateData.email,
        phone: candidateData.phone,
      },
      interview: {
        title: `Interview - ${candidateData.name} - ${interviewDetails.position}`,
        type: interviewDetails.type || 'technical',
        duration: interviewDetails.duration || 60,
        timezone: interviewDetails.timezone || 'UTC',
        scheduled_time: interviewDetails.scheduled_time,
        location: interviewDetails.location || 'Video Call',
        meeting_link: interviewDetails.meeting_link || '',
      },
      panel: interviewDetails.panel || [],
      status: 'scheduled',
      created_at: new Date().toISOString(),
    };

    // Try to create Google Calendar event if user has connected their calendar
    // Temporarily disabled - Google Calendar service not available
    /*
    if (interviewDetails.userId && interviewDetails.useGoogleCalendar) {
      try {
        const isConnected = await googleCalendarService.isUserConnected(interviewDetails.userId);

        if (isConnected) {
          const calendarResult = await googleCalendarService.createCalendarEventWithMeet(
            interviewDetails.userId,
            {
              candidateName: candidateData.name,
              candidateEmail: candidateData.email,
              position: interviewDetails.position,
              interviewType: interviewDetails.type,
              scheduledTime: interviewDetails.scheduled_time,
              duration: interviewDetails.duration,
              notes: interviewDetails.notes,
            },
          );

          // Update schedule with Google Calendar event details
          schedule.google_calendar = {
            eventId: calendarResult.eventId,
            htmlLink: calendarResult.htmlLink,
            meetLink: calendarResult.meetingLink,
          };

          // Update meeting link if Google Meet was created
          if (calendarResult.meetingLink) {
            schedule.interview.meeting_link = calendarResult.meetingLink;
          }
        }
      } catch (error) {

      }
    }
    */

    return schedule;
  }

  /**
   * Generate ICS calendar invite with RFC 5545 compliance
   */
  generateICSInvite(
    interviewData,
    organizerEmail = 'recruitment@company.com',
    organizerName = 'Recruitment Team',
  ) {
    const startDate = new Date(interviewData.scheduledTime);
    const duration = interviewData.duration || 60;
    const endDate = new Date(startDate.getTime() + duration * 60000);

    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    // RFC 5545 compliant text escaping
    const escapeText = (text) => {
      if (!text) {
        return '';
      }
      return text
        .replace(/\\/g, '\\\\') // Backslashes FIRST
        .replace(/;/g, '\\;') // Semicolons
        .replace(/,/g, '\\,') // Commas
        .replace(/\n/g, '\\n') // Newlines
        .replace(/\r/g, ''); // Remove carriage returns
    };

    // Line folding for long lines (max 75 chars per RFC 5545)
    const foldLine = (line) => {
      if (line.length <= 75) {
        return line;
      }
      const folded = [];
      for (let i = 0; i < line.length; i += 75) {
        folded.push(i === 0 ? line.substr(i, 75) : ' ' + line.substr(i, 74));
      }
      return folded.join('\r\n');
    };

    const title = `Interview - ${interviewData.candidateName} - ${interviewData.position}`;
    const description =
      'Interview Details:\\n\\n' +
      `Position: ${interviewData.position}\\n` +
      `Type: ${interviewData.interviewType || 'General'}\\n` +
      `Duration: ${duration} minutes\\n` +
      `Platform: ${interviewData.platform || 'Video Call'}\\n\\n` +
      (interviewData.meetingLink ? `Meeting Link: ${interviewData.meetingLink}\\n\\n` : '') +
      (interviewData.notes ? `Notes: ${interviewData.notes}\\n\\n` : '') +
      'If you need to reschedule, please contact the interviewer.';

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nexus AI Platform//Interview Coordinator v2.0//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST', // Changed to REQUEST for proper invites
      'BEGIN:VEVENT',
      `UID:${interviewData.id}@nexusai.com`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `DTSTAMP:${formatDate(new Date())}`,
      foldLine(`SUMMARY:${escapeText(title)}`),
      foldLine(`DESCRIPTION:${escapeText(description)}`),
      foldLine(
        `LOCATION:${escapeText(interviewData.meetingLink || interviewData.platform || 'Video Call')}`,
      ),
      `ORGANIZER;CN="${escapeText(organizerName)}":mailto:${organizerEmail}`,
      `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN="${escapeText(interviewData.candidateName)}":mailto:${interviewData.candidateEmail}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'TRANSP:OPAQUE', // Blocks time on calendar
      'PRIORITY:5', // Medium priority
      'CLASS:PUBLIC',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M', // 15 min reminder
      'ACTION:DISPLAY',
      'DESCRIPTION:Interview starts in 15 minutes',
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT1H', // 1 hour reminder
      'ACTION:EMAIL',
      'SUMMARY:Interview Reminder',
      `DESCRIPTION:Your interview with ${escapeText(interviewData.candidateName)} starts in 1 hour`,
      `ATTENDEE:mailto:${organizerEmail}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ];

    return icsLines.join('\r\n');
  }

  /**
   * Send interview invitation email
   */
  async sendInterviewInvitation(schedule, questions) {
    const emailContent = {
      to: schedule.candidate.email,
      subject: `Interview Invitation - ${schedule.interview.title}`,
      html: this.generateInvitationHTML(schedule, questions),
      attachments: [
        {
          filename: 'interview.ics',
          content: this.generateICSInvite(schedule),
          contentType: 'text/calendar',
        },
      ],
    };

    // This would integrate with your email service (Brevo/SendGrid)
    return emailContent;
  }

  /**
   * Generate HTML email template for interview invitation
   */
  generateInvitationHTML(schedule, questions) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .details { background: #fff; border: 1px solid #e9ecef; padding: 20px; border-radius: 8px; }
            .questions { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Interview Invitation</h2>
                <p>Dear ${schedule.candidate.name},</p>
                <p>We are pleased to invite you for an interview for the position you applied for.</p>
            </div>
            
            <div class="details">
                <h3>Interview Details</h3>
                <ul>
                    <li><strong>Date & Time:</strong> ${new Date(schedule.interview.scheduled_time).toLocaleString()}</li>
                    <li><strong>Duration:</strong> ${schedule.interview.duration} minutes</li>
                    <li><strong>Type:</strong> ${schedule.interview.type}</li>
                    <li><strong>Location:</strong> ${schedule.interview.location}</li>
                    ${schedule.interview.meeting_link ? `<li><strong>Meeting Link:</strong> <a href="${schedule.interview.meeting_link}">${schedule.interview.meeting_link}</a></li>` : ''}
                </ul>
                
                <h3>Interview Panel</h3>
                <ul>
                    ${schedule.panel.map((panelist) => `<li>${panelist.name} - ${panelist.role}</li>`).join('')}
                </ul>
            </div>
            
            <div class="questions">
                <h3>Interview Preparation</h3>
                <p>To help you prepare, here are some areas we'll be discussing:</p>
                <ul>
                    <li>Your technical background and experience</li>
                    <li>Problem-solving approach</li>
                    <li>Team collaboration and communication</li>
                    <li>Questions about the role and company</li>
                </ul>
            </div>
            
            <div class="footer">
                <p>Please confirm your attendance by replying to this email.</p>
                <p>If you need to reschedule, please contact us at least 24 hours in advance.</p>
                <p>We look forward to meeting you!</p>
                <br>
                <p>Best regards,<br>Recruitment Team</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  /**
   * Schedule interview reminders
   */
  async scheduleReminders(schedule) {
    const reminders = [
      {
        type: '24h_before',
        send_at: new Date(
          new Date(schedule.interview.scheduled_time).getTime() - 24 * 60 * 60 * 1000,
        ),
        message: 'Interview reminder: You have an interview scheduled for tomorrow',
      },
      {
        type: '2h_before',
        send_at: new Date(
          new Date(schedule.interview.scheduled_time).getTime() - 2 * 60 * 60 * 1000,
        ),
        message: 'Interview reminder: Your interview is in 2 hours',
      },
      {
        type: '15m_before',
        send_at: new Date(new Date(schedule.interview.scheduled_time).getTime() - 15 * 60 * 1000),
        message: 'Interview starting soon: Please join the meeting in 15 minutes',
      },
    ];

    return reminders;
  }

  /**
   * Check for scheduling conflicts
   * @param {string} proposedTime - Proposed interview time
   * @param {Array} panelEmails - Email addresses of panel members
   * @param {number} duration - Interview duration in minutes
   * @param {string} userId - User ID for Google Calendar access
   */
  async checkConflicts(proposedTime, panelEmails, duration = 60, userId = null) {
    const conflicts = [];

    // If user has Google Calendar connected, check for real conflicts
    // Temporarily disabled - Google Calendar service not available
    /*
    if (userId) {
      try {
        const isConnected = await googleCalendarService.isUserConnected(userId);
        if (isConnected) {
          // TODO: Implement actual conflict checking via Google Calendar API
          // This would require additional Calendar API methods for checking busy times

        }
      } catch (error) {

      }
    }
    */

    const conflictCheck = {
      has_conflicts: false,
      conflicts: conflicts,
      alternative_slots: this.generateAlternativeSlots(proposedTime, duration),
    };

    return conflictCheck;
  }

  /**
   * Generate alternative time slots
   */
  generateAlternativeSlots(originalTime, duration) {
    const slots = [];
    const baseTime = new Date(originalTime);

    for (let i = 1; i <= 3; i++) {
      const alternativeTime = new Date(baseTime.getTime() + i * 60 * 60 * 1000); // +1 hour each
      slots.push({
        start_time: alternativeTime.toISOString(),
        end_time: new Date(alternativeTime.getTime() + duration * 60 * 1000).toISOString(),
      });
    }

    return slots;
  }

  /**
   * Fallback questions if AI generation fails
   */
  getFallbackQuestions() {
    return {
      opening_questions: [
        'Tell me about yourself and your background',
        'What interests you about this role and our company?',
      ],
      technical_questions: [
        "Describe a challenging technical problem you've solved",
        'How do you approach learning new technologies?',
      ],
      behavioral_questions: [
        'Tell me about a time you worked in a team to solve a problem',
        'Describe a situation where you had to meet a tight deadline',
      ],
      role_specific_questions: [
        'What experience do you have with the technologies mentioned in the job description?',
        'How would you handle competing priorities in this role?',
      ],
      closing_questions: [
        'Do you have any questions about the role or company?',
        'What are your salary expectations?',
      ],
      evaluation_criteria: [
        'Technical competency',
        'Communication skills',
        'Problem-solving ability',
        'Cultural fit',
      ],
    };
  }

  /**
   * Main orchestration method
   */
  async coordinateInterview(candidateData, jobDescription, interviewDetails) {
    try {
      // 1. Generate interview questions
      const questions = await this.generateInterviewQuestions(
        jobDescription,
        candidateData,
        interviewDetails.type,
      );

      // 2. Create interview schedule
      const schedule = await this.createInterviewSchedule(candidateData, interviewDetails);

      // 3. Check for conflicts
      const conflictCheck = await this.checkConflicts(
        interviewDetails.scheduled_time,
        interviewDetails.panel?.map((p) => p.email) || [],
        interviewDetails.duration,
      );

      // 4. Generate calendar invite
      const icsInvite = this.generateICSInvite(schedule);

      // 5. Prepare email invitation
      const emailInvitation = await this.sendInterviewInvitation(schedule, questions);

      // 6. Schedule reminders
      const reminders = await this.scheduleReminders(schedule);

      return {
        success: true,
        schedule,
        questions,
        conflict_check: conflictCheck,
        ics_invite: icsInvite,
        email_invitation: emailInvitation,
        reminders,
        message: 'Interview coordination completed successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Interview coordination failed',
      };
    }
  }
}

module.exports = InterviewCoordinatorService;
