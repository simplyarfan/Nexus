const Database = require('../../models/database');

// Mock pg
jest.mock('pg', () => {
  const mockPool = {
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: jest.fn(),
    }),
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    end: jest.fn().mockResolvedValue(true),
  };

  return {
    Pool: jest.fn(() => mockPool),
  };
});

describe('Database Model', () => {
  let database;

  beforeEach(() => {
    jest.clearAllMocks();
    database = new Database();
  });

  afterEach(async () => {
    if (database.pool) {
      await database.disconnect();
    }
  });

  describe('Connection Management', () => {
    it('should connect to database successfully', async () => {
      const result = await database.connect();
      expect(result).toBe(true);
      expect(database.isConnected).toBe(true);
    });

    it('should disconnect from database successfully', async () => {
      await database.connect();
      const result = await database.disconnect();
      expect(result).toBe(true);
      expect(database.isConnected).toBe(false);
    });

    it('should handle connection errors gracefully', async () => {
      const pg = require('pg');
      pg.Pool.mockImplementationOnce(() => ({
        connect: jest.fn().mockRejectedValue(new Error('Connection failed')),
      }));

      database = new Database();
      const result = await database.connect();
      expect(result).toBe(false);
    });
  });

  describe('Query Methods', () => {
    beforeEach(async () => {
      await database.connect();
    });

    it('should execute run() query successfully', async () => {
      const mockPool = database.pool;
      mockPool.query.mockResolvedValueOnce({ rowCount: 1, rows: [] });

      const result = await database.run('INSERT INTO users (email) VALUES ($1)', [
        'test@example.com',
      ]);
      expect(result).toHaveProperty('rowCount', 1);
      expect(mockPool.query).toHaveBeenCalledWith('INSERT INTO users (email) VALUES ($1)', [
        'test@example.com',
      ]);
    });

    it('should execute get() query and return first row', async () => {
      const mockPool = database.pool;
      const mockUser = { id: 1, email: 'test@example.com' };
      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await database.get('SELECT * FROM users WHERE id = $1', [1]);
      expect(result).toEqual(mockUser);
    });

    it('should return null when get() finds no rows', async () => {
      const mockPool = database.pool;
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await database.get('SELECT * FROM users WHERE id = $1', [999]);
      expect(result).toBeNull();
    });

    it('should execute all() query and return all rows', async () => {
      const mockPool = database.pool;
      const mockUsers = [
        { id: 1, email: 'user1@example.com' },
        { id: 2, email: 'user2@example.com' },
      ];
      mockPool.query.mockResolvedValueOnce({ rows: mockUsers });

      const result = await database.all('SELECT * FROM users');
      expect(result).toEqual(mockUsers);
    });
  });

  describe('Transaction Management', () => {
    beforeEach(async () => {
      await database.connect();
    });

    it('should execute transaction successfully', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
        release: jest.fn(),
      };

      database.pool.connect.mockResolvedValueOnce(mockClient);

      const result = await database.transaction(async (client) => {
        await client.query('INSERT INTO users (email) VALUES ($1)', ['test@example.com']);
        return { success: true };
      });

      expect(result).toEqual({ success: true });
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
        release: jest.fn(),
      };

      database.pool.connect.mockResolvedValueOnce(mockClient);

      const testError = new Error('Transaction failed');

      await expect(
        database.transaction(async (client) => {
          await client.query('INSERT INTO users (email) VALUES ($1)', ['test@example.com']);
          throw testError;
        }),
      ).rejects.toThrow('Transaction failed');

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should pass client to callback, not this', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
        release: jest.fn(),
      };

      database.pool.connect.mockResolvedValueOnce(mockClient);

      await database.transaction(async (client) => {
        // Verify that client has query method
        expect(client).toHaveProperty('query');
        expect(typeof client.query).toBe('function');

        // Verify client is NOT the database instance
        expect(client).not.toBe(database);
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await database.connect();
    });

    it('should handle query errors gracefully', async () => {
      const mockPool = database.pool;
      mockPool.query.mockRejectedValueOnce(new Error('Query failed'));

      await expect(database.run('INVALID SQL')).rejects.toThrow('Query failed');
    });
  });
});
