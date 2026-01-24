const CashierShift = require('../models/CashierShift');
const Order = require('../models/Order');
const Refund = require('../models/Refund');
const CashDrawer = require('../models/CashDrawer');

/**
 * @route   POST /api/cashier/shift/start
 * @desc    Start a new cashier shift
 * @access  Private (Cashier)
 */
exports.startShift = async (req, res) => {
    try {
        const { openingCash } = req.body;
        const cashierId = req.user.userId;

        // Check if cashier already has an active shift
        const activeShift = await CashierShift.findOne({
            cashier: cashierId,
            status: { $in: ['active', 'on_break'] }
        });

        if (activeShift) {
            return res.status(400).json({
                success: false,
                message: 'You already have an active shift. Please end it first.'
            });
        }

        // Create new shift
        const shift = new CashierShift({
            cashier: cashierId,
            openingCash: openingCash || 0,
            status: 'active'
        });

        await shift.save();

        // Create associated cash drawer
        const cashDrawer = new CashDrawer({
            shift: shift._id,
            cashier: cashierId,
            currentCash: openingCash || 0
        });

        cashDrawer.open(cashierId, 'Shift started', cashierId);
        await cashDrawer.save();

        res.status(201).json({
            success: true,
            message: 'Shift started successfully',
            data: shift
        });
    } catch (error) {
        console.error('Start shift error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start shift',
            error: error.message
        });
    }
};

/**
 * @route   POST /api/cashier/shift/break
 * @desc    Take a break during shift
 * @access  Private (Cashier)
 */
exports.takeBreak = async (req, res) => {
    try {
        const cashierId = req.user.userId;

        const shift = await CashierShift.findOne({
            cashier: cashierId,
            status: 'active'
        });

        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'No active shift found'
            });
        }

        shift.status = 'on_break';
        shift.breakStartTime = new Date();
        await shift.save();

        res.json({
            success: true,
            message: 'Break started',
            data: shift
        });
    } catch (error) {
        console.error('Take break error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to take break',
            error: error.message
        });
    }
};

/**
 * @route   POST /api/cashier/shift/resume
 * @desc    Resume from break
 * @access  Private (Cashier)
 */
exports.resumeShift = async (req, res) => {
    try {
        const cashierId = req.user.userId;

        const shift = await CashierShift.findOne({
            cashier: cashierId,
            status: 'on_break'
        });

        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'No active break found'
            });
        }

        shift.status = 'active';
        shift.breakEndTime = new Date();

        // Calculate break duration
        if (shift.breakStartTime) {
            const breakDuration = (shift.breakEndTime - shift.breakStartTime) / (1000 * 60); // in minutes
            shift.totalBreakDuration += breakDuration;
        }

        await shift.save();

        res.json({
            success: true,
            message: 'Resumed from break',
            data: shift
        });
    } catch (error) {
        console.error('Resume shift error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resume shift',
            error: error.message
        });
    }
};

/**
 * @route   POST /api/cashier/shift/end
 * @desc    End shift with reconciliation
 * @access  Private (Cashier)
 */
exports.endShift = async (req, res) => {
    try {
        const { closingCash, notes } = req.body;
        const cashierId = req.user.userId;

        const shift = await CashierShift.findOne({
            cashier: cashierId,
            status: { $in: ['active', 'on_break'] }
        });

        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'No active shift found'
            });
        }

        // Calculate shift totals from transactions
        const shiftTransactions = await Order.find({
            cashier: cashierId,
            createdAt: { $gte: shift.startTime }
        });

        let totalSales = 0;
        let transactionCount = 0;
        const paymentBreakdown = {
            cash: 0,
            chapa: 0,
            telebirr: 0,
            cbe_birr: 0,
            card: 0,
            other: 0
        };

        shiftTransactions.forEach(transaction => {
            if (transaction.paymentStatus === 'paid') {
                totalSales += transaction.finalAmount || 0;
                transactionCount++;

                const method = transaction.paymentMethod?.toLowerCase() || 'other';
                if (paymentBreakdown.hasOwnProperty(method)) {
                    paymentBreakdown[method] += transaction.finalAmount || 0;
                } else {
                    paymentBreakdown.other += transaction.finalAmount || 0;
                }
            }
        });

        // Calculate refunds during shift
        const shiftRefunds = await Refund.find({
            shift: shift._id,
            status: 'completed'
        });

        const totalRefunds = shiftRefunds.reduce((sum, refund) => sum + (refund.refundAmount || 0), 0);

        // Update shift
        shift.endTime = new Date();
        shift.closingCash = closingCash;
        shift.totalSales = totalSales;
        shift.totalRefunds = totalRefunds;
        shift.transactionCount = transactionCount;
        shift.paymentMethodBreakdown = paymentBreakdown;
        shift.notes = notes;
        shift.status = 'ended';
        shift.closedBy = cashierId;

        await shift.save();

        // Close cash drawer
        const cashDrawer = await CashDrawer.findOne({ shift: shift._id });
        if (cashDrawer) {
            cashDrawer.close(cashierId);
            await cashDrawer.save();
        }

        res.json({
            success: true,
            message: 'Shift ended successfully',
            data: shift
        });
    } catch (error) {
        console.error('End shift error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to end shift',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/cashier/shift/current
 * @desc    Get current active shift
 * @access  Private (Cashier)
 */
exports.getCurrentShift = async (req, res) => {
    try {
        const cashierId = req.user.userId;

        const shift = await CashierShift.findOne({
            cashier: cashierId,
            status: { $in: ['active', 'on_break'] }
        }).populate('cashier', 'firstName lastName email');

        if (!shift) {
            return res.json({
                success: true,
                message: 'No active shift',
                data: null
            });
        }

        res.json({
            success: true,
            data: shift
        });
    } catch (error) {
        console.error('Get current shift error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get current shift',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/cashier/shift/history
 * @desc    Get shift history
 * @access  Private (Cashier)
 */
exports.getShiftHistory = async (req, res) => {
    try {
        const cashierId = req.user.userId;
        const { page = 1, limit = 10, startDate, endDate } = req.query;

        const query = { cashier: cashierId };

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const shifts = await CashierShift.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('cashier', 'firstName lastName');

        const count = await CashierShift.countDocuments(query);

        res.json({
            success: true,
            data: shifts,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get shift history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get shift history',
            error: error.message
        });
    }
};
