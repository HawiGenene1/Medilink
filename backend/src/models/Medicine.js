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
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true,
    index: true
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    index: true
  },
  manufacturer: {
    type: String,
    required: [true, 'Manufacturer is required'],
    trim: true,
    index: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true
  },
  type: {
    type: String,
    enum: ['tablet', 'capsule', 'liquid', 'injection', 'cream', 'ointment', 'inhaler', 'drops', 'spray', 'other'],
    required: [true, 'Medicine type is required'],
    index: true
  },
  formulation: {
    type: String,
    trim: true
  },
  strength: {
    type: String,
    required: [true, 'Strength is required'],
    trim: true
  },
  unit: {
    type: String,
    enum: ['mg', 'g', 'ml', 'mcg', 'iu', 'units'],
    required: [true, 'Unit is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  minStockLevel: {
    type: Number,
    default: 10,
    min: 0
  },
  maxStockLevel: {
    type: Number,
    default: 1000,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  activeIngredients: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    strength: String,
    unit: String
  }],
  dosageForm: {
    type: String,
    trim: true
  },
  route: {
    type: String,
    enum: ['oral', 'topical', 'intravenous', 'intramuscular', 'subcutaneous', 'inhalation', 'nasal', 'ocular', 'aural', 'rectal', 'vaginal'],
    default: 'oral'
  },
  prescriptionRequired: {
    type: Boolean,
    default: false
  },
  storageConditions: {
    temperature: String,
    humidity: String,
    lightSensitive: {
      type: Boolean,
      default: false
    }
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  batchNumber: {
    type: String,
    trim: true,
    index: true
  },
  barcode: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  images: [{
    type: String
  }],
  tags: [{
    type: String,
    trim: true,
    index: true
  }],
  sideEffects: [{
    type: String,
    trim: true
  }],
  contraindications: [{
    type: String,
    trim: true
  }],
  warnings: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isDiscontinued: {
    type: Boolean,
    default: false
  },
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: [true, 'Pharmacy is required'],
    index: true
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  salesData: {
    totalSold: {
      type: Number,
      default: 0,
      min: 0
    },
    lastSold: Date,
    popularity: {
      type: Number,
      default: 0
    }
  },

  // Add location reference
  location: {
    type: locationSchema,
    index: '2dsphere' // For geospatial queries
  },
  availableAt: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy'
  }],

  // Add text index for search
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
medicineSchema.pre('save', function () {
  const ingredients = (this.activeIngredients || []).map(i => i.name).join(' ');
  this.searchText = `${this.name || ''} ${this.manufacturer || ''} ${this.brand || ''} ${ingredients}`.trim();
});

module.exports = mongoose.model('Medicine', medicineSchema);