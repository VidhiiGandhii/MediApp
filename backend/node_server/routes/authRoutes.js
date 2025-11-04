const express = require('express');
const { signupUser, loginUser } = require('../controllers/authController');
const { validateSignup } = require('../middleware/validationMiddleware');
const router = express.Router();

/**
 * @route   POST /api/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', validateSignup, signupUser);
/**
 * @route   POST /api/login
 * @desc    Login a user
 * @access  Public
 */
router.post('/login', loginUser);

module.exports = router;