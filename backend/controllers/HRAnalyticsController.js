const database = require('../models/database');

class HRAnalyticsController {
  /**
   * Get date range filter SQL condition based on query parameter
   */
  static getDateRangeCondition(dateRange, dateColumn = 'created_at') {
    switch (dateRange) {
      case '7d':
        return `${dateColumn} >= CURRENT_DATE - INTERVAL '7 days'`;
      case '30d':
        return `${dateColumn} >= CURRENT_DATE - INTERVAL '30 days'`;
      case '90d':
        return `${dateColumn} >= CURRENT_DATE - INTERVAL '90 days'`;
      case 'all':
      default:
        return '1=1'; // No filter
    }
  }

  /**
   * Get all recruitment users with their interview statistics
   */
  static async getHRUserStats(req, res) {
    try {
      await database.connect();

      const { dateRange = 'all' } = req.query;
      const dateCondition = HRAnalyticsController.getDateRangeCondition(dateRange, 'i.created_at');

      // Get recruitment users (Recruitment department + superadmins) with interview stats
      const stats = await database.all(`
        SELECT
          u.id as user_id,
          u.first_name,
          u.last_name,
          u.email,
          u.department,
          u.role,
          COUNT(i.id) as total_interviews,
          COUNT(CASE WHEN i.status = 'completed' THEN 1 END) as completed_interviews,
          COUNT(CASE WHEN i.outcome = 'selected' THEN 1 END) as selected_count,
          COUNT(CASE WHEN i.outcome = 'rejected' THEN 1 END) as rejected_count,
          COUNT(CASE WHEN i.status = 'scheduled' THEN 1 END) as pending_interviews,
          COUNT(CASE WHEN i.status = 'awaiting_response' THEN 1 END) as awaiting_response
        FROM users u
        LEFT JOIN interviews i ON u.id = i.scheduled_by AND (${dateCondition})
        WHERE (u.department IN ('Recruitment', 'HR', 'Human Resources') OR u.role = 'superadmin')
          AND u.is_active = true
        GROUP BY u.id, u.first_name, u.last_name, u.email, u.department, u.role
        ORDER BY COUNT(i.id) DESC
      `);

      // Calculate summary totals
      const summary = stats.reduce(
        (acc, user) => ({
          total_hr_users: acc.total_hr_users + 1,
          total_interviews: acc.total_interviews + parseInt(user.total_interviews || 0),
          total_completed: acc.total_completed + parseInt(user.completed_interviews || 0),
          total_selected: acc.total_selected + parseInt(user.selected_count || 0),
          total_rejected: acc.total_rejected + parseInt(user.rejected_count || 0),
          total_pending: acc.total_pending + parseInt(user.pending_interviews || 0),
        }),
        {
          total_hr_users: 0,
          total_interviews: 0,
          total_completed: 0,
          total_selected: 0,
          total_rejected: 0,
          total_pending: 0,
        },
      );

      // Calculate overall selection rate
      const totalDecided = summary.total_selected + summary.total_rejected;
      summary.overall_selection_rate =
        totalDecided > 0 ? Math.round((summary.total_selected / totalDecided) * 100 * 10) / 10 : 0;

      res.json({
        success: true,
        data: {
          users: stats.map((u) => {
            const selected = parseInt(u.selected_count) || 0;
            const rejected = parseInt(u.rejected_count) || 0;
            const decided = selected + rejected;

            return {
              user_id: u.user_id,
              first_name: u.first_name,
              last_name: u.last_name,
              email: u.email,
              department: u.department,
              role: u.role,
              total_interviews: parseInt(u.total_interviews) || 0,
              completed_interviews: parseInt(u.completed_interviews) || 0,
              selected_count: selected,
              rejected_count: rejected,
              pending_interviews: parseInt(u.pending_interviews) || 0,
              awaiting_response: parseInt(u.awaiting_response) || 0,
              selection_rate: decided > 0 ? Math.round((selected / decided) * 100 * 10) / 10 : 0,
            };
          }),
          summary,
          dateRange,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch HR user statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get selection/rejection chart data for visualizations
   */
  static async getOutcomeStats(req, res) {
    try {
      await database.connect();

      const { dateRange = 'all' } = req.query;
      const dateCondition = HRAnalyticsController.getDateRangeCondition(dateRange, 'i.created_at');

      // Get chart data: selection/rejection counts per HR user
      const chartData = await database.all(`
        SELECT
          u.id as user_id,
          u.first_name || ' ' || u.last_name as name,
          COUNT(CASE WHEN i.outcome = 'selected' THEN 1 END) as selected,
          COUNT(CASE WHEN i.outcome = 'rejected' THEN 1 END) as rejected
        FROM users u
        INNER JOIN interviews i ON u.id = i.scheduled_by
        WHERE i.outcome IS NOT NULL
          AND (${dateCondition})
          AND (u.department IN ('Recruitment', 'HR', 'Human Resources') OR u.role = 'superadmin')
        GROUP BY u.id, u.first_name, u.last_name
        HAVING COUNT(CASE WHEN i.outcome IS NOT NULL THEN 1 END) > 0
        ORDER BY COUNT(i.id) DESC
      `);

      // Calculate totals for pie chart
      const totals = chartData.reduce(
        (acc, u) => ({
          selected: acc.selected + parseInt(u.selected || 0),
          rejected: acc.rejected + parseInt(u.rejected || 0),
        }),
        { selected: 0, rejected: 0 },
      );

      res.json({
        success: true,
        data: {
          chartData: chartData.map((u) => ({
            user_id: u.user_id,
            name: u.name,
            selected: parseInt(u.selected) || 0,
            rejected: parseInt(u.rejected) || 0,
          })),
          totals,
          dateRange,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch outcome statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get candidates interviewed by a specific HR user
   */
  static async getCandidatesByInterviewer(req, res) {
    try {
      const { user_id } = req.params;
      const { page = 1, limit = 20, dateRange = 'all' } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      await database.connect();

      // Verify user exists and is Recruitment/superadmin
      const interviewer = await database.get(
        `SELECT id, first_name, last_name, department, role
         FROM users
         WHERE id = $1 AND (department IN ('Recruitment', 'HR', 'Human Resources') OR role = 'superadmin')`,
        [user_id],
      );

      if (!interviewer) {
        return res.status(404).json({
          success: false,
          message: 'User not found or not authorized',
        });
      }

      const dateCondition = HRAnalyticsController.getDateRangeCondition(dateRange, 'created_at');

      // Get total count
      const countResult = await database.get(
        `SELECT COUNT(*) as total
         FROM interviews
         WHERE scheduled_by = $1 AND (${dateCondition})`,
        [user_id],
      );

      // Get paginated candidates/interviews
      const candidates = await database.all(
        `
        SELECT
          id as interview_id,
          candidate_id,
          candidate_name,
          candidate_email,
          job_title,
          interview_type,
          status,
          outcome,
          scheduled_time,
          notes,
          created_at
        FROM interviews
        WHERE scheduled_by = $1 AND (${dateCondition})
        ORDER BY scheduled_time DESC NULLS LAST, created_at DESC
        LIMIT $2 OFFSET $3
      `,
        [user_id, parseInt(limit), offset],
      );

      const total = parseInt(countResult?.total) || 0;

      res.json({
        success: true,
        data: {
          interviewer: {
            id: interviewer.id,
            name: `${interviewer.first_name} ${interviewer.last_name}`,
            department: interviewer.department,
            role: interviewer.role,
          },
          candidates,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
          },
          dateRange,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch candidates',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get all interviews with interviewer details (for table view)
   */
  static async getAllInterviews(req, res) {
    try {
      const { page = 1, limit = 20, dateRange = 'all', userId } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      await database.connect();

      const dateCondition = HRAnalyticsController.getDateRangeCondition(dateRange, 'i.created_at');
      const userCondition = userId ? 'AND i.scheduled_by = $4' : '';

      // Build query with optional user filter
      const params = userId
        ? [parseInt(limit), offset, userId]
        : [parseInt(limit), offset];

      // Get total count
      const countQuery = userId
        ? `SELECT COUNT(*) as total FROM interviews i WHERE (${dateCondition}) AND i.scheduled_by = $1`
        : `SELECT COUNT(*) as total FROM interviews i WHERE (${dateCondition})`;

      const countResult = await database.get(
        countQuery,
        userId ? [userId] : [],
      );

      // Get interviews with interviewer info
      const interviews = await database.all(
        `
        SELECT
          i.id as interview_id,
          i.candidate_id,
          i.candidate_name,
          i.candidate_email,
          i.job_title,
          i.interview_type,
          i.status,
          i.outcome,
          i.scheduled_time,
          i.created_at,
          u.id as interviewer_id,
          u.first_name || ' ' || u.last_name as interviewer_name,
          u.email as interviewer_email
        FROM interviews i
        LEFT JOIN users u ON i.scheduled_by = u.id
        WHERE (${dateCondition}) ${userId ? 'AND i.scheduled_by = $3' : ''}
        ORDER BY i.scheduled_time DESC NULLS LAST, i.created_at DESC
        LIMIT $1 OFFSET $2
      `,
        params,
      );

      const total = parseInt(countResult?.total) || 0;

      res.json({
        success: true,
        data: {
          interviews,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
          },
          dateRange,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch interviews',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

module.exports = HRAnalyticsController;
