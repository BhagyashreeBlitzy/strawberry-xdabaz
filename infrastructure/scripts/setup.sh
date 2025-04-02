#!/bin/bash
# setup.sh - Setup script for the Node.js Hello World HTTP server application
# This script checks prerequisites, installs dependencies, configures the environment,
# and prepares the application for running or deployment.

# Color definitions for better console output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Directory paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/src/backend"
DOCKER_DIR="$PROJECT_ROOT/infrastructure/docker"

# Node.js version requirements (from package.json)
MIN_NODE_VERSION=16
RECOMMENDED_NODE_VERSION=18

# Default settings
SETUP_ENV="development"
PORT=3000

# Print usage information
print_usage() {
    echo "Usage: $(basename "$0") [OPTIONS]"
    echo "Setup the development environment for the Node.js Hello World HTTP server application."
    echo ""
    echo "Options:"
    echo "  -h, --help             Show this help message and exit"
    echo "  -e, --env ENV          Setup environment type (development or docker) [default: development]"
    echo "  -p, --port PORT        Port for the HTTP server [default: 3000]"
    echo ""
    echo "Examples:"
    echo "  $(basename "$0")                     # Setup development environment with default options"
    echo "  $(basename "$0") -e docker           # Setup Docker environment"
    echo "  $(basename "$0") -p 8080             # Setup development environment with port 8080"
    echo "  $(basename "$0") -e docker -p 8080   # Setup Docker environment with port 8080"
}

# Parse command line arguments
parse_arguments() {
    local args=("$@")
    local opts
    
    # Parse options using getopts
    while getopts ":he:p:-:" opts; do
        case $opts in
            h)
                print_usage
                exit 0
                ;;
            e)
                SETUP_ENV=$OPTARG
                ;;
            p)
                PORT=$OPTARG
                ;;
            -)
                case "${OPTARG}" in
                    help)
                        print_usage
                        exit 0
                        ;;
                    env=*)
                        SETUP_ENV="${OPTARG#*=}"
                        ;;
                    port=*)
                        PORT="${OPTARG#*=}"
                        ;;
                    *)
                        echo -e "${RED}Error: Unknown option --${OPTARG}${NC}" >&2
                        print_usage
                        return 1
                        ;;
                esac
                ;;
            \?)
                echo -e "${RED}Error: Unknown option -$OPTARG${NC}" >&2
                print_usage
                return 1
                ;;
            :)
                echo -e "${RED}Error: Option -$OPTARG requires an argument${NC}" >&2
                print_usage
                return 1
                ;;
        esac
    done
    
    # Validate environment type
    if [[ "$SETUP_ENV" != "development" && "$SETUP_ENV" != "docker" ]]; then
        echo -e "${RED}Error: Invalid environment type '$SETUP_ENV'. Must be 'development' or 'docker'.${NC}" >&2
        print_usage
        return 1
    fi
    
    # Validate port number
    if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1024 ] || [ "$PORT" -gt 65535 ]; then
        echo -e "${RED}Error: Invalid port number '$PORT'. Must be a number between 1024 and 65535.${NC}" >&2
        print_usage
        return 1
    fi
    
    echo -e "${GREEN}Setting up environment: ${SETUP_ENV}${NC}"
    echo -e "${GREEN}Using port: ${PORT}${NC}"
    
    return 0
}

# Check if Node.js version meets the minimum requirements
check_node_version() {
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: Node.js is not installed or not in PATH.${NC}" >&2
        echo "Please install Node.js version $RECOMMENDED_NODE_VERSION.x LTS or higher." >&2
        return 1
    fi
    
    # Get Node.js version
    local node_version
    node_version=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
    
    # Check if version is less than minimum required
    if [ "$node_version" -lt "$MIN_NODE_VERSION" ]; then
        echo -e "${RED}Error: Node.js version $node_version is less than the minimum required version $MIN_NODE_VERSION.${NC}" >&2
        echo "Please upgrade Node.js to version $RECOMMENDED_NODE_VERSION.x LTS or higher." >&2
        return 1
    fi
    
    # Check if version is less than recommended
    if [ "$node_version" -lt "$RECOMMENDED_NODE_VERSION" ]; then
        echo -e "${YELLOW}Warning: Node.js version $node_version is less than the recommended version $RECOMMENDED_NODE_VERSION.${NC}" >&2
        echo "Consider upgrading to Node.js version $RECOMMENDED_NODE_VERSION.x LTS for optimal compatibility." >&2
    else
        echo -e "${GREEN}Node.js version $node_version is compatible.${NC}"
    fi
    
    return 0
}

# Check if all required tools are installed
check_prerequisites() {
    echo "Checking prerequisites..."
    
    # Check Node.js version
    if ! check_node_version; then
        return 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}Error: npm is not installed or not in PATH.${NC}" >&2
        echo "Please install npm (usually comes with Node.js)." >&2
        return 1
    fi
    echo -e "${GREEN}npm is installed.${NC}"
    
    # Check Docker prerequisites if setting up Docker environment
    if [ "$SETUP_ENV" = "docker" ]; then
        # Check if Docker is installed
        if ! command -v docker &> /dev/null; then
            echo -e "${RED}Error: Docker is not installed or not in PATH.${NC}" >&2
            echo "Please install Docker to use the containerized environment." >&2
            return 1
        fi
        echo -e "${GREEN}Docker is installed.${NC}"
        
        # Check if Docker daemon is running
        if ! docker info &> /dev/null; then
            echo -e "${RED}Error: Docker daemon is not running.${NC}" >&2
            echo "Please start the Docker daemon to use the containerized environment." >&2
            return 1
        fi
        echo -e "${GREEN}Docker daemon is running.${NC}"
        
        # Check if docker-compose is installed
        if ! command -v docker-compose &> /dev/null; then
            echo -e "${YELLOW}Warning: docker-compose is not installed or not in PATH.${NC}" >&2
            echo "Consider installing docker-compose for easier container management." >&2
        else
            echo -e "${GREEN}docker-compose is installed.${NC}"
        fi
    fi
    
    echo -e "${GREEN}All prerequisites are met.${NC}"
    return 0
}

# Install Node.js dependencies
install_dependencies() {
    echo "Installing dependencies..."
    
    # Navigate to backend directory
    cd "$BACKEND_DIR" || {
        echo -e "${RED}Error: Could not navigate to backend directory at $BACKEND_DIR.${NC}" >&2
        return 1
    }
    
    # Install dependencies
    npm install
    local exit_code=$?
    
    if [ $exit_code -ne 0 ]; then
        echo -e "${RED}Error: Failed to install dependencies.${NC}" >&2
        return 1
    fi
    
    echo -e "${GREEN}Dependencies installed successfully.${NC}"
    return 0
}

# Create a .env file with default configuration values
create_env_file() {
    local env_file_path=$1
    local env_type=$2
    
    echo "Creating environment configuration..."
    
    # Check if .env file already exists
    if [ -f "$env_file_path" ]; then
        local backup_file="${env_file_path}.backup.$(date +%Y%m%d%H%M%S)"
        echo -e "${YELLOW}Warning: .env file already exists. Creating backup at $backup_file.${NC}" >&2
        cp "$env_file_path" "$backup_file"
    fi
    
    # Create .env file with default values
    if [ "$env_type" = "development" ]; then
        echo "# Environment configuration for Node.js Hello World HTTP server application" > "$env_file_path"
        echo "# Created by setup.sh on $(date)" >> "$env_file_path"
        echo "NODE_ENV=development" >> "$env_file_path"
        echo "PORT=$PORT" >> "$env_file_path"
        echo "# Add other environment variables below" >> "$env_file_path"
    elif [ "$env_type" = "docker" ]; then
        echo "# Docker Compose environment configuration" > "$env_file_path"
        echo "# Created by setup.sh on $(date)" >> "$env_file_path"
        echo "VERSION=latest" >> "$env_file_path"
        echo "PORT=$PORT" >> "$env_file_path"
        echo "NODE_ENV=production" >> "$env_file_path"
        echo "# Add other environment variables below" >> "$env_file_path"
    fi
    
    echo -e "${GREEN}Environment configuration created at $env_file_path.${NC}"
}

# Set up the development environment
setup_development_environment() {
    echo "Setting up development environment..."
    
    # Install dependencies
    if ! install_dependencies; then
        return 1
    fi
    
    # Create .env file for development
    local env_file_path="$BACKEND_DIR/.env"
    create_env_file "$env_file_path" "development"
    
    # Set up git hooks for pre-commit linting if Git is available
    if command -v git &> /dev/null && [ -d "$PROJECT_ROOT/.git" ]; then
        echo "Setting up Git hooks..."
        
        # Create a pre-commit hook script
        local hooks_dir="$PROJECT_ROOT/.git/hooks"
        local pre_commit_hook="$hooks_dir/pre-commit"
        
        if [ ! -f "$pre_commit_hook" ]; then
            cat > "$pre_commit_hook" << 'EOF'
#!/bin/bash
# Pre-commit Git hook for Node.js Hello World HTTP server application
# Runs linting on staged files

cd "$(git rev-parse --show-toplevel)/src/backend" || exit 1
npm run lint
EOF
            chmod +x "$pre_commit_hook"
            echo -e "${GREEN}Git pre-commit hook installed.${NC}"
        else
            echo -e "${YELLOW}Warning: Pre-commit hook already exists. Skipping.${NC}" >&2
        fi
    fi
    
    echo -e "${GREEN}Development environment setup completed.${NC}"
    return 0
}

# Set up the Docker environment
setup_docker_environment() {
    echo "Setting up Docker environment..."
    
    # Check if Docker directory exists
    if [ ! -d "$DOCKER_DIR" ]; then
        echo -e "${RED}Error: Docker directory not found at $DOCKER_DIR.${NC}" >&2
        echo "Please make sure the repository is correctly cloned and structured." >&2
        return 1
    fi
    
    # Navigate to Docker directory
    cd "$DOCKER_DIR" || {
        echo -e "${RED}Error: Could not navigate to Docker directory.${NC}" >&2
        return 1
    }
    
    # Create .env file for Docker
    local env_file_path="$DOCKER_DIR/.env"
    create_env_file "$env_file_path" "docker"
    
    # Build Docker image
    echo "Building Docker image..."
    docker build -t hello-world-server:latest -f Dockerfile "$PROJECT_ROOT"
    local exit_code=$?
    
    if [ $exit_code -ne 0 ]; then
        echo -e "${RED}Error: Failed to build Docker image.${NC}" >&2
        return 1
    fi
    
    echo -e "${GREEN}Docker environment setup completed.${NC}"
    return 0
}

# Verify that the setup was successful
verify_setup() {
    echo "Verifying setup..."
    
    if [ "$SETUP_ENV" = "development" ]; then
        # Check if package.json exists
        if [ ! -f "$BACKEND_DIR/package.json" ]; then
            echo -e "${RED}Error: package.json not found. Setup incomplete.${NC}" >&2
            return 1
        fi
        
        # Check if node_modules exists
        if [ ! -d "$BACKEND_DIR/node_modules" ]; then
            echo -e "${RED}Error: node_modules directory not found. Dependencies installation may have failed.${NC}" >&2
            return 1
        fi
        
        # Check if .env file exists
        if [ ! -f "$BACKEND_DIR/.env" ]; then
            echo -e "${RED}Error: .env file not found. Environment configuration may have failed.${NC}" >&2
            return 1
        fi
        
        # Try running tests to verify Node.js setup
        echo "Running tests to verify setup..."
        cd "$BACKEND_DIR" || {
            echo -e "${RED}Error: Could not navigate to backend directory.${NC}" >&2
            return 1
        }
        
        npm test -- --silent
        local exit_code=$?
        
        if [ $exit_code -ne 0 ]; then
            echo -e "${YELLOW}Warning: Tests failed. The setup may be incomplete or there might be issues with the codebase.${NC}" >&2
        else
            echo -e "${GREEN}Tests passed. Node.js application is correctly set up.${NC}"
        fi
    elif [ "$SETUP_ENV" = "docker" ]; then
        # Check if Docker image exists
        if ! docker image inspect hello-world-server:latest &> /dev/null; then
            echo -e "${RED}Error: Docker image 'hello-world-server:latest' not found. Docker setup may have failed.${NC}" >&2
            return 1
        fi
        
        # Check if .env file exists in Docker directory
        if [ ! -f "$DOCKER_DIR/.env" ]; then
            echo -e "${RED}Error: .env file not found in Docker directory. Environment configuration may have failed.${NC}" >&2
            return 1
        fi
        
        # Verify Docker Compose configuration if available
        if command -v docker-compose &> /dev/null && [ -f "$DOCKER_DIR/docker-compose.yml" ]; then
            echo "Verifying Docker Compose configuration..."
            cd "$DOCKER_DIR" || {
                echo -e "${RED}Error: Could not navigate to Docker directory.${NC}" >&2
                return 1
            }
            
            docker-compose config
            local exit_code=$?
            
            if [ $exit_code -ne 0 ]; then
                echo -e "${YELLOW}Warning: Docker Compose configuration is invalid.${NC}" >&2
            else
                echo -e "${GREEN}Docker Compose configuration is valid.${NC}"
            fi
        fi
        
        echo -e "${GREEN}Docker environment is correctly set up.${NC}"
    fi
    
    return 0
}

# Main function to orchestrate the setup process
main() {
    local args=("$@")
    local status=0
    
    # Parse command line arguments
    parse_arguments "${args[@]}" || return 1
    
    # Check prerequisites
    check_prerequisites || return 1
    
    # Set up environment based on SETUP_ENV
    if [ "$SETUP_ENV" = "development" ]; then
        setup_development_environment || status=$?
    elif [ "$SETUP_ENV" = "docker" ]; then
        setup_docker_environment || status=$?
    fi
    
    # Verify the setup
    verify_setup || status=$?
    
    # Print final status message
    if [ $status -eq 0 ]; then
        echo -e "${GREEN}Setup completed successfully!${NC}"
        
        # Print next steps
        echo ""
        echo "Next steps:"
        if [ "$SETUP_ENV" = "development" ]; then
            echo "1. Navigate to the backend directory: cd $BACKEND_DIR"
            echo "2. Start the application: npm start"
            echo "3. Access the Hello World endpoint: http://localhost:$PORT/hello"
        elif [ "$SETUP_ENV" = "docker" ]; then
            echo "1. Navigate to the Docker directory: cd $DOCKER_DIR"
            echo "2. Start the container: docker-compose up"
            echo "3. Access the Hello World endpoint: http://localhost:$PORT/hello"
        fi
    else
        echo -e "${RED}Setup completed with errors. Please review the output above.${NC}" >&2
    fi
    
    return $status
}

# Execute main function with all script arguments if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
    exit $?
fi

# Export check_prerequisites function for use by other scripts
export -f check_prerequisites