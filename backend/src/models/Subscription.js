const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pharmacy",
    required: true
  },
  mode: {
    type: String,
    enum: ["monthly", "annually"],
    default: "annually"
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  }
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
