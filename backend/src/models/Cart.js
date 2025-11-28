// models/Cart.js
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  priceAtTimeOfAddition: {
    type: Number,
    required: true
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  total: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Calculate total before saving
cartSchema.pre('save', function(next) {
  this.total = this.items.reduce((sum, item) => {
    return sum + (item.quantity * item.priceAtTimeOfAddition);
  }, 0);
  next();
});

module.exports = mongoose.model('Cart', cartSchema);