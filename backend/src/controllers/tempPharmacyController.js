const mongoose = require("mongoose");

const tempPharmacySchema = new mongoose.Schema({
  pharmacyName: String,
  ownerName: String,
  email: String,
  phone: String,
  address: String,
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("TempPharmacy", tempPharmacySchema);
