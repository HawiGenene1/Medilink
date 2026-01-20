const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

/**
const { generateReceiptPDF } = require('../utils/pdfGenerator');

/**
 * Generate Invoice for a completed order
 * @desc Intended to be called internally after payment success, or manually if needed
 */
exports.generateInvoice = async (orderId) => {
    try {
        const order = await Order.findById(orderId).populate('customer');
        if (!order) throw new Error('Order not found');

        // Check if invoice already exists
        const existingInvoice = await Invoice.findOne({ order: orderId });
        if (existingInvoice) return existingInvoice;

        // Find associated payment
        const payment = await Payment.findOne({ order: orderId, status: 'success' });
        // If payment not found, strict check:
        // if (!payment) throw new Error('Successful payment not found for this order');

        // Prepare data for Receipt PDF
        const receiptData = {
            merchant: {
                name: 'Medilink Pharmacy',
                tin: '0011223344', // Example TIN
                phone: '+251-911-000000',
                address: 'Bole, Addis Ababa'
            },
            customer: {
                name: `${order.customer.firstName} ${order.customer.lastName}`,
                phone: order.customer.phone || 'N/A',
                email: order.customer.email || 'N/A'
            },
            payment: {
                method: payment ? payment.paymentMethod : 'N/A',
                status: 'Paid',
                date: payment ? payment.createdAt : new Date(),
                reason: `Order #${order.orderNumber}`
            },
            reference: {
                chapaTxId: payment ? payment.transactionId : 'N/A',
                systemRef: order.orderNumber
            },
            amount: {
                subtotal: order.totalAmount, // Assuming inclusive
                charge: 0,
                total: order.finalAmount
            }
        };

        const invoice = new Invoice({
            order: order._id,
            payment: payment ? payment._id : null,
            customer: order.customer._id,
            items: order.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: item.subtotal
            })),
            subtotal: order.totalAmount,
            tax: order.tax || 0,
            totalAmount: order.finalAmount,
            pdfUrl: null
        });

        // Generate PDF
        // Using invoice number if available or generate one first
        // Model pre-save hooks generate invoiceNumber, so we might need to save first or generate manually?
        // Let's generate a temp number or rely on model. 
        // Better: Save first to get Invoice Number, then Generate PDF, then Update.

        await invoice.save();

        // Now generate PDF using the real invoice number
        const pdfPath = await generateReceiptPDF(receiptData, invoice.invoiceNumber);

        invoice.pdfUrl = pdfPath;
        await invoice.save();

        return invoice;
    } catch (error) {
        console.error('Invoice generation error:', error);
        throw error;
    }
};

// API Endpoint: Get Invoice by Order ID
exports.getInvoiceByOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        let invoice = await Invoice.findOne({ order: orderId })
            .populate('customer', 'firstName lastName email phone')
            .populate('order');

        if (!invoice) {
            // Try to generate it on the fly if order is paid but invoice missing
            const order = await Order.findById(orderId);
            if (order && order.paymentStatus === 'paid') {
                try {
                    invoice = await exports.generateInvoice(orderId);
                    // Re-populate needed fields
                    invoice = await Invoice.findById(invoice._id)
                        .populate('customer', 'firstName lastName email phone')
                        .populate('order');
                } catch (genError) {
                    console.error('Auto-generation failed:', genError);
                    return res.status(404).json({ success: false, message: 'Invoice not found and could not be generated' });
                }
            } else {
                return res.status(404).json({ success: false, message: 'Invoice not found' });
            }
        }

        res.status(200).json({
            success: true,
            data: invoice
        });
    } catch (error) {
        console.error('Get Invoice error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
