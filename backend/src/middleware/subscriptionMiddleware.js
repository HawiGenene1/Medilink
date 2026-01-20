const Subscription = require('../models/Subscription');
const Pharmacy = require('../models/Pharmacy');

/**
 * Middleware to check if the pharmacy has an active subscription.
 * Assumes that 'authenticate' middleware has already run and populated req.user.
 */
const checkSubscription = async (req, res, next) => {
    try {
        // 1. Ensure user is authenticated and has a pharmacyId
        if (!req.user || !req.user.pharmacyId) {
            // If user isn't associated with a pharmacy (e.g. platform admin or customer), 
            // this check might not apply, or they shouldn't be here.
            // For now, if they are admin, bypass.
            if (req.user.role === 'admin') {
                return next();
            }
            return res.status(403).json({
                success: false,
                message: 'Access denied. No pharmacy associated with this user.'
            });
        }

        const pharmacyId = req.user.pharmacyId;

        // 2. Fetch the active subscription for the pharmacy
        const subscription = await Subscription.findOne({
            pharmacy: pharmacyId,
            status: 'active'
        }).sort({ endDate: -1 }); // Get the latest one if multiple exist (though ideally only one active)

        // 3. Validation Logic
        if (!subscription) {
            return res.status(403).json({
                success: false,
                message: 'No active subscription found. Please subscribe to continue using the platform.'
            });
        }

        // Check if manually deactivated
        if (!subscription.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your subscription has been deactivated. Please contact support.'
            });
        }

        // Check Expiry Date
        const now = new Date();
        if (subscription.endDate < now) {
            return res.status(403).json({
                success: false,
                message: `Your subscription expired on ${subscription.endDate.toLocaleDateString()}. Please renew to access these features.`,
                error: 'SUBSCRIPTION_EXPIRED'
            });
        }

        // 4. Attach subscription to request for downstream use if needed
        req.subscription = subscription;
        next();

    } catch (error) {
        console.error('Subscription check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error checking subscription status'
        });
    }
};

module.exports = { checkSubscription };
