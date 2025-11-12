const logger = require('./logger');
const { captureMessage } = require('../config/sentry');

const SLOW_QUERY_THRESHOLD = 100;
const VERY_SLOW_QUERY_THRESHOLD = 500;

class QueryMonitor {
  constructor() {
    this.queries = [];
    this.slowQueries = [];
  }

  async monitorQuery(queryFn, sql, params = [], context = {}) {
    const startTime = Date.now();
    let result;
    let error;

    try {
      result = await queryFn();
    } catch (err) {
      error = err;
      throw err;
    } finally {
      const duration = Date.now() - startTime;

      const queryInfo = {
        sql: this.sanitizeSql(sql),
        duration,
        timestamp: new Date().toISOString(),
        context: {
          userId: context.userId || 'system',
          route: context.route || 'unknown',
          method: context.method || 'unknown',
        },
        success: !error,
        error: error ? error.message : null,
      };

      this.queries.push(queryInfo);

      if (this.queries.length > 1000) {
        this.queries.shift();
      }

      if (duration > VERY_SLOW_QUERY_THRESHOLD) {
        logger.error('Very slow database query detected', queryInfo);
        this.slowQueries.push(queryInfo);

        captureMessage(`Very slow query: ${duration}ms`, 'error', {
          tags: { type: 'database', severity: 'high' },
          extra: queryInfo,
        });
      } else if (duration > SLOW_QUERY_THRESHOLD) {
        logger.warn('Slow database query detected', queryInfo);
        this.slowQueries.push(queryInfo);

        if (duration > 300) {
          captureMessage(`Slow query: ${duration}ms`, 'warning', {
            tags: { type: 'database', severity: 'medium' },
            extra: queryInfo,
          });
        }
      }

      if (this.slowQueries.length > 100) {
        this.slowQueries.shift();
      }
    }

    return result;
  }

  sanitizeSql(sql) {
    return sql.replace(/\$\d+/g, '?').substring(0, 500);
  }

  getMetrics() {
    const totalQueries = this.queries.length;
    const slowQueriesCount = this.slowQueries.length;

    const durations = this.queries.map((q) => q.duration);
    const avgDuration =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

    const sortedDurations = [...durations].sort((a, b) => a - b);
    const p95Duration =
      sortedDurations.length > 0 ? sortedDurations[Math.floor(sortedDurations.length * 0.95)] : 0;
    const p99Duration =
      sortedDurations.length > 0 ? sortedDurations[Math.floor(sortedDurations.length * 0.99)] : 0;

    const failedQueries = this.queries.filter((q) => !q.success).length;

    return {
      total: totalQueries,
      slow: slowQueriesCount,
      failed: failedQueries,
      successRate:
        totalQueries > 0 ? Math.round(((totalQueries - failedQueries) / totalQueries) * 100) : 100,
      performance: {
        average: avgDuration,
        p95: Math.round(p95Duration),
        p99: Math.round(p99Duration),
      },
    };
  }

  getSlowQueries(limit = 10) {
    return this.slowQueries.slice(-limit).reverse();
  }

  reset() {
    this.queries = [];
    this.slowQueries = [];
  }
}

const queryMonitor = new QueryMonitor();

const monitoredQuery = async (database, method, sql, params = [], context = {}) => {
  return queryMonitor.monitorQuery(
    () => {
      if (method === 'all') {
        return database.all(sql, params);
      } else if (method === 'get') {
        return database.get(sql, params);
      } else if (method === 'run') {
        return database.run(sql, params);
      }
      throw new Error(`Unknown database method: ${method}`);
    },
    sql,
    params,
    context,
  );
};

const getQueryMetrics = () => queryMonitor.getMetrics();

const getSlowQueries = (limit) => queryMonitor.getSlowQueries(limit);

const resetQueryMetrics = () => queryMonitor.reset();

module.exports = {
  monitoredQuery,
  getQueryMetrics,
  getSlowQueries,
  resetQueryMetrics,
  QueryMonitor,
};
