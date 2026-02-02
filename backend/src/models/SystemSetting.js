const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
    appName: {
        type: String,
        required: true,
        default: 'Medilink'
    },
    contactEmail: {
        type: String,
        required: true,
        default: 'admin@medilink.com'
    },
    currency: {
        type: String,
        required: true,
        default: 'ETB'
    },
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    maintenanceMessage: {
        type: String,
        default: 'We are currently undergoing scheduled maintenance. Please check back later.'
    },
    securityPolicy: {
        force2FAAdmins: {
            type: Boolean,
            default: false
        },
        force2FAPharmacies: {
            type: Boolean,
            default: false
        },
        sessionTimeout: {
            type: Number,
            default: 30 // minutes
        },
        passwordPolicy: {
            type: String,
            enum: ['standard', 'strong', 'strict'],
            default: 'strong'
        }
    },
    emailService: {
        provider: { type: String, default: 'smtp' },
        host: { type: String, default: '' },
        port: { type: Number, default: 587 },
        secure: { type: Boolean, default: false },
        auth: {
            user: { type: String, default: '' },
            pass: { type: String, default: '' }
        },
        fromEmail: { type: String, default: 'noreply@medilink.com' },
        enabled: { type: Boolean, default: false }
    },
    paymentGateways: {
        chapa: {
            isActive: { type: Boolean, default: false },
            publicKey: { type: String, default: '' },
            secretKey: { type: String, default: '' },
            encryptionKey: { type: String, default: '' }
        },
        stripe: {
            isActive: { type: Boolean, default: false },
            publishableKey: { type: String, default: '' },
            secretKey: { type: String, default: '' }
        }
    },
    notificationChannels: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
        triggers: {
            newOrder: { type: Boolean, default: true },
            orderStatusChange: { type: Boolean, default: true },
            newUser: { type: Boolean, default: true },
            systemAlert: { type: Boolean, default: true }
        }
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    collection: 'system_settings'
});

// We only want ONE settings document
systemSettingSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
