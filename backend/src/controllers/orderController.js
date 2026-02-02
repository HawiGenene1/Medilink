const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Medicine = require('../models/Medicine');
const User = require('../models/User');
const Notification = require('../models/Notification');
const DeliveryProfile = require('../models/DeliveryProfile');
const { getIo } = require('../socket');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const { createNotification } = require('../utils/notificationHelper');
const FilterService = require('../services/filterService');

/**
 * GET /api/orders
 */
const getOrders = async (req, res) => {
  try {
    const { customerId, pharmacyId } = req.query;
    let additionalFilters = {};

    if (req.user && req.user.role === 'customer') {
      additionalFilters.customer = req.user.userId || req.user._id;
    } else if (customerId) {
      additionalFilters.customer = customerId;
    }

    if (req.user && (req.user.role === 'pharmacy' || req.user.role === 'pharmacy_admin' || req.user.role === 'pharmacy_owner')) {
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
    logger.error('getOrders error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching orders' });
  }
};

/**
 * GET /api/orders/my
 */
const getMyOrders = async (req, res) => {
  try {
    const customerId = req.user.userId || req.user._id;
    const { status, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const query = { customer: customerId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('pharmacy', 'name address phone')
      .lean();

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      count: orders.length,
      total,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('getMyOrders error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching your orders' });
  }
};

/**
 * GET /api/orders/:id
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('customer', 'firstName lastName email phone')
      .populate('pharmacy', 'name email phone address location')
      .populate('courier', 'firstName lastName email phone')
      .populate('items.medicine', 'name price imageUrl')
      .exec();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Auth check
    const userId = req.user.userId || req.user._id;
    const isCustomer = order.customer && userId.toString() === order.customer._id.toString();
    const isPharmacy = req.user.pharmacyId && order.pharmacy && req.user.pharmacyId.toString() === order.pharmacy._id.toString();
    const isCourier = order.courier && userId.toString() === order.courier._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isPharmacy && !isCourier && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.json({ success: true, data: order });
  } catch (error) {
    logger.error('getOrderById error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching order' });
  }
};

/**
 * POST /api/orders
 */
const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
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
      prescriptionRequired,
      prescriptionImage,
      deliveryInstructions,
      notes
    } = req.body;

    const customerId = req.user.userId || req.user.id || req.user._id;
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
        label: address.label || address.address,
        notes: address.notes || deliveryInstructions,
        coordinates: address.coordinates,
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
      notes: notes,
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        note: 'Order placed by customer'
      }]
    });

    await newOrder.save({ session });

    // Create Payment record
    const payment = new Payment({
      order: newOrder._id,
      customer: customerId,
      pharmacy: pharmacyId,
      amount: newOrder.finalAmount,
      paymentMethod: newOrder.paymentMethod,
      paymentStatus: 'PENDING'
    });
    await payment.save({ session });

    newOrder.payment = payment._id;
    await newOrder.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Notifications and Driver matching (async)
    process.nextTick(async () => {
      try {
        const order = await Order.findById(newOrder._id).populate('pharmacy');
        const pickupLocation = order.pharmacy?.location;

        if (pickupLocation && pickupLocation.coordinates) {
          const drivers = await DeliveryProfile.find({
            isAvailable: true,
            onboardingStatus: 'approved',
            currentLocation: {
              $near: {
                $geometry: {
                  type: 'Point',
                  coordinates: pickupLocation.coordinates
                },
                $maxDistance: 10000
              }
            }
          });

          const io = getIo();
          drivers.forEach(driver => {
            io.to(driver.userId.toString()).emit('delivery_request', {
              orderId: order._id,
              orderNumber: order.orderNumber,
              pickup: { name: order.pharmacy.name, address: order.pharmacy.address },
              dropoff: { address: order.address.label },
              totalAmount: order.totalAmount,
              earnings: order.serviceFee
            });
          });
        }

        await createNotification({
          userId: customerId,
          title: 'Order Placed',
          message: `Order #${order.orderNumber} placed successfully!`,
          type: 'order_update',
          metadata: { orderId: order._id }
        });
      } catch (err) {
        logger.error('Post-order creation tasks failed:', err);
      }
    });

    res.status(201).json({ success: true, message: 'Order placed successfully', data: newOrder });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error('createOrder error:', error);
    res.status(500).json({ success: false, message: 'Failed to place order' });
  }
};

/**
 * GET /api/orders/:id/tracking
 */
const getOrderTracking = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .select('status statusHistory courier estimatedArrivalTime actualArrivalTime orderNumber pharmacy address')
      .populate('courier', 'firstName lastName phone')
      .populate('pharmacy', 'name location address phone');

    if (!order) return res.status(404).json({ success: false, message: 'Order tracking not found' });

    const orderData = order.toObject();
    if (order.courier) {
      const profile = await DeliveryProfile.findOne({ userId: order.courier._id });
      if (profile) orderData.courier.location = profile.currentLocation;
    }

    res.json({ success: true, data: orderData });
  } catch (error) {
    logger.error('getOrderTracking error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PATCH /api/orders/:id/cancel
 */
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const userId = req.user.userId || req.user._id;
    if (order.customer.toString() !== userId.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled in current status' });
    }

    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', timestamp: new Date(), note: 'Cancelled by customer' });
    await order.save();

    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (error) {
    logger.error('cancelOrder error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/orders/pharmacy/:pharmacyId
 */
const getPharmacyOrders = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const { status, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    if (req.user.role !== 'admin' && String(req.user.pharmacyId) !== String(pharmacyId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const query = { pharmacy: pharmacyId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('customer', 'firstName lastName email phone')
      .lean();

    const total = await Order.countDocuments(query);
    res.json({ success: true, data: { orders, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) } } });
  } catch (error) {
    logger.error('getPharmacyOrders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PUT /api/orders/:orderId/status
 */
const updateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (req.user.role !== 'admin' && String(req.user.pharmacyId) !== String(order.pharmacy)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Stock deduction logic if status becomes 'prepared'
    if (status === 'prepared' && order.status !== 'prepared') {
      for (const item of order.items) {
        const medicine = await Medicine.findById(item.medicine).session(session);
        if (medicine && medicine.stockQuantity >= item.quantity) {
          medicine.stockQuantity -= item.quantity;
          await medicine.save({ session });
        } else {
          throw new Error(`Insufficient stock for ${item.name}`);
        }
      }
    }

    order.status = status;
    order.statusHistory.push({
      status,
      note: note || `Updated by ${req.user.firstName}`,
      timestamp: new Date()
    });

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, message: `Status updated to ${status}`, data: order });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error('updateOrderStatus error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOrderFilterOptions = async (req, res) => {
  try {
    const options = await FilterService.getOrderFilterOptions();
    return res.json({ success: true, data: options });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  getOrderFilterOptions,
  createOrder,
  getMyOrders,
  getOrderDetails: getOrderById,
  cancelOrder,
  getOrderTracking,
  getPharmacyOrders,
  updateOrderStatus
};
