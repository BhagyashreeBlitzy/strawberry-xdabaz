/**
 * @fileoverview Request handler module for the Node.js Hello World server application.
 * Contains functions for processing HTTP requests, routing them to appropriate endpoint
 * handlers, and generating responses.
 * @module handlers
 */

// Import required utilities from utils.js
const {
  sendResponse,
  isValidRoute,
  isMethodAllowed,
  formatErrorMessage,
  logMessage,
  LOG_LEVELS
} = require('./utils');

// Import http module for HTTP status codes
const http = require('http'); // Node.js core module

/**
 * Counter to track the total number of requests processed by the server
 * @type {number}
 */
let requestCount = 0;

/**
 * Main request handler function that processes incoming HTTP requests
 * and routes them to appropriate endpoint handlers
 * @param {http.IncomingMessage} req - HTTP request object
 * @param {http.ServerResponse} res - HTTP response object
 * @returns {void}
 */
function handleRequest(req, res) {
  // Increment request counter
  requestCount++;
  
  // Log incoming request
  logMessage(`Received ${req.method} request for ${req.url}`, LOG_LEVELS.INFO);
  
  try {
    // Extract the URL path from the request
    const path = req.url;
    
    // Check if the path is a valid route
    if (!isValidRoute(path)) {
      return handleNotFound(req, res);
    }
    
    // Check if the HTTP method is allowed for the route
    if (!isMethodAllowed(req.method, path)) {
      return handleMethodNotAllowed(req, res);
    }
    
    // Route the request to the appropriate handler based on the path
    if (path === '/hello') {
      return handleHelloEndpoint(req, res);
    }
    
    // If execution reaches here, it means we have a route defined but no handler
    logMessage(`Handler not implemented for route: ${path}`, LOG_LEVELS.ERROR);
    handleError(new Error(`Handler not implemented for route: ${path}`), res);
    
  } catch (error) {
    // Handle any errors during request processing
    handleError(error, res);
  }
}

/**
 * Handler for the /hello endpoint that returns 'Hello world' with a 200 status code
 * @param {http.IncomingMessage} req - HTTP request object
 * @param {http.ServerResponse} res - HTTP response object
 * @returns {void}
 */
function handleHelloEndpoint(req, res) {
  logMessage('Processing /hello endpoint request', LOG_LEVELS.DEBUG);
  
  // Send "Hello world" response with 200 status code
  sendResponse(res, 'Hello world', 200);
}

/**
 * Handler for undefined routes that returns a 404 Not Found response
 * @param {http.IncomingMessage} req - HTTP request object
 * @param {http.ServerResponse} res - HTTP response object
 * @returns {void}
 */
function handleNotFound(req, res) {
  logMessage(`Route not found: ${req.url}`, LOG_LEVELS.INFO);
  
  // Send "Not Found" response with 404 status code
  sendResponse(res, 'Not Found', 404);
}

/**
 * Handler for requests with methods not allowed for a route
 * @param {http.IncomingMessage} req - HTTP request object
 * @param {http.ServerResponse} res - HTTP response object
 * @returns {void}
 */
function handleMethodNotAllowed(req, res) {
  logMessage(`Method ${req.method} not allowed for ${req.url}`, LOG_LEVELS.INFO);
  
  // Send "Method Not Allowed" response with 405 status code
  sendResponse(res, 'Method Not Allowed', 405);
}

/**
 * Handler for processing errors that returns a 500 Internal Server Error response
 * @param {Error} error - Error object
 * @param {http.ServerResponse} res - HTTP response object
 * @returns {void}
 */
function handleError(error, res) {
  logMessage(`Request processing error: ${error.message}`, LOG_LEVELS.ERROR);
  
  // Format the error message
  const errorMessage = formatErrorMessage(error);
  
  // Send error response with 500 status code
  sendResponse(res, errorMessage, 500);
}

/**
 * Returns the total number of requests processed since server start
 * @returns {number} The total number of requests processed
 */
function getRequestCount() {
  return requestCount;
}

// Export the functions for use in other modules
module.exports = {
  handleRequest,
  handleError,
  getRequestCount
};