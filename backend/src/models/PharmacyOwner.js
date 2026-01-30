const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * PharmacyOwner Model
 * Representing the owner of a pharmacy with subscription and management capabilities.
 */
const pharmacyOwnerSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    pharmacyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pharmacy',
        required: [true, 'Pharmacy reference is required']
    },
    subscriptionPlan: {
        type: String,
        enum: ['FREE', 'BASIC', 'PREMIUM'],
        default: 'FREE'
    },
    subscriptionStatus: {
        type: String,
        enum: ['ACTIVE', 'EXPIRED'],
        default: 'ACTIVE'
    },
    subscriptionStartDate: {
        type: Date,
        default: Date.now
    },
    subscriptionEndDate: {
        type: Date,
        default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000) // Default 30 days
    },
    permissions: {
        type: [String],
        default: ['dashboard', 'inventory', 'orders', 'staff']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Middleware: Hash password before saving
pharmacyOwnerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare candidate password with hashed password
pharmacyOwnerSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error(error);
    }
};

const PharmacyOwner = mongoose.model('PharmacyOwner', pharmacyOwnerSchema);

module.exports = PharmacyOwner;
