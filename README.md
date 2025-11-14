# MediLink - Pharmacy Management System 💊

A full-stack web application for online pharmacy management with user authentication, role-based access control, and comprehensive medicine ordering system.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

MediLink is a modern pharmacy management system that allows customers to browse medicines, place orders, and track deliveries. It supports multiple user roles including customers, pharmacy staff, administrators, and delivery personnel.

**Live URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Base: http://localhost:5000/api

---

## ✨ Features

### Customer Features
- 🔐 User registration and authentication
- 🔍 Browse medicine catalog
- 🛒 Add medicines to cart
- 📦 Place and track orders
- 👤 Manage user profile
- 📍 Save delivery addresses

### Pharmacy Management
- 📊 Inventory management
- 📈 Sales analytics
- 👥 Staff management
- 🏪 Multi-pharmacy support
- 💰 Payment processing

### Delivery Management
- 🚚 Real-time order tracking
- 📱 Delivery personnel dashboard
- 🗺️ Route optimization
- ✅ Delivery confirmation

### Admin Features
- 👨‍💼 User management
- 🏥 Pharmacy oversight
- 📊 System analytics
- ⚙️ System configuration

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18.2
- **UI Library:** Ant Design 5
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **State Management:** Context API
- **Build Tool:** React Scripts

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcryptjs
- **Validation:** express-validator
- **CORS:** cors middleware

### Development Tools
- **Backend Dev:** Nodemon
- **Testing:** Jest, Supertest
- **API Testing:** Postman
- **Version Control:** Git

---

## 📁 Project Structure

```
Medilink/
├── frontend/                 # React frontend application
│   ├── public/              # Static files
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── layout/      # Layout components (Navbar, Footer)
│   │   │   └── common/      # Common UI components
│   │   ├── pages/           # Page components
│   │   │   ├── auth/        # Login, Register
│   │   │   ├── customer/    # Customer dashboard
│   │   │   ├── pharmacy/    # Pharmacy management
│   │   │   └── admin/       # Admin panel
│   │   ├── contexts/        # React Context (Auth, Cart)
│   │   ├── routes/          # Route configuration
│   │   ├── services/        # API services
│   │   ├── styles/          # Global styles
│   │   ├── App.js           # Main App component
│   │   └── index.js         # Entry point
│   ├── package.json
│   └── .env                 # Frontend environment variables
│
├── backend/                 # Express backend application
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   │   └── authController.js
│   │   ├── middleware/      # Custom middleware
│   │   │   └── authMiddleware.js
│   │   ├── models/          # Mongoose models
│   │   │   └── User.js
│   │   ├── routes/          # API routes
│   │   │   └── authRoutes.js
│   │   ├── config/          # Configuration files
│   │   │   ├── db.js        # MongoDB connection
│   │   │   └── jwt.js       # JWT utilities
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Server entry point
│   ├── package.json
│   └── .env                 # Backend environment variables
│
├── package.json             # Root package.json (run both)
└── README.md                # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (local or cloud instance)
- **npm** or **yarn**
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   cd c:\Users\Hp\Desktop\Medilink\Medilink
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

---

## 🔐 Environment Variables

### Backend (.env)

Create `backend/.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/medilink

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRE=30d

# CORS
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)

Create `frontend/.env` file:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=MediLink
```

---

## 📡 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/logout` | Logout user | Yes |

### Example: Register User

**Request:**
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "Test123",
  "phone": "+251912345678",
  "role": "customer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "customer"
    }
  }
}
```

### Example: Login

**Request:**
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Test123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

### Protected Routes

Add JWT token in Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 👥 User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| `customer` | Regular users who order medicines | Basic |
| `pharmacy_staff` | Pharmacy employees | Medium |
| `pharmacy_admin` | Pharmacy managers | High |
| `cashier` | Point-of-sale operators | Medium |
| `delivery` | Delivery personnel | Medium |
| `admin` | System administrators | Full |

### Password Requirements

- Minimum 6 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

**Valid Examples:** `Test123`, `Password1`, `MyPass2023`

---

## 🏃‍♂️ Running the Application

### Option 1: Run Both Together (Recommended)

```bash
# From root directory
npm run dev
```

This will start:
- Frontend on http://localhost:3000
- Backend on http://localhost:5000

### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Option 3: Production Mode

```bash
# From root directory
npm start
```

---

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
```

### API Testing with Postman

1. **Health Check:**
   ```
   GET http://localhost:5000/
   ```

2. **Register:**
   ```
   POST http://localhost:5000/api/auth/register
   ```

3. **Login:**
   ```
   POST http://localhost:5000/api/auth/login
   ```

4. **Get Profile:**
   ```
   GET http://localhost:5000/api/auth/me
   Headers: Authorization: Bearer YOUR_TOKEN
   ```

---

## 🐛 Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
# Windows - Kill process on port 3000
netstat -ano | findstr :3000
taskkill /F /PID <PID>

# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /F /PID <PID>
```

**2. MongoDB Connection Error**
- Ensure MongoDB is running
- Check MONGODB_URI in `.env`
- Verify MongoDB service is started

**3. CORS Errors**
- Verify FRONTEND_URL in backend `.env`
- Check frontend is running on port 3000
- Ensure backend CORS is configured

**4. JWT Token Issues**
- Check JWT_SECRET is set in `.env`
- Verify token format: `Bearer TOKEN`
- Get fresh token by logging in again

**5. Module Not Found**
```bash
# Reinstall dependencies
cd frontend && npm install
cd ../backend && npm install
cd .. && npm install
```

---

## 📦 Available Scripts

### Root Directory

| Command | Description |
|---------|-------------|
| `npm run dev` | Run both frontend & backend in dev mode |
| `npm start` | Run both in production mode |
| `npm run dev:frontend` | Run frontend only |
| `npm run dev:backend` | Run backend only |
| `npm run install:all` | Install all dependencies |

### Frontend

| Command | Description |
|---------|-------------|
| `npm start` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run tests |

### Backend

| Command | Description |
|---------|-------------|
| `npm start` | Start server |
| `npm run dev` | Start with nodemon |
| `npm test` | Run tests |

---

## 🔒 Security Features

- ✅ Password hashing with bcryptjs
- ✅ JWT authentication
- ✅ HTTP-only cookies for tokens
- ✅ Input validation with express-validator
- ✅ CORS protection
- ✅ Rate limiting (planned)
- ✅ XSS protection (planned)

---

## 🚧 Roadmap

- [x] User authentication system
- [x] Role-based access control
- [ ] Medicine catalog management
- [ ] Shopping cart functionality
- [ ] Order processing system
- [ ] Payment integration
- [ ] Delivery tracking
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Admin dashboard
- [ ] Analytics & reporting

---

## 📄 License

This project is licensed under the ISC License.

---

## 👨‍💻 Development

### Prerequisites for Development

1. **Code Editor:** VS Code (recommended)
2. **Extensions:**
   - ESLint
   - Prettier
   - ES7+ React/Redux/React-Native snippets
   - MongoDB for VS Code

### Development Workflow

1. Create a new branch for features
2. Make changes
3. Test locally
4. Commit with descriptive messages
5. Push and create pull request

---

## 📞 Support

For issues and questions:
- Check the Troubleshooting section
- Review API documentation
- Check console logs for errors

---

## 🎯 Quick Start Checklist

- [ ] Node.js installed
- [ ] MongoDB installed and running
- [ ] Dependencies installed (`npm install` in root, frontend, backend)
- [ ] `.env` files created in both frontend and backend
- [ ] MongoDB URI configured
- [ ] JWT secrets set
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can access http://localhost:3000
- [ ] Can access http://localhost:5000/api

---

**Built with ❤️ for efficient pharmacy management**
