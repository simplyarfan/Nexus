/**
 * Google Sheets Service
 * Fetches candidate personal information from Google Sheets forms
 *
 * Setup:
 * 1. Create a Google Cloud Project
 * 2. Enable Google Sheets API
 * 3. Create a Service Account and download JSON key
 * 4. Share the Google Sheet with the service account email
 * 5. Set environment variables:
 *    - GOOGLE_SERVICE_ACCOUNT_KEY (JSON string of the service account key)
 *    - GOOGLE_SHEETS_ID (Sheet ID from the URL)
 *    - GOOGLE_SHEETS_TAB_NAME (Tab/sheet name, defaults to 'Sheet1')
 */

const { google } = require('googleapis');

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.initialized = false;
    this.sheetId = process.env.GOOGLE_SHEETS_ID;
    this.tabName = process.env.GOOGLE_SHEETS_TAB_NAME || 'Sheet1';

    // Column mapping - configure based on actual sheet structure
    // Will be updated once user provides sheet structure
    this.columnMapping = {
      email: 'A', // Email address (for matching)
      firstName: 'B',
      lastName: 'C',
      dateOfBirth: 'D',
      nationality: 'E',
      phone: 'F',
      address: 'G',
      city: 'H',
      country: 'I',
      postalCode: 'J',
      emergencyContactName: 'K',
      emergencyContactPhone: 'L',
      emergencyContactRelation: 'M',
    };
  }

  /**
   * Initialize the Google Sheets API client
   */
  async initialize() {
    if (this.initialized) return true;

    try {
      const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

      if (!serviceAccountKey) {
        console.warn('Google Sheets: GOOGLE_SERVICE_ACCOUNT_KEY not configured');
        return false;
      }

      if (!this.sheetId) {
        console.warn('Google Sheets: GOOGLE_SHEETS_ID not configured');
        return false;
      }

      // Parse the service account key
      const credentials = JSON.parse(serviceAccountKey);

      // Create auth client
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      // Create sheets client
      this.sheets = google.sheets({ version: 'v4', auth });
      this.initialized = true;

      console.log('Google Sheets Service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Sheets Service:', error.message);
      return false;
    }
  }

  /**
   * Test the connection to Google Sheets
   */
  async testConnection() {
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        return {
          success: false,
          error:
            'Google Sheets not configured. Please set GOOGLE_SERVICE_ACCOUNT_KEY and GOOGLE_SHEETS_ID environment variables.',
        };
      }

      // Try to read the sheet metadata
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.sheetId,
      });

      return {
        success: true,
        sheetTitle: response.data.properties.title,
        tabs: response.data.sheets.map((s) => s.properties.title),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get all data from the sheet (for debugging/setup)
   */
  async getAllData(limit = 100) {
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        return { success: false, error: 'Google Sheets not initialized' };
      }

      const range = `${this.tabName}!A1:Z${limit}`;
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetId,
        range,
      });

      const rows = response.data.values || [];
      const headers = rows[0] || [];
      const data = rows.slice(1).map((row) => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });

      return {
        success: true,
        headers,
        data,
        totalRows: data.length,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Find a candidate's personal info by email
   * @param {string} email - Candidate's email address
   * @returns {object} Personal information or null
   */
  async getPersonalInfoByEmail(email) {
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        console.warn('Google Sheets not initialized, returning empty personal info');
        return null;
      }

      // Get all data and search for the email
      const range = `${this.tabName}!A:Z`;
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetId,
        range,
      });

      const rows = response.data.values || [];
      if (rows.length < 2) {
        return null; // No data (only headers or empty)
      }

      const headers = rows[0];
      const emailLower = email.toLowerCase().trim();

      // Find the row with matching email
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        // Check each cell for the email (flexible matching)
        for (let j = 0; j < row.length; j++) {
          if (row[j] && row[j].toLowerCase().trim() === emailLower) {
            // Found the row, parse it
            const data = {};
            headers.forEach((header, index) => {
              data[header] = row[index] || '';
            });

            // Map to our expected structure
            return this.mapToPersonalInfo(data, headers);
          }
        }
      }

      return null; // Email not found
    } catch (error) {
      console.error('Error fetching personal info from Google Sheets:', error.message);
      return null;
    }
  }

  /**
   * Map sheet data to personal info structure
   * Configured for the actual Google Form structure
   * @param {object} data - Raw row data
   * @param {array} headers - Sheet headers
   */
  mapToPersonalInfo(data, headers) {
    // Helper to find value by partial header match
    const findValue = (possibleHeaders) => {
      for (const h of possibleHeaders) {
        const headerLower = h.toLowerCase();
        for (const key of Object.keys(data)) {
          if (key.toLowerCase().includes(headerLower)) {
            return data[key];
          }
        }
      }
      return null;
    };

    return {
      // Basic info
      name: findValue(['name']) || null,
      phone: findValue(['phone number']) || null,
      whatsappNumber: findValue(['whatsapp']) || null,
      nationality: findValue(['nationality']) || null,

      // Location
      currentResidency: findValue(['current residency']) || null,
      city: findValue(['location', 'city']) || null,

      // Employment info
      noticePeriod: findValue(['notice period']) || null,
      dateOfJoining: findValue(['date of joining']) || null,
      currentSalary: findValue(['current salary']) || null,
      expectedSalary: findValue(['expected salary']) || null,
      totalExperience: findValue(['total relevant experience', 'experience']) || null,

      // Personal status
      maritalStatus: findValue(['marital status']) || null,
      numberOfDependents: findValue(['number of dependents', 'dependents']) || null,

      // Qualifications
      certifications: findValue(['certifications']) || null,
      education: findValue(['education']) || null,

      // Work preferences
      openToBankingInsurance: findValue(['banking and insurance']) || null,
      openToMultipleTechnologies: findValue(['multiple technologies']) || null,

      // Saudi-specific (Iqama)
      iqamaExpiry: findValue(['iqama expiry']) || null,
      iqamaProfession: findValue(['iqama profession']) || null,

      // Include raw data for debugging
      _rawData: data,
      _headers: headers,
    };
  }

  /**
   * Update column mapping configuration
   * @param {object} mapping - New column mapping
   */
  setColumnMapping(mapping) {
    this.columnMapping = { ...this.columnMapping, ...mapping };
  }
}

// Export singleton instance
const googleSheetsService = new GoogleSheetsService();
module.exports = googleSheetsService;
