const DeliveryProfile = require('../models/DeliveryProfile');
const Order = require('../models/Order');
const logger = require('../utils/logger');
const { getIo } = require('../socket');
const mongoose = require('mongoose');

/**
 * @route   GET /api/delivery/nearby
 * @desc    Find nearby available drivers (Internal/Admin/System use)
 * @access  Private
 */
const findNearbyDrivers = async (req, res) => {
    try {
        const { latitude, longitude, radius = 5000 } = req.query; // radius in meters

        if (!latitude || !longitude) {
            return res.status(400).json({ success: false, message: 'Coordinates required' });
        }

        const drivers = await DeliveryProfile.find({
            isAvailable: true,
            status: 'approved', // Ensure only approved drivers
            currentLocation: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: parseInt(radius)
                }
            }
        }).populate('userId', 'firstName lastName phone');

        res.json({
            success: true,
            count: drivers.length,
            data: drivers
        });
    } catch (error) {
        logger.error('Error finding nearby drivers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to find drivers',
            error: error.message
        });
    }
};

/**
 * @route   POST /api/delivery/request
 * @desc    Request delivery for an order (Notify nearby drivers)
 * @access  Private (Pharmacy/Admin)
 */
const requestDelivery = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findById(orderId).populate('pharmacy');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Get pickup location (Pharmacy)
        // Assuming Pharmacy model has location.coordinates [lng, lat]
        const pickupLocation = order.pharmacy.location;

        if (!pickupLocation || !pickupLocation.coordinates) {
            return res.status(400).json({ success: false, message: 'Pharmacy location not set' });
        }

        // Find nearby drivers
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

        // Notify drivers via Socket.io
        const io = getIo();
        let notifiedCount = 0;

        drivers.forEach(driver => {
            io.to(driver.userId.toString()).emit('delivery_request', {
                orderId: order._id,
                pickup: {
                    name: order.pharmacy.name,
                    address: order.pharmacy.address
                },
                dropoff: order.address,
                items: order.items,
                totalAmount: order.totalAmount,
                earnings: order.serviceFee // Assuming service fee goes to driver?
            });
            notifiedCount++;
        });

        // Update order status potentially?
        // order.status = 'looking_for_driver';
        // await order.save();

        res.json({
            success: true,
            message: `Notified ${notifiedCount} drivers`,
            debug: { driversFound: drivers.length }
        });

    } catch (error) {
        logger.error('Error requesting delivery:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to request delivery',
            error: error.message
        });
    }
};

/**
 * @route   PUT /api/delivery/accept
 * @desc    Driver accepts an order
 * @access  Private (Delivery)
 */
const acceptOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        const driverId = req.user.userId || req.user.id;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.courier) {
            return res.status(400).json({ success: false, message: 'Order already accepted by another driver' });
        }

        // Assign driver
        order.courier = driverId;
        order.status = 'confirmed';
        order.statusHistory.push({
            status: 'confirmed',
            timestamp: new Date(),
            note: 'Order accepted by courier'
        });
        await order.save();

        // Mark driver as busy?
        // await DeliveryProfile.findOneAndUpdate({ userId: driverId }, { isAvailable: false });

        // Notify Customer and Pharmacy
        const io = getIo();
        io.to(`order_${orderId}`).emit('order_status_update', {
            status: 'confirmed',
            courier: driverId
            // Could send driver details here
        });

        res.json({
            success: true,
            message: 'Order accepted successfully',
            data: order
        });

    } catch (error) {
        logger.error('Error accepting order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to accept order',
            error: error.message
        });
    }
};

/**
 * @route   PUT /api/delivery/status
 * @desc    Update driver availability and location
 * @access  Private (Delivery)
 */
const updateDriverStatus = async (req, res) => {
    try {
        const { isAvailable, latitude, longitude } = req.body;
        const userId = req.user.userId || req.user.id;

        logger.info(`[UpdateDriverStatus] User ${userId} requested: isAvailable=${isAvailable}, Lat=${latitude}, Lon=${longitude}`);

        const updates = {};
        if (typeof isAvailable === 'boolean') updates.isAvailable = isAvailable;
        if (latitude && longitude) {
            updates.currentLocation = {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            };
        }

        let profile = await DeliveryProfile.findOneAndUpdate(
            { userId },
            updates,
            { new: true, upsert: false }
        );

        if (!profile) {
            logger.warn(`[UpdateDriverStatus] Profile not found for User ${userId}. Attempting auto-creation...`);

            // Verify user exists and has delivery role
            const user = await User.findById(userId);
            if (!user) {
                logger.error(`[UpdateDriverStatus] FAILED: User ${userId} not found in DB.`);
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            if (user.role !== 'delivery') {
                logger.error(`[UpdateDriverStatus] FAILED: User ${userId} is not a delivery driver (Role: ${user.role}).`);
                return res.status(403).json({ success: false, message: 'Only delivery personnel can update status' });
            }

            // Create profile with default 'approved' status for testing ease as per plan
            profile = new DeliveryProfile({
                userId,
                isAvailable: updates.isAvailable || false,
                currentLocation: updates.currentLocation,
                onboardingStatus: 'approved', // Auto-approve for testing convenience
                personalDetails: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone
                }
            });
            await profile.save();
            logger.info(`[UpdateDriverStatus] AUTO-CREATED profile for User ${userId} with status 'approved'.`);
        } else {
            logger.info(`[UpdateDriverStatus] SUCCESS for User ${userId}. Profile: Status=${profile.onboardingStatus}, isAvailable=${profile.isAvailable}, Location=${JSON.stringify(profile.currentLocation?.coordinates)}`);
        }

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Delivery profile not found. Please contact support.'
            });
        }

        res.json({
            success: true,
            data: profile
        });

    } catch (error) {
        logger.error('Error updating driver status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update status',
            error: error.message
        });
    }
};

/**
 * @route   PUT /api/delivery/pickup
 * @desc    Start delivery (Pickup order)
 * @access  Private (Delivery)
 */
const startDelivery = async (req, res) => {
    try {
        const { orderId } = req.body;
        const driverId = req.user.userId || req.user.id; // Verify authorization matches driver (optional but good)

        const order = await Order.findOneAndUpdate(
            { _id: orderId, courier: driverId },
            {
                $set: { status: 'in_transit' },
                $push: {
                    statusHistory: {
                        status: 'in_transit',
                        timestamp: new Date(),
                        note: 'Driver picked up order'
                    }
                }
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found or not assigned to you' });
        }

        const io = getIo();
        io.to(`order_${orderId}`).emit('order_status_update', { status: 'in_transit' });

        res.json({ success: true, message: 'Delivery started', data: order });
    } catch (error) {
        logger.error('Error starting delivery:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @route   PUT /api/delivery/complete
 * @desc    Complete delivery
 * @access  Private (Delivery)
 */
const completeDelivery = async (req, res) => {
    try {
        const { orderId } = req.body;
        const driverId = req.user.userId || req.user.id;

        // Fetch order first to get serviceFee
        const existingOrder = await Order.findOne({ _id: orderId, courier: driverId });
        if (!existingOrder) {
            return res.status(404).json({ success: false, message: 'Order not found or not assigned to you' });
        }

        const order = await Order.findOneAndUpdate(
            { _id: orderId, courier: driverId },
            {
                status: 'delivered',
                actualArrivalTime: new Date(),
                paymentStatus: 'paid',
                courierEarnings: existingOrder.serviceFee || 50,
                $push: { statusHistory: { status: 'delivered', timestamp: new Date(), note: 'Order delivered' } }
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found or not assigned to you' });
        }

        const io = getIo();
        io.to(`order_${orderId}`).emit('order_status_update', { status: 'delivered' });

        // Update driver availability
        await DeliveryProfile.findOneAndUpdate({ userId: driverId }, { isAvailable: true });

        res.json({ success: true, message: 'Delivery completed', data: order });
    } catch (error) {
        logger.error('Error completing delivery:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @route   GET /api/delivery/active
 * @desc    Get active deliveries for driver
 * @access  Private (Delivery)
 */
const getActiveDeliveries = async (req, res) => {
    try {
        const driverId = req.user.userId || req.user.id;
        const tasks = await Order.find({
            courier: driverId,
            status: { $in: ['confirmed', 'preparing', 'ready', 'in_transit'] }
        })
            .populate('customer', 'firstName lastName phone address')
            .populate('pharmacy', 'name address phone location')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: tasks.length, data: tasks });
    } catch (error) {
        logger.error('Error fetching active deliveries:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @route   GET /api/delivery/history
 * @desc    Get delivery history
 * @access  Private (Delivery)
 */
const getDeliveryHistory = async (req, res) => {
    try {
        const driverId = req.user.userId || req.user.id;

        logger.info(`[GetDeliveryHistory] Fetching history for Driver: ${driverId}`);

        const history = await Order.find({
            courier: driverId,
            status: { $in: ['delivered', 'cancelled', 'refunded'] }
        })
            .populate('customer', 'firstName lastName')
            .populate('pharmacy', 'name address')
            .sort({ updatedAt: -1 })
            .limit(50);

        logger.info(`[GetDeliveryHistory] Found ${history.length} past orders.`);

        res.json({ success: true, count: history.length, data: history });
    } catch (error) {
        logger.error('Error fetching delivery history:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @route   GET /api/delivery/earnings
 * @desc    Get earnings statistics
 * @access  Private (Delivery)
 */
const getEarningsStats = async (req, res) => {
    try {
        const driverId = req.user.userId || req.user.id;

        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const stats = await Order.aggregate([
            { $match: { courier: new mongoose.Types.ObjectId(driverId), status: 'delivered' } },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: '$courierEarnings' },
                    totalDeliveries: { $sum: 1 },
                    todayEarnings: {
                        $sum: {
                            $cond: [{ $gte: ['$actualArrivalTime', startOfDay] }, '$courierEarnings', 0]
                        }
                    },
                    thisWeekEarnings: {
                        $sum: {
                            $cond: [{ $gte: ['$actualArrivalTime', startOfWeek] }, '$courierEarnings', 0]
                        }
                    }
                }
            }
        ]);

        const totalEarnings = stats.length > 0 ? stats[0].totalEarnings : 0;
        const completedDeliveries = stats.length > 0 ? stats[0].completedDeliveries : 0;

        // Get recent transactions (mocking simpler list for now, or reuse history)
        const recentTransactions = await Order.find({
            courier: driverId,
            status: 'delivered'
        })
            .select('orderNumber serviceFee actualArrivalTime')
            .sort({ actualArrivalTime: -1 })
            .limit(10);

        const formattedTransactions = recentTransactions.map(t => ({
            id: t._id,
            date: t.actualArrivalTime ? t.actualArrivalTime.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            amount: t.courierEarnings || t.serviceFee,
            status: 'Completed'
        }));

        res.json({
            success: true,
            data: {
                totalEarnings,
                pendingPayout: 0, // Placeholder
                completedDeliveries,
                recentTransactions: formattedTransactions
            }
        });
    } catch (error) {
        logger.error('Error fetching earnings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getAvailableRequests = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        logger.info(`[GetAvailableRequests] Driver ${userId} fetching available jobs...`);

        // Find all orders in 'pending' status that don't have a courier yet
        // We check for both field not existing AND field being null
        const orders = await Order.find({
            status: 'pending',
            $or: [
                { courier: { $exists: false } },
                { courier: null }
            ]
        })
            .populate('pharmacy', 'name address location phone')
            .sort({ createdAt: -1 })
            .limit(20);

        logger.info(`[GetAvailableRequests] Found ${orders.length} pending orders.`);
        if (orders.length > 0) {
            logger.info(`[GetAvailableRequests] Sample Order: ${orders[0].orderNumber}, Pharmacy: ${orders[0].pharmacy?.name}`);
        }

        res.json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        logger.error('[GetAvailableRequests] error:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching requests' });
    }
};

/**
 * @route   GET /api/delivery/profile
 * @desc    Get delivery profile
 * @access  Private (Delivery)
 */
const getDeliveryProfile = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        let profile = await DeliveryProfile.findOne({ userId });

        if (!profile) {
            // Auto-create if missing (same logic as updateDriverStatus for robustness)
            const getIo = require('../socket').getIo;
            const User = require('../models/User'); // Ensure User model is available

            const user = await User.findById(userId);
            if (user && user.role === 'delivery') {
                profile = new DeliveryProfile({
                    userId,
                    onboardingStatus: 'approved',
                    personalDetails: {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        phone: user.phone
                    },
                    vehicleDetails: {
                        type: 'motorcycle',
                        make: 'Yamaha',
                        model: 'R15',
                        year: '2022',
                        color: 'Blue',
                        licensePlate: 'ADD-1234'
                    }
                });
                await profile.save();
            }
        }

        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }

        res.json({ success: true, data: profile });
    } catch (error) {
        logger.error('Error fetching delivery profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    findNearbyDrivers,
    requestDelivery,
    acceptOrder,
    updateDriverStatus,
    startDelivery,
    completeDelivery,
    getActiveDeliveries,
    getDeliveryHistory,
    getEarningsStats,
    getEarningsStats,
    getAvailableRequests,
    getDeliveryProfile
};
