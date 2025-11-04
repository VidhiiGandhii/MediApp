const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

const authenticateToken = (req, res, next) => {
  console.log(`!!!!!!!! AUTH MIDDLEWARE RUNNING FOR: ${req.method} ${req.url}`);
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log(`!!!!!!!! NO TOKEN, SENDING 401 FOR: ${req.url}`);
    return res.status(401).json({ success: false, message: 'No authentication token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = { authenticateToken };