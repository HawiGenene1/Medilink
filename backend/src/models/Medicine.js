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

const priceSchema = new Schema({
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  currency: {
    type: String,
    default: 'ETB',
    uppercase: true
  }
}, { _id: false });

const activeIngredientSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  strength: {
    type: String,
    trim: true
  }
}, { _id: false });

const medicineSchema = new Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true
  },
  genericName: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  manufacturer: {
    type: String,
    required: [true, 'Manufacturer is required'],
    trim: true
  },

  // Classification
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    enum: ['prescription', 'otc', 'herbal', 'supplement', 'medical_device', 'other']
  },
  therapeuticClass: {
    type: String,
    trim: true
  },

  // Composition
  activeIngredients: [activeIngredientSchema],
  dosageForm: {
    type: String,
    required: [true, 'Dosage form is required'],
    enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'suppository', 'other']
  },
  strength: {
    type: String,
    required: [true, 'Strength is required']
  },
  packSize: {
    type: String,
    required: [true, 'Pack size is required']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  },

  // Pricing & Inventory
  price: priceSchema,
  inStock: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  minOrderQuantity: {
    type: Number,
    default: 1,
    min: 1
  },

  // Medical Information
  requiresPrescription: {
    type: Boolean,
    default: false
  },
  schedule: {
    type: String,
    enum: ['I', 'II', 'III', 'IV', 'V', 'OTC', null],
    default: null
  },

  // Media & Description
  description: {
    type: String,
    trim: true
  },
  indications: [String],
  sideEffects: [String],
  images: [{
    type: String, // URL to the image
    trim: true
  }],

  // Location & Availability
  location: {
    type: locationSchema,
    index: '2dsphere' // For geospatial queries
  },
  availableAt: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy'
  }],

  // Search & Metadata
  searchText: String, // For full-text search
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },

  // Audit Fields
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for discounted price
medicineSchema.virtual('discountedPrice').get(function () {
  return this.price.basePrice * (1 - (this.price.discount / 100));
});

// Create text index for search
medicineSchema.index({
  name: 'text',
  genericName: 'text',
  brand: 'text',
  manufacturer: 'text',
  'activeIngredients.name': 'text',
  searchText: 'text',
  therapeuticClass: 'text'
}, {
  weights: {
    name: 10,
    genericName: 8,
    brand: 5,
    manufacturer: 5,
    'activeIngredients.name': 3,
    therapeuticClass: 3,
    searchText: 1
  },
  default_language: 'english'
});

// Compound index for common queries
medicineSchema.index({ category: 1, isActive: 1 });
medicineSchema.index({ requiresPrescription: 1, isActive: 1 });
medicineSchema.index({ 'price.discount': -1, isActive: 1 });

// Pre-save hook to update searchText
medicineSchema.pre('save', function (next) {
  this.searchText = [
    this.name,
    this.genericName,
    this.brand,
    this.manufacturer,
    this.therapeuticClass,
    ...(this.activeIngredients?.map(i => i.name) || []),
    ...(this.tags || [])
  ].filter(Boolean).join(' ');
  next();
});

// Static method for search
medicineSchema.statics.search = async function (query, filters = {}) {
  const { minPrice, maxPrice, category, requiresPrescription, inStock, sortBy = 'relevance' } = filters;

  const pipeline = [];

  // Text search stage
  if (query) {
    pipeline.push({
      $match: {
        $text: { $search: query },
        isActive: true
      }
    });

    // Add text score for sorting
    pipeline.push({
      $addFields: {
        score: { $meta: 'textScore' }
      }
    });
  } else {
    pipeline.push({
      $match: { isActive: true }
    });
  }

  // Filter stages
  const matchStage = {};

  if (minPrice || maxPrice) {
    matchStage['price.basePrice'] = {};
    if (minPrice) matchStage['price.basePrice'].$gte = Number(minPrice);
    if (maxPrice) matchStage['price.basePrice'].$lte = Number(maxPrice);
  }

  if (category) matchStage.category = category;
  if (requiresPrescription !== undefined) matchStage.requiresPrescription = requiresPrescription === 'true';
  if (inStock === 'true') matchScope.stockQuantity = { $gt: 0 };

  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  // Sorting
  const sortStage = {};
  if (query) {
    sortStage.score = { $meta: 'textScore' };
  }

  if (sortBy === 'price-asc') sortStage['price.basePrice'] = 1;
  else if (sortBy === 'price-desc') sortStage['price.basePrice'] = -1;
  else if (sortBy === 'newest') sortStage.createdAt = -1;
  else if (sortBy === 'discount') sortStage['price.discount'] = -1;

  if (Object.keys(sortStage).length > 0) {
    pipeline.push({ $sort: sortStage });
  }

  return this.aggregate(pipeline);
};

module.exports = mongoose.model('Medicine', medicineSchema);