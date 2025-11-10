/**
 * Interview Coordinator - Single Interview
 * GET /api/interview-coordinator/interview/:id - Get interview details by ID
 */

const { withProtectedRoute } = require('../../../middleware/serverless');
const fs = require('fs').promises;
const path = require('path');

const INTERVIEWS_FILE = path.join(process.cwd(), 'interviews.json');

async function handler(req, res) {
  const { method, query } = req;
  const interviewId = query.id;

  if (!interviewId) {
    return res.status(400).json({
      success: false,
      message: 'Interview ID is required',
    });
  }

  if (method === 'GET') {
    try {
      // Read interviews from JSON file
      const fileData = await fs.readFile(INTERVIEWS_FILE, 'utf-8');
      const interviews = JSON.parse(fileData);

      // Find interview by ID
      const interview = interviews.find((int) => int.id === interviewId);

      if (!interview) {
        return res.status(404).json({
          success: false,
          message: 'Interview not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          interview,
        },
      });
    } catch (error) {
      console.error('Get interview error:', error);

      // If file doesn't exist
      if (error.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          message: 'Interview not found',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to fetch interview',
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed',
  });
}

module.exports = withProtectedRoute(handler);
