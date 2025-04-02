# Hello World Server

A simple Node.js HTTP server application that exposes a single REST endpoint `/hello` which returns "Hello world" to clients.

## Features

- HTTP server implementation in Node.js
- Single REST endpoint `/hello` returning "Hello world" text response
- Basic error handling for server startup and request processing
- Proper HTTP status codes and headers
- Configurable port via environment variables

## Requirements

- Node.js 18.x LTS or higher (16.x LTS minimum supported version)
- npm 8.x or higher

## Installation

```bash
# Clone the repository
git clone https://github.com/example/hello-world-server.git

# Navigate to the backend directory
cd hello-world-server/src/backend

# Install dependencies
npm install
```

## Usage

### Starting the Server

```bash
# Start the server in production mode
npm start

# Start the server in development mode with auto-restart
npm run dev
```

By default, the server will listen on port 3000. You can customize the port by setting the `PORT` environment variable:

```bash
# Start the server on port 8080
PORT=8080 npm start
```

### Making Requests

Once the server is running, you can make requests to the `/hello` endpoint:

```bash
# Using curl
curl http://localhost:3000/hello

# Using wget
wget -qO- http://localhost:3000/hello
```

You can also access the endpoint in a web browser by navigating to `http://localhost:3000/hello`.

## API Documentation

### Endpoints

#### GET /hello

Returns a simple "Hello world" message.

**Response:**
- Status Code: 200 OK
- Content-Type: text/plain
- Body: Hello world

### Error Responses

#### 404 Not Found

Returned when a request is made to an undefined route.

**Response:**
- Status Code: 404 Not Found
- Content-Type: text/plain
- Body: Not Found

#### 405 Method Not Allowed

Returned when a request uses an HTTP method that is not supported for the endpoint.

**Response:**
- Status Code: 405 Method Not Allowed
- Content-Type: text/plain
- Body: Method Not Allowed
- Headers: Allow: GET

#### 500 Internal Server Error

Returned when an unexpected error occurs during request processing.

**Response:**
- Status Code: 500 Internal Server Error
- Content-Type: text/plain
- Body: Internal Server Error

## Testing

The application includes comprehensive unit and integration tests using Jest and Supertest.

```bash
# Run all tests
npm test

# Run tests in watch mode for development
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

Test coverage reports are generated in the `coverage` directory.

## Development

### Project Structure

```
src/backend/
├── config.js         # Configuration management
├── handlers.js       # Request handlers
├── index.js         # Application entry point
├── server.js        # HTTP server implementation
├── utils.js         # Utility functions
├── tests/           # Test files
│   ├── config.test.js
│   ├── handlers.test.js
│   ├── integration.test.js
│   ├── performance.test.js
│   ├── server.test.js
│   └── utils.test.js
├── package.json     # Project metadata and dependencies
└── README.md       # This file
```

### Code Quality

The project uses ESLint for code quality enforcement:

```bash
# Run linting
npm run lint

# Fix linting issues automatically where possible
npm run lint:fix
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | The port number the server will listen on | 3000 |
| NODE_ENV | The environment mode (development, production) | development |

## License

This project is licensed under the MIT License - see the LICENSE file for details.