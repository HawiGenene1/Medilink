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
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Incoming Request: ${req.method} ${req.url}`);
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});
app.use(express.urlencoded({ extended: true })); // parse URL-encoded requests
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use("/api/test", require("./routes/testRoutes"));

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const pharmacyAdminRoutes = require('./routes/pharmacyAdminRoutes');
const { protectAdmin } = require('./middleware/authMiddleware');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/favorites', require('./routes/favoriteRoutes'));
app.use('/api/favorite', require('./routes/favoriteRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Medicines API
try {
  app.use('/api/medicines', require('./routes/medicineRoutes'));
} catch (e) {
  console.warn('Medicine routes not mounted:', e.message);
}

app.use('/api/admin', protectAdmin, adminRoutes);
app.use('/api/pharmacy-admin', pharmacyAdminRoutes);
app.use('/api/delivery/onboarding', require('./routes/deliveryOnboardingRoutes'));
app.use('/api/delivery', require('./routes/deliveryRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));


// Test route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Medilink Admin Backend is running! (V1.0.1)',
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`[404] Route not found: ${req.method} ${req.url}`);
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
const http = require('http');
const { init } = require('./socket');

const server = http.createServer(app);
init(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
