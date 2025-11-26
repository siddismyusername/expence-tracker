const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const AuthController = require('../controllers/AuthController');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', (req, res) => AuthController.register(req, res));

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', (req, res) => AuthController.login(req, res));

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, (req, res) => AuthController.getMe(req, res));

// @route   PUT api/auth/update
// @desc    Update user profile
// @access  Private
router.put('/update', auth, (req, res) => AuthController.updateProfile(req, res));

module.exports = router;
