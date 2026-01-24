const Refund = require('../models/Refund');
const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const CashierShift = require('../models/CashierShift');

/**
 * @route   POST /api/cashier/refund/check-eligibility
 * @desc    Check if a transaction is eligible for refund
 * @access  Private (Cashier)
 */
exports.checkRefundEligibility = async (req, res) => {
    try {
        const { transactionId } = req.body;

        const transaction = await Order.findById(transactionId).populate('items.medicine');

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // Check refund period (7 days default)
        const refundPeriodDays = 7;
        const transactionDate = new Date(transaction.createdAt);
        const currentDate = new Date();
        const daysDifference = (currentDate - transactionDate) / (1000 * 60 * 60 * 24);

        const isWithinPeriod = daysDifference <= refundPeriodDays;

        // Check if already refunded
        const existingRefund = await Refund.findOne({
            originalTransaction: transactionId,
            status: { $in: ['pending', 'approved', 'completed'] }
        });

        const eligibility = {
            eligible: isWithinPeriod && !existingRefund && transaction.paymentStatus === 'paid',
            reasons: [],
            transaction
        };

        if (!isWithinPeriod) {
            eligibility.reasons.push(`Refund period expired (${refundPeriodDays} days)`);
        }

        if (existingRefund) {
            eligibility.reasons.push('Refund already exists for this transaction');
        }

        if (transaction.paymentStatus !== 'paid') {
            eligibility.reasons.push('Transaction not paid');
        }

        res.json({
            success: true,
            data: eligibility
        });
    } catch (error) {
        console.error('Check refund eligibility error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check refund eligibility',
            error: error.message
        });
    }
};

/**
 * @route   POST /api/cashier/refund/initiate
 * @desc    Initiate a refund request
 * @access  Private (Cashier)
 */
exports.initiateRefund = async (req, res) => {
    try {
        const {
            transactionId,
            refundItems,
            refundMethod,
            refundReason,
            refundReasonDetails
        } = req.body;

        const cashierId = req.user.userId;

        // Get transaction
        const transaction = await Order.findById(transactionId);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // Get current shift
        const currentShift = await CashierShift.findOne({
            cashier: cashierId,
            status: { $in: ['active', 'on_break'] }
        });

        // Calculate refund amount
        let refundAmount = 0;
        const processedItems = refundItems.map(item => {
            const subtotal = item.quantity * item.price;
            refundAmount += subtotal;
            return {
                ...item,
                subtotal
            };
        });

        // Determine if approval required (e.g., refunds > 5000 ETB)
        const approvalRequired = refundAmount > 5000;

        // Create refund
        const refund = new Refund({
            originalTransaction: transactionId,
            customer: transaction.customer,
            refundItems: processedItems,
            refundAmount,
            refundMethod,
            refundReason,
            refundReasonDetails,
            initiatedBy: cashierId,
            status: approvalRequired ? 'pending' : 'approved',
            approvalRequired,
            shift: currentShift?._id,
            originalPaymentMethod: transaction.paymentMethod
        });

        refund.addWorkflowStep('initiated', 'completed', cashierId, 'Refund initiated');

        if (!approvalRequired) {
            refund.addWorkflowStep('approved', 'completed', cashierId, 'Auto-approved (under limit)');
            refund.approvedBy = cashierId;
            refund.approvedAt = new Date();
        }

        await refund.save();

        res.status(201).json({
            success: true,
            message: approvalRequired
                ? 'Refund initiated and pending approval'
                : 'Refund approved automatically',
            data: refund
        });
    } catch (error) {
        console.error('Initiate refund error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initiate refund',
            error: error.message
        });
    }
};

/**
 * @route   POST /api/cashier/refund/:id/approve
 * @desc    Approve a refund (Manager/Supervisor)
 * @access  Private (Manager/Supervisor)
 */
exports.approveRefund = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const approverId = req.user.userId;

        const refund = await Refund.findById(id);

        if (!refund) {
            return res.status(404).json({
                success: false,
                message: 'Refund not found'
            });
        }

        if (refund.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Refund is not in pending status'
            });
        }

        refund.status = 'approved';
        refund.approvedBy = approverId;
        refund.approvedAt = new Date();
        refund.approvalNotes = notes;

        refund.addWorkflowStep('approved', 'completed', approverId, notes);

        await refund.save();

        res.json({
            success: true,
            message: 'Refund approved successfully',
            data: refund
        });
    } catch (error) {
        console.error('Approve refund error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve refund',
            error: error.message
        });
    }
};

/**
 * @route   POST /api/cashier/refund/:id/complete
 * @desc    Complete refund processing
 * @access  Private (Cashier)
 */
exports.completeRefund = async (req, res) => {
    try {
        const { id } = req.params;
        const { returnedToStock, stockUpdates } = req.body;
        const cashierId = req.user.userId;

        const refund = await Refund.findById(id).populate('refundItems.medicine');

        if (!refund) {
            return res.status(404).json({
                success: false,
                message: 'Refund not found'
            });
        }

        if (refund.status !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Refund must be approved before completion'
            });
        }

        // Update inventory if returned to stock
        if (returnedToStock && stockUpdates) {
            for (const update of stockUpdates) {
                if (update.status === 'restocked') {
                    await Medicine.findByIdAndUpdate(
                        update.medicine,
                        { $inc: { stock: update.quantity } }
                    );
                }
            }

            refund.returnedToStock = true;
            refund.stockUpdateDetails = stockUpdates.map(u => ({
                ...u,
                updatedAt: new Date()
            }));
        }

        refund.status = 'completed';
        refund.processedBy = cashierId;
        refund.completedAt = new Date();

        refund.addWorkflowStep('completed', 'completed', cashierId, 'Refund processed successfully');

        await refund.save();

        // Update shift totals
        if (refund.shift) {
            const shift = await CashierShift.findById(refund.shift);
            if (shift) {
                shift.totalRefunds += refund.refundAmount;
                await shift.save();
            }
        }

        res.json({
            success: true,
            message: 'Refund completed successfully',
            data: refund
        });
    } catch (error) {
        console.error('Complete refund error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete refund',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/cashier/refunds
 * @desc    Get all refunds with filters
 * @access  Private (Cashier)
 */
exports.getRefunds = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            startDate,
            endDate,
            refundMethod
        } = req.query;

        const query = {};

        if (status) query.status = status;
        if (refundMethod) query.refundMethod = refundMethod;

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const refunds = await Refund.find(query)
            .populate('originalTransaction')
            .populate('customer', 'firstName lastName email')
            .populate('initiatedBy', 'firstName lastName')
            .populate('approvedBy', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Refund.countDocuments(query);

        res.json({
            success: true,
            data: refunds,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get refunds error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get refunds',
            error: error.message
        });
    }
};
