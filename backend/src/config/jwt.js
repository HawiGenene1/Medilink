const jwt = require('jsonwebtoken');

/**
 * Generate JWT token
 * @param {Object} payload - Data to encode in the token
 * @returns {String} JWT token
 */
const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  const expire = process.env.JWT_EXPIRE || '7d';
  return jwt.sign(payload, secret, { expiresIn: expire });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
