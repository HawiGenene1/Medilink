const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');
const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const AuditLog = require('../models/AuditLog');
const PendingPharmacy = require('../models/PendingPharmacy');

// Get system overview statistics
const getSystemOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalPharmacies,
      activePharmacies,
      totalOrders,
      pendingOrders,
      totalMedicines,
      pendingPharmacies,
      blockedPharmacies
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Pharmacy.countDocuments(),
      Pharmacy.countDocuments({ isActive: true, isBlocked: false }),
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: ['pending', 'processing'] } }),
      Medicine.countDocuments(),
      PendingPharmacy.countDocuments({ status: 'pending' }),
      Pharmacy.countDocuments({ isBlocked: true })
    ]);

    // Get recent activity (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [recentOrders, recentRegistrations, recentLogins] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: yesterday } }),
      User.countDocuments({ createdAt: { $gte: yesterday } }),
      AuditLog.countDocuments({
        action: 'LOGIN',
        createdAt: { $gte: yesterday }
      })
    ]);

    // Get revenue stats
    const revenueStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          todayRevenue: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', yesterday] },
                '$totalAmount',
                0
              ]
            }
          }
        }
      }
    ]);

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday: recentRegistrations
      },
      pharmacies: {
        total: totalPharmacies,
        active: activePharmacies,
        pending: pendingPharmacies,
        blocked: blockedPharmacies
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        today: recentOrders
      },
      medicines: {
        total: totalMedicines
      },
      activity: {
        loginsToday: recentLogins
      },
      revenue: revenueStats[0] || { totalRevenue: 0, todayRevenue: 0 }
    };

    res.json({
      success: true,
      data: stats,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting system overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system overview'
    });
  }
};

const { getMetrics } = require('../middleware/monitoringMiddleware');

// Get detailed system health metrics
const getSystemHealth = async (req, res) => {
  try {
    const liveMetrics = getMetrics();

    const health = {
      database: {
        status: 'healthy',
        responseTime: Date.now()
      },
      services: {
        authentication: 'healthy',
        authorization: 'healthy',
        emailService: 'healthy'
      },
      performance: {
        ...liveMetrics,
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      }
    };

    // Check database connectivity
    try {
      await User.findOne().limit(1);
      health.database.status = 'healthy';
    } catch (dbError) {
      health.database.status = 'unhealthy';
      health.database.error = dbError.message;
    }

    res.json({
      success: true,
      data: health,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting system health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system health'
    });
  }
};

// Get user activity analytics
const getUserAnalytics = async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    let startDate;
    switch (period) {
      case '1d':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // User registration trends
    const registrationTrends = await User.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // User role distribution
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Active users (last 30 days)
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      data: {
        registrationTrends,
        roleDistribution,
        activeUsers,
        period
      }
    });
  } catch (error) {
    console.error('Error getting user analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user analytics'
    });
  }
};

// Get pharmacy analytics
const getPharmacyAnalytics = async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    let startDate;
    switch (period) {
      case '1d':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // Pharmacy registration trends
    const registrationTrends = await Pharmacy.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Pharmacy status distribution
    const statusDistribution = await Pharmacy.aggregate([
      {
        $group: {
          _id: {
            status: '$status',
            isBlocked: '$isBlocked',
            isActive: '$isActive'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Top performing pharmacies
    const topPharmacies = await Pharmacy.find({ isBlocked: false, isActive: true })
      .sort({ totalRevenue: -1 })
      .limit(10)
      .select('name totalOrders totalRevenue rating')
      .populate('owner', 'name email');

    res.json({
      success: true,
      data: {
        registrationTrends,
        statusDistribution,
        topPharmacies,
        period
      }
    });
  } catch (error) {
    console.error('Error getting pharmacy analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pharmacy analytics'
    });
  }
};

// Get order analytics
const getOrderAnalytics = async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    let startDate;
    switch (period) {
      case '1d':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // Order trends
    const orderTrends = await Order.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Order status distribution
    const statusDistribution = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Revenue trends
    const revenueTrends = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['completed', 'delivered'] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        orderTrends,
        statusDistribution,
        revenueTrends,
        period
      }
    });
  } catch (error) {
    console.error('Error getting order analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order analytics'
    });
  }
};

// Get recent audit logs
const getRecentAuditLogs = async (req, res) => {
  try {
    const { limit = 50, page = 1, action, entityType } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('user', 'name email role')
      .select('-details');

    const total = await AuditLog.countDocuments(filter);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get audit logs'
    });
  }
};

module.exports = {
  getSystemOverview,
  getSystemHealth,
  getUserAnalytics,
  getPharmacyAnalytics,
  getOrderAnalytics,
  getRecentAuditLogs
};
