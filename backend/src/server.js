require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Initialize Express app
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // parse JSON requests
app.use(express.urlencoded({ extended: true })); // parse URL-encoded requests
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
const cashierRoutes = require('./routes/cashierRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const chapaRoutes = require('./routes/chapaRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');

// Import Middleware
const { authenticate, authorize } = require('./middleware/authMiddleware');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Pharmacy Routes (for pharmacy owners/staff)
app.use('/api/pharmacy', pharmacyRoutes);

// Pharmacy Admin Routes (platform-level administration)
app.use('/api/pharmacy-admin', pharmacyAdminRoutes);

// Cashier Routes
app.use('/api/cashier', cashierRoutes);

// Order & Prescription Routes
app.use('/api/orders', orderRoutes);
app.use('/api/prescriptions', prescriptionRoutes);

// Delivery & Payment Routes
app.use('/api/delivery', deliveryRoutes);
app.use('/api/payments/chapa', chapaRoutes);

// Notifications & Favorites
try {
  app.use('/api/notifications', require('./routes/notificationRoutes'));
} catch (e) {
  console.warn('Notification routes not mounted:', e.message);
}
try {
  app.use('/api/favorites', require('./routes/favoriteRoutes'));
} catch (e) {
  console.warn('Favorite routes not mounted:', e.message);
}

// Admin Routes
try {
  app.use('/api/admin', authenticate, authorize('admin'), adminRoutes);
} catch (e) {
  console.warn('Admin routes not mounted:', e.message);
}

// Medicines API
try {
  app.use('/api/medicines', require('./routes/medicineRoutes'));
} catch (e) {
  console.warn('Medicine routes not mounted:', e.message);
}

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
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});