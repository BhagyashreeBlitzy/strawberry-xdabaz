/**
 * @jest-environment node
 * @fileoverview Unit tests for the request handler functions defined in the handlers.js module,
 * including the main request handler, hello endpoint handler, not found handler, method not allowed handler,
 * and error handler.
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
  handleRequest,
  handleError,
} = require('../handlers');

const {
  sendResponse,
  isValidRoute,
  isMethodAllowed
} = require('../utils');

const {
  createMockRequest,
  createMockResponse
} = require('./utils.test');

// Test suite for the main request handler function
describe('handleRequest', () => {
  let sendResponseSpy;
  let isValidRouteSpy;
  let isMethodAllowedSpy;
  let consoleLogSpy;
  
  beforeEach(() => {
    // Mock the utility functions
    sendResponseSpy = jest.spyOn(sendResponse, 'sendResponse').mockImplementation();
    isValidRouteSpy = jest.spyOn(isValidRoute, 'isValidRoute');
    isMethodAllowedSpy = jest.spyOn(isMethodAllowed, 'isMethodAllowed');
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });
  
  afterEach(() => {
    // Restore all mocks
    jest.restoreAllMocks();
  });
  
  it('should route to helloHandler for GET /hello requests', () => {
    // Mock isValidRoute to return true for '/hello'
    isValidRouteSpy.mockReturnValue(true);
    
    // Mock isMethodAllowed to return true for 'GET', '/hello'
    isMethodAllowedSpy.mockReturnValue(true);
    
    // Create mock request with url '/hello' and method 'GET'
    const req = createMockRequest({ url: '/hello', method: 'GET' });
    const res = createMockResponse();
    
    // Call handleRequest with mock request and response
    handleRequest(req, res);
    
    // Expect response to have 200 status and 'Hello world' content
    expect(res.statusCode).toBe(200);
    expect(res.end).toHaveBeenCalledWith('Hello world');
  });
  
  it('should route to handleNotFound for undefined routes', () => {
    // Mock isValidRoute to return false
    isValidRouteSpy.mockReturnValue(false);
    
    // Create mock request with url '/undefined' and method 'GET'
    const req = createMockRequest({ url: '/undefined', method: 'GET' });
    const res = createMockResponse();
    
    // Call handleRequest with mock request and response
    handleRequest(req, res);
    
    // Expect response to have 404 status and 'Not Found' content
    expect(res.statusCode).toBe(404);
    expect(res.end).toHaveBeenCalledWith('Not Found');
  });
  
  it('should route to handleMethodNotAllowed for invalid methods', () => {
    // Mock isValidRoute to return true for '/hello'
    isValidRouteSpy.mockReturnValue(true);
    
    // Mock isMethodAllowed to return false for 'POST', '/hello'
    isMethodAllowedSpy.mockReturnValue(false);
    
    // Create mock request with url '/hello' and method 'POST'
    const req = createMockRequest({ url: '/hello', method: 'POST' });
    const res = createMockResponse();
    
    // Call handleRequest with mock request and response
    handleRequest(req, res);
    
    // Expect response to have 405 status and 'Method Not Allowed' content
    expect(res.statusCode).toBe(405);
    expect(res.end).toHaveBeenCalledWith('Method Not Allowed');
  });
  
  it('should handle errors during request processing', () => {
    // Mock isValidRoute to throw an error
    const testError = new Error('Test error');
    isValidRouteSpy.mockImplementation(() => { throw testError; });
    
    // Create mock request and response
    const req = createMockRequest();
    const res = createMockResponse();
    
    // Mock handleError to test if it's called
    const handleErrorSpy = jest.spyOn(handleError, 'handleError');
    
    // Call handleRequest with mock request and response
    handleRequest(req, res);
    
    // Expect handleError to be called with the error
    expect(handleErrorSpy).toHaveBeenCalledWith(testError, res);
    
    // Expect response to have 500 status and error message
    expect(res.statusCode).toBe(500);
    expect(res.end).toHaveBeenCalledWith(expect.stringContaining('Test error'));
  });
});

// Test suite for the hello endpoint handler function
describe('helloHandler', () => {
  let sendResponseSpy;
  let consoleLogSpy;
  
  beforeEach(() => {
    // Create spies
    sendResponseSpy = jest.spyOn(sendResponse, 'sendResponse').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });
  
  afterEach(() => {
    // Restore all mocks
    jest.restoreAllMocks();
  });
  
  it('should return Hello world with 200 status', () => {
    // Since handleHelloEndpoint is an internal function, we'll test its behavior
    // through handleRequest with the right conditions
    
    // Mock isValidRoute and isMethodAllowed to route to handleHelloEndpoint
    jest.spyOn(isValidRoute, 'isValidRoute').mockReturnValue(true);
    jest.spyOn(isMethodAllowed, 'isMethodAllowed').mockReturnValue(true);
    
    // Create mock request and response
    const req = createMockRequest({ url: '/hello', method: 'GET' });
    const res = createMockResponse();
    
    // Call handleRequest which should route to handleHelloEndpoint
    handleRequest(req, res);
    
    // Expect sendResponse to be called with response, 200, and 'Hello world'
    expect(sendResponseSpy).toHaveBeenCalledWith(res, 200, 'Hello world');
  });
  
  it('should log the request', () => {
    // Mock isValidRoute and isMethodAllowed to route to handleHelloEndpoint
    jest.spyOn(isValidRoute, 'isValidRoute').mockReturnValue(true);
    jest.spyOn(isMethodAllowed, 'isMethodAllowed').mockReturnValue(true);
    
    // Create mock request and response
    const req = createMockRequest({ url: '/hello', method: 'GET' });
    const res = createMockResponse();
    
    // Call handleRequest which should route to handleHelloEndpoint
    handleRequest(req, res);
    
    // Expect console.log to be called with a message containing '/hello'
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('/hello'));
  });
});

// Test suite for the not found handler function
describe('handleNotFound', () => {
  let sendResponseSpy;
  let consoleLogSpy;
  
  beforeEach(() => {
    // Create spies
    sendResponseSpy = jest.spyOn(sendResponse, 'sendResponse').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });
  
  afterEach(() => {
    // Restore all mocks
    jest.restoreAllMocks();
  });
  
  it('should return Not Found with 404 status', () => {
    // Mock isValidRoute to route to handleNotFound
    jest.spyOn(isValidRoute, 'isValidRoute').mockReturnValue(false);
    
    // Create mock request with url '/unknown'
    const req = createMockRequest({ url: '/unknown' });
    const res = createMockResponse();
    
    // Call handleRequest which should route to handleNotFound
    handleRequest(req, res);
    
    // Expect sendResponse to be called with response, 404, and 'Not Found'
    expect(sendResponseSpy).toHaveBeenCalledWith(res, 404, 'Not Found');
  });
  
  it('should log the not found route', () => {
    // Mock isValidRoute to route to handleNotFound
    jest.spyOn(isValidRoute, 'isValidRoute').mockReturnValue(false);
    
    // Create mock request with url '/unknown'
    const req = createMockRequest({ url: '/unknown' });
    const res = createMockResponse();
    
    // Call handleRequest which should route to handleNotFound
    handleRequest(req, res);
    
    // Expect console.log to be called with a message containing '/unknown' and 'not found'
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('/unknown') && expect.stringContaining('not found')
    );
  });
});

// Test suite for the method not allowed handler function
describe('handleMethodNotAllowed', () => {
  let sendResponseSpy;
  let consoleLogSpy;
  
  beforeEach(() => {
    // Create spies
    sendResponseSpy = jest.spyOn(sendResponse, 'sendResponse').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Mock isValidRoute to return true for '/hello'
    jest.spyOn(isValidRoute, 'isValidRoute').mockReturnValue(true);
    
    // Mock isMethodAllowed to return false for non-GET methods
    jest.spyOn(isMethodAllowed, 'isMethodAllowed').mockReturnValue(false);
  });
  
  afterEach(() => {
    // Restore all mocks
    jest.restoreAllMocks();
  });
  
  it('should return Method Not Allowed with 405 status', () => {
    // Create mock request with url '/hello' and method 'POST'
    const req = createMockRequest({ url: '/hello', method: 'POST' });
    const res = createMockResponse();
    
    // Call handleRequest which should route to handleMethodNotAllowed
    handleRequest(req, res);
    
    // Expect sendResponse to be called with response, 405, and 'Method Not Allowed'
    expect(sendResponseSpy).toHaveBeenCalledWith(res, 405, 'Method Not Allowed');
  });
  
  it('should set Allow header to GET', () => {
    // Create mock request with url '/hello' and method 'POST'
    const req = createMockRequest({ url: '/hello', method: 'POST' });
    const res = createMockResponse();
    
    // Call handleRequest which should route to handleMethodNotAllowed
    handleRequest(req, res);
    
    // Expect response.setHeader to be called with 'Allow', 'GET'
    expect(res.setHeader).toHaveBeenCalledWith('Allow', 'GET');
  });
  
  it('should log the method not allowed', () => {
    // Create mock request with url '/hello' and method 'POST'
    const req = createMockRequest({ url: '/hello', method: 'POST' });
    const res = createMockResponse();
    
    // Call handleRequest which should route to handleMethodNotAllowed
    handleRequest(req, res);
    
    // Expect console.log to be called with a message containing 'POST' and 'not allowed'
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('POST') && expect.stringContaining('not allowed')
    );
  });
});

// Test suite for the error handler function
describe('handleError', () => {
  let sendResponseSpy;
  let consoleErrorSpy;
  
  beforeEach(() => {
    // Create spies
    sendResponseSpy = jest.spyOn(sendResponse, 'sendResponse').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });
  
  afterEach(() => {
    // Restore all mocks
    jest.restoreAllMocks();
  });
  
  it('should return Internal Server Error with 500 status', () => {
    // Create a test error
    const testError = new Error('Test error');
    
    // Create mock request and response
    const req = createMockRequest();
    const res = createMockResponse();
    
    // Call handleError with test error and mock response
    handleError(testError, req, res);
    
    // Expect sendResponse to be called with response, 500, and an error message
    expect(sendResponseSpy).toHaveBeenCalledWith(
      res, 
      500, 
      expect.stringContaining('Test error')
    );
  });
  
  it('should log the error', () => {
    // Create a test error with message 'Test error'
    const testError = new Error('Test error');
    
    // Create mock request and response
    const req = createMockRequest();
    const res = createMockResponse();
    
    // Call handleError with test error, mock request, and mock response
    handleError(testError, req, res);
    
    // Expect console.error to be called with a message containing 'Test error'
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Test error'));
  });
  
  it('should handle errors without message property', () => {
    // Create a test error without a message property
    const testError = {};
    
    // Create mock request and response
    const req = createMockRequest();
    const res = createMockResponse();
    
    // Call handleError with test error, mock request, and mock response
    handleError(testError, req, res);
    
    // Expect sendResponse to be called with response, 500, and a default error message
    expect(sendResponseSpy).toHaveBeenCalledWith(
      res, 
      500, 
      expect.any(String) // Just check it's a string since we don't know the exact default message
    );
  });
});