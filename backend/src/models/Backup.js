const mongoose = require('mongoose');

const backupSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['automated', 'manual'],
        default: 'manual'
    },
    size: {
        type: Number, // in bytes
        required: true
    },
    path: String,
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'success'
    },
    triggeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('Backup', backupSchema);
