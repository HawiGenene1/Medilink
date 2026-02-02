require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const ErrorResponse = require('./utils/errorResponse');

// Initialize Express app
const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors()); // Allow all CORS for now, restrict later
app.use(express.json()); // parse JSON requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Incoming Request: ${req.method} ${req.url}`);
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});
app.use(express.urlencoded({ extended: true })); // parse URL-encoded requests
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use("/api/test", require("./routes/testRoutes"));

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const orderRoutes = require('./routes/orderRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const pharmacyOwnerRoutes = require('./routes/pharmacyOwnerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const orderProcessingRoutes = require('./routes/orderProcessingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const pharmacyAdminRoutes = require('./routes/pharmacyAdminRoutes');
const deliveryOnboardingRoutes = require('./routes/deliveryOnboardingRoutes');

// Import middleware
const { authenticate, authorize, protectAdmin } = require('./middleware/authMiddleware');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/delivery/onboarding', deliveryOnboardingRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/favorite', favoriteRoutes);
app.use('/api/pharmacy-owner', pharmacyOwnerRoutes);
app.use('/api/admin', protectAdmin, adminRoutes);
app.use('/api/pharmacy-admin', pharmacyAdminRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/order-processing', orderProcessingRoutes);
app.use('/api/notifications', notificationRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Medilink Admin Backend is running! (V1.0.1)',
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`[404] Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error(err.stack || err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }

  const statusCode = error.statusCode || 500;
  const statusMessage = error.message || 'Server Error';

  res.status(statusCode).json({
    success: false,
    message: statusMessage,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const http = require('http');
const { init } = require('./socket');

const server = http.createServer(app);
init(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
