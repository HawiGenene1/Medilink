// const express = require('express');
// const router = express.Router();
// const { check } = require('express-validator');
// const medicineController = require('../controllers/medicineController');

// // Public routes
// router.get('/', medicineController.getMedicines);
// router.get('/:id', medicineController.getMedicineById);

// // POST/PUT routes can be added and protected later (middleware uses `authMiddleware.js`)

// module.exports = router;
const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const { cacheMiddleware } = medicineController;

// Apply cache middleware to specific routes
router.get('/', cacheMiddleware, medicineController.getMedicines);
router.get('/filters', cacheMiddleware, medicineController.getFilterOptions);

module.exports = router;