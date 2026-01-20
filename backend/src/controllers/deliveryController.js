const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get delivery assignments for delivery person
// @route   GET /api/delivery/assignments
// @access   Private (delivery)
exports.getDeliveries = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let query = { deliveryPerson: req.user.userId };
    if (status) {
      query.status = status;
    }

    const deliveries = await Delivery.find(query)
      .populate('order', 'orderNumber items totalAmount')
      .populate('customer', 'firstName lastName phone email')
      .populate('pharmacy', 'name address phone')
      .sort({ assignedAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Delivery.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        deliveries,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching deliveries',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update delivery status
// @route   PATCH /api/delivery/:id/status
// @access   Private (delivery)
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { status, note, location, coordinates, issues } = req.body;
    const deliveryId = req.params.id;

    const delivery = await Delivery.findById(deliveryId);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // Check if this delivery belongs to the current user
    if (delivery.deliveryPerson.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this delivery'
      });
    }

    // Validate status transitions
    const validTransitions = {
      'assigned': ['picked_up', 'cancelled'],
      'picked_up': ['on_the_way', 'cancelled'],
      'on_the_way': ['nearby', 'cancelled'],
      'nearby': ['delivered', 'cancelled'],
      'delivered': [],
      'cancelled': ['assigned'],
      'failed': ['assigned']
    };

    if (!validTransitions[delivery.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${delivery.status} to ${status}`
      });
    }

    // Update delivery status
    const previousStatus = delivery.status;
    delivery.status = status;

    // Update timestamps based on status
    const now = new Date();
    switch (status) {
      case 'picked_up':
        delivery.pickupTime = now;
        delivery.startedAt = now;
        break;
      case 'delivered':
        delivery.actualDeliveryTime = now;
        delivery.completedAt = now;
        break;
      case 'cancelled':
        delivery.cancelledAt = now;
        break;
    }

    // Add tracking history
    delivery.trackingHistory.push({
      status,
      timestamp: now,
      location: location || '',
      coordinates: coordinates || [],
      note: note || '',
      updatedBy: req.user.userId
    });

    // Update current location if provided
    if (coordinates && coordinates.length === 2) {
      delivery.currentLocation = {
        type: 'Point',
        coordinates
      };
      delivery.lastLocationUpdate = now;
    }

    // Handle issues
    if (issues && Array.isArray(issues)) {
      issues.forEach(issue => {
        delivery.issues.push({
          type: issue.type,
          description: issue.description,
          occurredAt: now
        });
      });
    }

    await delivery.save();

    // Create notification for customer
    await Notification.create({
      user: delivery.customer,
      type: 'delivery_update',
      title: `Delivery ${status.replace('_', ' ')}`,
      message: `Your delivery #${delivery.order} has been ${status.replace('_', ' ')}`,
      relatedId: delivery._id,
      relatedModel: 'Delivery'
    });

    // Update order status if delivery is completed
    if (status === 'delivered') {
      await Order.findByIdAndUpdate(delivery.order, {
        status: 'delivered',
        actualDeliveryTime: now,
        deliveryPerson: delivery.deliveryPerson
      });
    }

    res.status(200).json({
      success: true,
      message: 'Delivery status updated successfully',
      data: delivery
    });

  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating delivery status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update delivery location (real-time tracking)
// @route   POST /api/delivery/:id/location
// @access   Private (delivery)
exports.updateLocation = async (req, res) => {
  try {
    const { coordinates, address } = req.body;
    const deliveryId = req.params.id;

    if (!coordinates || coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Valid coordinates [longitude, latitude] are required'
      });
    }

    const delivery = await Delivery.findById(deliveryId);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // Check authorization
    if (delivery.deliveryPerson.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this delivery'
      });
    }

    // Update location
    delivery.currentLocation = {
      type: 'Point',
      coordinates
    };
    delivery.lastLocationUpdate = new Date();

    // Calculate distance and time estimates (simplified)
    if (delivery.pickupAddress.coordinates && delivery.deliveryAddress.coordinates) {
      // This would normally use a proper distance calculation service
      const pickupCoords = delivery.pickupAddress.coordinates;
      const deliveryCoords = delivery.deliveryAddress.coordinates;
      
      // Simple distance calculation (would use proper geospatial queries in production)
      const distanceToPickup = calculateDistance(
        coordinates[1], coordinates[0],
        pickupCoords.latitude, pickupCoords.longitude
      );
      
      const distanceToDelivery = calculateDistance(
        coordinates[1], coordinates[0],
        deliveryCoords.latitude, deliveryCoords.longitude
      );

      delivery.distance.remaining = distanceToDelivery;
      delivery.distance.traveled = delivery.distance.total - distanceToDelivery;
    }

    await delivery.save();

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: {
        currentLocation: delivery.currentLocation,
        lastLocationUpdate: delivery.lastLocationUpdate,
        distance: delivery.distance
      }
    });

  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get delivery tracking info
// @route   GET /api/delivery/:id/tracking
// @access   Private (customer, delivery, admin)
exports.getTrackingInfo = async (req, res) => {
  try {
    const deliveryId = req.params.id;
    const delivery = await Delivery.findById(deliveryId)
      .populate('deliveryPerson', 'firstName lastName phone vehicleInfo')
      .populate('order', 'orderNumber totalAmount')
      .populate('customer', 'firstName lastName')
      .populate('pharmacy', 'name address phone');

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // Check authorization
    const isCustomer = delivery.customer._id.toString() === req.user.userId.toString();
    const isDeliveryPerson = delivery.deliveryPerson._id.toString() === req.user.userId.toString();
    const isAdmin = ['admin', 'pharmacy_admin'].includes(req.user.role);

    if (!isCustomer && !isDeliveryPerson && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this delivery'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        delivery,
        trackingHistory: delivery.trackingHistory.sort((a, b) => b.timestamp - a.timestamp),
        currentStatus: delivery.status,
        estimatedDeliveryTime: delivery.estimatedDeliveryTime,
        currentLocation: delivery.currentLocation,
        distance: delivery.distance,
        estimatedTime: delivery.estimatedTime
      }
    });

  } catch (error) {
    console.error('Error getting tracking info:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tracking info',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get delivery statistics for delivery person
// @route   GET /api/delivery/stats
// @access   Private (delivery)
exports.getDeliveryStats = async (req, res) => {
  try {
    const deliveryPersonId = req.user.userId;
    
    const stats = await Delivery.aggregate([
      { $match: { deliveryPerson: deliveryPersonId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const todayStats = await Delivery.aggregate([
      {
        $match: {
          deliveryPerson: deliveryPersonId,
          assignedAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const monthlyStats = await Delivery.aggregate([
      {
        $match: {
          deliveryPerson: deliveryPersonId,
          assignedAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        allTime: stats,
        today: todayStats,
        monthly: monthlyStats
      }
    });

  } catch (error) {
    console.error('Error getting delivery stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Add delivery note
// @route   POST /api/delivery/:id/notes
// @access   Private (delivery)
exports.addDeliveryNote = async (req, res) => {
  try {
    const { note, location, coordinates } = req.body;
    const deliveryId = req.params.id;

    const delivery = await Delivery.findById(deliveryId);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // Check authorization
    if (delivery.deliveryPerson.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add notes to this delivery'
      });
    }

    delivery.deliveryNotes.push({
      note,
      addedBy: req.user.userId,
      addedAt: new Date(),
      location: location || '',
      coordinates: coordinates || [],
      status: delivery.status
    });

    await delivery.save();

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: delivery.deliveryNotes[delivery.deliveryNotes.length - 1]
    });

  } catch (error) {
    console.error('Error adding delivery note:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding delivery note',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to calculate distance between two points (simplified)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}
