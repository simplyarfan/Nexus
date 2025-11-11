const database = require('../models/database');

class AnalyticsController {
  // Get dashboard overview statistics
  static async getDashboard(req, res) {
    try {
      console.log('📊 [ANALYTICS] Dashboard request received');

      // Ensure database connection
      await database.connect();
      console.log('✅ [ANALYTICS] Database connected');

      // Get basic statistics
      const stats = await database.get(`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM users WHERE last_login >= CURRENT_DATE - INTERVAL '30 days') as active_users,
          (SELECT COUNT(*) FROM cv_batches) as total_batches,
          (SELECT COUNT(*) FROM support_tickets) as total_tickets,
          (SELECT COUNT(*) FROM support_tickets WHERE status = 'open') as open_tickets
      `);

      // Get recent activity
      const recentActivity = await database.all(`
        SELECT 
          'User Registration' as action,
          (first_name || ' ' || last_name) as details,
          created_at as timestamp
        FROM users 
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY created_at DESC 
        LIMIT 5
      `);

      const dashboardData = {
        totalUsers: parseInt(stats.total_users) || 0,
        activeUsers: parseInt(stats.active_users) || 0,
        totalBatches: parseInt(stats.total_batches) || 0,
        totalTickets: parseInt(stats.total_tickets) || 0,
        openTickets: parseInt(stats.open_tickets) || 0,
        systemHealth: 'Good',
        recentActivity: recentActivity || [],
      };

      console.log('✅ [ANALYTICS] Dashboard data prepared:', dashboardData);

      res.json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      console.error('❌ [ANALYTICS] Dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      });
    }
  }

  // Get user analytics
  static async getUserAnalytics(req, res) {
    try {
      await database.connect();

      const userStats = await database.all(`
        SELECT 
          role,
          COUNT(*) as count,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
        FROM users 
        GROUP BY role
        ORDER BY count DESC
      `);

      res.json({
        success: true,
        data: { userStats },
      });
    } catch (error) {
      console.error('❌ [ANALYTICS] User analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user analytics',
      });
    }
  }

  // Get agent analytics (placeholder)
  static async getAgentAnalytics(req, res) {
    res.json({
      success: true,
      data: {
        message: 'Agent analytics not implemented yet',
        agentUsage: [],
      },
    });
  }

  // Get CV analytics
  static async getCVAnalytics(req, res) {
    try {
      await database.connect();

      const cvStats = await database.get(`
        SELECT 
          COUNT(*) as total_batches,
          SUM(cv_count) as total_cvs_processed,
          SUM(candidate_count) as total_candidates,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_batches
        FROM cv_batches
      `);

      res.json({
        success: true,
        data: cvStats || {},
      });
    } catch (error) {
      console.error('❌ [ANALYTICS] CV analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch CV analytics',
      });
    }
  }

  // Get system analytics
  static async getSystemAnalytics(req, res) {
    try {
      res.json({
        success: true,
        data: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform,
        },
      });
    } catch (error) {
      console.error('❌ [ANALYTICS] System analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch system analytics',
      });
    }
  }

  // Get user activity (placeholder)
  static async getUserActivity(req, res) {
    try {
      const { user_id } = req.params;

      await database.connect();
      const user = await database.get(
        'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
        [user_id],
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        data: {
          user,
          activities: [],
          message: 'User activity tracking not fully implemented yet',
        },
      });
    } catch (error) {
      console.error('❌ [ANALYTICS] User activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user activity',
      });
    }
  }

  // Export analytics (placeholder)
  static async exportAnalytics(req, res) {
    res.json({
      success: true,
      message: 'Analytics export not implemented yet',
    });
  }
}

module.exports = AnalyticsController;
