import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import { fadeIn, scaleIn } from '../../lib/motion';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { verifyEmail: verifyEmailAuth, resendVerification } = useAuth();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  const inputRefs = useRef([]);

  useEffect(() => {
    // SECURITY: Get userId and email ONLY from localStorage (never from URL)
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('pendingVerificationUserId');
      const storedEmail = localStorage.getItem('pendingVerificationEmail');

      if (storedUserId) {
        setCurrentUserId(storedUserId);
      } else {
        // No userId in localStorage, redirect to register
        setError('Session expired. Please register again.');
        setTimeout(() => router.push('/auth/register'), 2000);
      }

      if (storedEmail) {
        setEmail(storedEmail);
      }
    }
  }, [router]);

  useEffect(() => {
    // Auto-focus first input
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newCode.every((digit) => digit !== '')) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);

    if (!/^\d+$/.test(pastedData)) return;

    const newCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setCode(newCode);

    // Focus last filled input or next empty
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();

    // Auto-submit if complete
    if (pastedData.length === 6) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (codeString) => {
    if (!currentUserId) {
      setError('Missing user ID. Please try registering again.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await verifyEmailAuth(currentUserId, codeString);

      if (result.success) {
        // Clear pending verification data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('pendingVerificationEmail');
          localStorage.removeItem('pendingVerificationUserId');
        }

        // Redirect to login
        router.push('/auth/login?verified=true');
      } else {
        setError(result.message || 'Invalid code. Please try again.');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!currentUserId) {
      setError('Cannot resend email. Please try registering again.');
      return;
    }

    setIsResending(true);
    setError('');

    try {
      const result = await resendVerification(currentUserId);

      if (result.success) {
        setResendSuccess(true);
        setCountdown(30);
        setCanResend(false);

        // Hide success message after 3 seconds
        setTimeout(() => setResendSuccess(false), 3000);
      } else {
        setError(result.message || 'Failed to resend email. Please try again.');
      }
    } catch (err) {
      setError('Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -top-1/2 -right-1/2 w-full h-full bg-primary/5 rounded-full blur-3xl"
        />
      </div>

      {/* Verification Card */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-md"
      >
        <div className="bg-card backdrop-blur-xl rounded-2xl shadow-2xl border border-border p-8">
          {/* Icon */}
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="flex justify-center mb-6"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full shadow-lg">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-foreground mb-3">Check your email</h1>
            <p className="text-muted-foreground mb-4">
              We&apos;ve sent a 6-digit verification code to
            </p>
            <p className="text-primary font-semibold text-lg mb-4">{email || 'your email'}</p>
            <p className="text-sm text-muted-foreground">
              Enter the code below to verify your account and get started.
            </p>
          </motion.div>

          {/* Code Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <div className="flex gap-2 justify-center mb-4">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  disabled={isLoading}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-border rounded-lg bg-background text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                />
              ))}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 mb-4"
              >
                <p className="text-sm text-destructive text-center">{error}</p>
              </motion.div>
            )}
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-secondary rounded-lg p-4 mb-6"
          >
            <p className="text-sm text-foreground font-medium mb-2">
              Didn&apos;t receive the email?
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-primary mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Check your spam or junk folder</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-primary mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Make sure {email || 'your email'} is correct</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-primary mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Wait a few minutes and check again</span>
              </li>
            </ul>
          </motion.div>

          {/* Success Message */}
          {resendSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-primary/10 border border-primary/50 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-sm text-primary font-medium">
                  Email sent successfully! Check your inbox.
                </p>
              </div>
            </motion.div>
          )}

          {/* Resend Button */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!canResend}
              isLoading={isResending}
              onClick={handleResend}
            >
              {canResend ? 'Resend verification email' : `Resend in ${countdown}s`}
            </Button>
          </motion.div>

          {/* Back to Login */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 text-center"
          >
            <Link href="/auth/login" className="text-sm link">
              ← Back to login
            </Link>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.8 }}
          className="mt-6 text-center text-sm text-muted-foreground"
        >
          <p>© 2025 Nexus. All rights reserved.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
