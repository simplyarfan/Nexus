/**
 * Consolidated CV Intelligence Routes
 * Handles all /api/cv-intelligence/* endpoints in a single serverless function
 *
 * Routes:
 * - GET /api/cv-intelligence/batches - List all CV analysis batches
 * - GET /api/cv-intelligence/batch/[id] - Get batch details with candidates
 * - DELETE /api/cv-intelligence/batch/[id] - Delete batch and all candidates
 * - GET /api/cv-intelligence/candidate/[id] - Get candidate details with evidence
 */

const { withProtectedRoute } = require('../middleware/serverless');
const {
  getUserBatches,
  getBatchById,
  deleteBatch,
  getCandidateById,
} = require('../services/cv.service');

async function handler(req, res) {
  const { method } = req;
  const userId = req.user.userId;
  const path = req.url.replace('/api/cv-intelligence', '').split('?')[0];

  // GET /api/cv-intelligence/batches - List all batches
  if (path === '/batches' && method === 'GET') {
    try {
      const batches = await getUserBatches(userId);

      return res.status(200).json({
        success: true,
        data: batches,
        message: 'CV batches retrieved successfully',
      });
    } catch (error) {
      console.error('Get batches error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve batches',
      });
    }
  }

  // Routes with /batch/[id]
  const batchIdMatch = path.match(/^\/batch\/(.+)/);
  if (batchIdMatch) {
    const batchId = batchIdMatch[1];

    // GET /api/cv-intelligence/batch/[id]
    if (method === 'GET') {
      try {
        const result = await getBatchById(batchId, userId);

        return res.status(200).json({
          success: true,
          data: result,
          message: 'Batch details retrieved successfully',
        });
      } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
          success: false,
          message: error.message || 'Failed to retrieve batch details',
        });
      }
    }

    // DELETE /api/cv-intelligence/batch/[id]
    if (method === 'DELETE') {
      try {
        const result = await deleteBatch(batchId, userId);

        return res.status(200).json({
          success: true,
          message: 'Batch and all associated candidates deleted successfully',
          data: result,
        });
      } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
          success: false,
          message: error.message || 'Failed to delete batch',
        });
      }
    }
  }

  // Routes with /candidate/[id]
  const candidateIdMatch = path.match(/^\/candidate\/(.+)/);
  if (candidateIdMatch && method === 'GET') {
    const candidateId = candidateIdMatch[1];

    try {
      const candidate = await getCandidateById(candidateId);

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

  return res.status(404).json({
    success: false,
    message: `Route not found: ${method} ${path}`,
  });
}

module.exports = withProtectedRoute(handler);
