const { validateEmail, validatePassword } = require('../utils/validators');

/**
 * Middleware to validate the request body for user signup.
 */
const validateSignup = (req, res, next) => {
  const { name, email, username, password, confirmPassword } = req.body;

  if (!name || !email || !username || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }
  
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }

  next(); // All checks passed
};

/**
 * Middleware to validate the request body for user login.
 */
const validateLogin = (req, res, next) => {
  const { email: identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ success: false, message: 'Email/Username and password required' });
  }
  
  next(); // All checks passed
};


module.exports = { 
  validateSignup,
  validateLogin 
  // You can add more validation middleware here, e.g., validateLogin
};