import '../styles/globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { tokenManager } from '../utils/api';

function MyApp({ Component, pageProps }) {
  // Force validate and clear expired tokens on every page load
  useEffect(() => {
    const token = tokenManager.getAccessToken();
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length !== 3) throw new Error('Invalid format');
        
        const payload = JSON.parse(atob(parts[1]));
        const now = Math.floor(Date.now() / 1000);
        
        // If expired or within 1 hour of expiry, clear it
        if (!payload.exp || payload.exp < (now + 3600)) {
          console.log('🗑️ Clearing expired/invalid token');
          tokenManager.clearTokens();
        }
      } catch (e) {
        console.log('🗑️ Clearing malformed token');
        tokenManager.clearTokens();
      }
    }
  }, []);

  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
