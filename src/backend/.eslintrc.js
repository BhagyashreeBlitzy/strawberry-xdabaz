/**
 * ESLint configuration for the Node.js Hello World server application
 * eslint version: ^8.40.0
 * eslint-plugin-jest version: ^27.2.1
 * eslint-config-prettier version: ^8.8.0
 */

module.exports = {
  // Define environments
  env: {
    node: true,       // Enable Node.js global variables
    es2021: true,     // Enable ES2021 features
    jest: true,       // Enable Jest testing globals
  },
  // Extend recommended configurations
  extends: [
    'eslint:recommended',      // Use ESLint recommended rules
    'plugin:jest/recommended', // Use Jest plugin recommended rules
    'prettier',                // Use Prettier to avoid conflicts
  ],
  // Enable plugins
  plugins: ['jest'],  // Jest plugin for testing-specific rules
  // Define parsing options
  parserOptions: {
    ecmaVersion: 2021,  // Use ECMAScript 2021 syntax
    sourceType: 'module', // Use ECMAScript modules
  },
  // Define specific rules
  rules: {
    // Allow console logging for this simple application
    'no-console': 'off',
    // Error on unused variables except those starting with underscore
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // Error on undefined variables
    'no-undef': 'error',
    // Disallow using var keyword
    'no-var': 'error',
    // Prefer const over let when possible
    'prefer-const': 'error',
    // Require strict equality comparisons (===)
    'eqeqeq': ['error', 'always'],
    // Require curly braces for all control statements
    'curly': ['error', 'all'],
    // Require semicolons
    'semi': ['error', 'always'],
    // Use single quotes for strings
    'quotes': ['error', 'single', { avoidEscape: true }],
    
    // Jest specific rules
    // Warn on disabled tests
    'jest/no-disabled-tests': 'warn',
    // Error on focused tests (which can cause other tests to be skipped)
    'jest/no-focused-tests': 'error',
    // Prevent duplicate test titles
    'jest/no-identical-title': 'error',
    // Suggest using toHaveLength() for checking length
    'jest/prefer-to-have-length': 'warn',
    // Enforce valid expect() usage
    'jest/valid-expect': 'error',
  },
  // Special configurations for specific file patterns
  overrides: [
    {
      // Apply these rules to test files
      files: ['tests/**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true, // Ensure Jest environment for test files
      },
      rules: {
        // Ensure all tests have at least one expect assertion
        'jest/expect-expect': 'error',
      },
    },
  ],
};