/**
 * /api/cv-intelligence/batch/[id]
 * GET - Get batch details with candidates
 * DELETE - Delete batch and all candidates
 */

const { withProtectedRoute } = require('../../../middleware/serverless');
const { getBatchById, deleteBatch } = require('../../../services/cv.service');

async function handler(req, res) {
  const { id } = req.query; // Vercel provides route params in query
  const userId = req.user.userId;

  // GET - Batch details
  if (req.method === 'GET') {
    try {
      const result = await getBatchById(id, userId);

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

  // DELETE - Remove batch
  if (req.method === 'DELETE') {
    try {
      const result = await deleteBatch(id, userId);

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

  // Method not allowed
  return res.status(405).json({
    success: false,
    message: 'Method not allowed',
  });
}

module.exports = withProtectedRoute(handler);
