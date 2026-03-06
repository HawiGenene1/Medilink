const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    targetAudience: {
        type: String,
        enum: ['all', 'customers', 'pharmacies', 'delivery', 'staff'],
        default: 'all'
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'published'
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expiresAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
