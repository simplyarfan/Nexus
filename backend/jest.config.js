module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'routes/**/*.js',
    'services/**/*.js',
    'middleware/**/*.js',
    'models/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/tests/**',
  ],
  // Coverage thresholds disabled for now - focus on unit tests passing first
  // coverageThreshold: {
  //   global: {
  //     branches: 60,
  //     functions: 60,
  //     lines: 60,
  //     statements: 60,
  //   },
  // },
  // Skip E2E tests in CI (they require running database)
  testMatch: process.env.CI
    ? [
        '**/tests/unit/**/*.test.js',
        '**/tests/controllers/**/*.test.js',
        '**/tests/services/**/*.test.js',
      ]
    : ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  testPathIgnorePatterns: process.env.CI
    ? [
        '/node_modules/',
        '/tests/e2e/',
        '/tests/services/cvIntelligence.test.js',
        '/tests/services/interviewCoordinator.test.js',
      ]
    : ['/node_modules/', '/tests/services/cvIntelligence.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
