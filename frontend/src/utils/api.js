import axios from 'axios';
import Cookies from 'js-cookie';
import jwtDecode from 'jwt-decode';

export const tokenManager = {
  getAccessToken: () => {
    let token = Cookies.get('accessToken');
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('accessToken');
    }
    return token;
  },
  
  getRefreshToken: () => {
    let token = Cookies.get('refreshToken');
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('refreshToken');
    }
    return token;
  },
  
  setTokens: (accessToken, refreshToken) => {
    const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    
    Cookies.set('accessToken', accessToken, {
      expires: 30,
      path: '/',
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });
    
    Cookies.set('refreshToken', refreshToken, {
      expires: 90,
      path: '/',
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      console.log('Tokens stored in localStorage and cookies');
    }
  },
  
  clearTokens: () => {
    Cookies.remove('accessToken', { path: '/' });
    Cookies.remove('refreshToken', { path: '/' });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },
};

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window === 'undefined') return 'https://thesimpleai.vercel.app';
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'http://localhost:5000';
  return 'https://thesimpleai.vercel.app';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL + '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export { api };
export default api;
