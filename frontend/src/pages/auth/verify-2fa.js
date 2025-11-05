import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ClientOnly from '../../components/shared/ClientOnly';
import { api } from '../../utils/api';

const Verify2FA = () => {
  const router = useRouter();
  const { verify2FA, loading, isAuthenticated } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [mounted, setMounted] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  // Get userId from query params
  const { userId } = router.query;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Redirect if already authenticated or no userId
  useEffect(() => {
    if (mounted && isAuthenticated && router.isReady) {
      router.push('/');
    }
    if (mounted && router.isReady && !userId) {
      toast.error('Invalid verification request');
      router.push('/auth/login');
    }
  }, [mounted, isAuthenticated, router, userId]);

  // Handle input change and auto-focus
  const handleCodeChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields filled
    if (index === 5 && value && newCode.every((digit) => digit)) {
      handleVerify(newCode.join(''));
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();

    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      // Auto-submit
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (verificationCode) => {
    if (verifying) return;

    const codeString = verificationCode || code.join('');

    if (codeString.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setVerifying(true);

    try {
      const response = await api.post('/auth/verify-2fa', {
        userId,
        code: codeString,
      });

      if (response.data.success) {
        // Store tokens
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        toast.success('Verification successful!');

        const returnUrl = router.query.returnUrl || '/';
        router.push(returnUrl);
      } else {
        toast.error(response.data.message || 'Verification failed');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error(error.response?.data?.message || 'Verification failed. Please try again.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleVerify();
  };

  // Show loading during SSR or while mounting
  if (!mounted || !router.isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Link
          href="/auth/login"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to login
        </Link>

        {/* Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h1>
          <p className="text-gray-600">
            We&apos;ve sent a 6-digit code to your email.
            <br />
            Enter it below to complete your sign in.
          </p>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                disabled={verifying}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={verifying || code.some((digit) => !digit)}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-4 rounded-xl font-medium hover:from-orange-600 hover:to-red-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verifying ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        {/* Resend */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Didn&apos;t receive the code?{' '}
            <button
              onClick={async () => {
                if (resendCooldown > 0 || resending) return;

                setResending(true);
                try {
                  const response = await api.post('/auth/resend-2fa', { userId });

                  if (response.data.success) {
                    toast.success('A new code has been sent to your email');
                    setResendCooldown(60); // 60 second cooldown
                    setCode(['', '', '', '', '', '']); // Clear current code
                    inputRefs.current[0]?.focus();
                  } else {
                    toast.error(response.data.message || 'Failed to resend code');
                  }
                } catch (error) {
                  console.error('Resend error:', error);
                  toast.error(error.response?.data?.message || 'Failed to resend code');
                } finally {
                  setResending(false);
                }
              }}
              className="text-orange-600 hover:text-orange-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
              disabled={verifying || resending || resendCooldown > 0}
            >
              {resending
                ? 'Sending...'
                : resendCooldown > 0
                  ? `Resend code (${resendCooldown}s)`
                  : 'Resend code'}
            </button>
          </p>
        </div>

        {/* Help text */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> Check your spam folder if you don&apos;t see the email within a
            few minutes.
          </p>
        </div>
      </div>
    </div>
  );
};

// Wrap with ClientOnly to prevent SSR/build issues
const Verify2FAPage = () => (
  <ClientOnly>
    <Verify2FA />
  </ClientOnly>
);

export default Verify2FAPage;
