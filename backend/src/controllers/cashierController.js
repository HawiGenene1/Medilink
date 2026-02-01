const Order = require('../models/Order');
const Payment = require('../models/Payment');
const chapaService = require('../services/chapaService');

// Helper to get report data
const getReportDataInternal = async (startDate, endDate) => {
  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.updatedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const statusStats = await Order.aggregate([
    { $match: dateFilter },
    { $group: { _id: '$paymentStatus', count: { $sum: 1 }, total: { $sum: '$finalAmount' } } }
  ]);

  const paidOrders = await Order.find({ ...dateFilter, paymentStatus: 'paid' }).select('_id');
  const paidOrderIds = paidOrders.map(o => o._id);

  const methodStats = await Payment.aggregate([
    { $match: { order: { $in: paidOrderIds } } },
    { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$amount' } } }
  ]);

  const report = {
    totalRevenue: 0,
    totalRefunds: 0,
    netIncome: 0,
    successCount: 0,
    failedCount: 0,
    refundCount: 0,
    avgOrderValue: 0,
    methodBreakdown: {},
    generatedAt: new Date()
  };

  statusStats.forEach(stat => {
    if (stat._id === 'paid') {
      report.totalRevenue = stat.total;
      report.successCount = stat.count;
    }
    if (stat._id === 'failed') report.failedCount = stat.count;
    if (stat._id === 'refunded') {
      report.totalRefunds = stat.total;
      report.refundCount = stat.count;
    }
  });

  report.netIncome = report.totalRevenue - report.totalRefunds;
  if (report.successCount > 0) report.avgOrderValue = report.totalRevenue / report.successCount;

  methodStats.forEach(m => {
    report.methodBreakdown[m._id || 'Unknown'] = m.count;
  });

  return report;
};

// Get Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Aggregation for All-Time Stats
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$finalAmount' }
        }
      }
    ]);

    // Aggregation for Today's Stats
    const todayStats = await Order.aggregate([
      { $match: { updatedAt: { $gte: todayStart } } },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$finalAmount' }
        }
      }
    ]);

    // Default structure
    const result = {
      pending: 0,
      paid: 0,
      failed: 0,
      refunded: 0,
      total_revenue: 0,
      todays_revenue: 0,
      todays_refunds: 0
    };

    stats.forEach(stat => {
      if (stat._id === 'pending') result.pending = stat.count;
      if (stat._id === 'paid') {
        result.paid = stat.count;
        result.total_revenue = stat.totalAmount;
      }
      if (stat._id === 'failed') result.failed = stat.count;
      if (stat._id === 'refunded') result.refunded = stat.count;
    });

    todayStats.forEach(stat => {
      if (stat._id === 'paid') result.todays_revenue = stat.totalAmount;
      if (stat._id === 'refunded') result.todays_refunds = stat.totalAmount;
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching cashier stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

// Get Orders with filters
exports.getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search, startDate, endDate } = req.query;
    const query = {};

    // Filter by Payment Status
    if (status && status !== 'all') {
      if (status === 'failed') {
        query.paymentStatus = { $in: ['failed', 'refunded'] };
      } else {
        query.paymentStatus = status;
      }
    }

    // Search by Order Reference
    if (search) {
      query.orderNumber = { $regex: search, $options: 'i' };
    }

    // Date Range Filter
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('customer', 'firstName lastName email phone')
      .lean();

    // Efficiently fetch payment info for these orders
    const orderIds = orders.map(o => o._id);
    const payments = await Payment.find({ order: { $in: orderIds } });

    const ordersWithPayment = orders.map(order => {
      const payment = payments.find(p => p.order.toString() === order._id.toString());
      return {
        ...order,
        paymentMethod: payment ? payment.paymentMethod : 'N/A',
        transactionRef: payment ? payment.transactionId : 'N/A',
        paymentDate: payment ? payment.createdAt : order.updatedAt
      };
    });

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: ordersWithPayment,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching cashier orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

// Verify Payment Manually
exports.verifyPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const payment = await Payment.findOne({ order: orderId }).sort({ createdAt: -1 });

    // FIX: If no payment record exists (e.g., Cash order), create one now
    if (!payment) {
      if (order.paymentMethod === 'cash' || !order.paymentMethod) {
        // Create a new Cash Payment record
        payment = await Payment.create({
          order: orderId,
          customer: order.customer,
          pharmacy: order.pharmacy,
          amount: order.finalAmount,
          paymentMethod: 'cash',
          paymentStatus: 'pending',
          transactionId: `CASH-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Generate internal ref
          metadata: { verifiedBy: req.user._id }
        });
      } else {
        return res.status(404).json({ success: false, message: 'No initiated payment found for this order' });
      }
    }

    // Handle Cash Verification immediately
    if (payment.paymentMethod === 'cash') {
      order.paymentStatus = 'paid';
      order.status = 'confirmed'; // Auto-confirm
      await order.save();

      payment.paymentStatus = 'completed';
      payment.paidAt = Date.now();
      await payment.save();

      return res.status(200).json({
        success: true,
        message: 'Cash payment confirmed successfully',
        data: { status: 'paid', paymentMethod: 'cash' }
      });
    }

    if (!payment.transactionId) {
      // Should not happen for cash now, but safety check
      return res.status(404).json({ success: false, message: 'Invalid payment record (missing transactionId)' });
    }

    const verification = await chapaService.verifyPayment(payment.transactionId);

    if (verification.status === 'success') {
      order.paymentStatus = 'paid';
      order.status = 'processing';
      await order.save();

      payment.status = 'success';
      await payment.save();

      return res.status(200).json({
        success: true,
        message: 'Payment verified and updated to PAID',
        data: { status: 'paid' }
      });
    } else {
      return res.status(200).json({
        success: true,
        message: `Payment status at Chapa is: ${verification.status}`,
        data: { status: verification.status }
      });
    }

  } catch (error) {
    console.error('Manual verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed'
    });
  }
};

// Generate Invoice
exports.generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const invoiceController = require('./invoiceController');
    const invoice = await invoiceController.generateInvoice(orderId);

    res.status(200).json({
      success: true,
      message: 'Invoice generated successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate invoice'
    });
  }
};

// Initiate Refund
exports.initiateRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Call Chapa refund
    const refund = await chapaService.processRefund(payment.transactionId, amount, reason);

    if (refund.success) {
      payment.paymentStatus = 'refunded';
      payment.addHistory('refunded', reason || 'Refund initiated by cashier', req.user._id);
      await payment.save();

      // Update Order
      const order = await Order.findById(payment.order);
      if (order) {
        order.paymentStatus = 'refunded';
        order.status = 'cancelled';
        await order.save();
      }

      res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        data: refund.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Refund failed at gateway',
        error: refund.error
      });
    }
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Refund failed'
    });
  }
};

// Get Financial Report
exports.getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await getReportDataInternal(startDate, endDate);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
};

// Export Report PDF
exports.exportReportPDF = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const report = await getReportDataInternal(startDate, endDate);

    const { generateReportHTML } = require('../utils/reportTemplate');
    const { generateReportPDF } = require('../utils/reportPdfGenerator');

    const html = generateReportHTML(report, { start: startDate || 'All Time', end: endDate || 'Present' });
    const pdfPath = await generateReportPDF(html, `REPORT-${Date.now()}`);

    res.status(200).json({ success: true, data: { pdfUrl: pdfPath } });
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ success: false, message: 'Failed to export PDF' });
  }
};
