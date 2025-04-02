# Infrastructure Documentation
This directory contains infrastructure configuration and scripts for the Node.js Hello World HTTP server application.

## Overview
The infrastructure components provide tools for development, testing, and deployment of the application. The application is a simple Node.js HTTP server that exposes a single `/hello` endpoint returning "Hello world" to clients.

## Directory Structure
```
infrastructure/
├── docker/
│   ├── Dockerfile          # Docker image configuration
│   └── docker-compose.yml  # Docker Compose service definition
├── scripts/
│   ├── setup.sh            # Environment setup script
│   └── deploy.sh           # Deployment script
└── README.md              # This documentation file
```

## Prerequisites
To use these infrastructure components, you'll need:

- Node.js 18.x LTS (or higher)
- npm 8.x+ (included with Node.js)
- Docker 20.x+ (optional, for containerized deployment)
- Docker Compose 1.29+ (optional, for containerized deployment)

## Docker Configuration
The application can be containerized using Docker for consistent deployment across environments.

### Dockerfile
The `docker/Dockerfile` defines a container image based on Node.js 18 Alpine for minimal size. Key features:

- Uses the official Node.js 18 Alpine image
- Installs only production dependencies
- Exposes port 3000 by default
- Configurable via environment variables

To build the Docker image manually:

```bash
cd infrastructure/docker
docker build -t hello-world-server:latest ../../src/backend
```

### Docker Compose
The `docker/docker-compose.yml` file provides a service definition for easy deployment. Key features:

- Defines the hello-world-server service
- Maps container port 3000 to host port 3000
- Sets up environment variables
- Configures health checks and restart policy

To start the application using Docker Compose:

```bash
cd infrastructure/docker
docker-compose up -d
```

To stop the application:

```bash
docker-compose down
```

## Scripts
The `scripts/` directory contains shell scripts for environment setup and deployment.

### Setup Script
The `scripts/setup.sh` script prepares the development environment. It performs the following tasks:

- Checks for required tools (Node.js, npm)
- Sets up environment variables
- Installs application dependencies
- Optionally sets up Docker if available
- Runs tests to verify the setup

To run the setup script:

```bash
cd infrastructure/scripts
./setup.sh
```

### Deployment Script
The `scripts/deploy.sh` script handles application deployment to various environments. Features:

- Supports multiple deployment environments (development, staging, production)
- Offers direct or Docker-based deployment methods
- Packages the application for deployment
- Verifies successful deployment
- Provides rollback capability if deployment fails

To deploy the application:

```bash
cd infrastructure/scripts
./deploy.sh -e <environment> -m <method> -p <port>
```

Options:
- `-e` Environment (development, staging, production, default: development)
- `-m` Method (direct, docker, default: direct)
- `-p` Port (default: 3000)
- `-v` Version (default: from package.json)
- `-h` Display help information

## Deployment Environments
The application supports the following deployment environments:

1. **Development**: Local development environment for testing
   - Default port: 3000
   - NODE_ENV: development

2. **Staging**: Pre-production environment for final testing
   - Default port: 3000
   - NODE_ENV: production

3. **Production**: Production environment for end users
   - Default port: 3000
   - NODE_ENV: production

## Environment Variables
The application uses the following environment variables:

- `PORT`: HTTP server listening port (default: 3000)
- `NODE_ENV`: Runtime environment (development/production)

These can be set in the host environment, in Docker Compose configuration, or passed to the deployment script.

## Resource Requirements
The application has minimal resource requirements:

- CPU: 1 core (minimum)
- Memory: 256MB (minimum)
- Storage: 100MB
- Network: Basic HTTP connectivity

## Monitoring
For basic monitoring, you can:

1. Check container status with `docker ps` when using Docker
2. Verify the application is running by sending a request to the `/hello` endpoint:
   ```bash
   curl http://localhost:3000/hello
   ```
3. View logs:
   - Direct deployment: Check the application console output
   - Docker deployment: `docker logs <container_id>`

## Troubleshooting
Common issues and solutions:

1. **Port already in use**:
   - Change the port using the PORT environment variable
   - Check for and stop other services using the same port

2. **Docker container not starting**:
   - Check logs with `docker logs <container_id>`
   - Verify Docker daemon is running
   - Ensure ports are not already in use

3. **Application not responding**:
   - Verify the server is running
   - Check for errors in the logs
   - Ensure firewall rules allow the specified port

## Security Considerations
While this is a simple application, consider these security practices:

1. For production use, run the container as a non-root user
2. Regularly update Node.js and dependencies
3. Implement proper network security (firewalls, etc.)
4. Consider adding HTTPS for production deployments

## Additional Resources
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)