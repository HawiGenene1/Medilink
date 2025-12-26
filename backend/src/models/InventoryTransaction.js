const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
  // Transaction details
  transactionType: {
    type: String,
    required: true,
    enum: [
      'purchase',          // When adding inventory from a supplier
      'sale',              // When selling to a customer
      'return',            // When a customer returns an item
      'adjustment',        // Manual inventory adjustment
      'transfer_in',       // Transfer from another location
      'transfer_out',      // Transfer to another location
      'damaged',           // When items are marked as damaged
      'expired',           // When items expire
      'loss',              // When items are lost
      'production',        // When items are produced (manufacturing)
      'assembly',          // When items are assembled from components
      'disassembly',       // When items are disassembled into components
      'return_to_vendor',  // When returning items to a vendor
      'inventory_count'    // During physical inventory count
    ]
  },
  transactionDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  reference: {
    type: String,
    enum: [
      'purchase_order',
      'sales_order',
      'inventory_adjustment',
      'inventory_count',
      'inventory_transfer',
      'production_order',
      'return_order',
      'damage_report',
      'expiry_report',
      'other'
    ],
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'reference'
  },
  referenceNumber: {
    type: String,
    trim: true
  },
  
  // Product details
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    trim: true
  },
  barcode: {
    type: String,
    trim: true
  },
  
  // Quantity and pricing
  quantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true,
    enum: ['piece', 'box', 'carton', 'kg', 'g', 'mg', 'l', 'ml'],
    default: 'piece'
  },
  unitCost: {
    type: Number,
    required: true,
    min: 0
  },
  unitPrice: {
    type: Number,
    min: 0
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    min: 0
  },
  
  // Location information
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  destinationLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location'
  },
  
  // Batch and serial tracking
  batchNumber: {
    type: String,
    trim: true
  },
  serialNumbers: [{
    type: String,
    trim: true
  }],
  expiryDate: {
    type: Date
  },
  
  // Status and approval
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'on_hold', 'returned', 'damaged'],
    default: 'completed'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: {
    type: Date
  },
  
  // Additional information
  notes: {
    type: String,
    trim: true
  },
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Business unit and pharmacy
  businessUnit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusinessUnit'
  },
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
inventoryTransactionSchema.index({ product: 1, transactionDate: -1 });
inventoryTransactionSchema.index({ reference: 1, referenceId: 1 });
inventoryTransactionSchema.index({ transactionType: 1, transactionDate: -1 });
inventoryTransactionSchema.index({ location: 1, status: 1 });
inventoryTransactionSchema.index({ batchNumber: 1, expiryDate: 1 });
inventoryTransactionSchema.index({ barcode: 1 });
inventoryTransactionSchema.index({ 'serialNumbers': 1 });

// Virtual for product details
inventoryTransactionSchema.virtual('productDetails', {
  ref: 'Product',
  localField: 'product',
  foreignField: '_id',
  justOne: true
});

// Virtual for location details
inventoryTransactionSchema.virtual('locationDetails', {
  ref: 'Location',
  localField: 'location',
  foreignField: '_id',
  justOne: true
});

// Virtual for destination location details
inventoryTransactionSchema.virtual('destinationLocationDetails', {
  ref: 'Location',
  localField: 'destinationLocation',
  foreignField: '_id',
  justOne: true
});

// Method to get current stock level for a product at a specific location
inventoryTransactionSchema.statics.getCurrentStock = async function(productId, locationId) {
  const result = await this.aggregate([
    {
      $match: {
        product: mongoose.Types.ObjectId(productId),
        location: mongoose.Types.ObjectId(locationId)
      }
    },
    {
      $group: {
        _id: null,
        totalIn: {
          $sum: {
            $cond: [
              { $in: ['$transactionType', ['purchase', 'transfer_in', 'return', 'inventory_adjustment', 'production']] },
              '$quantity',
              0
            ]
          }
        },
        totalOut: {
          $sum: {
            $cond: [
              { $in: ['$transactionType', ['sale', 'transfer_out', 'damaged', 'expired', 'loss', 'return_to_vendor']] },
              '$quantity',
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        quantity: { $subtract: ['$totalIn', '$totalOut'] }
      }
    }
  ]);

  return result.length > 0 ? result[0].quantity : 0;
};

// Method to get inventory valuation
inventoryTransactionSchema.statics.getInventoryValuation = async function(pharmacyId, options = {}) {
  const { 
    groupBy = 'product', // 'product', 'category', 'location', 'supplier'
    asOfDate = new Date(),
    includeZeroBalance = false
  } = options;

  const matchStage = {
    transactionDate: { $lte: asOfDate },
    pharmacy: mongoose.Types.ObjectId(pharmacyId)
  };

  if (!includeZeroBalance) {
    matchStage.quantity = { $ne: 0 };
  }

  const groupStage = {
    _id: `$${groupBy}`,
    totalQuantity: { $sum: {
      $cond: [
        { $in: ['$transactionType', ['purchase', 'transfer_in', 'return', 'inventory_adjustment', 'production']] },
        '$quantity',
        { $multiply: ['$quantity', -1] }
      ]
    }},
    totalCost: { $sum: {
      $cond: [
        { $in: ['$transactionType', ['purchase', 'transfer_in', 'return', 'inventory_adjustment', 'production']] },
        { $multiply: ['$quantity', '$unitCost'] },
        { $multiply: ['$quantity', '$unitCost', -1] }
      ]
    }},
    averageUnitCost: { $avg: '$unitCost' },
    lastTransactionDate: { $max: '$transactionDate' },
    itemCount: { $sum: 1 }
  };

  // Add product details if grouping by product
  if (groupBy === 'product') {
    groupStage.productName = { $first: '$productName' };
    groupStage.sku = { $first: '$sku' };
    groupStage.barcode = { $first: '$barcode' };
  }

  const pipeline = [
    { $match: matchStage },
    { $group: groupStage },
    { $sort: { _id: 1 } }
  ];

  // Filter out zero quantity items if needed
  if (!includeZeroBalance) {
    pipeline.push({
      $match: { totalQuantity: { $gt: 0 } }
    });
  }

  return this.aggregate(pipeline);
};

// Method to get inventory movement report
inventoryTransactionSchema.statics.getInventoryMovement = async function(pharmacyId, options = {}) {
  const {
    productId,
    locationId,
    startDate,
    endDate = new Date(),
    groupBy = 'day' // 'day', 'week', 'month', 'year'
  } = options;

  const matchStage = {
    transactionDate: { $lte: endDate },
    pharmacy: mongoose.Types.ObjectId(pharmacyId)
  };

  if (startDate) {
    matchStage.transactionDate.$gte = new Date(startDate);
  }

  if (productId) {
    matchStage.product = mongoose.Types.ObjectId(productId);
  }

  if (locationId) {
    matchStage.location = mongoose.Types.ObjectId(locationId);
  }

  let dateFormat;
  switch (groupBy) {
    case 'day':
      dateFormat = '%Y-%m-%d';
      break;
    case 'week':
      dateFormat = '%Y-%U';
      break;
    case 'month':
      dateFormat = '%Y-%m';
      break;
    case 'year':
      dateFormat = '%Y';
      break;
    default:
      dateFormat = '%Y-%m-%d';
  }

  const pipeline = [
    { $match: matchStage },
    {
      $project: {
        date: {
          $dateToString: {
            format: dateFormat,
            date: '$transactionDate'
          }
        },
        product: 1,
        location: 1,
        quantityIn: {
          $cond: [
            { $in: ['$transactionType', ['purchase', 'transfer_in', 'return', 'inventory_adjustment', 'production']] },
            '$quantity',
            0
          ]
        },
        quantityOut: {
          $cond: [
            { $in: ['$transactionType', ['sale', 'transfer_out', 'damaged', 'expired', 'loss', 'return_to_vendor']] },
            '$quantity',
            0
          ]
        },
        costIn: {
          $cond: [
            { $in: ['$transactionType', ['purchase', 'transfer_in', 'return', 'inventory_adjustment', 'production']] },
            { $multiply: ['$quantity', '$unitCost'] },
            0
          ]
        },
        costOut: {
          $cond: [
            { $in: ['$transactionType', ['sale', 'transfer_out', 'damaged', 'expired', 'loss', 'return_to_vendor']] },
            { $multiply: ['$quantity', '$unitCost'] },
            0
          ]
        }
      }
    },
    {
      $group: {
        _id: {
          date: '$date',
          product: '$product',
          location: '$location'
        },
        totalIn: { $sum: '$quantityIn' },
        totalOut: { $sum: '$quantityOut' },
        totalCostIn: { $sum: '$costIn' },
        totalCostOut: { $sum: '$costOut' },
        transactionCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id.product',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $lookup: {
        from: 'locations',
        localField: '_id.location',
        foreignField: '_id',
        as: 'location'
      }
    },
    { $unwind: '$location' },
    {
      $project: {
        _id: 0,
        date: '$_id.date',
        product: {
          _id: '$product._id',
          name: '$product.name',
          sku: '$product.sku',
          barcode: '$product.barcode'
        },
        location: {
          _id: '$location._id',
          name: '$location.name',
          code: '$location.code'
        },
        totalIn: 1,
        totalOut: 1,
        netChange: { $subtract: ['$totalIn', '$totalOut'] },
        totalCostIn: 1,
        totalCostOut: 1,
        netCostChange: { $subtract: ['$totalCostIn', '$totalCostOut'] },
        transactionCount: 1
      }
    },
    { $sort: { date: 1, 'product.name': 1 } }
  ];

  return this.aggregate(pipeline);
};

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
