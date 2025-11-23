const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, authenticateJWT } = require('../middleware/auth');
const { AuditLog } = require('../models');

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// POST /api/auth/register - Register new user
router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  
  // Validation
  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      error: 'Email, password, and name are required'
    });
  }
  
  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  
  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: 'User with this email already exists'
    });
  }
  
  // Create new user
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const user = new User({
    userId,
    email: email.toLowerCase(),
    password,
    name,
    role: 'standard', // Default role
    familyId: null
  });
  
  await user.save();
  
  // Generate token
  const token = generateToken(user);
  
  // Create audit log
  await AuditLog.create({
    auditId: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    entityType: 'User',
    entityId: userId,
    action: 'CREATE',
    userId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date()
  });
  
  res.status(201).json({
    success: true,
    data: {
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        familyId: user.familyId
      },
      token
    }
  });
}));

// POST /api/auth/login - User login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
  }
  
  // Find user with password field
  const user = await User.findOne({ 
    email: email.toLowerCase(),
    isActive: true,
    deletedAt: null
  }).select('+password');
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password'
    });
  }
  
  // Check password
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password'
    });
  }
  
  // Update last login
  user.lastLogin = new Date();
  await user.save();
  
  // Generate token
  const token = generateToken(user);
  
  // Create audit log
  await AuditLog.create({
    auditId: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    entityType: 'User',
    entityId: user.userId,
    action: 'LOGIN',
    userId: user.userId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date()
  });
  
  res.json({
    success: true,
    data: {
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        familyId: user.familyId,
        profileImage: user.profileImage,
        currency: user.currency
      },
      token
    }
  });
}));

// POST /api/auth/logout - User logout
router.post('/logout', asyncHandler(async (req, res) => {
  // In JWT, logout is handled client-side by removing token
  // We just log the action
  
  if (req.user) {
    await AuditLog.create({
      auditId: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entityType: 'User',
      entityId: req.user.userId,
      action: 'LOGOUT',
      userId: req.user.userId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date()
    });
  }
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

// GET /api/auth/me - Get current user
router.get('/me', authenticateJWT, asyncHandler(async (req, res) => {
  const user = await User.findOne({ userId: req.user.userId });
  
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  res.json({
    success: true,
    data: {
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        familyId: user.familyId,
        profileImage: user.profileImage,
        currency: user.currency
      }
    }
  });
}));

// POST /api/auth/avatar - Upload profile image
router.post('/avatar', authenticateJWT, asyncHandler(async (req, res) => {
  const { image } = req.body;
  
  if (!image) {
    return res.status(400).json({ success: false, error: 'Image data required' });
  }
  
  // Basic validation for base64 image
  if (!image.startsWith('data:image/')) {
    return res.status(400).json({ success: false, error: 'Invalid image format' });
  }
  
  // Check size (approximate)
  if (image.length > 10 * 1024 * 1024 * 1.37) { // ~10MB limit
    return res.status(400).json({ success: false, error: 'Image too large' });
  }
  
  await User.findOneAndUpdate(
    { userId: req.user.userId },
    { profileImage: image }
  );
  
  res.json({ success: true, message: 'Profile image updated' });
}));

// PATCH /api/auth/settings - Update user settings
router.patch('/settings', authenticateJWT, asyncHandler(async (req, res) => {
  const { currency } = req.body;
  const updates = {};
  
  if (currency) {
    if (!['USD', 'INR'].includes(currency)) {
      return res.status(400).json({ success: false, error: 'Invalid currency' });
    }
    updates.currency = currency;
  }
  
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, error: 'No settings provided' });
  }
  
  await User.findOneAndUpdate(
    { userId: req.user.userId },
    updates
  );
  
  res.json({ success: true, message: 'Settings updated' });
}));

module.exports = router;
