const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Family = require('../models/Family');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid'); // You might need to install uuid or just use a random string generator

// Helper to generate random Family ID
const generateFamilyId = () => {
    return 'fam_' + Math.random().toString(36).substr(2, 9);
};

// @route   POST api/family/create
// @desc    Create a new family
// @access  Private
router.post('/create', auth, async (req, res) => {
    const { name } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (user.familyId) {
            return res.status(400).json({ msg: 'User already belongs to a family' });
        }

        const familyId = generateFamilyId();

        const newFamily = new Family({
            familyId,
            name,
            createdBy: req.user.id,
            members: [req.user.id]
        });

        const family = await newFamily.save();

        // Update user
        user.familyId = family._id;
        await user.save();

        res.json(family);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/family/join
// @desc    Join a family
// @access  Private
router.post('/join', auth, async (req, res) => {
    const { familyId } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (user.familyId) {
            return res.status(400).json({ msg: 'User already belongs to a family' });
        }

        const family = await Family.findOne({ familyId });
        if (!family) {
            return res.status(404).json({ msg: 'Family not found' });
        }

        // Add user to family
        family.members.push(req.user.id);
        await family.save();

        // Update user
        user.familyId = family._id;
        await user.save();

        res.json(family);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/family/leave
// @desc    Leave a family
// @access  Private
router.post('/leave', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.familyId) {
            return res.status(400).json({ msg: 'User does not belong to a family' });
        }

        const family = await Family.findById(user.familyId);
        if (!family) {
            return res.status(404).json({ msg: 'Family not found' });
        }

        // Remove user from family members
        family.members = family.members.filter(memberId => memberId.toString() !== req.user.id);

        // Check if family is empty
        if (family.members.length === 0) {
            await Family.findByIdAndDelete(family._id);
        } else {
            await family.save();
        }

        // Update user
        user.familyId = null;
        await user.save();

        res.json({ msg: 'Left family successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/family/members
// @desc    Get family members
// @access  Private
router.get('/members', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.familyId) {
            return res.status(400).json({ msg: 'User does not belong to a family' });
        }

        const family = await Family.findById(user.familyId).populate('members', 'name email profilePicture');
        res.json(family);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
