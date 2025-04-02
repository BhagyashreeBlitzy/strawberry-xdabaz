/**
 * @fileoverview Performance tests for the Node.js Hello World server application.
 * Tests response time, throughput, and stability under load to ensure the server
 * meets performance requirements specified in the technical specification.
 */

// Import test functions from Jest
const { describe, it, expect, beforeAll, afterAll, jest } = require('@jest/globals'); // v29.5.0

// Import HTTP benchmarking tool for load testing
const autocannon = require('autocannon'); // v7.10.0

// Import Node.js core HTTP module
const http = require('http'); // built-in

// Import server-related functions from server.js
const { createServer, startServer, stopServer } = require('../server');

// Import utility functions
const { logMessage } = require('../utils');

/**
 * Helper function to get a random available port for testing
 * @returns {number} A random port number between 3000 and 9000
 */
function getRandomPort() {
  return Math.floor(Math.random() * 6000) + 3000; // Random port between 3000 and 9000
}

/**
 * Helper function to set up a test server instance for performance testing
 * @returns {Promise<object>} A promise that resolves to an object containing the server instance and port
 */
async function setupTestServer() {
  const port = getRandomPort();
  const server = createServer();
  await startServer(server, port);
  return { server, port };
}

/**
 * Runs a load test against the server using autocannon
 * @param {number} port - Port the server is running on
 * @param {object} options - Options for the autocannon load test
 * @returns {Promise<object>} A promise that resolves to the autocannon results
 */
function runLoadTest(port, options = {}) {
  const url = `http://localhost:${port}/hello`;
  
  // Default options for load test
  const defaultOptions = {
    connections: 10, // Default number of concurrent connections
    duration: 10,    // Default test duration in seconds
    title: 'Load Test' // Test title
  };
  
  // Merge provided options with defaults
  const testOptions = { ...defaultOptions, ...options };
  
  return new Promise((resolve, reject) => {
    autocannon({
      url,
      ...testOptions,
      setupClient: (client) => {
        client.on('error', (error) => {
          console.error(`Autocannon client error: ${error.message}`);
        });
      }
    }, (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(results);
    });
  });
}

/**
 * Makes a specified number of sequential HTTP requests to the server
 * @param {number} port - Port the server is running on
 * @param {string} path - Path to request (e.g., '/hello')
 * @param {number} count - Number of requests to make
 * @returns {Promise<Array>} A promise that resolves to an array of response times in milliseconds
 */
function makeSequentialRequests(port, path, count) {
  const responseTimes = [];
  
  // Function to make a single request and measure time
  const makeRequest = () => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const req = http.request({
        hostname: 'localhost',
        port,
        path,
        method: 'GET'
      }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          responseTimes.push(responseTime);
          resolve();
        });
      });
      
      req.on('error', (error) => {
        console.error(`Request error: ${error.message}`);
        responseTimes.push(null); // Mark failed requests
        resolve();
      });
      
      req.end();
    });
  };
  
  // Function to make requests sequentially
  const makeRequests = async (remaining) => {
    if (remaining <= 0) return;
    
    await makeRequest();
    return makeRequests(remaining - 1);
  };
  
  return makeRequests(count).then(() => responseTimes);
}

// Increase Jest timeout for long-running performance tests
beforeAll(() => {
  jest.setTimeout(120000); // 2 minutes
});

// Mock console methods to prevent excessive output during tests
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(logMessage).mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Server Performance Tests', () => {
  it('should respond to requests within 50ms on average', async () => {
    // Set up a test server
    const { server, port } = await setupTestServer();
    
    try {
      // Make 100 sequential requests to /hello
      const responseTimes = await makeSequentialRequests(port, '/hello', 100);
      
      // Calculate average response time
      const validTimes = responseTimes.filter(time => time !== null);
      const average = validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length;
      
      // Log for reference (this will be mocked in tests)
      console.log(`Average response time: ${average.toFixed(2)}ms`);
      
      // Assert that average response time is less than 50ms
      expect(average).toBeLessThan(50);
      
      // Verify all requests were successful
      expect(validTimes.length).toBe(100);
    } finally {
      // Ensure server is stopped after test
      await stopServer(server);
    }
  });
  
  it('should handle at least 1000 requests per second', async () => {
    // Set up a test server
    const { server, port } = await setupTestServer();
    
    try {
      // Run load test with 10 connections for 10 seconds
      const results = await runLoadTest(port, {
        connections: 10,
        duration: 10,
        title: 'Throughput Test'
      });
      
      // Log results for reference (this will be mocked in tests)
      console.log(`Requests per second: ${results.requests.average}`);
      console.log(`Latency (avg): ${results.latency.average}ms`);
      
      // Assert that requests per second is greater than 1000
      expect(results.requests.average).toBeGreaterThan(1000);
    } finally {
      // Ensure server is stopped after test
      await stopServer(server);
    }
  });
  
  it('should remain stable under 1-minute sustained load', async () => {
    // Set up a test server
    const { server, port } = await setupTestServer();
    
    try {
      // Run load test with 10 connections for 60 seconds
      const results = await runLoadTest(port, {
        connections: 10,
        duration: 60,
        title: 'Stability Test'
      });
      
      // Log results for reference (this will be mocked in tests)
      console.log(`Total requests: ${results.requests.total}`);
      console.log(`Errors: ${results.errors}`);
      
      // Assert that there were no errors
      expect(results.errors).toBe(0);
      
      // Make a final request to verify server is still responsive
      const responseTimes = await makeSequentialRequests(port, '/hello', 1);
      expect(responseTimes[0]).not.toBeNull();
    } finally {
      // Ensure server is stopped after test
      await stopServer(server);
    }
  });
  
  it('should handle concurrent connections efficiently', async () => {
    // Set up a test server
    const { server, port } = await setupTestServer();
    
    try {
      // Run load test with 100 connections for 10 seconds
      const results = await runLoadTest(port, {
        connections: 100,
        duration: 10,
        title: 'Concurrency Test'
      });
      
      // Log results for reference (this will be mocked in tests)
      console.log(`Average latency: ${results.latency.average}ms`);
      console.log(`Max latency: ${results.latency.max}ms`);
      
      // Assert that average latency is less than 100ms
      expect(results.latency.average).toBeLessThan(100);
      
      // Assert that max latency is less than 500ms
      expect(results.latency.max).toBeLessThan(500);
    } finally {
      // Ensure server is stopped after test
      await stopServer(server);
    }
  });
});

describe('Server Resource Usage Under Load', () => {
  it('should maintain reasonable memory usage under load', async () => {
    // Set up a test server
    const { server, port } = await setupTestServer();
    
    try {
      // Record initial memory usage
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Run load test with 50 connections for 30 seconds
      await runLoadTest(port, {
        connections: 50,
        duration: 30,
        title: 'Memory Usage Test'
      });
      
      // Record final memory usage
      const finalMemory = process.memoryUsage().heapUsed;
      
      // Calculate memory growth
      const memoryGrowthBytes = finalMemory - initialMemory;
      const memoryGrowthMB = memoryGrowthBytes / (1024 * 1024);
      
      // Log memory usage for reference (this will be mocked in tests)
      console.log(`Initial memory: ${(initialMemory / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`Final memory: ${(finalMemory / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`Memory growth: ${memoryGrowthMB.toFixed(2)} MB`);
      
      // Assert that memory growth is less than 100MB
      expect(memoryGrowthMB).toBeLessThan(100);
    } finally {
      // Ensure server is stopped after test
      await stopServer(server);
    }
  });
  
  it('should recover resources after load test completion', async () => {
    // Set up a test server
    const { server, port } = await setupTestServer();
    
    try {
      // Record initial memory usage
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Run load test with 50 connections for 30 seconds
      await runLoadTest(port, {
        connections: 50,
        duration: 30,
        title: 'Resource Recovery Test'
      });
      
      // Wait for 5 seconds to allow garbage collection
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Record final memory usage
      const finalMemory = process.memoryUsage().heapUsed;
      
      // Calculate memory difference
      const memoryDiffBytes = finalMemory - initialMemory;
      const memoryDiffMB = memoryDiffBytes / (1024 * 1024);
      
      // Log memory usage for reference (this will be mocked in tests)
      console.log(`Initial memory: ${(initialMemory / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`Final memory: ${(finalMemory / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`Memory difference: ${memoryDiffMB.toFixed(2)} MB`);
      
      // Assert that memory usage returned close to initial levels
      // Allow for some increase (20MB) as Node.js might not immediately GC everything
      expect(Math.abs(memoryDiffMB)).toBeLessThan(20);
    } finally {
      // Ensure server is stopped after test
      await stopServer(server);
    }
  });
});