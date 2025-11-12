/**
 * Database Query Optimizer
 * Provides utilities for optimizing database queries
 */

const cache = require('./cache');

/**
 * Query with caching
 */
const cachedQuery = async (database, sql, params = [], cacheKey = null, ttl = 300) => {
  const key =
    cacheKey ||
    `query:${Buffer.from(sql).toString('base64').substring(0, 32)}:${JSON.stringify(params)}`;

  // Try cache first
  const cached = await cache.get(key);
  if (cached !== null) {
    return cached;
  }

  // Execute query
  const result = await database.all(sql, params);

  // Cache result
  await cache.set(key, result, ttl);

  return result;
};

/**
 * Batch query execution
 */
const batchQuery = async (database, queries) => {
  const results = await Promise.all(queries.map(({ sql, params }) => database.all(sql, params)));

  return results;
};

/**
 * Query with pagination optimization
 */
const paginatedQuery = async (database, sql, params, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;

  // Add LIMIT and OFFSET to query
  const paginatedSql = `${sql} LIMIT ${limit} OFFSET ${offset}`;

  // Get count query (replace SELECT ... FROM with SELECT COUNT(*) FROM)
  const countSql = sql
    .replace(/SELECT .+ FROM/, 'SELECT COUNT(*) as total FROM')
    .split('ORDER BY')[0];

  // Execute both queries in parallel
  const [rows, countResult] = await Promise.all([
    database.all(paginatedSql, params),
    database.get(countSql, params),
  ]);

  const total = countResult?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    rows,
    pagination: {
      currentPage: page,
      pageSize: limit,
      totalItems: total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

/**
 * Query builder for common patterns
 */
const buildSelectQuery = (options) => {
  const {
    table,
    select = '*',
    where = {},
    orderBy = null,
    limit = null,
    offset = null,
    join = null,
  } = options;

  let sql = `SELECT ${select} FROM ${table}`;

  if (join) {
    sql += ` ${join}`;
  }

  const whereConditions = [];
  const params = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(where)) {
    whereConditions.push(`${key} = $${paramIndex}`);
    params.push(value);
    paramIndex++;
  }

  if (whereConditions.length > 0) {
    sql += ` WHERE ${whereConditions.join(' AND ')}`;
  }

  if (orderBy) {
    sql += ` ORDER BY ${orderBy}`;
  }

  if (limit) {
    sql += ` LIMIT ${limit}`;
  }

  if (offset) {
    sql += ` OFFSET ${offset}`;
  }

  return { sql, params };
};

/**
 * Analyze query performance
 */
const analyzeQuery = async (database, sql, params = []) => {
  const startTime = Date.now();

  // Execute with EXPLAIN
  const explainSql = `EXPLAIN ANALYZE ${sql}`;
  const explainResult = await database.all(explainSql, params);

  const duration = Date.now() - startTime;

  return {
    duration,
    plan: explainResult,
    sql,
    params,
  };
};

/**
 * Suggest indexes for query
 */
const suggestIndexes = (sql) => {
  const suggestions = [];

  // Find WHERE clauses
  const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER BY|GROUP BY|LIMIT|$)/i);
  if (whereMatch) {
    const conditions = whereMatch[1].split(/AND|OR/i);
    conditions.forEach((condition) => {
      const columnMatch = condition.match(/(\w+)\s*[=<>]/);
      if (columnMatch) {
        suggestions.push(`Consider index on: ${columnMatch[1]}`);
      }
    });
  }

  // Find ORDER BY clauses
  const orderByMatch = sql.match(/ORDER BY\s+(.+?)(?:LIMIT|$)/i);
  if (orderByMatch) {
    const columns = orderByMatch[1].split(',').map((c) => c.trim().split(/\s+/)[0]);
    columns.forEach((column) => {
      suggestions.push(`Consider index on: ${column} (for sorting)`);
    });
  }

  // Find JOIN conditions
  const joinMatches = sql.matchAll(/JOIN\s+\w+\s+ON\s+(.+?)(?:WHERE|JOIN|ORDER|GROUP|LIMIT|$)/gi);
  for (const match of joinMatches) {
    const condition = match[1];
    const columnMatch = condition.match(/(\w+)\s*=/g);
    if (columnMatch) {
      columnMatch.forEach((col) => {
        suggestions.push(`Consider index on join column: ${col.replace('=', '').trim()}`);
      });
    }
  }

  return suggestions;
};

module.exports = {
  cachedQuery,
  batchQuery,
  paginatedQuery,
  buildSelectQuery,
  analyzeQuery,
  suggestIndexes,
};
