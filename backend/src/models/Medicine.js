// models/Medicine.js
import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  expiryDate: {
    type: Date,
  },
});

const Medicine = mongoose.model("Medicine", medicineSchema);
export default Medicine;

