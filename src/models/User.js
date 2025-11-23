const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// User Schema with authentication and profile information
const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    validate: {
      validator: function(v) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false // Don't include password in queries by default
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  // Role is deprecated but kept for backward compatibility
  role: {
    type: String,
    default: 'standard',
    index: true
  },
  familyId: {
    type: String,
    ref: 'Family',
    index: true,
    default: null
  },
  profileImage: {
    type: String,
    default: ''
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'INR']
  },
  personalBudgets: [{
    category: {
      type: String,
      required: true
    },
    limit: {
      type: Number,
      required: true,
      min: 0
    },
    period: {
      type: String,
      enum: ['weekly', 'monthly'],
      default: 'monthly'
    },
    spent: {
      type: Number,
      default: 0,
      min: 0
    },
    lastReset: {
      type: Date,
      default: Date.now
    }
  }],
  allowance: {
    type: Number,
    default: 0,
    min: 0
  },
  balance: {
    type: Number,
    default: 0
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    notifications: {
      budgetAlerts: { type: Boolean, default: true },
      approvalRequests: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: true }
    },
    defaultView: {
      type: String,
      enum: ['personal', 'family'],
      default: 'personal'
    }
  },
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null,
    index: true
  }
}, {
  timestamps: true
  // versionKey defaults to '__v' for optimistic locking
});

// Compound Indexes for query optimization
userSchema.index({ familyId: 1, role: 1 });
userSchema.index({ familyId: 1, isActive: 1 });
userSchema.index({ email: 1, isActive: 1 });
// Note: deletedAt already has index: true in field definition

// Virtual field for full name display
userSchema.virtual('displayName').get(function() {
  return this.name;
});

// Pre-save hook: Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method: Compare password for authentication
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Instance method: Check if user has permission
userSchema.methods.hasPermission = function(requiredRole) {
  const roleHierarchy = { 'child': 1, 'parent': 2, 'admin': 3 };
  return roleHierarchy[this.role] >= roleHierarchy[requiredRole];
};

// Instance method: Soft delete
userSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  this.isActive = false;
  return this.save();
};

// Static method: Find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true, deletedAt: null });
};

// Static method: Find by family
userSchema.statics.findByFamily = function(familyId) {
  return this.find({ familyId, isActive: true, deletedAt: null });
};

// Post-save hook: Create audit log entry
userSchema.post('save', async function(doc) {
  try {
    const AuditLog = mongoose.model('AuditLog');
    await AuditLog.create({
      auditId: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entityType: 'User',
      entityId: doc.userId,
      action: this.isNew ? 'CREATE' : 'UPDATE',
      userId: doc.userId,
      changes: doc.toObject(),
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Audit log creation failed:', error);
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
