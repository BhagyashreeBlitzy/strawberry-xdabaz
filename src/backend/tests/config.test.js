/**
 * Unit tests for the configuration module of the Node.js Hello World server application.
 * Tests the functionality of configuration functions for port number and environment settings.
 *
 * @jest-environment node
 * @version 1.0.0
 */

// Import functions from the configuration module
const { getPort, validatePort, getDefaultPort, getNodeEnv } = require('../config');
const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

/**
 * Helper function to mock environment variables for testing
 * 
 * @param {string} name - The name of the environment variable
 * @param {any} value - The value to set
 * @returns {Function} Function to restore the original value
 */
function mockEnvironmentVariable(name, value) {
  const original = process.env[name];
  
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
  
  return function restore() {
    if (original === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = original;
    }
  };
}

// Main test suite for configuration module
describe('Configuration Module', () => {
  // Save original environment variables
  let originalEnv;
  
  beforeEach(() => {
    // Store original environment variables before each test
    originalEnv = { ...process.env };
    // Silence console logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restore original environment variables after each test
    process.env = originalEnv;
    // Restore console functions
    jest.restoreAllMocks();
  });
  
  // Tests for getPort function
  describe('getPort function', () => {
    it('should return default port (3000) when PORT environment variable is not set', () => {
      // Ensure PORT is not set
      const restore = mockEnvironmentVariable('PORT', undefined);
      
      // Test the function
      expect(getPort()).toBe(3000);
      
      // Restore original value
      restore();
    });
    
    it('should return the port number from PORT environment variable when set', () => {
      // Mock the PORT environment variable
      const restore = mockEnvironmentVariable('PORT', '8080');
      
      // Test the function
      expect(getPort()).toBe(8080);
      
      // Restore original value
      restore();
    });
    
    it('should return default port when PORT environment variable is invalid', () => {
      // Mock an invalid PORT value
      const restore = mockEnvironmentVariable('PORT', 'invalid');
      
      // Test the function
      expect(getPort()).toBe(3000);
      
      // Restore original value
      restore();
    });
    
    it('should return default port when PORT is out of valid range', () => {
      // Mock PORT below valid range
      let restore = mockEnvironmentVariable('PORT', '100');
      expect(getPort()).toBe(3000);
      restore();
      
      // Mock PORT above valid range
      restore = mockEnvironmentVariable('PORT', '70000');
      expect(getPort()).toBe(3000);
      restore();
    });
  });
  
  // Tests for validatePort function
  describe('validatePort function', () => {
    it('should return true for valid port numbers', () => {
      expect(validatePort(3000)).toBe(true);
      expect(validatePort(8080)).toBe(true);
      expect(validatePort(65535)).toBe(true);
      expect(validatePort(1024)).toBe(true);
    });
    
    it('should return false for non-numeric values', () => {
      expect(validatePort('string')).toBe(false);
      expect(validatePort(null)).toBe(false);
      expect(validatePort(undefined)).toBe(false);
      expect(validatePort({})).toBe(false);
      expect(validatePort([])).toBe(false);
    });
    
    it('should return false for out-of-range port numbers', () => {
      expect(validatePort(0)).toBe(false);
      expect(validatePort(1023)).toBe(false);
      expect(validatePort(65536)).toBe(false);
    });
    
    it('should return false for non-integer numbers', () => {
      expect(validatePort(3000.5)).toBe(false);
    });
  });
  
  // Tests for getDefaultPort function
  describe('getDefaultPort function', () => {
    it('should return 3000 as the default port', () => {
      expect(getDefaultPort()).toBe(3000);
    });
  });
  
  // Tests for getNodeEnv function
  describe('getNodeEnv function', () => {
    it("should return 'development' when NODE_ENV is not set", () => {
      // Ensure NODE_ENV is not set
      const restore = mockEnvironmentVariable('NODE_ENV', undefined);
      
      // Test the function
      expect(getNodeEnv()).toBe('development');
      
      // Restore original value
      restore();
    });
    
    it('should return the NODE_ENV value when set', () => {
      // Mock production environment
      let restore = mockEnvironmentVariable('NODE_ENV', 'production');
      expect(getNodeEnv()).toBe('production');
      restore();
      
      // Mock test environment
      restore = mockEnvironmentVariable('NODE_ENV', 'test');
      expect(getNodeEnv()).toBe('test');
      restore();
    });
  });
});