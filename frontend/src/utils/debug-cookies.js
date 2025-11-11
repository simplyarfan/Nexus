// Debug utility to check cookies
export function debugCookies() {
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});
  
  console.log('🍪 All Cookies:', cookies);
  console.log('🔑 Access Token:', cookies.accessToken ? cookies.accessToken.substring(0, 30) + '...' : 'NOT FOUND');
  console.log('🔄 Refresh Token:', cookies.refreshToken ? cookies.refreshToken.substring(0, 30) + '...' : 'NOT FOUND');
  
  return cookies;
}

export function checkTokenValidity(token) {
  if (!token) {
    console.error('❌ No token provided');
    return false;
  }
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('❌ Invalid token format - should have 3 parts');
      return false;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    console.log('📋 Token Payload:', payload);
    
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.error('❌ Token expired at:', new Date(payload.exp * 1000));
      return false;
    }
    
    console.log('✅ Token is valid, expires at:', new Date(payload.exp * 1000));
    return true;
  } catch (e) {
    console.error('❌ Error parsing token:', e.message);
    return false;
  }
}
