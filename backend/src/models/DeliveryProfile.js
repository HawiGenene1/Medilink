const mongoose = require('mongoose');

const deliveryProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    currentStep: {
        type: Number,
        default: 1,
        min: 1,
        max: 9
    },
    currentLocation: {
        type: {
            type: String, // 'Point'
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: false
        }
    },
    isAvailable: {
        type: Boolean,
        default: false
    },
    onboardingStatus: {
        type: String,
        enum: ['in_progress', 'pending_review', 'approved', 'rejected'],
        default: 'in_progress'
    },
    personalDetails: {
        dateOfBirth: Date,
        residentialAddress: {
            street: String,
            city: String,
            state: String,
            zipCode: String
        },
        preferredLanguage: {
            type: String,
            default: 'English'
        },
        emergencyContact: {
            name: String,
            relationship: String,
            phone: String
        }
    },
    vehicleDetails: {
        type: {
            type: String,
            enum: ['car', 'motorcycle', 'bicycle', 'scooter', 'van', 'truck']
        },
        make: String,
        model: String,
        year: String,
        color: String,
        licensePlate: String
    },
    documents: {
        governmentId: String, // URL/Path to file
        workEligibility: String,
        driversLicense: String,
        vehicleRegistration: String,
        insuranceProof: String,
        vehiclePhotos: [String],
        bicycleOwnership: String,
        safetyGearPhoto: String
    },
    backgroundCheck: {
        consented: {
            type: Boolean,
            default: false
        },
        consentedAt: Date,
        status: {
            type: String,
            enum: ['not_started', 'pending', 'completed', 'flagged'],
            default: 'not_started'
        }
    },
    paymentInfo: {
        bankName: String,
        accountNumber: String,
        routingNumber: String,
        paymentApp: String, // PayPal, etc.
        chequePhoto: String,
        preference: {
            type: String,
            enum: ['weekly', 'instant', 'monthly'],
            default: 'weekly'
        }
    },
    training: {
        completed: {
            type: Boolean,
            default: false
        },
        completedAt: Date
    },
    inspection: {
        status: {
            type: String,
            enum: ['not_required', 'pending', 'passed', 'failed'],
            default: 'not_required'
        },
        inspectionPhotos: [String]
    },
    submittedAt: Date,
    reviewedAt: Date,
    reviewerNotes: String,
    weeklyGoal: {
        type: Number,
        default: 1000
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('DeliveryProfile', deliveryProfileSchema);

// Index for geospatial queries
deliveryProfileSchema.index({ currentLocation: '2dsphere' });

