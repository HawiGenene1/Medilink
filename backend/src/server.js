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
const MONGO_URI = process.env.MONGODB_URI;

// Connect to MongoDB only if URI is provided
// if (MONGO_URI) {
//   mongoose
//     .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//     .then(() => console.log('MongoDB connected successfully'))
//     .catch(err => console.log('MongoDB connection error:', err));
// } else {
//   console.log('MONGODB_URI not set. Skipping MongoDB connection.');
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.log('MongoDB connection error:', err));

// Import routes (only import what exists)
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); 
const medicineRoutes = require('./routes/medicineRoutes'); 
const prescriptionRoutes = require('./routes/prescriptionRoutes'); 
const orderRoutes = require('./routes/orderRoutes'); 
const deliveryRoutes = require('./routes/deliveryRoutes'); 
const favoriteRoutes = require('./routes/favoriteRoutes'); 
const chapaRoutes = require('./routes/chapaRoutes');

// API Routes (only use what exists)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); 
app.use('/api/medicines', medicineRoutes); 
app.use('/api/prescriptions', prescriptionRoutes); 
app.use('/api/orders', orderRoutes); 
app.use('/api/delivery', deliveryRoutes); 
app.use('/api/favorites', favoriteRoutes); 
app.use('/api/payments/chapa', chapaRoutes);

// Medicines API
try {
  app.use('/api/medicines', require('./routes/medicineRoutes'));
} catch (e) {
  console.warn('Medicine routes not mounted:', e.message);
}
try {
  app.use('/api/orders', require('./routes/orderRoutes'));
} catch (e) {
  console.warn('Order routes not mounted:', e.message);
}

try {
  app.use('/api/delivery', require('./routes/deliveryRoutes'));
} catch (e) {
  console.warn('Delivery routes not mounted:', e.message);
}

// app.use('/api/admin', authenticate, authorize('admin'), adminRoutes);
// app.use('/api/cashier', authenticate, authorize('cashier'), cashierRoutes);
// app.use('/api/customer', authenticate, authorize('customer'), customerRoutes);
// app.use('/api/delivery', authenticate, authorize('delivery'), deliveryRoutes);
// app.use('/api/pharmacy-admin', authenticate, authorize('pharmacy_admin'), pharmacyAdminRoutes);
// app.use('/api/pharmacy', authenticate, authorize('pharmacy_staff', 'pharmacy_admin'), pharmacyRoutes);

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
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});