/**
 * Microsoft OAuth Service
 * Handles Microsoft authentication flow using MSAL.js
 */

class MicrosoftAuthService {
  constructor() {
    this.msalInstance = null;
    this.initialized = false;
  }

  /**
   * Initialize MSAL instance
   */
  async initialize() {
    if (this.initialized) return;

    // Load MSAL library if not already loaded
    if (typeof window !== 'undefined' && !window.msal) {
      await this.loadMSAL();
    }

    const msalConfig = {
      auth: {
        clientId: process.env.NEXT_PUBLIC_OUTLOOK_CLIENT_ID || '',
        authority: `https://login.microsoftonline.com/${
          process.env.NEXT_PUBLIC_OUTLOOK_TENANT_ID || 'common'
        }`,
        redirectUri:
          process.env.NEXT_PUBLIC_OUTLOOK_REDIRECT_URI ||
          (typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : ''),
      },
      cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: false,
      },
    };

    this.msalInstance = new window.msal.PublicClientApplication(msalConfig);
    await this.msalInstance.initialize();
    this.initialized = true;
  }

  /**
   * Load MSAL library from CDN
   */
  loadMSAL() {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Window is not defined'));
        return;
      }

      if (window.msal) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://alcdn.msauth.net/browser/2.30.0/js/msal-browser.min.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load MSAL library'));
      document.head.appendChild(script);
    });
  }

  /**
   * Initiate Microsoft login popup
   */
  async loginWithPopup() {
    try {
      await this.initialize();

      const loginRequest = {
        scopes: ['User.Read', 'email', 'profile', 'openid'],
      };

      const result = await this.msalInstance.loginPopup(loginRequest);

      return {
        success: true,
        account: result.account,
        accessToken: result.accessToken,
        email: result.account.username,
        name: result.account.name,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Microsoft login failed',
      };
    }
  }

  /**
   * Initiate Microsoft login redirect
   */
  async loginWithRedirect() {
    await this.initialize();

    const loginRequest = {
      scopes: ['User.Read', 'email', 'profile', 'openid'],
    };

    await this.msalInstance.loginRedirect(loginRequest);
  }

  /**
   * Handle redirect callback
   */
  async handleRedirectCallback() {
    try {
      await this.initialize();

      const response = await this.msalInstance.handleRedirectPromise();

      if (response) {
        return {
          success: true,
          account: response.account,
          accessToken: response.accessToken,
          email: response.account.username,
          name: response.account.name,
        };
      }

      return { success: false };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Handle redirect failed',
      };
    }
  }

  /**
   * Get current account
   */
  getCurrentAccount() {
    if (!this.msalInstance) return null;

    const accounts = this.msalInstance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  }

  /**
   * Logout
   */
  async logout() {
    if (!this.msalInstance) return;

    try {
      await this.msalInstance.logoutPopup();
    } catch (error) {
      // Silent failure
    }
  }

  /**
   * Validate email domain
   */
  validateEmailDomain(email) {
    const companyDomain = process.env.NEXT_PUBLIC_COMPANY_DOMAIN;
    if (!companyDomain) {
      console.error('NEXT_PUBLIC_COMPANY_DOMAIN environment variable is not set');
      return false;
    }
    const allowedDomain = `@${companyDomain}`;
    return email && email.toLowerCase().endsWith(allowedDomain);
  }

  /**
   * Check if user exists in our database
   */
  async checkUserExists(email) {
    try {
      // Use environment variable for API URL (required)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        console.error('NEXT_PUBLIC_API_URL environment variable is not set');
        return { exists: false, user: null };
      }

      const response = await fetch(`${apiUrl}/api/auth/check-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return {
        exists: data.exists || false,
        user: data.user || null,
      };
    } catch (error) {
      return { exists: false, user: null };
    }
  }
}

// Export singleton instance
const microsoftAuthService = new MicrosoftAuthService();
export default microsoftAuthService;
