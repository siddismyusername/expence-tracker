const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Authentication Middleware
const authenticateJWT = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token required'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    
    // Find user
    const user = await User.findOne({ 
      userId: decoded.userId,
      isActive: true,
      deletedAt: null
    }).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token'
      });
    }
    
    // Attach user to request
    req.user = user;
    req.userId = user.userId;
    req.familyId = user.familyId;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }
    
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Optional authentication (for routes that work with or without auth)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
      
      const user = await User.findOne({ 
        userId: decoded.userId,
        isActive: true,
        deletedAt: null
      }).select('-password');
      
      if (user) {
        req.user = user;
        req.userId = user.userId;
        req.familyId = user.familyId;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.userId,
      email: user.email,
      role: user.role,
      familyId: user.familyId
    },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    {
      expiresIn: process.env.JWT_EXPIRY || '7d'
    }
  );
};

// Verify token helper
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
  } catch (error) {
    return null;
  }
};

module.exports = {
  authenticateJWT,
  optionalAuth,
  generateToken,
  verifyToken
};
