/**
 * EMAIL SERVICE - Microsoft Outlook Integration (Production Ready - Prisma)
 * Handles sending emails via Microsoft Graph API with OAuth
 * Updated for multi-stage interview workflow
 */

const axios = require('axios');
const prisma = require('../lib/prisma');

class OutlookEmailService {
  constructor() {
    this.graphApiUrl = 'https://graph.microsoft.com/v1.0';
  }

  /**
   * Get user's Outlook access token from database
   * Note: This requires outlook_* columns in User model
   * If these columns don't exist, this feature will not work
   */
  async getUserAccessToken(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          outlook_access_token: true,
          outlook_refresh_token: true,
          outlook_token_expires_at: true,
        },
      });

      if (!user || !user.outlook_access_token) {
        throw new Error('User has not connected their Outlook account');
      }

      // Check if token is expired
      const expiresAt = new Date(user.outlook_token_expires_at);
      const now = new Date();

      if (expiresAt <= now) {
        // Token expired - check if we have a refresh token
        if (!user.outlook_refresh_token) {
          throw new Error('Outlook token expired. Please reconnect your Outlook account.');
        }
        // Token expired, need to refresh
        return await this.refreshAccessToken(userId, user.outlook_refresh_token);
      }

      return user.outlook_access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      // If columns don't exist, provide helpful error
      if (error.message.includes('Unknown field')) {
        console.error(
          '❌ Outlook integration columns not found in User model. Please add: outlook_access_token, outlook_refresh_token, outlook_token_expires_at',
        );
        throw new Error(
          'Outlook integration not configured. Please contact system administrator.',
        );
      }
      throw error;
    }
  }

  /**
   * Refresh expired access token
   */
  async refreshAccessToken(userId, refreshToken) {
    // Check if OAuth credentials are configured
    if (!process.env.OUTLOOK_CLIENT_ID || !process.env.OUTLOOK_CLIENT_SECRET) {
      console.error('❌ Outlook OAuth credentials not configured');
      throw new Error('Outlook OAuth is not configured. Please reconnect your Outlook account.');
    }

    try {
      const response = await axios.post(
        'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        new URLSearchParams({
          client_id: process.env.OUTLOOK_CLIENT_ID,
          client_secret: process.env.OUTLOOK_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
          scope:
            'https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read https://graph.microsoft.com/OnlineMeetings.ReadWrite',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const { access_token, refresh_token, expires_in } = response.data;
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      // Update tokens in database
      await prisma.user.update({
        where: { id: userId },
        data: {
          outlook_access_token: access_token,
          outlook_refresh_token: refresh_token || refreshToken,
          outlook_token_expires_at: expiresAt,
        },
      });

      return access_token;
    } catch (error) {
      console.error('Error refreshing token:', error.response?.data || error.message);
      throw new Error('Failed to refresh access token. Please reconnect your Outlook account.');
    }
  }

  /**
   * Create a real Microsoft Teams meeting via Graph API
   * @param {string} userId - User ID
   * @param {Object} meetingData - Meeting details
   * @returns {Promise<Object>} - { joinUrl, meetingId }
   */
  async createTeamsMeeting(userId, meetingData) {
    try {
      const accessToken = await this.getUserAccessToken(userId);

      const {
        subject,
        startDateTime,
        endDateTime,
        participantEmails = [],
        allowMeetingChat = true,
        allowTeamworkReactions = true,
      } = meetingData;

      const meetingPayload = {
        startDateTime: startDateTime,
        endDateTime: endDateTime,
        subject: subject || 'Interview Meeting',
        allowMeetingChat: allowMeetingChat ? 'enabled' : 'disabled',
        allowTeamworkReactions: allowTeamworkReactions,
        allowAttendeeToEnableCamera: true,
        allowAttendeeToEnableMic: true,
      };

      console.log('🎥 Creating Teams meeting via Graph API...');

      const response = await axios.post(`${this.graphApiUrl}/me/onlineMeetings`, meetingPayload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const { joinWebUrl, id } = response.data;

      console.log('✅ Teams meeting created successfully:', joinWebUrl);

      return {
        joinUrl: joinWebUrl,
        meetingId: id,
        success: true,
      };
    } catch (error) {
      console.error('❌ Failed to create Teams meeting:', error.response?.data || error.message);
      throw new Error(
        `Failed to create Teams meeting: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  /**
   * Send availability request email (Stage 1)
   */
  async sendAvailabilityRequest(userId, recipientEmail, data) {
    const htmlBody = this.generateAvailabilityRequestHTML(data);

    const emailData = {
      to: [recipientEmail],
      cc: data.ccEmails || [],
      bcc: data.bccEmails || [],
      subject: data.customSubject || `Interview Opportunity - ${data.position}`,
      htmlBody: data.customContent ? this.wrapCustomContent(data.customContent) : htmlBody,
    };

    return await this.sendEmail(userId, emailData);
  }

  /**
   * Send interview confirmation email with calendar invite (Stage 2)
   */
  async sendInterviewConfirmation(
    userId,
    recipientEmail,
    data,
    icsContent,
    cvFileBuffer = null,
    cvFileName = null,
  ) {
    const htmlBody = this.generateInterviewConfirmationHTML(data);

    const attachments = [];

    // Add ICS calendar file
    if (icsContent) {
      const icsBase64 = Buffer.from(icsContent).toString('base64');
      attachments.push({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: 'interview.ics',
        contentType: 'text/calendar',
        contentBytes: icsBase64,
      });
    }

    // Add CV attachment if provided
    if (cvFileBuffer && cvFileName) {
      const cvBase64 = cvFileBuffer.toString('base64');
      const ext = cvFileName.split('.').pop().toLowerCase();
      const contentType =
        ext === 'pdf'
          ? 'application/pdf'
          : ext === 'doc'
            ? 'application/msword'
            : ext === 'docx'
              ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              : 'application/octet-stream';

      attachments.push({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: cvFileName,
        contentType: contentType,
        contentBytes: cvBase64,
      });
    }

    const emailData = {
      to: [recipientEmail],
      cc: data.ccEmails || [],
      bcc: data.bccEmails || [],
      subject: data.customSubject || `Interview Scheduled - ${data.position}`,
      htmlBody: data.customContent ? this.wrapCustomContent(data.customContent) : htmlBody,
      attachments: attachments,
    };

    return await this.sendEmail(userId, emailData);
  }

  /**
   * Wrap custom email content in basic HTML template
   */
  wrapCustomContent(content) {
    const formattedContent = content.replace(/\n/g, '<br>');
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
        </style>
    </head>
    <body>
        ${formattedContent}
    </body>
    </html>`;
  }

  /**
   * Generate HTML for availability request email (Stage 1)
   */
  generateAvailabilityRequestHTML(data) {
    // Keeping the same HTML template as before
    return `<!DOCTYPE html><html><head><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto}.container{background:#fff;padding:32px}.header{background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);color:#fff;padding:24px;border-radius:12px;margin-bottom:24px;text-align:center}.content-box{background:#f9fafb;border:1px solid #e5e7eb;padding:24px;border-radius:12px;margin:24px 0}.button{display:inline-block;background:#f97316;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0}.footer{margin-top:32px;padding-top:24px;border-top:2px solid #e5e7eb;color:#6b7280;font-size:14px}</style></head><body><div class="container"><div class="header"><h2>🎯 Interview Opportunity</h2><p style="margin:0;opacity:.95;font-size:18px">${data.position}</p></div><p style="font-size:16px;color:#374151">Dear <strong>${data.candidateName}</strong>,</p><p style="color:#6b7280">We are pleased to inform you that we would like to invite you for an interview for the <strong>${data.position}</strong> position at our company.</p><div class="content-box"><h3 style="margin:0 0 12px 0;color:#111827">📋 Next Steps</h3><ol style="color:#6b7280;margin:8px 0;padding-left:20px"><li style="margin-bottom:12px"><strong>Fill out the pre-interview form</strong><br>Please provide some additional information about yourself</li><li style="margin-bottom:12px"><strong>Share your availability</strong><br>Reply to this email with your available time slots for the interview</li></ol></div>${data.googleFormLink ? `<div style="text-align:center;margin:32px 0"><a href="${data.googleFormLink}" class="button">📝 Complete Pre-Interview Form</a><p style="color:#6b7280;font-size:14px;margin-top:12px">Form Link: ${data.googleFormLink}</p></div>` : ''}<div style="background:#dbeafe;border-left:4px solid #3b82f6;padding:16px;border-radius:8px;margin:24px 0"><h4 style="margin:0 0 8px 0;color:#1e40af">💡 What to Expect</h4><ul style="margin:8px 0;padding-left:20px;color:#1e3a8a"><li>The interview will last approximately 60 minutes</li><li>We'll discuss your experience and qualifications</li><li>You'll have the opportunity to learn more about the role</li><li>Feel free to ask any questions you may have</li></ul></div><div class="footer"><p><strong>Please reply to this email with your availability within the next 3 business days.</strong></p><p>We look forward to meeting you and learning more about your qualifications!</p><br><p style="margin:0">Best regards,<br><strong>HR Team</strong><br>Nexus AI Platform</p></div></div></body></html>`;
  }

  /**
   * Generate HTML for interview confirmation email (Stage 2)
   */
  generateInterviewConfirmationHTML(data) {
    const platformIcons = { teams: '👥', meet: '📹', zoom: '🎥' };
    const icon = platformIcons[data.platform?.toLowerCase()] || '📹';
    
    // Simplified version - keeping core structure
    return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2>✅ Interview Confirmed</h2><p>Dear <strong>${data.candidateName}</strong>,</p><p>Your interview for the <strong>${data.position}</strong> position has been scheduled.</p><div style="background:#f9fafb;padding:20px;border-radius:8px;margin:20px 0"><h3>📅 Interview Details</h3><p><strong>Date & Time:</strong> ${new Date(data.scheduledTime).toLocaleString()}</p><p><strong>Duration:</strong> ${data.duration} minutes</p><p><strong>Platform:</strong> ${icon} ${data.platform}</p>${data.meetingLink ? `<p><a href="${data.meetingLink}" style="color:#3b82f6">Join Meeting →</a></p>` : ''}</div><p>Best regards,<br><strong>HR Team</strong></p></body></html>`;
  }

  /**
   * Send email via Microsoft Graph API
   */
  async sendEmail(userId, emailData) {
    try {
      const accessToken = await this.getUserAccessToken(userId);

      const message = {
        message: {
          subject: emailData.subject,
          body: {
            contentType: 'HTML',
            content: emailData.htmlBody,
          },
          toRecipients: emailData.to.map((email) => ({ emailAddress: { address: email } })),
          ccRecipients: emailData.cc ? emailData.cc.map((email) => ({ emailAddress: { address: email } })) : [],
          bccRecipients: emailData.bcc ? emailData.bcc.map((email) => ({ emailAddress: { address: email } })) : [],
          attachments: emailData.attachments || [],
        },
        saveToSentItems: true,
      };

      const response = await axios.post(`${this.graphApiUrl}/me/sendMail`, message, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        messageId: response.headers['request-id'],
        message: 'Email sent successfully',
      };
    } catch (error) {
      console.error('❌ Failed to send email:', error.response?.data || error.message);
      throw new Error(`Failed to send email: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Send reschedule notification email
   */
  async sendRescheduleNotification(userId, recipientEmail, data, icsContent = null) {
    const htmlBody = this.generateRescheduleNotificationHTML(data);

    const emailData = {
      to: [recipientEmail],
      cc: data.ccEmails || [],
      bcc: data.bccEmails || [],
      subject: `Interview Rescheduled - ${data.position}`,
      htmlBody,
      attachments: [],
    };

    if (icsContent) {
      const icsBase64 = Buffer.from(icsContent).toString('base64');
      emailData.attachments.push({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: 'interview.ics',
        contentType: 'text/calendar',
        contentBytes: icsBase64,
      });
    }

    return await this.sendEmail(userId, emailData);
  }

  /**
   * Generate HTML for reschedule notification email
   */
  generateRescheduleNotificationHTML(data) {
    const oldDate = new Date(data.oldScheduledTime);
    const newDate = new Date(data.newScheduledTime);
    
    // Simplified version
    return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2>🔄 Interview Rescheduled</h2><p>Dear <strong>${data.candidateName}</strong>,</p><p>Your interview has been rescheduled.</p><div style="background:#fef3c7;padding:16px;border-left:4px solid #f59e0b;margin:20px 0"><p><strong>Original:</strong> <span style="text-decoration:line-through;color:#dc2626">${oldDate.toLocaleString()}</span></p><p><strong>New:</strong> <span style="color:#16a34a;font-weight:600">${newDate.toLocaleString()}</span></p></div><p>Please update your calendar accordingly.</p><p>Best regards,<br><strong>HR Team</strong></p></body></html>`;
  }
}

module.exports = OutlookEmailService;
