/**
 * @fileoverview Entry point for the Node.js Hello World server application.
 * Initializes and starts the HTTP server with proper configuration and error handling.
 * This file serves as the main entry point for the application and manages the server
 * lifecycle, including startup, shutdown, and signal handling.
 * 
 * @module index
 * @version 1.0.0
 */

// Import server creation and management functions from server.js
const { createServer, startServer, stopServer } = require('./server');

// Import configuration function to get port number from config.js
const { getPort } = require('./config');

// Import logging utility from utils.js
const { logMessage, LOG_LEVELS } = require('./utils');

// Global server instance that will be initialized during startup
let server;

/**
 * Initializes the HTTP server and starts it on the configured port.
 * Creates the server instance, gets the configured port, and starts
 * the server listening on that port.
 * 
 * @returns {Promise} Promise that resolves when the server starts successfully or rejects on error
 */
async function initializeServer() {
  try {
    // Create HTTP server instance
    server = createServer();
    
    // Get the configured port from environment or default
    const port = getPort();
    
    // Log server initialization message
    logMessage('Initializing server...', LOG_LEVELS.INFO);
    
    // Start the server on the configured port
    await startServer(server, port);
    
    return server;
  } catch (error) {
    // Log the error and exit the process with non-zero exit code
    logMessage(`Failed to initialize server: ${error.message}`, LOG_LEVELS.ERROR);
    process.exit(1);
  }
}

/**
 * Gracefully shuts down the HTTP server by closing all connections
 * and releasing resources.
 * 
 * @returns {Promise} Promise that resolves when the server has stopped or rejects on error
 */
async function shutdownServer() {
  try {
    // Check if server exists before attempting to shut it down
    if (!server) {
      logMessage('No server instance to shut down', LOG_LEVELS.WARN);
      return true;
    }
    
    // Log server shutdown message
    logMessage('Shutting down server...', LOG_LEVELS.INFO);
    
    // Stop the server gracefully
    await stopServer(server);
    
    return true;
  } catch (error) {
    // Log any errors during shutdown but don't exit the process
    logMessage(`Error during server shutdown: ${error.message}`, LOG_LEVELS.ERROR);
    return false;
  }
}

/**
 * Sets up handlers for process termination signals to enable graceful shutdown
 * of the server when the process is terminated.
 */
function handleProcessSignals() {
  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', async () => {
    logMessage('Received SIGINT signal. Gracefully shutting down...', LOG_LEVELS.INFO);
    await shutdownServer();
    process.exit(0);
  });
  
  // Handle SIGTERM (termination signal)
  process.on('SIGTERM', async () => {
    logMessage('Received SIGTERM signal. Gracefully shutting down...', LOG_LEVELS.INFO);
    await shutdownServer();
    process.exit(0);
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logMessage(`Uncaught exception: ${error.message}`, LOG_LEVELS.ERROR);
    logMessage(error.stack, LOG_LEVELS.ERROR);
    shutdownServer().then(() => process.exit(1));
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logMessage(`Unhandled promise rejection at: ${promise}, reason: ${reason}`, LOG_LEVELS.ERROR);
    shutdownServer().then(() => process.exit(1));
  });
}

// Set up process signal handlers for graceful shutdown
handleProcessSignals();

// Initialize and start the server
initializeServer().then(() => {
  logMessage('Server initialization completed successfully', LOG_LEVELS.INFO);
}).catch(error => {
  logMessage(`Server initialization failed: ${error.message}`, LOG_LEVELS.ERROR);
  process.exit(1);
});

// Export the server management functions for potential programmatic control
module.exports = {
  initializeServer,
  shutdownServer
};