// Use Neon serverless driver for Vercel compatibility
let Pool;
if (process.env.VERCEL) {
  // On Vercel, use Neon's serverless driver
  const { Pool: NeonPool } = require('@neondatabase/serverless');
  Pool = NeonPool;
} else {
  // Locally, use standard pg driver
  const { Pool: PgPool } = require('pg');
  Pool = PgPool;
}
require('dotenv').config();

// Global flag to prevent reinitialization on every serverless invocation
let GLOBAL_TABLES_INITIALIZED = false;

class Database {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected && this.pool) {
      return this.pool;
    }

    try {
      // Use Vercel's database environment variables
      // IMPORTANT: Prioritize unpooled connections for read-after-write consistency
      // Neon automatically provides these variables:
      // - POSTGRES_URL_NON_POOLING (official Neon unpooled connection)
      // - DATABASE_URL_UNPOOLED (alternative unpooled connection)
      // - DATABASE_URL / POSTGRES_URL (pooled with pgBouncer - causes read-after-write issues)
      const connectionString =
        process.env.POSTGRES_URL_NON_POOLING ||
        process.env.DATABASE_URL_UNPOOLED ||
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL;

      if (!connectionString) {
        throw new Error(
          'No database connection string found. Please set POSTGRES_URL_NON_POOLING, DATABASE_URL_UNPOOLED, DATABASE_URL, or POSTGRES_URL environment variable.',
        );
      }

      const isUnpooled =
        connectionString.includes('UNPOOLED') ||
        connectionString.includes('NON_POOLING') ||
        connectionString.includes('pooler=false') ||
        !connectionString.includes('pooler');

      const connectionType = isUnpooled ? 'UNPOOLED (direct)' : 'POOLED (pgBouncer)';

      console.log('🔌 Connecting to Neon with:', connectionType);
      console.log(
        '📋 Using connection from:',
        process.env.POSTGRES_URL_NON_POOLING
          ? 'POSTGRES_URL_NON_POOLING (Neon official) ✅'
          : process.env.DATABASE_URL_UNPOOLED
            ? 'DATABASE_URL_UNPOOLED ⚠️'
            : 'DATABASE_URL or POSTGRES_URL (pooled) ❌',
      );

      // Connecting to PostgreSQL database

      this.pool = new Pool({
        connectionString,
        ssl: {
          rejectUnauthorized: false,
        },
        max: 1, // Single connection for serverless
        min: 0,
        idleTimeoutMillis: 1000, // Very short for serverless
        connectionTimeoutMillis: 10000, // Shorter timeout
        acquireTimeoutMillis: 10000,
        createTimeoutMillis: 10000,
        destroyTimeoutMillis: 1000,
        allowExitOnIdle: true,
        statement_timeout: 5000, // 5 second query timeout
        query_timeout: 5000,
      });

      // Test connection
      const testResult = await this.pool.query('SELECT NOW() as current_time');
      this.isConnected = true;

      // Initialize tables ONLY ONCE globally (not every request)
      if (!GLOBAL_TABLES_INITIALIZED) {
        const shouldBootstrap = process.env.DB_BOOTSTRAP !== 'false';
        if (shouldBootstrap) {
          console.log('🔧 First connection - checking database schema (DB_BOOTSTRAP enabled)...');
          await this.initializeTables();
        } else {
          console.log('⏭️  DB bootstrap disabled by env (DB_BOOTSTRAP=false)');
        }
        GLOBAL_TABLES_INITIALIZED = true;
      }

      return this.pool;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      console.error('❌ Full error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.pool) {
      try {
        await this.pool.end();
        console.log('🔌 Database connection closed');
        this.pool = null;
        this.isConnected = false;
      } catch (error) {
        console.error('Error closing database:', error.message);
        throw error;
      }
    }
  }

  // Query methods
  async run(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return {
        id: result.rows[0]?.id || null,
        changes: result.rowCount || 0,
        rows: result.rows,
      };
    } catch (error) {
      console.error('Database run error:', error.message, '\nSQL:', sql);
      throw error;
    }
  }

  async get(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Database get error:', error.message, '\nSQL:', sql);
      throw error;
    }
  }

  async all(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows;
    } catch (error) {
      console.error('Database all error:', error.message, '\nSQL:', sql);
      throw error;
    }
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(this);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async initializeTables() {
    try {
      console.log('🔧 Initializing PostgreSQL schema (one-time check)...');

      // Users table
      await this.run(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          department VARCHAR(100),
          job_title VARCHAR(100),
          is_active BOOLEAN DEFAULT true,
          is_verified BOOLEAN DEFAULT false,
          verification_token VARCHAR(255),
          verification_expiry TIMESTAMP,
          reset_token VARCHAR(255),
          reset_token_expiry TIMESTAMP,
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Add missing columns if they don't exist
      try {
        await this.run(
          'ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0',
        );
        await this.run('ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP');
        await this.run('ALTER TABLE users ADD COLUMN IF NOT EXISTS outlook_access_token TEXT');
        await this.run('ALTER TABLE users ADD COLUMN IF NOT EXISTS outlook_refresh_token TEXT');
        await this.run(
          'ALTER TABLE users ADD COLUMN IF NOT EXISTS outlook_token_expires_at TIMESTAMP',
        );
        await this.run('ALTER TABLE users ADD COLUMN IF NOT EXISTS outlook_email VARCHAR(255)');
        await this.run('ALTER TABLE users ADD COLUMN IF NOT EXISTS outlook_pkce_verifier TEXT');

        // 2FA columns
        await this.run(
          'ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE',
        );
        await this.run('ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255)');
        await this.run('ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_code VARCHAR(10)');
        await this.run(
          'ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_code_expires_at TIMESTAMP',
        );

        // Google Calendar columns
        await this.run('ALTER TABLE users ADD COLUMN IF NOT EXISTS google_access_token TEXT');
        await this.run('ALTER TABLE users ADD COLUMN IF NOT EXISTS google_refresh_token TEXT');
        await this.run(
          'ALTER TABLE users ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMP',
        );
      } catch (error) {
        // Columns already exist
      }

      // Create indexes (IF NOT EXISTS is safe but slow - only runs once)
      await this.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)');
      await this.run('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
      await this.run('CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)');
      console.log('✅ User table indexes verified');

      // User sessions table
      await this.run(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          session_token VARCHAR(255) UNIQUE NOT NULL,
          refresh_token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Create essential indexes only
      await this.run(
        'CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)',
      );
      await this.run(
        'CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at)',
      );
      console.log('✅ User sessions indexes verified');

      // User preferences table
      await this.run(`
        CREATE TABLE IF NOT EXISTS user_preferences (
          id SERIAL PRIMARY KEY,
          user_id INTEGER UNIQUE NOT NULL,
          theme VARCHAR(20) DEFAULT 'light',
          notifications_email BOOLEAN DEFAULT true,
          notifications_browser BOOLEAN DEFAULT true,
          language VARCHAR(10) DEFAULT 'en',
          timezone VARCHAR(50) DEFAULT 'UTC',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // User analytics table
      await this.run(`
        CREATE TABLE IF NOT EXISTS user_analytics (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          action VARCHAR(100) NOT NULL,
          agent_id VARCHAR(100),
          metadata JSONB,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
        )
      `);

      // Agent usage stats table
      await this.run(`
        CREATE TABLE IF NOT EXISTS agent_usage_stats (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          agent_id VARCHAR(100) NOT NULL,
          usage_count INTEGER DEFAULT 0,
          total_time_spent INTEGER DEFAULT 0,
          date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(user_id, agent_id, date)
        )
      `);

      // SIMPLIFIED CV INTELLIGENCE SCHEMA - NO FOREIGN KEY CONSTRAINTS
      // This will prevent the foreign key constraint errors

      console.log('🔧 Creating simplified CV Intelligence tables...');

      // Simple CV batches table
      await this.run(`
        CREATE TABLE IF NOT EXISTS cv_batches (
          id VARCHAR(255) PRIMARY KEY,
          user_id INTEGER NOT NULL,
          name VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'processing',
          total_resumes INTEGER DEFAULT 0,
          processed_resumes INTEGER DEFAULT 0,
          jd_requirements TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create essential indexes only
      await this.run('CREATE INDEX IF NOT EXISTS idx_cv_batches_user_id ON cv_batches(user_id)');
      await this.run('CREATE INDEX IF NOT EXISTS idx_cv_batches_status ON cv_batches(status)');
      console.log('✅ CV batches indexes verified');

      // Add jd_requirements column if it doesn't exist (for existing databases)
      try {
        await this.run('ALTER TABLE cv_batches ADD COLUMN jd_requirements TEXT');
      } catch (e) {
        // Column already exists, ignore error
      }

      // Simple candidates table
      await this.run(`
        CREATE TABLE IF NOT EXISTS candidates (
          id VARCHAR(255) PRIMARY KEY,
          batch_id VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(50),
          location VARCHAR(255),
          profile_json TEXT,
          overall_score INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create essential indexes only
      await this.run('CREATE INDEX IF NOT EXISTS idx_candidates_batch_id ON candidates(batch_id)');
      console.log('✅ Candidates indexes verified');

      // Support tickets table
      await this.run(`
        CREATE TABLE IF NOT EXISTS support_tickets (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          subject VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          status VARCHAR(50) DEFAULT 'open',
          priority VARCHAR(20) DEFAULT 'medium',
          category VARCHAR(50) DEFAULT 'general',
          assigned_to INTEGER,
          resolution TEXT,
          resolved_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (assigned_to) REFERENCES users (id) ON DELETE SET NULL
        )
      `);

      // Create essential indexes only
      await this.run(
        'CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id)',
      );
      await this.run(
        'CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status)',
      );
      console.log('✅ Support tickets indexes verified');

      // Ticket comments table
      await this.run(`
        CREATE TABLE IF NOT EXISTS ticket_comments (
          id SERIAL PRIMARY KEY,
          ticket_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          comment TEXT NOT NULL,
          is_internal BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ticket_id) REFERENCES support_tickets (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Notifications table
      await this.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          metadata JSON,
          is_read BOOLEAN DEFAULT false,
          read_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // System settings table
      await this.run(`
        CREATE TABLE IF NOT EXISTS system_settings (
          id SERIAL PRIMARY KEY,
          key VARCHAR(100) UNIQUE NOT NULL,
          value TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Interview Coordinator tables (HR-02)
      console.log('🔧 Creating Interview Coordinator tables...');

      await this.run(`
        CREATE TABLE IF NOT EXISTS interviews (
          id VARCHAR(255) PRIMARY KEY,
          candidate_id VARCHAR(255) NOT NULL,
          candidate_name VARCHAR(255) NOT NULL,
          candidate_email VARCHAR(255) NOT NULL,
          job_title VARCHAR(255) NOT NULL,
          interview_type VARCHAR(50) DEFAULT 'technical',
          status VARCHAR(50) DEFAULT 'scheduled',
          scheduled_time TIMESTAMP,
          duration INTEGER DEFAULT 60,
          location VARCHAR(255) DEFAULT 'Video Call',
          meeting_link TEXT,
          calendly_link TEXT,
          google_form_link TEXT,
          panel_members TEXT,
          generated_questions TEXT,
          notes TEXT,
          scheduled_by INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.run(
        'CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_by ON interviews(scheduled_by)',
      );
      await this.run(
        'CREATE INDEX IF NOT EXISTS idx_interviews_candidate_email ON interviews(candidate_email)',
      );
      await this.run(
        'CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_time ON interviews(scheduled_time)',
      );
      await this.run('CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status)');

      // Add missing columns if they don't exist
      try {
        await this.run('ALTER TABLE interviews ADD COLUMN IF NOT EXISTS platform VARCHAR(100)');
        await this.run('ALTER TABLE interviews ADD COLUMN IF NOT EXISTS outcome VARCHAR(50)');
        await this.run('ALTER TABLE interviews ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP');
        await this.run('ALTER TABLE interviews ADD COLUMN IF NOT EXISTS cv_file_path TEXT');
        await this.run(
          'ALTER TABLE interviews ADD COLUMN IF NOT EXISTS teams_meeting_id VARCHAR(255)',
        );
        console.log('✅ Added missing columns to interviews table');
      } catch (error) {
        console.log('ℹ️  Interview columns already exist or error:', error.message);
      }

      await this.run(`
        CREATE TABLE IF NOT EXISTS interview_reminders (
          id VARCHAR(255) PRIMARY KEY,
          interview_id VARCHAR(255) NOT NULL,
          reminder_type VARCHAR(50) NOT NULL,
          recipient_email VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          send_at TIMESTAMP NOT NULL,
          sent BOOLEAN DEFAULT FALSE,
          sent_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
        )
      `);

      await this.run(
        'CREATE INDEX IF NOT EXISTS idx_interview_reminders_interview_id ON interview_reminders(interview_id)',
      );
      await this.run(
        'CREATE INDEX IF NOT EXISTS idx_interview_reminders_send_at ON interview_reminders(send_at)',
      );
      await this.run(
        'CREATE INDEX IF NOT EXISTS idx_interview_reminders_sent ON interview_reminders(sent)',
      );

      console.log('✅ Interview Coordinator tables initialized successfully');

      // ============================================
      // PERFORMANCE OPTIMIZATION INDEXES
      // ============================================
      console.log('🔧 Creating performance optimization indexes...');

      // Support tickets performance indexes
      await this.run(
        'CREATE INDEX IF NOT EXISTS idx_tickets_status_created ON support_tickets(status, created_at DESC)',
      );
      await this.run(
        'CREATE INDEX IF NOT EXISTS idx_tickets_priority_status ON support_tickets(priority, status)',
      );
      await this.run(
        'CREATE INDEX IF NOT EXISTS idx_tickets_user_status ON support_tickets(user_id, status)',
      );
      console.log('✅ Support tickets performance indexes created');

      // Comments performance indexes
      await this.run(
        'CREATE INDEX IF NOT EXISTS idx_comments_ticket_created ON ticket_comments(ticket_id, created_at)',
      );
      console.log('✅ Comments performance indexes created');

      // Analytics performance indexes
      await this.run(
        'CREATE INDEX IF NOT EXISTS idx_analytics_user_action_date ON user_analytics(user_id, action, created_at DESC)',
      );
      await this.run(
        'CREATE INDEX IF NOT EXISTS idx_analytics_agent_date ON agent_usage_stats(agent_id, date DESC)',
      );
      console.log('✅ Analytics performance indexes created');

      // CV Intelligence performance indexes
      await this.run(
        'CREATE INDEX IF NOT EXISTS idx_candidates_batch_score ON candidates(batch_id, overall_score DESC)',
      );
      await this.run(
        'CREATE INDEX IF NOT EXISTS idx_batches_user_status ON cv_batches(user_id, status, created_at DESC)',
      );
      console.log('✅ CV Intelligence performance indexes created');

      // Interview Coordinator additional performance indexes
      await this.run(
        'CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_time_status ON interviews(scheduled_time, status)',
      );
      await this.run(
        'CREATE INDEX IF NOT EXISTS idx_reminders_send_at_sent ON interview_reminders(send_at, sent)',
      );
      console.log('✅ Interview Coordinator performance indexes created');

      console.log('✅ All PostgreSQL tables and indexes initialized successfully');
      await this.createDefaultAdmin();
      this.tablesInitialized = true;

      // Start session cleanup routine (only once globally)
      this.startSessionCleanup();
    } catch (error) {
      console.error('❌ Error initializing database tables:', error);
      throw error;
    }
  }

  startSessionCleanup() {
    // Prevent multiple cleanup intervals in serverless
    if (global.__SESSION_CLEANUP_STARTED) {
      return;
    }
    global.__SESSION_CLEANUP_STARTED = true;

    // Run cleanup daily at 3 AM (or immediately if missed)
    const runCleanup = async () => {
      try {
        const result = await this.run(`
          DELETE FROM user_sessions 
          WHERE expires_at < NOW()
        `);

        if (result.changes > 0) {
          console.log(`🧹 Cleaned up ${result.changes} expired sessions`);
        }
      } catch (error) {
        console.error('Session cleanup error:', error.message);
      }
    };

    // Run cleanup every 24 hours
    setInterval(runCleanup, 24 * 60 * 60 * 1000);

    // Also run cleanup on startup
    runCleanup();

    console.log('🔄 Session cleanup routine started (daily at 3 AM)');
  }

  async createDefaultAdmin() {
    try {
      // SECURITY: Never create default admin in production
      if (process.env.NODE_ENV === 'production') {
        console.log('ℹ️ Skipping default admin creation (production environment)');
        return;
      }

      // Only create in development with explicit environment variable
      if (!process.env.CREATE_DEFAULT_ADMIN || process.env.CREATE_DEFAULT_ADMIN !== 'true') {
        console.log('ℹ️ Default admin creation disabled (set CREATE_DEFAULT_ADMIN=true to enable)');
        return;
      }

      const adminEmail = process.env.ADMIN_EMAIL;

      if (!adminEmail) {
        console.log('⚠️ ADMIN_EMAIL not set, skipping default admin creation');
        return;
      }

      const existingAdmin = await this.get('SELECT id FROM users WHERE email = $1', [adminEmail]);

      if (!existingAdmin) {
        const bcrypt = require('bcryptjs');
        // Generate random temporary password
        const crypto = require('crypto');
        const tempPassword = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        await this.run(
          `
          INSERT INTO users (
            email, password_hash, first_name, last_name, role, 
            department, job_title, is_verified, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
          [
            adminEmail,
            hashedPassword,
            'System',
            'Administrator',
            'superadmin',
            'IT',
            'System Administrator',
            true,
            true,
          ],
        );

        console.log(`✅ Default admin created in development: ${adminEmail}`);
        console.log('⚠️ Temporary password generated - check secure logs');
      } else {
        console.log('ℹ️ Admin user already exists');
      }
    } catch (error) {
      console.error('Error creating default admin:', error.message);
    }
  }
}

// Create singleton instance
const database = new Database();

module.exports = database;
