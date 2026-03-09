/**
 * Checks if an email string is in a valid format.
 * @param {string} email - The email to validate.
 * @returns {boolean} True if the email is valid, false otherwise.
 */
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Checks if a password meets the minimum length requirement.
 * @param {string} password - The password to validate.
 * @returns {boolean} True if the password is valid, false otherwise.
 */
const validatePassword = (password) => {
  return password && password.length >= 6;
};

module.exports = { 
  validateEmail, 
  validatePassword 
};