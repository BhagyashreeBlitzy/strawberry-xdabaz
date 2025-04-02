/**
 * @fileoverview Core server module that creates and manages the HTTP server for the 
 * Node.js Hello World application. Provides functions to create, start, and stop the server,
 * and handles incoming HTTP requests by routing them to appropriate handlers.
 * @module server
 */

// Import the Node.js HTTP module
const http = require('http'); // Node.js core module

// Import request and error handlers from handlers.js
const { handleRequest, handleError } = require('./handlers');

// Import utility functions from utils.js
const { logMessage, LOG_LEVELS } = require('./utils');

/**
 * Creates and configures an HTTP server instance using Node.js http module
 * @returns {http.Server} Configured HTTP server instance ready to be started
 */
function createServer() {
  // Create a new HTTP server that will handle requests using the handleRequest function
  const server = http.createServer((req, res) => {
    try {
      // Process the incoming HTTP request
      handleRequest(req, res);
    } catch (error) {
      // If an error occurs during request processing, pass it to the error handler
      handleError(error, res);
    }
  });

  // Set up error event handler for server-level errors
  server.on('error', handleServerError);

  // Return the configured server instance
  return server;
}

/**
 * Starts the HTTP server on the specified port
 * @param {http.Server} server - The HTTP server instance to start
 * @param {Number} port - The port number to listen on
 * @returns {Promise} Promise that resolves when the server starts successfully or rejects on error
 */
function startServer(server, port) {
  return new Promise((resolve, reject) => {
    // Try to start the server on the specified port
    server.listen(port, () => {
      // When the server starts successfully, log a message and resolve the promise
      logMessage(`Server running at http://localhost:${port}/`, LOG_LEVELS.INFO);
      resolve(server);
    });

    // Set up error event handler for server startup errors
    server.once('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Gracefully stops the HTTP server, closing all connections
 * @param {http.Server} server - The HTTP server instance to stop
 * @returns {Promise} Promise that resolves when the server has stopped or rejects on error
 */
function stopServer(server) {
  return new Promise((resolve, reject) => {
    if (!server) {
      resolve();
      return;
    }

    // Try to close the server gracefully
    server.close((error) => {
      if (error) {
        // If an error occurs while closing, reject the promise
        logMessage(`Error while stopping server: ${error.message}`, LOG_LEVELS.ERROR);
        reject(error);
      } else {
        // If the server closes successfully, log a message and resolve the promise
        logMessage('Server stopped successfully', LOG_LEVELS.INFO);
        resolve();
      }
    });
  });
}

/**
 * Handles server-level errors that are not related to specific requests
 * @param {Error} error - The error object
 * @returns {void} No return value
 */
function handleServerError(error) {
  // Log the error with error level
  logMessage(`Server error: ${error.message}`, LOG_LEVELS.ERROR);

  // Check for specific types of server errors
  if (error.code === 'EADDRINUSE') {
    logMessage('Port is already in use. Please try a different port.', LOG_LEVELS.ERROR);
  } else if (error.code === 'EACCES') {
    logMessage('Insufficient permissions to bind to the specified port. Try using a port number >= 1024 or running with elevated privileges.', LOG_LEVELS.ERROR);
  } else {
    logMessage(`Unhandled server error: ${error.message}`, LOG_LEVELS.ERROR);
  }
}

// Export the functions for use in other modules
module.exports = {
  createServer,
  startServer,
  stopServer
};