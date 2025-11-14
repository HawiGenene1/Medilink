# MediLink Backend API

Node.js/Express REST API for the MediLink pharmacy management system.

## 🚀 Features

- ✅ User authentication (Register/Login) with JWT
- ✅ Role-based access control (6 user roles)
- ✅ Password hashing with bcrypt
- ✅ Input validation with express-validator
- ✅ MongoDB database with Mongoose ODM
- ✅ CORS enabled
- ✅ Error handling middleware

## 📋 User Roles

1. **customer** - Browse and order medicines
2. **pharmacy_staff** - Manage inventory and prepare orders
3. **pharmacy_admin** - Platform-level pharmacy operations
4. **cashier** - Handle POS transactions
5. **delivery** - Manage deliveries
6. **admin** - System administration

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Environment**: dotenv

## 📦 Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/medilink
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRE=7d
   ```

3. **Start MongoDB** (if running locally):
   ```bash
   # Using MongoDB service
   mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo
   ```

4. **Run the server**:
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start at `http://localhost:5000`

## 🔐 API Endpoints

### Authentication Routes

#### 1. Register User
**POST** `/api/auth/register`

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123",
  "phone": "+1234567890",
  "role": "customer",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

**Password Requirements**:
- Minimum 6 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64abc123def456...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "role": "customer",
      "address": { ... }
    }
  }
}
```

#### 2. Login User
**POST** `/api/auth/login`

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64abc123def456...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "role": "customer",
      "lastLogin": "2024-11-07T10:30:00.000Z"
    }
  }
}
```

#### 3. Get Current User
**GET** `/api/auth/me`

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64abc123def456...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "role": "customer",
      "isEmailVerified": false,
      "lastLogin": "2024-11-07T10:30:00.000Z"
    }
  }
}
```

## 🔒 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Example with Axios:
```javascript
const response = await axios.get('http://localhost:5000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── jwt.js              # JWT configuration
│   │   └── db.js               # Database configuration (future)
│   ├── controllers/
│   │   └── authController.js   # Authentication logic
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT verification
│   │   └── roleMiddleware.js   # Role-based authorization
│   ├── models/
│   │   └── User.js             # User schema and model
│   ├── routes/
│   │   └── authRoutes.js       # Authentication routes
│   └── server.js               # Express app setup
├── .env.example                # Environment variables template
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

## 🧪 Testing with cURL

### Register a new user:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com",
    "password": "SecurePass123",
    "phone": "+1234567891",
    "role": "customer"
  }'
```

### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane.smith@example.com",
    "password": "SecurePass123"
  }'
```

### Get current user (replace TOKEN with actual JWT):
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Email is required",
      "param": "email",
      "location": "body"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access forbidden. Insufficient permissions."
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Server error",
  "error": "Error details (in development mode)"
}
```

## 🔧 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 5000 | No |
| `NODE_ENV` | Environment | development | No |
| `MONGO_URI` | MongoDB connection string | - | Yes |
| `JWT_SECRET` | Secret key for JWT | - | Yes |
| `JWT_EXPIRE` | Token expiration time | 7d | No |

## 🚦 Development

```bash
# Install dependencies
npm install

# Run in development mode (with nodemon)
npm run dev

# Run in production mode
npm start
```

## 📝 Notes

- Make sure MongoDB is running before starting the server
- Change `JWT_SECRET` in production to a strong, random value
- The User model includes automatic password hashing on save
- Passwords are never returned in API responses
- Token expires based on `JWT_EXPIRE` setting (default: 7 days)

## 🔜 Next Steps

- [ ] Implement password reset functionality
- [ ] Add email verification
- [ ] Create pharmacy management endpoints
- [ ] Add medicine inventory endpoints
- [ ] Implement order management
- [ ] Add delivery tracking
- [ ] Create admin dashboard endpoints

## 📄 License

ISC
