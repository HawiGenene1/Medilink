const crypto = require('crypto');

/**
 * Generates a secure random password
 * @param {number} length - Length of the password (default: 12)
 * @returns {string} Generated password
 */
const generatePassword = (length = 12) => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  // Ensure at least one character from each character set
  let password = [
    lowercase[Math.floor(Math.random() * lowercase.length)],
    uppercase[Math.floor(Math.random() * uppercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)]
  ];
  
  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }
  
  // Shuffle the password array
  return password
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)
    .join('');
};

/**
 * Hashes a password using bcrypt
 * @param {string} password - The password to hash
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

module.exports = {
  generatePassword,
  hashPassword
};
