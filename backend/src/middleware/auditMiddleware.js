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
                    user: req.user ? req.user.userId : null,
                    userEmail: req.user ? req.user.email : 'system',
                    userRole: req.user ? req.user.role : 'system',
                    action: action,
                    entityType: resourceType,
                    entityId: req.params.id || null,
                    description: `${action} performed on ${resourceType}: ${req.params.id || 'N/A'}`,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    details: {
                        method: req.method,
                        url: req.originalUrl,
                        status: res.statusCode,
                        body: req.method !== 'GET' ? (() => {
                            try { return JSON.parse(JSON.stringify(req.body)); }
                            catch (e) { return { error: 'Parse failed' }; }
                        })() : undefined
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
