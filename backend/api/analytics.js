/**
 * Analytics API Endpoint
 * Handles user activity tracking and analytics retrieval
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/analytics
 * Get analytics data for authenticated user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    // Calculate date range
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[timeRange] || 7;
    
    // Get API usage stats
    const apiUsageResult = await pool.query(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as requests,
         COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
         COUNT(CASE WHEN status = 'error' THEN 1 END) as failed
       FROM api_logs 
       WHERE user_id = $1 
         AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [req.user.id]
    );

    // Get total usage summary
    const summaryResult = await pool.query(
      `SELECT 
         COUNT(*) as total_requests,
         COUNT(CASE WHEN status = 'success' THEN 1 END) as total_successful,
         COUNT(CASE WHEN status = 'error' THEN 1 END) as total_failed,
         AVG(response_time) as avg_response_time
       FROM api_logs 
       WHERE user_id = $1 
         AND created_at >= CURRENT_DATE - INTERVAL '${days} days'`,
      [req.user.id]
    );

    // Get endpoint breakdown
    const endpointsResult = await pool.query(
      `SELECT 
         endpoint,
         COUNT(*) as count,
         AVG(response_time) as avg_response_time
       FROM api_logs 
       WHERE user_id = $1 
         AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY endpoint
       ORDER BY count DESC
       LIMIT 10`,
      [req.user.id]
    );

    res.json({
      success: true,
      analytics: {
        timeRange,
        summary: summaryResult.rows[0] || {},
        dailyUsage: apiUsageResult.rows,
        topEndpoints: endpointsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data'
    });
  }
});

/**
 * POST /api/analytics/track
 * Track custom analytics events
 */
router.post('/track', authenticateToken, async (req, res) => {
  try {
    const { event, metadata = {} } = req.body;

    if (!event) {
      return res.status(400).json({
        success: false,
        message: 'Event name is required'
      });
    }

    await pool.query(
      `INSERT INTO analytics_events (user_id, event, metadata) 
       VALUES ($1, $2, $3)`,
      [req.user.id, event, JSON.stringify(metadata)]
    );

    res.json({
      success: true,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track event'
    });
  }
});

/**
 * GET /api/analytics/overview
 * Get high-level overview stats
 */
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const overviewResult = await pool.query(
      `SELECT 
         (SELECT COUNT(*) FROM api_logs WHERE user_id = $1) as total_api_calls,
         (SELECT COUNT(*) FROM projects WHERE user_id = $1) as total_projects,
         (SELECT COUNT(*) FROM workflows WHERE user_id = $1) as total_workflows,
         (SELECT created_at FROM users WHERE id = $1) as member_since`,
      [req.user.id]
    );

    res.json({
      success: true,
      overview: overviewResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overview data'
    });
  }
});

module.exports = router;
