const Inventory = require('../models/Inventory');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

/**
 * Inventory Alert Service
 * Handles detection and notification of inventory alerts
 */

/**
 * Get all inventory alerts for a pharmacy
 * @param {String} pharmacyId - Pharmacy ID
 * @returns {Object} Alert summary with categorized items
 */
exports.getInventoryAlerts = async (pharmacyId) => {
    try {
        const inventory = await Inventory.find({ pharmacy: pharmacyId, isActive: true })
            .populate('medicine', 'name genericName brand');

        const alerts = {
            expired: [],
            nearExpiry: [],
            lowStock: [],
            outOfStock: []
        };

        inventory.forEach(item => {
            // Check if expired
            if (item.isExpired) {
                alerts.expired.push({
                    ...item,
                    alertType: 'expired',
                    severity: 'critical'
                });
            }
            // Check if near expiry (and not already expired)
            else if (item.isNearExpiry) {
                alerts.nearExpiry.push({
                    ...item,
                    alertType: 'near_expiry',
                    severity: 'warning',
                    daysRemaining: item.daysToExpiry
                });
            }

            // Check stock levels
            if (item.quantity === 0) {
                alerts.outOfStock.push({
                    ...item,
                    alertType: 'out_of_stock',
                    severity: 'critical'
                });
            } else if (item.isLowStock) {
                alerts.lowStock.push({
                    ...item,
                    alertType: 'low_stock',
                    severity: 'warning'
                });
            }
        });

        return {
            success: true,
            summary: {
                totalAlerts: alerts.expired.length + alerts.nearExpiry.length +
                    alerts.lowStock.length + alerts.outOfStock.length,
                expiredCount: alerts.expired.length,
                nearExpiryCount: alerts.nearExpiry.length,
                lowStockCount: alerts.lowStock.length,
                outOfStockCount: alerts.outOfStock.length
            },
            alerts
        };
    } catch (error) {
        logger.error('Error getting inventory alerts:', error);
        throw error;
    }
};

/**
 * Check inventory and generate notifications for alerts
 * @param {String} pharmacyId - Pharmacy ID
 * @returns {Object} Result with notification counts
 */
exports.checkAndNotifyAlerts = async (pharmacyId) => {
    try {
        const inventory = await Inventory.find({ pharmacy: pharmacyId, isActive: true })
            .populate('medicine', 'name genericName brand');

        let notificationsCreated = 0;
        const notifications = [];

        for (const item of inventory) {
            const medicineName = item.medicine?.name || 'Unknown Medicine';

            // Check for expired medicines
            if (item.isExpired) {
                const exists = await checkNotificationExists(
                    pharmacyId,
                    'expired_medicine',
                    item._id
                );

                if (!exists) {
                    notifications.push({
                        title: 'Expired Medicine Alert',
                        message: `${medicineName} has expired (Expiry: ${new Date(item.expiryDate).toLocaleDateString()})`,
                        pharmacyId: pharmacyId,
                        roleTarget: 'OWNER',
                        type: 'expired_medicine',
                        metadata: {
                            inventoryId: item._id,
                            medicineId: item.medicine?._id,
                            medicineName: medicineName,
                            expiryDate: item.expiryDate,
                            quantity: item.quantity
                        }
                    });

                    notifications.push({
                        title: 'Expired Medicine Alert',
                        message: `${medicineName} has expired (Expiry: ${new Date(item.expiryDate).toLocaleDateString()})`,
                        pharmacyId: pharmacyId,
                        roleTarget: 'STAFF',
                        type: 'expired_medicine',
                        metadata: {
                            inventoryId: item._id,
                            medicineId: item.medicine?._id,
                            medicineName: medicineName,
                            expiryDate: item.expiryDate,
                            quantity: item.quantity
                        }
                    });
                }
            }

            // Check for near expiry medicines
            if (item.isNearExpiry && !item.isExpired) {
                const exists = await checkNotificationExists(
                    pharmacyId,
                    'near_expiry',
                    item._id
                );

                if (!exists) {
                    notifications.push({
                        title: 'Near Expiry Alert',
                        message: `${medicineName} will expire in ${item.daysToExpiry} days`,
                        pharmacyId: pharmacyId,
                        roleTarget: 'OWNER',
                        type: 'near_expiry',
                        metadata: {
                            inventoryId: item._id,
                            medicineId: item.medicine?._id,
                            medicineName: medicineName,
                            expiryDate: item.expiryDate,
                            daysToExpiry: item.daysToExpiry
                        }
                    });
                }
            }

            // Check for low stock (already handled in inventoryController, but include here for completeness)
            if (item.isLowStock && item.quantity > 0) {
                const exists = await checkNotificationExists(
                    pharmacyId,
                    'low_stock',
                    item._id
                );

                if (!exists) {
                    notifications.push({
                        title: 'Low Stock Alert',
                        message: `${medicineName} stock is low (${item.quantity} units remaining, reorder level: ${item.reorderLevel})`,
                        pharmacyId: pharmacyId,
                        roleTarget: 'OWNER',
                        type: 'low_stock',
                        metadata: {
                            inventoryId: item._id,
                            medicineId: item.medicine?._id,
                            medicineName: medicineName,
                            currentQuantity: item.quantity,
                            reorderLevel: item.reorderLevel
                        }
                    });

                    notifications.push({
                        title: 'Low Stock Alert',
                        message: `${medicineName} stock is low (${item.quantity} units remaining, reorder level: ${item.reorderLevel})`,
                        pharmacyId: pharmacyId,
                        roleTarget: 'STAFF',
                        type: 'low_stock',
                        metadata: {
                            inventoryId: item._id,
                            medicineId: item.medicine?._id,
                            medicineName: medicineName,
                            currentQuantity: item.quantity,
                            reorderLevel: item.reorderLevel
                        }
                    });
                }
            }

            // Check for out of stock
            if (item.quantity === 0) {
                const exists = await checkNotificationExists(
                    pharmacyId,
                    'out_of_stock',
                    item._id
                );

                if (!exists) {
                    notifications.push({
                        title: 'Out of Stock Alert',
                        message: `${medicineName} is out of stock`,
                        pharmacyId: pharmacyId,
                        roleTarget: 'OWNER',
                        type: 'out_of_stock',
                        metadata: {
                            inventoryId: item._id,
                            medicineId: item.medicine?._id,
                            medicineName: medicineName
                        }
                    });

                    notifications.push({
                        title: 'Out of Stock Alert',
                        message: `${medicineName} is out of stock`,
                        pharmacyId: pharmacyId,
                        roleTarget: 'STAFF',
                        type: 'out_of_stock',
                        metadata: {
                            inventoryId: item._id,
                            medicineId: item.medicine?._id,
                            medicineName: medicineName
                        }
                    });
                }
            }
        }

        // Create all notifications in batch
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
            notificationsCreated = notifications.length;
            logger.info(`Created ${notificationsCreated} inventory alert notifications for pharmacy ${pharmacyId}`);
        }

        return {
            success: true,
            notificationsCreated,
            itemsChecked: inventory.length
        };
    } catch (error) {
        logger.error('Error checking and notifying alerts:', error);
        throw error;
    }
};

/**
 * Check if a similar notification already exists (within last 24 hours)
 * @param {String} pharmacyId - Pharmacy ID
 * @param {String} type - Notification type
 * @param {String} inventoryId - Inventory item ID
 * @returns {Boolean} True if notification exists
 */
async function checkNotificationExists(pharmacyId, type, inventoryId) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const existing = await Notification.findOne({
        pharmacyId: pharmacyId,
        type: type,
        'metadata.inventoryId': inventoryId,
        createdAt: { $gte: oneDayAgo }
    });

    return !!existing;
}

/**
 * Check alerts for all pharmacies (for scheduled job)
 * @returns {Object} Summary of notifications created
 */
exports.checkAllPharmaciesAlerts = async () => {
    try {
        // Get all unique pharmacy IDs from inventory
        const pharmacies = await Inventory.distinct('pharmacy');

        let totalNotifications = 0;
        const results = [];

        for (const pharmacyId of pharmacies) {
            try {
                const result = await exports.checkAndNotifyAlerts(pharmacyId);
                totalNotifications += result.notificationsCreated;
                results.push({
                    pharmacyId,
                    ...result
                });
            } catch (error) {
                logger.error(`Error checking alerts for pharmacy ${pharmacyId}:`, error);
            }
        }

        logger.info(`Alert check complete. Created ${totalNotifications} notifications across ${pharmacies.length} pharmacies`);

        return {
            success: true,
            pharmaciesChecked: pharmacies.length,
            totalNotifications,
            results
        };
    } catch (error) {
        logger.error('Error checking all pharmacies alerts:', error);
        throw error;
    }
};
