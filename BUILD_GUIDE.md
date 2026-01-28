# Medilink - Complete Build Guide

## 🏗️ System Overview

Medilink is a comprehensive pharmacy management system with:
- **Backend**: Node.js/Express API with MongoDB
- **Frontend**: React.js with Ant Design UI
- **Features**: User management, pharmacy management, monitoring, audit logs

## 📋 Prerequisites

### System Requirements
- **Node.js**: v18.0.0 or higher
- **MongoDB**: v5.0 or higher (local or cloud)
- **npm**: v8.0.0 or higher
- **Git**: For version control

### Environment Setup
```bash
# Check Node.js version
node --version

# Check npm version  
npm --version

# Check MongoDB connection
mongosh --version
```

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd Medilink
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 🔧 Detailed Configuration

### Backend Configuration

#### Environment Variables (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/medilink

# Server
PORT=5000
NODE_ENV=development

# Email Service (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

#### Database Setup
```bash
# Start MongoDB (if using local)
mongod --dbpath /path/to/your/db

# Or connect to MongoDB Atlas
# Update MONGODB_URI in .env
```

### Frontend Configuration

#### Environment Variables (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_MAP_API_KEY=your-map-api-key
```

## 📦 Build Process

### Backend Build
```bash
cd backend

# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Frontend Build
```bash
cd frontend

# Install dependencies
npm install

# Run in development
npm start

# Build for production
npm run build

# Preview production build
npm run build && npm run preview
```

## 🗄️ Database Schema

### Users Collection
```javascript
{
  firstName: String,
  lastName: String,
  email: String,
  password: String, // Hashed
  role: String, // admin, pharmacy_admin, cashier, delivery, customer
  phone: String,
  isActive: Boolean,
  isEmailVerified: Boolean,
  pharmacyId: ObjectId, // For staff members
  address: Object,
  avatar: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Pharmacies Collection
```javascript
{
  name: String,
  email: String,
  phone: String,
  address: Object,
  location: Object, // Geo coordinates
  owner: Object,
  licenseNumber: String,
  documents: Array,
  isVerified: Boolean,
  isActive: Boolean,
  isBlocked: Boolean,
  subscription: Object,
  rating: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### PendingPharmacies Collection
```javascript
{
  name: String,
  email: String,
  phone: String,
  address: Object,
  ownerName: String,
  ownerEmail: String,
  ownerPhone: String,
  licenseNumber: String,
  documents: Array,
  status: String, // pending, approved, rejected
  createdAt: Date,
  updatedAt: Date
}
```

### AuditLogs Collection
```javascript
{
  userId: ObjectId,
  userEmail: String,
  userRole: String,
  action: String,
  resourceType: String,
  resourceId: ObjectId,
  description: String,
  details: Object,
  ipAddress: String,
  userAgent: String,
  status: String,
  createdAt: Date
}
```

## 🔐 Authentication & Security

### JWT Authentication
```javascript
// Login endpoint
POST /api/auth/login
{
  "email": "admin@medilink.com",
  "password": "admin123"
}

// Response
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@medilink.com",
    "role": "admin"
  }
}
```

### Role-Based Access Control
- **Admin**: Full system access
- **Pharmacy Admin**: Pharmacy management
- **Cashier**: Order processing
- **Delivery**: Order delivery
- **Customer**: Ordering and browsing

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Admin Management
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users/create-admin` - Create admin user
- `PATCH /api/admin/users/:id/disable` - Disable user
- `PATCH /api/admin/users/:id/enable` - Enable user
- `PATCH /api/admin/users/:id/role` - Update user role

### Pharmacy Management
- `GET /api/admin/registrations` - Get pending registrations
- `POST /api/admin/registrations/:id/approve` - Approve pharmacy
- `POST /api/admin/registrations/:id/reject` - Reject pharmacy

### System Monitoring
- `GET /api/monitoring/overview` - System overview
- `GET /api/monitoring/health` - System health
- `GET /api/monitoring/analytics/users` - User analytics
- `GET /api/monitoring/audit-logs` - Audit logs

## 🎨 Frontend Components

### Admin Dashboard
```javascript
// Main admin dashboard
src/pages/Admin/Dashboard/
├── index.js
├── UserManagement.js
├── PharmacyManagement.js
├── SystemMonitoring.js
└── AuditLogs.js
```

### Key Components
- **UserTable**: User management interface
- **PharmacyTable**: Pharmacy management
- **MonitoringCharts**: System analytics
- **AuditLogTable**: Activity logs

### UI Framework
- **Ant Design**: Primary UI components
- **React Router**: Navigation
- **Axios**: API calls
- **React Leaflet**: Maps integration

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run specific test
npm test -- --grep "User Management"

# Test coverage
npm run test:coverage
```

### Frontend Tests
```bash
cd frontend

# Run tests
npm test

# Test coverage
npm run test:coverage
```

## 🚀 Deployment

### Backend Deployment (Production)
```bash
# Build backend
cd backend
npm run build

# Start production server
npm start

# Or use PM2 for process management
pm2 start ecosystem.config.js
```

### Frontend Deployment
```bash
# Build frontend
cd frontend
npm run build

# Deploy to static hosting
# - Netlify, Vercel, AWS S3, etc.
```

### Docker Deployment
```bash
# Build Docker images
docker build -t medilink-backend ./backend
docker build -t medilink-frontend ./frontend

# Run with Docker Compose
docker-compose up -d
```

## 🔧 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```bash
# Check MongoDB status
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check connection
mongosh --eval "db.adminCommand('ismaster')"
```

#### 2. Port Already in Use
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
PORT=5001 npm run dev
```

#### 3. Dependency Conflicts
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

#### 4. Email Service Issues
```bash
# Check SMTP settings
# Use app password for Gmail
# Enable 2-factor authentication
# Use correct port (587 for TLS)
```

## 📈 Performance Optimization

### Backend Optimization
- **Database Indexing**: Proper indexes for queries
- **Caching**: Redis for session storage
- **Compression**: Gzip for API responses
- **Rate Limiting**: Prevent API abuse

### Frontend Optimization
- **Code Splitting**: Lazy loading components
- **Image Optimization**: Compress images
- **Bundle Analysis**: Optimize bundle size
- **Service Workers**: Offline caching

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy Medilink
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: echo "Deploy to production server"
```

## 📚 Documentation

### API Documentation
- **Swagger/OpenAPI**: Interactive API docs
- **Postman Collection**: API testing
- **Code Comments**: Inline documentation

### User Documentation
- **Admin Guide**: System administration
- **User Manual**: End-user instructions
- **Developer Guide**: Custom development

## 🤝 Contributing

### Development Workflow
1. Fork repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

### Code Standards
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **Conventional Commits**: Commit message format

## 📞 Support

### Technical Support
- **Documentation**: This guide
- **Issues**: GitHub issues
- **Email**: support@medilink.com
- **Discord**: Community support

### Emergency Contacts
- **System Admin**: admin@medilink.com
- **Technical Lead**: tech@medilink.com

---

## 🎯 Build Summary

This complete build guide covers:
- ✅ Full system setup
- ✅ Database configuration
- ✅ API development
- ✅ Frontend development
- ✅ Testing procedures
- ✅ Deployment strategies
- ✅ Troubleshooting guide
- ✅ Performance optimization
- ✅ CI/CD pipeline
- ✅ Documentation standards

**The Medilink system is now ready for production deployment!**
