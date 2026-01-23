const mongoose = require('mongoose');

const pendingDeliveryPersonSchema = new mongoose.Schema({
    personalInfo: {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        phone: { type: String, required: true, trim: true },
        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: String
        }
    },
    vehicleInfo: {
        vehicleType: {
            type: String,
            enum: ['motorcycle', 'car', 'bicycle', 'scooter'],
            required: true
        },
        licensePlate: { type: String, required: true, trim: true },
        model: String,
        year: String,
        color: String
    },
    documents: [{
        documentType: {
            type: String,
            enum: ['license', 'id', 'insurance', 'vehicle_registration', 'other'],
            required: true
        },
        documentUrl: { type: String, required: true },
        documentName: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'under_review'],
        default: 'pending'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: Date,
    reviewNotes: String,
    rejectionReason: String
}, {
    timestamps: { createdAt: 'submittedAt', updatedAt: 'lastUpdated' }
});

// Indexes
pendingDeliveryPersonSchema.index({ 'personalInfo.email': 1 });
pendingDeliveryPersonSchema.index({ status: 1 });
pendingDeliveryPersonSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('PendingDeliveryPerson', pendingDeliveryPersonSchema);
