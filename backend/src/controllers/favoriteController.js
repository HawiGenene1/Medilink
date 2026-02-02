const mongoose = require('mongoose');
const Favorite = require('../models/Favorite');
const Medicine = require('../models/Medicine');

exports.getFavorites = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id || req.user._id;
        const favorites = await Favorite.find({ user: userId })
            .populate('medicine')
            .sort({ addedAt: -1 });

        // Return just the medicine objects to match frontend expectations, 
        // or the full favorite object if needed. 
        // For now, let's look at how the frontend expects it.
        // The context likely expects a list of medicines.
        // But let's return the full structure for flexibility.

        res.json(favorites);
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ message: 'Server error fetching favorites' });
    }
};

exports.addFavorite = async (req, res) => {
    try {
        const { medicineId } = req.body;

        if (!medicineId) {
            return res.status(400).json({ message: 'Medicine ID is required' });
        }

        if (!mongoose.Types.ObjectId.isValid(medicineId)) {
            return res.status(400).json({ message: 'Invalid Medicine ID format. Please use a valid medicine.' });
        }

        const userId = req.user.userId || req.user.id || req.user._id;

        // Verify medicine exists
        const medicine = await Medicine.findById(medicineId);
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found. It may have been deleted.' });
        }

        // Check if already exists
        const existing = await Favorite.findOne({ user: userId, medicine: medicineId });
        if (existing) {
            return res.status(400).json({ message: 'Medicine already in favorites' });
        }

        const favorite = new Favorite({
            user: userId,
            medicine: medicineId
        });

        await favorite.save();

        // Populate medicine data for the response
        await favorite.populate('medicine');

        res.status(201).json(favorite);
    } catch (error) {
        console.error('[AddFavorite] Critical Error:', error);
        res.status(500).json({
            message: 'Server error adding favorite',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

exports.removeFavorite = async (req, res) => {
    try {
        const { medicineId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(medicineId)) {
            return res.status(400).json({ message: 'Invalid Medicine ID format' });
        }

        const userId = req.user.userId || req.user.id || req.user._id;

        const result = await Favorite.findOneAndDelete({
            user: userId,
            medicine: medicineId
        });

        if (!result) {
            return res.status(404).json({ message: 'Favorite not found' });
        }

        res.json({ message: 'Removed from favorites' });
    } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({ message: 'Server error removing favorite' });
    }
};
