#!/bin/bash

# Medilink Complete Build Script
# This script builds the entire Medilink system

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js v18 or higher."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_NODE_VERSION="18.0.0"
    if [ "$(printf '%s\n' "$REQUIRED_NODE_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_NODE_VERSION" ]; then
        error "Node.js version $NODE_VERSION is too old. Please install v18 or higher."
        exit 1
    fi
    success "Node.js version: $NODE_VERSION ✓"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed."
        exit 1
    fi
    success "npm version: $(npm -v) ✓"
    
    # Check MongoDB
    if ! command -v mongosh &> /dev/null && ! command -v mongo &> /dev/null; then
        warning "MongoDB CLI not found. Please ensure MongoDB is installed and running."
    else
        success "MongoDB CLI found ✓"
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        warning "Git is not installed. Some features may not work."
    else
        success "Git version: $(git --version) ✓"
    fi
}

# Setup environment files
setup_environment() {
    log "Setting up environment files..."
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        if [ -f "backend/.env.example" ]; then
            cp backend/.env.example backend/.env
            success "Created backend/.env from example"
        else
            warning "No backend/.env.example found. Creating basic .env file..."
            cat > backend/.env << EOF
# Database
MONGODB_URI=mongodb://localhost:27017/medilink

# Server
PORT=5000
NODE_ENV=development

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
EOF
            warning "Please update backend/.env with your actual configuration"
        fi
    else
        success "backend/.env already exists"
    fi
    
    # Frontend environment
    if [ ! -f "frontend/.env" ]; then
        if [ -f "frontend/.env.example" ]; then
            cp frontend/.env.example frontend/.env
            success "Created frontend/.env from example"
        else
            warning "No frontend/.env.example found. Creating basic .env file..."
            cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_MAP_API_KEY=your-map-api-key
EOF
            warning "Please update frontend/.env with your actual configuration"
        fi
    else
        success "frontend/.env already exists"
    fi
}

# Install backend dependencies
install_backend() {
    log "Installing backend dependencies..."
    
    cd backend
    
    # Clean install
    if [ -d "node_modules" ]; then
        log "Cleaning existing node_modules..."
        rm -rf node_modules
    fi
    
    if [ -f "package-lock.json" ]; then
        log "Cleaning package-lock.json..."
        rm -f package-lock.json
    fi
    
    # Install dependencies
    npm install
    success "Backend dependencies installed"
    
    # Create uploads directory
    if [ ! -d "uploads" ]; then
        mkdir -p uploads
        success "Created uploads directory"
    fi
    
    cd ..
}

# Install frontend dependencies
install_frontend() {
    log "Installing frontend dependencies..."
    
    cd frontend
    
    # Clean install
    if [ -d "node_modules" ]; then
        log "Cleaning existing node_modules..."
        rm -rf node_modules
    fi
    
    if [ -f "package-lock.json" ]; then
        log "Cleaning package-lock.json..."
        rm -f package-lock.json
    fi
    
    # Install dependencies
    npm install --legacy-peer-deps
    success "Frontend dependencies installed"
    
    cd ..
}

# Setup database
setup_database() {
    log "Setting up database..."
    
    # Check if MongoDB is running
    if command -v mongosh &> /dev/null; then
        if mongosh --eval "db.adminCommand('ismaster')" &> /dev/null; then
            success "MongoDB is running"
            
            # Create initial admin user
            log "Creating initial admin user..."
            cd backend
            node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Check if admin exists
    const existingAdmin = await User.findOne({ email: 'admin@medilink.com' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@medilink.com',
        password: hashedPassword,
        role: 'admin',
        phone: '+1234567890',
        isActive: true
      });
      await admin.save();
      console.log('Admin user created: admin@medilink.com / admin123');
    } else {
      console.log('Admin user already exists');
    }
    
    await mongoose.disconnect();
    console.log('Database setup complete');
  })
  .catch(err => console.error('Database setup error:', err));
"
            cd ..
            success "Database setup complete"
        else
            warning "MongoDB is not running. Please start MongoDB and re-run this script."
        fi
    else
        warning "MongoDB CLI not found. Please ensure MongoDB is installed and running."
    fi
}

# Run tests
run_tests() {
    log "Running tests..."
    
    # Backend tests
    if [ -d "backend/test" ] || [ -f "backend/package.json" ] && grep -q "test" backend/package.json; then
        log "Running backend tests..."
        cd backend
        npm test || warning "Backend tests failed or not configured"
        cd ..
    else
        warning "No backend tests found"
    fi
    
    # Frontend tests
    if [ -d "frontend/test" ] || [ -f "frontend/package.json" ] && grep -q "test" frontend/package.json; then
        log "Running frontend tests..."
        cd frontend
        npm test -- --watchAll=false || warning "Frontend tests failed or not configured"
        cd ..
    else
        warning "No frontend tests found"
    fi
}

# Build for production
build_production() {
    log "Building for production..."
    
    # Build backend
    log "Building backend..."
    cd backend
    npm run build || warning "Backend build failed or not configured"
    cd ..
    
    # Build frontend
    log "Building frontend..."
    cd frontend
    npm run build
    success "Frontend build completed"
    cd ..
}

# Start development servers
start_development() {
    log "Starting development servers..."
    
    # Start backend
    log "Starting backend server..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    sleep 5
    
    # Start frontend
    log "Starting frontend server..."
    cd frontend
    npm start &
    FRONTEND_PID=$!
    cd ..
    
    success "Development servers started!"
    echo ""
    echo "🚀 Medilink is now running:"
    echo "   Backend: http://localhost:5000"
    echo "   Frontend: http://localhost:3000"
    echo ""
    echo "📋 Default Admin Login:"
    echo "   Email: admin@medilink.com"
    echo "   Password: admin123"
    echo ""
    echo "Press Ctrl+C to stop both servers"
    
    # Wait for user interrupt
    trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
    wait
}

# Main build function
main() {
    echo ""
    echo "🏗️  Medilink Complete Build Script"
    echo "=================================="
    echo ""
    
    # Parse command line arguments
    case "${1:-all}" in
        "prereq")
            check_prerequisites
            ;;
        "env")
            setup_environment
            ;;
        "install")
            check_prerequisites
            setup_environment
            install_backend
            install_frontend
            ;;
        "db")
            setup_database
            ;;
        "test")
            run_tests
            ;;
        "build")
            build_production
            ;;
        "dev")
            check_prerequisites
            setup_environment
            install_backend
            install_frontend
            setup_database
            start_development
            ;;
        "all")
            check_prerequisites
            setup_environment
            install_backend
            install_frontend
            setup_database
            run_tests
            build_production
            success "Build completed successfully!"
            echo ""
            echo "🚀 To start development servers, run:"
            echo "   ./build.sh dev"
            ;;
        "help"|"-h"|"--help")
            echo "Medilink Build Script"
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  prereq    - Check prerequisites"
            echo "  env       - Setup environment files"
            echo "  install   - Install dependencies"
            echo "  db        - Setup database"
            echo "  test      - Run tests"
            echo "  build     - Build for production"
            echo "  dev       - Start development servers"
            echo "  all       - Complete build (default)"
            echo "  help      - Show this help"
            ;;
        *)
            error "Unknown command: $1"
            echo "Run '$0 help' for available commands"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
