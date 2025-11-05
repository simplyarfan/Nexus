/**
 * GOOGLE CALENDAR SERVICE
 * Creates actual Google Meet links via Google Calendar API
 * Requires Google OAuth integration
 */

const { google } = require('googleapis');
const database = require('../models/database');

class GoogleCalendarService {
  constructor() {
    // Redirect URI must be the BACKEND URL where the callback is handled
    // Always use BACKEND_URL if set, otherwise default to production URL
    // NEVER use VERCEL_URL directly as it contains preview deployment URLs
    const backendUrl = process.env.BACKEND_URL || 'https://thesimpleai.vercel.app';

    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${backendUrl}/api/auth/google/callback`,
    );
  }

  /**
   * Generate Google OAuth authorization URL
   */
  getAuthUrl(userId) {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: userId, // Pass user ID for callback
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  /**
   * Store user's Google Calendar tokens
   */
  async storeUserTokens(userId, tokens) {
    const expiresAt = new Date(tokens.expiry_date || Date.now() + 3600000);

    await database.run(
      `UPDATE users 
       SET google_access_token = $1, 
           google_refresh_token = COALESCE($2, google_refresh_token),
           google_token_expires_at = $3
       WHERE id = $4`,
      [tokens.access_token, tokens.refresh_token, expiresAt.toISOString(), userId],
    );
  }

  /**
   * Get user's stored Google Calendar tokens
   */
  async getUserTokens(userId) {
    const user = await database.get(
      'SELECT google_access_token, google_refresh_token, google_token_expires_at FROM users WHERE id = $1',
      [userId],
    );

    if (!user || !user.google_access_token) {
      throw new Error('User has not connected their Google Calendar account');
    }

    return user;
  }

  /**
   * Set up OAuth client with user's tokens
   */
  async setupClientForUser(userId) {
    const tokenData = await this.getUserTokens(userId);

    this.oauth2Client.setCredentials({
      access_token: tokenData.google_access_token,
      refresh_token: tokenData.google_refresh_token,
      expiry_date: new Date(tokenData.google_token_expires_at).getTime(),
    });

    // Handle automatic token refresh
    this.oauth2Client.on('tokens', async (tokens) => {
      if (tokens.refresh_token) {
        await this.storeUserTokens(userId, tokens);
      } else {
        // Update only access token
        const expiresAt = new Date(tokens.expiry_date || Date.now() + 3600000);
        await database.run(
          `UPDATE users 
           SET google_access_token = $1, google_token_expires_at = $2
           WHERE id = $3`,
          [tokens.access_token, expiresAt.toISOString(), userId],
        );
      }
    });

    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Create a Google Calendar event with Google Meet link
   */
  async createCalendarEventWithMeet(userId, eventData) {
    try {
      const calendar = await this.setupClientForUser(userId);

      // Format dates for Google Calendar API
      const startDate = new Date(eventData.scheduledTime);
      const endDate = new Date(startDate.getTime() + (eventData.duration || 60) * 60000);

      const calendarEvent = {
        summary: `Interview - ${eventData.candidateName} - ${eventData.position}`,
        description: this.generateEventDescription(eventData),
        start: {
          dateTime: startDate.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: 'UTC',
        },
        attendees: [{ email: eventData.candidateEmail }],
        conferenceData: {
          createRequest: {
            requestId: `interview-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 60 },
            { method: 'popup', minutes: 15 },
          ],
        },
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: calendarEvent,
        conferenceDataVersion: 1,
        sendUpdates: 'all',
      });

      // Extract Google Meet link from response
      const meetLink =
        response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri;

      return {
        success: true,
        eventId: response.data.id,
        meetingLink: meetLink,
        htmlLink: response.data.htmlLink,
        message: 'Google Calendar event created with Meet link',
      };
    } catch (error) {
      console.error('❌ Failed to create Google Calendar event:', error.message);
      throw new Error(`Failed to create Google Meet: ${error.message}`);
    }
  }

  /**
   * Generate event description
   */
  generateEventDescription(eventData) {
    return (
      'Interview Details:\n\n' +
      `Position: ${eventData.position}\n` +
      `Type: ${eventData.interviewType || 'General'}\n` +
      `Duration: ${eventData.duration || 60} minutes\n` +
      `Candidate: ${eventData.candidateName}\n` +
      `Email: ${eventData.candidateEmail}\n\n` +
      (eventData.notes ? `Notes: ${eventData.notes}\n\n` : '') +
      'This meeting includes a Google Meet video conference.\n' +
      'If you need to reschedule, please contact the interviewer.'
    );
  }

  /**
   * Delete a calendar event
   */
  async deleteCalendarEvent(userId, eventId) {
    try {
      const calendar = await this.setupClientForUser(userId);

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all',
      });

      return {
        success: true,
        message: 'Calendar event deleted successfully',
      };
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      throw new Error('Failed to delete calendar event');
    }
  }

  /**
   * Update a calendar event
   */
  async updateCalendarEvent(userId, eventId, eventData) {
    try {
      const calendar = await this.setupClientForUser(userId);

      const startDate = new Date(eventData.scheduledTime);
      const endDate = new Date(startDate.getTime() + (eventData.duration || 60) * 60000);

      const calendarEvent = {
        summary: `Interview - ${eventData.candidateName} - ${eventData.position}`,
        description: this.generateEventDescription(eventData),
        start: {
          dateTime: startDate.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: 'UTC',
        },
      };

      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: calendarEvent,
        sendUpdates: 'all',
      });

      return {
        success: true,
        eventId: response.data.id,
        message: 'Calendar event updated successfully',
      };
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  /**
   * Check if user has connected Google Calendar
   */
  async isUserConnected(userId) {
    try {
      const tokenData = await database.get('SELECT google_access_token FROM users WHERE id = $1', [
        userId,
      ]);
      return !!tokenData?.google_access_token;
    } catch (error) {
      return false;
    }
  }

  /**
   * Disconnect user's Google Calendar
   */
  async disconnectUser(userId) {
    await database.run(
      `UPDATE users 
       SET google_access_token = NULL, 
           google_refresh_token = NULL, 
           google_token_expires_at = NULL
       WHERE id = $1`,
      [userId],
    );
  }
}

module.exports = new GoogleCalendarService();
