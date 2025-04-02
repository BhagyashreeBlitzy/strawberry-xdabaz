/**
 * @fileoverview Utility module providing helper functions for the Node.js Hello World 
 * server application. Contains functions for HTTP response handling, logging, route 
 * validation, and other common operations used across the application.
 * @module utils
 */

// Import required modules
const http = require('http'); // Node.js core module

/**
 * Log level constants for consistent logging throughout the application
 * @constant {Object}
 */
const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG'
};

/**
 * Application routes and their allowed HTTP methods
 * @constant {Object}
 */
const ROUTES = {
  '/hello': {
    methods: ['GET']
  }
};

/**
 * Content-Type header value for plain text responses
 * @constant {string}
 */
const CONTENT_TYPE_TEXT = 'text/plain';

/**
 * Security headers to be included with all responses
 * @constant {Object}
 */
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'"
};

/**
 * Sends an HTTP response with the specified content, status code, and appropriate headers
 * @param {object} res - HTTP response object
 * @param {string} content - Content to send in the response
 * @param {number} statusCode - HTTP status code to set
 * @returns {void}
 */
function sendResponse(res, content, statusCode) {
  // Set Content-Type header to text/plain
  res.setHeader('Content-Type', CONTENT_TYPE_TEXT);
  
  // Set Content-Length header to the length of the content
  res.setHeader('Content-Length', Buffer.from(content).length);
  
  // Set security headers from SECURITY_HEADERS constant
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  // Set the HTTP status code to the provided statusCode
  res.statusCode = statusCode;
  
  // End the response with the provided content
  res.end(content);
}

/**
 * Checks if a URL path corresponds to a valid route defined in the application
 * @param {string} path - URL path to check
 * @returns {boolean} True if the path is a valid route, false otherwise
 */
function isValidRoute(path) {
  // Check if the path exists as a key in the ROUTES object
  return Object.prototype.hasOwnProperty.call(ROUTES, path);
}

/**
 * Checks if an HTTP method is allowed for a specific route
 * @param {string} method - HTTP method to check
 * @param {string} path - URL path to check
 * @returns {boolean} True if the method is allowed for the path, false otherwise
 */
function isMethodAllowed(method, path) {
  // Check if the path exists in ROUTES
  if (!isValidRoute(path)) {
    return false;
  }
  
  // Get the allowed methods array for the path from ROUTES
  const allowedMethods = ROUTES[path].methods;
  
  // Check if the provided method (converted to uppercase) is in the allowed methods array
  return allowedMethods.includes(method.toUpperCase());
}

/**
 * Formats an error object or message into a user-friendly error message string
 * @param {Error|string} error - Error object or error message
 * @returns {string} Formatted error message
 */
function formatErrorMessage(error) {
  // Check if the error is an Error object
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // For production environment, return a generic error message to avoid exposing details
  if (isProduction()) {
    return 'An internal server error occurred.';
  }
  
  // For non-production environments, return the actual error message
  return errorMessage;
}

/**
 * Logs a message with the specified severity level and timestamp
 * @param {string} message - Message to log
 * @param {string} level - Log level (from LOG_LEVELS)
 * @returns {void}
 */
function logMessage(message, level = LOG_LEVELS.INFO) {
  // Get the current timestamp
  const timestamp = getTimestamp();
  
  // Format the log message with timestamp, level, and message content
  const formattedMessage = `[${timestamp}] [${level}] ${message}`;
  
  // Log to appropriate console method based on level
  if (level === LOG_LEVELS.ERROR) {
    console.error(formattedMessage);
  } else if (level === LOG_LEVELS.WARN) {
    console.warn(formattedMessage);
  } else if (level === LOG_LEVELS.DEBUG && !isProduction()) {
    console.debug(formattedMessage);
  } else {
    console.log(formattedMessage);
  }
}

/**
 * Returns a formatted timestamp string for the current time
 * @returns {string} Formatted timestamp string
 */
function getTimestamp() {
  // Create a new Date object for the current time
  const now = new Date();
  
  // Format the date as ISO string
  return now.toISOString();
}

/**
 * Checks if the application is running in production environment
 * @returns {boolean} True if in production environment, false otherwise
 */
function isProduction() {
  // Check if process.env.NODE_ENV equals 'production'
  return process.env.NODE_ENV === 'production';
}

/**
 * Sanitizes input strings to prevent security issues like injection attacks
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized input string
 */
function sanitizeInput(input) {
  // Check if input is a string
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove any potentially dangerous characters or patterns
  // For this simple application, we'll just remove basic HTML tags
  // In a real-world application, you'd want to use a proper sanitization library
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Export utility functions and constants
module.exports = {
  sendResponse,
  isValidRoute,
  isMethodAllowed,
  formatErrorMessage,
  logMessage,
  sanitizeInput,
  LOG_LEVELS
};