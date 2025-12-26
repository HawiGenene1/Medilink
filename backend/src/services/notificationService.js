const Order = require('../models/Order');
const { ErrorResponse } = require('../utils/errorResponse');

// In a production environment, you would integrate with actual email/SMS services
const sendEmail = async (to, subject, html) => {
  console.log(`[Email] To: ${to}, Subject: ${subject}`);
  console.log(html);
  return { success: true };
};

const sendSMS = async (to, message) => {
  console.log(`[SMS] To: ${to}, Message: ${message}`);
  return { success: true };
};

const sendPushNotification = async (userId, title, body) => {
  console.log(`[Push] User: ${userId}, Title: ${title}, Body: ${body}`);
  return { success: true };
};

const notificationService = {
  /**
   * Send order status update notification
   */
  async sendOrderStatusUpdate(orderId) {
    try {
      const order = await Order.findById(orderId)
        .populate('pharmacy', 'name')
        .populate('customer', 'name email phone')
        .populate('items.medicine', 'name');

      if (!order) {
        throw new ErrorResponse('Order not found', 404);
      }

      const statusMessages = {
        processing: 'is being processed',
        ready_for_pickup: 'is ready for pickup',
        out_for_delivery: 'is out for delivery',
        delivered: 'has been delivered',
        cancelled: 'has been cancelled',
        on_hold: 'is on hold'
      };

      const statusMessage = statusMessages[order.status] || 'status has been updated';
      const subject = `Order ${order.orderNumber} ${statusMessage}`;
      
      // Generate order items list
      const itemsList = order.items.map(item => 
        `${item.quantity}x ${item.medicine.name} - ${item.price} ETB`
      ).join('\n');

      const html = `
        <h2>Order Update: ${order.orderNumber}</h2>
        <p>Hello ${order.customer.name},</p>
        <p>Your order ${order.orderNumber} ${statusMessage}.</p>
        
        <h3>Order Details:</h3>
        <p><strong>Status:</strong> ${order.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
        <p><strong>Items:</strong></p>
        <ul>
          ${order.items.map(item => `<li>${item.quantity}x ${item.medicine.name} - ${item.price} ETB</li>`).join('')}
        </ul>
        <p><strong>Total Amount:</strong> ${order.totalAmount} ETB</p>
        
        <p>Thank you for choosing ${order.pharmacy.name}!</p>
      `;

      // Send email notification
      if (order.customer.email) {
        await sendEmail(order.customer.email, subject, html);
      }

      // Send SMS notification
      if (order.customer.phone) {
        const smsMessage = `Order ${order.orderNumber} ${statusMessage}. Total: ${order.totalAmount} ETB`;
        await sendSMS(order.customer.phone, smsMessage);
      }

      // Log notification in order history
      order.notifications.push({
        type: 'status_update',
        status: order.status,
        message: `Order status updated to ${order.status}`,
        sentAt: new Date()
      });

      await order.save();
      
      return { success: true, message: 'Notification sent successfully' };
    } catch (error) {
      console.error('Error sending order status update:', error);
      throw new ErrorResponse('Failed to send order status update', 500);
    }
  },

  /**
   * Send prescription verification request
   */
  async sendPrescriptionVerification(orderId, message = '') {
    try {
      const order = await Order.findById(orderId)
        .populate('pharmacy', 'name')
        .populate('customer', 'name email phone');

      if (!order) {
        throw new ErrorResponse('Order not found', 404);
      }

      if (!order.prescription || !order.prescription.required) {
        throw new ErrorResponse('This order does not require prescription verification', 400);
      }

      const subject = `Prescription Verification Required for Order ${order.orderNumber}`;
      const verificationUrl = `${process.env.FRONTEND_URL}/prescription/verify/${order._id}`;
      
      const html = `
        <h2>Prescription Verification Required</h2>
        <p>Hello ${order.customer.name},</p>
        <p>Your order ${order.orderNumber} requires prescription verification before we can proceed.</p>
        
        ${message ? `<p><strong>Message from pharmacy:</strong> ${message}</p>` : ''}
        
        <p>Please upload your prescription by clicking the button below:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Upload Prescription</a>
        
        <p>If you have any questions, please contact our support team.</p>
        <p>Thank you,<br>${order.pharmacy.name} Team</p>
      `;

      // Send email notification
      if (order.customer.email) {
        await sendEmail(order.customer.email, subject, html);
      }

      // Send SMS notification
      if (order.customer.phone) {
        const smsMessage = `Prescription verification required for order ${order.orderNumber}. Please check your email for details.`;
        await sendSMS(order.customer.phone, smsMessage);
      }

      // Log notification in order history
      order.notifications.push({
        type: 'prescription_verification_request',
        message: 'Prescription verification requested' + (message ? `: ${message}` : ''),
        sentAt: new Date()
      });

      order.prescription.status = 'verification_requested';
      await order.save();
      
      return { success: true, message: 'Prescription verification request sent' };
    } catch (error) {
      console.error('Error sending prescription verification request:', error);
      throw error;
    }
  },

  /**
   * Send delivery status update
   */
  async sendDeliveryUpdate(orderId, status, estimatedDelivery = null) {
    try {
      const order = await Order.findById(orderId)
        .populate('pharmacy', 'name')
        .populate('customer', 'name email phone')
        .populate('delivery.driver', 'name phone');

      if (!order) {
        throw new ErrorResponse('Order not found', 404);
      }

      const statusMessages = {
        scheduled: 'has been scheduled for delivery',
        picked_up: 'has been picked up by the delivery driver',
        in_transit: 'is on its way to you',
        out_for_delivery: 'is out for delivery',
        delivered: 'has been delivered',
        failed: 'delivery attempt was unsuccessful'
      };

      const statusMessage = statusMessages[status] || 'delivery status has been updated';
      const subject = `Delivery Update: Order ${order.orderNumber} ${statusMessage}`;
      
      let deliveryInfo = '';
      if (order.delivery.driver) {
        deliveryInfo += `<p><strong>Driver:</strong> ${order.delivery.driver.name}</p>`;
        deliveryInfo += order.delivery.driver.phone ? `<p><strong>Driver Contact:</strong> ${order.delivery.driver.phone}</p>` : '';
      }
      
      if (order.delivery.trackingNumber) {
        deliveryInfo += `<p><strong>Tracking Number:</strong> ${order.delivery.trackingNumber}</p>`;
      }
      
      if (estimatedDelivery) {
        deliveryInfo += `<p><strong>Estimated Delivery:</strong> ${new Date(estimatedDelivery).toLocaleString()}</p>`;
      }

      const html = `
        <h2>Delivery Update: Order ${order.orderNumber}</h2>
        <p>Hello ${order.customer.name},</p>
        <p>Your order ${order.orderNumber} ${statusMessage}.</p>
        
        ${deliveryInfo}
        
        <p>If you have any questions about your delivery, please contact our support team.</p>
        <p>Thank you for choosing ${order.pharmacy.name}!</p>
      `;

      // Send email notification
      if (order.customer.email) {
        await sendEmail(order.customer.email, subject, html);
      }

      // Send SMS notification
      if (order.customer.phone) {
        let smsMessage = `Order ${order.orderNumber} ${statusMessage}.`;
        if (order.delivery.trackingNumber) {
          smsMessage += ` Track: ${order.delivery.trackingNumber}`;
        }
        await sendSMS(order.customer.phone, smsMessage);
      }

      // Log notification in order history
      order.notifications.push({
        type: 'delivery_update',
        status: status,
        message: `Delivery status updated to ${status}`,
        sentAt: new Date()
      });

      // Update delivery status
      order.delivery.status = status;
      if (status === 'delivered') {
        order.delivery.deliveredAt = new Date();
      }
      
      await order.save();
      
      return { success: true, message: 'Delivery update sent successfully' };
    } catch (error) {
      console.error('Error sending delivery update:', error);
      throw new ErrorResponse('Failed to send delivery update', 500);
    }
  },

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(orderId, dueDate) {
    try {
      const order = await Order.findById(orderId)
        .populate('pharmacy', 'name phone')
        .populate('customer', 'name email phone');

      if (!order) {
        throw new ErrorResponse('Order not found', 404);
      }

      const subject = `Payment Reminder for Order ${order.orderNumber}`;
      const paymentUrl = `${process.env.FRONTEND_URL}/orders/${order._id}/pay`;
      
      const html = `
        <h2>Payment Reminder</h2>
        <p>Hello ${order.customer.name},</p>
        <p>This is a friendly reminder that your payment for order ${order.orderNumber} is due by ${new Date(dueDate).toLocaleDateString()}.</p>
        
        <p><strong>Amount Due:</strong> ${order.totalAmount} ETB</p>
        <p>You can make the payment by clicking the button below:</p>
        
        <a href="${paymentUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Pay Now</a>
        
        <p>If you've already made the payment, please disregard this message.</p>
        <p>For any questions, please contact ${order.pharmacy.name} at ${order.pharmacy.phone}.</p>
      `;

      // Send email notification
      if (order.customer.email) {
        await sendEmail(order.customer.email, subject, html);
      }

      // Send SMS notification
      if (order.customer.phone) {
        const smsMessage = `Reminder: Payment of ${order.totalAmount} ETB for order ${order.orderNumber} is due by ${new Date(dueDate).toLocaleDateString()}.`;
        await sendSMS(order.customer.phone, smsMessage);
      }

      // Log notification in order history
      order.notifications.push({
        type: 'payment_reminder',
        message: `Payment reminder sent. Due date: ${new Date(dueDate).toLocaleString()}`,
        sentAt: new Date()
      });

      await order.save();
      
      return { success: true, message: 'Payment reminder sent successfully' };
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      throw new ErrorResponse('Failed to send payment reminder', 500);
    }
  }
};

module.exports = notificationService;
