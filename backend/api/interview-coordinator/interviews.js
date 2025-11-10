/**
 * Interview Coordinator - Interviews List
 * GET /api/interview-coordinator/interviews - List all interviews
 */

const { withProtectedRoute } = require('../../middleware/serverless');
const fs = require('fs').promises;
const path = require('path');

const INTERVIEWS_FILE = path.join(process.cwd(), 'interviews.json');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

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
    console.error('Get interviews error:', error);
    
    // If file doesn't exist, return empty array
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

module.exports = withProtectedRoute(handler);
