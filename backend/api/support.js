/**
 * Support Ticket API Endpoint
 * Handles support ticket creation, updates, and retrieval
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/support
 * Get all support tickets for authenticated user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, subject, description, status, priority, created_at, updated_at 
       FROM support_tickets 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      tickets: result.rows
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support tickets'
    });
  }
});

/**
 * POST /api/support
 * Create a new support ticket
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { subject, description, priority = 'medium' } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Subject and description are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO support_tickets (user_id, subject, description, priority, status) 
       VALUES ($1, $2, $3, $4, 'open') 
       RETURNING id, subject, description, status, priority, created_at`,
      [req.user.id, subject, description, priority]
    );

    res.status(201).json({
      success: true,
      ticket: result.rows[0],
      message: 'Support ticket created successfully'
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create support ticket'
    });
  }
});

/**
 * PATCH /api/support/:ticketId
 * Update support ticket status
 */
router.patch('/:ticketId', authenticateToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const result = await pool.query(
      `UPDATE support_tickets 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 AND user_id = $3 
       RETURNING id, subject, status, updated_at`,
      [status, ticketId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found or unauthorized'
      });
    }

    res.json({
      success: true,
      ticket: result.rows[0],
      message: 'Ticket updated successfully'
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update support ticket'
    });
  }
});

module.exports = router;
