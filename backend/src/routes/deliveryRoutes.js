const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { updateLocation } = require('../controllers/deliveryController');

// Development bypass middleware (optional, but good for consistency)
const devAuth = (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        req.user = {
            userId: 'dev-driver-001',
            role: 'delivery'
        };
        return next();
    }
    return authenticate(req, res, next);
};

// Update delivery live location
router.patch('/location', devAuth, updateLocation);

module.exports = router;
