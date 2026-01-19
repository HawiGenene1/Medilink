const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const medicineController = require('../controllers/medicineController');

// Public routes
router.get('/', medicineController.getMedicines);
router.get('/:id', medicineController.getMedicineById);

// POST/PUT routes can be added and protected later (middleware uses `authMiddleware.js`)

module.exports = router;