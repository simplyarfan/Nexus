const database = require('./database');
const bcrypt = require('bcryptjs');

class User {
  constructor(userData) {
    this.id = userData?.id;
    this.email = userData?.email;
    this.password_hash = userData?.password_hash;
    this.first_name = userData?.first_name;
    this.last_name = userData?.last_name;
    this.role = userData?.role || 'user';
    this.is_verified = userData?.is_verified || false;
    this.verification_token = userData?.verification_token;
    this.verification_expiry = userData?.verification_expiry;
    this.reset_token = userData?.reset_token;
    this.reset_token_expiry = userData?.reset_token_expiry;
    this.last_login = userData?.last_login;
    this.is_active = userData?.is_active !== undefined ? userData.is_active : true;
    this.profile_image = userData?.profile_image;
    this.department = userData?.department;
    this.job_title = userData?.job_title;
    this.created_at = userData?.created_at;
    this.updated_at = userData?.updated_at;
  }

  // Create a new user
  static async create(userData) {
    try {
      console.log('👤 [USER] Creating user with data:', {
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role || 'user',
        department: userData.department,
        job_title: userData.job_title,
        is_verified: userData.is_verified || true,
      });

      const sql = `
        INSERT INTO users (
          email, password_hash, first_name, last_name, role, 
          department, job_title, is_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
      `;

      const params = [
        userData.email.toLowerCase(),
        userData.password_hash, // Use password_hash instead of password
        userData.first_name,
        userData.last_name,
        userData.role || 'user',
        userData.department || null,
        userData.job_title || null,
        userData.is_verified || true, // Default to verified
      ];

      console.log('📝 [USER] Executing SQL:', sql);
      console.log(
        '📝 [USER] With params:',
        params.map((p, i) => (i === 1 ? '[HASHED_PASSWORD]' : p)),
      );

      const result = await database.run(sql, params);

      console.log('✅ [USER] SQL result:', result);

      // Return the user ID from PostgreSQL RETURNING clause
      const userId = result.rows?.[0]?.id || result.id;
      console.log('✅ [USER] User created successfully with ID:', userId);
      return userId;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const sql = 'SELECT * FROM users WHERE id = $1 AND is_active = true';
      const row = await database.get(sql, [id]);
      return row ? new User(row) : null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const sql = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
      const row = await database.get(sql, [email.toLowerCase()]);
      return row ? new User(row) : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Verify password
  async verifyPassword(password) {
    try {
      console.log('Verifying password for user:', this.email);
      console.log('Provided password length:', password ? password.length : 'undefined');
      console.log('Stored hash exists:', !!this.password_hash);

      if (!this.password_hash) {
        console.error('No password hash found for user:', this.email);
        return false;
      }

      const isMatch = await bcrypt.compare(password, this.password_hash);
      console.log('Password match result:', isMatch);
      return isMatch;
    } catch (error) {
      console.error('Error in verifyPassword:', error);
      return false;
    }
  }

  // Update user
  async update(updateData) {
    try {
      const allowedFields = [
        'first_name',
        'last_name',
        'department',
        'job_title',
        'profile_image',
        'last_login',
        'is_verified',
      ];

      const updates = [];
      const params = [];
      let paramIndex = 1;

      Object.keys(updateData).forEach((key) => {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = $${paramIndex}`);
          params.push(updateData[key]);
          paramIndex++;
        }
      });

      if (updates.length === 0) {
        return this;
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(this.id);

      const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
      await database.run(sql, params);

      // Refresh user data
      const updatedUser = await User.findById(this.id);
      Object.assign(this, updatedUser);

      return this;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Update password
  async updatePassword(newPassword) {
    try {
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(newPassword, saltRounds);

      const sql = `
        UPDATE users 
        SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;

      await database.run(sql, [password_hash, this.id]);
      this.password_hash = password_hash;

      return this;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  // Get all users (admin only)
  static async getAll(options = {}) {
    try {
      const { page = 1, limit = 20, role = null, search = null } = options;
      const offset = (page - 1) * limit;

      let sql =
        'SELECT id, email, first_name, last_name, role, is_verified, last_login, department, job_title, created_at FROM users WHERE is_active = true';
      const params = [];
      let paramIndex = 1;

      if (role) {
        sql += ` AND role = $${paramIndex}`;
        params.push(role);
        paramIndex++;
      }

      if (search) {
        sql += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex + 1} OR email ILIKE $${paramIndex + 2})`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
        paramIndex += 3;
      }

      sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const rows = await database.all(sql, params);

      // Get total count
      let countSql = 'SELECT COUNT(*) as total FROM users WHERE is_active = true';
      const countParams = [];
      let countParamIndex = 1;

      if (role) {
        countSql += ` AND role = $${countParamIndex}`;
        countParams.push(role);
        countParamIndex++;
      }

      if (search) {
        countSql += ` AND (first_name ILIKE $${countParamIndex} OR last_name ILIKE $${countParamIndex + 1} OR email ILIKE $${countParamIndex + 2})`;
        const searchTerm = `%${search}%`;
        countParams.push(searchTerm, searchTerm, searchTerm);
      }

      const countResult = await database.get(countSql, countParams);

      return {
        users: rows.map((row) => new User(row)),
        total: countResult.total,
        page,
        limit,
        totalPages: Math.ceil(countResult.total / limit),
      };
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  // Get user statistics
  static async getStatistics() {
    try {
      const stats = {};

      // Total users
      const totalResult = await database.get(
        'SELECT COUNT(*) as total FROM users WHERE is_active = true',
      );
      stats.total = totalResult.total;

      // Verified users
      const verifiedResult = await database.get(
        'SELECT COUNT(*) as verified FROM users WHERE is_active = true AND is_verified = true',
      );
      stats.verified = verifiedResult.verified;

      // Users by role
      const roleStats = await database.all(
        'SELECT role, COUNT(*) as count FROM users WHERE is_active = true GROUP BY role',
      );
      stats.byRole = {};
      roleStats.forEach((row) => {
        stats.byRole[row.role] = row.count;
      });

      // Recent registrations (last 30 days)
      const recentResult = await database.get(`
        SELECT COUNT(*) as recent 
        FROM users 
        WHERE is_active = true AND created_at > NOW() - INTERVAL '30 days'
      `);
      stats.recentRegistrations = recentResult.recent;

      return stats;
    } catch (error) {
      console.error('Error getting user statistics:', error);
      throw error;
    }
  }

  // Delete user (soft delete)
  async delete() {
    try {
      const sql =
        'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1';
      await database.run(sql, [this.id]);
      this.is_active = false;
      return this;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Convert to JSON (excluding sensitive data)
  toJSON() {
    const { password_hash, verification_token, reset_token, ...safeUser } = this;
    return safeUser;
  }

  // Get full name
  get fullName() {
    return `${this.first_name} ${this.last_name}`;
  }

  // Check if user is admin or superadmin
  get isAdmin() {
    return ['admin', 'superadmin'].includes(this.role);
  }

  // Check if user is superadmin
  get isSuperAdmin() {
    return this.role === 'superadmin';
  }
}

module.exports = User;
