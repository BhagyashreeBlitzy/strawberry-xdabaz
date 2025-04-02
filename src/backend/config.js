/**
 * Configuration module for the Node.js Hello World server application.
 * Manages server settings such as port number and environment variables,
 * providing a centralized configuration interface for the application.
 * 
 * @module config
 * @version 1.0.0
 */

// Constants for configuration defaults and limits
const DEFAULT_PORT = 3000;
const MIN_PORT = 1024;
const MAX_PORT = 65535;
const DEFAULT_NODE_ENV = 'development';

/**
 * Returns the configured port number from the PORT environment variable 
 * or the default port if not set or invalid.
 * 
 * @returns {Number} The port number to use for the HTTP server
 */
function getPort() {
  const envPort = process.env.PORT;
  
  if (!envPort) {
    console.log(`No PORT environment variable found, using default port: ${DEFAULT_PORT}`);
    return getDefaultPort();
  }
  
  const parsedPort = parseInt(envPort, 10);
  
  if (validatePort(parsedPort)) {
    console.log(`Using configured port: ${parsedPort}`);
    return parsedPort;
  }
  
  console.warn(`Invalid PORT value: "${envPort}". Port must be an integer between ${MIN_PORT}-${MAX_PORT}.`);
  console.warn(`Using default port: ${DEFAULT_PORT}`);
  return getDefaultPort();
}

/**
 * Validates if a port number is within the acceptable range and is a valid integer.
 * 
 * @param {Number} port - The port number to validate
 * @returns {Boolean} True if the port is valid, false otherwise
 */
function validatePort(port) {
  // Check if the port is a number, an integer, and within valid range
  return (
    typeof port === 'number' && 
    !isNaN(port) && 
    Number.isInteger(port) && 
    port >= MIN_PORT && 
    port <= MAX_PORT
  );
}

/**
 * Returns the default port number for the server.
 * 
 * @returns {Number} The default port number (3000)
 */
function getDefaultPort() {
  return DEFAULT_PORT;
}

/**
 * Returns the current Node.js environment from NODE_ENV environment variable 
 * or the default environment if not set.
 * 
 * @returns {String} The Node.js environment (development, production, test, etc.)
 */
function getNodeEnv() {
  const nodeEnv = process.env.NODE_ENV || DEFAULT_NODE_ENV;
  console.log(`Running in ${nodeEnv} environment`);
  return nodeEnv;
}

// Export the configuration functions for use in other modules
module.exports = {
  getPort,
  validatePort,
  getDefaultPort,
  getNodeEnv
};