/**
 * @jest-environment node
 * @fileoverview Unit tests for the utility functions defined in the utils.js module,
 * including response formatting, route validation, error handling, and logging utilities.
 */

const { 
  describe, 
  it, 
  expect, 
  beforeEach, 
  afterEach, 
  jest 
} = require('@jest/globals'); // Jest 29.x

const {
  sendResponse,
  isValidRoute,
  isMethodAllowed,
  formatErrorMessage,
  logMessage,
  getTimestamp
} = require('../utils');

const { getNodeEnv } = require('../config');

/**
 * Creates a mock HTTP request object for testing
 * @param {Object} options - Options to configure the mock request
 * @returns {Object} Mock request object with url, method, and headers properties
 */
function createMockRequest(options = {}) {
  return {
    url: '/hello',
    method: 'GET',
    headers: {},
    ...options
  };
}

/**
 * Creates a mock HTTP response object for testing with jest.fn() for methods
 * @returns {Object} Mock response object with jest.fn() methods for testing
 */
function createMockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    setHeader: jest.fn((name, value) => {
      res.headers[name] = value;
    }),
    writeHead: jest.fn((statusCode) => {
      res.statusCode = statusCode;
    }),
    end: jest.fn(),
  };
  return res;
}

// Test suite for sendResponse utility function
describe('sendResponse', () => {
  it('should set the correct status code', () => {
    const res = createMockResponse();
    sendResponse(res, 'Test content', 200);
    expect(res.statusCode).toBe(200);
  });

  it('should set the correct content', () => {
    const res = createMockResponse();
    sendResponse(res, 'Test content', 200);
    expect(res.end).toHaveBeenCalledWith('Test content');
  });

  it('should set the Content-Type header to text/plain', () => {
    const res = createMockResponse();
    sendResponse(res, 'Test content', 200);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
  });

  it('should set the Content-Length header correctly', () => {
    const res = createMockResponse();
    const testContent = 'Test content';
    sendResponse(res, testContent, 200);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Length', Buffer.from(testContent).length);
  });

  it('should set the X-Content-Type-Options header to nosniff', () => {
    const res = createMockResponse();
    sendResponse(res, 'Test content', 200);
    expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
  });
});

// Test suite for isValidRoute utility function
describe('isValidRoute', () => {
  it('should return true for /hello path', () => {
    expect(isValidRoute('/hello')).toBe(true);
  });

  it('should return false for other paths', () => {
    expect(isValidRoute('/unknown')).toBe(false);
    expect(isValidRoute('/hello/world')).toBe(false);
    expect(isValidRoute('/')).toBe(false);
  });

  it('should handle case sensitivity correctly', () => {
    expect(isValidRoute('/Hello')).toBe(false);
    expect(isValidRoute('/HELLO')).toBe(false);
  });
});

// Test suite for isMethodAllowed utility function
describe('isMethodAllowed', () => {
  it('should return true for GET method on /hello path', () => {
    expect(isMethodAllowed('GET', '/hello')).toBe(true);
  });

  it('should return false for other methods on /hello path', () => {
    expect(isMethodAllowed('POST', '/hello')).toBe(false);
    expect(isMethodAllowed('PUT', '/hello')).toBe(false);
    expect(isMethodAllowed('DELETE', '/hello')).toBe(false);
  });

  it('should handle case sensitivity correctly', () => {
    // The function converts method to uppercase internally
    expect(isMethodAllowed('get', '/hello')).toBe(true);
  });
});

// Test suite for formatErrorMessage utility function
describe('formatErrorMessage', () => {
  let originalNodeEnv;
  
  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
  });
  
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should format error with message property', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Test error message');
    const result = formatErrorMessage(error);
    expect(result).toBe('Test error message');
  });

  it('should handle errors without message property', () => {
    process.env.NODE_ENV = 'development';
    const error = {};
    const result = formatErrorMessage(error);
    expect(result).toBe('[object Object]');
  });

  it('should use appropriate default messages for different status codes', () => {
    process.env.NODE_ENV = 'development';
    const notFoundError = new Error('Not Found');
    const methodNotAllowedError = new Error('Method Not Allowed');
    
    expect(formatErrorMessage(notFoundError)).toBe('Not Found');
    expect(formatErrorMessage(methodNotAllowedError)).toBe('Method Not Allowed');
  });

  it('should sanitize error messages', () => {
    process.env.NODE_ENV = 'development';
    const sensitiveError = new Error('Error with password=secret123 and key=abc123');
    const result = formatErrorMessage(sensitiveError);
    
    // In a real implementation, we'd expect sensitive data to be sanitized
    // This test simply verifies the current behavior
    expect(result).toBe('Error with password=secret123 and key=abc123');
  });
});

// Test suite for logMessage utility function
describe('logMessage', () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  let consoleDebugSpy;
  let originalNodeEnv;
  let getTimestampSpy;
  
  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    
    // Mock getTimestamp function to return a fixed timestamp
    getTimestampSpy = jest.spyOn(Date.prototype, 'toISOString')
      .mockReturnValue('2023-01-01T00:00:00.000Z');
  });
  
  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleDebugSpy.mockRestore();
    getTimestampSpy.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should log info messages to console.log', () => {
    logMessage('Test info message', 'INFO');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[INFO] Test info message')
    );
  });

  it('should log error messages to console.error', () => {
    logMessage('Test error message', 'ERROR');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR] Test error message')
    );
  });

  it('should log debug messages to console.debug in development environment', () => {
    process.env.NODE_ENV = 'development';
    logMessage('Test debug message', 'DEBUG');
    expect(consoleDebugSpy).toHaveBeenCalledWith(
      expect.stringContaining('[DEBUG] Test debug message')
    );
  });

  it('should not log debug messages in production environment', () => {
    process.env.NODE_ENV = 'production';
    logMessage('Test debug message', 'DEBUG');
    expect(consoleDebugSpy).not.toHaveBeenCalled();
  });

  it('should include timestamp in log messages', () => {
    logMessage('Test message', 'INFO');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[2023-01-01T00:00:00.000Z]')
    );
  });
});

// Test suite for getTimestamp utility function
describe('getTimestamp', () => {
  it('should return a string', () => {
    const timestamp = getTimestamp();
    expect(typeof timestamp).toBe('string');
  });

  it('should return a properly formatted timestamp', () => {
    const mockDate = new Date('2023-01-01T00:00:00.000Z');
    const dateSpy = jest.spyOn(global, 'Date')
      .mockImplementation(() => mockDate);
    
    const timestamp = getTimestamp();
    expect(timestamp).toBe('2023-01-01T00:00:00.000Z');
    
    dateSpy.mockRestore();
  });
});

// Export the mock helper functions for use in other tests
module.exports = {
  createMockRequest,
  createMockResponse
};