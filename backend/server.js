require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Connect to MongoDB
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MongoDB connection string not found in environment variables (MONGODB_URI or MONGO_URI)');
  process.exit(1);
}

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

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

// Pharmacy Routes (for pharmacy owners/staff)
app.use('/api/pharmacy', pharmacyRoutes);

// Pharmacy Admin Routes (platform-level administration)
app.use('/api/pharmacy-admin', pharmacyAdminRoutes);

// Pharmacy Owner Routes
try {
  app.use('/api/pharmacy-owner', require('./routes/pharmacyOwnerRoutes'));
} catch (e) { console.warn('Pharmacy Owner routes not mounted:', e.message); }

// Inventory Routes
try {
  app.use('/api/inventory', require('./routes/inventoryRoutes'));
} catch (e) { console.warn('Inventory routes not mounted:', e.message); }

// Order Processing Routes
try {
  app.use('/api/order-processing', require('./routes/orderProcessingRoutes'));
} catch (e) { console.warn('Order Processing routes not mounted:', e.message); }

// Admin Routes (System-level management)
// Access control: Protected + system_admin role
try {
  app.use('/api/admin', authenticate, authorize('system_admin', 'admin'), adminRoutes);
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
  console.log(`[404] Route not found: ${req.method} ${req.url}`);
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
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
