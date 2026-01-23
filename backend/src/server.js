
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Initialize Express app
const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors()); // Allow all CORS for now, restrict later
app.use(express.json()); // parse JSON requests
app.use(express.urlencoded({ extended: true })); // parse URL-encoded requests
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { protectAdmin } = require('./middleware/authMiddleware');

// API Routes
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', protectAdmin, adminRoutes);
app.use('/api/delivery', require('./routes/deliveryRoutes'));


// Test route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Medilink Admin Backend is running!',
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
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
