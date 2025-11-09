import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import ErrorAlert from '@/components/shared/ErrorAlert';

// Get API URL and add /api prefix
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api';

export default function VerifyEmail() {
  const router = useRouter();
  const { userId, from } = router.query;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [showLoginBanner, setShowLoginBanner] = useState(false);

  const inputRefs = useRef([]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Check if user came from login attempt
  useEffect(() => {
    if (from === 'login') {
      setShowLoginBanner(true);
    }
  }, [from]);

  // Redirect if no userId
  useEffect(() => {
    if (router.isReady && !userId) {
      router.push('/auth/register');
    }
  }, [router.isReady, userId, router]);

  const handleInputChange = (index, value) => {
    if (value.length > 1) {
      value = value.charAt(0);
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage('');

    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      setError({ message: 'Please enter all 6 digits' });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/verify-email`, {
        userId,
        code: verificationCode,
      });

      if (response.data.success) {
        // Store tokens (flat response structure)
        localStorage.setItem('token', response.data.accessToken || response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        setSuccessMessage('Email verified! Redirecting to login...');

        setTimeout(() => {
          router.push('/auth/login');
        }, 1500);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError({
        message: err.response?.data?.message || 'Verification failed. Please try again.',
      });
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setError(null);
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/resend-verification`, {
        userId,
      });

      if (response.data.success) {
        setSuccessMessage('Verification code sent! Check your email.');
        setResendCooldown(30); // 30 second cooldown
      }
    } catch (err) {
      console.error('Resend error:', err);
      setError({
        message: err.response?.data?.message || 'Failed to resend code. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Verify Email - Enterprise AI Hub</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verify Your Email
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                We&apos;ve sent a 6-digit code to your email address. Enter it below to verify your
                account.
              </p>
            </div>

            {/* Login Redirect Banner */}
            {showLoginBanner && (
              <div className="mb-6 p-4 bg-orange-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-600 mt-0.5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-900">
                      Please verify your email address first
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Check your inbox for the verification code we sent you.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowLoginBanner(false)}
                    className="text-orange-400 hover:text-green-600 ml-3"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6">
                <ErrorAlert type="error" message={error.message} onClose={() => setError(null)} />
              </div>
            )}

            {successMessage && (
              <div className="mb-6">
                <ErrorAlert
                  type="success"
                  message={successMessage}
                  onClose={() => setSuccessMessage('')}
                />
              </div>
            )}

            {/* Verification Form */}
            <form onSubmit={handleSubmit}>
              <div className="flex justify-center gap-2 mb-8" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || code.join('').length !== 6}
                className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Verifying...
                  </>
                ) : (
                  'Verify Email'
                )}
              </button>
            </form>

            {/* Resend Section */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Didn&apos;t receive the code?
              </p>
              <button
                onClick={handleResend}
                disabled={loading || resendCooldown > 0}
                className="text-green-600 dark:text-orange-400 hover:text-green-700 dark:hover:text-orange-300 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : 'Resend verification code'}
              </button>
            </div>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/auth/login')}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                ← Back to login
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
