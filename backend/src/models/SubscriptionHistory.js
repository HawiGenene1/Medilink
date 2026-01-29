const mongoose = require("mongoose");

const subscriptionHistorySchema = new mongoose.Schema({
    subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subscription",
        required: true
    },
    pharmacy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pharmacy",
        required: true
    },
    action: {
        type: String,
        enum: ['assigned', 'renewed', 'upgraded', 'downgraded', 'cancelled', 'suspended', 'activated', 'expired'],
        required: true
    },
    details: {
        type: String,
        required: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("SubscriptionHistory", subscriptionHistorySchema);
