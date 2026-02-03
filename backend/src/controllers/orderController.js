const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Medicine = require('../models/Medicine');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');
const DeliveryProfile = require('../models/DeliveryProfile');
const { getIo } = require('../socket');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { createNotification } = require('../utils/notificationHelper');

/**
 * GET /api/orders
 * Query params: status, statuses, paymentStatus, paymentMethod, dateFrom, dateTo,
 *                search, sortBy, sortOrder, page, limit, customerId, pharmacyId
 */
const getOrders = async (req, res) => {
  try {
    const { customerId, pharmacyId } = req.query;

    // Build additional filters based on user role
    let additionalFilters = {};

    // If customer is requesting, only show their orders
    if (req.user && req.user.role === 'customer') {
      additionalFilters.customer = req.user._id;
    } else if (customerId) {
      additionalFilters.customer = customerId;
    }








    // If pharmacy is requesting, only show their orders
    if (req.user && req.user.role === 'pharmacy') {
      additionalFilters.pharmacy = req.user.pharmacyId;
    } else if (pharmacyId) {
      additionalFilters.pharmacy = pharmacyId;
    }

    const result = await FilterService.filterOrders(req.query, additionalFilters);

    return res.json({
      success: true,
      data: result.orders,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('getOrders error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching orders' });
  }
};

/**
 * GET /api/orders/filter-options
 * Returns available filter options for orders
 */
const getOrderFilterOptions = async (req, res) => {
  try {
    const options = await FilterService.getOrderFilterOptions();
    return res.json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('getOrderFilterOptions error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching filter options' });
  }
};

/**
 * GET /api/orders/:id
 * Get order by ID
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`[getOrderById] Fetching order ${id} for user:`, req.user);

    const order = await Order.findById(id)
      .populate('customer', 'firstName lastName email phone')
      .populate('pharmacy', 'name email phone address location')
      .populate('courier', 'firstName lastName email phone')
      .populate('items.medicine', 'name price imageUrl')
      .exec();

    if (!order) {
      logger.info(`[getOrderById] Order ${id} not found`);
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    logger.info(`[getOrderById] Order found. Customer: ${order.customer?._id}, Courier: ${order.courier?._id}`);

    // Check if user has permission to view this order
    if (req.user) {
      const userId = req.user.userId || req.user._id;
      logger.info(`[getOrderById] Checking authorization for userId: ${userId}`);
      logger.info(`[getOrderById] Customer ID: ${order.customer?._id}, Pharmacy ID: ${order.pharmacy?._id}, Courier ID: ${order.courier?._id}`);
      logger.info(`[getOrderById] req.user:`, JSON.stringify(req.user));

      const isCustomer = order.customer && userId.toString() === order.customer._id.toString();
      const isPharmacy = req.user.pharmacyId && order.pharmacy && req.user.pharmacyId.toString() === order.pharmacy._id.toString();
      const isCourier = order.courier && userId.toString() === order.courier._id.toString();
      const isAdmin = req.user.role === 'admin' || req.user.role === 'system_admin';

      logger.info(`[getOrderById] Auth checks - Customer: ${isCustomer}, Pharmacy: ${isPharmacy}, Courier: ${isCourier}, Admin: ${isAdmin}`);

      if (!isCustomer && !isPharmacy && !isCourier && !isAdmin) {
        logger.info(`[getOrderById] Access denied for user ${userId}`);
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    logger.info(`[getOrderById] Access granted, returning order`);
    logger.info(`[getOrderById] Address data:`, JSON.stringify(order.address, null, 2));
    return res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('getOrderById error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching order', error: error.message });
  }
};

/**
 * POST /api/orders
 * Create a new order
 */
const createOrder = async (req, res) => {
  console.log('--- CREATE ORDER REQUEST START ---');
  try {
    const {
      pharmacyId,
      items,
      totalAmount,
      serviceFee,
      tax,
      discount,
      finalAmount,
      address,
      paymentMethod,
      paymentDetails,
      prescriptionRequired,
      prescriptionImage
    } = req.body;

    // Use req.user.userId from protect middleware or fallback for dev
    const customerId = req.user.userId || req.user.id || req.user._id;
    console.log('[CreateOrder] Starting order creation for customer:', customerId);
    console.log('[CreateOrder] Pharmacy ID:', pharmacyId);

    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newOrder = new Order({
      orderNumber,
      customer: customerId,
      pharmacy: pharmacyId,
      items: items.map(item => ({
        ...item,
        subtotal: item.price * item.quantity
      })),
      totalAmount,
      serviceFee: serviceFee || 50,
      tax: tax || 0,
      discount: discount || 0,
      finalAmount: finalAmount || (totalAmount + (serviceFee || 50)),
      address: {
        label: address.label || address.address, // Support both old and new format
        notes: address.notes,
        coordinates: address.coordinates || {
          latitude: address.geojson?.coordinates[1],
          longitude: address.geojson?.coordinates[0]
        },
        geojson: address.geojson || {
          type: 'Point',
          coordinates: [address.coordinates?.longitude, address.coordinates?.latitude]
        }
      },
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: 'pending',
      status: 'pending',
      prescriptionRequired: prescriptionRequired || false,
      prescriptionImage: prescriptionImage || null,
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        note: 'Order placed by customer'
      }]
    });

    console.log('[CreateOrder] Saving new order...');
    await newOrder.save();
    console.log('[CreateOrder] Order saved successfully:', newOrder.orderNumber);

    // Populate pharmacy for notification data
    const populatedOrder = await Order.findById(newOrder._id).populate('pharmacy');

    // Notify nearby drivers
    try {
      const pickupLocation = populatedOrder.pharmacy?.location;
      logger.info(`[CreateOrder] Notification Diagnostic for ${orderNumber}:`);
      logger.info(` - Pickup Coords (Lon/Lat): ${JSON.stringify(pickupLocation?.coordinates)}`);

      if (pickupLocation && pickupLocation.coordinates) {
        logger.info('[CreateOrder] Searching for approved drivers with isAvailable: true...');
        const drivers = await DeliveryProfile.find({
          isAvailable: true,
          onboardingStatus: 'approved',
          currentLocation: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: pickupLocation.coordinates
              },
              $maxDistance: 10000 // 10km radius
            }
          }
        });
        logger.info(`[CreateOrder] Found ${drivers.length} eligible drivers nearby.`);

        if (drivers.length === 0) {
          const anyReady = await DeliveryProfile.countDocuments({ onboardingStatus: 'approved' });
          const anyOnline = await DeliveryProfile.countDocuments({ isAvailable: true });
          logger.warn(`[CreateOrder] ZERO drivers notified. System Stats: Total Approved=${anyReady}, total Online=${anyOnline}`);
        }

        const io = getIo();
        drivers.forEach(driver => {
          io.to(driver.userId.toString()).emit('delivery_request', {
            orderId: populatedOrder._id,
            orderNumber: populatedOrder.orderNumber,
            pickup: {
              name: populatedOrder.pharmacy.name,
              address: populatedOrder.pharmacy.address,
              location: populatedOrder.pharmacy.location
            },
            dropoff: {
              address: populatedOrder.address.label,
              location: populatedOrder.address.geojson,
              notes: populatedOrder.address.notes
            },
            items: populatedOrder.items,
            totalAmount: populatedOrder.totalAmount,
            earnings: populatedOrder.serviceFee
          });
        });
        console.log(`Notified ${drivers.length} drivers for order ${populatedOrder.orderNumber}`);
        // Notify Customer
        await createNotification({
          userId: populatedOrder.customer,
          title: 'Order Placed',
          message: `Order #${populatedOrder.orderNumber} has been successfully placed!`,
          type: 'order_update',
          link: `/customer/orders/track/${populatedOrder._id}`,
          metadata: { isSuccess: true }
        });
      }
    } catch (err) {
      console.error('Failed to notify drivers:', err);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: newOrder
    });
  } catch (error) {
    console.error('createOrder error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Order validation failed',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ success: false, message: 'Failed to place order', error: error.message });
  }
};

/**
 * GET /api/orders/my
 * Get orders for current authenticated user
 */
const getMyOrders = async (req, res) => {
  try {
    const customerId = req.user.userId || req.user._id;
    const orders = await Order.find({ customer: customerId })
      .populate('pharmacy', 'name address phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('getMyOrders error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching your orders' });
  }
};

/**
 * GET /api/orders/:id/tracking
 * Get tracking info for an order
 */
const getOrderTracking = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .select('status statusHistory courier estimatedArrivalTime actualArrivalTime orderNumber pharmacy address')
      .populate('courier', 'firstName lastName phone')
      .populate('pharmacy', 'name location address phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order tracking not found' });
    }

    // Convert to plain object to add location
    const orderData = order.toObject();

    // If there's a courier, get their latest location from DeliveryProfile
    if (order.courier) {
      const profile = await DeliveryProfile.findOne({ userId: order.courier._id });
      if (profile && profile.currentLocation) {
        orderData.courier.location = profile.currentLocation;
      }
    }

    res.json({
      success: true,
      data: orderData
    });
  } catch (error) {
    console.error('getOrderTracking error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PATCH /api/orders/:id/cancel
 * Cancel an order
 */
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if user is the customer
    const userId = req.user.userId || req.user._id;
    if (order.customer.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Only allow cancellation if order is still pending or confirmed
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled in its current status: ${order.status}`
      });
    }

    order.status = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: 'Cancelled by customer'
    });

    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('cancelOrder error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



/**
 * @route   GET /api/orders/pharmacy/:pharmacyId
 * @desc    Get all orders for a specific pharmacy
 * @access  Private (Pharmacy Staff, Admin)
 */
const getPharmacyOrders = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const { status, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const query = { pharmacy: pharmacyId };

    // Valid statuses for pharmacy view usually
    if (status) {
      if (typeof status === 'string' && status.includes(',')) {
        query.status = { $in: status.split(',') };
      } else {
        query.status = status;
      }
    }

    // Check authorization: User must belong to this pharmacy or be admin
    if (req.user.role !== 'admin' && String(req.user.pharmacyId) !== String(pharmacyId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view orders for this pharmacy'
      });
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('customer', 'firstName lastName email phone')
      .populate('items.medicine', 'name')
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
    logger.error('Failed to fetch pharmacy orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pharmacy orders',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/orders/:orderId/status
 * @desc    Update order status
 * @access  Private (Pharmacy Staff, Admin - but NOT System Admin)
 */
const updateOrderStatus = async (req, res) => {
  // Block system_admin from operational tasks
  if (req.user.role === 'system_admin') {
    return res.status(403).json({
      success: false,
      message: 'System Admins cannot perform operational tasks like order updates.'
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['verified', 'confirmed', 'prepared', 'processing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
    }

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Authorization check
    if (req.user.role !== 'admin' && (!order.pharmacy || order.pharmacy.toString() !== req.user.pharmacyId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Logic for 'prepared' status - Deduct Stock
    if (status === 'prepared' && order.status !== 'prepared') {
      // Check and deduct stock
      for (const item of order.items) {
        const medicine = await Medicine.findById(item.medicine).session(session);
        if (!medicine) {
          throw new Error(`Medicine ${item.name} not found`);
          // Or handle gracefully
        }

        if (medicine.stockQuantity < item.quantity) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${medicine.name} to fulfill order`
          });
        }

        medicine.stockQuantity -= item.quantity;
        await medicine.save({ session });
      }
    }

    // Update status
    order.status = status;
    order.statusHistory.push({
      status: status,
      note: `Status updated to ${status} by ${req.user.firstName}`,
      timestamp: new Date()
    });

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      message: `Order updated to ${status}`,
      data: order
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error('Failed to update order status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  getOrderFilterOptions,
  createOrder,
  getMyOrders,
  getOrderDetails: getOrderById, // Alias for route
  cancelOrder,
  getOrderTracking,
  getPharmacyOrders,
  updateOrderStatus
};
