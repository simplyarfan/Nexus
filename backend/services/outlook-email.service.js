/**
 * EMAIL SERVICE - Microsoft Outlook Integration (Production Ready - Prisma)
 * Handles sending emails via Microsoft Graph API with OAuth
 * Updated for multi-stage interview workflow
 */

const { graphAPI: axios } = require('../utils/axios');
const { prisma } = require('../lib/prisma');
const cryptoUtil = require('../utils/crypto');
const fs = require('fs');
const path = require('path');

class OutlookEmailService {
  constructor() {
    this.graphApiUrl = 'https://graph.microsoft.com/v1.0';
    this.logoBase64 = this.loadLogoBase64();
  }

  /**
   * Load company logo as base64 (cached)
   */
  loadLogoBase64() {
    try {
      const logoPath = path.join(__dirname, '../assets/SMLogo.png');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        return logoBuffer.toString('base64');
      }
      console.warn('Logo file not found at:', logoPath);
      return null;
    } catch (error) {
      console.warn('Logo file not found, using placeholder');
      return null;
    }
  }

  /**
   * Get user's Outlook access token from database
   * Note: This requires outlook_* columns in User model
   * If these columns don't exist, this feature will not work
   */
  async getUserAccessToken(userId) {
    try {
      const user = await prisma.users.findUnique({
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
        // Decrypt refresh token before using it
        const decryptedRefreshToken = cryptoUtil.decrypt(user.outlook_refresh_token);
        // Token expired, need to refresh
        return await this.refreshAccessToken(userId, decryptedRefreshToken);
      }

      // SECURITY: Decrypt token before returning (tokens are stored encrypted with AES-256)
      return cryptoUtil.decrypt(user.outlook_access_token);
    } catch (error) {
      if (error.message.includes('Unknown field')) {
        throw new Error('Outlook integration not configured. Please contact system administrator.');
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

      // SECURITY: Encrypt tokens before storing
      const encryptedAccessToken = cryptoUtil.encrypt(access_token);
      const encryptedRefreshToken = cryptoUtil.encrypt(refresh_token || refreshToken);

      // Update tokens in database
      await prisma.users.update({
        where: { id: userId },
        data: {
          outlook_access_token: encryptedAccessToken,
          outlook_refresh_token: encryptedRefreshToken,
          outlook_token_expires_at: expiresAt,
        },
      });

      return access_token;
    } catch (error) {
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

      const response = await axios.post(`${this.graphApiUrl}/me/onlineMeetings`, meetingPayload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const { joinWebUrl, id } = response.data;

      return {
        joinUrl: joinWebUrl,
        meetingId: id,
        success: true,
      };
    } catch (error) {
      throw new Error(
        `Failed to create Teams meeting: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  /**
   * Send availability request email (Stage 1)
   */
  async sendAvailabilityRequest(userId, recipientEmail, data) {
    // Get user's Outlook email for signature
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        outlook_email: true,
      },
    });

    // Add user's Outlook email to data for template
    const enrichedData = {
      ...data,
      senderEmail: user?.outlook_email || 'hr@securemaxtech.com',
    };

    const htmlBody = this.generateAvailabilityRequestHTML(enrichedData);

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
    // Get user's info for email signature
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        first_name: true,
        last_name: true,
        outlook_email: true,
        job_title: true,
      },
    });

    // Enrich data with sender information
    const enrichedData = {
      ...data,
      senderName:
        user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : 'HR Team',
      senderEmail: user?.outlook_email || 'hr@securemaxtech.com',
      senderDesignation: user?.job_title || 'Human Resources',
    };

    const htmlBody = this.generateInterviewConfirmationHTML(enrichedData);

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
    const senderName = data.senderName || 'HR Team';
    const senderDesignation = data.senderDesignation || 'Human Resources';
    const companyName = data.companyName || 'SecureMax';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Interview Opportunity - ${data.position}</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 20px 0;">
        <tr>
            <td align="center">
                <!-- Email Container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb;">
                    <!-- Header -->
                    <tr>
                        <td style="background: #f9fafb; border-bottom: 1px solid #e5e7eb; padding: 32px 32px 24px 32px; text-align: center;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 20px;">
                                        <img src="https://securemaxtech.com/wp-content/uploads/2024/04/logo.png" alt="${companyName} Logo" width="180" style="width: 180px; max-width: 180px; height: auto; display: block; border: 0; margin: 0 auto;" />
                                    </td>
                                </tr>
                            </table>
                            <h1 style="margin: 0 0 6px 0; font-size: 24px; font-weight: 600; color: #111827;">Interview Opportunity</h1>
                            <p style="margin: 0; font-size: 16px; color: #6b7280;">${data.position}</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 32px;">
                            <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151;">
                                Dear ${data.candidateName},
                            </p>

                            <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151;">
                                We are excited to inform you that your application for the <strong>${data.position}</strong> position has been shortlisted! We would like to schedule an interview with you to discuss your qualifications and learn more about your experience.
                            </p>

                            <!-- Content Box: Next Steps -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; margin: 24px 0;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">Next Steps</h3>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 0 0 12px 0; color: #6b7280; font-size: 16px;"><strong style="color: #111827;">1.</strong> Complete the pre-interview availability form using the button below</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 0 0 12px 0; color: #6b7280; font-size: 16px;"><strong style="color: #111827;">2.</strong> We will review your availability and confirm the interview time</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 0; color: #6b7280; font-size: 16px;"><strong style="color: #111827;">3.</strong> You will receive a calendar invitation with interview details</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- CTA Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${data.googleFormLink}" target="_blank" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">Complete Pre-Interview Form</a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Content Box: What to Expect -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; margin: 24px 0;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">What to Expect</h3>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 0 0 12px 0; color: #6b7280; font-size: 16px;"><strong style="color: #111827;">Duration:</strong> Approximately 45-60 minutes</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 0 0 12px 0; color: #6b7280; font-size: 16px;"><strong style="color: #111827;">Format:</strong> Virtual interview via video conference</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 0; color: #6b7280; font-size: 16px;"><strong style="color: #111827;">Topics:</strong> Technical skills, experience, and cultural fit</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 16px 0; padding: 16px; background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; color: #92400e; font-size: 14px; font-weight: 500;">
                                Please reply to this email with your availability within the next 3 business days.
                            </p>

                            <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px;">
                                We look forward to meeting you and learning more about your qualifications!
                            </p>

                            <!-- Signature -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Best regards,</p>
                                        <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">${senderName}</p>
                                        <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">The Recruitment Team | ${companyName}</p>

                                        <!-- Contact Information -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 12px 0 0 0; border-top: 1px solid #e5e7eb;">
                                                    <p style="margin: 0 0 6px 0; font-size: 13px; color: #6b7280;">
                                                        Office #10, Postal Box 3139, 8929 Prince Mansur Bin Abdulaziz st, Al Olaya | Riyadh: 12611 | Saudi Arabia
                                                    </p>
                                                    <p style="margin: 0 0 6px 0; font-size: 13px; color: #6b7280;">
                                                        Telephone: <a href="tel:+966112884870" style="color: #2563eb; text-decoration: none;">+966-11-2884870</a>
                                                    </p>
                                                    <p style="margin: 0 0 6px 0; font-size: 13px; color: #6b7280;">
                                                        Web: <a href="http://www.securemaxtech.com" target="_blank" style="color: #2563eb; text-decoration: none;">http://www.securemaxtech.com</a>
                                                    </p>
                                                    <p style="margin: 0; font-size: 13px; color: #6b7280;">
                                                        Email: <a href="mailto:${data.senderEmail}" style="color: #2563eb; text-decoration: none;">${data.senderEmail}</a>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
  }

  /**
   * Generate HTML for interview confirmation email (Stage 2)
   * Professional table-based layout for cross-client compatibility
   */
  generateInterviewConfirmationHTML(data) {
    const senderName = data.senderName;
    const senderDesignation = data.senderDesignation;
    const companyName = data.companyName || 'SecureMax';
    const senderEmail = data.senderEmail;

    // Format date and time
    const interviewDate = data.scheduledTime ? new Date(data.scheduledTime) : null;
    const formattedDate = interviewDate
      ? interviewDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'To be confirmed';
    const formattedTime = interviewDate
      ? interviewDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short',
        })
      : 'To be confirmed';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Interview Confirmed - ${data.position || 'Position'}</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 20px 0;">
        <tr>
            <td align="center">
                <!-- Email Container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb;">
                    <!-- Header -->
                    <tr>
                        <td style="background: #f9fafb; border-bottom: 1px solid #e5e7eb; padding: 32px 32px 24px 32px; text-align: center;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 20px;">
                                        <img src="https://securemaxtech.com/wp-content/uploads/2024/04/logo.png" alt="${companyName} Logo" width="180" style="width: 180px; max-width: 180px; height: auto; display: block; border: 0; margin: 0 auto;" />
                                    </td>
                                </tr>
                            </table>
                            <h1 style="margin: 0 0 6px 0; font-size: 24px; font-weight: 600; color: #111827;">Interview Confirmed</h1>
                            <p style="margin: 0; font-size: 16px; color: #6b7280;">${data.position || 'Position'}</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 32px;">
                            <!-- Greeting -->
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #111827;">Dear <strong>${data.candidateName || 'Candidate'}</strong>,</p>

                            <!-- Success Message -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                                <tr>
                                    <td style="background: #d1fae5; border-left: 4px solid #10b981; padding: 16px; border-radius: 6px;">
                                        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #065f46;">Your interview has been successfully confirmed!</p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
                                We are pleased to confirm your interview for the <strong>${data.position || 'Position'}</strong> role. Please find the details below:
                            </p>

                            <!-- Interview Details Box -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <!-- Date -->
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                        <tr>
                                                            <td style="width: 120px; font-size: 14px; color: #6b7280; font-weight: 500;">Date:</td>
                                                            <td style="font-size: 14px; color: #111827; font-weight: 600;">${formattedDate}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <!-- Time -->
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                        <tr>
                                                            <td style="width: 120px; font-size: 14px; color: #6b7280; font-weight: 500;">Time:</td>
                                                            <td style="font-size: 14px; color: #111827; font-weight: 600;">${formattedTime}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <!-- Duration -->
                                            ${
                                              data.duration
                                                ? `<tr>
                                                <td style="padding: 8px 0;">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                        <tr>
                                                            <td style="width: 120px; font-size: 14px; color: #6b7280; font-weight: 500;">Duration:</td>
                                                            <td style="font-size: 14px; color: #111827; font-weight: 600;">${data.duration} minutes</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>`
                                                : ''
                                            }
                                            <!-- Interview Type -->
                                            ${
                                              data.type
                                                ? `<tr>
                                                <td style="padding: 8px 0;">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                        <tr>
                                                            <td style="width: 120px; font-size: 14px; color: #6b7280; font-weight: 500;">Type:</td>
                                                            <td style="font-size: 14px; color: #111827; font-weight: 600;">${data.type}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>`
                                                : ''
                                            }
                                            <!-- Location/Meeting Link -->
                                            ${
                                              data.meetingLink
                                                ? `<tr>
                                                <td style="padding: 8px 0;">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                        <tr>
                                                            <td style="width: 120px; font-size: 14px; color: #6b7280; font-weight: 500; vertical-align: top;">Meeting Link:</td>
                                                            <td style="font-size: 14px; color: #2563eb;"><a href="${data.meetingLink}" style="color: #2563eb; text-decoration: none; word-break: break-all;">${data.meetingLink}</a></td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>`
                                                : ''
                                            }
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Call to Action Button -->
                            ${
                              data.meetingLink
                                ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                                <tr>
                                    <td align="center">
                                        <a href="${data.meetingLink}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">Join Interview</a>
                                    </td>
                                </tr>
                            </table>`
                                : ''
                            }

                            <!-- Additional Instructions -->
                            <p style="margin: 0 0 16px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
                                Please ensure you:
                            </p>
                            <ul style="margin: 0 0 24px 0; padding-left: 24px; font-size: 15px; color: #4b5563; line-height: 1.8;">
                                <li>Test your audio and video setup before the interview</li>
                                <li>Find a quiet location with good internet connectivity</li>
                                <li>Have a copy of your resume available for reference</li>
                                <li>Prepare any questions you may have about the role or company</li>
                            </ul>

                            <p style="margin: 0 0 8px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
                                If you need to reschedule or have any questions, please don't hesitate to reach out to us.
                            </p>

                            <p style="margin: 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
                                We look forward to speaking with you!
                            </p>
                        </td>
                    </tr>

                    <!-- Footer with Signature -->
                    <tr>
                        <td style="padding: 32px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
                            <!-- Signature -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Best regards,</p>
                                        <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">${senderName}</p>
                                        <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">The Recruitment Team | ${companyName}</p>

                                        <!-- Contact Information -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 12px 0 0 0; border-top: 1px solid #e5e7eb;">
                                                    <p style="margin: 0 0 6px 0; font-size: 13px; color: #6b7280;">
                                                        Office #10, Postal Box 3139, 8929 Prince Mansur Bin Abdulaziz st, Al Olaya | Riyadh: 12611 | Saudi Arabia
                                                    </p>
                                                    <p style="margin: 0 0 6px 0; font-size: 13px; color: #6b7280;">
                                                        Telephone: <a href="tel:+966112884870" style="color: #2563eb; text-decoration: none;">+966-11-2884870</a>
                                                    </p>
                                                    <p style="margin: 0 0 6px 0; font-size: 13px; color: #6b7280;">
                                                        Web: <a href="http://www.securemaxtech.com" target="_blank" style="color: #2563eb; text-decoration: none;">http://www.securemaxtech.com</a>
                                                    </p>
                                                    <p style="margin: 0; font-size: 13px; color: #6b7280;">
                                                        Email: <a href="mailto:${senderEmail}" style="color: #2563eb; text-decoration: none;">${senderEmail}</a>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
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
          ccRecipients: emailData.cc
            ? emailData.cc.map((email) => ({ emailAddress: { address: email } }))
            : [],
          bccRecipients: emailData.bcc
            ? emailData.bcc.map((email) => ({ emailAddress: { address: email } }))
            : [],
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
      throw new Error(
        `Failed to send email: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  /**
   * Send reschedule notification email
   */
  async sendRescheduleNotification(userId, recipientEmail, data, icsContent = null) {
    // Get user's info for email signature
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        first_name: true,
        last_name: true,
        outlook_email: true,
        job_title: true,
      },
    });

    // Enrich data with sender information
    const enrichedData = {
      ...data,
      senderName:
        user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : 'HR Team',
      senderEmail: user?.outlook_email || 'hr@securemaxtech.com',
      senderDesignation: user?.job_title || 'Human Resources',
    };

    const htmlBody = this.generateRescheduleNotificationHTML(enrichedData);

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
   * Professional table-based layout matching confirmation email style
   */
  generateRescheduleNotificationHTML(data) {
    const senderName = data.senderName;
    const senderDesignation = data.senderDesignation;
    const companyName = data.companyName || 'SecureMax';
    const senderEmail = data.senderEmail;

    // Format old and new dates
    const oldDate = new Date(data.oldScheduledTime);
    const newDate = new Date(data.newScheduledTime);

    const oldFormattedDate = oldDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const oldFormattedTime = oldDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    const newFormattedDate = newDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const newFormattedTime = newDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Interview Rescheduled - ${data.position || 'Position'}</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 20px 0;">
        <tr>
            <td align="center">
                <!-- Email Container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb;">
                    <!-- Header -->
                    <tr>
                        <td style="background: #f9fafb; border-bottom: 1px solid #e5e7eb; padding: 32px 32px 24px 32px; text-align: center;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 20px;">
                                        <img src="https://securemaxtech.com/wp-content/uploads/2024/04/logo.png" alt="${companyName} Logo" width="180" style="width: 180px; max-width: 180px; height: auto; display: block; border: 0; margin: 0 auto;" />
                                    </td>
                                </tr>
                            </table>
                            <h1 style="margin: 0 0 6px 0; font-size: 24px; font-weight: 600; color: #111827;">Interview Rescheduled</h1>
                            <p style="margin: 0; font-size: 16px; color: #6b7280;">${data.position || 'Position'}</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 32px;">
                            <!-- Greeting -->
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #111827;">Dear <strong>${data.candidateName || 'Candidate'}</strong>,</p>

                            <!-- Reschedule Notice -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                                <tr>
                                    <td style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px;">
                                        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #92400e;">Your interview has been rescheduled</p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
                                We need to reschedule your interview for the <strong>${data.position || 'Position'}</strong> role. We apologize for any inconvenience this may cause.
                            </p>

                            <!-- Previous Schedule (Strikethrough) -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px;">Previous Schedule</p>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 6px 0;">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                        <tr>
                                                            <td style="width: 120px; font-size: 14px; color: #991b1b; font-weight: 500;">Date:</td>
                                                            <td style="font-size: 14px; color: #991b1b; text-decoration: line-through;">${oldFormattedDate}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0;">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                        <tr>
                                                            <td style="width: 120px; font-size: 14px; color: #991b1b; font-weight: 500;">Time:</td>
                                                            <td style="font-size: 14px; color: #991b1b; text-decoration: line-through;">${oldFormattedTime}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- New Schedule (Highlighted) -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px; background: #d1fae5; border: 2px solid #10b981; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #065f46; text-transform: uppercase; letter-spacing: 0.5px;">New Schedule</p>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <!-- Date -->
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                        <tr>
                                                            <td style="width: 120px; font-size: 14px; color: #065f46; font-weight: 500;">Date:</td>
                                                            <td style="font-size: 14px; color: #065f46; font-weight: 600;">${newFormattedDate}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <!-- Time -->
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                        <tr>
                                                            <td style="width: 120px; font-size: 14px; color: #065f46; font-weight: 500;">Time:</td>
                                                            <td style="font-size: 14px; color: #065f46; font-weight: 600;">${newFormattedTime}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <!-- Duration -->
                                            ${
                                              data.duration
                                                ? `<tr>
                                                <td style="padding: 8px 0;">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                        <tr>
                                                            <td style="width: 120px; font-size: 14px; color: #065f46; font-weight: 500;">Duration:</td>
                                                            <td style="font-size: 14px; color: #065f46; font-weight: 600;">${data.duration} minutes</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>`
                                                : ''
                                            }
                                            <!-- Interview Type -->
                                            ${
                                              data.interviewType
                                                ? `<tr>
                                                <td style="padding: 8px 0;">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                        <tr>
                                                            <td style="width: 120px; font-size: 14px; color: #065f46; font-weight: 500;">Type:</td>
                                                            <td style="font-size: 14px; color: #065f46; font-weight: 600;">${data.interviewType}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>`
                                                : ''
                                            }
                                            <!-- Meeting Link -->
                                            ${
                                              data.meetingLink
                                                ? `<tr>
                                                <td style="padding: 8px 0;">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                        <tr>
                                                            <td style="width: 120px; font-size: 14px; color: #065f46; font-weight: 500; vertical-align: top;">Meeting Link:</td>
                                                            <td style="font-size: 14px; color: #2563eb;"><a href="${data.meetingLink}" style="color: #2563eb; text-decoration: none; word-break: break-all;">${data.meetingLink}</a></td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>`
                                                : ''
                                            }
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Call to Action Button -->
                            ${
                              data.meetingLink
                                ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                                <tr>
                                    <td align="center">
                                        <a href="${data.meetingLink}" style="display: inline-block; background: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">Join Interview</a>
                                    </td>
                                </tr>
                            </table>`
                                : ''
                            }

                            ${
                              data.notes
                                ? `<p style="margin: 0 0 16px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
                                <strong>Additional Notes:</strong><br>${data.notes}
                            </p>`
                                : ''
                            }

                            <p style="margin: 0 0 16px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
                                Please update your calendar with the new time. A calendar invite has been attached to this email.
                            </p>

                            <p style="margin: 0 0 8px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
                                If you have any questions or if the new time doesn't work for you, please don't hesitate to reach out.
                            </p>

                            <p style="margin: 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
                                We look forward to speaking with you!
                            </p>
                        </td>
                    </tr>

                    <!-- Footer with Signature -->
                    <tr>
                        <td style="padding: 32px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
                            <!-- Signature -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Best regards,</p>
                                        <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">${senderName}</p>
                                        <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">The Recruitment Team | ${companyName}</p>

                                        <!-- Contact Information -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 12px 0 0 0; border-top: 1px solid #e5e7eb;">
                                                    <p style="margin: 0 0 6px 0; font-size: 13px; color: #6b7280;">
                                                        Office #10, Postal Box 3139, 8929 Prince Mansur Bin Abdulaziz st, Al Olaya | Riyadh: 12611 | Saudi Arabia
                                                    </p>
                                                    <p style="margin: 0 0 6px 0; font-size: 13px; color: #6b7280;">
                                                        Telephone: <a href="tel:+966112884870" style="color: #2563eb; text-decoration: none;">+966-11-2884870</a>
                                                    </p>
                                                    <p style="margin: 0; font-size: 13px; color: #6b7280;">
                                                        Web: <a href="https://securemaxtech.com" style="color: #2563eb; text-decoration: none;">www.securemaxtech.com</a>
                                                    </p>
                                                    <p style="margin: 0 0 6px 0; font-size: 13px; color: #6b7280;">
                                                        Email: <a href="mailto:${senderEmail}" style="color: #2563eb; text-decoration: none;">${senderEmail}</a>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
  }

  /**
   * Update an existing Microsoft Teams meeting
   * @param {string} userId - User ID
   * @param {string} teamsMeetingId - Teams meeting ID to update
   * @param {object} updateData - Updated meeting data
   * @returns {object} Updated meeting details
   */
  async updateTeamsMeeting(userId, teamsMeetingId, updateData) {
    try {
      const accessToken = await this.getUserAccessToken(userId);

      // Prepare the update payload
      const payload = {
        subject: updateData.subject,
        start: {
          dateTime: new Date(updateData.scheduledTime).toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: new Date(
            new Date(updateData.scheduledTime).getTime() + (updateData.duration || 60) * 60000,
          ).toISOString(),
          timeZone: 'UTC',
        },
        body: {
          contentType: 'HTML',
          content: updateData.notes || 'Interview has been rescheduled.',
        },
      };

      // Update the calendar event via Microsoft Graph API
      const response = await axios.patch(
        `https://graph.microsoft.com/v1.0/me/events/${teamsMeetingId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        success: true,
        meetingId: response.data.id,
        meetingLink: response.data.onlineMeeting?.joinUrl || response.data.webLink,
      };
    } catch (error) {
      throw new Error(
        `Failed to update Teams meeting: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  /**
   * Cancel a Microsoft Teams meeting
   * @param {string} userId - User ID
   * @param {string} teamsMeetingId - Teams meeting ID to cancel
   */
  async cancelTeamsMeeting(userId, teamsMeetingId) {
    try {
      const accessToken = await this.getUserAccessToken(userId);

      // Delete the calendar event (which also cancels the Teams meeting)
      await axios.delete(`https://graph.microsoft.com/v1.0/me/events/${teamsMeetingId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return { success: true };
    } catch (error) {
      throw new Error(
        `Failed to cancel Teams meeting: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }
}

module.exports = OutlookEmailService;
