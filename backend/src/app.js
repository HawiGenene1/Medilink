// In app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('colors');  // Add this line here
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');

// Route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const orderRoutes = require('./routes/orderRoutes');
const chapaRoutes = require('./routes/chapaRoutes');
const paymentCallbackRoutes = require('./routes/paymentCallbackRoutes');

// Load env vars
require('dotenv').config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/medicines', medicineRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments/chapa', chapaRoutes);
app.use('/api/v1/payments/callbacks', paymentCallbackRoutes);

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold)
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  server.close(() => process.exit(1));
});