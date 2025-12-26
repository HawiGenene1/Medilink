const mongoose = require('mongoose');

const purchaseOrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
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
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    required: true,
    enum: ['piece', 'box', 'carton', 'kg', 'g', 'mg', 'l', 'ml'],
    default: 'piece'
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true
  },
  receivedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingQuantity: {
    type: Number,
    default: function() {
      return this.quantity - (this.receivedQuantity || 0);
    }
  },
  expiryDate: {
    type: Date
  },
  batchNumber: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: false });

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: true
  },
  items: [purchaseOrderItemSchema],
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'ordered', 'partially_received', 'received', 'cancelled', 'closed'],
    default: 'draft'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date
  },
  actualDeliveryDate: {
    type: Date
  },
  deliveryTime: {
    type: Number, // in days
    default: 0
  },
  paymentTerms: {
    type: String,
    enum: ['prepaid', 'net7', 'net15', 'net30', 'net60', 'other'],
    default: 'net30'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid', 'overdue', 'cancelled'],
    default: 'unpaid'
  },
  shippingMethod: {
    type: String,
    trim: true
  },
  shippingAddress: {
    type: String,
    trim: true
  },
  billingAddress: {
    type: String,
    trim: true
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  dueAmount: {
    type: Number,
    default: function() {
      return this.totalAmount - (this.paidAmount || 0);
    }
  },
  notes: {
    type: String,
    trim: true
  },
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date
    },
    notes: {
      type: String,
      trim: true
    }
  },
  receivedBy: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date
    },
    notes: {
      type: String,
      trim: true
    }
  },
  statusHistory: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
purchaseOrderSchema.index({ poNumber: 1 }, { unique: true });
purchaseOrderSchema.index({ supplier: 1, status: 1 });
purchaseOrderSchema.index({ pharmacy: 1, status: 1 });
purchaseOrderSchema.index({ orderDate: -1 });
purchaseOrderSchema.index({ expectedDeliveryDate: 1 });

// Generate PO number before saving
purchaseOrderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    this.poNumber = `PO-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;
    
    // Set initial status history
    this.statusHistory = [{
      status: this.status,
      changedBy: this.createdBy,
      date: new Date(),
      notes: 'Purchase order created'
    }];
    
    // Calculate totals if not set
    if (this.items && this.items.length > 0) {
      this.calculateTotals();
    }
  } else if (this.isModified('status')) {
    // Add to status history when status changes
    this.statusHistory.push({
      status: this.status,
      changedBy: this._updatedBy || this.createdBy,
      date: new Date(),
      notes: this._statusChangeNotes || 'Status updated'
    });
    
    // Clear temporary field
    this._statusChangeNotes = undefined;
  }
  
  next();
});

// Calculate order totals
purchaseOrderSchema.methods.calculateTotals = function() {
  let subtotal = 0;
  let taxAmount = 0;
  
  this.items.forEach(item => {
    const itemTotal = item.quantity * item.unitPrice;
    const itemTax = (item.taxRate / 100) * itemTotal;
    const itemDiscount = item.discount || 0;
    const itemSubtotal = itemTotal + itemTax - itemDiscount;
    
    item.taxAmount = itemTax;
    item.total = itemSubtotal;
    
    subtotal += itemSubtotal;
    taxAmount += itemTax;
  });
  
  this.subtotal = subtotal - taxAmount; // Remove tax from subtotal to avoid double counting
  this.taxAmount = taxAmount;
  this.totalAmount = this.subtotal + this.taxAmount + (this.shippingCost || 0) - (this.discountAmount || 0);
  this.dueAmount = this.totalAmount - (this.paidAmount || 0);
};

// Update inventory when PO is received
purchaseOrderSchema.methods.receiveItems = async function(userId, receivedItems, notes = '') {
  if (this.status === 'cancelled' || this.status === 'closed') {
    throw new Error(`Cannot receive items for a ${this.status} purchase order`);
  }
  
  const Product = mongoose.model('Product');
  const InventoryTransaction = mongoose.model('InventoryTransaction');
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const updates = [];
    const transactions = [];
    let allItemsReceived = true;
    
    // Process each item in the received items
    for (const receivedItem of receivedItems) {
      const item = this.items.id(receivedItem.itemId);
      if (!item) {
        throw new Error(`Item with ID ${receivedItem.itemId} not found in purchase order`);
      }
      
      const receivedQty = receivedItem.quantity || 0;
      const newReceivedQty = (item.receivedQuantity || 0) + receivedQty;
      
      if (newReceivedQty > item.quantity) {
        throw new Error(`Received quantity (${newReceivedQty}) cannot exceed ordered quantity (${item.quantity})`);
      }
      
      // Update received quantity
      item.receivedQuantity = newReceivedQty;
      item.remainingQuantity = item.quantity - newReceivedQty;
      
      if (receivedItem.expiryDate) item.expiryDate = receivedItem.expiryDate;
      if (receivedItem.batchNumber) item.batchNumber = receivedItem.batchNumber;
      
      // Create inventory transaction
      const transaction = new InventoryTransaction({
        product: item.product,
        reference: 'purchase_order',
        referenceId: this._id,
        type: 'purchase',
        quantity: receivedQty,
        unitCost: item.unitPrice,
        totalCost: item.unitPrice * receivedQty,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        notes: `Received from PO ${this.poNumber}`,
        createdBy: userId,
        pharmacy: this.pharmacy
      });
      
      transactions.push(transaction.save({ session }));
      
      // Update product inventory
      updates.push(
        Product.findByIdAndUpdate(
          item.product,
          {
            $inc: { 
              quantity: receivedQty,
              'inventory.totalValue': item.unitPrice * receivedQty,
              'inventory.totalCost': item.unitPrice * receivedQty
            },
            $set: {
              'inventory.lastUpdated': new Date(),
              'inventory.lastPurchasePrice': item.unitPrice
            }
          },
          { session }
        )
      );
      
      // Check if all items are fully received
      if (newReceivedQty < item.quantity) {
        allItemsReceived = false;
      }
    }
    
    // Update PO status
    const previousStatus = this.status;
    this.status = allItemsReceived ? 'received' : 'partially_received';
    this._statusChangeNotes = notes || `Items received by ${userId}`;
    
    if (allItemsReceived) {
      this.actualDeliveryDate = new Date();
      this.deliveryTime = Math.ceil((this.actualDeliveryDate - this.orderDate) / (1000 * 60 * 60 * 24));
      
      this.receivedBy = {
        user: userId,
        date: new Date(),
        notes: 'All items received'
      };
    }
    
    // Save all changes
    await Promise.all([...updates, ...transactions, this.save({ session })]);
    
    await session.commitTransaction();
    session.endSession();
    
    return this;
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
