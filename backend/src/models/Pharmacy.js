const mongoose = require("mongoose");

const pharmacySchema = new mongoose.Schema({
  pharmacyName: {
    type: String,
    required: true,
  },
  ownerName: {
    type: String,
    required: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription",
    required: false
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  }
});

module.exports = mongoose.model("Pharmacy", pharmacySchema);
