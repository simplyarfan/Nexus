/**
 * Simple Email Service for Authentication Emails
 * Uses SMTP for 2FA codes and password reset links
 * Fallback to console logging if SMTP not configured
 */

let nodemailer;
try {
  nodemailer = require('nodemailer');

  if (
    nodemailer &&
    nodemailer.default &&
    typeof nodemailer.default.createTransport === 'function'
  ) {
    nodemailer = nodemailer.default;
  }
} catch (e) {
  nodemailer = null;
}

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializationAttempted = false;
    this.from = process.env.EMAIL_USER;
  }

  /**
   * Initialize email transporter - LAZY: only when first email is sent
   * This ensures environment variables are loaded in serverless environments
   */
  initializeTransporter() {
    // Prevent multiple initialization attempts
    if (this.initializationAttempted) {
      return this.transporter !== null;
    }

    this.initializationAttempted = true;

    if (!nodemailer) {
      return false;
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return false;
    }

    try {
      // Check if createTransport exists (note: it's createTransport, not createTransporter)
      if (typeof nodemailer.createTransport !== 'function') {
        return false;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        // Fail fast - no retries
        pool: false,
        maxConnections: 1,
      });

      return true;
    } catch (error) {
      this.transporter = null;
      return false;
    }
  }

  /**
   * Send 2FA verification code
   */
  async send2FACode(email, code, firstName) {
    const subject = 'Your Verification Code - Nexus';
    const html = this.generate2FATemplate(code, firstName);

    return await this.sendEmail(email, subject, html);
  }

  /**
   * Send password reset link
   */
  async sendPasswordReset(email, token, firstName) {
    const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
    const subject = 'Password Reset Request - Nexus';
    const html = this.generatePasswordResetTemplate(resetLink, firstName);

    return await this.sendEmail(email, subject, html);
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email, firstName) {
    const subject = 'Welcome to Nexus';
    const html = this.generateWelcomeTemplate(firstName);

    return await this.sendEmail(email, subject, html);
  }

  /**
   * Send password reset confirmation email
   */
  async sendPasswordResetConfirmation(email, firstName) {
    const subject = 'Password Reset Successful - Nexus';
    const html = this.generatePasswordResetConfirmationTemplate(firstName);

    return await this.sendEmail(email, subject, html);
  }

  /**
   * Core email sending function - NO FALLBACKS, FAIL PROPERLY
   */
  async sendEmail(to, subject, html) {
    // Lazy initialization: try to initialize transporter if not already done
    if (!this.transporter) {
      const initialized = this.initializeTransporter();
      if (!initialized || !this.transporter) {
        const error = new Error('Email service not initialized - missing credentials');

        throw error;
      }
    }

    const info = await this.transporter.sendMail({
      from: `"Nexus" <${this.from}>`,
      to,
      subject,
      html,
    });

    return { success: true, messageId: info.messageId };
  }

  /**
   * Generate 2FA email template
   */
  generate2FATemplate(code, firstName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
            <tr>
                <td style="padding: 40px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: #f9fafb; border-bottom: 1px solid #e5e7eb; padding: 24px 32px;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td>
                                            <img src="https://securemaxtech.com/wp-content/uploads/2024/04/logo.png" alt="Nexus" style="height: 40px; width: auto;">
                                        </td>
                                        <td style="text-align: right; color: #6b7280; font-size: 14px;">
                                            Nexus
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 32px;">
                                <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; color: #111827;">Verification Code</h1>
                                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">Hi ${firstName || 'there'},</p>
                                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #374151;">You requested a verification code to sign in to your Nexus account.</p>

                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 24px 0;">
                                    <tr>
                                        <td style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; text-align: center;">
                                            <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2563eb; font-family: 'Courier New', monospace;">${code}</div>
                                            <p style="margin: 12px 0 0 0; font-size: 13px; color: #6b7280;">Valid for 10 minutes</p>
                                        </td>
                                    </tr>
                                </table>

                                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #374151;">If you didn't request this code, please ignore this email or contact support if you're concerned about your account security.</p>

                                <p style="margin: 0; font-size: 14px; color: #6b7280;">Best regards,<br><strong style="color: #374151;">Nexus AI Team</strong></p>
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
   * Generate password reset email template
   */
  generatePasswordResetTemplate(resetLink, firstName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
            <tr>
                <td style="padding: 40px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: #f9fafb; border-bottom: 1px solid #e5e7eb; padding: 24px 32px;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td>
                                            <img src="https://securemaxtech.com/wp-content/uploads/2024/04/logo.png" alt="Nexus" style="height: 40px; width: auto;">
                                        </td>
                                        <td style="text-align: right; color: #6b7280; font-size: 14px;">
                                            Nexus
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 32px;">
                                <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; color: #111827;">Password Reset</h1>
                                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">Hi ${firstName || 'there'},</p>
                                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">We received a request to reset your password for your Nexus account.</p>
                                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #374151;">Click the button below to reset your password:</p>

                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px 0;">
                                    <tr>
                                        <td style="border-radius: 6px; background-color: #2563eb;">
                                            <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none;">Reset Password</a>
                                        </td>
                                    </tr>
                                </table>

                                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">This link will expire in 1 hour for security reasons.</p>
                                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #374151;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>

                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 24px 0; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                                    <tr>
                                        <td style="padding-top: 24px;">
                                            <p style="margin: 0; font-size: 13px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
                                            <p style="margin: 8px 0 0 0; font-size: 13px; color: #2563eb; word-break: break-all;">${resetLink}</p>
                                        </td>
                                    </tr>
                                </table>

                                <p style="margin: 0; font-size: 14px; color: #6b7280;">Best regards,<br><strong style="color: #374151;">Nexus AI Team</strong></p>
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
   * Generate welcome email template
   */
  generateWelcomeTemplate(firstName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
            <tr>
                <td style="padding: 40px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: #f9fafb; border-bottom: 1px solid #e5e7eb; padding: 24px 32px;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td>
                                            <img src="https://securemaxtech.com/wp-content/uploads/2024/04/logo.png" alt="Nexus" style="height: 40px; width: auto;">
                                        </td>
                                        <td style="text-align: right; color: #6b7280; font-size: 14px;">
                                            Nexus
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 32px;">
                                <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; color: #111827;">Welcome to Nexus</h1>
                                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">Hi ${firstName},</p>
                                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">Welcome to <strong>Nexus</strong>! Your account has been successfully created.</p>
                                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">You now have access to our powerful AI-driven tools including CV Intelligence and Interview Coordinator.</p>
                                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #374151;">Get started by logging in and exploring the platform.</p>

                                <p style="margin: 0; font-size: 14px; color: #6b7280;">Best regards,<br><strong style="color: #374151;">Nexus AI Team</strong></p>
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
   * Send onboarding welcome email to new employee
   */
  async sendOnboardingWelcomeEmail({ to, firstName, lastName, jobTitle, department, startDate }) {
    const subject = 'Welcome to the Team! - Nexus';
    const html = this.generateOnboardingWelcomeTemplate({
      firstName,
      lastName,
      jobTitle,
      department,
      startDate,
    });
    return await this.sendEmail(to, subject, html);
  }

  /**
   * Send document request email
   */
  async sendDocumentRequestEmail({ to, firstName }) {
    const subject = 'Document Submission Request - Nexus';
    const html = this.generateDocumentRequestTemplate(firstName);
    return await this.sendEmail(to, subject, html);
  }

  /**
   * Send first day information email
   */
  async sendFirstDayInfoEmail({ to, firstName, startDate, department }) {
    const subject = 'Your First Day Information - Nexus';
    const html = this.generateFirstDayInfoTemplate({ firstName, startDate, department });
    return await this.sendEmail(to, subject, html);
  }

  /**
   * Send HR notification about new employee
   */
  async sendHRNotificationEmail({ to, employeeName, jobTitle, department, startDate }) {
    const subject = `New Employee Alert: ${employeeName} - ${jobTitle}`;
    const html = this.generateHRNotificationTemplate({
      employeeName,
      jobTitle,
      department,
      startDate,
    });
    return await this.sendEmail(to, subject, html);
  }

  /**
   * Generate password reset confirmation email template
   */
  generatePasswordResetConfirmationTemplate(firstName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
            <tr>
                <td style="padding: 40px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: #f9fafb; border-bottom: 1px solid #e5e7eb; padding: 24px 32px;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td>
                                            <img src="https://securemaxtech.com/wp-content/uploads/2024/04/logo.png" alt="Nexus" style="height: 40px; width: auto;">
                                        </td>
                                        <td style="text-align: right; color: #6b7280; font-size: 14px;">
                                            Nexus
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 32px;">
                                <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; color: #111827;">Password Reset Successful</h1>
                                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">Hi ${firstName},</p>
                                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #374151;">This is a confirmation that your password for your Nexus account has been successfully reset.</p>

                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 24px 0;">
                                    <tr>
                                        <td style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 16px;">
                                            <p style="margin: 0; font-size: 15px; font-weight: 600; color: #059669;">Your account is now secure with your new password</p>
                                        </td>
                                    </tr>
                                </table>

                                <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #111827;">What happened?</p>
                                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">Your password was changed on ${new Date().toLocaleString(
                                  'en-US',
                                  {
                                    dateStyle: 'full',
                                    timeStyle: 'short',
                                  },
                                )}. For your security, all active sessions have been logged out.</p>

                                <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #111827;">Was this you?</p>
                                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">If you made this change, no further action is needed. You can now log in with your new password.</p>

                                <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #111827;">Didn't make this change?</p>
                                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #dc2626;">If you did NOT request this password reset, please contact our support team immediately at support@securemaxtech.com. Your account may have been compromised.</p>

                                <p style="margin: 0; font-size: 14px; color: #6b7280;">Best regards,<br><strong style="color: #374151;">Nexus AI Team</strong></p>
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
   * Generate onboarding welcome email template
   */
  generateOnboardingWelcomeTemplate({ firstName, lastName, jobTitle, department, startDate }) {
    const formattedDate = startDate
      ? new Date(startDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'To be confirmed';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
            <tr>
                <td style="padding: 40px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
                                <img src="https://securemaxtech.com/wp-content/uploads/2024/04/logo.png" alt="Nexus" style="height: 50px; width: auto; margin-bottom: 16px;">
                                <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">Welcome to the Team!</h1>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 32px;">
                                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #374151;">Dear ${firstName} ${lastName},</p>
                                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #374151;">We are thrilled to welcome you to our team! Congratulations on your new position as <strong>${jobTitle}</strong> in the <strong>${department}</strong> department.</p>

                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 24px 0; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #166534;">Your Start Date</p>
                                            <p style="margin: 0; font-size: 18px; font-weight: 700; color: #15803d;">${formattedDate}</p>
                                        </td>
                                    </tr>
                                </table>

                                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #374151;"><strong>What happens next?</strong></p>
                                <ul style="margin: 0 0 24px 0; padding-left: 20px; font-size: 15px; line-height: 1.8; color: #374151;">
                                    <li>You'll receive a document request email shortly</li>
                                    <li>Our HR team will guide you through the onboarding process</li>
                                    <li>We'll send you first-day information closer to your start date</li>
                                    <li>Your workstation and access credentials will be prepared</li>
                                </ul>

                                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #374151;">If you have any questions before your start date, please don't hesitate to reach out to our HR team.</p>

                                <p style="margin: 0; font-size: 14px; color: #6b7280;">Welcome aboard!<br><strong style="color: #374151;">The Nexus Team</strong></p>
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
   * Generate document request email template
   */
  generateDocumentRequestTemplate(firstName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
            <tr>
                <td style="padding: 40px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: #f9fafb; border-bottom: 1px solid #e5e7eb; padding: 24px 32px;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td>
                                            <img src="https://securemaxtech.com/wp-content/uploads/2024/04/logo.png" alt="Nexus" style="height: 40px; width: auto;">
                                        </td>
                                        <td style="text-align: right; color: #6b7280; font-size: 14px;">
                                            Nexus
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 32px;">
                                <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; color: #111827;">Document Submission Request</h1>
                                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">Hi ${firstName},</p>
                                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #374151;">To complete your onboarding process, we kindly request you to submit the following documents:</p>

                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 24px 0;">
                                    <tr>
                                        <td style="background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 20px;">
                                            <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #854d0e;">Required Documents:</p>
                                            <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #713f12;">
                                                <li>Government-issued ID (Passport/National ID)</li>
                                                <li>Proof of address (utility bill/bank statement)</li>
                                                <li>Educational certificates</li>
                                                <li>Previous employment references</li>
                                                <li>Signed offer letter (if not already submitted)</li>
                                                <li>Bank account details for payroll</li>
                                                <li>Tax identification documents</li>
                                            </ul>
                                        </td>
                                    </tr>
                                </table>

                                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">Please submit these documents by replying to this email or through the secure portal provided by HR.</p>
                                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #374151;">If you have any questions about the required documents, please contact our HR department.</p>

                                <p style="margin: 0; font-size: 14px; color: #6b7280;">Best regards,<br><strong style="color: #374151;">Nexus HR Team</strong></p>
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
   * Generate first day info email template
   */
  generateFirstDayInfoTemplate({ firstName, startDate, department }) {
    const formattedDate = startDate
      ? new Date(startDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'Your scheduled start date';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
            <tr>
                <td style="padding: 40px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; text-align: center;">
                                <img src="https://securemaxtech.com/wp-content/uploads/2024/04/logo.png" alt="Nexus" style="height: 50px; width: auto; margin-bottom: 16px;">
                                <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">Your First Day is Almost Here!</h1>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 32px;">
                                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #374151;">Hi ${firstName},</p>
                                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #374151;">We're excited to have you join us on <strong>${formattedDate}</strong>! Here's everything you need to know for your first day.</p>

                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 24px 0; background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #1e40af;">First Day Schedule:</p>
                                            <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #1e3a8a;">
                                                <li><strong>9:00 AM</strong> - Arrival and reception</li>
                                                <li><strong>9:30 AM</strong> - HR paperwork and badge pickup</li>
                                                <li><strong>10:30 AM</strong> - Office tour and introductions</li>
                                                <li><strong>12:00 PM</strong> - Team lunch</li>
                                                <li><strong>1:30 PM</strong> - IT setup and system access</li>
                                                <li><strong>3:00 PM</strong> - Department orientation with ${department}</li>
                                                <li><strong>4:30 PM</strong> - Meet your buddy/mentor</li>
                                            </ul>
                                        </td>
                                    </tr>
                                </table>

                                <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #111827;">What to bring:</p>
                                <ul style="margin: 0 0 24px 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #374151;">
                                    <li>Government-issued photo ID</li>
                                    <li>Any remaining documents requested</li>
                                    <li>A positive attitude!</li>
                                </ul>

                                <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #111827;">Office Location:</p>
                                <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #374151;">Please report to the main reception desk. Someone from HR will meet you there.</p>

                                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #374151;">If you have any questions before your first day, please don't hesitate to contact us.</p>

                                <p style="margin: 0; font-size: 14px; color: #6b7280;">See you soon!<br><strong style="color: #374151;">Nexus HR Team</strong></p>
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
   * Generate HR notification email template
   */
  generateHRNotificationTemplate({ employeeName, jobTitle, department, startDate }) {
    const formattedDate = startDate
      ? new Date(startDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'Not yet scheduled';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
            <tr>
                <td style="padding: 40px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: #fef3c7; border-bottom: 1px solid #fcd34d; padding: 24px 32px;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td>
                                            <span style="font-size: 24px;">🔔</span>
                                            <span style="font-size: 18px; font-weight: 600; color: #92400e; margin-left: 8px;">New Employee Alert</span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 32px;">
                                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #374151;">A new employee has been added to the onboarding pipeline:</p>

                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 24px 0; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                                <tr>
                                                    <td style="padding: 8px 0;">
                                                        <span style="font-size: 13px; color: #6b7280;">Name:</span><br>
                                                        <span style="font-size: 16px; font-weight: 600; color: #111827;">${employeeName}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0;">
                                                        <span style="font-size: 13px; color: #6b7280;">Position:</span><br>
                                                        <span style="font-size: 16px; font-weight: 600; color: #111827;">${jobTitle}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0;">
                                                        <span style="font-size: 13px; color: #6b7280;">Department:</span><br>
                                                        <span style="font-size: 16px; font-weight: 600; color: #111827;">${department}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0;">
                                                        <span style="font-size: 13px; color: #6b7280;">Start Date:</span><br>
                                                        <span style="font-size: 16px; font-weight: 600; color: #111827;">${formattedDate}</span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>

                                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">Please log in to Nexus to view the full profile and manage the onboarding process.</p>

                                <p style="margin: 0; font-size: 13px; color: #6b7280;">This is an automated notification from Nexus Onboarding Assistant.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
