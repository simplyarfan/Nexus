/**
 * Consolidated Interview Coordinator Routes
 * Handles all /api/interview-coordinator/* endpoints in a single serverless function
 *
 * Routes:
 * - GET /api/interview-coordinator/interviews - List all interviews
 * - GET /api/interview-coordinator/interview/[id] - Get interview details
 */

const { withProtectedRoute } = require('../middleware/serverless');
const fs = require('fs').promises;
const path = require('path');

const INTERVIEWS_FILE = path.join(process.cwd(), 'interviews.json');

async function handler(req, res) {
  const { method } = req;
  const routePath = req.url.replace('/api/interview-coordinator', '').split('?')[0];

  // GET /api/interview-coordinator/interviews - List all interviews
  if (routePath === '/interviews' && method === 'GET') {
    try {
      // Read interviews from JSON file
      const fileData = await fs.readFile(INTERVIEWS_FILE, 'utf-8');
      const interviews = JSON.parse(fileData);

      // Optional: filter by status if query param provided
      const { status } = req.query;
      const filteredInterviews = status
        ? interviews.filter((interview) => interview.status === status)
        : interviews;

      return res.status(200).json({
        success: true,
        data: {
          interviews: filteredInterviews,
          count: filteredInterviews.length,
        },
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(200).json({
          success: true,
          data: {
            interviews: [],
            count: 0,
          },
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to fetch interviews',
      });
    }
  }

  // GET /api/interview-coordinator/interview/[id] - Get single interview
  const interviewIdMatch = routePath.match(/^\/interview\/(.+)/);
  if (interviewIdMatch && method === 'GET') {
    const interviewId = interviewIdMatch[1];

    if (!interviewId) {
      return res.status(400).json({
        success: false,
        message: 'Interview ID is required',
      });
    }

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

  return res.status(404).json({
    success: false,
    message: `Route not found: ${method} ${routePath}`,
  });
}

module.exports = withProtectedRoute(handler);
