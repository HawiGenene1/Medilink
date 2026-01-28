const AuditLog = require('../models/AuditLog');

/**
 * Middleware to log admin actions
 * This is a helper to wrap controllers or used ad-hoc in routes
 */
const logAdminAction = (action, resourceType) => {
    return async (req, res, next) => {
        const originalSend = res.send;

        res.send = function (data) {
            // Only log successful actions that modify state
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const logEntry = new AuditLog({
                    actor: req.user ? req.user._id : null,
                    action: action,
                    resourceType: resourceType,
                    resourceId: req.params.id || null,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    details: {
                        method: req.method,
                        url: req.originalUrl,
                        status: res.statusCode,
                        // Avoid logging sensitive data or large bodies
                        body: req.method !== 'GET' ? JSON.parse(JSON.stringify(req.body)) : undefined
                    }
                });

                logEntry.save().catch(err => console.error('Audit Log Error:', err));
            }

            originalSend.apply(res, arguments);
        };

        next();
    };
};

module.exports = { logAdminAction };
