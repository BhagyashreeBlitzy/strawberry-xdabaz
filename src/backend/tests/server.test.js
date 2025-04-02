/**
 * @fileoverview Unit tests for the server module that implements the HTTP server functionality.
 * Tests server creation, startup, shutdown, error handling, and event listeners.
 * @module server.test
 */

// Import Jest testing functions
const { describe, it, expect, beforeEach, afterEach, jest } = require('@jest/globals'); // v29.x

// Import Node.js core modules needed for testing
const http = require('http'); // built-in
const { EventEmitter } = require('events'); // built-in

// Import the functions to be tested from the server module
const { createServer, startServer, stopServer } = require('../server');

// Import functions that the server depends on for mocking
const { handleRequest } = require('../handlers');
const { logMessage } = require('../utils');

// Mock the dependencies
jest.mock('../handlers', () => ({
  handleRequest: jest.fn(),
  handleError: jest.fn()
}));

jest.mock('../utils', () => ({
  logMessage: jest.fn(),
  LOG_LEVELS: {
    INFO: 'info',
    ERROR: 'error',
    WARN: 'warn',
    DEBUG: 'debug'
  }
}));

/**
 * Creates a mock HTTP server for testing server functionality
 * @returns {object} Mock server object with EventEmitter functionality
 */
function createMockServer() {
  // Create a mock server that extends EventEmitter
  const mockServer = new EventEmitter();
  
  // Add listen method that returns the server and emits listening event
  mockServer.listen = jest.fn().mockImplementation((port, callback) => {
    mockServer.port = port;
    if (callback) callback();
    return mockServer;
  });
  
  // Add close method that emits close event and calls callback
  mockServer.close = jest.fn().mockImplementation((callback) => {
    if (callback) {
      // We don't call the callback here, as we'll manually emit events in tests
      // to control the flow
    }
    return mockServer;
  });
  
  // Add address method that returns mock address object with port
  mockServer.address = jest.fn().mockReturnValue({ port: 3000 });
  
  // Add listening property
  let _listening = true;
  Object.defineProperty(mockServer, 'listening', {
    get: () => _listening,
    set: (value) => { _listening = value; }
  });
  
  // Add once method for special case error handling
  mockServer.once = jest.fn().mockImplementation(function(event, listener) {
    this.on(event, listener);
    return this;
  });
  
  return mockServer;
}

// Setup and teardown
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Restore all mocks after each test
  jest.restoreAllMocks();
});

// Test suite for createServer function
describe('createServer', () => {
  it('should create an HTTP server instance', () => {
    // Create a mock server to be returned by http.createServer
    const mockServer = createMockServer();
    
    // Mock http.createServer to return our mock server
    jest.spyOn(http, 'createServer').mockReturnValue(mockServer);
    
    // Call the function being tested
    const result = createServer();
    
    // Assertions
    expect(http.createServer).toHaveBeenCalled();
    expect(result).toBe(mockServer);
  });
  
  it('should configure the server with handleRequest', () => {
    // Create a spy to capture the request handler function
    let capturedHandler;
    jest.spyOn(http, 'createServer').mockImplementation((handler) => {
      capturedHandler = handler;
      return createMockServer();
    });
    
    // Call the function being tested
    createServer();
    
    // Create mock request and response objects
    const mockReq = {};
    const mockRes = {};
    
    // Call the captured handler to verify it calls handleRequest
    capturedHandler(mockReq, mockRes);
    
    // Assertions
    expect(handleRequest).toHaveBeenCalledWith(mockReq, mockRes);
  });
});

// Test suite for startServer function
describe('startServer', () => {
  it('should start the server on the specified port', async () => {
    // Create a mock server
    const mockServer = createMockServer();
    
    // Start the server
    const startPromise = startServer(mockServer, 3000);
    
    // Simulate server successfully starting
    mockServer.emit('listening');
    
    // Wait for the promise to resolve
    await startPromise;
    
    // Assertions
    expect(mockServer.listen).toHaveBeenCalledWith(3000, expect.any(Function));
  });
  
  it('should log the port when server starts successfully', async () => {
    // Create a mock server
    const mockServer = createMockServer();
    
    // Start the server
    const startPromise = startServer(mockServer, 3000);
    
    // Simulate server successfully starting
    mockServer.emit('listening');
    
    // Wait for the promise to resolve
    await startPromise;
    
    // Assertions
    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining('3000'),
      'info'
    );
  });
  
  it('should reject the promise when server fails to start', async () => {
    // Create a mock server
    const mockServer = createMockServer();
    
    // Start the server
    const startPromise = startServer(mockServer, 3000);
    
    // Create a test error
    const testError = new Error('Test error');
    
    // Simulate server error
    mockServer.emit('error', testError);
    
    // Assertions
    await expect(startPromise).rejects.toEqual(testError);
  });
  
  it('should handle EADDRINUSE error specifically', async () => {
    // Create a mock server
    const mockServer = createMockServer();
    
    // Start the server
    const startPromise = startServer(mockServer, 3000);
    
    // Create an EADDRINUSE error
    const eaddrinuseError = new Error('Port already in use');
    eaddrinuseError.code = 'EADDRINUSE';
    
    // Simulate server error
    mockServer.emit('error', eaddrinuseError);
    
    // Assertions
    await expect(startPromise).rejects.toEqual(eaddrinuseError);
  });
});

// Test suite for stopServer function
describe('stopServer', () => {
  it('should stop the server if it is listening', async () => {
    // Create a mock server
    const mockServer = createMockServer();
    mockServer.listening = true;
    
    // Stop the server
    const stopPromise = stopServer(mockServer);
    
    // Simulate server successfully stopping
    mockServer.close.mock.calls[0][0](); // Call the close callback
    
    // Wait for the promise to resolve
    await stopPromise;
    
    // Assertions
    expect(mockServer.close).toHaveBeenCalled();
  });
  
  it('should resolve immediately if server is not listening', async () => {
    // Create a mock server
    const mockServer = createMockServer();
    mockServer.listening = false;
    
    // Stop the server
    await stopServer(mockServer);
    
    // Assertions
    expect(mockServer.close).not.toHaveBeenCalled();
  });
  
  it('should reject the promise when server fails to stop', async () => {
    // Create a mock server
    const mockServer = createMockServer();
    mockServer.listening = true;
    
    // Stop the server
    const stopPromise = stopServer(mockServer);
    
    // Create a test error
    const testError = new Error('Failed to close server');
    
    // Simulate server error during close
    mockServer.close.mock.calls[0][0](testError); // Call the close callback with error
    
    // Assertions
    await expect(stopPromise).rejects.toEqual(testError);
  });
  
  it('should log a message when server stops successfully', async () => {
    // Create a mock server
    const mockServer = createMockServer();
    mockServer.listening = true;
    
    // Stop the server
    const stopPromise = stopServer(mockServer);
    
    // Simulate server successfully stopping
    mockServer.close.mock.calls[0][0](); // Call the close callback
    
    // Wait for the promise to resolve
    await stopPromise;
    
    // Assertions
    expect(logMessage).toHaveBeenCalledWith(
      'Server stopped successfully',
      'info'
    );
  });
});

// Test suite for server error handling
describe('Server error handling', () => {
  it('should handle server errors properly', () => {
    // Spy on http.createServer
    const mockServer = createMockServer();
    jest.spyOn(http, 'createServer').mockReturnValue(mockServer);
    
    // Spy on server.on to capture the error handler
    const onSpy = jest.spyOn(mockServer, 'on');
    
    // Create the server to register the error handler
    createServer();
    
    // Check that an error handler was registered
    expect(onSpy).toHaveBeenCalledWith('error', expect.any(Function));
    
    // Get the error handler
    const errorHandler = onSpy.mock.calls.find(call => call[0] === 'error')[1];
    
    // Create a test error
    const testError = new Error('Test server error');
    
    // Call the error handler
    errorHandler(testError);
    
    // Assertions
    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining(testError.message),
      'error'
    );
  });
  
  it('should handle EADDRINUSE errors with specific message', () => {
    // Spy on http.createServer
    const mockServer = createMockServer();
    jest.spyOn(http, 'createServer').mockReturnValue(mockServer);
    
    // Spy on server.on to capture the error handler
    const onSpy = jest.spyOn(mockServer, 'on');
    
    // Create the server to register the error handler
    createServer();
    
    // Check that an error handler was registered
    expect(onSpy).toHaveBeenCalledWith('error', expect.any(Function));
    
    // Get the error handler
    const errorHandler = onSpy.mock.calls.find(call => call[0] === 'error')[1];
    
    // Create an EADDRINUSE error
    const eaddrinuseError = new Error('EADDRINUSE');
    eaddrinuseError.code = 'EADDRINUSE';
    
    // Call the error handler
    errorHandler(eaddrinuseError);
    
    // Assertions
    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining('Port is already in use'),
      'error'
    );
  });
});