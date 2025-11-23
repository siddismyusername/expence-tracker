const Family = require('../models/Family');

// Role-Based Access Control Middleware

// Check if user has required role
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  // Simplified: Only check if role is explicitly 'admin' (system admin)
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  
  next();
};

// Deprecated: requireParentOrAdmin - now just checks for authentication
const requireParentOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  next();
};

// Check if user is family admin
const requireFamilyAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const familyId = req.params.familyId || req.body.familyId || req.user.familyId;
    
    if (!familyId) {
      return res.status(400).json({
        success: false,
        error: 'Family ID required'
      });
    }
    
    const family = await Family.findOne({ familyId, isActive: true });
    
    if (!family) {
      return res.status(404).json({
        success: false,
        error: 'Family not found'
      });
    }
    
    if (family.adminUserId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'Family admin access required'
      });
    }
    
    req.family = family;
    next();
  } catch (error) {
    console.error('Family admin check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authorization check failed'
    });
  }
};

// Check if user is family member
const requireFamilyMember = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const familyId = req.params.familyId || req.body.familyId || req.user.familyId;
    
    if (!familyId) {
      return res.status(400).json({
        success: false,
        error: 'Family ID required'
      });
    }
    
    const family = await Family.findOne({ 
      familyId, 
      isActive: true,
      'members.userId': req.user.userId,
      'members.isActive': true
    });
    
    if (!family) {
      return res.status(403).json({
        success: false,
        error: 'Not a member of this family'
      });
    }
    
    req.family = family;
    req.familyMember = family.members.find(m => m.userId === req.user.userId);
    next();
  } catch (error) {
    console.error('Family member check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authorization check failed'
    });
  }
};

// Check if user can modify expense
const canModifyExpense = (expense, user) => {
  // Admin can modify any family expense
  if (user.role === 'admin' && expense.familyId === user.familyId) {
    return true;
  }
  
  // User can modify their own expenses
  if (expense.userId === user.userId || expense.paidBy === user.userId) {
    return true;
  }
  
  return false;
};

// Check if user can approve expenses
const canApproveExpense = async (familyId, user) => {
  if (!familyId) {
    return user.role === 'admin' || user.role === 'parent';
  }
  
  try {
    const family = await Family.findOne({ familyId, isActive: true });
    
    if (!family) {
      return false;
    }
    
    // Family admin can always approve
    if (family.adminUserId === user.userId) {
      return true;
    }
    
    // Parents can approve if they're in the family
    const member = family.members.find(m => m.userId === user.userId && m.isActive);
    return member && (member.role === 'admin' || member.role === 'parent');
  } catch (error) {
    console.error('Approval check error:', error);
    return false;
  }
};

// Middleware to check expense modification permission
const requireExpenseOwner = (req, res, next) => {
  const expense = req.expense; // Assume expense is loaded in previous middleware
  
  if (!expense) {
    return res.status(404).json({
      success: false,
      error: 'Expense not found'
    });
  }
  
  if (!canModifyExpense(expense, req.user)) {
    return res.status(403).json({
      success: false,
      error: 'You do not have permission to modify this expense'
    });
  }
  
  next();
};

module.exports = {
  requireRole,
  requireAdmin,
  requireParentOrAdmin,
  requireFamilyAdmin,
  requireFamilyMember,
  canModifyExpense,
  canApproveExpense,
  requireExpenseOwner
};
