const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/auth.controller');
const { validateSignup } = require('../middleware/validationMiddleware');

router.post('/signup', validateSignup, signup);
router.post('/login', login);

module.exports = router;