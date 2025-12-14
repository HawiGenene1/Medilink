const Order = require('../models/Order');
const FilterService = require('../services/filterService');

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
    const order = await Order.findById(id)
      .populate('customer', 'name email phone')
      .populate('pharmacy', 'name email phone address')
      .populate('deliveryPerson', 'name email phone')
      .populate('items.medicine', 'name price imageUrl')
      .exec();
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if user has permission to view this order
    if (req.user) {
      const isCustomer = req.user._id.toString() === order.customer._id.toString();
      const isPharmacy = req.user.pharmacyId && req.user.pharmacyId.toString() === order.pharmacy._id.toString();
      const isDeliveryPerson = req.user._id.toString() === order.deliveryPerson?._id.toString();
      const isAdmin = req.user.role === 'admin';
      
      if (!isCustomer && !isPharmacy && !isDeliveryPerson && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    return res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('getOrderById error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching order' });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  getOrderFilterOptions,
};
