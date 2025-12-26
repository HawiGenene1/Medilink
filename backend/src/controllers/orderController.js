const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const notificationService = require('../services/notificationService');
const { ErrorResponse } = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

/**
 * @desc    Create a new order
 * @route   POST /api/v1/orders
 * @access  Private
 */
exports.createOrder = asyncHandler(async (req, res, next) => {
  const { items, deliveryAddress, paymentMethod, prescriptionRequired, deliveryInstructions, notes } = req.body;
  const userId = req.user.id;

  // Validate items
  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new ErrorResponse('Please add at least one item to the order', 400));
  }

  // Get pharmacy ID from the first item (all items should be from the same pharmacy)
  const firstItem = await Medicine.findById(items[0].medicine);
  if (!firstItem) {
    return next(new ErrorResponse(`Medicine with ID ${items[0].medicine} not found`, 404));
  }
  const pharmacyId = firstItem.pharmacy;

  // Validate all items belong to the same pharmacy and are in stock
  let totalAmount = 0;
  const orderItems = [];

  for (const item of items) {
    const medicine = await Medicine.findById(item.medicine);
    
    if (!medicine) {
      return next(new ErrorResponse(`Medicine with ID ${item.medicine} not found`, 404));
    }

    if (medicine.pharmacy.toString() !== pharmacyId.toString()) {
      return next(new ErrorResponse('All items must be from the same pharmacy', 400));
    }

    if (medicine.quantity < item.quantity) {
      return next(new ErrorResponse(`Not enough stock for ${medicine.name}. Available: ${medicine.quantity}`, 400));
    }

    // Calculate subtotal and update total
    const subtotal = item.quantity * medicine.price;
    totalAmount += subtotal;

    orderItems.push({
      medicine: item.medicine,
      name: medicine.name,
      price: medicine.price,
      quantity: item.quantity,
      subtotal
    });
  }

  // Calculate delivery fee, tax, and final amount (simplified)
  const deliveryFee = 50; // This could be dynamic based on distance, etc.
  const tax = totalAmount * 0.15; // 15% tax
  const finalAmount = totalAmount + deliveryFee + tax;

  // Create order
  const order = await Order.create({
    customer: userId,
    pharmacy: pharmacyId,
    items: orderItems,
    totalAmount,
    deliveryFee,
    tax,
    finalAmount,
    paymentMethod,
    paymentStatus: paymentMethod === 'cash_on_delivery' ? 'pending' : 'unpaid',
    deliveryAddress,
    prescriptionRequired: prescriptionRequired || false,
    deliveryInstructions,
    notes,
    status: prescriptionRequired ? 'awaiting_prescription' : 'pending'
  });

  // Update medicine quantities
  for (const item of items) {
    await Medicine.findByIdAndUpdate(item.medicine, {
      $inc: { quantity: -item.quantity }
    });
  }

  // Send order confirmation notification
  try {
    await notificationService.sendOrderStatusUpdate(order._id);
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    // Don't fail the request if notification fails
  }

  res.status(201).json({
    success: true,
    data: order
  });
});

/**
 * @desc    Get all orders
 * @route   GET /api/v1/orders
 * @access  Private
 */
exports.getOrders = asyncHandler(async (req, res, next) => {
  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit'];

  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach(param => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  // Finding resource
  let query = Order.find(JSON.parse(queryStr));

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Order.countDocuments(JSON.parse(queryStr));

  query = query.skip(startIndex).limit(limit);

  // Executing query
  const orders = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: orders.length,
    pagination,
    data: orders
  });
});

/**
 * @desc    Get single order
 * @route   GET /api/v1/orders/:id
 * @access  Private
 */
exports.getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'name email phone')
    .populate('pharmacy', 'name address phone')
    .populate('items.medicine', 'name description')
    .populate('delivery.driver', 'name phone');

  if (!order) {
    return next(
      new ErrorResponse(`Order not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is order owner, pharmacy staff, or admin
  if (
    order.customer._id.toString() !== req.user.id &&
    req.user.role !== 'admin' &&
    (req.user.role !== 'pharmacy_staff' || order.pharmacy._id.toString() !== req.user.pharmacy?.toString())
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to access this order`,
        401
      )
    );
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

/**
 * @desc    Update order status
 * @route   PUT /api/v1/orders/:id/status
 * @access  Private/Pharmacy Staff/Admin
 */
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status, reason } = req.body;
  const userId = req.user.id;

  let order = await Order.findById(req.params.id);

  if (!order) {
    return next(
      new ErrorResponse(`Order not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user is authorized to update this order
  if (
    req.user.role !== 'admin' &&
    (req.user.role !== 'pharmacy_staff' || order.pharmacy.toString() !== req.user.pharmacy?.toString())
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this order`,
        401
      )
    );
  }

  // Update order status with history tracking
  order = await order.updateStatus(status, {
    userId,
    reason,
    note: `Status updated to ${status}`
  });

  // Send notification to customer
  try {
    await notificationService.sendOrderStatusUpdate(order._id);
  } catch (error) {
    console.error('Error sending status update notification:', error);
    // Don't fail the request if notification fails
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

/**
 * @desc    Upload prescription for an order
 * @route   PUT /api/v1/orders/:id/prescription
 * @access  Private
 */
exports.uploadPrescription = asyncHandler(async (req, res, next) => {
  const { imageUrl } = req.body;
  const userId = req.user.id;

  if (!imageUrl) {
    return next(new ErrorResponse('Please provide an image URL', 400));
  }

  let order = await Order.findById(req.params.id);

  if (!order) {
    return next(
      new ErrorResponse(`Order not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is order owner
  if (order.customer.toString() !== userId) {
    return next(
      new ErrorResponse(
        `User ${userId} is not authorized to update this order`,
        401
      )
    );
  }

  // Check if order requires prescription
  if (!order.prescription || !order.prescription.required) {
    return next(
      new ErrorResponse('This order does not require a prescription', 400)
    );
  }

  // Add prescription image
  if (!order.prescription.images) {
    order.prescription.images = [];
  }

  order.prescription.images.push({
    url: imageUrl,
    uploadedAt: new Date()
  });

  // Update prescription status
  order.prescription.status = 'pending_verification';
  
  // Update order status if it was waiting for prescription
  if (order.status === 'awaiting_prescription') {
    order.status = 'pending';
  }

  await order.save();

  // Notify pharmacy staff about the new prescription
  try {
    await notificationService.sendPrescriptionVerification(order._id, 'New prescription uploaded for verification');
  } catch (error) {
    console.error('Error sending prescription notification:', error);
    // Don't fail the request if notification fails
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

/**
 * @desc    Verify prescription
 * @route   PUT /api/v1/orders/:id/verify-prescription
 * @access  Private/Pharmacy Staff/Admin
 */
exports.verifyPrescription = asyncHandler(async (req, res, next) => {
  const { isApproved, reason } = req.body;
  const userId = req.user.id;

  let order = await Order.findById(req.params.id);

  if (!order) {
    return next(
      new ErrorResponse(`Order not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user is authorized to verify prescriptions
  if (
    req.user.role !== 'admin' &&
    (req.user.role !== 'pharmacy_staff' || order.pharmacy.toString() !== req.user.pharmacy?.toString())
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to verify prescriptions`,
        401
      )
    );
  }

  // Verify the prescription
  await order.verifyPrescription(userId, isApproved, reason);

  // Send notification to customer
  try {
    if (isApproved) {
      await notificationService.sendOrderStatusUpdate(order._id);
    } else {
      await notificationService.sendPrescriptionVerification(
        order._id,
        `Your prescription was not approved. Reason: ${reason || 'Not specified'}`
      );
    }
  } catch (error) {
    console.error('Error sending verification notification:', error);
    // Don't fail the request if notification fails
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

/**
 * @desc    Update delivery status
 * @route   PUT /api/v1/orders/:id/delivery-status
 * @access  Private/Driver/Pharmacy Staff/Admin
 */
exports.updateDeliveryStatus = asyncHandler(async (req, res, next) => {
  const { status, coordinates, notes } = req.body;
  const userId = req.user.id;

  let order = await Order.findById(req.params.id);

  if (!order) {
    return next(
      new ErrorResponse(`Order not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user is authorized to update delivery status
  const isDriver = req.user.role === 'driver';
  const isPharmacyStaff = req.user.role === 'pharmacy_staff';
  const isAdmin = req.user.role === 'admin';
  
  const isDeliveryPersonnel = isDriver && order.delivery?.driver?.toString() === userId;
  const isPharmacyStaffForOrder = isPharmacyStaff && order.pharmacy.toString() === req.user.pharmacy?.toString();
  
  if (!isAdmin && !isDeliveryPersonnel && !isPharmacyStaffForOrder) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update delivery status`,
        401
      )
    );
  }

  // Update delivery status
  await order.updateDeliveryStatus(status, {
    coordinates,
    notes,
    driverId: isDriver ? userId : undefined
  });

  // Refresh the order to get updated data
  order = await Order.findById(order._id);

  // Send notification to customer
  try {
    await notificationService.sendDeliveryUpdate(order._id, status);
  } catch (error) {
    console.error('Error sending delivery update notification:', error);
    // Don't fail the request if notification fails
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

/**
 * @desc    Cancel an order
 * @route   PUT /api/v1/orders/:id/cancel
 * @access  Private
 */
exports.cancelOrder = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  const userId = req.user.id;

  let order = await Order.findById(req.params.id);

  if (!order) {
    return next(
      new ErrorResponse(`Order not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user is authorized to cancel this order
  const isCustomer = order.customer.toString() === userId;
  const isPharmacyStaff = req.user.role === 'pharmacy_staff' && 
    order.pharmacy.toString() === req.user.pharmacy?.toString();
  const isAdmin = req.user.role === 'admin';
  
  if (!isCustomer && !isPharmacyStaff && !isAdmin) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to cancel this order`,
        401
      )
    );
  }

  // Check if order can be cancelled
  const nonCancellableStatuses = ['delivered', 'cancelled', 'refunded'];
  if (nonCancellableStatuses.includes(order.status)) {
    return next(
      new ErrorResponse(
        `Order with status '${order.status}' cannot be cancelled`,
        400
      )
    );
  }

  // Update order status to cancelled
  order = await order.updateStatus('cancelled', {
    userId,
    reason: reason || 'Cancelled by customer',
    note: `Order cancelled by ${isCustomer ? 'customer' : 'staff'}`
  });

  // Restore medicine quantities if the order was already confirmed/processing
  if (['confirmed', 'processing', 'ready_for_pickup', 'out_for_delivery'].includes(order.status)) {
    for (const item of order.items) {
      await Medicine.findByIdAndUpdate(item.medicine, {
        $inc: { quantity: item.quantity }
      });
    }
  }

  // Send cancellation notification
  try {
    await notificationService.sendOrderStatusUpdate(order._id);
  } catch (error) {
    console.error('Error sending cancellation notification:', error);
    // Don't fail the request if notification fails
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

/**
 * @desc    Get orders by pharmacy
 * @route   GET /api/v1/orders/pharmacy/:pharmacyId
 * @access  Private/Pharmacy Staff/Admin
 */
exports.getOrdersByPharmacy = asyncHandler(async (req, res, next) => {
  const { status, startDate, endDate, sort } = req.query;
  const { pharmacyId } = req.params;
  const query = { pharmacy: pharmacyId };

  // Check if user is authorized to view these orders
  if (
    req.user.role !== 'admin' &&
    (req.user.role !== 'pharmacy_staff' || pharmacyId !== req.user.pharmacy?.toString())
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to view these orders`,
        401
      )
    );
  }

  // Add status filter
  if (status) {
    query.status = status;
  }

  // Add date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      // Set to end of the day
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt.$lte = endOfDay;
    }
  }

  // Build query
  let ordersQuery = Order.find(query)
    .populate('customer', 'name email phone')
    .populate('items.medicine', 'name');

  // Sort
  if (sort) {
    const sortBy = sort.split(',').join(' ');
    ordersQuery = ordersQuery.sort(sortBy);
  } else {
    ordersQuery = ordersQuery.sort('-createdAt');
  }

  // Execute query
  const orders = await ordersQuery;

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders
  });
});

/**
 * @desc    Get order statistics
 * @route   GET /api/v1/orders/stats
 * @access  Private/Admin/Pharmacy Admin
 */
exports.getOrderStats = asyncHandler(async (req, res, next) => {
  const { pharmacyId, startDate, endDate } = req.query;
  const match = {};
  
  // Add pharmacy filter if user is pharmacy staff/admin
  if (req.user.role === 'pharmacy_staff' || req.user.role === 'pharmacy_admin') {
    match.pharmacy = req.user.pharmacy;
  } else if (pharmacyId) {
    match.pharmacy = pharmacyId;
  }

  // Add date range filter
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      match.createdAt.$lte = endOfDay;
    }
  }

  const stats = await Order.aggregate([
    {
      $match: match
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSales: { $sum: '$finalAmount' },
        avgOrderValue: { $avg: '$finalAmount' },
        minOrder: { $min: '$finalAmount' },
        maxOrder: { $max: '$finalAmount' },
        statusCount: {
          $push: {
            status: '$status',
            count: 1,
            amount: '$finalAmount'
          }
        }
      }
    },
    {
      $unwind: '$statusCount'
    },
    {
      $group: {
        _id: '$statusCount.status',
        totalOrders: { $first: '$totalOrders' },
        totalSales: { $first: '$totalSales' },
        avgOrderValue: { $first: '$avgOrderValue' },
        minOrder: { $first: '$minOrder' },
        maxOrder: { $first: '$maxOrder' },
        count: { $sum: 1 },
        amount: { $sum: '$statusCount.amount' }
      }
    },
    {
      $project: {
        _id: 0,
        status: '$_id',
        count: 1,
        percentage: { $multiply: [{ $divide: [100, '$totalOrders'] }, '$count'] },
        amount: 1,
        amountPercentage: { $multiply: [{ $divide: [100, '$totalSales'] }, '$amount'] }
      }
    },
    {
      $sort: { status: 1 }
    }
  ]);

  // Calculate totals
  const totals = {
    totalOrders: stats.reduce((sum, stat) => sum + stat.count, 0),
    totalSales: stats.reduce((sum, stat) => sum + stat.amount, 0)
  };

  res.status(200).json({
    success: true,
    data: {
      stats,
      totals
    }
  });
});
