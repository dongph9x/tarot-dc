#!/bin/bash

# Script quản lý Docker cho Tarot Discord Bot

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_status() {
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

check_env() {
    if [ ! -f ".env" ]; then
        print_error "File .env không tồn tại!"
        print_status "Tạo file .env từ env.example..."
        cp env.example .env
        print_warning "Vui lòng cấu hình file .env trước khi chạy!"
        exit 1
    fi
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker không được cài đặt!"
        exit 1
    fi
    
    # Check for Docker Compose v2 (docker compose) or v1 (docker-compose)
    if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose không được cài đặt!"
        exit 1
    fi
}

# Main script
case "$1" in
    "build")
        print_status "Building Docker image..."
        check_env
        check_docker
        docker compose build
        print_success "Build completed!"
        ;;
    
    "up")
        print_status "Starting services..."
        check_env
        check_docker
        docker compose up -d
        print_success "Services started!"
        print_status "Xem logs: ./scripts/docker.sh logs"
        ;;
    
    "down")
        print_status "Stopping services..."
        docker compose down
        print_success "Services stopped!"
        ;;
    
    "restart")
        print_status "Restarting services..."
        docker compose restart
        print_success "Services restarted!"
        ;;
    
    "logs")
        print_status "Showing logs..."
        docker compose logs -f discord-bot
        ;;
    
    "dev")
        print_status "Starting development environment..."
        check_env
        check_docker
        docker compose -f docker-compose.yml -f docker-compose.override.yml up -d
        print_success "Development environment started!"
        print_status "Xem logs: ./scripts/docker.sh logs"
        ;;
    
    "shell")
        print_status "Opening shell in container..."
        docker compose exec discord-bot sh
        ;;
    
    "status")
        print_status "Checking service status..."
        docker compose ps
        ;;
    
    "clean")
        print_warning "Cleaning up Docker resources..."
        docker compose down --volumes --remove-orphans
        docker system prune -f
        print_success "Cleanup completed!"
        ;;
    
    "rebuild")
        print_status "Rebuilding without cache..."
        check_env
        check_docker
        docker compose build --no-cache
        docker compose up -d
        print_success "Rebuild completed!"
        ;;
    
    "env")
        print_status "Checking environment variables in container..."
        docker compose exec discord-bot env | grep -E "(DISCORD|OPENAI|MONGODB|CHAT_ANALYZER|NOTIFICATION)"
        ;;
    
    *)
        echo "Usage: $0 {build|up|down|restart|logs|dev|shell|status|clean|rebuild|env}"
        echo ""
        echo "Commands:"
        echo "  build     - Build Docker image"
        echo "  up        - Start services (production)"
        echo "  down      - Stop services"
        echo "  restart   - Restart services"
        echo "  logs      - Show logs"
        echo "  dev       - Start development environment"
        echo "  shell     - Open shell in container"
        echo "  status    - Check service status"
        echo "  clean     - Clean up Docker resources"
        echo "  rebuild   - Rebuild without cache"
        echo "  env       - Check environment variables"
        exit 1
        ;;
esac
