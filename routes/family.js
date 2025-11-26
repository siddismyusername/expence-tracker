const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const FamilyController = require('../controllers/FamilyController');

// @route   POST api/family/create
// @desc    Create a new family
// @access  Private
router.post('/create', auth, (req, res) => FamilyController.createFamily(req, res));

// @route   POST api/family/join
// @desc    Join a family
// @access  Private
router.post('/join', auth, (req, res) => FamilyController.joinFamily(req, res));

// @route   POST api/family/leave
// @desc    Leave a family
// @access  Private
router.post('/leave', auth, (req, res) => FamilyController.leaveFamily(req, res));

// @route   GET api/family
// @desc    Get family details
// @access  Private
router.get('/', auth, (req, res) => FamilyController.getFamily(req, res));

// @route   GET api/family/members
// @desc    Get family members
// @access  Private
router.get('/members', auth, (req, res) => FamilyController.getMembers(req, res));

// @route   PUT api/family
// @desc    Update family details
// @access  Private
router.put('/', auth, (req, res) => FamilyController.updateFamily(req, res));

module.exports = router;
