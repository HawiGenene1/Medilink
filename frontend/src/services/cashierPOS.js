import api from './api';

/**
 * Cashier POS API Service
 * All API calls for cashier operations including shifts, refunds, and dashboard
 */

// ==================== SHIFT MANAGEMENT ====================

/**
 * Start a new cashier shift
 * @param {number} openingCash - Opening cash amount
 */
export const startShift = async (openingCash) => {
    return await api.post('/cashier/shift/start', { openingCash });
};

/**
 * Take a break during shift
 */
export const takeBreak = async () => {
    return await api.post('/cashier/shift/break');
};

/**
 * Resume from break
 */
export const resumeShift = async () => {
    return await api.post('/cashier/shift/resume');
};

/**
 * End current shift
 * @param {number} closingCash - Closing cash amount
 * @param {string} notes - Optional notes
 */
export const endShift = async (closingCash, notes) => {
    return await api.post('/cashier/shift/end', { closingCash, notes });
};

/**
 * Get current active shift
 */
export const getCurrentShift = async () => {
    return await api.get('/cashier/shift/current');
};

/**
 * Get shift history
 * @param {object} params - Query parameters (page, limit, startDate, endDate)
 */
export const getShiftHistory = async (params = {}) => {
    return await api.get('/cashier/shift/history', { params });
};

// ==================== DASHBOARD & STATS ====================

/**
 * Get today's dashboard statistics
 */
export const getTodayStats = async () => {
    return await api.get('/cashier/stats/today');
};

/**
 * Get recent transactions
 * @param {number} limit - Number of transactions to fetch
 */
export const getRecentTransactions = async (limit = 10) => {
    return await api.get('/cashier/transactions/recent', { params: { limit } });
};

/**
 * Get cashier alerts
 */
export const getAlerts = async () => {
    return await api.get('/cashier/alerts');
};

/**
 * Get cashier performance metrics
 * @param {string} period - Period (day, week, month)
 */
export const getPerformance = async (period = 'week') => {
    return await api.get('/cashier/performance', { params: { period } });
};

// ==================== REFUND MANAGEMENT ====================

/**
 * Check refund eligibility for a transaction
 * @param {string} transactionId - Transaction/Order ID
 */
export const checkRefundEligibility = async (transactionId) => {
    return await api.post('/cashier/refund-v2/check-eligibility', { transactionId });
};

/**
 * Initiate a refund
 * @param {object} refundData - Refund details
 * @param {string} refundData.transactionId - Original transaction ID
 * @param {array} refundData.refundItems - Items to refund
 * @param {string} refundData.refundMethod - Refund method (cash, card, etc.)
 * @param {string} refundData.refundReason - Refund reason
 * @param {string} refundData.refundReasonDetails - Additional details
 */
export const initiateRefund = async (refundData) => {
    return await api.post('/cashier/refund-v2/initiate', refundData);
};

/**
 * Approve a refund (Manager/Supervisor only)
 * @param {string} refundId - Refund ID
 * @param {string} notes - Approval notes
 */
export const approveRefund = async (refundId, notes) => {
    return await api.post(`/cashier/refund-v2/${refundId}/approve`, { notes });
};

/**
 * Complete a refund
 * @param {string} refundId - Refund ID
 * @param {boolean} returnedToStock - Whether items returned to stock
 * @param {array} stockUpdates - Stock update details
 */
export const completeRefund = async (refundId, returnedToStock, stockUpdates) => {
    return await api.post(`/cashier/refund-v2/${refundId}/complete`, {
        returnedToStock,
        stockUpdates
    });
};

/**
 * Get refunds list
 * @param {object} params - Query parameters (page, limit, status, etc.)
 */
export const getRefunds = async (params = {}) => {
    return await api.get('/cashier/refund-v2/list', { params });
};

// ==================== EXISTING CASHIER APIs (from cashier.js) ====================

/**
 * Get dashboard stats (old endpoint)
 */
export const getDashboardStats = async () => {
    return await api.get('/cashier/stats');
};

/**
 * Get orders/transactions
 * @param {object} params - Query parameters
 */
export const getOrders = async (params = {}) => {
    return await api.get('/cashier/orders', { params });
};

/**
 * Verify payment status
 * @param {string} orderId - Order ID
 */
export const verifyPayment = async (orderId) => {
    return await api.post(`/cashier/verify/${orderId}`);
};

/**
 * Generate invoice
 * @param {string} orderId - Order ID
 */
export const generateInvoice = async (orderId) => {
    return await api.post(`/cashier/generate-invoice/${orderId}`);
};

/**
 * Get financial report
 * @param {object} params - Query parameters (startDate, endDate)
 */
export const getFinancialReport = async (params = {}) => {
    return await api.get('/cashier/financial-report', { params });
};

/**
 * Export report as PDF
 * @param {object} params - Query parameters
 */
export const exportReportPDF = async (params = {}) => {
    return await api.post('/cashier/export-report', params);
};

// Export all functions as default object as well
const cashierPOSService = {
    // Shift Management
    startShift,
    takeBreak,
    resumeShift,
    endShift,
    getCurrentShift,
    getShiftHistory,

    // Dashboard & Stats
    getTodayStats,
    getRecentTransactions,
    getAlerts,
    getPerformance,

    // Refund Management
    checkRefundEligibility,
    initiateRefund,
    approveRefund,
    completeRefund,
    getRefunds,

    // Existing APIs
    getDashboardStats,
    getOrders,
    verifyPayment,
    generateInvoice,
    getFinancialReport,
    exportReportPDF
};

export default cashierPOSService;
