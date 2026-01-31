// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');

// // Initialize Express app
// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Import routes
// const authRoutes = require('./routes/authRoutes');

// // API Routes
// app.use('/api/auth', authRoutes);

// // Test route
// app.get('/', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Medilink backend is running!',
//     version: '1.0.0'
//   });
// });

// // MongoDB connection
// const MONGO_URI = process.env.MONGODB_URI;
// if (MONGO_URI) {
//   mongoose.connect(MONGO_URI)
//     .then(() => console.log('MongoDB connected successfully'))
//     .catch(err => console.log('MongoDB connection error:', err));
// } else {
//   console.log('MongoDB URI not found in environment variables');
// }

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const ErrorResponse = require('./utils/errorResponse');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // parse JSON requests
app.use(express.urlencoded({ extended: true })); // parse URL-encoded requests
app.use("/api/test", require("./routes/testRoutes"));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Get environment variables
const PORT = process.env.PORT || 5000;
// MongoDB connection connection
const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink';
    console.log(`Connecting to MongoDB: ${connUri}`);

    await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 5000, // Fail fast if no connection
    });

    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    // Don't exit in dev mode, maybe it'll reconnect
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

connectDB();


// Import routes (only import what exists)
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); // Added
const medicineRoutes = require('./routes/medicineRoutes'); // Added
const prescriptionRoutes = require('./routes/prescriptionRoutes'); // Added
const orderRoutes = require('./routes/orderRoutes'); // Added
const deliveryRoutes = require('./routes/deliveryRoutes'); // Added
const favoriteRoutes = require('./routes/favoriteRoutes'); // Added
const pharmacyOwnerRoutes = require('./routes/pharmacyOwnerRoutes'); // Added
const adminRoutes = require('./routes/adminRoutes'); // Enabled
const pharmacyRoutes = require('./routes/pharmacyRoutes'); // Enabled
const inventoryRoutes = require('./routes/inventoryRoutes'); // Added
const orderProcessingRoutes = require('./routes/orderProcessingRoutes'); // Added

// Import middleware (comment out if files don't exist)
const { authenticate, authorize } = require('./middleware/authMiddleware');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/pharmacy-owner', pharmacyOwnerRoutes);
app.use('/api/admin', adminRoutes); // Mount admin routes
app.use('/api/pharmacy', pharmacyRoutes); // Mount pharmacy routes (public for registration)
app.use('/api/inventory', inventoryRoutes); // Mount inventory routes
app.use('/api/order-processing', orderProcessingRoutes); // Mount order processing routes

// Test route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Medilink backend is running!',
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});