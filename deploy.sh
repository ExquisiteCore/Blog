#!/bin/bash

# Blog Application Deployment Script
# Usage: ./deploy.sh [command] [environment]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${2:-dev}
COMMAND=${1:-help}

# Print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Setup environment
setup_env() {
    print_info "Setting up environment for $ENVIRONMENT..."
    
    if [ "$ENVIRONMENT" = "prod" ]; then
        if [ ! -f ".env.prod" ]; then
            print_warning ".env.prod not found, creating from template..."
            cp .env.example .env.prod
            print_warning "Please edit .env.prod with your production values"
        fi
        
        # Create secrets directory
        mkdir -p secrets
        
        if [ ! -f "secrets/postgres_password.txt" ]; then
            print_warning "Creating postgres password secret..."
            openssl rand -base64 32 > secrets/postgres_password.txt
        fi
        
        if [ ! -f "secrets/jwt_secret.txt" ]; then
            print_warning "Creating JWT secret..."
            openssl rand -base64 64 > secrets/jwt_secret.txt
        fi
        
        # Set secure permissions
        chmod 600 secrets/*
    else
        if [ ! -f ".env" ]; then
            print_info "Creating .env from template..."
            cp .env.example .env
        fi
    fi
    
    print_success "Environment setup complete"
}

# Build images
build() {
    print_info "Building Docker images for $ENVIRONMENT..."
    
    if [ "$ENVIRONMENT" = "prod" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
    else
        docker-compose build --no-cache
    fi
    
    print_success "Build complete"
}

# Start services
start() {
    print_info "Starting services for $ENVIRONMENT..."
    
    if [ "$ENVIRONMENT" = "prod" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    else
        docker-compose up -d
    fi
    
    print_success "Services started"
    
    # Wait for services to be healthy
    print_info "Waiting for services to be healthy..."
    sleep 10
    
    # Check service health
    check_health
}

# Stop services
stop() {
    print_info "Stopping services for $ENVIRONMENT..."
    
    if [ "$ENVIRONMENT" = "prod" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
    else
        docker-compose down
    fi
    
    print_success "Services stopped"
}

# Restart services
restart() {
    print_info "Restarting services..."
    stop
    start
}

# Check service health
check_health() {
    print_info "Checking service health..."
    
    # Check database
    if docker-compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
        print_success "Database is healthy"
    else
        print_error "Database is not healthy"
    fi
    
    # Check backend
    if curl -f http://localhost:8080/health >/dev/null 2>&1; then
        print_success "Backend is healthy"
    else
        print_warning "Backend health check failed"
    fi
    
    # Check frontend
    if curl -f http://localhost:4321 >/dev/null 2>&1; then
        print_success "Frontend is healthy"
    else
        print_warning "Frontend health check failed"
    fi
}

# Show logs
logs() {
    print_info "Showing logs for $ENVIRONMENT..."
    
    if [ "$ENVIRONMENT" = "prod" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
    else
        docker-compose logs -f
    fi
}

# Show status
status() {
    print_info "Showing service status for $ENVIRONMENT..."
    
    if [ "$ENVIRONMENT" = "prod" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
    else
        docker-compose ps
    fi
}

# Clean up
cleanup() {
    print_info "Cleaning up Docker resources..."
    
    # Stop and remove containers
    stop
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes (be careful with this)
    read -p "Remove unused volumes? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker volume prune -f
    fi
    
    print_success "Cleanup complete"
}

# Backup database
backup() {
    print_info "Creating database backup..."
    
    mkdir -p ./backup
    
    BACKUP_FILE="./backup/blog_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if [ "$ENVIRONMENT" = "prod" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres Blog > "$BACKUP_FILE"
    else
        docker-compose exec -T postgres pg_dump -U postgres Blog > "$BACKUP_FILE"
    fi
    
    print_success "Database backup created: $BACKUP_FILE"
}

# Restore database
restore() {
    if [ -z "$3" ]; then
        print_error "Please specify backup file: ./deploy.sh restore [env] [backup_file]"
        exit 1
    fi
    
    BACKUP_FILE="$3"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        print_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    print_warning "This will overwrite the current database. Continue? (y/N)"
    read -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Restore cancelled"
        exit 0
    fi
    
    print_info "Restoring database from: $BACKUP_FILE"
    
    if [ "$ENVIRONMENT" = "prod" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres psql -U postgres -d Blog < "$BACKUP_FILE"
    else
        docker-compose exec -T postgres psql -U postgres -d Blog < "$BACKUP_FILE"
    fi
    
    print_success "Database restore complete"
}

# Update application
update() {
    print_info "Updating application..."
    
    # Pull latest code (assuming this script is in a git repo)
    if [ -d ".git" ]; then
        git pull
    fi
    
    # Rebuild and restart
    build
    restart
    
    print_success "Application updated"
}

# Show help
show_help() {
    echo "Blog Application Deployment Script"
    echo ""
    echo "Usage: $0 [command] [environment]"
    echo ""
    echo "Commands:"
    echo "  setup         Setup environment and prerequisites"
    echo "  build         Build Docker images"
    echo "  start         Start services"
    echo "  stop          Stop services"
    echo "  restart       Restart services"
    echo "  status        Show service status"
    echo "  logs          Show service logs"
    echo "  health        Check service health"
    echo "  backup        Backup database"
    echo "  restore       Restore database from backup"
    echo "  update        Update and restart application"
    echo "  cleanup       Clean up Docker resources"
    echo "  help          Show this help"
    echo ""
    echo "Environments:"
    echo "  dev           Development (default)"
    echo "  prod          Production"
    echo ""
    echo "Examples:"
    echo "  $0 start dev          Start development environment"
    echo "  $0 start prod         Start production environment"
    echo "  $0 backup prod        Backup production database"
    echo "  $0 restore dev backup.sql   Restore development database"
}

# Main execution
main() {
    case $COMMAND in
        setup)
            check_prerequisites
            setup_env
            ;;
        build)
            build
            ;;
        start)
            setup_env
            start
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        status)
            status
            ;;
        logs)
            logs
            ;;
        health)
            check_health
            ;;
        backup)
            backup
            ;;
        restore)
            restore "$@"
            ;;
        update)
            update
            ;;
        cleanup)
            cleanup
            ;;
        help|*)
            show_help
            ;;
    esac
}

# Run main function
main "$@"