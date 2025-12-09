// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');


// // Initialize Express app
// const app = express();

// // Configure environment variables

// require('dotenv').config();

// // Middleware
// app.use(cors());



// app.use(express.json());

// // Connect to MongoDB


// const MONGO_URI = process.env.MONGO_URI;
// mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })


// .then(() => console.log('MongoDB connected successfully'))
//   .catch(err => console.log('MongoDB connection error:', err));

// // Import routes
// const authRoutes = require('./routes/authRoutes');
// const adminRoutes = require('./routes/adminRoutes');
// const cashierRoutes = require('./routes/cashierRoutes');
// const customerRoutes = require('./routes/customerRoutes');
// const deliveryRoutes = require('./routes/deliveryRoutes');
// const pharmacyAdminRoutes = require('./routes/pharmacyAdminRoutes');
// const pharmacyRoutes = require('./routes/pharmacyRoutes');

// // Import middleware
// const { authenticate } = require('./middleware/authMiddleware');
// const { authorize } = require('./middleware/roleMiddleware');

// // API Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/admin', authenticate, authorize('admin'), adminRoutes);
// app.use('/api/cashier', authenticate, authorize('cashier'), cashierRoutes);
// app.use('/api/customer', authenticate, authorize('customer'), customerRoutes);
// app.use('/api/delivery', authenticate, authorize('delivery'), deliveryRoutes);
// app.use('/api/pharmacy-admin', authenticate, authorize('pharmacy_admin'), pharmacyAdminRoutes);
// app.use('/api/pharmacy', authenticate, authorize('pharmacy_staff', 'pharmacy_admin'), pharmacyRoutes);

// // Test route
// app.get('/', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Medilink backend is running!',
//     version: '1.0.0'
//   });
// });

// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found'
//   });
// });

// // Error handler
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({
//     success: false,
//     message: 'Something went wrong!',
//     error: process.env.NODE_ENV === 'development' ? err.message : undefined
//   });
// });

// // Start server

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

// });
// In server.js, update the MongoDB connection section to:

// Load environment variables
require('dotenv').config();

// ... other requires and middleware ...

// Get MongoDB URI from environment
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('MongoDB connection string not found in environment variables');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
})
.then(() => {
  console.log('MongoDB connected successfully');
  // Start the server only after DB connection is established
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
});