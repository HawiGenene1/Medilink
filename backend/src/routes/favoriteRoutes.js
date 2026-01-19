const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getFavorites, addFavorite, removeFavorite } = require('../controllers/favoriteController');

router.use(protect); // Protect all routes

router.get('/', getFavorites);
router.post('/', addFavorite);
router.delete('/:medicineId', removeFavorite);

module.exports = router;
