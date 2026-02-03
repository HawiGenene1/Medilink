const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true
  },
  coordinates: {
    type: [Number],
    required: true
  }
}, { _id: false });

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true
  },
  contactPerson: {
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Please use a valid email address']
    },
    phone: {
      type: String,
      trim: true
    },
    position: {
      type: String,
      trim: true
    }
  },
  company: {
    name: {
      type: String,
      trim: true
    },
    registrationNumber: {
      type: String,
      trim: true
    },
    taxId: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    logo: {
      type: String,
      trim: true
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: {
      type: String,
      default: 'Ethiopia'
    },
    location: {
      type: pointSchema,
      required: false,
      default: undefined
    }
  },
  contactDetails: {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Please use a valid email address']
    },
    phone: {
      type: String,
      trim: true
    },
    mobile: {
      type: String,
      trim: true
    },
    fax: {
      type: String,
      trim: true
    }
  },
  bankDetails: {
    bankName: String,
    accountName: String,
    accountNumber: String,
    branch: String,
    swiftCode: String,
    iban: String
  },
  paymentTerms: {
    type: String,
    enum: ['prepaid', 'net7', 'net15', 'net30', 'net60', 'other'],
    default: 'net30'
  },
  leadTime: {
    type: Number, // in days
    default: 7
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Indexes
supplierSchema.index({ name: 'text', 'company.name': 'text' });
supplierSchema.index({ 'address.location': '2dsphere' }, { sparse: true });

// Virtual for supplier's products
supplierSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'supplier'
});

// Virtual for supplier's purchase orders
supplierSchema.virtual('purchaseOrders', {
  ref: 'PurchaseOrder',
  localField: '_id',
  foreignField: 'supplier'
});

// Method to get supplier's performance metrics
supplierSchema.methods.getPerformanceMetrics = async function () {
  const PurchaseOrder = this.model('PurchaseOrder');

  const stats = await PurchaseOrder.aggregate([
    { $match: { supplier: this._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        averageDeliveryTime: { $avg: '$deliveryTime' },
        onTimeDeliveries: {
          $sum: {
            $cond: [
              { $lte: ['$deliveryTime', '$expectedDeliveryTime'] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  const metrics = {
    totalOrders: 0,
    totalAmount: 0,
    averageOrderValue: 0,
    onTimeDeliveryRate: 0,
    averageDeliveryTime: 0,
    orderStatus: {}
  };

  stats.forEach(stat => {
    metrics.totalOrders += stat.count;
    metrics.totalAmount += stat.totalAmount || 0;
    metrics.orderStatus[stat._id] = stat.count;

    if (stat.averageDeliveryTime) {
      metrics.averageDeliveryTime = stat.averageDeliveryTime;
    }

    if (stat.onTimeDeliveries) {
      metrics.onTimeDeliveryRate = (stat.onTimeDeliveries / stat.count) * 100;
    }
  });

  metrics.averageOrderValue = metrics.totalOrders > 0
    ? metrics.totalAmount / metrics.totalOrders
    : 0;

  return metrics;
};

module.exports = mongoose.model('Supplier', supplierSchema);
