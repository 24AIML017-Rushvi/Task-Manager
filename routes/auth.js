const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/auth');

// Public registration & login endpoints (Practical 7)
router.post('/register', authController.register);
router.post('/signup', authController.register); // Compatibility alias
router.post('/login', authController.login);

// Protected endpoint to fetch current user profile
router.get('/me', authenticate, authController.getMe);

module.exports = router;
