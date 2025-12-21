/**
 * Microsoft OAuth Service
 * Handles Microsoft authentication flow using MSAL.js
 */

class MicrosoftAuthService {
  constructor() {
    this.msalInstance = null;
    this.initialized = false;
    this.initPromise = null;
    this.redirectResponse = null;
  }

  /**
   * Initialize MSAL instance and immediately handle any redirect response
   */
  async initialize() {
    // If already initializing, return the existing promise to prevent race conditions
    if (this.initPromise) {
      return this.initPromise;
    }

    if (this.initialized) return;

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  async _doInitialize() {
    try {
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
          navigateToLoginRequestUrl: false,
        },
        cache: {
          cacheLocation: 'localStorage',
          storeAuthStateInCookie: true, // Enable for better redirect handling
        },
      };

      this.msalInstance = new window.msal.PublicClientApplication(msalConfig);
      await this.msalInstance.initialize();

      // CRITICAL: Handle redirect promise immediately after initialization
      // This captures the auth response before any re-renders can clear it
      try {
        this.redirectResponse = await this.msalInstance.handleRedirectPromise();
      } catch (redirectError) {
        // Silent failure - redirect handling error
      }

      this.initialized = true;
    } catch (error) {
      this.initPromise = null;
      throw error;
    }
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
   * Handle redirect callback - returns the pre-captured response from initialization
   */
  async handleRedirectCallback() {
    try {
      // Initialize (this will capture any redirect response)
      await this.initialize();

      // Check if we captured a redirect response during initialization
      if (this.redirectResponse) {
        const response = this.redirectResponse;
        this.redirectResponse = null; // Clear after use
        return {
          success: true,
          account: response.account,
          accessToken: response.accessToken,
          email: response.account.username,
          name: response.account.name,
        };
      }

      // Check if there's an active account (user already logged in via MSAL)
      const accounts = this.msalInstance.getAllAccounts();

      if (accounts.length > 0) {
        // User has an active account, try to get a token silently
        try {
          const silentResult = await this.msalInstance.acquireTokenSilent({
            scopes: ['User.Read', 'email', 'profile', 'openid'],
            account: accounts[0],
          });
          return {
            success: true,
            account: silentResult.account,
            accessToken: silentResult.accessToken,
            email: silentResult.account.username,
            name: silentResult.account.name,
          };
        } catch (silentError) {
          // Silent token acquisition failed
        }
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
   * Clear stuck interaction state from localStorage
   */
  clearInteractionState() {
    if (typeof window === 'undefined') return;

    // Clear MSAL interaction state from localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('msal.') || key.includes('msal'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Reset the service state
    this.initialized = false;
    this.msalInstance = null;
    this.initPromise = null;
    this.redirectResponse = null;
  }

  /**
   * Validate email domain
   */
  validateEmailDomain(email) {
    const companyDomain = process.env.NEXT_PUBLIC_COMPANY_DOMAIN;
    if (!companyDomain) {
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
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

  /**
   * Login with Microsoft SSO - gets Nexus JWT token
   */
  async loginWithMicrosoftSSO(email, microsoftAccessToken) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        return { success: false, message: 'API URL not configured' };
      }

      const response = await fetch(`${apiUrl}/api/auth/microsoft-sso-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, microsoftAccessToken }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, message: error.message || 'Login failed' };
    }
  }
}

// Export singleton instance
const microsoftAuthService = new MicrosoftAuthService();
export default microsoftAuthService;
