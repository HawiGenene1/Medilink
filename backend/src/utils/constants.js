// Application Constants

// Medicine Categories
const MEDICINE_CATEGORIES = {
  PRESCRIPTION: 'prescription',
  OTC: 'otc',
  SUPPLEMENT: 'supplement',
  EQUIPMENT: 'equipment'
};

// Order Status
const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Payment Status
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// Payment Methods
const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  MOBILE_MONEY: 'mobile_money',
  BANK_TRANSFER: 'bank_transfer'
};

// Delivery Status
const DELIVERY_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  FAILED: 'failed'
};

// Notification Types
const NOTIFICATION_TYPES = {
  ORDER_STATUS: 'order_status',
  PRESCRIPTION_UPLOADED: 'prescription_uploaded',
  DELIVERY_UPDATE: 'delivery_update',
  NEW_ORDER: 'new_order',
  PAYMENT_CONFIRMATION: 'payment_confirmation',
  LOW_STOCK: 'low_stock',
  SYSTEM: 'system'
};

// Notification Channels
const NOTIFICATION_CHANNELS = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  IN_APP: 'in_app'
};

// Pagination
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// Cache TTL (in seconds)
const CACHE_TTL = {
  MEDICINES: 300, // 5 minutes
  ORDERS: 180, // 3 minutes
  FILTER_OPTIONS: 600, // 10 minutes
  USER_PREFERENCES: 3600 // 1 hour
};

// File Upload
const FILE_UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  PRESCRIPTION_DIR: 'uploads/prescriptions'
};

// API Response Messages
const MESSAGES = {
  SUCCESS: {
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
    UPLOADED: 'File uploaded successfully'
  },
  ERROR: {
    NOT_FOUND: 'Resource not found',
    VALIDATION: 'Validation failed',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    SERVER_ERROR: 'Internal server error',
    FILE_TOO_LARGE: 'File size exceeds limit',
    INVALID_FILE_TYPE: 'Invalid file type'
  }
};

// Validation Rules
const VALIDATION = {
  PHONE_REGEX: /^[+]?[\d\s\-\(\)]+$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PRICE_MIN: 0,
  STOCK_MIN: 0,
  RATING_MIN: 1,
  RATING_MAX: 5
};

// Sorting Options
const SORT_OPTIONS = {
  MEDICINES: ['name', 'price', 'stock', 'createdAt', 'category'],
  ORDERS: ['createdAt', 'totalAmount', 'status', 'orderNumber']
};

// Search Fields
const SEARCH_FIELDS = {
  MEDICINES: ['name', 'description', 'manufacturer', 'category'],
  ORDERS: ['orderNumber', 'customer.name', 'customer.email'],
  CATEGORIES: ['name', 'description']
};

module.exports = {
  MEDICINE_CATEGORIES,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  DELIVERY_STATUS,
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  CACHE_TTL,
  FILE_UPLOAD,
  MESSAGES,
  VALIDATION,
  SORT_OPTIONS,
  SEARCH_FIELDS
};