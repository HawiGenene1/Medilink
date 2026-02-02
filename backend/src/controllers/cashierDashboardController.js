const Order = require('../models/Order');
const Refund = require('../models/Refund');
const CashierShift = require('../models/CashierShift');
const Medicine = require('../models/Medicine');

/**
 * @route   GET /api/cashier/stats/today
 * @desc    Get today's summary statistics
 * @access  Private (Cashier)
 */
exports.getTodayStats = async (req, res) => {
    try {
        const cashierId = req.user.userId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get current shift
        const currentShift = await CashierShift.findOne({
            cashier: cashierId,
            status: { $in: ['active', 'on_break'] }
        });

        // Today's transactions
        const todayTransactions = await Order.find({
            cashier: cashierId,
            createdAt: { $gte: today, $lt: tomorrow },
            paymentStatus: 'paid'
        });

        const totalSales = todayTransactions.reduce((sum, t) => sum + (t.finalAmount || 0), 0);
        const transactionCount = todayTransactions.length;

        // Pending payments
        const pendingPayments = await Order.countDocuments({
            cashier: cashierId,
            paymentStatus: 'pending',
            createdAt: { $gte: today, $lt: tomorrow }
        });

        // Today's refunds
        const todayRefunds = await Refund.find({
            initiatedAt: { $gte: today, $lt: tomorrow },
            initiatedBy: cashierId,
            status: 'completed'
        });

        const totalRefunds = todayRefunds.reduce((sum, r) => sum + (r.refundAmount || 0), 0);

        // Payment method breakdown
        const paymentMethodBreakdown = {};
        todayTransactions.forEach(t => {
            const method = t.paymentMethod || 'other';
            paymentMethodBreakdown[method] = (paymentMethodBreakdown[method] || 0) + (t.finalAmount || 0);
        });

        // Performance metrics
        const performanceMetrics = {
            averageTransactionValue: transactionCount > 0 ? totalSales / transactionCount : 0,
            transactionsPerHour: currentShift
                ? transactionCount / ((Date.now() - currentShift.startTime) / (1000 * 60 * 60))
                : 0,
            refundRate: transactionCount > 0 ? (todayRefunds.length / transactionCount) * 100 : 0
        };

        res.json({
            success: true,
            data: {
                totalSales,
                transactionCount,
                pendingPayments,
                totalRefunds,
                refundCount: todayRefunds.length,
                netAmount: totalSales - totalRefunds,
                paymentMethodBreakdown,
                performanceMetrics,
                currentShift: currentShift ? {
                    shiftNumber: currentShift.shiftNumber,
                    startTime: currentShift.startTime,
                    status: currentShift.status,
                    openingCash: currentShift.openingCash
                } : null
            }
        });
    } catch (error) {
        console.error('Get today stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get today\'s statistics',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/cashier/transactions/recent
 * @desc    Get recent transactions
 * @access  Private (Cashier)
 */
exports.getRecentTransactions = async (req, res) => {
    try {
        const cashierId = req.user.userId;
        const { limit = 10 } = req.query;

        const transactions = await Order.find({ cashier: cashierId })
            .populate('customer', 'firstName lastName email phone')
            .populate('items.medicine', 'name price')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: transactions
        });
    } catch (error) {
        console.error('Get recent transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get recent transactions',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/cashier/alerts
 * @desc    Get cashier alerts (low stock, expiring medicines, etc.)
 * @access  Private (Cashier)
 */
exports.getAlerts = async (req, res) => {
    try {
        const alerts = [];

        // Low stock alerts (stock < 10)
        const lowStockMedicines = await Medicine.find({ stock: { $lt: 10, $gt: 0 } })
            .select('name stock')
            .limit(10);

        lowStockMedicines.forEach(medicine => {
            alerts.push({
                type: 'low_stock',
                severity: medicine.stock < 5 ? 'high' : 'medium',
                message: `${medicine.name} is running low (${medicine.stock} units remaining)`,
                data: medicine
            });
        });

        // Out of stock
        const outOfStockMedicines = await Medicine.find({ stock: 0 })
            .select('name')
            .limit(10);

        outOfStockMedicines.forEach(medicine => {
            alerts.push({
                type: 'out_of_stock',
                severity: 'high',
                message: `${medicine.name} is out of stock`,
                data: medicine
            });
        });

        // Expiring soon (within 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const expiringSoon = await Medicine.find({
            expiryDate: {
                $gte: new Date(),
                $lte: thirtyDaysFromNow
            }
        }).select('name expiryDate stock').limit(10);

        expiringSoon.forEach(medicine => {
            const daysUntilExpiry = Math.floor((medicine.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
            alerts.push({
                type: 'expiring_soon',
                severity: daysUntilExpiry < 7 ? 'high' : 'medium',
                message: `${medicine.name} expires in ${daysUntilExpiry} days`,
                data: medicine
            });
        });

        // Pending refunds requiring approval
        const pendingRefunds = await Refund.countDocuments({
            status: 'pending',
            approvalRequired: true
        });

        if (pendingRefunds > 0) {
            alerts.push({
                type: 'pending_refunds',
                severity: 'medium',
                message: `${pendingRefunds} refund(s) pending approval`,
                count: pendingRefunds
            });
        }

        res.json({
            success: true,
            data: alerts
        });
    } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get alerts',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/cashier/performance
 * @desc    Get cashier performance metrics
 * @access  Private (Cashier)
 */
exports.getPerformance = async (req, res) => {
    try {
        const cashierId = req.user.userId;
        const { period = 'week' } = req.query; // day, week, month

        let startDate = new Date();

        if (period === 'day') {
            startDate.setHours(0, 0, 0, 0);
        } else if (period === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'month') {
            startDate.setMonth(startDate.getMonth() - 1);
        }

        // Get shifts in period
        const shifts = await CashierShift.find({
            cashier: cashierId,
            createdAt: { $gte: startDate },
            status: 'ended'
        });

        const totalShifts = shifts.length;
        const totalSales = shifts.reduce((sum, s) => sum + (s.totalSales || 0), 0);
        const totalTransactions = shifts.reduce((sum, s) => sum + (s.transactionCount || 0), 0);
        const totalRefunds = shifts.reduce((sum, s) => sum + (s.totalRefunds || 0), 0);

        // Calculate averages
        const avgSalesPerShift = totalShifts > 0 ? totalSales / totalShifts : 0;
        const avgTransactionsPerShift = totalShifts > 0 ? totalTransactions / totalShifts : 0;
        const avgTransactionValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;

        // Cash variance analysis
        const avgCashVariance = totalShifts > 0
            ? shifts.reduce((sum, s) => sum + Math.abs(s.cashVariance || 0), 0) / totalShifts
            : 0;

        res.json({
            success: true,
            data: {
                period,
                totalShifts,
                totalSales,
                totalTransactions,
                totalRefunds,
                netAmount: totalSales - totalRefunds,
                averages: {
                    salesPerShift: avgSalesPerShift,
                    transactionsPerShift: avgTransactionsPerShift,
                    transactionValue: avgTransactionValue,
                    cashVariance: avgCashVariance
                },
                refundRate: totalTransactions > 0 ? (totalRefunds / totalSales) * 100 : 0
            }
        });
    } catch (error) {
        console.error('Get performance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get performance metrics',
            error: error.message
        });
    }
};
