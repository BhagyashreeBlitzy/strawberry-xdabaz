/**
 * @fileoverview Integration tests for the Node.js Hello World server application.
 * Tests the complete request-response cycle by starting an actual server instance
 * and making HTTP requests to verify correct behavior of all components working together.
 */

// Import testing utilities
const { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } = require('@jest/globals'); // v29.5.0
const request = require('supertest'); // v6.3.3
const net = require('net'); // Node.js core module for raw TCP connections

// Import server functions from server module
const { createServer, startServer, stopServer } = require('../server');

// Global test variables
let globalServer;
let originalConsoleLog;
let originalConsoleError;

/**
 * Helper function to get a random available port for testing
 * @returns {number} A random port number between 3000 and 9000
 */
function getRandomPort() {
  // Generate a random port between 3000 and 9000 to avoid conflicts
  return Math.floor(Math.random() * 6000) + 3000;
}

/**
 * Helper function to set up a test server instance for integration testing
 * @returns {Promise<object>} A promise that resolves to an object containing
 * the server instance and the port it's running on
 */
async function setupTestServer() {
  const port = getRandomPort();
  const server = createServer();
  await startServer(server, port);
  return { server, port };
}

// Setup before all tests
beforeAll(() => {
  // Mock console methods to prevent excessive output during tests
  originalConsoleLog = console.log;
  originalConsoleError = console.error;
  console.log = jest.fn();
  console.error = jest.fn();
});

// Cleanup after all tests
afterAll(() => {
  // Restore original console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Cleanup after each test
afterEach(async () => {
  // Ensure any server created during tests is properly stopped
  if (globalServer) {
    await stopServer(globalServer);
    globalServer = null;
  }
});

describe('Server Integration Tests', () => {
  it('should return Hello world with 200 status for GET /hello', async () => {
    // Set up test server
    const { server, port } = await setupTestServer();
    globalServer = server;

    // Make request to /hello endpoint
    const response = await request(server)
      .get('/hello')
      .set('Accept', 'text/plain');

    // Verify response
    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello world');
    expect(response.headers['content-type']).toContain('text/plain');
  });

  it('should return 404 Not Found for undefined routes', async () => {
    // Set up test server
    const { server, port } = await setupTestServer();
    globalServer = server;

    // Make request to undefined route
    const response = await request(server)
      .get('/undefined')
      .set('Accept', 'text/plain');

    // Verify response
    expect(response.status).toBe(404);
    expect(response.text).toContain('Not Found');
  });

  it('should return 405 Method Not Allowed for non-GET methods on /hello', async () => {
    // Set up test server
    const { server, port } = await setupTestServer();
    globalServer = server;

    // Make POST request to /hello endpoint
    const response = await request(server)
      .post('/hello')
      .set('Accept', 'text/plain');

    // Verify response
    expect(response.status).toBe(405);
    expect(response.text).toContain('Method Not Allowed');
    expect(response.headers['allow']).toBe('GET');
  });

  it('should handle multiple concurrent requests correctly', async () => {
    // Set up test server
    const { server, port } = await setupTestServer();
    globalServer = server;

    // Create 10 concurrent requests
    const requests = Array(10).fill().map(() => 
      request(server).get('/hello')
    );

    // Wait for all requests to complete
    const responses = await Promise.all(requests);

    // Verify all responses
    for (const response of responses) {
      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello world');
    }
  });
});

describe('Server Error Handling Integration', () => {
  it('should handle malformed requests gracefully', async () => {
    // Set up test server
    const { server, port } = await setupTestServer();
    globalServer = server;
    
    // Create a promise for sending a malformed request
    const sendMalformedRequest = new Promise((resolve, reject) => {
      const client = new net.Socket();
      
      client.connect(port, 'localhost', () => {
        // Send malformed HTTP request (not proper HTTP format)
        client.write('MALFORMED REQUEST DATA\r\n\r\n');
      });
      
      client.on('data', (data) => {
        // We expect some kind of response, even for malformed data
        client.destroy();
        resolve(data.toString());
      });
      
      client.on('error', (err) => {
        client.destroy();
        reject(err);
      });
      
      // Set a timeout to prevent hanging test
      setTimeout(() => {
        client.destroy();
        resolve('timeout');
      }, 1000);
    });
    
    // Send the malformed request
    await sendMalformedRequest.catch(err => {
      // Even if we get an error, the test should continue
      console.error('Error in malformed request test:', err);
    });
    
    // Make a valid request to verify server is still working
    const responseAfter = await request(server).get('/hello');
    expect(responseAfter.status).toBe(200);
    expect(responseAfter.text).toBe('Hello world');
  });

  it('should handle server startup and shutdown correctly', async () => {
    // Create server instance
    const server = createServer();
    const port = getRandomPort();
    
    // Start server
    await startServer(server, port);
    globalServer = server;
    
    // Verify server is listening
    expect(server.listening).toBe(true);
    
    // Make request to verify it's working
    const response = await request(server).get('/hello');
    expect(response.status).toBe(200);
    
    // Stop server gracefully
    await stopServer(server);
    
    // Verify server is no longer listening
    expect(server.listening).toBe(false);
    
    // Clear global reference as we've already stopped it
    globalServer = null;
  });
});

describe('End-to-End Request Flow', () => {
  it('should process request headers correctly', async () => {
    // Set up test server
    const { server, port } = await setupTestServer();
    globalServer = server;

    // Make request with custom headers
    const response = await request(server)
      .get('/hello')
      .set('X-Test-Header', 'test-value')
      .set('Accept', 'text/plain');

    // Verify response has correct headers
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['content-security-policy']).toBe("default-src 'self'");
  });

  it('should handle query parameters correctly', async () => {
    // Set up test server
    const { server, port } = await setupTestServer();
    globalServer = server;

    // Make request with query parameters
    const response = await request(server)
      .get('/hello?param=value')
      .set('Accept', 'text/plain');

    // Verify response ignores query parameters
    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello world');
  });
});