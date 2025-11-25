const mongoose = require("mongoose");

const pharmacyTempSchema = new mongoose.Schema({
  pharmacyName: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: true
  },

  licenseNumber: {
    type: String,
    required: true
  },

  ownerName: {
    type: String,
    required: true
  },

  isReviewed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("PharmacyTemp", pharmacyTempSchema);
