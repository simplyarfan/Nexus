import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import microsoftAuthService from '../../services/microsoftAuthService';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      setStatus('processing');
      setMessage('Processing Microsoft authentication...');

      // Handle the redirect from Microsoft
      const result = await microsoftAuthService.handleRedirectCallback();

      if (!result.success) {
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
        setTimeout(() => router.push('/auth/login'), 3000);
        return;
      }

      const { email, name, accessToken } = result;

      // Validate email domain
      if (!microsoftAuthService.validateEmailDomain(email)) {
        setStatus('error');
        setMessage('Invalid email domain. Please use your @securemaxtech.com email.');
        setTimeout(() => router.push('/auth/login'), 3000);
        return;
      }

      setMessage('Checking user account...');

      // Check if user exists in our database
      const userCheck = await microsoftAuthService.checkUserExists(email);

      if (userCheck.exists && userCheck.user) {
        const user = userCheck.user;

        // Check if user is verified and active
        if (!user.emailVerified) {
          setStatus('error');
          setMessage('Please verify your email before logging in.');
          setTimeout(() => router.push('/auth/verify-email'), 3000);
          return;
        }

        if (!user.isActive) {
          setStatus('error');
          setMessage('Your account has been deactivated. Please contact support.');
          setTimeout(() => router.push('/auth/login'), 3000);
          return;
        }

        // User exists and is verified - log them in
        setMessage('Logging you in...');

        // Store user data and token
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(user));

        setStatus('success');
        setMessage('Login successful! Redirecting to dashboard...');

        // Redirect to appropriate dashboard based on role
        setTimeout(() => {
          if (user.role === 'admin') {
            router.push('/admin');
          } else if (user.role === 'superadmin') {
            router.push('/admin');
          } else {
            router.push('/');
          }
        }, 1500);
      } else {
        // User doesn't exist - redirect to register
        setStatus('success');
        setMessage('Account not found. Redirecting to registration...');

        // Store OAuth data for registration
        const [firstName, ...lastNameParts] = name.split(' ');
        const lastName = lastNameParts.join(' ');

        localStorage.setItem(
          'oauthData',
          JSON.stringify({
            email,
            firstName,
            lastName,
            accessToken,
          }),
        );

        setTimeout(() => router.push('/auth/register'), 1500);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      setMessage(error.message || 'Authentication failed. Please try again.');
      setTimeout(() => router.push('/auth/login'), 3000);
    }
  };

  return (
    <>
      <Head>
        <title>Authentication - Nexus AI Platform</title>
      </Head>

      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-green-600 rounded-2xl flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-lg transform rotate-45"></div>
              </div>
            </div>

            {/* Status Content */}
            <div className="text-center">
              {status === 'processing' && (
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <p className="text-lg font-medium text-foreground">{message}</p>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we process your authentication...
                  </p>
                </div>
              )}

              {status === 'success' && (
                <div className="flex flex-col items-center space-y-4">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                  <p className="text-lg font-medium text-foreground">{message}</p>
                  <p className="text-sm text-muted-foreground">You will be redirected shortly...</p>
                </div>
              )}

              {status === 'error' && (
                <div className="flex flex-col items-center space-y-4">
                  <XCircle className="w-12 h-12 text-red-500" />
                  <p className="text-lg font-medium text-foreground">{message}</p>
                  <p className="text-sm text-muted-foreground">
                    Redirecting to login page in 3 seconds...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
