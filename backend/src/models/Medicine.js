// In models/Medicine.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const locationSchema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true
  },
  address: String,
  city: String,
  region: String,
  country: String,
  postalCode: String
}, { _id: false });

const medicineSchema = new Schema({
  // ... existing fields ...
  
  // Add location reference
  location: {
    type: locationSchema,
    index: '2dsphere' // For geospatial queries
  },
  
  // Add text index for better search
  searchText: String // Will contain searchable text
}, {
  timestamps: true
});

// Create text index for search
medicineSchema.index({
  name: 'text',
  manufacturer: 'text',
  'activeIngredients.name': 'text',
  searchText: 'text'
}, {
  weights: {
    name: 10,
    manufacturer: 5,
    'activeIngredients.name': 3,
    searchText: 1
  },
  default_language: 'english'
});

// Pre-save hook to update searchText
medicineSchema.pre('save', function(next) {
  this.searchText = `${this.name} ${this.manufacturer} ${this.activeIngredients.map(i => i.name).join(' ')}`;
  next();
});

module.exports = mongoose.model('Medicine', medicineSchema);