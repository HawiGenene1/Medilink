require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// const morgan = require('morgan');
// require('colors');

// Initialize Express app
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // parse JSON requests
app.use(express.urlencoded({ extended: true })); // parse URL-encoded requests

/*
// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
*/
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Connect to MongoDB
const MONGO_URI = process.env.MONGODB_URI;
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));
} else {
  console.error('MONGODB_URI not found in environment variables');
}

// Import Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const pharmacyAdminRoutes = require('./routes/pharmacyAdminRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const chapaRoutes = require('./routes/chapaRoutes');
const paymentCallbackRoutes = require('./routes/paymentCallbackRoutes');
const medicineRoutes = require('./routes/medicineRoutes');

// Import Middleware
const { authenticate, authorize } = require('./middleware/authMiddleware');

// Define API prefixes for compatibility
const prefixes = ['/api', '/api/v1'];

prefixes.forEach(prefix => {
  // API Routes
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/users`, userRoutes);

  // Delivery Routes
  app.use(`${prefix}/delivery`, require('./routes/deliveryRoutes'));
  app.use(`${prefix}/delivery/onboarding`, require('./routes/deliveryOnboardingRoutes'));

  // Pharmacy Routes (for pharmacy owners/staff)
  app.use(`${prefix}/pharmacy`, pharmacyRoutes);

  // Pharmacy Admin Routes (platform-level administration)
  app.use(`${prefix}/pharmacy-admin`, pharmacyAdminRoutes);

  // Pharmacy Owner Routes
  app.use(`${prefix}/pharmacy-owner`, require('./routes/pharmacyOwnerRoutes'));

  // Inventory Routes
  app.use(`${prefix}/inventory`, require('./routes/inventoryRoutes'));

  // Order Processing Routes
  app.use(`${prefix}/order-processing`, require('./routes/orderProcessingRoutes'));

  // Order & Payment Routes
  app.use(`${prefix}/orders`, orderRoutes);
  app.use(`${prefix}/payments/chapa`, chapaRoutes);
  app.use(`${prefix}/payments/callbacks`, paymentCallbackRoutes);

  // Admin Routes (System-level management)
  try {
    app.use(`${prefix}/admin`, authenticate, authorize('system_admin'), adminRoutes);
  } catch (e) {
    if (prefix === '/api/v1') console.warn('Admin routes not mounted:', e.message);
  }

  // Medicines API
  try {
    app.use(`${prefix}/medicines`, medicineRoutes);
  } catch (e) {
    if (prefix === '/api/v1') console.warn('Medicine routes not mounted:', e.message);
  }
});

// Test route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Medilink backend is running!',
    version: '1.0.0'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});