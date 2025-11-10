import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import ButtonGreen from '../../components/ui/ButtonGreen';
import { fadeIn, scaleIn } from '../../lib/motion';

export default function VerifyEmailPage() {
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Email from URL params or default
  const email = 'you@company.com'; // In real app, get from URL params

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleResend = async () => {
    setIsResending(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsResending(false);
    setResendSuccess(true);
    setCountdown(60);
    setCanResend(false);

    // Hide success message after 3 seconds
    setTimeout(() => setResendSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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
          className="absolute -top-1/2 -right-1/2 w-full h-full bg-green-500/5 rounded-full blur-3xl"
        />
      </div>

      {/* Verification Card */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-md"
      >
        <div className="bg-white backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 p-8">
          {/* Icon */}
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="flex justify-center mb-6"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full shadow-lg">
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
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Check your email</h1>
            <p className="text-gray-600 mb-4">We&apos;ve sent a verification link to</p>
            <p className="text-green-500 font-semibold text-lg mb-4">{email}</p>
            <p className="text-sm text-gray-600">
              Click the link in the email to verify your account and get started.
            </p>
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-200 rounded-lg p-4 mb-6"
          >
            <p className="text-sm text-gray-900 font-medium mb-2">Didn&apos;t receive the email?</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
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
                  className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Make sure {email} is correct</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
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
              className="bg-green-500/10 border border-primary/50 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-sm text-green-500 font-medium">
                  Email sent successfully! Check your inbox.
                </p>
              </div>
            </motion.div>
          )}

          {/* Resend Button */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <ButtonGreen
              variant="primary"
              size="lg"
              fullWidth
              disabled={!canResend}
              isLoading={isResending}
              onClick={handleResend}
            >
              {canResend ? 'Resend verification email' : `Resend in ${countdown}s`}
            </ButtonGreen>
          </motion.div>

          {/* Back to Login */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
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
          transition={{ delay: 0.7 }}
          className="mt-6 text-center text-sm text-gray-600"
        >
          <p>© 2025 Nexus. All rights reserved.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
