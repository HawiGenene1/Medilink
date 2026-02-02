#!/bin/bash

# Medilink Deployment Script
# For production deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Configuration
ENVIRONMENT=${1:-production}
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Check if running as root for production
check_permissions() {
    if [ "$ENVIRONMENT" = "production" ] && [ "$EUID" -ne 0 ]; then
        error "Production deployment requires root privileges"
        exit 1
    fi
}

# Backup existing data
backup_data() {
    log "Creating backup..."
    
    mkdir -p $BACKUP_DIR
    
    # Backup database
    if command -v mongodump &> /dev/null; then
        mongodump --db medilink --out "$BACKUP_DIR/db_backup_$TIMESTAMP"
        success "Database backup created"
    fi
    
    # Backup uploads
    if [ -d "backend/uploads" ]; then
        cp -r backend/uploads "$BACKUP_DIR/uploads_backup_$TIMESTAMP"
        success "Uploads backup created"
    fi
    
    # Backup environment files
    cp backend/.env "$BACKUP_DIR/backend_env_$TIMESTAMP" 2>/dev/null || true
    cp frontend/.env "$BACKUP_DIR/frontend_env_$TIMESTAMP" 2>/dev/null || true
    success "Environment files backed up"
}

# Update code from repository
update_code() {
    log "Updating code..."
    
    # Pull latest changes
    git pull origin main
    
    success "Code updated"
}

# Build and deploy with Docker
deploy_docker() {
    log "Deploying with Docker..."
    
    # Stop existing containers
    docker-compose down
    
    # Build new images
    docker-compose build --no-cache
    
    # Start services
    docker-compose up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    if docker-compose ps | grep -q "unhealthy\|exited"; then
        error "Some services are not healthy"
        docker-compose ps
        exit 1
    fi
    
    success "Docker deployment completed"
}

# Traditional deployment (without Docker)
deploy_traditional() {
    log "Deploying traditionally..."
    
    # Install backend dependencies
    cd backend
    npm ci --only=production
    
    # Build frontend
    cd ../frontend
    npm ci
    npm run build
    
    # Setup PM2 if not exists
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
    fi
    
    # Start/restart backend with PM2
    cd ../backend
    pm2 restart medilink-backend || pm2 start src/server.js --name medilink-backend
    
    # Setup nginx for frontend
    if [ "$ENVIRONMENT" = "production" ]; then
        setup_nginx
    fi
    
    success "Traditional deployment completed"
}

# Setup nginx
setup_nginx() {
    log "Setting up nginx..."
    
    NGINX_CONFIG="/etc/nginx/sites-available/medilink"
    
    sudo tee $NGINX_CONFIG > /dev/null << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Frontend
    location / {
        root /var/www/medilink/frontend/build;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # Enable site
    sudo ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/
    
    # Test and reload nginx
    sudo nginx -t && sudo systemctl reload nginx
    
    success "Nginx configured"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Check backend
    if curl -f http://localhost:5000/ > /dev/null 2>&1; then
        success "Backend is healthy"
    else
        error "Backend health check failed"
        return 1
    fi
    
    # Check frontend
    if curl -f http://localhost:3000/ > /dev/null 2>&1; then
        success "Frontend is healthy"
    else
        warning "Frontend health check failed (may be starting)"
    fi
    
    # Check database
    if mongosh --eval "db.adminCommand('ismaster')" > /dev/null 2>&1; then
        success "Database is healthy"
    else
        error "Database health check failed"
        return 1
    fi
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    
    # Keep last 7 days of backups
    find $BACKUP_DIR -type d -name "*backup_*" -mtime +7 -exec rm -rf {} \;
    
    success "Old backups cleaned"
}

# Rollback function
rollback() {
    log "Rolling back to previous version..."
    
    # Stop current services
    if command -v docker-compose &> /dev/null; then
        docker-compose down
    else
        pm2 stop medilink-backend
    fi
    
    # Restore from latest backup
    LATEST_BACKUP=$(ls -t $BACKUP_DIR | head -n 1)
    
    if [ -d "$BACKUP_DIR/$LATEST_BACKUP" ]; then
        # Restore database
        if [ -d "$BACKUP_DIR/$LATEST_BACKUP/db_backup" ]; then
            mongorestore --db medilink --drop "$BACKUP_DIR/$LATEST_BACKUP/db_backup/medilink"
        fi
        
        # Restore uploads
        if [ -d "$BACKUP_DIR/$LATEST_BACKUP/uploads_backup" ]; then
            rm -rf backend/uploads
            cp -r "$BACKUP_DIR/$LATEST_BACKUP/uploads_backup" backend/uploads
        fi
        
        success "Rollback completed"
    else
        error "No backup found for rollback"
        exit 1
    fi
    
    # Restart services
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d
    else
        pm2 start medilink-backend
    fi
}

# Main deployment function
main() {
    echo ""
    echo "🚀 Medilink Deployment Script"
    echo "============================="
    echo "Environment: $ENVIRONMENT"
    echo ""
    
    case "${2:-deploy}" in
        "deploy")
            check_permissions
            backup_data
            update_code
            
            if command -v docker-compose &> /dev/null && [ -f "docker-compose.yml" ]; then
                deploy_docker
            else
                deploy_traditional
            fi
            
            health_check
            cleanup_backups
            success "Deployment completed successfully!"
            ;;
        "rollback")
            rollback
            ;;
        "health")
            health_check
            ;;
        "backup")
            backup_data
            ;;
        "help"|"-h"|"--help")
            echo "Medilink Deployment Script"
            echo ""
            echo "Usage: $0 [environment] [command]"
            echo ""
            echo "Environments:"
            echo "  production  - Production deployment (default)"
            echo "  staging     - Staging deployment"
            echo "  development - Development deployment"
            echo ""
            echo "Commands:"
            echo "  deploy     - Deploy the application (default)"
            echo "  rollback   - Rollback to previous version"
            echo "  health     - Check application health"
            echo "  backup     - Create backup"
            echo "  help       - Show this help"
            ;;
        *)
            error "Unknown command: $2"
            echo "Run '$0 help' for available commands"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
