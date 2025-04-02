/**
 * Jest Configuration File
 * 
 * This file defines the configuration for Jest, the testing framework used for the
 * Node.js Hello World application. It includes settings for test environment,
 * file patterns, coverage thresholds, and mock behavior.
 * 
 * @version jest ^29.5.0
 */

module.exports = {
  // Use Node.js as the test environment
  testEnvironment: 'node',
  
  // Enable verbose output for detailed test information
  verbose: true,
  
  // Define which files to collect coverage from
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!.eslintrc.js'
  ],
  
  // Set coverage thresholds for the project
  coverageThreshold: {
    // Global thresholds
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Component-specific thresholds based on requirements
    './server.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './handlers.js': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './config.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './utils.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // Patterns to match test files
  testMatch: [
    '**/tests/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Patterns to ignore when looking for test files
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/'
  ],
  
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,
  
  // Don't reset mock state between test runs
  resetMocks: false,
  
  // Restore mocks to their original state after each test
  restoreMocks: true
};