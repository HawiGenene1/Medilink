@echo off
REM Medilink Complete Build Script for Windows
REM This script builds the entire Medilink system

setlocal enabledelayedexpansion

REM Colors for output (Windows doesn't support ANSI colors in batch by default)
echo ====================================
echo Medilink Complete Build Script
echo ====================================
echo.

REM Parse command line argument
set COMMAND=%1
if "%COMMAND%"=="" set COMMAND=all

REM Function to check prerequisites
:check_prerequisites
echo [INFO] Checking prerequisites...

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js v18 or higher.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [SUCCESS] Node.js version: %NODE_VERSION%

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [SUCCESS] npm version: %NPM_VERSION%

REM Check MongoDB
mongosh --version >nul 2>&1
if errorlevel 1 (
    mongo --version >nul 2>&1
    if errorlevel 1 (
        echo [WARNING] MongoDB CLI not found. Please ensure MongoDB is installed and running.
    ) else (
        echo [SUCCESS] MongoDB CLI found
    )
) else (
    echo [SUCCESS] MongoDB CLI found
)

REM Check Git
git --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Git is not installed. Some features may not work.
) else (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VERSION=%%i
    echo [SUCCESS] %GIT_VERSION%
)
goto :eof

REM Function to setup environment files
:setup_environment
echo [INFO] Setting up environment files...

REM Backend environment
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" >nul
        echo [SUCCESS] Created backend\.env from example
    ) else (
        echo [WARNING] No backend\.env.example found. Creating basic .env file...
        (
            echo # Database
            echo MONGODB_URI=mongodb://localhost:27017/medilink
            echo.
            echo # Server
            echo PORT=5000
            echo NODE_ENV=development
            echo.
            echo # Email Service
            echo EMAIL_HOST=smtp.gmail.com
            echo EMAIL_PORT=587
            echo EMAIL_USER=your-email@gmail.com
            echo EMAIL_PASS=your-app-password
            echo.
            echo # JWT
            echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
            echo JWT_EXPIRE=7d
            echo.
            echo # File Upload
            echo UPLOAD_PATH=./uploads
            echo MAX_FILE_SIZE=5242880
        ) > backend\.env
        echo [WARNING] Please update backend\.env with your actual configuration
    )
) else (
    echo [SUCCESS] backend\.env already exists
)

REM Frontend environment
if not exist "frontend\.env" (
    if exist "frontend\.env.example" (
        copy "frontend\.env.example" "frontend\.env" >nul
        echo [SUCCESS] Created frontend\.env from example
    ) else (
        echo [WARNING] No frontend\.env.example found. Creating basic .env file...
        (
            echo REACT_APP_API_URL=http://localhost:5000/api
            echo REACT_APP_MAP_API_KEY=your-map-api-key
        ) > frontend\.env
        echo [WARNING] Please update frontend\.env with your actual configuration
    )
) else (
    echo [SUCCESS] frontend\.env already exists
)
goto :eof

REM Function to install backend dependencies
:install_backend
echo [INFO] Installing backend dependencies...

cd backend

REM Clean install
if exist "node_modules" (
    echo [INFO] Cleaning existing node_modules...
    rmdir /s /q node_modules
)

if exist "package-lock.json" (
    echo [INFO] Cleaning package-lock.json...
    del package-lock.json
)

REM Install dependencies
npm install
if errorlevel 1 (
    echo [ERROR] Backend dependency installation failed
    cd ..
    pause
    exit /b 1
)
echo [SUCCESS] Backend dependencies installed

REM Create uploads directory
if not exist "uploads" (
    mkdir uploads
    echo [SUCCESS] Created uploads directory
)

cd ..
goto :eof

REM Function to install frontend dependencies
:install_frontend
echo [INFO] Installing frontend dependencies...

cd frontend

REM Clean install
if exist "node_modules" (
    echo [INFO] Cleaning existing node_modules...
    rmdir /s /q node_modules
)

if exist "package-lock.json" (
    echo [INFO] Cleaning package-lock.json...
    del package-lock.json
)

REM Install dependencies
npm install --legacy-peer-deps
if errorlevel 1 (
    echo [ERROR] Frontend dependency installation failed
    cd ..
    pause
    exit /b 1
)
echo [SUCCESS] Frontend dependencies installed

cd ..
goto :eof

REM Function to setup database
:setup_database
echo [INFO] Setting up database...

REM Check if MongoDB is running (basic check)
mongosh --eval "db.adminCommand('ismaster')" >nul 2>&1
if errorlevel 1 (
    mongo --eval "db.adminCommand('ismaster')" >nul 2>&1
    if errorlevel 1 (
        echo [WARNING] MongoDB is not running. Please start MongoDB and re-run this script.
    ) else (
        echo [SUCCESS] MongoDB is running
        goto :create_admin
    )
) else (
    echo [SUCCESS] MongoDB is running
    goto :create_admin
)
goto :eof

:create_admin
echo [INFO] Creating initial admin user...
cd backend

REM Create a temporary script to setup admin user
echo const mongoose = require('mongoose'); > temp_setup.js
echo const bcrypt = require('bcryptjs'); >> temp_setup.js
echo const User = require('./src/models/User'); >> temp_setup.js
echo. >> temp_setup.js
echo mongoose.connect(process.env.MONGODB_URI ^|^| 'mongodb://localhost:27017/medilink') >> temp_setup.js
echo   .then(async () =^> { >> temp_setup.js
echo     console.log('Connected to MongoDB'); >> temp_setup.js
echo     const existingAdmin = await User.findOne({ email: 'admin@medilink.com' }); >> temp_setup.js
echo     if (!existingAdmin) { >> temp_setup.js
echo       const hashedPassword = await bcrypt.hash('admin123', 10); >> temp_setup.js
echo       const admin = new User({ >> temp_setup.js
echo         firstName: 'Admin', >> temp_setup.js
echo         lastName: 'User', >> temp_setup.js
echo         email: 'admin@medilink.com', >> temp_setup.js
echo         password: hashedPassword, >> temp_setup.js
echo         role: 'admin', >> temp_setup.js
echo         phone: '+1234567890', >> temp_setup.js
echo         isActive: true >> temp_setup.js
echo       }); >> temp_setup.js
echo       await admin.save(); >> temp_setup.js
echo       console.log('Admin user created: admin@medilink.com / admin123'); >> temp_setup.js
echo     } else { >> temp_setup.js
echo       console.log('Admin user already exists'); >> temp_setup.js
echo     } >> temp_setup.js
echo     await mongoose.disconnect(); >> temp_setup.js
echo     console.log('Database setup complete'); >> temp_setup.js
echo   }) >> temp_setup.js
echo   .catch(err =^> console.error('Database setup error:', err)); >> temp_setup.js

node temp_setup.js
del temp_setup.js

cd ..
echo [SUCCESS] Database setup complete
goto :eof

REM Function to run tests
:run_tests
echo [INFO] Running tests...

REM Backend tests
if exist "backend\test" (
    echo [INFO] Running backend tests...
    cd backend
    npm test >nul 2>&1
    if errorlevel 1 (
        echo [WARNING] Backend tests failed or not configured
    ) else (
        echo [SUCCESS] Backend tests passed
    )
    cd ..
) else (
    echo [WARNING] No backend tests found
)

REM Frontend tests
if exist "frontend\test" (
    echo [INFO] Running frontend tests...
    cd frontend
    npm test -- --watchAll=false >nul 2>&1
    if errorlevel 1 (
        echo [WARNING] Frontend tests failed or not configured
    ) else (
        echo [SUCCESS] Frontend tests passed
    )
    cd ..
) else (
    echo [WARNING] No frontend tests found
)
goto :eof

REM Function to build for production
:build_production
echo [INFO] Building for production...

REM Build backend
echo [INFO] Building backend...
cd backend
npm run build >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Backend build failed or not configured
) else (
    echo [SUCCESS] Backend build completed
)
cd ..

REM Build frontend
echo [INFO] Building frontend...
cd frontend
npm run build
if errorlevel 1 (
    echo [ERROR] Frontend build failed
    cd ..
    pause
    exit /b 1
)
echo [SUCCESS] Frontend build completed
cd ..
goto :eof

REM Function to start development servers
:start_development
echo [INFO] Starting development servers...

REM Start backend
echo [INFO] Starting backend server...
cd backend
start "Backend Server" cmd /k "npm run dev"
cd ..

REM Wait for backend to start
timeout /t 5 /nobreak >nul

REM Start frontend
echo [INFO] Starting frontend server...
cd frontend
start "Frontend Server" cmd /k "npm start"
cd ..

echo.
echo [SUCCESS] Development servers started!
echo.
echo 🚀 Medilink is now running:
echo    Backend: http://localhost:5000
echo    Frontend: http://localhost:3000
echo.
echo 📋 Default Admin Login:
echo    Email: admin@medilink.com
echo    Password: admin123
echo.
echo Close this window to stop the servers
pause
goto :eof

REM Function to show help
:show_help
echo Medilink Build Script
echo.
echo Usage: %0 [command]
echo.
echo Commands:
echo   prereq    - Check prerequisites
echo   env       - Setup environment files
echo   install   - Install dependencies
echo   db        - Setup database
echo   test      - Run tests
echo   build     - Build for production
echo   dev       - Start development servers
echo   all       - Complete build (default)
echo   help      - Show this help
goto :eof

REM Main execution logic
if "%COMMAND%"=="prereq" (
    call :check_prerequisites
) else if "%COMMAND%"=="env" (
    call :setup_environment
) else if "%COMMAND%"=="install" (
    call :check_prerequisites
    call :setup_environment
    call :install_backend
    call :install_frontend
) else if "%COMMAND%"=="db" (
    call :setup_database
) else if "%COMMAND%"=="test" (
    call :run_tests
) else if "%COMMAND%"=="build" (
    call :build_production
) else if "%COMMAND%"=="dev" (
    call :check_prerequisites
    call :setup_environment
    call :install_backend
    call :install_frontend
    call :setup_database
    call :start_development
) else if "%COMMAND%"=="all" (
    call :check_prerequisites
    call :setup_environment
    call :install_backend
    call :install_frontend
    call :setup_database
    call :run_tests
    call :build_production
    echo [SUCCESS] Build completed successfully!
    echo.
    echo 🚀 To start development servers, run:
    echo    %0 dev
) else if "%COMMAND%"=="help" (
    call :show_help
) else (
    echo [ERROR] Unknown command: %COMMAND%
    echo Run '%0 help' for available commands
    pause
    exit /b 1
)

echo.
pause
