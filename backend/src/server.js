require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // parse JSON requests
app.use(express.urlencoded({ extended: true })); // parse URL-encoded requests
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
// const adminRoutes = require('./routes/adminRoutes');
// const cashierRoutes = require('./routes/cashierRoutes');
// const customerRoutes = require('./routes/customerRoutes');
// const deliveryRoutes = require('./routes/deliveryRoutes');
// const pharmacyAdminRoutes = require('./routes/pharmacyAdminRoutes');
// const pharmacyRoutes = require('./routes/pharmacyRoutes');

// Import Middleware
const { authenticate, authorize } = require('./middleware/authMiddleware');

// API Routes
app.use('/api/auth', authRoutes);
// Medicines API
try {
  app.use('/api/medicines', require('./routes/medicineRoutes'));
} catch (e) {
  console.warn('Medicine routes not mounted:', e.message);
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