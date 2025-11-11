/**
 * Authentication Service
 * Contains all business logic for authentication (Production Ready - Prisma)
 */

const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/prisma');
const { generateTokens } = require('../lib/auth');
const { generate2FACode } = require('../utils/twoFactorAuth');
const emailService = require('./email.service');

/**
 * Register a new user
 */
const registerUser = async ({ email, password, firstName, lastName, department, jobTitle }) => {
  // Validation
  if (!email || !password || !firstName || !lastName) {
    throw { statusCode: 400, message: 'Email, password, first name, and last name are required' };
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email_verified: true },
  });

  if (existingUser) {
    if (existingUser.email_verified) {
      throw { statusCode: 400, message: 'User already exists with this email address' };
    }

    // Resend verification
    const { code, hashedCode, expiresAt } = generate2FACode();
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        verification_token: hashedCode,
        verification_token_expires: expiresAt,
        updated_at: new Date(),
      },
    });

    await emailService.sendVerificationEmail(email.toLowerCase(), code, firstName);

    return {
      success: true,
      requiresVerification: true,
      userId: existingUser.id,
      message: 'Verification code sent to your email',
    };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Generate verification code
  const { code, hashedCode, expiresAt } = generate2FACode();

  // Create user
  const newUser = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      department: department || null,
      job_title: jobTitle || null,
      role: 'user',
      is_active: true,
      email_verified: false,
      verification_token: hashedCode,
      verification_token_expires: expiresAt,
    },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      role: true,
    },
  });

  // Send verification email
  try {
    await emailService.sendVerificationEmail(newUser.email, code, newUser.first_name);
  } catch (emailError) {
    // Rollback user creation
    await prisma.user.delete({ where: { id: newUser.id } });
    throw {
      statusCode: 500,
      message: 'Failed to send verification email. Please try again.',
    };
  }

  return {
    success: true,
    requiresVerification: true,
    userId: newUser.id,
    message: 'Registration successful! Please check your email for verification code.',
  };
};

/**
 * Login user
 */
const loginUser = async ({ email, password, rememberMe, ipAddress, userAgent }) => {
  if (!email || !password) {
    throw { statusCode: 400, message: 'Email and password are required' };
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      password_hash: true,
      first_name: true,
      last_name: true,
      role: true,
      department: true,
      job_title: true,
      is_active: true,
      email_verified: true,
      failed_login_attempts: true,
      account_locked_until: true,
      is_2fa_enabled: true,
    },
  });

  if (!user) {
    throw { statusCode: 401, message: 'Invalid email or password' };
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    // Increment failed attempts
    const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
    let lockUntil = null;

    if (newFailedAttempts >= 5) {
      lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failed_login_attempts: newFailedAttempts,
        account_locked_until: lockUntil,
        updated_at: new Date(),
      },
    });

    throw {
      statusCode: 401,
      message: lockUntil
        ? 'Too many failed attempts. Account locked for 15 minutes.'
        : 'Incorrect password.',
    };
  }

  // Check verification
  if (!user.email_verified) {
    throw {
      statusCode: 403,
      message: 'Please verify your email address first.',
      requiresVerification: true,
      userId: user.id,
    };
  }

  // Check if account is locked
  if (user.account_locked_until && new Date() < user.account_locked_until) {
    const minutesLeft = Math.ceil((user.account_locked_until - new Date()) / 60000);
    throw {
      statusCode: 423,
      message: `Account is locked. Try again in ${minutesLeft} minutes`,
    };
  }

  // Check if account is active
  if (!user.is_active) {
    throw { statusCode: 401, message: 'Account is deactivated' };
  }

  // Handle 2FA
  if (user.is_2fa_enabled) {
    const { code, hashedCode, expiresAt } = generate2FACode();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        two_factor_code: hashedCode,
        two_factor_code_expires: expiresAt,
        updated_at: new Date(),
      },
    });

    await emailService.send2FACode(user.email, code, user.first_name);

    return {
      success: true,
      requiresVerification: true,
      message: 'Verification code sent to your email',
      userId: user.id,
      rememberMe: rememberMe || false,
    };
  }

  // Reset failed attempts
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failed_login_attempts: 0,
      account_locked_until: null,
      last_login: new Date(),
      updated_at: new Date(),
    },
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role, rememberMe);

  // Create session
  await prisma.userSession.create({
    data: {
      user_id: user.id,
      session_token: accessToken,
      refresh_token: refreshToken,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return {
    success: true,
    message: 'Login successful',
    token: accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role,
      department: user.department,
      job_title: user.job_title,
    },
  };
};

/**
 * Verify email with code
 */
const verifyEmail = async (userId, code) => {
  if (!userId || !code) {
    throw { statusCode: 400, message: 'User ID and verification code are required' };
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    select: {
      id: true,
      email: true,
      first_name: true,
      verification_token: true,
      verification_token_expires: true,
      email_verified: true,
    },
  });

  if (!user) {
    throw { statusCode: 404, message: 'User not found' };
  }

  if (user.email_verified) {
    throw { statusCode: 400, message: 'Email already verified' };
  }

  // Verify code
  const { verify2FACode } = require('../utils/twoFactorAuth');
  const verification = verify2FACode(
    code,
    user.verification_token,
    user.verification_token_expires
  );

  if (!verification.valid) {
    let message = 'Invalid or expired verification code';
    if (verification.reason === 'EXPIRED') {
      message = 'Verification code has expired. Please request a new one';
    }
    throw { statusCode: 400, message };
  }

  // Mark as verified
  await prisma.user.update({
    where: { id: user.id },
    data: {
      email_verified: true,
      verification_token: null,
      verification_token_expires: null,
      updated_at: new Date(),
    },
  });

  return {
    success: true,
    message: 'Email verified successfully! You can now login.',
  };
};

/**
 * Resend verification code
 */
const resendVerificationCode = async (userId) => {
  if (!userId) {
    throw { statusCode: 400, message: 'User ID is required' };
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    select: {
      id: true,
      email: true,
      first_name: true,
      email_verified: true,
      verification_token_expires: true,
    },
  });

  if (!user) {
    throw { statusCode: 404, message: 'User not found' };
  }

  if (user.email_verified) {
    throw { statusCode: 400, message: 'Email already verified' };
  }

  // Rate limiting
  if (user.verification_token_expires) {
    const lastSent = new Date(user.verification_token_expires).getTime() - 10 * 60 * 1000;
    const thirtySecondsAgo = Date.now() - 30 * 1000;

    if (lastSent > thirtySecondsAgo) {
      const secondsLeft = Math.ceil((lastSent - thirtySecondsAgo) / 1000);
      throw {
        statusCode: 429,
        message: `Please wait ${secondsLeft} seconds before requesting a new code`,
      };
    }
  }

  // Generate new code
  const { code, hashedCode, expiresAt } = generate2FACode();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verification_token: hashedCode,
      verification_token_expires: expiresAt,
      updated_at: new Date(),
    },
  });

  await emailService.sendVerificationEmail(user.email, code, user.first_name);

  return {
    success: true,
    message: 'A new verification code has been sent to your email',
  };
};

/**
 * Check if user exists by email
 */
const checkUserExists = async (email) => {
  if (!email) {
    throw { statusCode: 400, message: 'Email is required' };
  }

  // Validate email domain
  const allowedDomain = '@securemaxtech.com';
  if (!email.toLowerCase().endsWith(allowedDomain)) {
    throw {
      statusCode: 400,
      message: 'Email must be from securemaxtech.com domain',
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      department: true,
      job_title: true,
      role: true,
      email_verified: true,
      is_active: true,
    },
  });

  return {
    success: true,
    exists: !!user,
    user: user
      ? {
          id: user.id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          firstName: user.first_name,
          lastName: user.last_name,
          department: user.department,
          jobTitle: user.job_title,
          role: user.role,
          emailVerified: user.email_verified,
          isActive: user.is_active,
        }
      : null,
  };
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationCode,
  checkUserExists,
};
