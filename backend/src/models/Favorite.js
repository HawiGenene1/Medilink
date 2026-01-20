const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    medicine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure a user can't favorite the same medicine twice
favoriteSchema.index({ user: 1, medicine: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
