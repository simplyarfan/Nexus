/**
 * POST /api/auth/register
 * User registration endpoint (serverless function)
 */

const { withMiddleware } = require('../../middleware/serverless');
const { registerUser } = require('../../services/auth.service');

async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    const { email, password, firstName, lastName, department, jobTitle } = req.body;

    const result = await registerUser({
      email,
      password,
      firstName,
      lastName,
      department,
      jobTitle,
    });

    return res.status(201).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = withMiddleware(handler);
