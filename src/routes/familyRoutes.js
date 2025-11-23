const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Family = require('../models/Family');
const User = require('../models/User');
const { authenticateJWT } = require('../middleware/auth');
const { requireFamilyAdmin, requireFamilyMember } = require('../middleware/rbac');
const notificationService = require('../services/notificationService');
const crypto = require('crypto');

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Apply authentication to all routes
router.use(authenticateJWT);

// POST /api/family - Create new family
router.post('/', asyncHandler(async (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'Family name is required'
    });
  }
  
  // Check if user already has a family
  if (req.user.familyId) {
    return res.status(400).json({
      success: false,
      error: 'You are already part of a family'
    });
  }
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const familyId = `fam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create family
    const family = new Family({
      familyId,
      name,
      adminUserId: req.user.userId,
      members: [{
        userId: req.user.userId,
        name: req.user.name,
        role: 'admin',
        email: req.user.email,
        joinedAt: new Date(),
        isActive: true
      }],
      sharedBudgets: [],
      invitations: []
    });
    
    await family.save({ session });
    
    // Update user's familyId
    await User.findOneAndUpdate(
      { userId: req.user.userId },
      { familyId },
      { session }
    );
    
    await session.commitTransaction();
    
    res.status(201).json({
      success: true,
      data: { family }
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}));

// GET /api/family/:familyId - Get family details
router.get('/:familyId', requireFamilyMember, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: { family: req.family }
  });
}));

// GET /api/family/:familyId/members - Get family members
router.get('/:familyId/members', requireFamilyMember, asyncHandler(async (req, res) => {
  const activeMembers = req.family.members.filter(m => m.isActive);
  
  res.json({
    success: true,
    data: { members: activeMembers }
  });
}));

// POST /api/family/:familyId/invite - Invite member to family
router.post('/:familyId/invite', requireFamilyAdmin, asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }
  
  // Check if already a member
  const existingMember = req.family.members.find(m => 
    m.email.toLowerCase() === email.toLowerCase() && m.isActive
  );
  
  if (existingMember) {
    return res.status(400).json({
      success: false,
      error: 'User is already a family member'
    });
  }
  
  // Generate invitation token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
  
  const inviteId = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.family.invitations.push({
    inviteId,
    email: email.toLowerCase(),
    role: 'member', // Default role
    token,
    expiresAt,
    status: 'pending',
    sentAt: new Date()
  });
  
  await req.family.save();
  
  // Send invitation email
  await notificationService.sendFamilyInvitation(
    email,
    req.family.name,
    token,
    req.user.name
  );
  
  res.status(201).json({
    success: true,
    data: {
      inviteId,
      message: 'Invitation sent successfully'
    }
  });
}));

// POST /api/family/accept-invite - Accept family invitation
router.post('/accept-invite', asyncHandler(async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Invitation token is required'
    });
  }
  
  // Find family with this invitation token
  const family = await Family.findOne({
    'invitations.token': token,
    'invitations.status': 'pending',
    'invitations.expiresAt': { $gt: new Date() },
    isActive: true
  });
  
  if (!family) {
    return res.status(404).json({
      success: false,
      error: 'Invalid or expired invitation'
    });
  }
  
  const invitation = family.invitations.find(i => i.token === token);
  
  if (invitation.email.toLowerCase() !== req.user.email.toLowerCase()) {
    return res.status(403).json({
      success: false,
      error: 'This invitation was sent to a different email address'
    });
  }
  
  // Check if user already has a family
  if (req.user.familyId && req.user.familyId !== family.familyId) {
    return res.status(400).json({
      success: false,
      error: 'You are already part of another family'
    });
  }
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Add member to family
    family.members.push({
      userId: req.user.userId,
      name: req.user.name,
      role: invitation.role,
      email: req.user.email,
      joinedAt: new Date(),
      isActive: true
    });
    
    // Update invitation status
    invitation.status = 'accepted';
    
    await family.save({ session });
    
    // Update user's familyId
    await User.findOneAndUpdate(
      { userId: req.user.userId },
      { familyId: family.familyId },
      { session }
    );
    
    await session.commitTransaction();
    
    res.json({
      success: true,
      data: {
        family: {
          familyId: family.familyId,
          name: family.name
        },
        message: 'Successfully joined family'
      }
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}));

// DELETE /api/family/:familyId/members/:userId - Remove family member
router.delete('/:familyId/members/:userId', requireFamilyAdmin, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  if (userId === req.family.adminUserId) {
    return res.status(400).json({
      success: false,
      error: 'Cannot remove family admin'
    });
  }
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Remove member from family
    const member = req.family.members.find(m => m.userId === userId);
    
    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }
    
    member.isActive = false;
    await req.family.save({ session });
    
    // Update user's familyId
    await User.findOneAndUpdate(
      { userId },
      { familyId: null },
      { session }
    );
    
    await session.commitTransaction();
    
    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}));

// PATCH /api/family/:familyId/members/:userId/role - Update member role
router.patch('/:familyId/members/:userId/role', requireFamilyAdmin, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  
  if (!['admin', 'parent', 'child'].includes(role)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid role'
    });
  }
  
  const member = req.family.members.find(m => m.userId === userId && m.isActive);
  
  if (!member) {
    return res.status(404).json({
      success: false,
      error: 'Member not found'
    });
  }
  
  member.role = role;
  await req.family.save();
  
  // Update user role
  await User.findOneAndUpdate(
    { userId },
    { role }
  );
  
  res.json({
    success: true,
    data: { member }
  });
}));

// POST /api/family/:familyId/budgets - Add shared budget
router.post('/:familyId/budgets', requireFamilyAdmin, asyncHandler(async (req, res) => {
  const { category, limit, period, alertThreshold } = req.body;
  
  if (!category || !limit || !period) {
    return res.status(400).json({
      success: false,
      error: 'Category, limit, and period are required'
    });
  }
  
  // Check if budget already exists for this category
  const existing = req.family.sharedBudgets.find(b => 
    b.category === category && b.isActive
  );
  
  if (existing) {
    return res.status(400).json({
      success: false,
      error: 'Budget already exists for this category'
    });
  }
  
  const budgetId = `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.family.sharedBudgets.push({
    budgetId,
    category,
    limit,
    period: period || 'monthly',
    spent: 0,
    startDate: new Date(),
    lastReset: new Date(),
    alertThreshold: alertThreshold || 80,
    isActive: true
  });
  
  await req.family.save();
  
  res.status(201).json({
    success: true,
    data: {
      budget: req.family.sharedBudgets[req.family.sharedBudgets.length - 1]
    }
  });
}));

// GET /api/family/:familyId/budgets - Get shared budgets
router.get('/:familyId/budgets', requireFamilyMember, asyncHandler(async (req, res) => {
  const activeBudgets = req.family.sharedBudgets.filter(b => b.isActive);
  
  res.json({
    success: true,
    data: { budgets: activeBudgets }
  });
}));

// PATCH /api/family/:familyId - Update family settings
router.patch('/:familyId', requireFamilyAdmin, asyncHandler(async (req, res) => {
  const { name, settings } = req.body;
  
  if (name) {
    req.family.name = name;
  }
  
  if (settings) {
    req.family.settings = { ...req.family.settings, ...settings };
  }
  
  await req.family.save();
  
  res.json({
    success: true,
    data: { family: req.family }
  });
}));

module.exports = router;
