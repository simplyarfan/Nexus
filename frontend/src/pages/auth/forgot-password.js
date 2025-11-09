import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ClientOnly from '../../components/shared/ClientOnly';
import { api } from '../../utils/api';

const ForgotPassword = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });

      if (response.data.success) {
        setEmailSent(true);
        toast.success('Reset link sent! Check your email.');
      } else {
        toast.error(response.data.message || 'Failed to send reset link');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      // Don't reveal if email exists - always show generic message
      setEmailSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
            <p className="text-gray-600">
              If an account exists with <strong>{email}</strong>, we&apos;ve sent password reset
              instructions to that address.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> The link will expire in 1 hour. Check your spam folder if you
              don&apos;t see it within a few minutes.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all"
            >
              Back to Login
            </button>
            <button
              onClick={() => {
                setEmailSent(false);
                setEmail('');
              }}
              className="w-full border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-medium hover:border-gray-400 transition-all"
            >
              Try another email
            </button>
          </div>
        </div>
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mb-6">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot your password?</h1>
          <p className="text-gray-600">
            No worries! Enter your email address and we&apos;ll send you a link to reset your
            password.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl font-medium hover:from-green-600 hover:to-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        {/* Help text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <Link href="/auth/login" className="text-green-600 hover:text-green-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// Wrap with ClientOnly to prevent SSR/build issues
const ForgotPasswordPage = () => (
  <ClientOnly>
    <ForgotPassword />
  </ClientOnly>
);

export default ForgotPasswordPage;
