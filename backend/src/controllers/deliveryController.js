const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * @route   PATCH /api/delivery/location
 * @desc    Update delivery person's current location
 * @access  Private (Delivery)
 */
const updateLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            {
                currentLocation: {
                    latitude,
                    longitude,
                    lastUpdated: new Date()
                }
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.json({
            success: true,
            message: 'Location updated successfully',
            data: {
                latitude: user.currentLocation.latitude,
                longitude: user.currentLocation.longitude,
                lastUpdated: user.currentLocation.lastUpdated
            }
        });

    } catch (error) {
        logger.error('Failed to update location:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update location',
            error: error.message
        });
    }
};

module.exports = {
    updateLocation
};
