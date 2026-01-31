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
      const medicine = await Medicine.findById(item.medicineId);
      if (!medicine) {

        return res.status(404).json({
          success: false,
          message: `Medicine with ID ${item.medicineId} not found`,
          medicineId: item.medicineId
        });
      }

      // Check if medicine is in stock
      if (medicine.stockQuantity < item.quantity) {

        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${medicine.name}. Available: ${medicine.stockQuantity}`
        });
      }

      // Calculate item subtotal
      const itemPrice = (medicine.price && typeof medicine.price === 'object') ? medicine.price.basePrice : medicine.price;
      const subtotal = itemPrice * item.quantity;
      totalAmount += subtotal;

      // Add to order items
      orderItems.push({
        medicine: medicine._id,
        name: medicine.name,
        price: itemPrice,
        quantity: item.quantity,
        subtotal
      });

      // Update stock quantity
      medicine.stockQuantity -= item.quantity;
      itemUpdates.push(medicine.save());
    }

    // Determine the pharmacy for this order (from the first item)
    const firstMedicine = await Medicine.findById(items[0].medicineId);
    const pharmacyId = firstMedicine?.availableAt[0];

    // Calculate delivery fee
    const deliveryFee = 50; // Fixed fee for demo or use calculateDeliveryFee(deliveryAddress, totalAmount);

    // Calculate tax (15%)
    const tax = totalAmount * 0.15;

    // Calculate final amount
    const finalAmount = totalAmount + deliveryFee + tax;

    // Check if prescription is required
    const requiresPrescription = orderItems.some(item =>
      item.requiresPrescription && !prescriptionImage
    );

    if (requiresPrescription) {
      return res.status(400).json({
        success: false,
        message: 'Prescription is required for one or more items'
      });
    }

    // Create order
    const order = new Order({
      customer: req.user.userId,
      pharmacy: pharmacyId, // CRITICAL: Added missing pharmacy field
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
    await order.save();

    // Update stock quantities
    await Promise.all(itemUpdates);

    // Commit transaction


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


  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {

      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is the owner of the order
    if (order.customer.toString() !== req.user.userId) {

      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed', 'preparing'].includes(order.status)) {

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
        { $inc: { stockQuantity: item.quantity } }
      );
    }

    await order.save();


    // Send cancellation notification (implementation not shown)
    // await sendOrderCancellationEmail(order);

    return res.json({
      success: true,
      message: 'Order cancelled successfully'
    });

  } catch (error) {

    logger.error('Failed to cancel order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/orders/:orderId/tracking
 * @desc    Get live tracking info for an order
 * @access  Private (Customer, Pharmacy, Admin)
 */
const getOrderTracking = async (req, res) => {
  try {
    const { id } = req.params;

    // Development Fallback for mock IDs like ORD-1024
    if (id.startsWith('ORD-') && process.env.NODE_ENV === 'development') {
      return res.json({
        success: true,
        data: {
          status: 'out_for_delivery',
          statusHistory: [
            { status: 'pending', timestamp: new Date(Date.now() - 3600000), note: 'Order created' },
            { status: 'confirmed', timestamp: new Date(Date.now() - 3000000), note: 'Pharmacy confirmed' },
            { status: 'preparing', timestamp: new Date(Date.now() - 2400000), note: 'Preparing order' },
            { status: 'out_for_delivery', timestamp: new Date(Date.now() - 600000), note: 'Driver picked up' }
          ],
          deliveryPerson: {
            name: 'Samuel Girma',
            phone: '+251 911 223344',
            location: { latitude: 9.0227, longitude: 38.7460 }
          },
          destination: { latitude: 9.0300, longitude: 38.7500 }
        }
      });
    }

    const order = await Order.findById(id)
      .populate('deliveryPerson', 'firstName lastName phone currentLocation')
      .select('status statusHistory deliveryPerson deliveryAddress');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    return res.json({
      success: true,
      data: {
        status: order.status,
        statusHistory: order.statusHistory,
        deliveryPerson: order.deliveryPerson ? {
          name: `${order.deliveryPerson.firstName} ${order.deliveryPerson.lastName}`,
          phone: order.deliveryPerson.phone,
          location: order.deliveryPerson.currentLocation
        } : null,
        destination: order.deliveryAddress?.coordinates
      }
    });

  } catch (error) {
    logger.error('Failed to fetch tracking info:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tracking info',
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
  cancelOrder,
  getOrderTracking
};