#!/bin/bash
# deploy.sh - Deployment script for the Node.js Hello World HTTP server application
# Supports Docker and direct deployment methods with verification and rollback capabilities

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

# Default deployment settings
DEFAULT_PORT=3000
DEFAULT_VERSION=latest
DEFAULT_ENV=development
DEFAULT_METHOD=docker

# Print usage information
print_usage() {
    echo "Usage: $(basename "$0") [OPTIONS]"
    echo "Deploy the Node.js Hello World HTTP server application."
    echo ""
    echo "Options:"
    echo "  -h, --help             Show this help message and exit"
    echo "  -e, --env ENV          Deployment environment (development, staging, production) [default: development]"
    echo "  -v, --version VERSION  Version to deploy [default: latest]"
    echo "  -m, --method METHOD    Deployment method (docker, direct) [default: docker]"
    echo "  -H, --host HOST        Deployment host [default: localhost]"
    echo "  -p, --port PORT        Port for the HTTP server [default: 3000]"
    echo ""
    echo "Examples:"
    echo "  $(basename "$0")                            # Deploy to local development environment with Docker"
    echo "  $(basename "$0") -e production -H prod-server  # Deploy to production server with Docker"
    echo "  $(basename "$0") -m direct -p 8080            # Deploy directly (without Docker) on port 8080"
    echo "  $(basename "$0") -e staging -v 1.2.0          # Deploy version 1.2.0 to staging environment"
}

# Parse command line arguments
parse_arguments() {
    local args=("$@")
    local opts
    
    # Set default values
    DEPLOY_ENV="$DEFAULT_ENV"
    DEPLOY_VERSION="$DEFAULT_VERSION"
    DEPLOY_METHOD="$DEFAULT_METHOD"
    DEPLOY_HOST="localhost"
    DEPLOY_PORT="$DEFAULT_PORT"
    
    # Parse options using getopts
    while getopts ":he:v:m:H:p:-:" opts; do
        case $opts in
            h)
                print_usage
                exit 0
                ;;
            e)
                DEPLOY_ENV=$OPTARG
                ;;
            v)
                DEPLOY_VERSION=$OPTARG
                ;;
            m)
                DEPLOY_METHOD=$OPTARG
                ;;
            H)
                DEPLOY_HOST=$OPTARG
                ;;
            p)
                DEPLOY_PORT=$OPTARG
                ;;
            -)
                case "${OPTARG}" in
                    help)
                        print_usage
                        exit 0
                        ;;
                    env=*)
                        DEPLOY_ENV="${OPTARG#*=}"
                        ;;
                    version=*)
                        DEPLOY_VERSION="${OPTARG#*=}"
                        ;;
                    method=*)
                        DEPLOY_METHOD="${OPTARG#*=}"
                        ;;
                    host=*)
                        DEPLOY_HOST="${OPTARG#*=}"
                        ;;
                    port=*)
                        DEPLOY_PORT="${OPTARG#*=}"
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
    
    echo -e "${GREEN}Deployment configuration:${NC}"
    echo "  Environment: $DEPLOY_ENV"
    echo "  Version:     $DEPLOY_VERSION"
    echo "  Method:      $DEPLOY_METHOD"
    echo "  Host:        $DEPLOY_HOST"
    echo "  Port:        $DEPLOY_PORT"
    
    return 0
}

# Validate that the specified environment is supported
validate_environment() {
    case "$DEPLOY_ENV" in
        development|staging|production)
            echo -e "${GREEN}Environment '$DEPLOY_ENV' is valid.${NC}"
            return 0
            ;;
        *)
            echo -e "${RED}Error: Invalid environment '$DEPLOY_ENV'. Must be one of: development, staging, production${NC}" >&2
            return 1
            ;;
    esac
}

# Validate that the specified deployment method is supported
validate_deployment_method() {
    case "$DEPLOY_METHOD" in
        docker|direct)
            echo -e "${GREEN}Deployment method '$DEPLOY_METHOD' is valid.${NC}"
            return 0
            ;;
        *)
            echo -e "${RED}Error: Invalid deployment method '$DEPLOY_METHOD'. Must be one of: docker, direct${NC}" >&2
            return 1
            ;;
    esac
}

# Check if all required tools for deployment are installed
check_deployment_prerequisites() {
    echo "Checking deployment prerequisites..."
    
    # Source the setup.sh script to use its functions
    source "$SCRIPT_DIR/setup.sh" || {
        echo -e "${RED}Error: Could not source setup.sh script.${NC}" >&2
        return 1
    }
    
    # Check common prerequisites
    check_prerequisites || return 1
    
    # Check Docker prerequisites if using Docker deployment method
    if [[ "$DEPLOY_METHOD" == "docker" ]]; then
        if ! command -v docker &> /dev/null; then
            echo -e "${RED}Error: Docker is required for '$DEPLOY_METHOD' deployment but is not installed.${NC}" >&2
            return 1
        fi
        
        if ! command -v docker-compose &> /dev/null; then
            echo -e "${RED}Error: docker-compose is required for '$DEPLOY_METHOD' deployment but is not installed.${NC}" >&2
            return 1
        fi
        
        echo -e "${GREEN}Docker prerequisites are satisfied.${NC}"
    fi
    
    # Check SSH/SCP prerequisites if deploying to remote host
    if [[ "$DEPLOY_HOST" != "localhost" ]]; then
        if ! command -v ssh &> /dev/null; then
            echo -e "${RED}Error: ssh is required for remote deployment but is not installed.${NC}" >&2
            return 1
        fi
        
        if ! command -v scp &> /dev/null; then
            echo -e "${RED}Error: scp is required for remote deployment but is not installed.${NC}" >&2
            return 1
        fi
        
        echo -e "${GREEN}Remote deployment prerequisites are satisfied.${NC}"
    fi
    
    # Check curl for deployment verification
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}Error: curl is required for deployment verification but is not installed.${NC}" >&2
        return 1
    fi
    
    echo -e "${GREEN}All deployment prerequisites are satisfied.${NC}"
    return 0
}

# Prepare the application package for deployment
prepare_deployment_package() {
    echo "Preparing deployment package..."
    
    # Create temporary deployment directory
    local temp_dir="$PROJECT_ROOT/temp_deploy"
    rm -rf "$temp_dir" 2>/dev/null
    mkdir -p "$temp_dir" || {
        echo -e "${RED}Error: Failed to create temporary deployment directory.${NC}" >&2
        return 1
    }
    
    # Copy files based on deployment method
    if [[ "$DEPLOY_METHOD" == "direct" ]]; then
        # For direct deployment, copy the backend code
        cp -r "$BACKEND_DIR"/* "$temp_dir/" || {
            echo -e "${RED}Error: Failed to copy backend files to deployment directory.${NC}" >&2
            return 1
        }
        
        # Create environment-specific .env file
        cat > "$temp_dir/.env" << EOF
# Generated by deploy.sh for $DEPLOY_ENV environment on $(date)
NODE_ENV=$DEPLOY_ENV
PORT=$DEPLOY_PORT
# Add additional environment-specific configuration below
EOF
    elif [[ "$DEPLOY_METHOD" == "docker" ]]; then
        # For Docker deployment, copy Docker configuration files
        cp "$DOCKER_DIR/docker-compose.yml" "$temp_dir/" || {
            echo -e "${RED}Error: Failed to copy docker-compose.yml to deployment directory.${NC}" >&2
            return 1
        }
        
        cp "$DOCKER_DIR/Dockerfile" "$temp_dir/" || {
            echo -e "${RED}Error: Failed to copy Dockerfile to deployment directory.${NC}" >&2
            return 1
        }
        
        # Copy the application code for Docker builds
        mkdir -p "$temp_dir/app" || {
            echo -e "${RED}Error: Failed to create app directory in deployment package.${NC}" >&2
            return 1
        }
        
        cp -r "$BACKEND_DIR"/* "$temp_dir/app/" || {
            echo -e "${RED}Error: Failed to copy backend files to deployment package.${NC}" >&2
            return 1
        }
        
        # Create environment-specific .env file for Docker
        cat > "$temp_dir/.env" << EOF
# Generated by deploy.sh for $DEPLOY_ENV environment on $(date)
VERSION=$DEPLOY_VERSION
PORT=$DEPLOY_PORT
NODE_ENV=$DEPLOY_ENV
# Add additional environment-specific configuration below
EOF
    fi
    
    echo -e "${GREEN}Deployment package prepared successfully at $temp_dir${NC}"
    DEPLOY_TEMP_DIR="$temp_dir"
    return 0
}

# Deploy the application to the local environment
deploy_to_local() {
    echo "Deploying to local environment..."
    
    if [[ "$DEPLOY_METHOD" == "docker" ]]; then
        # Deploy using Docker
        cd "$DEPLOY_TEMP_DIR" || {
            echo -e "${RED}Error: Failed to navigate to deployment directory.${NC}" >&2
            return 1
        }
        
        echo "Building and starting Docker containers..."
        docker-compose up -d --build || {
            echo -e "${RED}Error: Failed to build and start Docker containers.${NC}" >&2
            return 1
        }
        
        # Wait for container to start
        echo "Waiting for container to start..."
        sleep 5
        
        echo -e "${GREEN}Docker deployment completed successfully.${NC}"
    elif [[ "$DEPLOY_METHOD" == "direct" ]]; then
        # Deploy directly using Node.js
        cd "$DEPLOY_TEMP_DIR" || {
            echo -e "${RED}Error: Failed to navigate to deployment directory.${NC}" >&2
            return 1
        }
        
        echo "Installing dependencies..."
        npm install --production || {
            echo -e "${RED}Error: Failed to install dependencies.${NC}" >&2
            return 1
        }
        
        echo "Starting application..."
        # Start the Node.js application in the background
        nohup node index.js > app.log 2>&1 & 
        local app_pid=$!
        echo $app_pid > app.pid
        
        # Wait for application to start
        echo "Waiting for application to start..."
        sleep 3
        
        # Check if process is still running
        if ! ps -p $app_pid > /dev/null; then
            echo -e "${RED}Error: Application failed to start. Check app.log for details.${NC}" >&2
            return 1
        fi
        
        echo -e "${GREEN}Direct deployment completed successfully. Application running with PID $app_pid.${NC}"
    fi
    
    return 0
}

# Deploy the application to a remote server
deploy_to_remote() {
    echo "Deploying to remote host $DEPLOY_HOST..."
    
    # Create a tarball of the deployment package
    cd "$PROJECT_ROOT" || {
        echo -e "${RED}Error: Failed to navigate to project root directory.${NC}" >&2
        return 1
    }
    
    local deploy_archive="deploy_package.tar.gz"
    tar -czf "$deploy_archive" -C "$(dirname "$DEPLOY_TEMP_DIR")" "$(basename "$DEPLOY_TEMP_DIR")" || {
        echo -e "${RED}Error: Failed to create deployment archive.${NC}" >&2
        return 1
    }
    
    # Transfer the package to the remote server using scp
    echo "Transferring deployment package to $DEPLOY_HOST..."
    scp "$deploy_archive" "$DEPLOY_HOST:/tmp/" || {
        echo -e "${RED}Error: Failed to transfer deployment archive to remote host.${NC}" >&2
        return 1
    }
    
    # Extract and deploy on the remote host
    echo "Deploying on remote host..."
    ssh "$DEPLOY_HOST" "
        set -e
        echo 'Extracting deployment package...'
        rm -rf /tmp/deploy
        mkdir -p /tmp/deploy
        tar -xzf /tmp/$deploy_archive -C /tmp/
        cd /tmp/$(basename "$DEPLOY_TEMP_DIR")
        
        if [[ \"$DEPLOY_METHOD\" == \"docker\" ]]; then
            echo 'Deploying with Docker...'
            docker-compose down
            docker-compose up -d --build
            
            # Wait for container to start
            echo 'Waiting for container to start...'
            sleep 5
        elif [[ \"$DEPLOY_METHOD\" == \"direct\" ]]; then
            echo 'Deploying directly with Node.js...'
            # Stop previous deployment if exists
            if [ -f 'app.pid' ]; then
                pid=\$(cat app.pid)
                if ps -p \$pid > /dev/null; then
                    echo 'Stopping previous deployment...'
                    kill \$pid
                    sleep 2
                fi
            fi
            
            # Install dependencies
            npm install --production
            
            # Start application
            echo 'Starting application...'
            nohup node index.js > app.log 2>&1 &
            echo \$! > app.pid
            
            # Wait for application to start
            sleep 3
            
            # Check if process is still running
            if ! ps -p \$(cat app.pid) > /dev/null; then
                echo 'Error: Application failed to start. Check app.log for details.'
                exit 1
            fi
        fi
        
        echo 'Deployment on remote host completed successfully.'
    " || {
        echo -e "${RED}Error: Remote deployment failed.${NC}" >&2
        return 1
    }
    
    # Clean up local archive
    rm -f "$deploy_archive"
    
    echo -e "${GREEN}Remote deployment to $DEPLOY_HOST completed successfully.${NC}"
    return 0
}

# Verify that the deployment was successful by checking the application endpoint
verify_deployment() {
    echo "Verifying deployment..."
    
    # Determine the URL to check based on deployment host and port
    local verify_url="http://${DEPLOY_HOST}:${DEPLOY_PORT}/hello"
    
    echo "Checking endpoint: $verify_url"
    
    # Try to connect to the endpoint with retry
    local max_retries=6
    local retry_delay=5
    local retry_count=0
    local success=false
    
    while [[ $retry_count -lt $max_retries && $success == false ]]; do
        # Check HTTP status code
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$verify_url")
        
        if [[ "$status_code" == "200" ]]; then
            # Check response body
            local response=$(curl -s "$verify_url")
            
            if [[ "$response" == "Hello world" ]]; then
                echo -e "${GREEN}Verification successful! Endpoint is responding correctly.${NC}"
                success=true
                break
            else
                echo -e "${YELLOW}Endpoint returned status 200 but unexpected response: $response${NC}" >&2
            fi
        else
            echo -e "${YELLOW}Attempt $((retry_count+1))/$max_retries: Endpoint returned status $status_code. Waiting $retry_delay seconds...${NC}" >&2
        fi
        
        ((retry_count++))
        sleep $retry_delay
    done
    
    if [[ $success == true ]]; then
        return 0
    else
        echo -e "${RED}Verification failed after $max_retries attempts.${NC}" >&2
        return 1
    fi
}

# Roll back the deployment if verification fails
rollback_deployment() {
    echo "Rolling back deployment..."
    local timestamp=$(date +"%Y%m%d%H%M%S")
    
    if [[ "$DEPLOY_HOST" == "localhost" ]]; then
        # Local rollback
        if [[ "$DEPLOY_METHOD" == "docker" ]]; then
            echo "Stopping Docker containers..."
            cd "$DEPLOY_TEMP_DIR" || {
                echo -e "${RED}Error: Failed to navigate to deployment directory.${NC}" >&2
                return 1
            }
            
            docker-compose down || {
                echo -e "${RED}Error: Failed to stop Docker containers.${NC}" >&2
                return 1
            }
            
            # Tag current image as failed
            docker tag hello-world-server:${DEPLOY_VERSION} hello-world-server:failed-${timestamp} || {
                echo -e "${YELLOW}Warning: Failed to tag current image as failed.${NC}" >&2
            }
            
            # If there's a previous version, try to restore it
            if [[ -n "$DEPLOY_VERSION" && "$DEPLOY_VERSION" != "latest" ]]; then
                echo "Attempting to restore previous version..."
                # In a real scenario, we'd pull the previous version tag
                docker-compose -f "$DOCKER_DIR/docker-compose.yml" up -d || {
                    echo -e "${RED}Error: Failed to restore previous version.${NC}" >&2
                    return 1
                }
            }
        elif [[ "$DEPLOY_METHOD" == "direct" ]]; then
            echo "Stopping application..."
            cd "$DEPLOY_TEMP_DIR" || {
                echo -e "${RED}Error: Failed to navigate to deployment directory.${NC}" >&2
                return 1
            }
            
            if [[ -f "app.pid" ]]; then
                local pid=$(cat app.pid)
                if ps -p $pid > /dev/null; then
                    kill $pid || {
                        echo -e "${RED}Error: Failed to stop application process.${NC}" >&2
                        return 1
                    }
                    echo "Process with PID $pid stopped."
                fi
            fi
            
            # Rename current directory to failed
            cd ..
            mv "$(basename "$DEPLOY_TEMP_DIR")" "failed-$(basename "$DEPLOY_TEMP_DIR")-${timestamp}" || {
                echo -e "${YELLOW}Warning: Failed to rename failed deployment directory.${NC}" >&2
            }
            
            echo "Note: For a complete rollback in production, restore from a previous backup."
        fi
    else
        # Remote rollback
        echo "Rolling back remote deployment on $DEPLOY_HOST..."
        ssh "$DEPLOY_HOST" "
            set -e
            cd /tmp/$(basename "$DEPLOY_TEMP_DIR")
            
            if [[ \"$DEPLOY_METHOD\" == \"docker\" ]]; then
                echo 'Stopping Docker containers...'
                docker-compose down
                
                # Tag current image as failed
                docker tag hello-world-server:${DEPLOY_VERSION} hello-world-server:failed-${timestamp} || echo 'Warning: Failed to tag current image as failed.'
                
                # If there's a previous version, try to restore it
                if [[ -n \"$DEPLOY_VERSION\" && \"$DEPLOY_VERSION\" != \"latest\" ]]; then
                    echo 'Attempting to restore previous version...'
                    # In a real scenario, we'd pull the previous version tag
                    docker-compose up -d
                fi
            elif [[ \"$DEPLOY_METHOD\" == \"direct\" ]]; then
                echo 'Stopping application...'
                if [ -f 'app.pid' ]; then
                    pid=\$(cat app.pid)
                    if ps -p \$pid > /dev/null; then
                        kill \$pid
                        echo 'Process stopped.'
                    fi
                fi
                
                # Rename current directory to failed
                cd ..
                mv \"$(basename "$DEPLOY_TEMP_DIR")\" \"failed-$(basename "$DEPLOY_TEMP_DIR")-${timestamp}\" || echo 'Warning: Failed to rename failed deployment directory.'
                
                echo 'Note: For a complete rollback in production, restore from a previous backup.'
            fi
            
            echo 'Rollback on remote host completed.'
        " || {
            echo -e "${RED}Error: Remote rollback failed.${NC}" >&2
            return 1
        }
    fi
    
    echo -e "${YELLOW}Rollback completed. Note that service may still be unavailable.${NC}" >&2
    return 0
}

# Clean up temporary files and resources after deployment
cleanup() {
    echo "Cleaning up temporary files..."
    
    # Remove temporary deployment directory if it exists
    if [[ -n "$DEPLOY_TEMP_DIR" && -d "$DEPLOY_TEMP_DIR" ]]; then
        rm -rf "$DEPLOY_TEMP_DIR" || {
            echo -e "${YELLOW}Warning: Failed to remove temporary deployment directory.${NC}" >&2
        }
    fi
    
    # Remove any other temporary files
    rm -f "$PROJECT_ROOT/deploy_package.tar.gz" 2>/dev/null
    
    echo -e "${GREEN}Cleanup completed.${NC}"
}

# Main function that orchestrates the deployment process
main() {
    local args=("$@")
    local status=0
    
    # Parse command line arguments
    parse_arguments "${args[@]}" || return 1
    
    # Validate environment and deployment method
    validate_environment || return 1
    validate_deployment_method || return 1
    
    # Check prerequisites
    check_deployment_prerequisites || return 1
    
    # Prepare deployment package
    prepare_deployment_package || return 1
    
    # Deploy based on target host
    if [[ "$DEPLOY_HOST" == "localhost" ]]; then
        deploy_to_local || status=$?
    else
        deploy_to_remote || status=$?
    fi
    
    # Verify deployment if previous steps were successful
    if [[ $status -eq 0 ]]; then
        if ! verify_deployment; then
            echo -e "${YELLOW}Deployment verification failed. Attempting rollback...${NC}" >&2
            rollback_deployment
            status=1
        fi
    fi
    
    # Always perform cleanup
    cleanup
    
    # Print final status message
    if [[ $status -eq 0 ]]; then
        echo -e "${GREEN}Deployment completed successfully!${NC}"
        echo "Application is available at: http://${DEPLOY_HOST}:${DEPLOY_PORT}/hello"
    else
        echo -e "${RED}Deployment failed. Please check the logs for details.${NC}" >&2
    fi
    
    return $status
}

# Execute main function if the script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
    exit $?
fi