/**
 * /api/cv-intelligence/candidate/[id]
 * GET - Get candidate details with evidence
 */

const { withProtectedRoute } = require('../../../middleware/serverless');
const { getCandidateById } = require('../../../services/cv.service');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    const { id } = req.query; // Vercel provides route params in query
    const candidate = await getCandidateById(id);

    return res.status(200).json({
      success: true,
      data: { candidate },
      message: 'Candidate details retrieved successfully',
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to retrieve candidate details',
    });
  }
}

module.exports = withProtectedRoute(handler);
