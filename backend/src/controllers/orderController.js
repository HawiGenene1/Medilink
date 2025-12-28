// Order Controller for handling order-related operations

const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private (Customer)
 */
const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const {
      items,
      deliveryAddress,
      paymentMethod,
      deliveryInstructions,
      prescriptionImage,
      notes
    } = req.body;

    // 1. Validate and process order items
    let totalAmount = 0;
    const orderItems = [];
    const itemUpdates = [];

    // Process each item in the order
    for (const item of items) {
      const medicine = await Medicine.findById(item.medicineId).session(session);
      if (!medicine) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: `Medicine with ID ${item.medicineId} not found`
        });
      }

      // Check if medicine is in stock
      if (medicine.stockQuantity < item.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${medicine.name}. Available: ${medicine.stockQuantity}`
        });
      }

      // Calculate item subtotal
      const subtotal = medicine.price * item.quantity;
      totalAmount += subtotal;

      // Add to order items
      orderItems.push({
        medicine: medicine._id,
        name: medicine.name,
        price: medicine.price,
        quantity: item.quantity,
        subtotal
      });

      // Update stock quantity
      medicine.stockQuantity -= item.quantity;
      itemUpdates.push(medicine.save({ session }));
    }

    // Calculate delivery fee (could be based on distance, order amount, etc.)
    const deliveryFee = calculateDeliveryFee(deliveryAddress, totalAmount);
    
    // Calculate tax (example: 15% of subtotal)
    const tax = totalAmount * 0.15;
    
    // Calculate final amount
    const finalAmount = totalAmount + deliveryFee + tax;

    // Check if prescription is required for any item
    const requiresPrescription = orderItems.some(item => 
      item.requiresPrescription && !prescriptionImage
    );

    if (requiresPrescription) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Prescription is required for one or more items in your order'
      });
    }

    // Create order
    const order = new Order({
      customer: req.user.userId,
      items: orderItems,
      totalAmount,
      deliveryFee,
      tax,
      finalAmount,
      deliveryAddress,
      paymentMethod,
      deliveryInstructions,
      prescriptionImage: requiresPrescription ? prescriptionImage : undefined,
      notes,
      status: 'pending',
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'pending', // Will be updated after payment processing
      statusHistory: [{
        status: 'pending',
        note: 'Order created'
      }]
    });

    // Save order
    await order.save({ session });

    // Update stock quantities
    await Promise.all(itemUpdates);

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Log order creation
    logger.info(`Order ${order.orderNumber} created by user ${req.user.userId}`);

    // Send order confirmation email (implementation not shown)
    // await sendOrderConfirmationEmail(order, req.user);

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.finalAmount
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error('Order creation failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/orders
 * @desc    Get all orders for the logged-in user
 * @access  Private (Customer)
 */
const getMyOrders = async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const query = { customer: req.user.userId };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('pharmacy', 'name address phone')
      .lean();

    const total = await Order.countDocuments(query);

    return res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error('Failed to fetch orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/orders/:orderId
 * @desc    Get order details
 * @access  Private (Customer, Pharmacy, Admin)
 */
const getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('customer', 'firstName lastName email phone')
      .populate('pharmacy', 'name address phone')
      .populate('deliveryPerson', 'firstName lastName phone')
      .populate('items.medicine', 'name imageUrl');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to view this order
    if (
      order.customer._id.toString() !== req.user.userId && 
      req.user.role !== 'admin' &&
      (!order.pharmacy || order.pharmacy._id.toString() !== req.user.pharmacyId)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    return res.json({
      success: true,
      data: order
    });

  } catch (error) {
    logger.error('Failed to fetch order details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/orders/:orderId/cancel
 * @desc    Cancel an order
 * @access  Private (Customer)
 */
const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(req.params.orderId).session(session);

    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is the owner of the order
    if (order.customer.toString() !== req.user.userId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed', 'preparing'].includes(order.status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order in ${order.status} status`
      });
    }

    // Update order status
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.statusHistory.push({
      status: 'cancelled',
      note: 'Order cancelled by customer'
    });

    // Restore stock for each item
    for (const item of order.items) {
      await Medicine.findByIdAndUpdate(
        item.medicine,
        { $inc: { stockQuantity: item.quantity } },
        { session }
      );
    }

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    // Send cancellation notification (implementation not shown)
    // await sendOrderCancellationEmail(order);

    return res.json({
      success: true,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error('Failed to cancel order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
};

// Helper function to calculate delivery fee (example implementation)
function calculateDeliveryFee(deliveryAddress, orderAmount) {
  // Base delivery fee
  let fee = 50; // Base fee in ETB
  
  // Free delivery for orders above 1000 ETB
  if (orderAmount > 1000) {
    return 0;
  }

  // Add distance-based fee (example)
  // In a real app, you would use a mapping service to calculate distance
  // and apply appropriate fees based on zones or distance brackets
  
  return fee;
}

module.exports = {
  createOrder,
  getMyOrders,
  getOrderDetails,
  cancelOrder
};