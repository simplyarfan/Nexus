import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { slideInRight, slideInLeft, scaleIn } from '../../lib/motion';
import microsoftAuthService from '../../services/microsoftAuthService';

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const { register: registerUser, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [microsoftMessage, setMicrosoftMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    jobTitle: '',
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check for OAuth data and pre-fill form
  useEffect(() => {
    const oauthData = localStorage.getItem('oauthData');
    if (oauthData) {
      try {
        const data = JSON.parse(oauthData);
        setFormData((prev) => ({
          ...prev,
          name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
          email: data.email || '',
        }));
        setMicrosoftMessage(
          `We found your Microsoft account (${data.email}). Please complete your registration below.`,
        );
        // Clear OAuth data after using it
        localStorage.removeItem('oauthData');
        toast.success('Microsoft account detected! Complete your registration.');
      } catch (error) {
        // Intentionally empty - OAuth data parsing is optional, form can still be filled manually
      }
    }

    // Check for Microsoft redirect message (legacy)
    const message = localStorage.getItem('microsoft_signup_message');
    if (message && router.query.source === 'microsoft') {
      setMicrosoftMessage(message);
      localStorage.removeItem('microsoft_signup_message');
    }
  }, [router.query.source]);

  // Password strength calculation
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    // Use CSS variables for proper theming: red (error) → yellow (warning) → green (success)
    const colors = [
      'var(--error)',
      'var(--warning)',
      'var(--warning)',
      'var(--success)',
      'var(--success)',
    ];

    return {
      strength: (strength / 5) * 100,
      label: labels[strength - 1] || 'Weak',
      color: colors[strength - 1] || 'var(--error)',
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      } else if (!microsoftAuthService.validateEmailDomain(formData.email)) {
        newErrors.email = `Please use your @${process.env.NEXT_PUBLIC_COMPANY_DOMAIN} email address`;
      }
    }

    if (currentStep === 2) {
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 8)
        newErrors.password = 'Password must be at least 8 characters';
      if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
      else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (currentStep === 3) {
      // Phone is optional, but validate format if provided
      if (formData.phone && !/^\+?[\d\s\-()]+$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
      if (!formData.jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setIsLoading(true);

    try {
      const result = await registerUser({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        jobTitle: formData.jobTitle,
        phone: formData.phone || null,
      });

      if (result.success && result.requiresVerification) {
        // Store email and userId in localStorage for verification page (NOT in URL for security)
        if (typeof window !== 'undefined') {
          localStorage.setItem('pendingVerificationEmail', formData.email);
          localStorage.setItem('pendingVerificationUserId', String(result.userId));
        }
        // Don't pass email in URL - security risk!
        router.push(`/auth/verify-email`);
      } else if (result.success) {
        router.push('/');
      }
    } catch (error) {
      // Intentionally empty - error is handled by registerUser function and displayed to user
    } finally {
      setIsLoading(false);
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

      {/* Register Card */}
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-md"
      >
        <div className="bg-card backdrop-blur-xl rounded-2xl shadow-2xl border border-border p-8">
          {/* Header */}
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
            <p className="text-muted-foreground">Join Nexus to streamline your hiring process</p>
          </motion.div>

          {/* Microsoft Message */}
          {microsoftMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-accent border border-border rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M13 1h10v10H13z" />
                  <path fill="#05a6f0" d="M1 13h10v10H1z" />
                  <path fill="#ffba08" d="M13 13h10v10H13z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Microsoft Account Detected
                  </p>
                  <p className="text-sm text-muted-foreground">{microsoftMessage}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Progress Steps */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center">
              {[
                { num: 1, label: 'Basic Info' },
                { num: 2, label: 'Security' },
                { num: 3, label: 'Details' },
              ].map((s, index) => (
                <React.Fragment key={s.num}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shadow-sm transition-all ${
                        step >= s.num
                          ? 'bg-primary text-primary-foreground scale-110'
                          : 'bg-muted text-muted-foreground'
                      } ${step === s.num ? 'scale-110' : ''}`}
                    >
                      {step > s.num ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        s.num
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground mt-2">{s.label}</span>
                  </div>
                  {index < 2 && (
                    <div
                      className={`flex-1 h-1 mx-2 mb-6 transition-colors ${step > s.num ? 'bg-primary' : 'bg-muted'}`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  variants={slideInRight}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <Input
                    label="First Name"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    error={errors.firstName}
                    fullWidth
                    leftIcon={
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    }
                  />

                  <Input
                    label="Last Name"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    error={errors.lastName}
                    fullWidth
                    leftIcon={
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    }
                  />

                  <Input
                    label="Work Email"
                    type="email"
                    placeholder={`john@${process.env.NEXT_PUBLIC_COMPANY_DOMAIN}`}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    error={errors.email}
                    hint={`Must use @${process.env.NEXT_PUBLIC_COMPANY_DOMAIN} email address`}
                    fullWidth
                    leftIcon={
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        />
                      </svg>
                    }
                  />

                  <Button type="button" variant="primary" size="lg" fullWidth onClick={handleNext}>
                    Continue
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Password */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  variants={slideInRight}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    error={errors.password}
                    fullWidth
                    leftIcon={
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    }
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="flex items-center justify-center focus:outline-none hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    }
                  />

                  {/* Password Strength Meter */}
                  {formData.password && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Password Strength</span>
                        <span className="font-medium" style={{ color: passwordStrength.color }}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${passwordStrength.strength}%` }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: passwordStrength.color }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li className={formData.password.length >= 8 ? 'text-primary' : ''}>
                          • At least 8 characters
                        </li>
                        <li
                          className={
                            /[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password)
                              ? 'text-primary'
                              : ''
                          }
                        >
                          • Mix of uppercase & lowercase
                        </li>
                        <li className={/\d/.test(formData.password) ? 'text-primary' : ''}>
                          • At least one number
                        </li>
                      </ul>
                    </motion.div>
                  )}

                  <Input
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    error={errors.confirmPassword}
                    fullWidth
                    leftIcon={
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    }
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="flex items-center justify-center focus:outline-none hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    }
                  />

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      size="lg"
                      fullWidth
                      onClick={handleBack}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      fullWidth
                      onClick={handleNext}
                    >
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Additional Details */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  variants={slideInRight}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <Input
                    label="Phone Number (Optional)"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    error={errors.phone}
                    hint="Your department will be assigned by an administrator"
                    fullWidth
                    leftIcon={
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    }
                  />

                  <Input
                    label="Job Title"
                    type="text"
                    placeholder="e.g., HR Manager"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    error={errors.jobTitle}
                    fullWidth
                    leftIcon={
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    }
                  />

                  <div className="bg-accent border border-border rounded-lg p-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-primary"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-1">Email Verification Required</p>
                        <p>We&apos;ll send a 6-digit verification code to {formData.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      size="lg"
                      fullWidth
                      onClick={handleBack}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      fullWidth
                      isLoading={isLoading}
                    >
                      Create Account
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Sign in link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:text-primary/90 font-medium">
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center text-sm text-muted-foreground"
        >
          <p>© 2025 Nexus. All rights reserved.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
