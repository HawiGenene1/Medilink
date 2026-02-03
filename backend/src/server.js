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
app.use("/api/test", require("./routes/testRoutes"));

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

// Import Middleware
const { authenticate, authorize } = require('./middleware/authMiddleware');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Delivery Routes
app.use('/api/delivery', require('./routes/deliveryRoutes'));
app.use('/api/delivery/onboarding', require('./routes/deliveryOnboardingRoutes'));

// Pharmacy Routes (for pharmacy owners/staff)
app.use('/api/pharmacy', pharmacyRoutes);

// Pharmacy Admin Routes (platform-level administration)
app.use('/api/pharmacy-admin', pharmacyAdminRoutes);

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