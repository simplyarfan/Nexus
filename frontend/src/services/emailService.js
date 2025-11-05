/**
 * Email Integration Service
 * Handles Outlook OAuth for sending emails and generates .ics calendar files
 */

class EmailService {
  constructor() {
    this.outlookAuth = null;
    this.connectedEmail = {};
    this.currentUserId = null;

    // Email connections should be per-user, not global
    // We'll store them with user ID as key
    if (typeof window !== 'undefined') {
      this.loadUserEmailConnection();
    }
  }

  loadUserEmailConnection() {
    try {
      // Get current user ID from access token
      const Cookies = require('js-cookie');
      const accessToken = Cookies.get('accessToken');

      if (accessToken) {
        try {
          // Decode JWT to get user ID (simple base64 decode of payload)
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          this.currentUserId = payload.userId || payload.id;

          const storageKey = `connectedEmail_${this.currentUserId}`;
          const stored = localStorage.getItem(storageKey);

          if (stored) {
            const storedData = JSON.parse(stored);

            // Check if the stored data has expired
            if (storedData.expiresAt && new Date() > new Date(storedData.expiresAt)) {
              console.log('🔄 Email connection expired, removing...');
              localStorage.removeItem(storageKey);
              this.connectedEmail = {};
              return;
            }

            // Remove expiration metadata before using
            const { savedAt, expiresAt, persistAcrossSessions, ...emailData } = storedData;
            this.connectedEmail = emailData;
            console.log('✅ Loaded email connection for user:', this.currentUserId);
          }
        } catch (decodeError) {
          console.error('Failed to decode access token:', decodeError);
        }
      }
    } catch (e) {
      console.error('Failed to load user email connection:', e);
      this.connectedEmail = {};
    }
  }

  // Outlook Integration - Uses secure backend OAuth flow
  async connectOutlook() {
    try {
      const { api } = await import('../utils/api');

      console.log('🔐 Starting Outlook OAuth flow...');

      // Get OAuth authorization URL from backend
      const response = await api.get('/auth/outlook/auth');

      if (!response.data.success) {
        return {
          success: false,
          error: response.data.message || 'Failed to initiate OAuth',
        };
      }

      const authUrl = response.data.authUrl;
      console.log('✅ Authorization URL received, redirecting...');

      // Redirect to Microsoft OAuth page
      // The backend will handle the callback and store tokens securely
      window.location.href = authUrl;

      // Return pending status (page will redirect)
      return { success: true, pending: true };
    } catch (error) {
      console.error('❌ Outlook connection failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // Check Outlook connection status
  async checkOutlookStatus() {
    try {
      const { api } = await import('../utils/api');
      const response = await api.get('/auth/outlook/status');

      if (response.data.success) {
        const { isConnected, isExpired, email } = response.data;

        if (isConnected && !isExpired) {
          this.connectedEmail.outlook = {
            connected: true,
            email: email,
            connectedAt: new Date().toISOString(),
          };
          this.saveConnectedEmail();
        }

        return { isConnected, isExpired, email };
      }

      return { isConnected: false };
    } catch (error) {
      console.error('Failed to check Outlook status:', error);
      return { isConnected: false };
    }
  }

  // Disconnect Outlook
  async disconnectOutlook() {
    try {
      const { api } = await import('../utils/api');
      await api.post('/auth/outlook/disconnect');

      this.connectedEmail.outlook = {};
      this.saveConnectedEmail();

      return { success: true };
    } catch (error) {
      console.error('Failed to disconnect Outlook:', error);
      return { success: false, error: error.message };
    }
  }

  // Create email message in RFC 2822 format
  createEmailMessage(to, subject, body, attachments = []) {
    const boundary = 'boundary_' + Math.random().toString(36).substr(2, 9);

    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      '',
      body,
      '',
    ];

    // Add attachments
    attachments.forEach((attachment) => {
      email.push(`--${boundary}`);
      email.push(`Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`);
      email.push('Content-Transfer-Encoding: base64');
      email.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
      email.push('');
      email.push(attachment.data);
      email.push('');
    });

    email.push(`--${boundary}--`);

    return btoa(email.join('\n')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  // Generate .ics calendar file
  generateICSFile(eventData) {
    const {
      title,
      startDate,
      endDate,
      location,
      description,
      candidateEmail,
      organizerEmail = this.connectedEmail.gmail?.email || 'noreply@example.com',
    } = eventData;

    // Format dates for ICS (YYYYMMDDTHHMMSSZ)
    const formatDate = (date) => {
      return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Interview Coordinator//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@interviewcoordinator.com`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
      `LOCATION:${location}`,
      `ORGANIZER;CN=${organizerEmail}:mailto:${organizerEmail}`,
      `ATTENDEE;CN=${candidateEmail}:mailto:${candidateEmail}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Interview Reminder',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    return {
      content: icsContent,
      filename: `interview-${title.replace(/[^a-zA-Z0-9]/g, '-')}.ics`,
      mimeType: 'text/calendar',
    };
  }

  // Download .ics file
  downloadICSFile(eventData) {
    const icsFile = this.generateICSFile(eventData);
    const blob = new Blob([icsFile.content], { type: icsFile.mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = icsFile.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return icsFile;
  }

  // Disconnect Email
  disconnectEmail(provider = 'gmail') {
    if (this.connectedEmail[provider]) {
      delete this.connectedEmail[provider];
      this.saveConnectedEmail();
    }
  }

  // Get Connected Email (per-user)
  getConnectedEmail() {
    // Always refresh from localStorage to ensure we have latest data
    if (typeof window !== 'undefined') {
      this.loadUserEmailConnection();
    }
    return this.connectedEmail;
  }

  // Check if email is connected
  hasConnectedEmail() {
    return this.connectedEmail.outlook?.connected || false;
  }

  // Save to localStorage (per-user) with longer expiration
  saveConnectedEmail() {
    if (typeof window !== 'undefined' && this.currentUserId) {
      const storageKey = `connectedEmail_${this.currentUserId}`;
      const dataToStore = {
        ...this.connectedEmail,
        savedAt: new Date().toISOString(),
        // Set expiration to 90 days from now (longer persistence)
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        // Add a flag to indicate this should persist across sessions
        persistAcrossSessions: true,
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
      console.log('✅ Email connection saved with 90-day expiration and session persistence');
    }
  }

  // Load Microsoft MSAL
  async loadMSAL() {
    return new Promise((resolve, reject) => {
      if (window.msal) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://alcdn.msauth.net/browser/2.30.0/js/msal-browser.min.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        console.log('✅ MSAL loaded successfully');
        resolve();
      };
      script.onerror = (error) => {
        console.error('❌ Failed to load MSAL:', error);
        reject(new Error('Failed to load Microsoft MSAL'));
      };
      document.head.appendChild(script);
    });
  }
}

// Create and export singleton instance
const emailService = new EmailService();
export default emailService;
